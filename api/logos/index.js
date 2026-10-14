import { getSupabase, UPLOAD_BUCKET } from '../_lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const supabase = getSupabase();
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
