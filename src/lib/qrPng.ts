import QRCode from 'qrcode';
import type { Employee } from '../types';

/** The URL an employee's QR encodes: a selected "Genel QR" target if any,
 * otherwise their own public profile page. */
export function employeeQrValue(employee: Pick<Employee, 'id' | 'qr'>): string {
  return employee.qr.generalQrUrl || `${window.location.origin}/profile/${employee.id}`;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Required so drawing a Supabase-hosted logo doesn't taint the canvas
    // (a tainted canvas can't be exported with toBlob).
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Resim yüklenemedi: ${url}`));
    img.src = url;
  });
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG oluşturulamadı.'))), 'image/png');
  });
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + size, y, x + size, y + size, radius);
  ctx.arcTo(x + size, y + size, x, y + size, radius);
  ctx.arcTo(x, y + size, x, y, radius);
  ctx.arcTo(x, y, x + size, y, radius);
  ctx.closePath();
}

/** Renders the email-signature QR as a PNG, in the browser: a plain square
 * QR with the logo pasted on a white rounded patch in the center. This used
 * to be rendered server-side on every single email open (one function call
 * per open); now it's rendered once, when the employee is saved, and stored
 * as a static file. A logo needs the "H" error-correction tier, or the patch
 * alone exceeds what a lower tier can correct and the code stops scanning. */
export async function renderQrPngBlob(value: string, logoUrl?: string, size = 480): Promise<Blob> {
  const canvas = document.createElement('canvas');
  await QRCode.toCanvas(canvas, value, {
    errorCorrectionLevel: logoUrl ? 'H' : 'L',
    margin: 2,
    width: size,
    color: { dark: '#000000', light: '#ffffff' },
  });
  if (!logoUrl) return canvasToPngBlob(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas desteklenmiyor.');

  const logoSize = Math.round(size * 0.24);
  const boxSize = Math.round(logoSize * 1.36);
  const boxPos = Math.round((size - boxSize) / 2);
  const logoPos = Math.round((size - logoSize) / 2);

  ctx.fillStyle = '#ffffff';
  roundedRect(ctx, boxPos, boxPos, boxSize, Math.round(boxSize * 0.25));
  ctx.fill();

  try {
    const logo = await loadImage(logoUrl);
    // "contain" fit inside the square logo slot; SVGs without intrinsic
    // dimensions report 0, in which case the slot is filled as a square.
    const w = logo.naturalWidth || logoSize;
    const h = logo.naturalHeight || logoSize;
    const scale = Math.min(logoSize / w, logoSize / h);
    const dw = Math.round(w * scale);
    const dh = Math.round(h * scale);
    ctx.drawImage(logo, logoPos + Math.round((logoSize - dw) / 2), logoPos + Math.round((logoSize - dh) / 2), dw, dh);
    return await canvasToPngBlob(canvas);
  } catch {
    // Logo is a nice-to-have; a logo-less (but still white-patched) QR still
    // scans. Redraw from scratch in case drawing the logo tainted the canvas.
    const plain = document.createElement('canvas');
    await QRCode.toCanvas(plain, value, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: size,
      color: { dark: '#000000', light: '#ffffff' },
    });
    const plainCtx = plain.getContext('2d');
    if (plainCtx) {
      plainCtx.fillStyle = '#ffffff';
      roundedRect(plainCtx, boxPos, boxPos, boxSize, Math.round(boxSize * 0.25));
      plainCtx.fill();
    }
    return canvasToPngBlob(plain);
  }
}

/** Rasterizes an uploaded SVG logo to a PNG of the given height (Outlook's
 * Word engine can't display SVG <img> sources in signatures). */
export async function svgFileToPngBlob(file: File, height = 500): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const w = img.naturalWidth || height;
    const h = img.naturalHeight || height;
    const canvas = document.createElement('canvas');
    canvas.height = height;
    canvas.width = Math.max(1, Math.round((w / h) * height));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas desteklenmiyor.');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await canvasToPngBlob(canvas);
  } finally {
    URL.revokeObjectURL(url);
  }
}
