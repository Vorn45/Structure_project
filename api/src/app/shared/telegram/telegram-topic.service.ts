// ===========================================================================>> Core Library
import { BadRequestException, Injectable, InternalServerErrorException, Logger, } from '@nestjs/common';

// ===========================================================================>> Third Party Library
import axios, { AxiosError } from 'axios';

// ======================================= >> Code Starts Here << ========================== //
interface TelegramGroupConfig {
    bot_token?: string | null;
    chat_id?: string | null;
}

/**
 * Creates/manages Telegram forum topics inside one of an organization's
 * Telegram groups (org admin creates the group, enables Topics, adds the
 * group's own bot as admin, then stores the bot token + chat id on an
 * OrganizationTelegramGroup row). Distinct from TelegramService, which posts
 * internal ops logs to a single hardcoded group via a fixed env-configured
 * bot.
 */
@Injectable()
export class TelegramTopicService {
    private readonly _logger = new Logger(TelegramTopicService.name);

    private assertConfigured(
        group: TelegramGroupConfig,
    ): { botToken: string; chatId: string } {
        const botToken = group.bot_token;
        const chatId = group.chat_id;

        if (!botToken || !chatId) {
            throw new BadRequestException(
                'Telegram bot token / group chat id is not configured for this organization',
            );
        }

        return { botToken, chatId };
    }

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
            throw new InternalServerErrorException(
                `Telegram ${method} failed: ${description}`,
            );
        }
    }

    /** Creates a new forum topic in the org's group. Returns the message_thread_id. */
    async createTopic(
        group: TelegramGroupConfig,
        name: string,
    ): Promise<number> {
        const { botToken, chatId } = this.assertConfigured(group);

        const result = await this.call<{ message_thread_id: number }>(
            botToken,
            'createForumTopic',
            { chat_id: chatId, name },
        );

        return result.message_thread_id;
    }

    async renameTopic(
        group: TelegramGroupConfig,
        topicId: number,
        name: string,
    ): Promise<void> {
        const { botToken, chatId } = this.assertConfigured(group);

        await this.call(botToken, 'editForumTopic', {
            chat_id: chatId,
            message_thread_id: topicId,
            name,
        });
    }

    async closeTopic(
        group: TelegramGroupConfig,
        topicId: number,
    ): Promise<void> {
        const { botToken, chatId } = this.assertConfigured(group);

        await this.call(botToken, 'closeForumTopic', {
            chat_id: chatId,
            message_thread_id: topicId,
        });
    }

    async reopenTopic(
        group: TelegramGroupConfig,
        topicId: number,
    ): Promise<void> {
        const { botToken, chatId } = this.assertConfigured(group);

        await this.call(botToken, 'reopenForumTopic', {
            chat_id: chatId,
            message_thread_id: topicId,
        });
    }

    /** Posts a message into the org's group, optionally scoped to a topic. Swallows errors (best-effort notification path). */
    async sendMessage(
        group: TelegramGroupConfig,
        text: string,
        topicId?: number | null,
        linkButtonUrl?: string,
    ): Promise<void> {
        const botToken = group.bot_token;
        const chatId = group.chat_id;
        if (!botToken || !chatId) return;

        try {
            await this.call(botToken, 'sendMessage', {
                chat_id: chatId,
                text,
                parse_mode: 'MarkdownV2',
                ...(topicId ? { message_thread_id: topicId } : {}),
                ...(linkButtonUrl && {
                    reply_markup: { inline_keyboard: [[{ text: 'មើលការងារលម្អិត', url: linkButtonUrl }]] },
                }),
            });
        } catch {
            // best-effort — createTopic/renameTopic/closeTopic already log+throw for
            // explicit admin actions; a notification fan-out shouldn't blow up on this.
        }
    }
}
