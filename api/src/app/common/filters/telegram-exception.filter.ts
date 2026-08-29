// ===========================================================================>> Core Library
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Injectable, Logger, } from '@nestjs/common';

// ===========================================================================>> Third Party Library
import { Request, Response } from 'express';

// ===========================================================================>> Custom Library
// > Local
import { appConfig }       from 'src/app.config';
import { TelegramService } from 'src/app/shared/telegram/telegram.service';

// ======================================= >> Code Starts Here << ========================== //
@Catch()
@Injectable()
export class TelegramExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(TelegramExceptionFilter.name);

    constructor(private readonly telegramService: TelegramService) {}

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const request = ctx.getRequest<Request>();
        const response = ctx.getResponse<Response>();
        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const responseBody = this.getResponseBody(exception, status);
        if (!(exception instanceof HttpException)) {
            const stack =
                exception instanceof Error
                    ? exception.stack
                    : String(exception);
            this.logger.error(
                `${request.method || 'Unknown'} ${request.originalUrl || request.url || 'Unknown'}`,
                stack,
            );
        }

        this.telegramService
            .sendErrorLog({
                system: appConfig.APP.SYSTEM_NAME,
                environment: appConfig.APP.ENV_LABEL,
                endpoint: request.originalUrl || request.url || 'Unknown',
                method: request.method || 'Unknown',
                status,
                error: this.getLogErrorMessage(exception, responseBody),
                ip: this.getClientIp(request),
                device: this.getDevice(request),
            })
            .catch((err) =>
                console.error(
                    'Failed to send error Telegram log',
                    err?.message || err,
                ),
            );

        if (!response.headersSent) {
            response.status(status).json(responseBody);
        }
    }

    private getResponseBody(
        exception: unknown,
        status: number,
    ): Record<string, any> {
        if (exception instanceof HttpException) {
            const body = exception.getResponse();
            return typeof body === 'string'
                ? { statusCode: status, message: body }
                : (body as Record<string, any>);
        }

        const message =
            appConfig.APP.ENV === 'production'
                ? 'An unexpected server error occurred. Please try again or contact support.'
                : this.getUnexpectedErrorMessage(exception);

        return {
            statusCode: status,
            message,
        };
    }

    private getUnexpectedErrorMessage(exception: unknown): string {
        if (exception instanceof Error && exception.message) {
            return `Unexpected server error: ${exception.message}`;
        }

        return 'An unexpected server error occurred. Please try again or contact support.';
    }

    private getLogErrorMessage(
        exception: unknown,
        responseBody: Record<string, any>,
    ): string {
        if (exception instanceof Error && exception.message)
            return exception.message;
        return this.getErrorMessage(responseBody);
    }

    private getErrorMessage(responseBody: Record<string, any>): string {
        const message =
            responseBody.message ?? responseBody.error ?? 'Unknown error';
        return Array.isArray(message) ? message.join(', ') : String(message);
    }

    private getClientIp(request: Request): string {
        const forwardedFor = request.headers['x-forwarded-for'];
        if (Array.isArray(forwardedFor)) return forwardedFor[0] || 'Unknown';
        if (typeof forwardedFor === 'string')
            return forwardedFor.split(',')[0]?.trim() || 'Unknown';

        return request.ip || request.socket?.remoteAddress || 'Unknown';
    }

    private getDevice(request: Request): string {
        const userAgent = request.headers['user-agent'] || '';
        if (/mobile|android|iphone|ipad/i.test(String(userAgent)))
            return 'Mobile';
        return 'Web';
    }
}
