import { getSupabase, rowToEmployee, resolveRequestedLang, pickLocalizedFields, json, handleErrors } from '../../../../server/lib.js';

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

export const onRequestGet = handleErrors(async ({ request, env, params }) => {
  const supabase = getSupabase(env);
  const { data, error } = await supabase.from('employees').select('*').eq('id', params.id).maybeSingle();
  if (error) return json({ error: error.message }, 500);
  if (!data) return json({ error: 'Kullanıcı bulunamadı.' }, 404);

  const employee = pickLocalizedFields(rowToEmployee(data, supabase), resolveRequestedLang(request));
  const vcard = buildVCard(employee);
  const fileName = [employee.firstName, employee.lastName].filter(Boolean).join('-') || 'kisi';

  return new Response(vcard, {
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}.vcf"; filename*=UTF-8''${encodeURIComponent(fileName)}.vcf`,
    },
  });
});
