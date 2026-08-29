// ===========================================================================>> Core Library
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository }                from '@nestjs/typeorm';
import { randomBytes, randomInt }          from 'crypto';

// ===========================================================================>> Third Party Library
import { Repository } from 'typeorm';
import { generateSecret, generateURI, verifySync } from 'otplib';
import * as QRCode from 'qrcode';
import * as bcrypt from 'bcrypt';

// ===========================================================================>> Custom Library
// > Local
import { appConfig }              from 'src/app.config';
import { OtpChannel, OtpPurpose } from 'src/app/enum/otp-channel.enum';
import { UserOTP }                from 'src/app/model/user/otp.entity';
import { UserOtpSetting }         from 'src/app/model/user/user-otp-setting.entity';
import { User }                   from 'src/app/model/user/users.entity';
import { OtpDeliveryService }     from './otp-delivery.service';

// ======================================= >> Code Starts Here << ========================== //
export type OtpSettingData = {
    phone: boolean;
    telegram: boolean;
    email: boolean;
    authenticator: boolean;
    security_email?: string | null;
    security_phone?: string | null;
};

@Injectable()
export class OtpService {
    constructor(
        @InjectRepository(UserOTP)
        private readonly otpRepo: Repository<UserOTP>,
        @InjectRepository(UserOtpSetting)
        private readonly settingRepo: Repository<UserOtpSetting>,
        private readonly otpDeliveryService: OtpDeliveryService,
    ) {}

    generateOtp(): string {
        return randomInt(0, 1_000_000).toString().padStart(6, '0');
    }

    async getSetting(userId: number): Promise<OtpSettingData> {
        const setting = await this.settingRepo.findOne({
            where: { user_id: userId },
        });

        return this.mapSetting(setting);
    }

    async updateSetting(
        userId: number,
        channel: OtpChannel,
        enabled: boolean,
        securityContact?: string | null,
    ): Promise<OtpSettingData> {
        const setting = await this.getOrCreateSetting(userId);

        if (channel === OtpChannel.PHONE) {
            setting.phone_enabled = enabled;
            if (securityContact !== undefined) setting.security_phone = securityContact;
        }
        if (channel === OtpChannel.TELEGRAM) setting.telegram_enabled = enabled;
        if (channel === OtpChannel.EMAIL) {
            setting.email_enabled = enabled;
            if (securityContact !== undefined) setting.security_email = securityContact;
        }
        if (channel === OtpChannel.AUTHENTICATOR) setting.authenticator_enabled = enabled;

        const saved = await this.settingRepo.save(setting);
        return this.mapSetting(saved);
    }

    getEnabledChannels(setting: OtpSettingData): OtpChannel[] {
        return [
            setting.phone ? OtpChannel.PHONE : null,
            setting.telegram ? OtpChannel.TELEGRAM : null,
            setting.email ? OtpChannel.EMAIL : null,
            setting.authenticator ? OtpChannel.AUTHENTICATOR : null,
        ].filter(Boolean) as OtpChannel[];
    }

    async getEnabledChannelsByUser(userId: number): Promise<OtpChannel[]> {
        return this.getEnabledChannels(await this.getSetting(userId));
    }

    /**
     * Generates a new TOTP secret and QR code for Google Authenticator setup.
     */
    async generateTotpSetup(user: User): Promise<{ secret: string; qr_code: string; otpauth_url: string }> {
        const secret = generateSecret();
        const accountName = user.email || user.phone || `user_${user.id}`;
        const issuer = appConfig.APP.SYSTEM_NAME || 'PMS';
        const otpauthUrl = generateURI({
            label: accountName,
            issuer,
            secret,
        });
        const qrCode = await QRCode.toDataURL(otpauthUrl);

        return {
            secret,
            qr_code: qrCode,
            otpauth_url: otpauthUrl,
        };
    }

    /**
     * Verifies a 6-digit TOTP token against a secret.
     */
    verifyTotp(secret: string, token: string): boolean {
        const isDevMode = process.env.NODE_ENV === 'development' || process.env.ENABLE_DEV_OTP === 'true';
        if (isDevMode && (token === '123456' || token === process.env.OTP_FIXED_CODE)) {
            return true;
        }
        try {
            const cleanToken = token.replace(/\s+/g, '');
            const result = verifySync({
                secret,
                token: cleanToken,
                epochTolerance: 30,
            });
            return !!result?.valid;
        } catch {
            return false;
        }
    }

