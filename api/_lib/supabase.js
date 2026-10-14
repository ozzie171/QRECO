import { createClient } from '@supabase/supabase-js';

let client;

export function getSupabase() {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY ortam değişkenleri tanımlı değil.');
    }
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client;
}

export const UPLOAD_BUCKET = 'uploads';

const defaultQr = {
  fgColor: '#000000',
  bgColor: '#ffffff',
  logoUrl: '',
  logoSize: 40,
  bordered: true,
  shape: 'square',
};

const defaultSocial = {
  linkedin: '',
  instagram: '',
  twitter: '',
  facebook: '',
};

export function rowToEmployee(row) {
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
    social: { ...defaultSocial, ...row.social },
    bgColorStart: row.bg_color_start,
    bgColorEnd: row.bg_color_end,
    textColor: row.text_color,
    qr: { ...defaultQr, ...row.qr },
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
    social: { ...defaultSocial, ...(body.social || {}) },
    bg_color_start: body.bgColorStart || '#f5f5f5',
    bg_color_end: body.bgColorEnd || '#e0e0e0',
    text_color: body.textColor || '#1f1f1f',
    qr: { ...defaultQr, ...(body.qr || {}) },
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
  if (body.social !== undefined) row.social = { ...defaultSocial, ...existingRow.social, ...body.social };
  if (body.bgColorStart !== undefined) row.bg_color_start = body.bgColorStart;
  if (body.bgColorEnd !== undefined) row.bg_color_end = body.bgColorEnd;
  if (body.textColor !== undefined) row.text_color = body.textColor;
  if (body.qr !== undefined) row.qr = { ...defaultQr, ...existingRow.qr, ...body.qr };
  delete row.id;
  delete row.created_at;
  return row;
}
