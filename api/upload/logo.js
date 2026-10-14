import multer from 'multer';
import { nanoid } from 'nanoid';
import path from 'path';
import { getSupabase, UPLOAD_BUCKET } from '../_lib/supabase.js';
import { runMiddleware } from '../_lib/runMiddleware.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const isSvg = file.mimetype === 'image/svg+xml' || path.extname(file.originalname).toLowerCase() === '.svg';
    if (isSvg) cb(null, true);
    else cb(new Error('Logo sadece SVG formatında olmalıdır.'));
  },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    await runMiddleware(req, res, upload.single('logo'));
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
  if (!req.file) return res.status(400).json({ error: 'Dosya bulunamadı.' });

  const supabase = getSupabase();
  const filePath = `logos/${nanoid(10)}.svg`;

  const { error } = await supabase.storage.from(UPLOAD_BUCKET).upload(filePath, req.file.buffer, {
    contentType: 'image/svg+xml',
    upsert: false,
  });
  if (error) return res.status(500).json({ error: error.message });

  const { data } = supabase.storage.from(UPLOAD_BUCKET).getPublicUrl(filePath);
  return res.status(200).json({ url: data.publicUrl });
}
