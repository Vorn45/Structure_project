// ===========================================================================>> Core Library
import { Routes } from '@nestjs/core';

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
export const loginRoutes: Routes = [
    { path: '', module: UsernameModule },
    { path: 'telegram', module: TelegramLoginModule },
    { path: 'google', module: GoogleLoginModule },
    { path: 'telegram-bot', module: TelegramBotModule },
    { path: 'mini-app', module: MiniAppLoginModule },
    { path: 'passkey', module: PasskeyLoginModule },
    { path: 'sso', module: SsoLoginModule },
];
