import QRCode from 'qrcode';
import type { Employee } from '../types';

export interface QrVectorOptions {
  value: string;
  size: number;
  fgColor: string;
  bgColor: string;
  errorLevel: 'L' | 'M' | 'Q' | 'H';
  logoUrl?: string;
  logoSize?: number;
}

function cellPathSegment(
  x: number,
  y: number,
  w: number,
  h: number,
  rTL: number,
  rTR: number,
  rBR: number,
  rBL: number,
): string {
  return [
    `M ${x + rTL} ${y}`,
    `L ${x + w - rTR} ${y}`,
    `A ${rTR} ${rTR} 0 0 1 ${x + w} ${y + rTR}`,
    `L ${x + w} ${y + h - rBR}`,
    `A ${rBR} ${rBR} 0 0 1 ${x + w - rBR} ${y + h}`,
    `L ${x + rBL} ${y + h}`,
    `A ${rBL} ${rBL} 0 0 1 ${x} ${y + h - rBL}`,
    `L ${x} ${y + rTL}`,
    `A ${rTL} ${rTL} 0 0 1 ${x + rTL} ${y}`,
    'Z',
  ].join(' ');
}

/** Fetches the logo's own SVG source and returns it as a self-contained
 * nested <svg> block (viewBox preserved, no external references), so the
 * downloaded QR code works fully offline in any viewer or design tool. */
async function buildInlineLogoMarkup(logoUrl: string, x: number, y: number, size: number): Promise<string | null> {
  try {
    const response = await fetch(logoUrl);
    if (!response.ok) return null;
    const svgText = await response.text();
    const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
    const root = doc.documentElement;
    if (!root || root.nodeName.toLowerCase() !== 'svg') return null;

    let viewBox = root.getAttribute('viewBox');
    if (!viewBox) {
      const w = parseFloat(root.getAttribute('width') || '');
      const h = parseFloat(root.getAttribute('height') || '');
      viewBox = w && h ? `0 0 ${w} ${h}` : '0 0 100 100';
    }

    return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="${viewBox}">${root.innerHTML}</svg>`;
  } catch {
    return null;
  }
}

/** Builds a self-contained <svg> markup string of the "blob" style QR code,
 * mirroring the corner-rounding algorithm used by RoundedQrCanvas so the
 * downloaded vector matches the on-screen preview. */
export async function buildQrSvgMarkup({
  value,
  size,
  fgColor,
  bgColor,
  errorLevel,
  logoUrl,
  logoSize = 40,
}: QrVectorOptions): Promise<string> {
  const qr = QRCode.create(value, { errorCorrectionLevel: errorLevel });
  const modules = qr.modules;
  const moduleCount = modules.size;
  const margin = 2;
  const totalModules = moduleCount + margin * 2;
  const cellSize = size / totalModules;
  const isDark = (row: number, col: number) =>
    row >= 0 && col >= 0 && row < moduleCount && col < moduleCount && !!modules.get(row, col);

  const fullRadius = cellSize * 0.5;
  const overlap = cellSize * 0.08;
  const isTransparentBg = bgColor === 'transparent';

  // Modules whose center falls inside the logo's clearing box are left out
  // entirely (not just covered by a patch on top), so the logo always sits
  // in genuinely empty space — a transparent background stays truly
  // transparent there too, instead of forcing a color.
  const hasLogo = !!logoUrl;
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

  const segments: string[] = [];
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

      segments.push(cellPathSegment(x, y, w, h, rTL, rTR, rBR, rBL));
    }
  }

  let logoMarkup = '';
  if (hasLogo && logoUrl) {
    const imgPos = (size - logoSize) / 2;
    const boxRadius = boxSize * 0.25;
    // With an opaque background, paint a clean patch behind the logo for
    // smooth rounded edges; with a transparent background, leave it as the
    // genuinely empty hole the module exclusion above already created.
    const boxMarkup = isTransparentBg
      ? ''
      : `<rect x="${boxPos}" y="${boxPos}" width="${boxSize}" height="${boxSize}" rx="${boxRadius}" ry="${boxRadius}" fill="${bgColor}" />`;

    const inlineLogo = await buildInlineLogoMarkup(logoUrl, imgPos, imgPos, logoSize);
    const logoElement =
      inlineLogo ?? `<image href="${logoUrl}" x="${imgPos}" y="${imgPos}" width="${logoSize}" height="${logoSize}" />`;

    logoMarkup = boxMarkup + logoElement;
  }

  const bgMarkup = isTransparentBg ? '' : `<rect width="${size}" height="${size}" fill="${bgColor}" />`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${bgMarkup}<path d="${segments.join(' ')}" fill="${fgColor}" />${logoMarkup}</svg>`;
}

// Keep in sync with QrCodeCard's own REFERENCE_SIZE: logoSize is tuned by eye
// against that canvas size, so it must be scaled by size/REFERENCE whenever
// the actual render size differs (e.g. a small inline thumbnail or a larger
// download), or the logo ends up disproportionate to the QR.
const LOGO_SIZE_REFERENCE = 176;

/** Builds and triggers a browser download of an employee's QR code as an
 * SVG file, used both by the per-employee QR preview card and the admin
 * table's quick-download action so the two stay in sync. */
export async function downloadEmployeeQrSvg(employee: Employee, size = 320): Promise<void> {
  const { qr } = employee;
  const profileUrl = qr.generalQrUrl || `${window.location.origin}/profile/${employee.id}`;
  const scaledLogoSize = qr.logoUrl ? qr.logoSize * (size / LOGO_SIZE_REFERENCE) : qr.logoSize;
  const svgMarkup = await buildQrSvgMarkup({
    value: profileUrl,
    size,
    fgColor: qr.fgColor,
    bgColor: qr.bgColor,
    // See QrCodeCard's errorLevel comment: a logo needs the "H" tier or the
    // blanked-out area alone exceeds what "M" can correct and scanning fails.
    errorLevel: qr.logoUrl ? 'H' : 'L',
    logoUrl: qr.logoUrl || undefined,
    logoSize: scaledLogoSize,
  });
  const name = [employee.firstName, employee.lastName].filter(Boolean).join('-') || 'calisan';
  const blob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `${name}-qr.svg`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}
