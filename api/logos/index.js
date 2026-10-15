import { getSupabase, UPLOAD_BUCKET } from '../_lib/supabase.js';

export default async function handler(req, res) {
  const supabase = getSupabase();

  if (req.method === 'GET') {
    const { data, error } = await supabase.storage.from(UPLOAD_BUCKET).list('logos', {
      sortBy: { column: 'created_at', order: 'desc' },
    });
    if (error) return res.status(500).json({ error: error.message });

    const logos = (data || [])
      .filter((file) => file.name && !file.name.startsWith('.'))
      .map((file) => {
        const path = `logos/${file.name}`;
        const { data: publicUrlData } = supabase.storage.from(UPLOAD_BUCKET).getPublicUrl(path);
        return { name: file.name, url: publicUrlData.publicUrl };
      });

    return res.status(200).json(logos);
  }

  if (req.method === 'DELETE') {
    const name = req.query?.name;
    if (!name || typeof name !== 'string' || name.includes('/') || name.includes('..')) {
      return res.status(400).json({ error: 'Geçersiz logo adı.' });
    }

    const { error } = await supabase.storage.from(UPLOAD_BUCKET).remove([`logos/${name}`]);
    if (error) return res.status(500).json({ error: error.message });

    return res.status(204).end();
  }

  res.setHeader('Allow', 'GET, DELETE');
  return res.status(405).json({ error: 'Method Not Allowed' });
}
