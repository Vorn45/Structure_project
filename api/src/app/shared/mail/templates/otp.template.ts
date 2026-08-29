// ===========================================================================>> Custom Library
// > Local
import { appConfig }                                     from 'src/app.config';
import { OtpPurpose }                                    from 'src/app/enum/otp-channel.enum';
import { SesInlineImage }                                from 'src/app/shared/mail/ses.service';
import { MAIL_ICON_EMAIL, MAIL_ICON_TIMER, MAIL_LOGO } from 'src/app/shared/mail/templates/mail-assets';

// ======================================= >> Code Starts Here << ========================== //
export interface OtpEmailData {
    otp: string;
    email: string;
    expires_in_minutes: number;
    purpose?: OtpPurpose;
}

export interface OtpEmailContent {
    subject: string;
    html: string;
    text: string;
    inline_images: SesInlineImage[];
}

const BRAND_NAVY = '#1c2978';
const BRAND_NAVY_TINT = 'rgba(28,41,120,0.07)';
const BRAND_NAVY_TINT_BORDER = 'rgba(28,41,120,0.12)';
const FONT_STACK = `'Kantumruy Pro', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`;

/**
 * The same code email backs sign-in, password reset and sign-up, so the copy
 * has to name the right action — telling someone resetting their password to
 * "continue signing in" is both confusing and a phishing smell.
 */
function copyFor(purpose: OtpPurpose, systemName: string) {
    switch (purpose) {
        case OtpPurpose.FORGOT_PASSWORD:
            return {
                headline: 'Reset your',
                headlineAccent: 'password',
                intro: `use the verification code below to reset your <strong>${escapeHtml(systemName)}</strong> password.`,
                note: `Enter this code on the password reset screen to choose a new password.`,
                textIntro: `Use the verification code below to reset your ${systemName} password.`,
            };
        case OtpPurpose.SIGNUP:
            return {
                headline: 'Verify your',
                headlineAccent: 'email address',
                intro: `use the verification code below to finish creating your <strong>${escapeHtml(systemName)}</strong> account.`,
                note: `Enter this code on the sign-up screen to finish creating your account.`,
                textIntro: `Use the verification code below to finish creating your ${systemName} account.`,
            };
        case OtpPurpose.CHANGE_EMAIL:
            return {
                headline: 'Confirm your',
                headlineAccent: 'new email',
                intro: `use the verification code below to confirm this email for your <strong>${escapeHtml(systemName)}</strong> account.`,
                note: `Enter this code on the profile screen to update your email address.`,
                textIntro: `Use the verification code below to confirm this email for your ${systemName} account.`,
            };
        case OtpPurpose.CHANGE_PHONE:
            return {
                headline: 'Confirm your',
                headlineAccent: 'profile change',
                intro: `use the verification code below to confirm your <strong>${escapeHtml(systemName)}</strong> profile change.`,
                note: `Enter this code on the profile screen to finish updating your phone number.`,
                textIntro: `Use the verification code below to confirm your ${systemName} profile change.`,
            };
        case OtpPurpose.VERIFY_CHANNEL:
            return {
                headline: 'Verify your',
                headlineAccent: '2FA delivery address',
                intro: `use the verification code below to confirm this address as a two-factor authentication (2FA) delivery channel for your <strong>${escapeHtml(systemName)}</strong> account.`,
                note: `Enter this code on the security screen to finish enabling this 2FA channel. Your account login email stays unchanged.`,
                textIntro: `Use the verification code below to confirm this address as a two-factor authentication (2FA) delivery channel for your ${systemName} account.`,
            };
        case OtpPurpose.RESET_PASSCODE:
            return {
                headline: 'Reset your',
                headlineAccent: 'local passcode',
                intro: `use the verification code below to reset the local passcode on your <strong>${escapeHtml(systemName)}</strong> device lock.`,
                note: `Enter this code on the lock screen to set a new local passcode.`,
                textIntro: `Use the verification code below to reset the local passcode on your ${systemName} device lock.`,
            };
        default:
            return {
                headline: "Verify it's you",
                headlineAccent: 'to continue',
                intro: `use the verification code below to continue signing in to <strong>${escapeHtml(systemName)}</strong>.`,
                note: `Enter this code on the verification screen to continue signing in to ${escapeHtml(systemName)}.`,
                textIntro: `Use the verification code below to continue signing in to ${systemName}.`,
            };
    }
}

