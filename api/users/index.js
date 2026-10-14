import { nanoid } from 'nanoid';
import { getSupabase, rowToEmployee, employeeInputToRow } from '../_lib/supabase.js';

export default async function handler(req, res) {
  const supabase = getSupabase();

  if (req.method === 'GET') {
    const { data, error } = await supabase.from('employees').select('*').order('created_at', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data.map(rowToEmployee));
  }

  if (req.method === 'POST') {
    const row = { id: nanoid(10), ...employeeInputToRow(req.body) };
    const { data, error } = await supabase.from('employees').insert(row).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(rowToEmployee(data));
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method Not Allowed' });
}
