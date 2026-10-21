import type { Employee } from '../types';
import { withHttpProtocol } from './url';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const SOCIAL_ICON_FILES: Record<'linkedin' | 'instagram' | 'youtube', string> = {
  linkedin: 'linkedin.png',
  instagram: 'instagram.png',
  youtube: 'youtube.png',
};

const SOCIAL_LABELS: Record<'linkedin' | 'instagram' | 'youtube', string> = {
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  youtube: 'YouTube',
};

export type SignatureImageMode = 'qr' | 'photo';

// Myriad Pro and Quicksand are the brand's actual typefaces (per MAIL IMZA.svg),
// but neither can be embedded in an email the way a webpage embeds a font —
// email clients strip <style>/@font-face/external stylesheets. They're listed
// first in each stack so a recipient who happens to have them installed sees
// the real brand type; everyone else falls back to the nearest safe font.
const NAME_FONT = "'Myriad Pro', Myriad, Arial, Helvetica, sans-serif";
const BODY_FONT = "'Quicksand', 'Century Gothic', Arial, Helvetica, sans-serif";

/** Builds a self-contained, inline-styled HTML table signature matching the
 * brand's email-signature design (MAIL IMZA.svg), populated with one
 * employee's own data. Every image is referenced by its real hosted URL
 * (never a data: URI or client-rendered canvas/SVG) because email clients
 * fetch signature images over the network, not through JS — this is also
 * why the QR goes through the dedicated /qr-png server endpoint instead of
 * the app's own canvas/SVG QR renderer. */
// The whole card (and the extra logo beside it) is rendered at 75% of its
// original design size — every pixel dimension below is scaled down
// uniformly by this factor so proportions stay identical, just smaller.
const SCALE = 0.75;
const px = (value: number) => Math.round(value * SCALE);

