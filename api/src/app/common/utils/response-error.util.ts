// ===========================================================================>> Core Library
import { HttpException, HttpStatus } from '@nestjs/common';

// ===========================================================================>> Third Party Library
import express from 'express';

// ===========================================================================>> Custom Library
// > Local
import { ITranslate }   from 'src/app/interface/data.interface';
import { ResponseUtil } from 'src/app/interface/common.interface';

// ======================================= >> Code Starts Here << ========================== //
export function handleServiceError(res: express.Response, error: any) {
    const status_code =
        error instanceof HttpException
            ? error.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;
    const response =
        error instanceof HttpException ? error.getResponse() : null;
    const rawMessage =
        (response && typeof response === 'object' && 'message' in response
            ? (response as any).message
            : error?.message) || 'Error';
    const message: ITranslate =
        rawMessage && typeof rawMessage === 'object'
            ? rawMessage
            : { name_en: rawMessage, name_kh: rawMessage };

    return ResponseUtil.error(res, message, status_code, error);
}
