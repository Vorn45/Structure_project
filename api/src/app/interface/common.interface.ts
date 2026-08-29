// ===========================================================================>> Core Library
import { HttpStatus } from '@nestjs/common';

// ===========================================================================>> Third Party Library
import { Response } from 'express';

// ===========================================================================>> Custom Library
// > Local
import { appConfig }       from 'src/app.config';
import { MESSAGE }         from '../enum/message.enum';
import { TelegramService } from '../shared/telegram/telegram.service';
import { ITranslate }      from './data.interface';

// ======================================= >> Code Starts Here << ========================== //
export interface BaseResponse<T = any> {
    status_code: number;
    success: number;
    message: any;
    data?: T;
}

export interface ErrorBaseResponse<T = any> {
    status_code: number;
    success: number;
    message: any;
    data?: T;
    error?: any;
    path: string;
    timestamp: string;
}

export interface ListResponse<T = any> {
    limit: number;
    offset: number;
    total: number;
    meta?: any | undefined;
    results: T[];
}

export interface StreamResponse<T = any> {
    stream_end: number;
    progress: number;
    results: T;
}

// USAGE : return ResponseUtil.success(res, data);
// USAGE : return ResponseUtil.error(res, ERROR_MESSAGE.USER_NOT_FOUND)
export class ResponseUtil {
    static success<T>(
        res: Response,
        data: T,
        message = MESSAGE.SUCCESS,
        status_code = 200,
    ): Response {
        return res.status(status_code).json({
            status_code: status_code,
            success: 1,
            message,
            data,
        });
    }

    static error(
        res: Response,
        message: ITranslate,
        status_code = HttpStatus.BAD_REQUEST,
        error?: any,
    ): Response {
        // SEND LOG TO TELEGRAM
        const telegramService = new TelegramService();
        telegramService
            .sendErrorLog({
                system: appConfig.APP.SYSTEM_NAME,
                environment: appConfig.APP.ENV_LABEL,
                endpoint: res.req.originalUrl || res.req.url,
                method: res.req.method,
                status: status_code,
                error: `${JSON.stringify(message)} - ${JSON.stringify(error)}`,
                ip: ResponseUtil.getClientIp(res),
                device: ResponseUtil.getDevice(res),
            })
            .catch((err) =>
                console.error(
                    'Failed to send error Telegram log',
                    err?.message || err,
                ),
            );

        // Check if error parameter has the expected data structure for consistency
        if (
            error &&
            typeof error === 'object' &&
            'success' in error &&
            'errors' in error &&
            'created_users' in error
        ) {
            return res.status(status_code).json({
                status_code,
                success: 0,
                message,
                data: error,
            });
        }

        return res.status(status_code).json({
            status_code,
            success: 0,
            message,
            error: error || 'Error',
            timestamp: new Date().toISOString(),
        });
    }

    static stream(
        res: Response,
        param: {
            status_code?: number;
            success?: number;
            message?: string;
            data?: StreamResponse;
        },
    ) {
        const responseData = {
            status_code: param.status_code || 200,
            success: param.success || 1,
            message: param.message || null,
            data: param.data || {},
        } as BaseResponse;

        res.write(`data: ${JSON.stringify(responseData)}\n\n`);
    }

    static streamResponse(
        res: Response,
        progress = 0,
        results: any = null,
        stream_end = 0,
    ) {
        const data = {
            stream_end: stream_end,
            progress: progress,
            results: results,
        } as StreamResponse;

        ResponseUtil.stream(res, { data });
    }

    private static getClientIp(res: Response): string {
        const forwardedFor = res.req.headers['x-forwarded-for'];
        if (Array.isArray(forwardedFor)) return forwardedFor[0] || 'Unknown';
        if (typeof forwardedFor === 'string')
            return forwardedFor.split(',')[0]?.trim() || 'Unknown';

        return res.req.ip || res.req.socket?.remoteAddress || 'Unknown';
    }

    private static getDevice(res: Response): string {
        const userAgent = res.req.headers['user-agent'] || '';
        if (/mobile|android|iphone|ipad/i.test(String(userAgent)))
            return 'Mobile';
        return 'Web';
    }
}
