import QRCode from 'qrcode';
import sharp from 'sharp';

/** Renders a plain square QR (no custom blob-rounding — this is a raster
 * image meant for email clients, which need a static hosted URL rather than
 * client-rendered canvas/SVG) with the company logo pasted on a white patch
 * in the center. A logo needs the "H" error-correction tier — see
 * QrCodeCard's own errorLevel comment — or the patch alone exceeds what a
 * lower tier can correct and the code stops scanning. */
export async function buildQrPngBuffer(value, logoUrl, size = 480) {
  const errorLevel = logoUrl ? 'H' : 'L';
  const qrBuffer = await QRCode.toBuffer(value, {
    type: 'png',
    errorCorrectionLevel: errorLevel,
    margin: 2,
    width: size,
    color: { dark: '#000000', light: '#ffffff' },
  });

  if (!logoUrl) return qrBuffer;

  const logoSize = Math.round(size * 0.24);
  const boxSize = Math.round(logoSize * 1.36);
  const boxPos = Math.round((size - boxSize) / 2);
  const logoPos = Math.round((size - logoSize) / 2);
  const boxRadius = Math.round(boxSize * 0.25);

  const boxSvg = `<svg width="${boxSize}" height="${boxSize}"><rect width="${boxSize}" height="${boxSize}" rx="${boxRadius}" ry="${boxRadius}" fill="#ffffff"/></svg>`;
  const boxBuffer = await sharp(Buffer.from(boxSvg)).png().toBuffer();

  const composites = [{ input: boxBuffer, left: boxPos, top: boxPos }];

  try {
    const res = await fetch(logoUrl);
    if (res.ok) {
      const arr = await res.arrayBuffer();
      const logoBuffer = await sharp(Buffer.from(arr))
        .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
      composites.push({ input: logoBuffer, left: logoPos, top: logoPos });
    }
  } catch {
    // Logo is a nice-to-have; a logo-less (but still white-patched) QR still works.
  }

  return sharp(qrBuffer).composite(composites).png().toBuffer();
}
