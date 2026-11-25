import {
  getSupabase,
  rowToEmployee,
  json,
  handleErrors,
  UPLOAD_BUCKET,
  qrPngPath,
  publicUrl,
} from '../../../../server/lib.js';

// GET (public): email signatures created before the QR moved to storage
// still point here. Instead of rendering a PNG on every email open, this
// just redirects to the stored file — no database call, almost no CPU.
export const onRequestGet = handleErrors(async ({ env, params }) => {
  const supabase = getSupabase(env);
  return new Response(null, {
    status: 302,
    headers: {
      Location: publicUrl(supabase, qrPngPath(params.id)),
      'Cache-Control': 'public, max-age=86400',
    },
  });
});

// PUT (admin): stores the PNG the admin panel rendered in the browser and
// bumps qr.pngVersion so the employee's qrPngUrl changes (cache-busting).
export const onRequestPut = handleErrors(async ({ request, env, params }) => {
  const supabase = getSupabase(env);
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.startsWith('image/png')) return json({ error: 'PNG bekleniyor.' }, 400);

  const png = await request.arrayBuffer();
  if (png.byteLength === 0 || png.byteLength > 2 * 1024 * 1024) {
    return json({ error: 'Geçersiz PNG boyutu.' }, 400);
  }

  const { data: existing, error: fetchError } = await supabase
    .from('employees')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();
  if (fetchError) return json({ error: fetchError.message }, 500);
  if (!existing) return json({ error: 'Kullanıcı bulunamadı.' }, 404);

  const { error: uploadError } = await supabase.storage.from(UPLOAD_BUCKET).upload(qrPngPath(params.id), png, {
    contentType: 'image/png',
    cacheControl: '86400',
    upsert: true,
  });
  if (uploadError) return json({ error: uploadError.message }, 500);

  // Deliberately leaves updated_at alone: this is a derived image, not an edit.
  const { data, error } = await supabase
    .from('employees')
    .update({ qr: { ...existing.qr, pngVersion: Date.now() } })
    .eq('id', params.id)
    .select()
    .single();
  if (error) return json({ error: error.message }, 500);
  return json(rowToEmployee(data, supabase));
});
