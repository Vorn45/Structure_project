// ===========================================================================>> Core Library
import { Module } from '@nestjs/common';

// ===========================================================================>> Custom Library
import { SsoLoginController } from './sso-login.controller';
import { SsoLoginService }    from './sso-login.service';

// ======================================= >> Code Starts Here << ========================== //
@Module({
    controllers: [SsoLoginController],
    providers: [SsoLoginService],
    exports: [SsoLoginService],
})
export class SsoLoginModule {}
