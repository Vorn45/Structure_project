// ===========================================================================>> Core Library
import { Module } from '@nestjs/common';

// ===========================================================================>> Custom Library
// > Local
import { TelegramLoginModule }  from '../2-telegram/telegram-login.module';
import { MiniAppLoginController } from './miniapp-login.controller';
import { MiniAppLoginService }    from './miniapp-login.service';

// ======================================= >> Code Starts Here << ========================== //
@Module({
    imports: [TelegramLoginModule],
    controllers: [MiniAppLoginController],
    providers: [MiniAppLoginService],
})
export class MiniAppLoginModule {}
