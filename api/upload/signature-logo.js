import multer from 'multer';
import path from 'path';
import sharp from 'sharp';
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
const SIGNATURE_LOGO_DIR = 'signature';
const SIGNATURE_LOGO_NAME = 'extra-logo.svg';
const SIGNATURE_LOGO_PATH = `${SIGNATURE_LOGO_DIR}/${SIGNATURE_LOGO_NAME}`;
// Outlook's Word rendering engine doesn't display SVG <img> sources at all,
// so the actual email HTML references this rasterized PNG derivative
// instead — the SVG is still what's stored/uploaded (crisp for any other
// use), but `url` below always points at the PNG.
const SIGNATURE_LOGO_PNG_NAME = 'extra-logo.png';
const SIGNATURE_LOGO_PNG_PATH = `${SIGNATURE_LOGO_DIR}/${SIGNATURE_LOGO_PNG_NAME}`;

// Because the path never changes (upsert overwrites the same object),
// browsers and Supabase's own CDN cache would otherwise keep serving the
// previous file after a re-upload. Supabase hands back a fresh `version`
// UUID on every write, so appending it as a cache-busting query string
// makes each new upload's URL genuinely different from the last one's.
function buildVersionedUrl(supabase, path, file) {
  const { data } = supabase.storage.from(UPLOAD_BUCKET).getPublicUrl(path);
  return `${data.publicUrl}?v=${file.version}`;
}

async function rasterizeAndStore(supabase, svgBuffer) {
  const pngBuffer = await sharp(svgBuffer, { density: 600 }).resize({ height: 500 }).png().toBuffer();
  const { error } = await supabase.storage.from(UPLOAD_BUCKET).upload(SIGNATURE_LOGO_PNG_PATH, pngBuffer, {
    contentType: 'image/png',
    upsert: true,
  });
  if (error) throw new Error(error.message);
}

export default async function handler(req, res) {
  const supabase = getSupabase();

  if (req.method === 'GET') {
    const { data: files, error } = await supabase.storage.from(UPLOAD_BUCKET).list(SIGNATURE_LOGO_DIR);
    if (error) return res.status(500).json({ error: error.message });
    let pngFile = (files || []).find((f) => f.name === SIGNATURE_LOGO_PNG_NAME);

    // Self-heals logos uploaded before the PNG derivative existed: if only
    // the original SVG is on record, rasterize it now instead of silently
    // dropping the logo until someone happens to re-upload it.
    if (!pngFile) {
      const svgFile = (files || []).find((f) => f.name === SIGNATURE_LOGO_NAME);
      if (!svgFile) return res.status(200).json({ url: null });
      const { data: svgBlob, error: downloadError } = await supabase.storage
        .from(UPLOAD_BUCKET)
        .download(SIGNATURE_LOGO_PATH);
      if (downloadError) return res.status(500).json({ error: downloadError.message });
      try {
        await rasterizeAndStore(supabase, Buffer.from(await svgBlob.arrayBuffer()));
      } catch (err) {
        return res.status(500).json({ error: err.message });
      }
      const { data: refreshedFiles, error: refreshError } = await supabase.storage
        .from(UPLOAD_BUCKET)
        .list(SIGNATURE_LOGO_DIR);
      if (refreshError) return res.status(500).json({ error: refreshError.message });
      pngFile = (refreshedFiles || []).find((f) => f.name === SIGNATURE_LOGO_PNG_NAME);
      if (!pngFile) return res.status(200).json({ url: null });
    }

    return res.status(200).json({ url: buildVersionedUrl(supabase, SIGNATURE_LOGO_PNG_PATH, pngFile) });
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase.storage.from(UPLOAD_BUCKET).remove([SIGNATURE_LOGO_PATH, SIGNATURE_LOGO_PNG_PATH]);
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

  try {
    await rasterizeAndStore(supabase, req.file.buffer);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  const { data: files, error: listError } = await supabase.storage.from(UPLOAD_BUCKET).list(SIGNATURE_LOGO_DIR);
  if (listError) return res.status(500).json({ error: listError.message });
  const pngFile = (files || []).find((f) => f.name === SIGNATURE_LOGO_PNG_NAME);
  if (!pngFile) return res.status(500).json({ error: 'Yüklenen dosya bulunamadı.' });

  return res.status(200).json({ url: buildVersionedUrl(supabase, SIGNATURE_LOGO_PNG_PATH, pngFile) });
}
