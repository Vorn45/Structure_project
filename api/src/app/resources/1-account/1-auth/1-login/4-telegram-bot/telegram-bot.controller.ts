// ===========================================================================>> Core Library
import { Body, Controller, ForbiddenException, Headers, HttpCode, Post } from '@nestjs/common';

// ===========================================================================>> Custom Library
// > Local
import { appConfig }         from 'src/app.config';
import { TelegramUpdateDto } from './telegram-bot.dto';
import { TelegramBotService } from './telegram-bot.service';

// ======================================= >> Code Starts Here << ========================== //
@Controller()
export class TelegramBotController {
    constructor(private readonly _service: TelegramBotService) {}

    /** Registered with Telegram via setWebhook; Telegram calls this on every
     *  update. `secret_token` (set at registration time) is echoed back on
     *  every request so we can reject anything not actually from Telegram. */
    @Post('webhook')
    @HttpCode(200)
    async webhook(
        @Body() update: TelegramUpdateDto,
        @Headers('x-telegram-bot-api-secret-token') secretToken?: string,
    ) {
        if (appConfig.AUTH.TELEGRAM_WEBHOOK_TOKEN && secretToken !== appConfig.AUTH.TELEGRAM_WEBHOOK_TOKEN) {
            throw new ForbiddenException('Invalid webhook secret token');
        }

        await this._service.handleUpdate(update);
        return { ok: true };
    }
}
