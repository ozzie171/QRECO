import { getSupabase, rowToEmployee, employeeInputToRow, newId, json, handleErrors } from '../../../server/lib.js';

export const onRequestGet = handleErrors(async ({ env }) => {
  const supabase = getSupabase(env);
  const { data, error } = await supabase.from('employees').select('*').order('created_at', { ascending: true });
  if (error) return json({ error: error.message }, 500);
  return json(data.map((row) => rowToEmployee(row, supabase)));
});

export const onRequestPost = handleErrors(async ({ request, env }) => {
  const supabase = getSupabase(env);
  const body = await request.json().catch(() => ({}));
  const row = { id: newId(), ...employeeInputToRow(body) };
  const { data, error } = await supabase.from('employees').insert(row).select().single();
  if (error) return json({ error: error.message }, 500);
  return json(rowToEmployee(data, supabase), 201);
});
