// ===========================================================================>> Core Library
import { Body, Controller, Post, Req, ValidationPipe } from '@nestjs/common';

// ===========================================================================>> Third Party Library
import type { Request } from 'express';

// ===========================================================================>> Custom Library
import { GoogleLoginDto }     from './google-login.dto';
import { GoogleLoginService } from './google-login.service';

// ======================================= >> Code Starts Here << ========================== //
@Controller()
export class GoogleLoginController {
    constructor(private readonly service: GoogleLoginService) {}

    @Post()
    async login(
        @Body(new ValidationPipe()) dto: GoogleLoginDto,
        @Req() req: Request,
    ) {
        return await this.service.login(dto, req);
    }
}
