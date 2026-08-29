// ===========================================================================>> Core Library
import { Module } from '@nestjs/common';

// ===========================================================================>> Custom Library
import { GoogleLoginController }  from './google-login.controller';
import { GoogleLoginService }     from './google-login.service';

// ======================================= >> Code Starts Here << ========================== //
@Module({
    controllers: [GoogleLoginController],
    providers: [GoogleLoginService],
    exports: [GoogleLoginService],
})
export class GoogleLoginModule {}