export function buildEmailSignatureHtml(
  employee: Employee,
  imageMode: SignatureImageMode,
  extraLogoUrl?: string | null,
): string {
  const origin = window.location.origin;
  const fullName = [employee.firstName, employee.lastName].filter(Boolean).join(' ');
  const title = [employee.position, employee.enPosition].filter(Boolean).join(' & ');

  const imageUrl =
    imageMode === 'photo' && employee.photoUrl ? employee.photoUrl : `${origin}/api/users/${employee.id}/qr-png`;
  const imageIsPhoto = imageMode === 'photo' && !!employee.photoUrl;

  const mapsUrl = employee.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(employee.address)}`
    : '';

  const socialIconSize = px(28);
  const socialRow =
    (['linkedin', 'instagram', 'youtube'] as const)
      .filter((key) => employee.social[key])
      .map(
        (key) => `
          <td style="padding-right:${px(8)}px;">
            <a href="${escapeHtml(withHttpProtocol(employee.social[key]))}" target="_blank" style="text-decoration:none;">
              <img src="${origin}/signature-icons/${SOCIAL_ICON_FILES[key]}" width="${socialIconSize}" height="${socialIconSize}" alt="${SOCIAL_LABELS[key]}" style="display:block; border:0;" />
            </a>
          </td>`,
      )
      .join('') +
    (mapsUrl
      ? `
          <td>
            <a href="${escapeHtml(mapsUrl)}" target="_blank" style="text-decoration:none;">
              <img src="${origin}/signature-icons/map.png" width="${socialIconSize}" height="${socialIconSize}" alt="Adres" style="display:block; border:0;" />
            </a>
          </td>`
      : '');

  const addressLines = escapeHtml(employee.address || '').replace(/\n/g, '<br />');

  const imageSize = px(140);
  const cellPadding = px(24);
  const nameCellWidth = px(300);

  // The eco wordmark is sized to the address column's own content width
  // (column width minus its left/right padding), so it reads as wide as the
  // address text block beneath it rather than looking small and lost.
  const addressColumnWidth = px(260);
  const addressColumnPadding = cellPadding;
  const ecoLogoWidth = addressColumnWidth - addressColumnPadding * 2;

  // The card itself (gradient background, border, rounded corners) only
  // wraps the brand content. The extra logo is a separate cell placed
  // outside that bordered shape — so it reads as sitting beside the card
  // rather than being clipped against its rounded edge.
  const card = `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:separate; font-family:${BODY_FONT}; background-color:#f5f6f6; background-image:linear-gradient(90deg, #ffffff 0%, #f1f2f2 100%); border:1px solid #e8e8e8; border-radius:${px(36)}px;">
  <tr>
    <td style="padding:${cellPadding}px; vertical-align:middle;" width="${imageSize + cellPadding * 2}">
      <img src="${imageUrl}" width="${imageSize}" height="${imageSize}" alt="${imageIsPhoto ? escapeHtml(fullName) : 'QR'}" style="display:block; border:0; border-radius:${imageIsPhoto ? `${imageSize / 2}px` : `${px(16)}px`}; object-fit:cover; width:${imageSize}px; height:${imageSize}px;" />
    </td>
    <td style="width:${px(2)}px; vertical-align:middle; font-size:0; line-height:0;">
      <!-- The colored bar lives on this inner div (sized and centered to
           match the QR/photo image's own height) rather than on the td's
           own background, which would otherwise stretch to the full row
           height — taller than the image whenever the address column ends
           up tallest. A bare "&nbsp;" td also has zero intrinsic width
           under table-layout:auto, collapsing the column to 0 regardless
           of the width above; this div's own explicit width is what
           actually holds the column open. -->
      <div style="width:${px(2)}px; height:${imageSize}px; background-color:#eb0045;"></div>
    </td>
    <td style="padding:${cellPadding}px; vertical-align:middle; white-space:nowrap;" width="${nameCellWidth}">
      <div style="font-size:${px(21)}px; font-weight:bold; color:#ea0b42; font-family:${NAME_FONT}; white-space:nowrap;">${escapeHtml(fullName) || 'İsimsiz Çalışan'}</div>
      ${title ? `<div style="font-size:${px(14)}px; color:#444444; margin-top:${px(2)}px; font-family:${BODY_FONT}; white-space:nowrap;">${escapeHtml(title)}</div>` : ''}
      ${
        socialRow
          ? `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse; margin-top:${px(12)}px;"><tr>${socialRow}</tr></table>`
          : ''
      }
      <div style="margin-top:${px(14)}px; font-size:${px(14)}px; font-family:${BODY_FONT}; line-height:1.6; white-space:nowrap;">
        ${employee.phone ? `<div><span style="color:#ea0b42; font-weight:bold;">Tel:</span> <span style="color:#333333;">${escapeHtml(employee.phone)}</span></div>` : ''}
        ${employee.email ? `<div><span style="color:#ea0b42; font-weight:bold;">Email:</span> <a href="mailto:${escapeHtml(employee.email)}" style="color:#333333; text-decoration:none;">${escapeHtml(employee.email)}</a></div>` : ''}
      </div>
    </td>
    <td style="padding:${cellPadding}px; vertical-align:middle;" width="${addressColumnWidth}">
      <img src="${origin}/eco-logo-kirmizi.svg" width="${ecoLogoWidth}" alt="eco" style="display:block; border:0; margin-bottom:${px(12)}px;" />
      ${employee.address ? `<div style="font-size:${px(13)}px; color:#444444; font-family:${BODY_FONT}; line-height:1.5;">${addressLines}</div>` : ''}
      ${employee.website ? `<div style="margin-top:${px(10)}px;"><a href="${escapeHtml(withHttpProtocol(employee.website))}" target="_blank" style="color:#ea0b42; font-weight:bold; font-size:${px(14)}px; text-decoration:none; font-family:${BODY_FONT};">${escapeHtml(employee.website)}</a></div>` : ''}
    </td>
  </tr>
</table>`;

  if (!extraLogoUrl) return card;

  // Sized to the card's own typical rendered height (measured, not
  // calculated — the card's height already flexes with address line count)
  // so the two sit flush top-to-bottom instead of the logo overshooting
  // above/below it when its own aspect ratio isn't square. Only height is
  // fixed; width is left to scale naturally so the logo's own proportions
  // never get distorted.
  const extraLogoHeight = px(204);
  const extraLogoMaxWidth = px(200);

  return `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:separate;">
  <tr>
    <td style="vertical-align:middle;">${card}</td>
    <td style="vertical-align:middle; padding-left:${px(20)}px;">
      <img src="${escapeHtml(extraLogoUrl)}" height="${extraLogoHeight}" alt="" style="display:block; border:0; height:${extraLogoHeight}px; width:auto; max-width:${extraLogoMaxWidth}px;" />
    </td>
  </tr>
</table>`;
}
