// ===========================================================================>> Core Library
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

// ===========================================================================>> Third Party Library
import axios from 'axios';

// ===========================================================================>> Custom Library
// > Local
import { appConfig }             from 'src/app.config';
import { User }                  from 'src/app/model/user/users.entity';
import { TelegramBotRepository } from './telegram-bot.repository';
import { TelegramUpdateDto }     from './telegram-bot.dto';

// ======================================= >> Code Starts Here << ========================== //
const SHARE_PHONE_BUTTON_TEXT = 'Share phone number';

/** Forum topic name: "<org abbreviation> - <project short_name_en>", falling back to whatever half is available. */
function buildTopicLabel(project: {
    short_name_en?: string | null;
    org_abbreviation?: string | null;
}): string {
    const projectLabel = project.short_name_en;
    const orgLabel = project.org_abbreviation;
    return [orgLabel, projectLabel].filter(Boolean).join(' - ') || projectLabel || 'Project';
}

/**
 * PMS_bot webhook handler — links a Telegram account via the one-time session
 * token issued by POST account/profile/telegram/link (opened as a bot deep
 * link: https://t.me/<bot>?start=<telegram_session>). After the session is
 * matched, the user must confirm by sharing their phone number (Telegram's
 * native contact-share button) before the link is finalized, so task-update
 * notifications can then reach the user via Telegram DM.
 */
@Injectable()
export class TelegramBotService implements OnModuleInit {
    private readonly _logger = new Logger(TelegramBotService.name);

    constructor(
        private readonly _repository: TelegramBotRepository,
    ) {}

    /**
     * Registers the webhook + `/` command menu with Telegram on boot — there's
     * no admin UI for the global bot to trigger this from, unlike per-org bots
     * (see TelegramWebhookService#registerWebhook/#setCommands). Without this,
     * Telegram never calls TelegramBotController#webhook and /start etc. silently
     * do nothing.
     */
    async onModuleInit() {
        if (!appConfig.AUTH.TELEGRAM_BOT_TOKEN) return;

        if (appConfig.APP.PUBLIC_URL) {
            try {
                const url = `${appConfig.APP.PUBLIC_URL}/${appConfig.APP.GLOBAL_PREFIX}/auth/telegram-bot/webhook`;
                await axios.post(
                    `https://api.telegram.org/bot${appConfig.AUTH.TELEGRAM_BOT_TOKEN}/setWebhook`,
                    {
                        url,
                        secret_token: appConfig.AUTH.TELEGRAM_WEBHOOK_TOKEN || undefined,
                        allowed_updates: ['message', 'callback_query'],
                    },
                    { timeout: 30000 },
                );
            } catch (error) {
                this._logger.warn(`Telegram setWebhook failed: ${error?.response?.data ? JSON.stringify(error.response.data) : error?.message ?? error}`);
            }
        } else {
            this._logger.warn('PUBLIC_URL is not configured; skipped registering the global Telegram bot webhook');
        }

        try {
            await axios.post(
                `https://api.telegram.org/bot${appConfig.AUTH.TELEGRAM_BOT_TOKEN}/setMyCommands`,
                {
                    commands: [
                        { command: 'start', description: 'Link your PMS account to this chat' },
                        { command: 'threads', description: 'Start or open a project thread' },
                        { command: 'deactivate', description: 'Unlink your PMS account from this chat' },
                        { command: 'feature', description: 'Show the list of commands' },
                    ],
                },
                { timeout: 30000 },
            );
        } catch (error) {
            this._logger.warn(`Telegram setMyCommands failed: ${error?.response?.data ? JSON.stringify(error.response.data) : error?.message ?? error}`);
        }
    }

    async handleUpdate(update: TelegramUpdateDto) {
        if (update.callback_query) {
            await this._handleCallbackQuery(update.callback_query);
            return;
        }

        const message = update.message;
        if (!message) return;

        const chatId = String(message.chat?.id ?? '');
        if (!chatId) return;

        if (message.contact) {
            await this._handleContact(chatId, message.contact, message.from?.username);
            return;
        }

        const text = message.text?.trim() ?? '';
        if (text.startsWith('/start')) {
            const session = text.slice('/start'.length).trim();
            await this._handleStart(chatId, session || undefined);
            return;
        }

        if (text.startsWith('/deactivate')) {
            await this._handleDeactivate(chatId);
            return;
        }

        if (text.startsWith('/feature')) {
            await this._handleFeature(chatId);
            return;
        }

        if (text.startsWith('/threads')) {
            await this._handleThreadsStart(chatId);
            return;
        }

        await this._handleFallback(chatId);
    }

