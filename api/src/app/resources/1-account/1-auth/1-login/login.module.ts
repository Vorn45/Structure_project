// ===========================================================================>> Core Library
import { Module } from '@nestjs/common';

// ===========================================================================>> Custom Library
// > Local
import { UsernameModule }      from './1-username/username.module';
import { TelegramLoginModule } from './2-telegram/telegram-login.module';
import { GoogleLoginModule }   from './3-google/google-login.module';
import { TelegramBotModule }   from './4-telegram-bot/telegram-bot.module';
import { MiniAppLoginModule }  from './5-telegram-miniapp/miniapp-login.module';
import { PasskeyLoginModule }  from './6-passkey/passkey-login.module';
import { SsoLoginModule }      from './7-sso/sso-login.module';

// ======================================= >> Code Starts Here << ========================== //
@Module({
    imports: [UsernameModule, TelegramLoginModule, GoogleLoginModule, TelegramBotModule, MiniAppLoginModule, PasskeyLoginModule, SsoLoginModule],
})
export class LoginModule {}
