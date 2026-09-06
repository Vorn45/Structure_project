// ===========================================================================>> Core Library
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

// ===========================================================================>> Third Party Library
import axios from 'axios';

// ===========================================================================>> Custom Library
// > Local
import { appConfig }             from 'src/app.config';
import { User }                  from 'src/app/model/user/users.entity';
import { TelegramBotRepository } from './telegram-bot.repository';
import { TelegramUpdateDto }     from './telegram-bot.dto';

// ======================================= >> Code Starts Here << ========================== //
const SHARE_PHONE_BUTTON_TEXT = '📲 ចែករំលែកលេខទូរស័ព្ទ / Share Phone Number';

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
 * WFM Bot webhook & polling handler — links a Telegram account via one-time session
 * or phone share, and serves interactive Support, FAQs, and ticket submission.
 */
@Injectable()
export class TelegramBotService implements OnModuleInit, OnModuleDestroy {
    private readonly _logger = new Logger(TelegramBotService.name);
    private _isPolling = false;

    constructor(
        private readonly _repository: TelegramBotRepository,
    ) {}

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
            } catch (error: any) {
                this._logger.warn(`Telegram setWebhook failed: ${error?.response?.data ? JSON.stringify(error.response.data) : error?.message ?? error}`);
            }
        } else {
            this._logger.log('PUBLIC_URL is not configured; running Telegram bot in local polling mode');
            this._startPolling();
        }

        try {
            await axios.post(
                `https://api.telegram.org/bot${appConfig.AUTH.TELEGRAM_BOT_TOKEN}/setMyCommands`,
                {
                    commands: [
                        { command: 'start', description: 'ចាប់ផ្តើម / Start Bot & Link WFM' },
                        { command: 'help', description: 'មជ្ឈមណ្ឌលជំនួយ / Help & Support' },
                        { command: 'support', description: 'ផ្ញើសំបុត្រជំនួយ / Submit Ticket' },
                        { command: 'threads', description: 'តាមដានគម្រោង / Project Threads' },
                        { command: 'deactivate', description: 'ផ្តាច់គណនី WFM / Unlink Account' },
                        { command: 'feature', description: 'បញ្ជីពាក្យបញ្ជា / List Commands' },
                    ],
                },
                { timeout: 30000 },
            );
        } catch (error: any) {
            this._logger.warn(`Telegram setMyCommands failed: ${error?.response?.data ? JSON.stringify(error.response.data) : error?.message ?? error}`);
        }
    }

    private readonly _pendingTickets = new Map<
        string,
        { category: string; startedAt: number }
    >();

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

        // Check if user is currently writing a support ticket
        if (this._pendingTickets.has(chatId) && !text.startsWith('/')) {
            await this._handleTicketMessage(chatId, message);
            return;
        }

        if (text.startsWith('/start')) {
            const session = text.slice('/start'.length).trim();
            await this._handleStart(chatId, session || undefined);
            return;
        }

        if (text.startsWith('/help') || text.startsWith('/support')) {
            await this._handleHelpMenu(chatId);
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

        const lowerText = text.toLowerCase();
        if (
            lowerText === 'help' ||
            lowerText === 'support' ||
            lowerText === 'hi' ||
            lowerText === 'hello' ||
            lowerText.includes('ជំនួយ') ||
            lowerText.includes('បញ្ហា') ||
            lowerText.includes('សួស្តី')
        ) {
            await this._handleHelpMenu(chatId);
            return;
        }

        await this._handleFallback(chatId);
    }

    private async _handleStart(chatId: string, session?: string) {
        const existingLink = await this._repository.findByTelegramId(chatId);
        if (existingLink) {
            const name = existingLink.name_en || existingLink.name_kh || 'User';
            await this._sendMessage(
                chatId,
                `🟢 <b>គណនីរបស់អ្នកបានភ្ជាប់ជាមួយ WFM រួចហើយ!</b>\nសួស្តី ${name}, អ្នកនឹងទទួលបានការជូនដំណឹង WFM នៅទីនេះ។\n\n<i>You are already linked to WFM as ${name}.</i>`,
            );
            await this._handleHelpMenu(chatId);
            return;
        }

        if (!session) {
            await this._sendMessage(
                chatId,
                '🔗 <b>ជម្រើសភ្ជាប់គណនីប្រព័ន្ធ WFM</b>\n\nសូមចុចប៊ូតុង <b>"📲 ចែករំលែកលេខទូរស័ព្ទ / Share Phone Number"</b> ខាងក្រោម ដើម្បីភ្ជាប់គណនី WFM របស់អ្នកជាមួយ Telegram នេះដោយស្វ័យប្រវត្តិ។\n\n<i>Please share your phone number to link your WFM account.</i>',
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
                '⚠️ តំណភ្ជាប់នេះបានផុតកំណត់ ឬមិនត្រឹមត្រូវ។ សូមបង្កើតតំណភ្ជាប់ថ្មីពីប្រព័ន្ធ WFM (Profile > Link Telegram)។\n\n<i>This link has expired or is invalid. Please generate a new link from WFM.</i>',
            );
            return;
        }

        await this._repository.setPendingChatId(matchedUser.id, chatId);

        await this._sendMessage(
            chatId,
            `សួស្តី ${matchedUser.name_en || matchedUser.name_kh}, សូមចុចប៊ូតុងខាងក្រោមដើម្បីចែករំលែកលេខទូរស័ព្ទបញ្ជាក់អត្តសញ្ញាណ៖\n\n<i>Hi ${matchedUser.name_en || matchedUser.name_kh}, please share your phone number to confirm your identity.</i>`,
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
                "⚠️ អ្នកមិនទាន់មានគណនី WFM ភ្ជាប់ជាមួយ Telegram នេះទេ។\n<i>You don't have a WFM account linked to this chat.</i>",
            );
            return;
        }

        await this._repository.unlinkTelegram(linkedUser.id);

        await this._sendMessage(
            chatId,
            `🔴 បានផ្តាច់គណនី WFM រួចរាល់។ សួស្តី ${linkedUser.name_en || linkedUser.name_kh}, អ្នកនឹងលែងទទួលបានការជូនដំណឹង WFM នៅទីនេះទៀតហើយ។\n\n<i>Unlinked successfully. You will no longer receive WFM notifications here.</i>`,
            { remove_keyboard: true },
        );
    }

    private async _handleFeature(chatId: string) {
        await this._sendMessage(
            chatId,
            [
                '📋 <b>បញ្ជីពាក្យបញ្ជាប្រព័ន្ធ WFM / WFM Bot Commands:</b>',
                '━━━━━━━━━━━━━━━━━━━━',
                '/start - ចាប់ផ្តើម និងភ្ជាប់គណនី WFM',
                '/help - មជ្ឈមណ្ឌលជំនួយ & FAQ',
                '/support - ផ្ញើសំបុត្រជំនួយ (Submit Ticket)',
                '/threads - តាមដានគម្រោងកិច្ចការងារ',
                '/deactivate - ផ្តាច់គណនី WFM ពី Telegram នេះ',
                '/feature - បង្ហាញបញ្ជីពាក្យបញ្ជាទាំងអស់',
            ].join('\n'),
        );
    }

    /** /threads — lets the user pick an organization, then a project within it, and starts (or reopens) its thread in this DM. */
    private async _handleThreadsStart(chatId: string) {
        const user = await this._repository.findByTelegramId(chatId);
        if (!user) {
            await this._sendMessage(
                chatId,
                '⚠️ សូមភ្ជាប់គណនី WFM របស់អ្នកជាមុនសិន។ វាយ /start ដើម្បីភ្ជាប់គណនី។\n<i>Please link your WFM account first. Send /start to link.</i>',
            );
            return;
        }

        const organizations = await this._repository.findMemberOrganizations(user.id);
        if (!organizations.length) {
            await this._sendMessage(chatId, "⚠️ អ្នកមិនទាន់ជាសមាជិកនៃអង្គភាព ឬក្រុមហ៊ុនណាមួយក្នុង WFM ឡើយ។");
            return;
        }

        await this._sendMessage(chatId, '🏢 សូមជ្រើសរើសអង្គភាព / Select Organization:', {
            inline_keyboard: organizations.map((o) => [
                { text: o.name_en || o.name_kh, callback_data: `thread_org:${o.id}` },
            ]),
        });
    }

    /** Step 2 of /threads: shows the projects the user belongs to within the chosen organization. */
    private async _handleThreadsOrgSelected(chatId: string, user: User, organizationId: string) {
        const projects = await this._repository.findMemberProjectsForThreads(user.id, organizationId);
        if (!projects.length) {
            const organizationProjectCount = await this._repository.countOrganizationProjects(organizationId);
            await this._sendMessage(
                chatId,
                organizationProjectCount
                    ? "⚠️ អ្នកមិនទាន់ជាសមាជិកនៃគម្រោងណាមួយក្នុងអង្គភាពនេះនៅឡើយទេ។"
                    : "⚠️ មិនទាន់មានគម្រោងនៅក្នុងអង្គភាពនេះទេ។",
            );
            return;
        }

        await this._sendMessage(chatId, '📁 សូមជ្រើសរើសគម្រោង / Select Project:', {
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

    /** Starts (or reopens) the forum topic for `projectId`: creates it via createForumTopic on first use, so future notifications land inside it. */
    private async _openThread(user: User, projectId: string, projectName: string | null) {
        const chatId = user.telegram_id;
        const existing = await this._repository.findThread(user.id, projectId);

        if (existing?.message_thread_id) {
            try {
                await axios.post(
                    `https://api.telegram.org/bot${appConfig.AUTH.TELEGRAM_BOT_TOKEN}/sendMessage`,
                    {
                        chat_id: chatId,
                        text: `📁 <b>${projectName || 'Project'}</b> — បើក Topic តាមដានគម្រោង 👇`,
                        parse_mode: 'HTML',
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

        // Support bot callbacks (available for all users)
        if (data.startsWith('help_')) {
            await this._handleSupportCallback(chatId, data);
            return;
        }

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

    private async _handleHelpMenu(chatId: string) {
        const welcomeText = [
            '👋 <b>សូមស្វាគមន៍មកកាន់ មជ្ឈមណ្ឌលជំនួយបច្ចេកទេស WFM Support!</b>',
            '<i>Welcome to WFM Technical Support Center!</i>',
            '',
            'សូមជ្រើសរើសផ្នែកដែលលោកអ្នកត្រូវការជំនួយ ឬចុច "ផ្ញើសំបុត្រជំនួយ" ដើម្បីផ្ញើសំណើទៅកាន់ក្រុមការងារ៖',
            '<i>Please choose a topic below or submit a support ticket:</i>',
        ].join('\n');

        await this._sendMessage(chatId, welcomeText, {
            inline_keyboard: [
                [
                    { text: '🔗 ភ្ជាប់គណនី WFM', callback_data: 'help_link_prompt' },
                ],
                [
                    { text: '🕒 វត្តមាន & QR Code', callback_data: 'help_attendance' },
                    { text: '💵 បៀវត្ស & ប្រាក់ខែ', callback_data: 'help_payroll' },
                ],
                [
                    { text: '📁 គម្រោង & កិច្ចការងារ', callback_data: 'help_project' },
                    { text: '🔑 គណនី & ចូលប្រើប្រាស់', callback_data: 'help_account' },
                ],
                [
                    { text: '📝 ផ្ញើសំបុត្រជំនួយ (Submit Ticket)', callback_data: 'help_ticket_prompt' },
                ],
                [
                    { text: '📞 ទាក់ទងបុគ្គលិកផ្ទាល់ (Live Agent)', callback_data: 'help_contact' },
                ],
            ],
        });
    }

    private async _handleSupportCallback(chatId: string, data: string) {
        if (data === 'help_main') {
            await this._handleHelpMenu(chatId);
            return;
        }

        if (data === 'help_ticket_cancel') {
            this._pendingTickets.delete(chatId);
            await this._sendMessage(chatId, '❌ បានបោះបង់ការផ្ញើសំបុត្រជំនួយ / Ticket submission cancelled.');
            await this._handleHelpMenu(chatId);
            return;
        }

        if (data === 'help_attendance') {
            const guide = [
                '🕒 <b>ជំនួយលើការកត់ត្រាវត្តមាន & QR Code</b>',
                '━━━━━━━━━━━━━━━━━━━━',
                '1️⃣ <b>ស្កេន QR Code មិនដំណើរការ:</b>',
                '• ពិនិត្យមើលការអនុញ្ញាត Camera ក្នុង Browser / App',
                '• បើក Location (GPS) លើទូរសព្ទរបស់អ្នក',
                '• ត្រូវប្រាកដថាអ្នកស្ថិតក្នុងបរិវេណការិយាល័យ',
                '',
                '2️⃣ <b>ម៉ោងស្កេនចូល/ចេញ:</b>',
                '• ស្កេនចូលមុន ឬទាន់ម៉ោងដើម្បីកុំឱ្យយឺត (Late)',
                '• ស្កេនចេញនៅពេលបញ្ចប់ម៉ោងការងារ',
                '',
                '<i>ប្រសិនបើនៅតែមានបញ្ហា សូមចុចប៊ូតុងខាងក្រោមដើម្បីផ្ញើសំណើ៖</i>',
            ].join('\n');

            await this._sendMessage(chatId, guide, {
                inline_keyboard: [
                    [{ text: '📝 ផ្ញើសំណើបញ្ហាវត្តមាន', callback_data: 'help_ticket:attendance' }],
                    [{ text: '🔙 ត្រឡប់ទៅម៉ឺនុយដើម (Main Menu)', callback_data: 'help_main' }],
                ],
            });
            return;
        }

        if (data === 'help_payroll') {
            const guide = [
                '💵 <b>ជំនួយលើប័ណ្ណបៀវត្ស និងប្រាក់ខែ</b>',
                '━━━━━━━━━━━━━━━━━━━━',
                '1️⃣ <b>មើលប័ណ្ណបៀវត្ស (Payslip):</b>',
                '• ចូលទៅកាន់ម៉ឺនុយ <b>បៀវត្ស / Payroll</b> ក្នុងប្រព័ន្ធ WFM',
                '• ជ្រើសរើសខែ និងឆ្នាំដែលចង់ទាញយកប័ណ្ណសង្ខេប',
                '',
                '2️⃣ <b>ចម្ងល់អំពីការកាត់ប្រាក់ ឬម៉ោងបន្ថែម (OT):</b>',
                '• ពិនិត្យរបាយការណ៍វត្តមាន និងការសុំច្បាប់ក្នុងខែនោះ',
                '• ប្រសិនបើមានទិន្នន័យមិនត្រឹមត្រូវ សូមផ្ញើសំណើជំនួយមកកាន់ HR',
            ].join('\n');

            await this._sendMessage(chatId, guide, {
                inline_keyboard: [
                    [{ text: '📝 ផ្ញើសំណើបញ្ហាបៀវត្ស', callback_data: 'help_ticket:payroll' }],
                    [{ text: '🔙 ត្រឡប់ទៅម៉ឺនុយដើម (Main Menu)', callback_data: 'help_main' }],
                ],
            });
            return;
        }

        if (data === 'help_project') {
            const guide = [
                '📁 <b>ជំនួយលើការគ្រប់គ្រងគម្រោង & កិច្ចការងារ</b>',
                '━━━━━━━━━━━━━━━━━━━━',
                '1️⃣ <b>មើលកិច្ចការងារដែលបានចាត់តាំង:</b>',
                '• ចូលទៅផ្ទាំង <b>គម្រោង / Projects</b> -> Tasks',
                '• ប្រើ /threads ក្នុង Telegram នេះ ដើម្បីបើក Topic តាមដានគម្រោងផ្ទាល់',
                '',
                '2️⃣ <b>ការផ្លាស់ប្តូរស្ថានភាពកិច្ចការ:</b>',
                '• Drag & Drop ឬចុចប្តូរពី To Do ➡️ In Progress ➡️ Done',
            ].join('\n');

            await this._sendMessage(chatId, guide, {
                inline_keyboard: [
                    [{ text: '📝 ផ្ញើសំណើបញ្ហាគម្រោង', callback_data: 'help_ticket:project' }],
                    [{ text: '🔙 ត្រឡប់ទៅម៉ឺនុយដើម (Main Menu)', callback_data: 'help_main' }],
                ],
            });
            return;
        }

        if (data === 'help_account') {
            const guide = [
                '🔑 <b>ជំនួយលើគណនី & ការចូលប្រើប្រាស់</b>',
                '━━━━━━━━━━━━━━━━━━━━',
                '1️⃣ <b>ភ្លេចពាក្យសម្ងាត់ (Forgot Password):</b>',
                '• ចុច "ភ្លេចពាក្យសម្ងាត់" នៅលើផ្ទាំង Login',
                '• បញ្ចូលលេខទូរសព្ទ ឬ Email ដើម្បីទទួលលេខកូដ OTP',
                '',
                '2️⃣ <b>ការភ្ជាប់ Telegram សម្រាប់ទទួល OTP / ការជូនដំណឹង:</b>',
                '• ចូល Profile -> Link Telegram រួចចុច Start ក្នុង Bot នេះ',
            ].join('\n');

            await this._sendMessage(chatId, guide, {
                inline_keyboard: [
                    [{ text: '📝 ផ្ញើសំណើបញ្ហាគណនី', callback_data: 'help_ticket:account' }],
                    [{ text: '🔙 ត្រឡប់ទៅម៉ឺនុយដើម (Main Menu)', callback_data: 'help_main' }],
                ],
            });
            return;
        }

        if (data === 'help_contact') {
            const contactText = [
                '📞 <b>ផ្នែកបម្រើអតិថិជន និងជំនួយបច្ចេកទេសផ្ទាល់ WFM</b>',
                '━━━━━━━━━━━━━━━━━━━━',
                '👤 <b>Telegram Support:</b> @wmsassitantVornManager_bot',
                '📱 <b>ទូរស័ព្ទបន្ទាន់ (Hotline):</b> <code>010 843 612</code>',
                '🕒 <b>ម៉ោងបម្រើការងារ:</b> ច័ន្ទ - សុក្រ (8:00 AM - 5:30 PM)',
                '',
                '<i>អ្នកអាចផ្ញើសាររៀបរាប់ពីបញ្ហាបានគ្រប់ពេល ក្រុមការងារនឹងឆ្លើយតបយ៉ាងរហ័ស!</i>',
            ].join('\n');

            await this._sendMessage(chatId, contactText, {
                inline_keyboard: [
                    [{ text: '📝 ផ្ញើសំបុត្រជំនួយ (Submit Ticket)', callback_data: 'help_ticket_prompt' }],
                    [{ text: '🔙 ត្រឡប់ទៅម៉ឺនុយដើម (Main Menu)', callback_data: 'help_main' }],
                ],
            });
            return;
        }

        if (data === 'help_link_prompt') {
            await this._sendMessage(
                chatId,
                '🔗 <b>ការភ្ជាប់គណនីប្រព័ន្ធ WFM</b>\n\nសូមចុចប៊ូតុង <b>"📲 ចែករំលែកលេខទូរស័ព្ទ / Share Phone Number"</b> ខាងក្រោម ឬចូលទៅកាន់ WFM Web -> <b>Profile -> Link Telegram</b> ដើម្បីភ្ជាប់គណនីដោយស្វ័យប្រវត្តិ។',
                {
                    keyboard: [[{ text: SHARE_PHONE_BUTTON_TEXT, request_contact: true }]],
                    one_time_keyboard: true,
                    resize_keyboard: true,
                },
            );
            return;
        }

        if (data === 'help_ticket_prompt') {
            const ticketPromptText = [
                '📝 <b>ជ្រើសរើសប្រភេទបញ្ហាដើម្បីបង្កើតសំបុត្រជំនួយ (Ticket):</b>',
                '<i>Please select the issue category:</i>',
            ].join('\n');

            await this._sendMessage(chatId, ticketPromptText, {
                inline_keyboard: [
                    [
                        { text: '🕒 បញ្ហាវត្តមាន (Attendance)', callback_data: 'help_ticket:attendance' },
                        { text: '💵 បញ្ហាបៀវត្ស (Payroll)', callback_data: 'help_ticket:payroll' },
                    ],
                    [
                        { text: '📁 បញ្ហាគម្រោង (Project)', callback_data: 'help_ticket:project' },
                        { text: '🔑 បញ្ហាគណនី (Account)', callback_data: 'help_ticket:account' },
                    ],
                    [
                        { text: '⚙️ បញ្ហាផ្សេងៗ (Other)', callback_data: 'help_ticket:other' },
                    ],
                    [
                        { text: '🔙 ត្រឡប់ទៅម៉ឺនុយដើម (Cancel)', callback_data: 'help_main' },
                    ],
                ],
            });
            return;
        }

        if (data.startsWith('help_ticket:')) {
            const category = data.slice('help_ticket:'.length);
            this._pendingTickets.set(chatId, { category, startedAt: Date.now() });

            const categoryLabels: Record<string, string> = {
                attendance: 'បញ្ហាវត្តមាន (Attendance)',
                payroll: 'បញ្ហាបៀវត្ស (Payroll)',
                project: 'បញ្ហាគម្រោង (Project)',
                account: 'បញ្ហាគណនី (Account)',
                other: 'បញ្ហាផ្សេងៗ (Other)',
            };

            const promptText = [
                `📝 <b>រាយការណ៍: ${categoryLabels[category] || category}</b>`,
                '━━━━━━━━━━━━━━━━━━━━',
                '✍️ សូមវាយបញ្ចូលព័ត៌មានលម្អិតនៃបញ្ហារបស់អ្នកនៅទីនេះ (អ្នកអាចផ្ញើរូបភាព Screenshot បន្ថែមបាន)៖',
                '',
                '<i>Please type your issue description or send a screenshot below:</i>',
            ].join('\n');

            await this._sendMessage(chatId, promptText, {
                inline_keyboard: [
                    [{ text: '❌ បោះបង់ (Cancel)', callback_data: 'help_ticket_cancel' }],
                ],
            });
            return;
        }
    }

    private async _handleTicketMessage(
        chatId: string,
        message: NonNullable<TelegramUpdateDto['message']>,
    ) {
        const pending = this._pendingTickets.get(chatId);
        const category = pending?.category || 'other';
        this._pendingTickets.delete(chatId);

        const text = message.text?.trim() || (message.photo ? '[User sent a Photo / Screenshot]' : 'N/A');
        const user = await this._repository.findByTelegramId(chatId);
        const userName = user ? `${user.name_en || user.name_kh || 'Linked User'}` : 'Guest User';
        const userPhone = user?.phone || 'N/A';
        const telegramUsername = message.from?.username ? `@${message.from.username}` : 'N/A';
        const ticketId = `WFM-${Math.floor(100000 + Math.random() * 900000)}`;

        // Send to Organization Log / Support group if configured
        await this._forwardTicketToSupportChannel(ticketId, category, userName, userPhone, telegramUsername, text);

        // Send confirmation back to user
        const confirmation = [
            '✅ <b>សំណើជំនួយរបស់អ្នកត្រូវបានបញ្ជូនដោយជោគជ័យ!</b>',
            '━━━━━━━━━━━━━━━━━━━━',
            `🎫 <b>លេខសំបុត្រ (Ticket ID):</b> <code>#${ticketId}</code>`,
            `📂 <b>ប្រភេទបញ្ហា:</b> ${category}`,
            `🕒 <b>កាលបរិច្ឆេទ:</b> ${new Date().toLocaleString('en-GB')}`,
            '',
            'ក្រុមការងារបច្ចេកទេស WFM នឹងពិនិត្យ និងឆ្លើយតបជូនអ្នកក្នុងពេលឆាប់ៗបំផុត។ អរគុណ!',
            '',
            '<i>Your support ticket has been received. Our WFM team will contact you shortly!</i>',
        ].join('\n');

        await this._sendMessage(chatId, confirmation, {
            inline_keyboard: [
                [{ text: '🏠 ត្រឡប់ទៅម៉ឺនុយដើម (Main Menu)', callback_data: 'help_main' }],
            ],
        });
    }

    private async _forwardTicketToSupportChannel(
        ticketId: string,
        category: string,
        userName: string,
        userPhone: string,
        telegramUsername: string,
        text: string,
    ) {
        const targetChatId =
            appConfig.ORGANIZATION_LOG.TELEGRAM_CHAT_ID ||
            appConfig.AUTH.TELEGRAM_BOT_TOKEN;

        if (!targetChatId) return;

        const ticketBroadcast = [
            `🎫 <b>NEW WFM SUPPORT TICKET #${ticketId}</b>`,
            '━━━━━━━━━━━━━━━━━━━━',
            `👤 <b>User:</b> ${userName} (${telegramUsername})`,
            `📱 <b>Phone:</b> ${userPhone}`,
            `📂 <b>Category:</b> ${category.toUpperCase()}`,
            `🕒 <b>Time:</b> ${new Date().toLocaleString('en-GB')}`,
            '',
            `💬 <b>Description:</b>\n${text}`,
        ].join('\n');

        const botToken =
            appConfig.ORGANIZATION_LOG.TELEGRAM_BOT_TOKEN ||
            appConfig.AUTH.TELEGRAM_BOT_TOKEN;

        if (!botToken || !appConfig.ORGANIZATION_LOG.TELEGRAM_CHAT_ID) return;

        try {
            await axios.post(
                `https://api.telegram.org/bot${botToken}/sendMessage`,
                {
                    chat_id: appConfig.ORGANIZATION_LOG.TELEGRAM_CHAT_ID,
                    text: ticketBroadcast,
                    parse_mode: 'HTML',
                },
                { timeout: 30000 },
            );
        } catch (error: any) {
            this._logger.warn(`Failed to broadcast support ticket #${ticketId}: ${error?.message || error}`);
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
        } catch (error: any) {
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
                    "⚠️ លេខទូរស័ព្ទនេះមិនត្រូវគ្នានឹងគណនី WFM ដែលអ្នកកំពុងភ្ជាប់ទេ។ សូមបង្កើតតំណភ្ជាប់ថ្មីពីប្រព័ន្ធ WFM ហើយព្យាយាមម្តងទៀត។\n<i>That phone number doesn't match the WFM account.</i>",
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
                `🟢 <b>ភ្ជាប់គណនី WFM បានជោគជ័យ!</b>\nសួស្តី ${pendingUser.name_en || pendingUser.name_kh}, អ្នកនឹងទទួលបានការជូនដំណឹងពីប្រព័ន្ធ WFM នៅទីនេះ។`,
                { remove_keyboard: true },
            );
            await this._handleHelpMenu(chatId);
            return;
        }

        await this._handlePhoneOnlyLink(chatId, contact, username);
    }

    /** Bare /start flow (no session token) — matches purely by phone number. */
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
                '🔴 <b>មិនជោគជ័យ!</b> លេខទូរសព្ទរបស់អ្នកមិនត្រូវគ្នានឹងគណនី WFM ណាមួយក្នុងប្រព័ន្ធឡើយ។\n\nសូមពិនិត្យមើលលេខទូរសព្ទក្នុងប្រព័ន្ធ WFM ឲ្យត្រូវនឹងលេខ Telegram របស់អ្នក ឬទាក់ទងអ្នកគ្រប់គ្រង។',
                { remove_keyboard: true },
            );
            await this._handleHelpMenu(chatId);
            return;
        }

        await this._repository.linkTelegram(matchedUser.id, {
            telegram_id: chatId,
            telegram_username: username ?? null,
            telegram_photo_url: null,
        });

        await this._sendMessage(
            chatId,
            `🟢 <b>ភ្ជាប់គណនី WFM បានជោគជ័យ!</b>\nសួស្តី ${matchedUser.name_en || matchedUser.name_kh}, អ្នកនឹងទទួលបានការជូនដំណឹងពីប្រព័ន្ធ WFM នៅទីនេះ។`,
            { remove_keyboard: true },
        );
        await this._handleHelpMenu(chatId);
    }

    private _phonesMatch(a?: string | null, b?: string | null): boolean {
        const digitsA = this._normalizePhone(a);
        const digitsB = this._normalizePhone(b);
        return !!digitsA && digitsA === digitsB;
    }

    /**
     * Strips a Cambodian phone number down to its national significant number.
     */
    private _normalizePhone(value?: string | null): string {
        let digits = (value ?? '').replace(/\D/g, '');
        if (digits.startsWith('855')) digits = digits.slice(3);
        if (digits.startsWith('0')) digits = digits.slice(1);
        return digits;
    }

    private async _handleFallback(chatId: string) {
        const user = await this._repository.findByTelegramId(chatId);
        if (user) {
            await this._handleHelpMenu(chatId);
            return;
        }

        await this._sendMessage(
            chatId,
            'សូមស្វាគមន៍មកកាន់ប្រព័ន្ធ WFM!\n\nដើម្បីភ្ជាប់គណនី សូមចូលទៅកាន់ WFM Web -> <b>Profile > Link Telegram</b>\nឬវាយ /help ដើម្បីបើកមជ្ឈមណ្ឌលជំនួយ។',
        );
        await this._handleHelpMenu(chatId);
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
                    parse_mode: 'HTML',
                    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
                    ...(messageThreadId ? { message_thread_id: messageThreadId } : {}),
                },
                { timeout: 30000 },
            );
            return data?.result?.message_id;
        } catch (error: any) {
            this._logger.warn(`Telegram bot sendMessage failed for chat ${chatId}: ${error?.response?.data ? JSON.stringify(error.response.data) : error?.message ?? error}`);
            return undefined;
        }
    }

    private async _startPolling() {
        if (this._isPolling) return;
        this._isPolling = true;
        this._logger.log('Starting Telegram Bot long-polling for local development...');

        try {
            await axios.post(
                `https://api.telegram.org/bot${appConfig.AUTH.TELEGRAM_BOT_TOKEN}/deleteWebhook`,
                {},
                { timeout: 15000 },
            );
        } catch {}

        let offset = 0;
        while (this._isPolling) {
            try {
                const { data } = await axios.post(
                    `https://api.telegram.org/bot${appConfig.AUTH.TELEGRAM_BOT_TOKEN}/getUpdates`,
                    { offset, timeout: 20 },
                    { timeout: 35000 },
                );

                if (data?.result && Array.isArray(data.result)) {
                    for (const update of data.result) {
                        offset = update.update_id + 1;
                        this.handleUpdate(update).catch((err) => {
                            this._logger.warn(`Error handling Telegram update: ${err?.message || err}`);
                        });
                    }
                }
            } catch (error: any) {
                if (!axios.isCancel(error)) {
                    await new Promise((resolve) => setTimeout(resolve, 3000));
                }
            }
        }
    }

    onModuleDestroy() {
        this._isPolling = false;
    }

}