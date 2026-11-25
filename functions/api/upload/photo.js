import { getSupabase, UPLOAD_BUCKET, publicUrl, newId, json, handleErrors } from '../../../server/lib.js';
import { readFormFile, extensionOf } from '../../../server/upload.js';

export const onRequestPost = handleErrors(async ({ request, env }) => {
  const { file, error: formError } = await readFormFile(request, 'photo', {
    maxBytes: 5 * 1024 * 1024,
    accept: (f) =>
      /^image\/(png|jpe?g|webp|gif)$/.test(f.type) ? null : 'Sadece PNG, JPG, WEBP veya GIF resim dosyaları desteklenir.',
  });
  if (formError) return json({ error: formError }, 400);

  const supabase = getSupabase(env);
  const path = `photos/${newId()}.${extensionOf(file.name, 'jpg')}`;
  const { error } = await supabase.storage.from(UPLOAD_BUCKET).upload(path, await file.arrayBuffer(), {
    contentType: file.type,
    upsert: false,
  });
  if (error) return json({ error: error.message }, 500);
  return json({ url: publicUrl(supabase, path) });
});