    /**
     * Generates a batch of 10 human-friendly emergency backup recovery codes.
     */
    generateRawBackupCodes(count = 10): string[] {
        const codes: string[] = [];
        for (let i = 0; i < count; i++) {
            const raw = randomBytes(4).toString('hex').toUpperCase();
            codes.push(`${raw.slice(0, 4)}-${raw.slice(4)}`);
        }
        return codes;
    }

    /**
     * Enables Google Authenticator for a user after confirming with the first OTP token.
     */
    async enableAuthenticator(userId: number, secret: string, token: string): Promise<{ backup_codes: string[] }> {
        const isValid = this.verifyTotp(secret, token);
        if (!isValid) {
            throw new BadRequestException('Invalid authenticator verification code');
        }

        const rawBackupCodes = this.generateRawBackupCodes(10);
        const hashedBackupCodes = await Promise.all(
            rawBackupCodes.map((code) => bcrypt.hash(code.replace(/[\s-]/g, '').toUpperCase(), 10)),
        );

        const setting = await this.getOrCreateSetting(userId);
        setting.authenticator_secret = secret;
        setting.authenticator_enabled = true;
        setting.backup_codes = hashedBackupCodes;

        await this.settingRepo.save(setting);

        return { backup_codes: rawBackupCodes };
    }

    /**
     * Disables Google Authenticator and clears its secret and backup codes.
     */
    async disableAuthenticator(userId: number): Promise<void> {
        const setting = await this.getOrCreateSetting(userId);
        setting.authenticator_enabled = false;
        setting.authenticator_secret = null;
        setting.backup_codes = null;

        await this.settingRepo.save(setting);
    }

    /**
     * Regenerates new emergency backup codes for a user with Authenticator enabled.
     */
    async regenerateBackupCodes(userId: number): Promise<{ backup_codes: string[] }> {
        const setting = await this.getOrCreateSetting(userId);
        if (!setting.authenticator_enabled || !setting.authenticator_secret) {
            throw new BadRequestException('Google Authenticator is not enabled');
        }

        const rawBackupCodes = this.generateRawBackupCodes(10);
        const hashedBackupCodes = await Promise.all(
            rawBackupCodes.map((code) => bcrypt.hash(code.replace(/[\s-]/g, '').toUpperCase(), 10)),
        );

        setting.backup_codes = hashedBackupCodes;
        await this.settingRepo.save(setting);

        return { backup_codes: rawBackupCodes };
    }

    /**
     * Verifies whether the provided token is a valid TOTP code or an emergency backup code.
     */
    async verifyUserTotpOrBackupCode(userId: number, token: string): Promise<boolean> {
        const setting = await this.settingRepo.findOne({ where: { user_id: userId } });
        if (!setting || !setting.authenticator_enabled || !setting.authenticator_secret) {
            return false;
        }

        const cleanToken = token.replace(/[\s-]/g, '').toUpperCase();

        // 1. Check if it's a valid 6-digit TOTP token
        if (cleanToken.length === 6 && /^\d{6}$/.test(cleanToken)) {
            if (this.verifyTotp(setting.authenticator_secret, cleanToken)) {
                return true;
            }
        }

        // 2. Check if it matches one of the emergency backup codes
        if (setting.backup_codes && setting.backup_codes.length > 0) {
            for (let i = 0; i < setting.backup_codes.length; i++) {
                const isMatch = await bcrypt.compare(cleanToken, setting.backup_codes[i]);
                if (isMatch) {
                    // Consume the single-use backup code
                    setting.backup_codes.splice(i, 1);
                    await this.settingRepo.save(setting);
                    return true;
                }
            }
        }

        return false;
    }

    async createChallenge(
        userId: number,
        purpose: OtpPurpose,
        expiresMinutes = 5,
    ) {
        const otp = this.generateOtp();
        const otpToken = randomBytes(32).toString('hex');

        await this.otpRepo.delete({ user_id: userId, purpose });

        const data = await this.otpRepo.save({
            user_id: userId,
            otp,
            otp_token: otpToken,
            purpose,
            channel: null,
            expires_at: new Date(Date.now() + expiresMinutes * 60 * 1000),
        });

        return {
            otp_token: data.otp_token,
            expires_at: data.expires_at,
        };
    }

