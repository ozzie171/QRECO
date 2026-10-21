import { getSupabase, UPLOAD_BUCKET } from './supabase.js';

// A small shared "library" of named, reusable QR targets (name + URL), kept
// as a single JSON file in storage rather than a new Postgres table — this
// is admin-only, low-traffic, single-editor data, so a read-modify-write
// JSON blob is simpler than a migration and avoids asking the user to run
// SQL for it.
const LIBRARY_PATH = 'general-qrs/library.json';

export async function readGeneralQrLibrary() {
  const supabase = getSupabase();
  const { data, error } = await supabase.storage.from(UPLOAD_BUCKET).download(LIBRARY_PATH);
  if (error) return [];
  try {
    const text = await data.text();
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function writeGeneralQrLibrary(list) {
  const supabase = getSupabase();
  const { error } = await supabase.storage
    .from(UPLOAD_BUCKET)
    .upload(LIBRARY_PATH, Buffer.from(JSON.stringify(list), 'utf-8'), {
      contentType: 'application/json',
      upsert: true,
    });
  if (error) throw new Error(error.message);
}
