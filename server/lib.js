// Shared helpers for the Cloudflare Pages Functions in /functions.
// Kept outside /functions on purpose: every file inside that folder becomes
// a route, while files here are only bundled in when imported.
import { createClient } from '@supabase/supabase-js';

export const UPLOAD_BUCKET = 'uploads';

export function getSupabase(env) {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY ortam değişkenleri tanımlı değil.');
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  });
}

export function noContent() {
  return new Response(null, { status: 204 });
}

export function methodNotAllowed(allow) {
  return json({ error: 'Method Not Allowed' }, 405, { Allow: allow });
}

/** Turns an unexpected exception into a JSON 500 instead of an HTML error page. */
export function handleErrors(handler) {
  return async (context) => {
    try {
      return await handler(context);
    } catch (err) {
      return json({ error: err instanceof Error ? err.message : String(err) }, 500);
    }
  };
}

const ID_ALPHABET = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict';

/** 10-char URL-safe random id, same format the app has always used (nanoid). */
export function newId(size = 10) {
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  let id = '';
  for (let i = 0; i < size; i++) id += ID_ALPHABET[bytes[i] & 63];
  return id;
}

/** Storage path of an employee's pre-rendered email-signature QR. */
export function qrPngPath(id) {
  return `qr/${id}.png`;
}

export function publicUrl(supabase, path) {
  return supabase.storage.from(UPLOAD_BUCKET).getPublicUrl(path).data.publicUrl;
}

const defaultQr = {
  fgColor: '#000000',
  bgColor: '#ffffff',
  logoUrl: '',
  logoSize: 40,
  bordered: true,
  shape: 'square',
  generalQrId: '',
  generalQrUrl: '',
};

const defaultSocial = {
  linkedin: '',
  instagram: '',
  twitter: '',
  facebook: '',
  youtube: '',
};

export function rowToEmployee(row, supabase) {
  const qr = { ...defaultQr, ...row.qr };
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    position: row.position,
    phone: row.phone,
    website: row.website,
    photoUrl: row.photo_url,
    address: row.address,
    enPosition: row.en_position || '',
    enAddress: row.en_address || '',
    social: { ...defaultSocial, ...row.social },
    bgColorStart: row.bg_color_start,
    bgColorEnd: row.bg_color_end,
    textColor: row.text_color,
    qr,
    scanCount: row.scan_count ?? 0,
    // Only set once a PNG has actually been uploaded; the version query
    // string makes a re-rendered QR a genuinely new URL for caches.
    qrPngUrl: qr.pngVersion && supabase ? `${publicUrl(supabase, qrPngPath(row.id))}?v=${qr.pngVersion}` : '',
    detectedLang: 'tr',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function employeeInputToRow(body = {}) {
  return {
    first_name: body.firstName || '',
    last_name: body.lastName || '',
    email: body.email || '',
    position: body.position || '',
    phone: body.phone || '',
    website: body.website || '',
    photo_url: body.photoUrl || '',
    address: body.address || '',
    en_position: body.enPosition || '',
    en_address: body.enAddress || '',
    social: { ...defaultSocial, ...(body.social || {}) },
    bg_color_start: body.bgColorStart || '#f5f5f5',
    bg_color_end: body.bgColorEnd || '#e0e0e0',
    text_color: body.textColor || '#1f1f1f',
    // A new employee has no stored QR PNG yet (e.g. a duplicate carries the
    // original's pngVersion), so never inherit one from the input.
    qr: { ...defaultQr, ...(body.qr || {}), pngVersion: undefined },
  };
}

export function employeeUpdateToRow(body = {}, existingRow) {
  const row = { ...existingRow };
  if (body.firstName !== undefined) row.first_name = body.firstName;
  if (body.lastName !== undefined) row.last_name = body.lastName;
  if (body.email !== undefined) row.email = body.email;
  if (body.position !== undefined) row.position = body.position;
  if (body.phone !== undefined) row.phone = body.phone;
  if (body.website !== undefined) row.website = body.website;
  if (body.photoUrl !== undefined) row.photo_url = body.photoUrl;
  if (body.address !== undefined) row.address = body.address;
  if (body.enPosition !== undefined) row.en_position = body.enPosition;
  if (body.enAddress !== undefined) row.en_address = body.enAddress;
  if (body.social !== undefined) row.social = { ...defaultSocial, ...existingRow.social, ...body.social };
  if (body.bgColorStart !== undefined) row.bg_color_start = body.bgColorStart;
  if (body.bgColorEnd !== undefined) row.bg_color_end = body.bgColorEnd;
  if (body.textColor !== undefined) row.text_color = body.textColor;
  if (body.qr !== undefined) row.qr = { ...defaultQr, ...existingRow.qr, ...body.qr };
  delete row.id;
  delete row.created_at;
  return row;
}

/** Only a hint for which language to show first: Turkey (and requests
 * Cloudflare can't geolocate, e.g. local dev) default to Turkish; everywhere
 * else defaults to English. The visitor can still switch on the page. */
export function detectLang(request) {
  const country = request.cf?.country || request.headers.get('cf-ipcountry');
  if (!country || country === 'TR' || country === 'XX') return 'tr';
  return 'en';
}

/** An explicit ?lang= query param wins, otherwise the IP-based guess. */
export function resolveRequestedLang(request) {
  const requested = new URL(request.url).searchParams.get('lang');
  if (requested === 'tr' || requested === 'en') return requested;
  return detectLang(request);
}

export function pickLocalizedFields(employee, lang) {
  if (lang !== 'en') return employee;
  return {
    ...employee,
    position: employee.enPosition || employee.position,
    address: employee.enAddress || employee.address,
  };
}

// ---- "Genel QR" library: a small JSON file in storage -------------------

const LIBRARY_PATH = 'general-qrs/library.json';

export async function readGeneralQrLibrary(supabase) {
  const { data, error } = await supabase.storage.from(UPLOAD_BUCKET).download(LIBRARY_PATH);
  if (error) return [];
  try {
    const parsed = JSON.parse(await data.text());
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function writeGeneralQrLibrary(supabase, list) {
  const { error } = await supabase.storage
    .from(UPLOAD_BUCKET)
    .upload(LIBRARY_PATH, new Blob([JSON.stringify(list)], { type: 'application/json' }), {
      contentType: 'application/json',
      upsert: true,
    });
  if (error) throw new Error(error.message);
}
