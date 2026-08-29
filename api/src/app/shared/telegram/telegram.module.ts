// ===========================================================================>> Core Library
import { Module } from '@nestjs/common';

// ===========================================================================>> Custom Library
// > Local
import { TelegramService }        from './telegram.service';
import { TelegramTopicService }   from './telegram-topic.service';
import { TelegramWebhookService } from './telegram-webhook.service';

// ======================================= >> Code Starts Here << ========================== //
@Module({
    providers: [TelegramService, TelegramTopicService, TelegramWebhookService],
    exports: [TelegramService, TelegramTopicService, TelegramWebhookService],
})
export class TelegramModule {}