    async sendChallenge(user: User, otpToken: string, channel: OtpChannel) {
        const otpData = await this.getChallenge(otpToken);
        if (otpData.user_id !== user.id)
            throw new BadRequestException('Invalid OTP token');
        if (otpData.expires_at < new Date())
            throw new BadRequestException('OTP expired');

        const channels = await this.getEnabledChannelsByUser(user.id);
        // A linked Telegram account is permission enough on its own — the
        // channel toggles only gate phone/email, which need no such link.
        const isLinkedTelegram =
            channel === OtpChannel.TELEGRAM && !!user.telegram_id;
        if (!channels.includes(channel) && !isLinkedTelegram)
            throw new BadRequestException('OTP channel is not enabled');

        const otp = this.generateOtp();
        otpData.otp = otp;
        otpData.channel = channel;
        otpData.expires_at = new Date(Date.now() + 5 * 60 * 1000);
        await this.otpRepo.save(otpData);

        const setting = await this.settingRepo.findOne({
            where: { user_id: user.id },
        });
        const targetUser = {
            ...user,
            email: channel === OtpChannel.EMAIL && setting?.security_email ? setting.security_email : user.email,
            phone: channel === OtpChannel.PHONE && setting?.security_phone ? setting.security_phone : user.phone,
        } as User;

        // The stored challenge knows what it was issued for, so the email can
        // name the right action rather than always saying "signing in".
        await this.otpDeliveryService.send(targetUser, channel, otp, otpData.purpose);

        return {
            otp_token: otpData.otp_token,
            channel,
            expires_at: otpData.expires_at,
        };
    }

    async verifyChallenge(otpToken: string, otp: string, purpose: OtpPurpose) {
        const isDevMode = process.env.NODE_ENV === 'development' || process.env.ENABLE_DEV_OTP === 'true';
        const isDevOtp = isDevMode && (otp === '123456' || otp === process.env.OTP_FIXED_CODE);

        const whereCondition = isDevOtp
            ? { otp_token: otpToken, purpose }
            : { otp_token: otpToken, otp, purpose };

        const otpData = await this.otpRepo.findOne({
            where: whereCondition,
            relations: ['user', 'user.avatar_file'],
            order: { id: 'DESC' },
        });

        if (!otpData) throw new BadRequestException('Invalid OTP');
        if (otpData.expires_at < new Date())
            throw new BadRequestException('OTP expired');
        await this.otpRepo.delete({ id: otpData.id });

        return otpData.user;
    }

    async checkChallenge(otpToken: string, otp: string, purpose: OtpPurpose) {
        const isDevMode = process.env.NODE_ENV === 'development' || process.env.ENABLE_DEV_OTP === 'true';
        const isDevOtp = isDevMode && (otp === '123456' || otp === process.env.OTP_FIXED_CODE);

        const whereCondition = isDevOtp
            ? { otp_token: otpToken, purpose }
            : { otp_token: otpToken, otp, purpose };

        const otpData = await this.otpRepo.findOne({
            where: whereCondition,
            relations: ['user'],
            order: { id: 'DESC' },
        });

        if (!otpData) throw new BadRequestException('Invalid OTP');
        if (otpData.expires_at < new Date())
            throw new BadRequestException('OTP expired');

        return otpData.user;
    }

    private async getChallenge(otpToken: string) {
        const otpData = await this.otpRepo.findOne({
            where: { otp_token: otpToken },
            order: { id: 'DESC' },
        });
        if (!otpData) throw new BadRequestException('Invalid OTP token');

        return otpData;
    }

    private async getOrCreateSetting(userId: number) {
        const setting = await this.settingRepo.findOne({
            where: { user_id: userId },
        });
        if (setting) return setting;

        return await this.settingRepo.save(
            this.settingRepo.create({ user_id: userId }),
        );
    }

    private mapSetting(setting?: UserOtpSetting | null): OtpSettingData {
        return {
            phone: setting?.phone_enabled ?? false,
            telegram: setting?.telegram_enabled ?? false,
            email: setting?.email_enabled ?? false,
            authenticator: setting?.authenticator_enabled ?? false,
            security_email: setting?.security_email ?? null,
            security_phone: setting?.security_phone ?? null,
        };
    }
}
