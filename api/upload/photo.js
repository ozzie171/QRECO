import multer from 'multer';
import { nanoid } from 'nanoid';
import { getSupabase, UPLOAD_BUCKET } from '../_lib/supabase.js';
import { runMiddleware } from '../_lib/runMiddleware.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(png|jpe?g|webp|gif)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Sadece PNG, JPG, WEBP veya GIF resim dosyaları desteklenir.'));
  },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    await runMiddleware(req, res, upload.single('photo'));
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
  if (!req.file) return res.status(400).json({ error: 'Dosya bulunamadı.' });

  const supabase = getSupabase();
  const ext = req.file.originalname.includes('.') ? req.file.originalname.split('.').pop() : 'jpg';
  const path = `photos/${nanoid(10)}.${ext}`;

  const { error } = await supabase.storage.from(UPLOAD_BUCKET).upload(path, req.file.buffer, {
    contentType: req.file.mimetype,
    upsert: false,
  });
  if (error) return res.status(500).json({ error: error.message });

  const { data } = supabase.storage.from(UPLOAD_BUCKET).getPublicUrl(path);
  return res.status(200).json({ url: data.publicUrl });
}