    private async _handleStart(chatId: string, session?: string) {
        const existingLink = await this._repository.findByTelegramId(chatId);
        if (existingLink) {
            await this._sendMessage(
                chatId,
                `You're already linked as ${existingLink.name_en || existingLink.name_kh}. You'll receive PMS notifications here.`,
            );
            return;
        }

        if (!session) {
            await this._sendMessage(
                chatId,
                'ជម្រើសលេខភ្ជាប់គណនី\n\nសូមចែករំលែកលេខទូរសព្ទរបស់អ្នក ដើម្បីភ្ជាប់គណនី PMS របស់អ្នកជាមួយ Telegram នេះ។',
                {
                    keyboard: [[{ text: SHARE_PHONE_BUTTON_TEXT, request_contact: true }]],
                    one_time_keyboard: true,
                    resize_keyboard: true,
                },
            );
            return;
        }

        const matchedUser = await this._repository.findByTelegramSession(session);
        if (!matchedUser) {
            await this._sendMessage(
                chatId,
                'This link has expired or is invalid. Please generate a new one from PMS (Profile > Link Telegram) and try again.',
            );
            return;
        }

        await this._repository.setPendingChatId(matchedUser.id, chatId);

        await this._sendMessage(
            chatId,
            `Hi ${matchedUser.name_en || matchedUser.name_kh}, please share your phone number to confirm it's you.`,
            {
                keyboard: [[{ text: SHARE_PHONE_BUTTON_TEXT, request_contact: true }]],
                one_time_keyboard: true,
                resize_keyboard: true,
            },
        );
    }

    private async _handleDeactivate(chatId: string) {
        const linkedUser = await this._repository.findByTelegramId(chatId);
        if (!linkedUser) {
            await this._sendMessage(
                chatId,
                "You don't have a PMS account linked to this chat.",
            );
            return;
        }

        await this._repository.unlinkTelegram(linkedUser.id);

        await this._sendMessage(
            chatId,
            `Unlinked. Hi ${linkedUser.name_en || linkedUser.name_kh}, you'll no longer receive PMS notifications here.`,
            { remove_keyboard: true },
        );
    }

    private async _handleFeature(chatId: string) {
        await this._sendMessage(
            chatId,
            [
                'Available commands:',
                '/start - Link your PMS account to this chat',
                '/deactivate - Unlink your PMS account from this chat',
                '/threads - Start or open a project thread',
                '/feature - Show this list of commands',
            ].join('\n'),
        );
    }
    /** /threads — lets the user pick an organization, then a project within it, and starts (or reopens) its thread in this DM. */
    private async _handleThreadsStart(chatId: string) {
        const user = await this._repository.findByTelegramId(chatId);
        if (!user) {
            await this._sendMessage(
                chatId,
                'You need to link your PMS account first. Send /start to link your account.',
            );
            return;
        }

        const organizations = await this._repository.findMemberOrganizations(user.id);
        if (!organizations.length) {
            await this._sendMessage(chatId, "You're not a member of any organization yet.");
            return;
        }

        await this._sendMessage(chatId, 'Which organization?', {
            inline_keyboard: organizations.map((o) => [
                { text: o.name_en || o.name_kh, callback_data: `thread_org:${o.id}` },
            ]),
        });
    }

    /** Step 2 of /threads: shows the projects the user belongs to within the chosen organization. */
    private async _handleThreadsOrgSelected(chatId: string, user: User, organizationId: string) {
        const projects = await this._repository.findMemberProjectsForThreads(user.id, organizationId);
        if (!projects.length) {
            // Distinguish an empty organization from one whose projects you simply aren't on.
            const organizationProjectCount = await this._repository.countOrganizationProjects(organizationId);
            await this._sendMessage(
                chatId,
                organizationProjectCount
                    ? "You're not a member of any project in this organization yet."
                    : "There isn't any project in this organization yet.",
            );
            return;
        }

        await this._sendMessage(chatId, 'Which project?', {
            inline_keyboard: projects.map((p) => [
                { text: p.name_en || p.name_kh, callback_data: `thread_project:${p.id}` },
            ]),
        });
    }

