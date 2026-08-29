// ===========================================================================>> Core Library
import { Body, Controller, Post, ValidationPipe, Req, Res } from '@nestjs/common';

// ===========================================================================>> Third Party Library
import type { Request } from 'express';
import express from 'express';

// ===========================================================================>> Custom Library
// > Local
import { LoginRequestDto, RefreshTokenDto, resendOtpDto, SendOtpDto, VerifyOtptDto, } from './username.dto';
import { UsernameService }                                                            from './username.service';
import { clearRefreshTokenCookie, readRefreshTokenCookie } from 'src/app/common/utils/refresh-token-cookie.util';

// ======================================= >> Code Starts Here << ========================== //
@Controller()
export class UsernameController {
    constructor(private _service: UsernameService) {}

    @Post('login')
    async loginWithPhone(
        @Body() loginDto: LoginRequestDto,
        @Req() req: Request,
    ) {
        return await this._service.login(loginDto, req);
    }

    @Post('otp')
    async verifyOtp(@Body() loginDto: VerifyOtptDto, @Req() req: Request) {
        return await this._service.verifyOtp(loginDto, req);
    }

    @Post('otp/send')
    async sendOtp(@Body(new ValidationPipe()) dto: SendOtpDto) {
        return await this._service.sendOtp(dto);
    }

    @Post('resend-otp')
    async resendOtp(@Body() loginDto: resendOtpDto) {
        return await this._service.resendOtp(loginDto.username, loginDto.channel);
    }

    @Post('refresh')
    async refresh(
        @Body(new ValidationPipe()) body: RefreshTokenDto,
        @Req() req: Request,
    ) {
        return await this._service.refreshToken(
            body.refresh_token ?? readRefreshTokenCookie(req) ?? '',
            req,
            body.device_id,
        );
    }

    @Post('logout')
    async logout(
        @Body() body: { device_id?: string },
        @Req() req: Request,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        const result = await this._service.logout(req, body.device_id);
        clearRefreshTokenCookie(res);
        return result;
    }
}
