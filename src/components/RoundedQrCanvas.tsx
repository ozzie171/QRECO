import { useEffect, useRef } from "react";
import QRCode from "qrcode";

export interface RoundedQrCanvasProps {
  value: string;
  size: number;
  fgColor: string;
  bgColor: string;
  errorLevel: "L" | "M" | "Q" | "H";
  logoUrl?: string;
  logoSize?: number;
}

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
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

/** Draws a rect whose four corners can each have an independent radius, so
 * adjacent dark modules can blend into continuous, organically rounded blobs. */
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

export default function RoundedQrCanvas({
  value,
  size,
  fgColor,
  bgColor,
  errorLevel,
  logoUrl,
  logoSize = 40,
}: RoundedQrCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;

    const qr = QRCode.create(value, { errorCorrectionLevel: errorLevel });
    const modules = qr.modules;
    const moduleCount = modules.size;
    const margin = 2;
    const totalModules = moduleCount + margin * 2;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cellSize = size / totalModules;
    const isDark = (row: number, col: number) =>
      row >= 0 &&
      col >= 0 &&
      row < moduleCount &&
      col < moduleCount &&
      !!modules.get(row, col);

    const isTransparentBg = bgColor === "transparent";
    if (!isTransparentBg) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, size, size);
    }
    ctx.fillStyle = fgColor;

    const fullRadius = cellSize * 0.5;
    // Touching edges are drawn slightly oversized so rounding/anti-aliasing
    // never leaves a hairline background seam between merged modules.
    const overlap = cellSize * 0.08;

    ctx.beginPath();
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

        // A corner stays sharp (so neighboring modules melt together into one
        // continuous blob) whenever either of its two adjacent edges is also dark.
        const rTL = top || left ? 0 : fullRadius;
        const rTR = top || right ? 0 : fullRadius;
        const rBR = bottom || right ? 0 : fullRadius;
        const rBL = bottom || left ? 0 : fullRadius;

        blobRectPath(ctx, x, y, w, h, rTL, rTR, rBR, rBL);
      }
    }
    ctx.fill();

    if (logoUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        if (cancelled) return;
        const padding = logoSize * 0.18;
        const boxSize = logoSize + padding * 2;
        const boxPos = (size - boxSize) / 2;
        if (!isTransparentBg) {
          ctx.fillStyle = bgColor;
          roundedRectPath(ctx, boxPos, boxPos, boxSize, boxSize, boxSize * 0.25);
          ctx.fill();
        }
        const imgPos = (size - logoSize) / 2;
        ctx.drawImage(img, imgPos, imgPos, logoSize, logoSize);
      };
      img.src = logoUrl;
    }

    return () => {
      cancelled = true;
    };
  }, [value, size, fgColor, bgColor, errorLevel, logoUrl, logoSize]);

  return <canvas ref={canvasRef} style={{ display: "block" }} />;
}
