import { getSupabase, UPLOAD_BUCKET, publicUrl, json, noContent, handleErrors } from '../../../server/lib.js';
import { readFormFile, isSvg } from '../../../server/upload.js';

// A single, site-wide "extra logo" shown beside every email signature,
// always stored at the same paths. The SVG is the original; the PNG is what
// signatures actually reference (Outlook can't show SVG). The PNG is now
// rasterized in the admin's browser and uploaded alongside the SVG.
const SIGNATURE_LOGO_DIR = 'signature';
const SIGNATURE_LOGO_PATH = `${SIGNATURE_LOGO_DIR}/extra-logo.svg`;
const SIGNATURE_LOGO_PNG_NAME = 'extra-logo.png';
const SIGNATURE_LOGO_PNG_PATH = `${SIGNATURE_LOGO_DIR}/${SIGNATURE_LOGO_PNG_NAME}`;

// The path never changes (upsert), so the storage `version` UUID is appended
// as a cache-busting query string to make each upload's URL unique.
async function currentPngUrl(supabase) {
  const { data: files, error } = await supabase.storage.from(UPLOAD_BUCKET).list(SIGNATURE_LOGO_DIR);
  if (error) throw new Error(error.message);
  const pngFile = (files || []).find((f) => f.name === SIGNATURE_LOGO_PNG_NAME);
  if (!pngFile) return null;
  return `${publicUrl(supabase, SIGNATURE_LOGO_PNG_PATH)}?v=${pngFile.version || pngFile.updated_at || ''}`;
}

export const onRequestGet = handleErrors(async ({ env }) => {
  return json({ url: await currentPngUrl(getSupabase(env)) });
});

export const onRequestDelete = handleErrors(async ({ env }) => {
  const supabase = getSupabase(env);
  const { error } = await supabase.storage.from(UPLOAD_BUCKET).remove([SIGNATURE_LOGO_PATH, SIGNATURE_LOGO_PNG_PATH]);
  if (error) return json({ error: error.message }, 500);
  return noContent();
});

export const onRequestPost = handleErrors(async ({ request, env }) => {
  const { file, form, error: formError } = await readFormFile(request, 'logo', {
    maxBytes: 2 * 1024 * 1024,
    accept: (f) => (isSvg(f) ? null : 'Logo sadece SVG formatında olmalıdır.'),
  });
  if (formError) return json({ error: formError }, 400);

  const png = form.get('png');
  if (!png || typeof png === 'string' || png.type !== 'image/png') {
    return json({ error: 'Logonun PNG sürümü oluşturulamadı.' }, 400);
  }

  const supabase = getSupabase(env);
  const upload = (path, body, contentType) =>
    supabase.storage.from(UPLOAD_BUCKET).upload(path, body, { contentType, upsert: true });

  const { error: svgError } = await upload(SIGNATURE_LOGO_PATH, await file.arrayBuffer(), 'image/svg+xml');
  if (svgError) return json({ error: svgError.message }, 500);
  const { error: pngError } = await upload(SIGNATURE_LOGO_PNG_PATH, await png.arrayBuffer(), 'image/png');
  if (pngError) return json({ error: pngError.message }, 500);

  const url = await currentPngUrl(supabase);
  if (!url) return json({ error: 'Yüklenen dosya bulunamadı.' }, 500);
  return json({ url });
});
