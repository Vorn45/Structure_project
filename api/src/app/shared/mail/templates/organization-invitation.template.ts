// ===========================================================================>> Custom Library
// > Local
import { appConfig }         from 'src/app.config';
import { SesInlineImage }    from 'src/app/shared/mail/ses.service';
import { MAIL_ICON_EMAIL, MAIL_ICON_TIMER, MAIL_INVITE_ILLUSTRATION, MAIL_INVITE_ILLUSTRATION_ADMIN, MAIL_LOGO } from 'src/app/shared/mail/templates/mail-assets';

// ======================================= >> Code Starts Here << ========================== //
export interface OrganizationInvitationEmailData {
    organization_name: string;
    inviter_name: string;
    invitee_email: string;
    accept_url: string;
    decline_url: string;
    expires_in_days: number;
    /** Shows an "Admin" badge next to the heading when the invitee is being invited as an org admin. */
    is_admin?: boolean;
    /** Organization's own logo, inlined into the envelope illustration's circle badge. Falls back to the system logo when absent. */
    organization_logo?: SesInlineImage | null;
}

export interface OrganizationInvitationEmailContent {
    subject: string;
    html: string;
    text: string;
    inline_images: SesInlineImage[];
}

const BRAND_NAVY = '#1c2978';
const BRAND_NAVY_TINT = 'rgba(28,41,120,0.07)';
const BRAND_NAVY_TINT_BORDER = 'rgba(28,41,120,0.12)';
const FONT_STACK = `'Kantumruy Pro', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`;

