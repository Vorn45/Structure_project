import { Routes } from '@nestjs/core';
import { AccountModule } from './resources/1-account/2-profile/account.module';
import { UsernameModule } from './resources/1-account/1-auth/1-login/1-username/username.module';
import { TelegramLoginModule } from './resources/1-account/1-auth/1-login/2-telegram/telegram-login.module';
import { GoogleLoginModule } from './resources/1-account/1-auth/1-login/3-google/google-login.module';
import { TelegramBotModule } from './resources/1-account/1-auth/1-login/4-telegram-bot/telegram-bot.module';
import { MiniAppLoginModule } from './resources/1-account/1-auth/1-login/5-telegram-miniapp/miniapp-login.module';
import { PasskeyLoginModule } from './resources/1-account/1-auth/1-login/6-passkey/passkey-login.module';
import { SsoLoginModule } from './resources/1-account/1-auth/1-login/7-sso/sso-login.module';
import { ForgetPasswordModule } from './resources/1-account/1-auth/2-forgot-password/forget-password.module';
import { SignUpModule } from './resources/1-account/1-auth/3-signup/signup.module';
import { UserModule } from './resources/2-user/user.module';

export const appRoutes: Routes = [
    {
        path: 'auth',
        children: [
            { path: '', module: UsernameModule },
            { path: 'telegram', module: TelegramLoginModule },
            { path: 'google', module: GoogleLoginModule },
            { path: 'telegram-bot', module: TelegramBotModule },
            { path: 'mini-app', module: MiniAppLoginModule },
            { path: 'passkey', module: PasskeyLoginModule },
            { path: 'sso', module: SsoLoginModule },
            { path: '', module: ForgetPasswordModule },
            { path: '', module: SignUpModule },
        ],
    },
    {
        path: 'account',
        module: AccountModule,
    },
    {
        path: 'user',
        module: UserModule,
    },
];