export function buildOtpEmail(data: OtpEmailData): OtpEmailContent {
    const systemName = appConfig.APP.SYSTEM_NAME;
    const { otp, email, expires_in_minutes, purpose = OtpPurpose.LOGIN } = data;
    const copy = copyFor(purpose, systemName);

    const subject = `${otp} is your ${systemName} verification code`;
    const expiryLabel = `${expires_in_minutes} minute${expires_in_minutes === 1 ? '' : 's'}`;

    // margin auto as well as the cell's text-align: a display:block image is
    // not centred by text-align alone.
    const logoHtml = `<img src="cid:${MAIL_LOGO.cid}" alt="${escapeHtml(systemName)}" height="56" style="display:block; height:56px; width:auto; margin:0 auto;" />`;

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
<td align="center" style="padding:20px 40px 0 40px; text-align:center; line-height:0;">
${logoHtml}
</td>
</tr>
<tr>
<td style="padding:16px 40px 0 40px; text-align:left;">
<h1 style="margin:0; font-size:24px; line-height:32px; font-weight:600; color:#0f172a; text-align:center;">${copy.headline} <span style="color:${BRAND_NAVY};">${copy.headlineAccent}</span></h1>
<p style="margin:16px 0 0 0; font-size:14px; line-height:22px; color:#6b7280;">
Hi there,<br />
${copy.intro}
</p>
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
<div style="font-size:10px; font-weight:600; letter-spacing:0.04em; text-transform:uppercase; color:#8a94ab;">Account</div>
<div style="margin-top:2px; font-size:14px; font-weight:600; color:#0f172a;">${escapeHtml(email)}</div>
</td>
</tr>
<tr><td colspan="2" style="padding-top:12px;"></td></tr>
<tr>
<td width="40" style="vertical-align:top;">
<table role="presentation" cellpadding="0" cellspacing="0" width="40" height="40" style="background-color:${BRAND_NAVY_TINT}; border:1px solid ${BRAND_NAVY_TINT_BORDER}; border-radius:8px;"><tr><td align="center" valign="middle" style="width:40px; height:40px;"><img src="cid:${MAIL_ICON_TIMER.cid}" width="20" height="20" alt="" style="display:block;" /></td></tr></table>
</td>
<td style="padding-left:16px; vertical-align:middle;">
<div style="font-size:10px; font-weight:600; letter-spacing:0.04em; text-transform:uppercase; color:#8a94ab;">Code expires in</div>
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
<td style="padding:24px 40px 0 40px; text-align:center;">
<div style="padding:16px 24px; background-color:${BRAND_NAVY}; color:#ffffff; font-size:32px; font-weight:700; letter-spacing:10px; border-radius:8px; font-family:'Courier New', monospace;">${escapeHtml(otp)}</div>
</td>
</tr>
<tr>
<td style="padding:16px 40px 0 40px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND_NAVY_TINT}; border-radius:8px;">
<tr>
<td style="padding:13px 16px; font-size:12px; line-height:18px; color:#5b6472;">
${copy.note}
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding:18px 40px 0 40px; text-align:center;">
<p style="margin:0; font-size:12px; line-height:18px; color:#9ca3af;">
For your security, this code will expire in <strong style="color:${BRAND_NAVY};">${expiryLabel}</strong>. Never share it with anyone.
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
<p style="margin:0; font-size:12px; color:#9ca3af;">
Help Center&nbsp;&nbsp;|&nbsp;&nbsp;Contact Support&nbsp;&nbsp;|&nbsp;&nbsp;Terms
</p>
</td>
</tr>
<tr>
<td style="padding:16px 40px 28px 40px; text-align:center;">
<p style="margin:0; font-size:12px; line-height:18px; color:#9ca3af;">
&copy; ${new Date().getFullYear()} ${escapeHtml(systemName)}. If you didn't request this code, you can safely ignore this email.
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
        copy.textIntro,
        '',
        `Account: ${email}`,
        `Verification code: ${otp}`,
        `Expires in: ${expiryLabel}`,
        '',
        `For your security, never share this code with anyone. If you didn't request it, you can safely ignore this email.`,
    ].join('\n');

    return {
        subject,
        html,
        text,
        inline_images: [MAIL_LOGO, MAIL_ICON_EMAIL, MAIL_ICON_TIMER],
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
