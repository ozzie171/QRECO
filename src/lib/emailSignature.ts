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

/** Builds a self-contained, inline-styled HTML table signature matching the
 * brand's email-signature design (MAIL IMZA.svg), populated with one
 * employee's own data. Every image is referenced by its real hosted URL
 * (never a data: URI or client-rendered canvas/SVG) because email clients
 * fetch signature images over the network, not through JS — this is also
 * why the QR goes through the dedicated /qr-png server endpoint instead of
 * the app's own canvas/SVG QR renderer. */
export function buildEmailSignatureHtml(employee: Employee, imageMode: SignatureImageMode): string {
  const origin = window.location.origin;
  const fullName = [employee.firstName, employee.lastName].filter(Boolean).join(' ');
  const title = [employee.position, employee.enPosition].filter(Boolean).join(' & ');

  const imageUrl =
    imageMode === 'photo' && employee.photoUrl ? employee.photoUrl : `${origin}/api/users/${employee.id}/qr-png`;
  const imageIsPhoto = imageMode === 'photo' && !!employee.photoUrl;

  const socialRow = (['linkedin', 'instagram', 'youtube'] as const)
    .filter((key) => employee.social[key])
    .map(
      (key) => `
          <td style="padding-right:8px;">
            <a href="${escapeHtml(withHttpProtocol(employee.social[key]))}" target="_blank" style="text-decoration:none;">
              <img src="${origin}/signature-icons/${SOCIAL_ICON_FILES[key]}" width="28" height="28" alt="${SOCIAL_LABELS[key]}" style="display:block; border:0;" />
            </a>
          </td>`,
    )
    .join('');

  const addressLines = escapeHtml(employee.address || '').replace(/\n/g, '<br />');

  return `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse; font-family:Arial, Helvetica, sans-serif; background-color:#ffffff;">
  <tr>
    <td style="padding:24px; vertical-align:middle;" width="160">
      <img src="${imageUrl}" width="140" height="140" alt="${imageIsPhoto ? escapeHtml(fullName) : 'QR'}" style="display:block; border:0; border-radius:${imageIsPhoto ? '70px' : '16px'}; object-fit:cover; width:140px; height:140px;" />
    </td>
    <td style="width:2px; background-color:#eb0045; font-size:0; line-height:0;">&nbsp;</td>
    <td style="padding:24px; vertical-align:middle; white-space:nowrap;" width="300">
      <div style="font-size:21px; font-weight:bold; color:#ea0b42; font-family:Arial, Helvetica, sans-serif; white-space:nowrap;">${escapeHtml(fullName) || 'İsimsiz Çalışan'}</div>
      ${title ? `<div style="font-size:14px; color:#444444; margin-top:2px; font-family:Arial, Helvetica, sans-serif; white-space:nowrap;">${escapeHtml(title)}</div>` : ''}
      ${
        socialRow
          ? `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse; margin-top:12px;"><tr>${socialRow}</tr></table>`
          : ''
      }
      <div style="margin-top:14px; font-size:14px; font-family:Arial, Helvetica, sans-serif; line-height:1.6; white-space:nowrap;">
        ${employee.phone ? `<div><span style="color:#ea0b42; font-weight:bold;">Tel:</span> <span style="color:#333333;">${escapeHtml(employee.phone)}</span></div>` : ''}
        ${employee.email ? `<div><span style="color:#ea0b42; font-weight:bold;">Email:</span> <a href="mailto:${escapeHtml(employee.email)}" style="color:#333333; text-decoration:none;">${escapeHtml(employee.email)}</a></div>` : ''}
      </div>
    </td>
    <td style="padding:24px; vertical-align:middle;" width="260">
      <img src="${origin}/eco-logo-kirmizi.svg" width="110" alt="eco" style="display:block; border:0; margin-bottom:12px;" />
      ${employee.address ? `<div style="font-size:13px; color:#444444; font-family:Arial, Helvetica, sans-serif; line-height:1.5;">${addressLines}</div>` : ''}
      ${employee.website ? `<div style="margin-top:10px;"><a href="${escapeHtml(withHttpProtocol(employee.website))}" target="_blank" style="color:#ea0b42; font-weight:bold; font-size:14px; text-decoration:none; font-family:Arial, Helvetica, sans-serif;">${escapeHtml(employee.website)}</a></div>` : ''}
    </td>
  </tr>
</table>`;
}
