import { getSupabase, readGeneralQrLibrary, writeGeneralQrLibrary, newId, json, handleErrors } from '../../../server/lib.js';

export const onRequestGet = handleErrors(async ({ env }) => {
  return json(await readGeneralQrLibrary(getSupabase(env)));
});

export const onRequestPost = handleErrors(async ({ request, env }) => {
  const { name, url, logoUrl } = await request.json().catch(() => ({}));
  if (!name || !url) return json({ error: 'İsim ve bağlantı zorunludur.' }, 400);

  const supabase = getSupabase(env);
  const list = await readGeneralQrLibrary(supabase);
  const entry = { id: newId(), name, url, logoUrl: logoUrl || '', createdAt: new Date().toISOString() };
  list.push(entry);
  await writeGeneralQrLibrary(supabase, list);
  return json(entry, 201);
});
