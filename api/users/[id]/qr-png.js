import { getSupabase, rowToEmployee } from '../../_lib/supabase.js';
import { buildQrPngBuffer } from '../../_lib/qrPng.js';

/** Public, unauthenticated PNG render of an employee's QR — used by the
 * email signature feature, where the image has to be a real hosted URL an
 * email client can fetch, not a client-rendered canvas/SVG. */
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
  const profileUrl = `https://${req.headers.host}/profile/${employee.id}`;
  const png = await buildQrPngBuffer(profileUrl, employee.qr.logoUrl || undefined, 480);

  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.statusCode = 200;
  res.end(png);
}
