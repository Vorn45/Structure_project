// ===========================================================================>> Core Library
import { HttpModule }    from '@nestjs/axios';
import { Module }        from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// ===========================================================================>> Custom Library
// > Local
import { CommonModule }        from 'src/app/common/common.module';
import { FileService }         from 'src/app/shared/file/file.service';
import { OrganizationMember }  from 'src/app/model/organization/organization-member.entity';
import { OrganizationTelegramMember } from 'src/app/model/organization/organization-telegram-member.entity';
import { QrLoginSession }      from 'src/app/model/user/qr-login-session.entity';
import { UserOTP }             from 'src/app/model/user/otp.entity';
import { User }                from 'src/app/model/user/users.entity';
import { UserSessions }        from 'src/app/model/user/user_sessions.entity';
import { UserSessionLogs }     from 'src/app/model/user/user_session_logs.entity';
import { UserPasscode }        from 'src/app/model/user/user-passcode.entity';
import { PasskeyCredential }   from 'src/app/model/user/passkey-credential.entity';
import { PasskeyChallenge }    from 'src/app/model/user/passkey-challenge.entity';
import { AccountController }   from './account.controller';
import { AccountService }      from './account.service';
import { TwoFactorController } from './1-2fa/two-factor.controller';
import { TwoFactorService }    from './1-2fa/two-factor.service';
import { PasscodeController }  from './2-passcode/passcode.controller';
import { PasscodeService }     from './2-passcode/passcode.service';
import { PasskeyController }   from './3-passkey/passkey.controller';
import { PasskeyService }      from './3-passkey/passkey.service';

// ======================================= >> Code Starts Here << ========================== //
@Module({
    imports: [
        HttpModule,
        CommonModule,
        TypeOrmModule.forFeature([User, UserOTP, OrganizationMember, OrganizationTelegramMember, QrLoginSession, UserSessions, UserSessionLogs, UserPasscode, PasskeyCredential, PasskeyChallenge]),
    ],
    controllers: [AccountController, TwoFactorController, PasscodeController, PasskeyController],
    providers: [AccountService, TwoFactorService, PasscodeService, PasskeyService, FileService],
})
export class AccountModule {}
