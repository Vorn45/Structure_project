// ===========================================================================>> Core Library
import { Body, Controller, Post, Req, ValidationPipe } from '@nestjs/common';

// ===========================================================================>> Third Party Library
import type { Request } from 'express';

// ===========================================================================>> Custom Library
import { SsoLoginDto }     from './sso-login.dto';
import { SsoLoginService } from './sso-login.service';

// ======================================= >> Code Starts Here << ========================== //
@Controller()
export class SsoLoginController {
    constructor(private readonly service: SsoLoginService) {}

    @Post()
    async login(
        @Body(new ValidationPipe()) dto: SsoLoginDto,
        @Req() req: Request,
    ) {
        return await this.service.login(dto, req);
    }
}