    /** Creates a new forum topic via createForumTopic and upserts its id; returns the messageThreadId, or undefined on failure. */
    private async _createThread(user: User, projectId: string, projectName: string | null): Promise<number | undefined> {
        try {
            const { data } = await axios.post(
                `https://api.telegram.org/bot${appConfig.AUTH.TELEGRAM_BOT_TOKEN}/createForumTopic`,
                { chat_id: user.telegram_id, name: (projectName || 'Project').slice(0, 128) },
                { timeout: 30000 },
            );
            const messageThreadId: number | undefined = data?.result?.message_thread_id;
            if (!messageThreadId) return undefined;

            await this._repository.upsertThread(user.id, projectId, messageThreadId);
            return messageThreadId;
        } catch (error: any) {
            this._logger.warn(`Telegram createForumTopic failed for chat ${user.telegram_id}: ${error?.response?.data ? JSON.stringify(error.response.data) : error?.message ?? error}`);
            return undefined;
        }
    }

    /** Starts (or reopens) the forum topic for `projectId`: creates it via createForumTopic on first use, so future notifications land inside it. Self-heals if the stored topic was deleted on Telegram's side ("thread not found") by recreating it. */
    private async _openThread(user: User, projectId: string, projectName: string | null) {
        const chatId = user.telegram_id;
        const existing = await this._repository.findThread(user.id, projectId);

        if (existing?.message_thread_id) {
            try {
                await axios.post(
                    `https://api.telegram.org/bot${appConfig.AUTH.TELEGRAM_BOT_TOKEN}/sendMessage`,
                    {
                        chat_id: chatId,
                        text: `📁 ${projectName || 'Project'} — back to this thread 👇`,
                        message_thread_id: existing.message_thread_id,
                    },
                    { timeout: 30000 },
                );
            } catch (error: any) {
                const description: string | undefined = error?.response?.data?.description;
                if (error?.response?.status !== 400 || !/thread not found/i.test(description ?? '')) {
                    this._logger.warn(`Telegram bot sendMessage failed for chat ${chatId}: ${description ?? error?.message ?? error}`);
                    return;
                }

                this._logger.warn(`Telegram topic ${existing.message_thread_id} for user ${user.id} is gone; reopening thread`);
                await this._repository.deleteThread(user.id, projectId);
                await this._createThread(user, projectId, projectName);
            }
            return;
        }

        await this._createThread(user, projectId, projectName);
    }

    private async _handleCallbackQuery(callbackQuery: NonNullable<TelegramUpdateDto['callback_query']>) {
        await this._answerCallbackQuery(callbackQuery.id);

        const chatId = String(callbackQuery.message?.chat?.id ?? '');
        const data = callbackQuery.data ?? '';
        if (!chatId) return;

        const user = await this._repository.findByTelegramId(chatId);
        if (!user) return;

        if (data.startsWith('thread_org:')) {
            const organizationId = data.slice('thread_org:'.length);
            await this._handleThreadsOrgSelected(chatId, user, organizationId);
            return;
        }

        if (data.startsWith('thread_project:')) {
            const projectId = data.slice('thread_project:'.length);
            const project = await this._repository.findMemberProjectById(user.id, projectId);
            if (!project) return;

            await this._openThread(user, project.id, buildTopicLabel(project));
            return;
        }

    }

    private async _answerCallbackQuery(callbackQueryId: string) {
        if (!appConfig.AUTH.TELEGRAM_BOT_TOKEN) return;

        try {
            await axios.post(
                `https://api.telegram.org/bot${appConfig.AUTH.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`,
                { callback_query_id: callbackQueryId },
                { timeout: 30000 },
            );
        } catch (error) {
            this._logger.warn(`Telegram answerCallbackQuery failed: ${error?.response?.data ? JSON.stringify(error.response.data) : error?.message ?? error}`);
        }
    }

