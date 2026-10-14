import { getSupabase, rowToEmployee } from '../../_lib/supabase.js';

function escapeVCardValue(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function buildVCard(employee) {
  const fullName = [employee.firstName, employee.lastName].filter(Boolean).join(' ') || 'İsimsiz Çalışan';
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${escapeVCardValue(employee.lastName)};${escapeVCardValue(employee.firstName)};;;`,
    `FN:${escapeVCardValue(fullName)}`,
  ];
  if (employee.position) lines.push(`TITLE:${escapeVCardValue(employee.position)}`);
  if (employee.phone) lines.push(`TEL;TYPE=CELL:${escapeVCardValue(employee.phone)}`);
  if (employee.email) lines.push(`EMAIL:${escapeVCardValue(employee.email)}`);
  if (employee.website) {
    const url = /^https?:\/\//i.test(employee.website) ? employee.website : `https://${employee.website}`;
    lines.push(`URL:${escapeVCardValue(url)}`);
  }
  if (employee.address) lines.push(`ADR;TYPE=WORK:;;${escapeVCardValue(employee.address)};;;;`);
  lines.push('END:VCARD');
  return lines.join('\r\n');
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const supabase = getSupabase();
  const { id } = req.query;

  const { data, error } = await supabase.from('employees').select('*').eq('id', id).maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });

  const employee = rowToEmployee(data);
  const vcard = buildVCard(employee);
  const fileName = [employee.firstName, employee.lastName].filter(Boolean).join('-') || 'kisi';

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/vcard; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}.vcf"`);
  res.end(vcard);
}
