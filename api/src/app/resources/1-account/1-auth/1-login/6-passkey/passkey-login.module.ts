// ===========================================================================>> Core Library
import { Module } from '@nestjs/common';

// ===========================================================================>> Custom Library
import { PasskeyLoginController } from './passkey-login.controller';
import { PasskeyLoginService }    from './passkey-login.service';

// ======================================= >> Code Starts Here << ========================== //
@Module({
    controllers: [PasskeyLoginController],
    providers: [PasskeyLoginService],
    exports: [PasskeyLoginService],
})
export class PasskeyLoginModule {}
