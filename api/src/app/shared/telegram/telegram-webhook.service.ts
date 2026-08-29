// ===========================================================================>> Core Library
import { BadRequestException, Injectable, InternalServerErrorException, Logger, } from '@nestjs/common';

// ===========================================================================>> Third Party Library
import axios, { AxiosError } from 'axios';

// ===========================================================================>> Custom Library
// > Local
import { appConfig } from 'src/app.config';

// ======================================= >> Code Starts Here << ========================== //
/**
 * Registers/removes the Telegram `setWebhook` callback for a per-organization
 * bot (Organization.telegram_bot_token). Distinct from the fixed system-wide
 * PMS_bot webhook under 1-account/1-auth/1-login/4-telegram-bot, which uses
 * one global token/receiver instead of one per organization.
 */
@Injectable()
export class TelegramWebhookService {
    private readonly _logger = new Logger(TelegramWebhookService.name);

    private async call<T = any>(
        botToken: string,
        method: string,
        payload: Record<string, unknown>,
    ): Promise<T> {
        try {
            const { data } = await axios.post(
                `https://api.telegram.org/bot${botToken}/${method}`,
                payload,
                { timeout: 30000 },
            );
            return data?.result as T;
        } catch (err) {
            const description =
                err instanceof AxiosError
                    ? (err.response?.data?.description ?? err.message)
                    : String(err);
            this._logger.warn(`Telegram ${method} failed: ${description}`);
            throw new InternalServerErrorException(`Telegram ${method} failed: ${description}`);
        }
    }

    /** Points the bot's webhook at this org's receiver route, secured with secretToken. */
    async registerWebhook(
        botToken: string,
        organizationId: string,
        secretToken: string,
    ): Promise<void> {
        if (!appConfig.APP.PUBLIC_URL) {
            throw new BadRequestException(
                'PUBLIC_URL is not configured; cannot register Telegram webhook',
            );
        }

        const url = `${appConfig.APP.PUBLIC_URL}/${appConfig.APP.GLOBAL_PREFIX}/webhook/telegram/organization/${organizationId}`;

        await this.call(botToken, 'setWebhook', {
            url,
            secret_token: secretToken,
            allowed_updates: ['message', 'callback_query'],
        });
        this._logger.log(`Telegram webhook registered for organization ${organizationId}: ${url}`);
    }

    async deleteWebhook(botToken: string): Promise<void> {
        await this.call(botToken, 'deleteWebhook', {});
    }

    /** Registers the bot's `/` command menu shown by Telegram clients. */
    async setCommands(botToken: string): Promise<void> {
        await this.call(botToken, 'setMyCommands', {
            commands: [
                { command: 'start', description: 'Link your PMS account to this chat' },
                { command: 'deactivate', description: 'Unlink your PMS account from this chat' },
                { command: 'feature', description: 'Show the list of commands' },
            ],
        });
    }
}
