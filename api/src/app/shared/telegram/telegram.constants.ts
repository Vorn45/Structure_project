// ===========================================================================>> Custom Library
// > Local
import { TelegramForumTopic } from './telegram.enums';

// ======================================= >> Code Starts Here << ========================== //
export const TELEGRAM_SEND_MESSAGE_PATH = 'sendMessage';

export const ORGANIZATION_LOG_TELEGRAM_ENV = {
    BOT_TOKEN: 'ORGANIZATION_LOG_TELEGRAM_BOT_TOKEN',
    CHAT_ID: 'ORGANIZATION_LOG_TELEGRAM_CHAT_ID',
} as const;

export const TELEGRAM_FORUM_THREAD_IDS: Record<TelegramForumTopic, number> = {
    [TelegramForumTopic.LOGIN]: 2,
    [TelegramForumTopic.ERROR]: 3,
    [TelegramForumTopic.OTP]: 4,
    [TelegramForumTopic.FORGOT_PASSWORD]: 5,
    [TelegramForumTopic.TRANSFER]: 6,
    [TelegramForumTopic.CPD_CLAIM]: 7,
    [TelegramForumTopic.PRESENTATION]: 8,
    [TelegramForumTopic.LICENSE_RENEWAL]: 9,
    [TelegramForumTopic.LICENSE_APPLICATION]: 10,
    [TelegramForumTopic.REGISTRATION]: 11,
    [TelegramForumTopic.REGISTER]: 12,
    [TelegramForumTopic.DATA_VERIFICATION]: 13,
};
