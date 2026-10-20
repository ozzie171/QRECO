import multer from 'multer';
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

// A single, site-wide "extra logo" shown on the right side of every
// employee's email signature (not per-employee) — always stored at this
// same path so there's exactly one current file, no extra DB state needed.
const SIGNATURE_LOGO_PATH = 'signature/extra-logo.svg';

export default async function handler(req, res) {
  const supabase = getSupabase();

  if (req.method === 'GET') {
    const { data: files, error } = await supabase.storage.from(UPLOAD_BUCKET).list('signature');
    if (error) return res.status(500).json({ error: error.message });
    const exists = (files || []).some((file) => file.name === 'extra-logo.svg');
    if (!exists) return res.status(200).json({ url: null });
    const { data } = supabase.storage.from(UPLOAD_BUCKET).getPublicUrl(SIGNATURE_LOGO_PATH);
    return res.status(200).json({ url: data.publicUrl });
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase.storage.from(UPLOAD_BUCKET).remove([SIGNATURE_LOGO_PATH]);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    await runMiddleware(req, res, upload.single('logo'));
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
  if (!req.file) return res.status(400).json({ error: 'Dosya bulunamadı.' });

  const { error } = await supabase.storage.from(UPLOAD_BUCKET).upload(SIGNATURE_LOGO_PATH, req.file.buffer, {
    contentType: 'image/svg+xml',
    upsert: true,
  });
  if (error) return res.status(500).json({ error: error.message });

  const { data } = supabase.storage.from(UPLOAD_BUCKET).getPublicUrl(SIGNATURE_LOGO_PATH);
  return res.status(200).json({ url: data.publicUrl });
}
