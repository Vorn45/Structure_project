// ===========================================================================>> Core Library
import { Body, Controller, Post, Req, ValidationPipe } from '@nestjs/common';

// ===========================================================================>> Third Party Library
import type { Request } from 'express';

// ===========================================================================>> Custom Library
// > Local
import { TelegramLoginDto }     from './telegram-login.dto';
import { TelegramLoginService } from './telegram-login.service';

// ======================================= >> Code Starts Here << ========================== //
@Controller()
export class TelegramLoginController {
    constructor(private readonly _service: TelegramLoginService) {}

    @Post()
    async login(
        @Body(new ValidationPipe()) dto: TelegramLoginDto,
        @Req() req: Request,
    ) {
        return await this._service.login(dto, req);
    }
}