export function buildOrganizationInvitationEmail(data: OrganizationInvitationEmailData): OrganizationInvitationEmailContent {
    const systemName = appConfig.APP.SYSTEM_NAME;
    const {
        organization_name,
        inviter_name,
        invitee_email,
        accept_url,
        decline_url,
        expires_in_days,
        is_admin,
        organization_logo,
    } = data;

    const subject = `${inviter_name} invited you to join ${organization_name} on ${systemName}`;
    const expiryLabel = `${expires_in_days} day${expires_in_days === 1 ? '' : 's'}`;

    const logoHtml = `<img src="cid:${MAIL_LOGO.cid}" alt="${escapeHtml(systemName)}" height="56" style="display:block; height:56px; width:auto;" />`;

    // The illustration's card area is blank (no baked-in mark), so the
    // organization's logo is placed on top of it in normal document flow —
    // no absolute positioning or CSS background-image hacks needed, since
    // there's no fixed graphic underneath to align against precisely.
    // Coordinates were measured from the card's pixel bounds in the source
    // image and verified by compositing a test marker before wiring this up.
    //
    // The admin star is baked into a separate illustration variant rather
    // than composited at send-time — an earlier attempt to overlay a badge
    // on the logo's corner via position:absolute or negative table-cell
    // margins didn't render reliably across mail clients. The two source
    // images have different aspect ratios, so each needs its own render
    // height and logo placement (measured from each PNG's pixel bounds).
    const illustration = is_admin ? MAIL_INVITE_ILLUSTRATION_ADMIN : MAIL_INVITE_ILLUSTRATION;
    const illustrationHeight = is_admin ? 119 : 118;
    const logoSize = is_admin ? 30 : 40;
    const logoTopOffset = is_admin ? 36 : 36;

    const heroLogoHtml = organization_logo
        ? `<img src="cid:${organization_logo.cid}" width="${logoSize}" height="${logoSize}" alt="${escapeHtml(organization_name)}" style="display:block; width:${logoSize}px; height:${logoSize}px; border-radius:50%; object-fit:cover;" />`
        : '';

    const illustrationHtml = illustration
        ? `<td width="170" style="vertical-align:top; text-align:right; padding:0 0 0 16px;">
<table role="presentation" width="170" height="${illustrationHeight}" cellpadding="0" cellspacing="0" background="cid:${illustration.cid}" style="width:170px; height:${illustrationHeight}px; background-image:url('cid:${illustration.cid}'); background-size:170px ${illustrationHeight}px; background-repeat:no-repeat;">
<tr style="height:${logoTopOffset}px;"><td style="height:${logoTopOffset}px; font-size:1px; line-height:1px;">&nbsp;</td></tr>
<tr>
<td align="center" valign="top">
<table role="presentation" width="${logoSize}" height="${logoSize}" cellpadding="0" cellspacing="0" style="width:${logoSize}px; height:${logoSize}px; margin:0 auto;"><tr><td align="center" valign="middle">${heroLogoHtml}</td></tr></table>
</td>
</tr>
</table>
</td>`
        : '';

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${subject}</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f5f7; font-family: ${FONT_STACK};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7; padding:32px 0;">
<tr>
<td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border:1px solid #e8eaef; border-radius:12px; overflow:hidden; box-shadow:0 10px 30px rgba(15,23,42,0.07), 0 1px 2px rgba(15,23,42,0.04);">
<tr>
<td style="padding:20px 40px 0 40px; text-align:left; line-height:0;">
${logoHtml}
</td>
</tr>
<tr>
<td style="padding:0 40px 0 40px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="vertical-align:top; text-align:left; padding-top:16px;">
<h1 style="margin:0; font-size:24px; line-height:30px; font-weight:600; color:#0f172a;">You're invited to</h1>
<h1 style="margin:0; font-size:24px; line-height:30px; font-weight:600; color:${BRAND_NAVY};">${escapeHtml(organization_name)}</h1>
<p style="margin:16px 0 0 0; font-size:14px; line-height:22px; color:#6b7280;">
Hi there,<br />
<strong>${escapeHtml(inviter_name)}</strong> has invited you to collaborate on <strong>${escapeHtml(organization_name)}</strong> in <strong>${escapeHtml(systemName)}</strong>.
</p>
</td>
${illustrationHtml}
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding:24px 40px 0 40px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fbfcfd; border:1px solid #e3e6ec; border-radius:12px;">
<tr>
<td style="padding:18px 20px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr>
<td width="40" style="vertical-align:top;">
<table role="presentation" cellpadding="0" cellspacing="0" width="40" height="40" style="background-color:${BRAND_NAVY_TINT}; border:1px solid ${BRAND_NAVY_TINT_BORDER}; border-radius:8px;"><tr><td align="center" valign="middle" style="width:40px; height:40px;"><img src="cid:${MAIL_ICON_EMAIL.cid}" width="20" height="20" alt="" style="display:block;" /></td></tr></table>
</td>
<td style="padding-left:16px; vertical-align:middle;">
<div style="font-size:10px; font-weight:600; letter-spacing:0.04em; text-transform:uppercase; color:#8a94ab;">Invited as</div>
<div style="margin-top:2px; font-size:14px; font-weight:600; color:#0f172a;">${escapeHtml(invitee_email)}</div>
</td>
</tr>
<tr><td colspan="2" style="padding-top:12px;"></td></tr>
<tr>
<td width="40" style="vertical-align:top;">
<table role="presentation" cellpadding="0" cellspacing="0" width="40" height="40" style="background-color:${BRAND_NAVY_TINT}; border:1px solid ${BRAND_NAVY_TINT_BORDER}; border-radius:8px;"><tr><td align="center" valign="middle" style="width:40px; height:40px;"><img src="cid:${MAIL_ICON_TIMER.cid}" width="20" height="20" alt="" style="display:block;" /></td></tr></table>
</td>
<td style="padding-left:16px; vertical-align:middle;">
<div style="font-size:10px; font-weight:600; letter-spacing:0.04em; text-transform:uppercase; color:#8a94ab;">Invitation expires in</div>
<div style="margin-top:2px; font-size:14px; font-weight:600; color:#0f172a;">${expiryLabel}</div>
</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding:28px 40px 0 40px; text-align:center;">
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
<tr>
<td style="padding:0 8px;">
<a href="${accept_url}" style="display:inline-block; padding:12px 28px; background-color:${BRAND_NAVY}; color:#ffffff; font-size:14px; font-weight:600; text-decoration:none; border-radius:8px;">Accept invitation</a>
</td>
<td style="padding:0 8px;">
<a href="${decline_url}" style="display:inline-block; padding:12px 28px; background-color:#f3f4f6; color:#374151; font-size:14px; font-weight:600; text-decoration:none; border-radius:8px;">Decline</a>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding:18px 40px 0 40px; text-align:center;">
<p style="margin:0; font-size:12px; line-height:18px; color:#9ca3af;">
This invitation will expire in <strong style="color:${BRAND_NAVY};">${expiryLabel}</strong>.
</p>
</td>
</tr>
<tr>
<td style="padding:24px 40px 0 40px;">
<hr style="border:none; border-top:1px solid #e8eaef; margin:0;" />
</td>
</tr>
<tr>
<td style="padding:20px 40px 4px 40px; text-align:center;">
<p style="margin:0; font-size:12px; line-height:18px; color:#9ca3af;">
If the buttons above don't work, or landed in spam, copy and paste this link into your browser:<br />
<a href="${accept_url}" style="color:${BRAND_NAVY}; word-break:break-all;">${accept_url}</a>
</p>
</td>
</tr>
<tr>
<td style="padding:16px 40px 28px 40px; text-align:center;">
<p style="margin:0; font-size:12px; line-height:18px; color:#9ca3af;">
&copy; ${new Date().getFullYear()} ${escapeHtml(systemName)}. If you weren't expecting this invitation, you can safely ignore this email.
</p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>
`.trim();

    const text = [
        `${inviter_name} invited you to join ${organization_name} on ${systemName}${is_admin ? ' as Admin' : ''}.`,
        '',
        `Invited as: ${invitee_email}`,
        `Accept: ${accept_url}`,
        `Decline: ${decline_url}`,
        '',
        `This invitation will expire in ${expiryLabel}.`,
        '',
        `If you weren't expecting this invitation, you can safely ignore this email.`,
    ].join('\n');

    return {
        subject,
        html,
        text,
        inline_images: [
            MAIL_LOGO,
            MAIL_ICON_EMAIL,
            MAIL_ICON_TIMER,
            ...(illustration ? [illustration] : []),
            ...(organization_logo ? [organization_logo] : []),
        ],
    };
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
