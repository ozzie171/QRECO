import { getSupabase, rowToEmployee, employeeUpdateToRow } from '../_lib/supabase.js';

export default async function handler(req, res) {
  const supabase = getSupabase();
  const { id } = req.query;

  if (req.method === 'GET') {
    const { data, error } = await supabase.from('employees').select('*').eq('id', id).maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    return res.status(200).json(rowToEmployee(data));
  }

  if (req.method === 'PUT') {
    const { data: existing, error: fetchError } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (fetchError) return res.status(500).json({ error: fetchError.message });
    if (!existing) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });

    const row = employeeUpdateToRow(req.body, existing);
    const { data, error } = await supabase
      .from('employees')
      .update({ ...row, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(rowToEmployee(data));
  }

  if (req.method === 'DELETE') {
    const { error, count } = await supabase.from('employees').delete({ count: 'exact' }).eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    if (!count) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    return res.status(204).end();
  }

  res.setHeader('Allow', 'GET, PUT, DELETE');
  return res.status(405).json({ error: 'Method Not Allowed' });
}
