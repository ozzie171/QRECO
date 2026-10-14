import QRCode from 'qrcode';

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

/** Builds a self-contained <svg> markup string of the "blob" style QR code,
 * mirroring the corner-rounding algorithm used by RoundedQrCanvas so the
 * downloaded vector matches the on-screen preview. */
export function buildQrSvgMarkup({
  value,
  size,
  fgColor,
  bgColor,
  errorLevel,
  logoUrl,
  logoSize = 40,
}: QrVectorOptions): string {
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

  const segments: string[] = [];
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (!isDark(row, col)) continue;

      const top = isDark(row - 1, col);
      const bottom = isDark(row + 1, col);
      const left = isDark(row, col - 1);
      const right = isDark(row, col + 1);

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
  if (logoUrl) {
    const padding = logoSize * 0.18;
    const boxSize = logoSize + padding * 2;
    const boxPos = (size - boxSize) / 2;
    const imgPos = (size - logoSize) / 2;
    const boxRadius = boxSize * 0.25;
    logoMarkup = `<rect x="${boxPos}" y="${boxPos}" width="${boxSize}" height="${boxSize}" rx="${boxRadius}" ry="${boxRadius}" fill="${bgColor}" /><image href="${logoUrl}" x="${imgPos}" y="${imgPos}" width="${logoSize}" height="${logoSize}" />`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="${bgColor}" /><path d="${segments.join(' ')}" fill="${fgColor}" />${logoMarkup}</svg>`;
}
