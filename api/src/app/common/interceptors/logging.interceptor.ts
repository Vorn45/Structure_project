// ===========================================================================>> Core Library
import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor, } from '@nestjs/common';

// ===========================================================================>> Third Party Library
import { Observable } from 'rxjs';
import { tap }        from 'rxjs/operators';

// ======================================= >> Code Starts Here << ========================== //
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger(LoggingInterceptor.name);

    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const request = context.switchToHttp().getRequest();
        const { method, url } = request;
        const startTime = Date.now();

        return next.handle().pipe(
            tap(() => {
                const response = context.switchToHttp().getResponse();
                const status_code = response.statusCode;
                const duration = Date.now() - startTime;

                this.logger.log(`${method} ${url} - ${status_code} - ${duration}ms`);
            }),
        );
    }
}
