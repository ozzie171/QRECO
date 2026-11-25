import { getSupabase, readGeneralQrLibrary, writeGeneralQrLibrary, json, noContent, handleErrors } from '../../../server/lib.js';

export const onRequestDelete = handleErrors(async ({ env, params }) => {
  const supabase = getSupabase(env);
  const list = await readGeneralQrLibrary(supabase);
  const next = list.filter((item) => item.id !== params.id);
  if (next.length === list.length) return json({ error: 'Bulunamadı.' }, 404);
  await writeGeneralQrLibrary(supabase, next);
  return noContent();
});
