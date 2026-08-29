// ===========================================================================>> Core Library
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// ===========================================================================>> Custom Library
// > Local
import { User } from 'src/app/model/user/users.entity';
import { TelegramThread } from 'src/app/model/user/telegram-thread.entity';
import { OrganizationMember } from 'src/app/model/organization/organization-member.entity';
import { TelegramBotController } from './telegram-bot.controller';
import { TelegramBotRepository } from './telegram-bot.repository';
import { TelegramBotService } from './telegram-bot.service';

// ======================================= >> Code Starts Here << ========================== //
@Module({
    imports: [
        TypeOrmModule.forFeature([User, TelegramThread, OrganizationMember]),
    ],
    controllers: [TelegramBotController],
    providers: [TelegramBotService, TelegramBotRepository],
})
export class TelegramBotModule {}
