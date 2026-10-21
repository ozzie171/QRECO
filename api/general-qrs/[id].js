import { readGeneralQrLibrary, writeGeneralQrLibrary } from '../_lib/generalQrs.js';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', 'DELETE');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { id } = req.query;
  const list = await readGeneralQrLibrary();
  const next = list.filter((item) => item.id !== id);
  if (next.length === list.length) return res.status(404).json({ error: 'Bulunamadı.' });

  try {
    await writeGeneralQrLibrary(next);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
  return res.status(204).end();
}
