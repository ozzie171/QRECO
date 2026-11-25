// Reads one file field from a multipart/form-data request (replaces multer).
export async function readFormFile(request, field, { maxBytes, accept }) {
  let form;
  try {
    form = await request.formData();
  } catch {
    return { error: 'Dosya bulunamadı.' };
  }
  const file = form.get(field);
  if (!file || typeof file === 'string') return { error: 'Dosya bulunamadı.' };
  if (file.size > maxBytes) return { error: `Dosya en fazla ${Math.round(maxBytes / 1024 / 1024)} MB olabilir.` };
  const acceptError = accept(file);
  if (acceptError) return { error: acceptError };
  return { file, form };
}

export function isSvg(file) {
  return file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
}

export function extensionOf(name, fallback) {
  return name.includes('.') ? name.split('.').pop().toLowerCase() : fallback;
}
