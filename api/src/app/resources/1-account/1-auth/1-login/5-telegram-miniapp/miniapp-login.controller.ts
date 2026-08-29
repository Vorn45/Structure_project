// ===========================================================================>> Core Library
import { Body, Controller, Post, Req, ValidationPipe } from '@nestjs/common';

// ===========================================================================>> Third Party Library
import type { Request } from 'express';

// ===========================================================================>> Custom Library
// > Local
import { MiniAppLoginDto }     from './miniapp-login.dto';
import { MiniAppLoginService } from './miniapp-login.service';

// ======================================= >> Code Starts Here << ========================== //
@Controller()
export class MiniAppLoginController {
    constructor(private readonly _service: MiniAppLoginService) {}

    @Post()
    async login(
        @Body(new ValidationPipe()) dto: MiniAppLoginDto,
        @Req() req: Request,
    ) {
        return await this._service.login(dto, req);
    }
}