    private async _handleContact(
        chatId: string,
        contact: NonNullable<TelegramUpdateDto['message']>['contact'],
        username?: string,
    ) {
        const pendingUser = await this._repository.findByPendingChatId(chatId);
        if (pendingUser) {
            if (!this._phonesMatch(pendingUser.phone, contact?.phone_number)) {
                await this._sendMessage(
                    chatId,
                    "That phone number doesn't match the PMS account you're linking. Please generate a new link from PMS and try again.",
                    { remove_keyboard: true },
                );
                return;
            }

            await this._repository.linkTelegram(pendingUser.id, {
                telegram_id: chatId,
                telegram_username: username ?? null,
                telegram_photo_url: null,
            });

            await this._sendMessage(
                chatId,
                `Linked! Hi ${pendingUser.name_en || pendingUser.name_kh}, you'll now receive PMS task notifications here.`,
                { remove_keyboard: true },
            );
            return;
        }

        await this._handlePhoneOnlyLink(chatId, contact, username);
    }

    /** Bare /start flow (no session token) — matches purely by phone number, mirroring CDC_HRM's /activate. */
    private async _handlePhoneOnlyLink(
        chatId: string,
        contact: NonNullable<TelegramUpdateDto['message']>['contact'],
        username?: string,
    ) {
        const digits = this._normalizePhone(contact?.phone_number);
        const matchedUser = digits ? await this._repository.findActiveByPhone(digits) : null;

        if (!matchedUser) {
            await this._sendMessage(
                chatId,
                '🔴 មិនជោគជ័យ! លេខទូរសព្ទរបស់អ្នកមិនត្រូវគ្នានឹងគណនី PMS ណាមួយឡើយ។\n\nសូមធ្វើបច្ចុប្បន្នភាពលេខទូរសព្ទក្នុង PMS ឲ្យត្រូវនឹងលេខ Telegram របស់អ្នក ឬទាក់ទងអ្នកគ្រប់គ្រង។',
                { remove_keyboard: true },
            );
            return;
        }

        await this._repository.linkTelegram(matchedUser.id, {
            telegram_id: chatId,
            telegram_username: username ?? null,
            telegram_photo_url: null,
        });

        await this._sendMessage(
            chatId,
            `🟢 ភ្ជាប់គណនីបានជោគជ័យ! សួស្តី ${matchedUser.name_en || matchedUser.name_kh}, អ្នកនឹងទទួលបានការជូនដំណឹង PMS នៅទីនេះ។`,
            { remove_keyboard: true },
        );
    }

    private _phonesMatch(a?: string | null, b?: string | null): boolean {
        const digitsA = this._normalizePhone(a);
        const digitsB = this._normalizePhone(b);
        return !!digitsA && digitsA === digitsB;
    }

    /**
     * Strips a Cambodian phone number down to its national significant number,
     * so "087600063" (local, leading trunk 0) and "85587600063"/"+855876000063"
     * (Telegram's E.164-ish format) both normalize to "87600063".
     */
    private _normalizePhone(value?: string | null): string {
        let digits = (value ?? '').replace(/\D/g, '');
        if (digits.startsWith('855')) digits = digits.slice(3);
        if (digits.startsWith('0')) digits = digits.slice(1);
        return digits;
    }

    private async _handleFallback(chatId: string) {
        const user = await this._repository.findByTelegramId(chatId);
        if (user) return;

        await this._sendMessage(
            chatId,
            'Open PMS, go to Profile > Link Telegram, and tap the link to connect your account.',
        );
    }

    private async _sendMessage(
        chatId: string,
        text: string,
        replyMarkup?: unknown,
        messageThreadId?: number,
    ): Promise<number | undefined> {
        if (!appConfig.AUTH.TELEGRAM_BOT_TOKEN) {
            this._logger.warn('TELEGRAM_BOT_TOKEN is not configured; skipping sendMessage');
            return undefined;
        }

        try {
            const { data } = await axios.post(
                `https://api.telegram.org/bot${appConfig.AUTH.TELEGRAM_BOT_TOKEN}/sendMessage`,
                {
                    chat_id: chatId,
                    text,
                    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
                    ...(messageThreadId ? { message_thread_id: messageThreadId } : {}),
                },
                { timeout: 30000 },
            );
            return data?.result?.message_id;
        } catch (error) {
            this._logger.warn(`Telegram bot sendMessage failed for chat ${chatId}: ${error?.response?.data ? JSON.stringify(error.response.data) : error?.message ?? error}`);
        }
    }

}
