import {
    HttpContext,
    HttpContextToken,
    HttpErrorResponse,
    HttpEvent,
    HttpHandlerFn,
    HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AuthService } from 'app/core/auth/auth.service';
import { AuthUtils } from 'app/core/auth/auth.utils';
import { DialogConfigService } from 'app/shared/dialog-config.service';
import { HttpErrorDialogComponent } from 'app/shared/error/http-error-dialog.component';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { env } from 'envs/env';

// Marks a request that already went through one refresh-and-retry cycle,
// so a 401 on the retried request signs the user out instead of looping.
const IS_RETRY_AFTER_REFRESH = new HttpContextToken<boolean>(() => false);

// Auth endpoints must never trigger a refresh attempt.
const isAuthEndpoint = (url: string): boolean =>
    ['/auth/login', '/auth/mini-app', '/auth/otp', '/auth/refresh', '/auth/resend-otp', '/verify-otp'].some(
        (path) => url.includes(path)
    );

// signOut() itself fires this DELETE (fire-and-forget) to unregister the FCM
// token. If the session is already expired, that request 401s too — it must
// not trigger another signOut(), or the two cascade into repeated sign-outs
// and repeated (redundant) DELETE calls.
const isFcmTokenEndpoint = (url: string): boolean => url.includes('/shared/notification/fcm-token');

// OTP verification endpoints that handle error messages directly without global modal
const isOtpEndpoint = (url: string): boolean =>
    ['/auth/otp', '/signup-verify-otp', '/verify-reset-otp', '/verify-otp'].some(
        (path) => url.includes(path)
    );

// Backend error messages arrive in English only; translate the ones we know
// how to show in the global error dialog rather than leaking raw English.
const KNOWN_ERROR_MESSAGES_KH: Record<string, string> = {
    'This task is completed and can no longer be edited': 'ការងារនេះបានបញ្ចប់ ហើយមិនអាចកែប្រែបានទៀតទេ',
};

const translateServerMessage = (message: string | undefined): string | undefined =>
    message ? (KNOWN_ERROR_MESSAGES_KH[message] ?? message) : message;

/**
 * Intercept
 *
 * @param req
 * @param next
 */
export const authInterceptor = (
    req: HttpRequest<unknown>,
    next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
    const authService = inject(AuthService);
    const dialog = inject(MatDialog);
    const dialogConfig = inject(DialogConfigService);
    const router = inject(Router);

    const addToken = (
        request: HttpRequest<unknown>,
        token: string
    ): HttpRequest<unknown> =>
        request.clone({
            headers: request.headers.set('Authorization', 'Bearer ' + token),
        });

    // Request
    //
    // If the access token didn't expire, add the Authorization header.
    // We won't add the Authorization header if the access token expired.
    // This will force the server to return a "401 Unauthorized" response
    // for the protected API routes which our response interceptor will
    // catch and use the refresh token to obtain a new access token.
    let newReq = req.clone({
        withCredentials: req.url.startsWith(env.API_BASE_URL),
    });
    if(
        authService.accessToken &&
        !AuthUtils.isTokenExpired(authService.accessToken)
    ) {
        newReq = addToken(newReq, authService.accessToken);
    }

    // Response
    return next(newReq).pipe(
        catchError((error) => {
            const isRetry = req.context.get(IS_RETRY_AFTER_REFRESH);

            // Catch "401 Unauthorized" responses: try to refresh the access
            // token once and replay the original request before giving up.
            if (
                error instanceof HttpErrorResponse &&
                error.status === 401 &&
                !isRetry &&
                !isAuthEndpoint(req.url) &&
                !isFcmTokenEndpoint(req.url) &&
                authService.hasRefreshSession
            ) {
                return authService.refreshAccessToken().pipe(
                    switchMap((response) => {
                        const retryReq = addToken(req, response.token).clone({
                            withCredentials: req.url.startsWith(env.API_BASE_URL),
                            context: new HttpContext().set(
                                IS_RETRY_AFTER_REFRESH,
                                true
                            ),
                        });
                        return next(retryReq);
                    }),
                    catchError((refreshError) => {
                        authService.signOut();
                        router.navigateByUrl('/auth/sign-in');
                        return throwError(() => refreshError);
                    })
                );
            }

            // Catch "401 Unauthorized" responses
            if (
                error instanceof HttpErrorResponse &&
                error.status === 401 &&
                !isAuthEndpoint(req.url) &&
                !isFcmTokenEndpoint(req.url)
            ) {
                authService.signOut();
                router.navigateByUrl('/auth/sign-in');
            }

            if (
                error instanceof HttpErrorResponse &&
                [403, 500].includes(error.status) &&
                !isOtpEndpoint(req.url) &&
                !dialog.getDialogById('http-error-dialog')
            ) {
                // Prefer the server's own message (e.g. "This task is completed and
                // can no longer be edited") over the generic fallback text, translated
                // to Khmer when we recognize it.
                const serverMessage: string | undefined =
                    typeof error.error?.message === 'string' ? error.error.message : undefined;
                const config = dialogConfig.getCenterDialogConfig(
                    { status: error.status, description: translateServerMessage(serverMessage) },
                    '520px'
                );
                config.id = 'http-error-dialog';
                config.maxWidth = 'calc(100vw - 2rem)';

                dialog.open(HttpErrorDialogComponent, config);
            }

            return throwError(() => error);
        })
    );
};
