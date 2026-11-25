import { getSupabase, UPLOAD_BUCKET, publicUrl, newId, json, handleErrors } from '../../../server/lib.js';
import { readFormFile, isSvg } from '../../../server/upload.js';

export const onRequestPost = handleErrors(async ({ request, env }) => {
  const { file, error: formError } = await readFormFile(request, 'logo', {
    maxBytes: 2 * 1024 * 1024,
    accept: (f) => (isSvg(f) ? null : 'Logo sadece SVG formatında olmalıdır.'),
  });
  if (formError) return json({ error: formError }, 400);

  const supabase = getSupabase(env);
  const filePath = `logos/${newId()}.svg`;
  const { error } = await supabase.storage.from(UPLOAD_BUCKET).upload(filePath, await file.arrayBuffer(), {
    contentType: 'image/svg+xml',
    upsert: false,
  });
  if (error) return json({ error: error.message }, 500);
  return json({ url: publicUrl(supabase, filePath) });
});
