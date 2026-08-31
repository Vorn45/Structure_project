import * as dotenv from 'dotenv';

dotenv.config();

const toNumber = (value: string | undefined, fallback: number): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const toBoolean = (value: string | undefined): boolean =>
    value?.trim().toLowerCase() === 'true';

const nodeEnv = process.env.NODE_ENV ?? 'development';

// Splits a comma-separated env value into a trimmed string array; a single
// value stays a plain string so existing single-origin configs keep working.
const toStringOrList = (value: string | undefined): string | string[] => {
    const parts = (value ?? '')
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);
    return parts.length > 1 ? parts : parts[0] || '';
};

const toList = (value: string | undefined): string[] =>
    (value ?? '')
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);

export const appConfig = {
    APP: {
        ENV: nodeEnv,
        SYSTEM_NAME: process.env.SYSTEM_NAME?.trim() || 'NexTask',
        ENV_LABEL: process.env.ENVIRONMENT?.trim() || nodeEnv.toUpperCase(),
        PORT: toNumber(process.env.PORT, 3000),
        GLOBAL_PREFIX: process.env.GLOBAL_PREFIX ?? 'api',
        VERSION: process.env.VERSION ?? 'v1.0.0',
        TRUST_PROXY: process.env.TRUST_PROXY?.trim() || '',
        FRONTEND_URL: (process.env.FRONTEND_URL?.trim() || '').replace(
            /\/+$/,
            '',
        ),
        PUBLIC_URL: (process.env.PUBLIC_URL?.trim() || '').replace(/\/+$/, ''),
        SESSION_SECRET:
            process.env.SESSION_SECRET_KEY?.trim() ||
            process.env.SESSION_SECRET?.trim() ||
            (nodeEnv === 'production'
                ? ''
                : 'local-development-session-secret'),
    },
    AUTH: {
        JWT_SECRET: process.env.JWT_SECRET ?? '',
        JWT_EXPIRES_IN: process.env.JWT_EXPIRES ?? '15m',
        JWT_REFRESH_SECRET:
            process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET ?? '',
        JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES ?? '7d',
        REFRESH_TOKEN_ABSOLUTE_DAYS: toNumber(
            process.env.REFRESH_TOKEN_ABSOLUTE_DAYS,
            30,
        ),
        REFRESH_TOKEN_IDLE_DAYS: toNumber(
            process.env.REFRESH_TOKEN_IDLE_DAYS,
            7,
        ),
        MCP_API_KEY_DEFAULT_DAYS: toNumber(
            process.env.MCP_API_KEY_DEFAULT_DAYS,
            90,
        ),
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID?.trim() || '',
        // CDC SSO (Keycloak) federated login. ISSUER_URL is the realm URL that
        // Keycloak stamps as the token `iss` claim (must match exactly). The
        // realm's RS256 public key is fetched from ISSUER_URL to verify tokens.
        // CLIENT_ID is the Keycloak client the frontend logs in with; incoming
        // tokens must carry it in `azp`/`aud` (comma-separated list allowed).
        SSO_ISSUER_URL:
            (process.env.SSO_ISSUER_URL?.trim() || '').replace(/\/+$/, ''),
        SSO_CLIENT_ID: process.env.SSO_CLIENT_ID?.trim() || '',
        SSO_ALLOWED_AUD: toList(
            process.env.SSO_ALLOWED_AUD ?? process.env.SSO_CLIENT_ID,
        ),
        TELEGRAM_LOGIN_ENABLED: toBoolean(process.env.TELEGRAM_LOGIN),
        TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN?.trim() || '',
        TELEGRAM_BOT_USERNAME:
            process.env.TELEGRAM_LOGIN_USERNAME?.trim() || '',
        TELEGRAM_WEBHOOK_TOKEN:
            process.env.TELEGRAM_WEBHOOK_TOKEN?.trim() || '',
        CREDENTIAL_ENCRYPTION_KEY:
            process.env.CREDENTIAL_ENCRYPTION_KEY?.trim() || '',
        // WebAuthn/passkey. RP_ID is the bare effective domain (no scheme/port)
        // credentials are bound to — must match the hostname the frontend is
        // actually served from in every environment, or verification fails.
        // Both support comma-separated lists, index-aligned with each other
        // (e.g. "a.com,b.com" + "https://a.com,https://b.com"), to support
        // multiple unrelated frontend domains at once. verify*Response() gets
        // the full list so it accepts credentials from any of them.
        // generate*Options() needs exactly one RP ID matching the caller's
        // actual origin (the browser rejects any other) — see
        // resolveWebauthnRp() below, used by the passkey services per-request.
        WEBAUTHN_RP_ID: toStringOrList(process.env.WEBAUTHN_RP_ID),
        WEBAUTHN_RP_ID_PRIMARY:
            (process.env.WEBAUTHN_RP_ID?.trim() || '').split(',')[0]?.trim() ||
            '',
        WEBAUTHN_RP_IDS: toList(process.env.WEBAUTHN_RP_ID),
        WEBAUTHN_RP_NAME: process.env.WEBAUTHN_RP_NAME?.trim() || '',
        WEBAUTHN_ORIGIN: toStringOrList(
            process.env.WEBAUTHN_ORIGIN?.trim() ||
                (process.env.FRONTEND_URL?.trim() || '').replace(/\/+$/, '') ||
                'http://localhost:4002',
        ),
        WEBAUTHN_ORIGINS: toList(
            process.env.WEBAUTHN_ORIGIN?.trim() ||
                (process.env.FRONTEND_URL?.trim() || '').replace(/\/+$/, '') ||
                'http://localhost:4002',
        ),
    },
    OTP: {
        SMS_API_URL: process.env.OTP_SMS_API_URL?.trim() || '',
        SMS_API_TOKEN: process.env.OTP_SMS_API_TOKEN?.trim() || '',
    },
    SES: {
        SMTP_HOST: process.env.SES_SMTP_HOST?.trim() || '',
        SMTP_PORT: toNumber(process.env.SES_SMTP_PORT, 465),
        SMTP_USERNAME: process.env.SES_SMTP_USERNAME?.trim() || '',
        SMTP_PASSWORD: process.env.SES_SMTP_PASSWORD?.trim() || '',
        FROM: process.env.SES_FROM_EMAIL?.trim() || '',
    },
    DATABASE: {
        URL: process.env.DATABASE_URL || process.env.DB_URL || '',
        HOST: process.env.DB_HOST,
        PORT: toNumber(process.env.DB_PORT, 5432),
        USERNAME: process.env.DB_USERNAME,
        PASSWORD: process.env.DB_PASSWORD,
        NAME: process.env.DB_NAME ?? process.env.DB_DATABASE,
        SYNCHRONIZE: (process.env.DB_SYNCHRONIZE ?? 'true') === 'true',
        SSL:
            (process.env.DB_SSL ?? 'false') === 'true' ||
            Boolean(
                (process.env.DATABASE_URL || process.env.DB_URL || '').includes(
                    'render.com',
                ),
            ),
    },
    REDIS: {
        HOST: process.env.REDIS_HOST ?? 'localhost',
        PORT: toNumber(process.env.REDIS_PORT, 6379),
    },
    FILE: {
        BASE_URL: process.env.FILE_BASE_URL ?? '',
        UPLOAD_MAX_SIZE_MB: toNumber(process.env.FILE_UPLOAD_MAX_SIZE_MB, 25),
        UPLOAD_MAX_FILES: toNumber(process.env.FILE_UPLOAD_MAX_FILES, 10),
    },
    TASK: {
        // Project every "Report Bug" submission (Profile > Report Bug) is created
        // in, regardless of the reporter's own org/project membership — see PMS-536.
        BUG_REPORT_PROJECT_ID:
            process.env.BUG_REPORT_PROJECT_ID?.trim() ||
            'd269fad1-2305-4a2f-8d35-48d2891e3341',
    },
    ORGANIZATION_LOG: {
        TELEGRAM_BOT_TOKEN:
            process.env.ORGANIZATION_LOG_TELEGRAM_BOT_TOKEN?.trim() || '',
        TELEGRAM_CHAT_ID:
            process.env.ORGANIZATION_LOG_TELEGRAM_CHAT_ID?.trim() || '',
    },
    JS_REPORT: {
        BASE_URL: process.env.JS_BASE_URL?.trim() || '',
        USERNAME: process.env.JS_USERNAME?.trim() || '',
        PASSWORD: process.env.JS_PASSWORD?.trim() || '',
        TEMPLATE: {
            ORGANIZATION_MEMBER_LIST_PDF:
                process.env.JS_TEMPLATE_ORGANIZATION_MEMBER_LIST_PDF?.trim() ||
                'organization_member',
            ORGANIZATION_MEMBER_LIST_EXCEL:
                process.env.JS_TEMPLATE_ORGANIZATION_MEMBER_LIST_EXCEL?.trim() ||
                'organization_member_excel',
            INVITATION_QR_PDF:
                process.env.JS_TEMPLATE_INVITATION_QR_PDF?.trim() ||
                'organization_invitation_qr',
            SUP_ADMIN_USER_LIST_PDF:
                process.env.JS_TEMPLATE_SUP_ADMIN_USER_LIST_PDF?.trim() ||
                'sup_admin_user',
            SUP_ADMIN_USER_LIST_EXCEL:
                process.env.JS_TEMPLATE_SUP_ADMIN_USER_LIST_EXCEL?.trim() ||
                'sup_admin_user_excel',
            PLAN_TASK_LIST_PDF:
                process.env.JS_TEMPLATE_PLAN_TASK_LIST_PDF?.trim() ||
                'project_task',
            PLAN_TASK_LIST_EXCEL:
                process.env.JS_TEMPLATE_PLAN_TASK_LIST_EXCEL?.trim() ||
                'project_task_excel',
            PROJECT_COMPARATION_PDF:
                process.env.JS_TEMPLATE_PROJECT_COMPARATION_PDF?.trim() ||
                'project_comparation',
            PROJECT_COMPARATION_EXCEL:
                process.env.JS_TEMPLATE_PROJECT_COMPARATION_EXCEL?.trim() ||
                'project_comparation_excel',
            PROJECT_MEMBER_PDF:
                process.env.JS_TEMPLATE_PROJECT_MEMBER_PDF?.trim() ||
                'project_member',
            PROJECT_MEMBER_EXCEL:
                process.env.JS_TEMPLATE_PROJECT_MEMBER_EXCEL?.trim() ||
                'project_member_excel',
            ACTIVITY_LIST_PDF:
                process.env.JS_TEMPLATE_ACTIVITY_LIST_PDF?.trim() ||
                'project_activity_listing',
            SCOPE_ROLE_PDF:
                process.env.JS_TEMPLATE_SCOPE_ROLE_PDF?.trim() ||
                'project_scope',
        },
    },
    GIF: {
        PROVIDER: process.env.GIF_PROVIDER?.trim().toLowerCase() || 'auto',
        KLIPY_API_KEY: process.env.KLIPY_API_KEY?.trim() || '',
        KLIPY_CONTENT: process.env.KLIPY_CONTENT?.trim().toLowerCase() || 'gifs',
        KLIPY_HOURLY_LIMIT: toNumber(process.env.KLIPY_HOURLY_LIMIT, 90),
        GIPHY_API_KEY: process.env.GIPHY_API_KEY?.trim() || '',
    },
    FIREBASE: {
        PROJECT_ID: process.env.FIREBASE_PROJECT_ID?.trim() || '',
        CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL?.trim() || '',
        PRIVATE_KEY: (process.env.FIREBASE_PRIVATE_KEY ?? '').replace(
            /\\n/g,
            '\n',
        ),
        // Public Web SDK config — safe to expose to clients via the
        // /notification/firebase-config endpoint (identifies the project,
        // does not grant any privileged access).
        WEB: {
            API_KEY: process.env.FIREBASE_WEB_API_KEY?.trim() || '',
            AUTH_DOMAIN: process.env.FIREBASE_WEB_AUTH_DOMAIN?.trim() || '',
            STORAGE_BUCKET:
                process.env.FIREBASE_WEB_STORAGE_BUCKET?.trim() || '',
            MESSAGING_SENDER_ID:
                process.env.FIREBASE_WEB_MESSAGING_SENDER_ID?.trim() || '',
            APP_ID: process.env.FIREBASE_WEB_APP_ID?.trim() || '',
            VAPID_KEY: process.env.FIREBASE_WEB_VAPID_KEY?.trim() || '',
        },
    },
    CORS: {
        ORIGINS: [
            'http://127.0.0.1',
            'http://localhost',
            'http://127.0.0.1:4002',
            'http://localhost:4002',
            'http://127.0.0.1:4200',
            'http://localhost:4200',
            'http://localhost:3000',
            'http://localhost:4444',
            'https://app.nextask.digital',
            'https://structure-project-ten.vercel.app',
        ],
    },
} as const;

export type AppConfig = typeof appConfig;

/**
 * Picks the WebAuthn RP ID/origin pair matching the caller's actual origin.
 * The browser only accepts an rpID equal to (or a registrable suffix of) the
 * origin it's running on, so generate*Options() can't use one static RP ID
 * once multiple unrelated frontend domains are configured. Falls back to the
 * primary (first configured) pair when the request's Origin header is
 * missing or doesn't match any configured origin.
 */
export const resolveWebauthnRp = (
    requestOrigin: string | undefined,
): { rpID: string; origin: string } => {
    const index = requestOrigin
        ? appConfig.AUTH.WEBAUTHN_ORIGINS.indexOf(requestOrigin)
        : -1;
    if (index !== -1 && appConfig.AUTH.WEBAUTHN_RP_IDS[index]) {
        return {
            rpID: appConfig.AUTH.WEBAUTHN_RP_IDS[index],
            origin: appConfig.AUTH.WEBAUTHN_ORIGINS[index],
        };
    }
    return {
        rpID: appConfig.AUTH.WEBAUTHN_RP_ID_PRIMARY,
        origin: appConfig.AUTH.WEBAUTHN_ORIGINS[0],
    };
};
