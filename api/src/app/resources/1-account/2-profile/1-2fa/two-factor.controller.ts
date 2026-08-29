// ===========================================================================>> Core Library
import { Body, Controller, Get, Post, Put, Res, ValidationPipe, } from '@nestjs/common';

// ===========================================================================>> Third Party Library
import express from 'express';

// ===========================================================================>> Custom Library
// > Local
import { OtpChannel } from 'src/app/enum/otp-channel.enum';
import {
    DisableAuthenticatorDto,
    EnableAuthenticatorDto,
    RegenerateBackupCodesDto,
    RequestEmailChangeOtpDto,
    RequestPhoneChangeOtpDto,
    UpdateEmailDto,
    UpdatePhoneNumberDto,
    UpdateTwoFactorDto,
} from './two-factor.dto';
import { TwoFactorService } from './two-factor.service';

// ======================================= >> Code Starts Here << ========================== //
@Controller('2fa')
export class TwoFactorController {
    constructor(private readonly _service: TwoFactorService) {}

    @Get()
    async getSetting(@Res({ passthrough: true }) res: express.Response) {
        return await this._service.getSetting(res.locals.user);
    }

    @Put('phone')
    async updatePhone(
        @Body(new ValidationPipe()) dto: UpdateTwoFactorDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.updateSetting(
            res.locals.user,
            OtpChannel.PHONE,
            dto,
        );
    }

    @Post('phone/request-otp')
    async requestPhoneChangeOtp(
        @Body(new ValidationPipe()) dto: RequestPhoneChangeOtpDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.requestPhoneChangeOtp(
            res.locals.user,
            dto,
        );
    }

    @Put('phone/number')
    async updatePhoneNumber(
        @Body(new ValidationPipe()) dto: UpdatePhoneNumberDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.updatePhoneNumber(res.locals.user, dto);
    }

    @Put('telegram')
    async updateTelegram(
        @Body(new ValidationPipe()) dto: UpdateTwoFactorDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.updateSetting(
            res.locals.user,
            OtpChannel.TELEGRAM,
            dto,
        );
    }

    @Put('email')
    async updateEmail(
        @Body(new ValidationPipe()) dto: UpdateTwoFactorDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.updateSetting(
            res.locals.user,
            OtpChannel.EMAIL,
            dto,
        );
    }

    @Post('email/request-otp')
    async requestEmailChangeOtp(
        @Body(new ValidationPipe()) dto: RequestEmailChangeOtpDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.requestEmailChangeOtp(
            res.locals.user,
            dto,
        );
    }

    @Put('email/address')
    async updateEmailAddress(
        @Body(new ValidationPipe()) dto: UpdateEmailDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.updateEmail(res.locals.user, dto);
    }

    @Get('authenticator/setup')
    async setupAuthenticator(@Res({ passthrough: true }) res: express.Response) {
        return await this._service.setupAuthenticator(res.locals.user);
    }

    @Post('authenticator/enable')
    async enableAuthenticator(
        @Body(new ValidationPipe()) dto: EnableAuthenticatorDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.enableAuthenticator(res.locals.user, dto);
    }

    @Put('authenticator/disable')
    async disableAuthenticator(
        @Body(new ValidationPipe()) dto: DisableAuthenticatorDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.disableAuthenticator(res.locals.user, dto);
    }

    @Post('authenticator/backup-codes')
    async regenerateBackupCodes(
        @Body(new ValidationPipe()) dto: RegenerateBackupCodesDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.regenerateBackupCodes(res.locals.user, dto);
    }

    @Post('send-otp')
    async sendOtp(
        @Body() dto: any,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.sendOtp(res.locals.user, dto);
    }

    @Post('verify-otp')
    async verifyOtp(
        @Body() dto: any,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.verifyOtp(res.locals.user, dto);
    }
}
