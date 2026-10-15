import QRCode from 'qrcode';
import type { Employee } from '../types';

const CARD_WIDTH = 480;
const CARD_HEIGHT = 680;
const AVATAR_SIZE = 160;
const QR_SIZE = 220;
const QR_BOX_PADDING = 20;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Görsel yüklenemedi: ${src}`));
    img.src = src;
  });
}

function getInitials(firstName: string, lastName: string): string {
  return [firstName, lastName]
    .map((part) => part.trim()[0])
    .filter(Boolean)
    .join('')
    .toUpperCase();
}

function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.arcTo(x + w, y, x + w, y + radius, radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
  ctx.lineTo(x + radius, y + h);
  ctx.arcTo(x, y + h, x, y + h - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

function blobRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  rTL: number,
  rTR: number,
  rBR: number,
  rBL: number,
) {
  ctx.moveTo(x + rTL, y);
  ctx.lineTo(x + w - rTR, y);
  if (rTR > 0) ctx.arcTo(x + w, y, x + w, y + rTR, rTR);
  ctx.lineTo(x + w, y + h - rBR);
  if (rBR > 0) ctx.arcTo(x + w, y + h, x + w - rBR, y + h, rBR);
  ctx.lineTo(x + rBL, y + h);
  if (rBL > 0) ctx.arcTo(x, y + h, x, y + h - rBL, rBL);
  ctx.lineTo(x, y + rTL);
  if (rTL > 0) ctx.arcTo(x, y, x + rTL, y, rTL);
  ctx.closePath();
}

/** Draws the "blob" style QR (mirrors RoundedQrCanvas's algorithm) at an
 * arbitrary offset onto an existing canvas, always on an opaque white patch
 * regardless of the employee's own QR background setting — this card is
 * meant to be handed out/printed, so the QR must stay scannable no matter
 * what color the rest of the card ends up using. */
function drawQrOnCanvas(
  ctx: CanvasRenderingContext2D,
  offsetX: number,
  offsetY: number,
  size: number,
  fgColor: string,
  errorLevel: 'L' | 'M' | 'Q' | 'H',
  value: string,
  logoImage: HTMLImageElement | null,
  logoSize: number,
) {
  const qr = QRCode.create(value, { errorCorrectionLevel: errorLevel });
  const modules = qr.modules;
  const moduleCount = modules.size;
  const margin = 2;
  const totalModules = moduleCount + margin * 2;
  const cellSize = size / totalModules;
  const isDark = (row: number, col: number) =>
    row >= 0 && col >= 0 && row < moduleCount && col < moduleCount && !!modules.get(row, col);

  const hasLogo = !!logoImage;
  const padding = logoSize * 0.18;
  const boxSize = logoSize + padding * 2;
  const boxPos = (size - boxSize) / 2;
  const boxEnd = boxPos + boxSize;
  const isInLogoBox = (row: number, col: number) => {
    if (!hasLogo) return false;
    const centerX = (col + margin + 0.5) * cellSize;
    const centerY = (row + margin + 0.5) * cellSize;
    return centerX >= boxPos && centerX <= boxEnd && centerY >= boxPos && centerY <= boxEnd;
  };

  const fullRadius = cellSize * 0.5;
  const overlap = cellSize * 0.08;

  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.fillStyle = fgColor;
  ctx.beginPath();
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (!isDark(row, col) || isInLogoBox(row, col)) continue;

      const top = isDark(row - 1, col) && !isInLogoBox(row - 1, col);
      const bottom = isDark(row + 1, col) && !isInLogoBox(row + 1, col);
      const left = isDark(row, col - 1) && !isInLogoBox(row, col - 1);
      const right = isDark(row, col + 1) && !isInLogoBox(row, col + 1);

      const x = (col + margin) * cellSize - (left ? overlap : 0);
      const y = (row + margin) * cellSize - (top ? overlap : 0);
      const w = cellSize + (left ? overlap : 0) + (right ? overlap : 0);
      const h = cellSize + (top ? overlap : 0) + (bottom ? overlap : 0);

      const rTL = top || left ? 0 : fullRadius;
      const rTR = top || right ? 0 : fullRadius;
      const rBR = bottom || right ? 0 : fullRadius;
      const rBL = bottom || left ? 0 : fullRadius;

      blobRectPath(ctx, x, y, w, h, rTL, rTR, rBR, rBL);
    }
  }
  ctx.fill();

  if (hasLogo && logoImage) {
    const imgPos = (size - logoSize) / 2;
    ctx.drawImage(logoImage, imgPos, imgPos, logoSize, logoSize);
  }
  ctx.restore();
}

/** Builds and downloads a shareable PNG "profile card": photo, name and
 * position over the employee's own page colors, with a QR code (always on
 * a white patch for scannability) underneath. */
export async function downloadProfileCardImage(employee: Employee): Promise<void> {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas desteklenmiyor.');

  const gradient = ctx.createLinearGradient(0, 0, 0, CARD_HEIGHT);
  gradient.addColorStop(0, employee.bgColorStart || '#f5f5f5');
  gradient.addColorStop(1, employee.bgColorEnd || '#e0e0e0');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  const textColor = employee.textColor || '#1f1f1f';
  const centerX = CARD_WIDTH / 2;
  const avatarY = 72;
  const avatarCenterY = avatarY + AVATAR_SIZE / 2;

  let photo: HTMLImageElement | null = null;
  if (employee.photoUrl) {
    try {
      photo = await loadImage(employee.photoUrl);
    } catch {
      photo = null;
    }
  }

  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, avatarCenterY, AVATAR_SIZE / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  if (photo) {
    const scale = Math.max(AVATAR_SIZE / photo.width, AVATAR_SIZE / photo.height);
    const w = photo.width * scale;
    const h = photo.height * scale;
    ctx.drawImage(photo, centerX - w / 2, avatarCenterY - h / 2, w, h);
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(centerX - AVATAR_SIZE / 2, avatarY, AVATAR_SIZE, AVATAR_SIZE);
  }
  ctx.restore();

  if (!photo) {
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '600 56px -apple-system, "Segoe UI", sans-serif';
    ctx.fillText(getInitials(employee.firstName, employee.lastName), centerX, avatarCenterY);
  }

  const fullName = [employee.firstName, employee.lastName].filter(Boolean).join(' ');
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = '700 30px -apple-system, "Segoe UI", sans-serif';
  const nameY = avatarY + AVATAR_SIZE + 52;
  ctx.fillText(fullName || 'İsimsiz Çalışan', centerX, nameY);

  if (employee.position) {
    ctx.font = '400 20px -apple-system, "Segoe UI", sans-serif';
    ctx.globalAlpha = 0.8;
    ctx.fillText(employee.position, centerX, nameY + 32);
    ctx.globalAlpha = 1;
  }

  const { qr } = employee;
  let logoImage: HTMLImageElement | null = null;
  if (qr.logoUrl) {
    try {
      logoImage = await loadImage(qr.logoUrl);
    } catch {
      logoImage = null;
    }
  }
  const scaledLogoSize = logoImage ? qr.logoSize * (QR_SIZE / 176) : qr.logoSize;

  const boxSize = QR_SIZE + QR_BOX_PADDING * 2;
  const boxX = centerX - boxSize / 2;
  const boxY = CARD_HEIGHT - boxSize - 56;
  ctx.fillStyle = '#ffffff';
  roundedRectPath(ctx, boxX, boxY, boxSize, boxSize, 20);
  ctx.fill();

  const profileUrl = `${window.location.origin}/profile/${employee.id}`;
  drawQrOnCanvas(
    ctx,
    boxX + QR_BOX_PADDING,
    boxY + QR_BOX_PADDING,
    QR_SIZE,
    qr.fgColor,
    logoImage ? 'H' : 'L',
    profileUrl,
    logoImage,
    scaledLogoSize,
  );

  const name = [employee.firstName, employee.lastName].filter(Boolean).join('-') || 'calisan';
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = `${name}-profil-karti.png`;
  link.href = dataUrl;
  link.click();
}
