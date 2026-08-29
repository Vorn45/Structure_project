// ===========================================================================>> Core Library
import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';

// ===========================================================================>> Custom Library
// > Local
import { ForgetPasswordDto, ResetPasswordDto, VerifyResetOtpDto } from './forget-password.dto';
import { ForgetPasswordService }               from './forget-password.service';

// ======================================= >> Code Starts Here << ========================== //
@Controller()
export class ForgetPasswordController {
    constructor(private readonly _service: ForgetPasswordService) {}

    @Post('forget-password')
    async forgetPassword(@Body(new ValidationPipe()) dto: ForgetPasswordDto) {
        return await this._service.forgetPassword(dto);
    }

    @Post('verify-reset-otp')
    async verifyResetOtp(@Body(new ValidationPipe()) dto: VerifyResetOtpDto) {
        return await this._service.verifyOtp(dto);
    }

    @Post('reset-password')
    async resetPassword(@Body(new ValidationPipe()) dto: ResetPasswordDto) {
        return await this._service.resetPassword(dto);
    }
}
