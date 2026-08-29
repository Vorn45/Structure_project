// ===========================================================================>> Core Library
import { Module } from '@nestjs/common';

// ===========================================================================>> Custom Library
// > Local
import { UsernameModule }      from '../1-login/1-username/username.module';
import { TelegramLoginModule } from '../1-login/2-telegram/telegram-login.module';

// ======================================= >> Code Starts Here << ========================== //
@Module({
    imports: [UsernameModule, TelegramLoginModule],
})
export class LoginModule {}
