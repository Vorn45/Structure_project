// ===========================================================================>> Core Library
import { Body, Controller, ForbiddenException, Get, Headers, HttpCode, Logger, Post } from '@nestjs/common';

// ===========================================================================>> Custom Library
// > Local
import { appConfig }         from 'src/app.config';
import { TelegramUpdateDto } from './telegram-bot.dto';
import { TelegramBotService } from './telegram-bot.service';

// ======================================= >> Code Starts Here << ========================== //
@Controller()
export class TelegramBotController {
    private readonly _logger = new Logger(TelegramBotController.name);

    constructor(private readonly _service: TelegramBotService) {}

    /** Returns current Telegram Bot status, Telegram getMe, and Telegram webhook info */
    @Get('info')
    async getInfo() {
        return await this._service.getBotInfo();
    }

    /** Forces re-sync of the Telegram webhook or polling mode */
    @Post('sync')
    async syncWebhook() {
        return await this._service.syncWebhook();
    }

    /** Deletes the Telegram webhook to switch to polling */
    @Post('delete-webhook')
    async deleteWebhook() {
        return await this._service.removeWebhook();
    }

    /** Registered with Telegram via setWebhook; Telegram calls this on every
     *  update. `secret_token` (set at registration time) is echoed back on
     *  every request so we can reject anything not actually from Telegram. */
    @Post('webhook')
    @HttpCode(200)
    async webhook(
        @Body() update: TelegramUpdateDto,
        @Headers('x-telegram-bot-api-secret-token') secretToken?: string,
    ) {
        if (
            appConfig.AUTH.TELEGRAM_WEBHOOK_TOKEN &&
            secretToken &&
            secretToken !== appConfig.AUTH.TELEGRAM_WEBHOOK_TOKEN
        ) {
            this._logger.warn(
                `Invalid Telegram webhook secret token: expected ${appConfig.AUTH.TELEGRAM_WEBHOOK_TOKEN}, got ${secretToken}`,
            );
            throw new ForbiddenException('Invalid webhook secret token');
        }

        this._logger.log(`Telegram update received (update_id: ${update?.update_id})`);
        await this._service.handleUpdate(update);
        return { ok: true };
    }
}

