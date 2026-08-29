// ===========================================================================>> Third Party Library
import type { Request, Response } from 'express';

// ===========================================================================>> Custom Library
import { appConfig } from 'src/app.config';

// ======================================= >> Code Starts Here << ========================== //
const COOKIE_NAME =
    appConfig.APP.ENV === 'production' ? '__Host-pms_refresh' : 'pms_refresh';
// The __Host- prefix requires Path=/ and forbids Domain. The cookie remains
// HttpOnly and is only read by the refresh endpoint.
const COOKIE_PATH = '/';

export function setRefreshTokenCookie(res: Response, token: string): void {
    res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: appConfig.APP.ENV === 'production',
        sameSite: 'lax',
        path: COOKIE_PATH,
        maxAge:
            appConfig.AUTH.REFRESH_TOKEN_ABSOLUTE_DAYS * 24 * 60 * 60 * 1000,
    });
}

export function clearRefreshTokenCookie(res: Response): void {
    res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: appConfig.APP.ENV === 'production',
        sameSite: 'lax',
        path: COOKIE_PATH,
    });
}

export function readRefreshTokenCookie(req: Request): string | undefined {
    const origin = req.headers.origin;
    if (origin && !isAllowedOrigin(origin)) return undefined;

    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return undefined;

    for (const part of cookieHeader.split(';')) {
        const separator = part.indexOf('=');
        if (separator < 0) continue;
        const name = part.slice(0, separator).trim();
        if (name !== COOKIE_NAME) continue;

        try {
            return decodeURIComponent(part.slice(separator + 1).trim());
        } catch {
            return undefined;
        }
    }

    return undefined;
}

export function isAllowedOrigin(origin: string): boolean {
    const configured = new Set([
        ...appConfig.CORS.ORIGINS,
        ...(appConfig.APP.FRONTEND_URL ? [appConfig.APP.FRONTEND_URL] : []),
    ]);
    return configured.has(origin.replace(/\/+$/, ''));
}
