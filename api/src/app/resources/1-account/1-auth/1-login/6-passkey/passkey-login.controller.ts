// ===========================================================================>> Core Library
import { Body, Controller, Post, Req, ValidationPipe } from '@nestjs/common';

// ===========================================================================>> Third Party Library
import type { Request } from 'express';

// ===========================================================================>> Custom Library
import { PasskeyLoginVerifyDto } from './passkey-login.dto';
import { PasskeyLoginService }   from './passkey-login.service';

// ======================================= >> Code Starts Here << ========================== //
@Controller()
export class PasskeyLoginController {
    constructor(private readonly service: PasskeyLoginService) {}

    @Post('login-options')
    async loginOptions(@Req() req: Request) {
        return await this.service.generateLoginOptions(req.headers.origin);
    }

    @Post('login-verify')
    async loginVerify(
        @Body(new ValidationPipe()) dto: PasskeyLoginVerifyDto,
        @Req() req: Request,
    ) {
        return await this.service.verifyLogin(dto, req);
    }
}
