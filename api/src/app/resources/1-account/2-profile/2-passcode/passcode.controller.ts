// ===========================================================================>> Core Library
import { Body, Controller, Delete, Get, Post, Put, Res, ValidationPipe, } from '@nestjs/common';

// ===========================================================================>> Third Party Library
import express from 'express';

// ===========================================================================>> Custom Library
// > Local
import {
    DisablePasscodeDto,
    RequestPasscodeResetOtpDto,
    SetPasscodeDto,
    UpdateIdleTimeoutDto,
    VerifyPasscodeDto,
    VerifyPasscodeResetOtpDto,
} from './passcode.dto';
import { PasscodeService } from './passcode.service';

// ======================================= >> Code Starts Here << ========================== //
@Controller('local-passcode')
export class PasscodeController {
    constructor(private readonly _service: PasscodeService) {}

    @Get()
    async getStatus(@Res({ passthrough: true }) res: express.Response) {
        return await this._service.getStatus(res.locals.user);
    }

    @Post()
    async setPasscode(
        @Body(new ValidationPipe()) dto: SetPasscodeDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.setPasscode(res.locals.user, dto);
    }

    @Put('idle-timeout')
    async updateIdleTimeout(
        @Body(new ValidationPipe()) dto: UpdateIdleTimeoutDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.updateIdleTimeout(res.locals.user, dto);
    }

    @Post('verify')
    async verify(
        @Body(new ValidationPipe()) dto: VerifyPasscodeDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.verify(res.locals.user, dto);
    }

    @Delete()
    async disable(
        @Body(new ValidationPipe()) dto: DisablePasscodeDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.disable(res.locals.user, dto);
    }

    @Post('reset/send-otp')
    async requestResetOtp(
        @Body(new ValidationPipe()) dto: RequestPasscodeResetOtpDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.requestResetOtp(res.locals.user, dto);
    }

    @Post('reset/verify-otp')
    async verifyResetOtp(
        @Body(new ValidationPipe()) dto: VerifyPasscodeResetOtpDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.verifyResetOtp(res.locals.user, dto);
    }
}
