// ===========================================================================>> Core Library
import { Body, Controller, Post, Req, ValidationPipe } from '@nestjs/common';

// ===========================================================================>> Third Party Library
import type { Request } from 'express';

// ===========================================================================>> Custom Library
// > Local
import { SignUpCheckPhoneDto, SignUpCompleteDto, SignUpResendDto, SignUpStartDto, SignUpVerifyDto } from './signup.dto';
import { SignUpService }                                                       from './signup.service';

// ======================================= >> Code Starts Here << ========================== //
@Controller()
export class SignUpController {
    constructor(private readonly _service: SignUpService) {}

    @Post('signup')
    async start(@Body(new ValidationPipe()) dto: SignUpStartDto) {
        return await this._service.start(dto);
    }

    @Post('signup/resend')
    async resend(@Body(new ValidationPipe()) dto: SignUpResendDto) {
        return await this._service.resend(dto);
    }

    @Post('signup/verify')
    async verify(@Body(new ValidationPipe()) dto: SignUpVerifyDto) {
        return await this._service.verify(dto);
    }

    @Post('signup/check-phone')
    async checkPhone(@Body(new ValidationPipe()) dto: SignUpCheckPhoneDto) {
        return await this._service.checkPhone(dto);
    }

    @Post('signup/complete')
    async complete(
        @Body(new ValidationPipe()) dto: SignUpCompleteDto,
        @Req() req: Request,
    ) {
        return await this._service.complete(dto, req);
    }
}
