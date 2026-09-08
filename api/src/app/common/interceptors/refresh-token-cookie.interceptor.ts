// ===========================================================================>> Core Library
import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';

// ===========================================================================>> Third Party Library
import type { Request, Response } from 'express';
import { Observable, map } from 'rxjs';

// ===========================================================================>> Custom Library
import { appConfig } from 'src/app.config';
import {
    isAllowedOrigin,
    setRefreshTokenCookie,
} from '../utils/refresh-token-cookie.util';

// ======================================= >> Code Starts Here << ========================== //
@Injectable()
export class RefreshTokenCookieInterceptor implements NestInterceptor {
    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<unknown> {
        const http = context.switchToHttp();
        const req = http.getRequest<Request>();
        const res = http.getResponse<Response>();

        return next.handle().pipe(
            map((body: unknown) => {
                if (!body || typeof body !== 'object') return body;

                const response = body as Record<string, unknown>;
                const refreshToken = response.refresh_token;
                if (
                    typeof refreshToken !== 'string' ||
                    !refreshToken.startsWith('pms_rt_')
                ) {
                    return body;
                }

                setRefreshTokenCookie(res, refreshToken);

                // In production, browser callers keep the credential out of JavaScript.
                // In development / non-production, keep refresh_token in the response so
                // cross-port local development (e.g. localhost:4200 -> localhost:3000)
                // has a reliable fallback when browsers block cross-origin SameSite=lax cookies.
                const origin = req.headers.origin;
                if (
                    appConfig.APP.ENV === 'production' &&
                    origin &&
                    isAllowedOrigin(origin)
                ) {
                    const browserResponse = { ...response };
                    delete browserResponse.refresh_token;
                    return browserResponse;
                }

                return body;
            }),
        );
    }
}
