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

                // Browser callers keep the credential out of JavaScript. API,
                // mobile and CLI clients without an Origin header retain the
                // response field for backwards compatibility.
                const origin = req.headers.origin;
                if (!origin || !isAllowedOrigin(origin)) return body;

                const browserResponse = { ...response };
                delete browserResponse.refresh_token;
                return browserResponse;
            }),
        );
    }
}
