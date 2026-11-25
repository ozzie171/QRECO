import {
  getSupabase,
  rowToEmployee,
  employeeUpdateToRow,
  detectLang,
  json,
  noContent,
  handleErrors,
  UPLOAD_BUCKET,
  qrPngPath,
} from '../../../server/lib.js';

// Public: loaded by the profile page when someone scans an employee's QR,
// so it also counts the scan.
export const onRequestGet = handleErrors(async ({ request, env, params }) => {
  const supabase = getSupabase(env);
  const { data, error } = await supabase.from('employees').select('*').eq('id', params.id).maybeSingle();
  if (error) return json({ error: error.message }, 500);
  if (!data) return json({ error: 'Kullanıcı bulunamadı.' }, 404);

  const newScanCount = (data.scan_count ?? 0) + 1;
  const { data: updated } = await supabase
    .from('employees')
    .update({ scan_count: newScanCount })
    .eq('id', params.id)
    .select()
    .maybeSingle();

  const employee = rowToEmployee(updated ?? { ...data, scan_count: newScanCount }, supabase);
  return json({ ...employee, detectedLang: detectLang(request) });
});

export const onRequestPut = handleErrors(async ({ request, env, params }) => {
  const supabase = getSupabase(env);
  const { data: existing, error: fetchError } = await supabase
    .from('employees')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();
  if (fetchError) return json({ error: fetchError.message }, 500);
  if (!existing) return json({ error: 'Kullanıcı bulunamadı.' }, 404);

  const body = await request.json().catch(() => ({}));
  const row = employeeUpdateToRow(body, existing);
  const { data, error } = await supabase
    .from('employees')
    .update({ ...row, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single();
  if (error) return json({ error: error.message }, 500);
  return json(rowToEmployee(data, supabase));
});

export const onRequestDelete = handleErrors(async ({ env, params }) => {
  const supabase = getSupabase(env);
  const { error, count } = await supabase.from('employees').delete({ count: 'exact' }).eq('id', params.id);
  if (error) return json({ error: error.message }, 500);
  if (!count) return json({ error: 'Kullanıcı bulunamadı.' }, 404);
  // Best effort: the stored signature QR is no longer needed.
  await supabase.storage.from(UPLOAD_BUCKET).remove([qrPngPath(params.id)]);
  return noContent();
});
