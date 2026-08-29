// ===========================================================================>> Core Library
import { Injectable, InternalServerErrorException } from '@nestjs/common';

// ===========================================================================>> Third Party Library
import axios, { AxiosError } from 'axios';

// ===========================================================================>> Custom Library
// > Local
import { appConfig }                                                                             from 'src/app.config';
import { TELEGRAM_FORUM_THREAD_IDS, TELEGRAM_SEND_MESSAGE_PATH, ORGANIZATION_LOG_TELEGRAM_ENV, } from './telegram.constants';
import { TelegramForumTopic, TelegramParseMode }                                                 from './telegram.enums';

// ======================================= >> Code Starts Here << ========================== //
interface TelegramErrorLogPayload {
    system: string;
    environment: string;
    endpoint: string;
    method: string;
    status: number;
    error: string;
    ip: string;
    device: string;
    date?: Date | string;
}

interface TelegramLoginLogPayload {
    system: string;
    environment: string;
    user: string;
    credential: string;
    ip: string;
    device: string;
    browser: string;
    date?: Date | string;
}

interface TelegramForgotPasswordOtpLogPayload {
    system: string;
    environment: string;
    user: string;
    credential: string;
    date?: Date | string;
}

interface TelegramOtpVerificationLogPayload {
    system: string;
    environment: string;
    user: string;
    credential: string;
    date?: Date | string;
}

interface TelegramRegistrationLogPayload {
    system: string;
    environment: string;
    user: string;
    phone: string;
    email: string;
    date?: Date | string;
}

@Injectable()
export class TelegramService {
    async sendMessage(
        message: string,
        topicOrThreadId?: TelegramForumTopic | number,
    ) {
        const botToken = appConfig.ORGANIZATION_LOG.TELEGRAM_BOT_TOKEN;
        const chatId = appConfig.ORGANIZATION_LOG.TELEGRAM_CHAT_ID;

        if (!botToken) {
            throw new InternalServerErrorException(
                `${ORGANIZATION_LOG_TELEGRAM_ENV.BOT_TOKEN} is not configured`,
            );
        }

        if (!chatId) {
            throw new InternalServerErrorException(
                `${ORGANIZATION_LOG_TELEGRAM_ENV.CHAT_ID} is not configured`,
            );
        }

        const url = `https://api.telegram.org/bot${botToken}/${TELEGRAM_SEND_MESSAGE_PATH}`;
        const payload: Record<string, string | number> = {
            chat_id: chatId,
            text: message,
            parse_mode: TelegramParseMode.HTML,
        };

        if (topicOrThreadId !== undefined) {
            payload.message_thread_id =
                typeof topicOrThreadId === 'number'
                    ? topicOrThreadId
                    : TELEGRAM_FORUM_THREAD_IDS[topicOrThreadId];
        }

        try {
            return await axios.post(url, payload);
        } catch (err) {
            if (err instanceof AxiosError) {
                const description =
                    err.response?.data?.description ?? err.message;
                throw new InternalServerErrorException(
                    `Telegram sendMessage failed: ${description}`,
                );
            }

            throw err;
        }
    }

    async sendErrorLog(payload: TelegramErrorLogPayload) {
        return this.sendMessage(
            this.formatErrorLog(payload),
            TelegramForumTopic.ERROR,
        );
    }

    async sendLoginLog(payload: TelegramLoginLogPayload) {
        return this.sendMessage(
            this.formatTopicLog('Login', [
                ['SYSTEM', payload.system],
                ['ENV', payload.environment],
                ['DATE', this.formatShortDate(payload.date)],
                ['USER', payload.user],
                ['CREDENTIAL', payload.credential],
                ['IP', payload.ip],
                ['DEVICE', payload.device],
                ['BROWSER', payload.browser],
            ]),
            TelegramForumTopic.LOGIN,
        );
    }

    async sendOtpVerificationLog(payload: TelegramOtpVerificationLogPayload) {
        return this.sendMessage(
            this.formatTopicLog('OTP Verification', [
                ['SYSTEM', payload.system],
                ['ENV', payload.environment],
                ['DATE', this.formatShortDate(payload.date)],
                ['USER', payload.user],
                ['CREDENTIAL', payload.credential],
            ]),
            TelegramForumTopic.OTP,
        );
    }

    async sendForgotPasswordOtpLog(
        payload: TelegramForgotPasswordOtpLogPayload,
    ) {
        return this.sendMessage(
            this.formatTopicLog('OTP Verification (Forgot Password)', [
                ['SYSTEM', payload.system],
                ['ENV', payload.environment],
                ['DATE', this.formatShortDate(payload.date)],
                ['USER', payload.user],
                ['CREDENTIAL', payload.credential],
            ]),
            TelegramForumTopic.FORGOT_PASSWORD,
        );
    }

    async sendRegistrationLog(payload: TelegramRegistrationLogPayload) {
        return this.sendMessage(
            this.formatTopicLog('New Registration', [
                ['SYSTEM', payload.system],
                ['ENV', payload.environment],
                ['DATE', this.formatShortDate(payload.date)],
                ['USER', payload.user],
                ['PHONE', payload.phone],
                ['EMAIL', payload.email],
            ]),
            TelegramForumTopic.REGISTER,
        );
    }

    private formatErrorLog(payload: TelegramErrorLogPayload): string {
        const rows = [
            ['System', payload.system],
            ['Environment', payload.environment],
            ['Endpoint', payload.endpoint],
            ['Method', payload.method],
            ['Status', String(payload.status)],
            ['Error', payload.error],
            ['-------------------------------', ''],
            ['IP', payload.ip],
            ['Device', payload.device],
            ['Date', this.formatDate(payload.date)],
        ];

        const message = rows
            .map(([label, value]) =>
                value ? `${label.padEnd(12)}: ${value}` : label,
            )
            .join('\n');

        return `<pre>${this.escapeHtml(message)}</pre>`;
    }

    private formatTopicLog(
        title: string,
        rows: Array<[string, string]>,
    ): string {
        const maxLabelLength = Math.max(...rows.map(([label]) => label.length));
        const message = [
            title,
            ...rows.map(
                ([label, value]) =>
                    `• ${label.padEnd(maxLabelLength)}: ${value}`,
            ),
        ].join('\n');

        return this.escapeHtml(message);
    }

    private formatDate(value?: Date | string): string {
        if (typeof value === 'string') return value;

        const date = value ?? new Date();
        const formatter = new Intl.DateTimeFormat('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Phnom_Penh',
        });

        return formatter.format(date).replace(',', '').toLowerCase();
    }

    private formatShortDate(value?: Date | string): string {
        if (typeof value === 'string') return value;

        const date = value ?? new Date();
        const formatter = new Intl.DateTimeFormat('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            timeZone: 'Asia/Phnom_Penh',
        });

        return formatter.format(date).replace(/\//g, '-');
    }

    private escapeHtml(value: string): string {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
}
