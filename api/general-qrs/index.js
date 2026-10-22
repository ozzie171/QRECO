import { nanoid } from 'nanoid';
import { readGeneralQrLibrary, writeGeneralQrLibrary } from '../_lib/generalQrs.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const list = await readGeneralQrLibrary();
    return res.status(200).json(list);
  }

  if (req.method === 'POST') {
    const { name, url, logoUrl } = req.body || {};
    if (!name || !url) return res.status(400).json({ error: 'İsim ve bağlantı zorunludur.' });

    const list = await readGeneralQrLibrary();
    const entry = { id: nanoid(10), name, url, logoUrl: logoUrl || '', createdAt: new Date().toISOString() };
    list.push(entry);
    try {
      await writeGeneralQrLibrary(list);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
    return res.status(201).json(entry);
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method Not Allowed' });
}
