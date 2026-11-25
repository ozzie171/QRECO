import { getSupabase, UPLOAD_BUCKET, publicUrl, json, noContent, handleErrors } from '../../../server/lib.js';

export const onRequestGet = handleErrors(async ({ env }) => {
  const supabase = getSupabase(env);
  const { data, error } = await supabase.storage.from(UPLOAD_BUCKET).list('logos', {
    sortBy: { column: 'created_at', order: 'desc' },
  });
  if (error) return json({ error: error.message }, 500);

  const logos = (data || [])
    .filter((file) => file.name && !file.name.startsWith('.'))
    .map((file) => ({ name: file.name, url: publicUrl(supabase, `logos/${file.name}`) }));
  return json(logos);
});

export const onRequestDelete = handleErrors(async ({ request, env }) => {
  const name = new URL(request.url).searchParams.get('name');
  if (!name || name.includes('/') || name.includes('..')) {
    return json({ error: 'Geçersiz logo adı.' }, 400);
  }
  const supabase = getSupabase(env);
  const { error } = await supabase.storage.from(UPLOAD_BUCKET).remove([`logos/${name}`]);
  if (error) return json({ error: error.message }, 500);
  return noContent();
});
