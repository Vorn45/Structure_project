import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';

// Shared modules
import { FirebaseModule } from './firebase/firebase.module';
import { MailModule } from './mail/mail.module';
import { TelegramModule } from './telegram/telegram.module';

// User & Security Models
import { User } from '../model/user/users.entity';
import { Role } from '../model/user/role.entity';
import { UserRole } from '../model/user/user_role.entity';
import { Permission } from '../model/user/permission.entity';
import { RolePermission } from '../model/user/role-permission.entity';
import { UserDevice } from '../model/user/user_devices.entity';
import { FcmToken } from '../model/user/fcm-token.entity';
import { UserSessions } from '../model/user/user_sessions.entity';
import { UserSessionLogs } from '../model/user/user_session_logs.entity';
import { UserRefreshToken } from '../model/user/user-refresh-token.entity';
import { UserOTP } from '../model/user/otp.entity';
import { UserOtpSetting } from '../model/user/user-otp-setting.entity';
import { TelegramThread } from '../model/user/telegram-thread.entity';
import { HomeLayoutSetting } from '../model/user/home-layout-setting.entity';
import { PasskeyCredential } from '../model/user/passkey-credential.entity';
import { PasskeyChallenge } from '../model/user/passkey-challenge.entity';
import { McpApiKey } from '../model/user/mcp-api-key.entity';
import { QrLoginSession } from '../model/user/qr-login-session.entity';
import { UserPasscode } from '../model/user/user-passcode.entity';

// Security Services
import { DeviceTrackingService } from './device/device-tracking.service';
import { FileService } from './file/file.service';
import { OtpDeliveryService } from './otp/otp-delivery.service';
import { OtpService } from './otp/otp.service';
import { AuthSessionService } from './auth/auth-session.service';
import { RefreshTokenService } from './auth/refresh-token.service';
import { UserRoleService } from './user/user-role.service';

const services = [
    DeviceTrackingService,
    FileService,
    OtpDeliveryService,
    OtpService,
    AuthSessionService,
    RefreshTokenService,
    UserRoleService,
];

@Global()
@Module({
    imports: [
        HttpModule,
        TelegramModule,
        FirebaseModule,
        MailModule,
        TypeOrmModule.forFeature([
            User,
            Role,
            UserRole,
            Permission,
            RolePermission,
            UserDevice,
            FcmToken,
            UserSessions,
            UserSessionLogs,
            UserRefreshToken,
            UserOTP,
            UserOtpSetting,
            TelegramThread,
            HomeLayoutSetting,
            PasskeyCredential,
            PasskeyChallenge,
            McpApiKey,
            QrLoginSession,
            UserPasscode,
        ]),
    ],
    controllers: [],
    providers: [...services],
    exports: [TypeOrmModule, TelegramModule, FirebaseModule, MailModule, ...services],
})
export class SharedModule {}
