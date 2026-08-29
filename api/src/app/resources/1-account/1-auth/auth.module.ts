// ===========================================================================>> Core Library
import { Module } from '@nestjs/common';

// ===========================================================================>> Custom Library
import { UsernameModule }      from './1-login/1-username/username.module';
import { TelegramLoginModule } from './1-login/2-telegram/telegram-login.module';
import { GoogleLoginModule }   from './1-login/3-google/google-login.module';
import { TelegramBotModule }   from './1-login/4-telegram-bot/telegram-bot.module';
import { MiniAppLoginModule }  from './1-login/5-telegram-miniapp/miniapp-login.module';
import { PasskeyLoginModule }  from './1-login/6-passkey/passkey-login.module';
import { SsoLoginModule }      from './1-login/7-sso/sso-login.module';
import { ForgetPasswordModule } from './2-forgot-password/forget-password.module';
import { SignUpModule }         from './3-signup/signup.module';

// ======================================= >> Code Starts Here << ========================== //
@Module({
    imports: [
        UsernameModule,
        TelegramLoginModule,
        GoogleLoginModule,
        TelegramBotModule,
        MiniAppLoginModule,
        PasskeyLoginModule,
        SsoLoginModule,
        ForgetPasswordModule,
        SignUpModule,
    ],
})
export class AuthModule {}
