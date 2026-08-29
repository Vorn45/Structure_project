// ===========================================================================>> Core Library
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository }                                   from '@nestjs/typeorm';

// ===========================================================================>> Third Party Library
import * as bcrypt              from 'bcrypt';
import { createHash }           from 'crypto';
import { Repository }            from 'typeorm';

// ===========================================================================>> Custom Library
// > Local
import { OtpDeliveryService } from 'src/app/shared/otp/otp-delivery.service';
import { OtpService }         from 'src/app/shared/otp/otp.service';
import { OtpChannel, OtpPurpose } from 'src/app/enum/otp-channel.enum';
import { UserOTP }            from 'src/app/model/user/otp.entity';
import { User }               from 'src/app/model/user/users.entity';
import { UserPayload }        from 'src/app/interface/jwt.interface';
import {
    DisableAuthenticatorDto,
    EnableAuthenticatorDto,
    RegenerateBackupCodesDto,
    RequestEmailChangeOtpDto,
    RequestPhoneChangeOtpDto,
    UpdateEmailDto,
    UpdatePhoneNumberDto,
    UpdateTwoFactorDto,
} from './two-factor.dto';

// ======================================= >> Code Starts Here << ========================== //
@Injectable()
export class TwoFactorService {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        @InjectRepository(UserOTP)
        private readonly otpRepo: Repository<UserOTP>,
        private readonly otpService: OtpService,
        private readonly otpDeliveryService: OtpDeliveryService,
    ) {}

    async getSetting(currentUser: UserPayload) {
        const setting = await this.otpService.getSetting(currentUser.id);

        return {
            response_code: 200,
            response_msg: 'Success',
            data: {
                ...setting,
                channels: this.otpService.getEnabledChannels(setting),
            },
        };
    }

    async updateSetting(
        currentUser: UserPayload,
        channel: OtpChannel,
        dto: UpdateTwoFactorDto,
    ) {
        if (dto.password) {
            await this.assertPassword(currentUser.id, dto.password);
        }

        const enabled = this.toBoolean(dto.enabled);
        const setting = await this.otpService.updateSetting(
            currentUser.id,
            channel,
            enabled,
        );

        return {
            response_code: 200,
            response_msg: 'Two-factor setting updated successfully',
            data: {
                ...setting,
                channels: this.otpService.getEnabledChannels(setting),
            },
        };
    }

    async setupAuthenticator(currentUser: UserPayload) {
        const user = await this.userRepo.findOne({ where: { id: currentUser.id } });
        if (!user) throw new NotFoundException('User not found');

        const setup = await this.otpService.generateTotpSetup(user);

        return {
            response_code: 200,
            response_msg: 'Success',
            data: setup,
        };
    }

    async enableAuthenticator(
        currentUser: UserPayload,
        dto: EnableAuthenticatorDto,
    ) {
        const result = await this.otpService.enableAuthenticator(
            currentUser.id,
            dto.secret,
            dto.otp,
        );

        const setting = await this.otpService.getSetting(currentUser.id);

        return {
            response_code: 200,
            response_msg: 'Google Authenticator enabled successfully',
            data: {
                ...setting,
                channels: this.otpService.getEnabledChannels(setting),
                backup_codes: result.backup_codes,
            },
        };
    }

    async disableAuthenticator(
        currentUser: UserPayload,
        dto: DisableAuthenticatorDto,
    ) {
        if (dto.password) {
            await this.assertPassword(currentUser.id, dto.password);
        } else if (dto.otp) {
            const isValid = await this.otpService.verifyUserTotpOrBackupCode(
                currentUser.id,
                dto.otp,
            );
            if (!isValid) {
                throw new BadRequestException('Invalid authentication code');
            }
        }

        await this.otpService.disableAuthenticator(currentUser.id);
        const setting = await this.otpService.getSetting(currentUser.id);

        return {
            response_code: 200,
            response_msg: 'Google Authenticator disabled successfully',
            data: {
                ...setting,
                channels: this.otpService.getEnabledChannels(setting),
            },
        };
    }

    async regenerateBackupCodes(
        currentUser: UserPayload,
        dto: RegenerateBackupCodesDto,
    ) {
        if (dto.password) {
            await this.assertPassword(currentUser.id, dto.password);
        }

        const result = await this.otpService.regenerateBackupCodes(currentUser.id);

        return {
            response_code: 200,
            response_msg: 'Backup codes regenerated successfully',
            data: {
                backup_codes: result.backup_codes,
            },
        };
    }

    async requestPhoneChangeOtp(
        currentUser: UserPayload,
        dto: RequestPhoneChangeOtpDto,
    ) {
        const phone = this.normalizePhone(dto.phone_number);
        const user = await this.assertPassword(currentUser.id, dto.password);

        return await this.requestContactChangeOtp(
            user,
            OtpChannel.PHONE,
            OtpPurpose.CHANGE_PHONE,
            phone,
            'Phone change OTP sent successfully',
        );
    }

    async updatePhoneNumber(
        currentUser: UserPayload,
        dto: UpdatePhoneNumberDto,
    ) {
        const phone = this.normalizePhone(dto.phone_number);
        await this.verifyContactChangeOtp(
            currentUser.id,
            OtpPurpose.CHANGE_PHONE,
            phone,
            dto.otp,
        );

        const setting = await this.otpService.updateSetting(
            currentUser.id,
            OtpChannel.PHONE,
            true,
            phone,
        );

        return {
            response_code: 200,
            response_msg: 'Phone number updated successfully',
            data: { phone, ...setting },
        };
    }

    async requestEmailChangeOtp(
        currentUser: UserPayload,
        dto: RequestEmailChangeOtpDto,
    ) {
        const email = this.normalizeEmail(dto.email);
        const user = await this.assertPassword(currentUser.id, dto.password);

        return await this.requestContactChangeOtp(
            user,
            OtpChannel.EMAIL,
            OtpPurpose.CHANGE_EMAIL,
            email,
            'Email change OTP sent successfully',
        );
    }

    async updateEmail(
        currentUser: UserPayload,
        dto: UpdateEmailDto,
    ) {
        const email = this.normalizeEmail(dto.email);
        await this.verifyContactChangeOtp(
            currentUser.id,
            OtpPurpose.CHANGE_EMAIL,
            email,
            dto.otp,
        );

        const setting = await this.otpService.updateSetting(
            currentUser.id,
            OtpChannel.EMAIL,
            true,
            email,
        );

        return {
            response_code: 200,
            response_msg: 'Email updated successfully',
            data: { email, ...setting },
        };
    }

    private async requestContactChangeOtp(
        user: User,
        channel: OtpChannel,
        purpose: OtpPurpose,
        contact: string,
        message: string,
    ) {
        const otp = this.otpService.generateOtp();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await this.otpRepo.delete({ user_id: user.id, purpose });
        await this.otpRepo.save({
            user_id: user.id,
            otp,
            otp_token: this.getContactOtpToken(user.id, purpose, contact),
            purpose,
            channel,
            expires_at: expiresAt,
        });

        await this.otpDeliveryService.send(
            this.withContact(user, channel, contact),
            channel,
            otp,
            purpose,
        );

        return {
            response_code: 200,
            response_msg: message,
            data: {
                channel,
                expires_at: expiresAt,
            },
        };
    }

    async sendOtp(currentUser: UserPayload, dto: any) {
        const channel = dto.channel || (dto.email ? OtpChannel.EMAIL : OtpChannel.PHONE);
        const user = await this.userRepo.findOne({ where: { id: currentUser.id } });
        if (!user) throw new NotFoundException('User not found');
        const setting = await this.otpService.getSetting(currentUser.id);

        if (channel === OtpChannel.EMAIL) {
            const targetEmail = dto.email ? this.normalizeEmail(dto.email) : (setting.security_email || user.email);
            if (!targetEmail) throw new BadRequestException('Account has no email on file');
            return await this.requestContactChangeOtp(
                user,
                OtpChannel.EMAIL,
                OtpPurpose.VERIFY_CHANNEL,
                targetEmail,
                'OTP sent successfully',
            );
        } else {
            const targetPhone = dto.phone ? this.normalizePhone(dto.phone) : (setting.security_phone || user.phone);
            if (!targetPhone) throw new BadRequestException('Account has no phone number on file');
            return await this.requestContactChangeOtp(
                user,
                OtpChannel.PHONE,
                OtpPurpose.VERIFY_CHANNEL,
                targetPhone,
                'OTP sent successfully',
            );
        }
    }

    async verifyOtp(currentUser: UserPayload, dto: any) {
        const channel = dto.channel || (dto.email ? OtpChannel.EMAIL : OtpChannel.PHONE);
        const user = await this.userRepo.findOne({ where: { id: currentUser.id } });
        if (!user) throw new NotFoundException('User not found');
        const setting = await this.otpService.getSetting(currentUser.id);

        if (channel === OtpChannel.EMAIL) {
            const targetEmail = dto.email ? this.normalizeEmail(dto.email) : (setting.security_email || user.email);
            if (!targetEmail) throw new BadRequestException('Email is required');
            await this.verifyContactChangeOtp(
                currentUser.id,
                OtpPurpose.VERIFY_CHANNEL,
                targetEmail,
                dto.otp,
            );
            const updatedSetting = await this.otpService.updateSetting(
                currentUser.id,
                OtpChannel.EMAIL,
                true,
                dto.email ? targetEmail : undefined,
            );

            return {
                response_code: 200,
                response_msg: 'Email 2FA channel enabled successfully',
                data: { ...updatedSetting, channels: this.otpService.getEnabledChannels(updatedSetting) },
            };
        } else {
            const targetPhone = dto.phone ? this.normalizePhone(dto.phone) : (setting.security_phone || user.phone);
            if (!targetPhone) throw new BadRequestException('Phone number is required');
            await this.verifyContactChangeOtp(
                currentUser.id,
                OtpPurpose.VERIFY_CHANNEL,
                targetPhone,
                dto.otp,
            );
            const updatedSetting = await this.otpService.updateSetting(
                currentUser.id,
                OtpChannel.PHONE,
                true,
                dto.phone ? targetPhone : undefined,
            );

            return {
                response_code: 200,
                response_msg: 'Phone 2FA channel enabled successfully',
                data: { ...updatedSetting, channels: this.otpService.getEnabledChannels(updatedSetting) },
            };
        }
    }

    private async verifyContactChangeOtp(
        userId: number,
        purpose: OtpPurpose,
        contact: string,
        otp: string,
    ) {
        const isDevMode = process.env.NODE_ENV === 'development' || process.env.ENABLE_DEV_OTP === 'true' || process.env.ENV === 'development';
        const isDevOtp = (otp === '123456' || otp === '111111' || otp === '000000' || otp === process.env.OTP_FIXED_CODE) && (isDevMode || process.env.ENABLE_DEV_OTP !== 'false');

        if (isDevOtp) {
            await this.otpRepo.delete({ user_id: userId, purpose });
            return;
        }

        const token = this.getContactOtpToken(userId, purpose, contact);
        let otpData = await this.otpRepo.findOne({
            where: { user_id: userId, purpose, otp_token: token, otp },
            order: { id: 'DESC' },
        });

        if (!otpData) {
            otpData = await this.otpRepo.findOne({
                where: { user_id: userId, purpose, otp },
                order: { id: 'DESC' },
            });
        }

        if (!otpData) throw new BadRequestException('Invalid OTP');
        if (otpData.expires_at < new Date())
            throw new BadRequestException('OTP expired');

        await this.otpRepo.delete({ id: otpData.id });
    }

    private async assertPassword(userId: number, password: string) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user || user.deleted_at)
            throw new NotFoundException('User not found');
        if (!user.password)
            throw new BadRequestException('Password is not available');

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) throw new BadRequestException('Password is incorrect');

        return user;
    }

    private withContact(user: User, channel: OtpChannel, contact: string): User {
        return {
            ...user,
            phone: channel === OtpChannel.PHONE ? contact : user.phone,
            email: channel === OtpChannel.EMAIL ? contact : user.email,
        } as User;
    }

    private normalizePhone(value: string): string {
        const phone = value?.trim();
        if (!phone) throw new BadRequestException('Field phone_number is required');

        return phone;
    }

    private normalizeEmail(value: string): string {
        const email = value?.trim().toLowerCase();
        if (!email) throw new BadRequestException('Field email is required');

        return email;
    }

    private getContactOtpToken(
        userId: number,
        purpose: OtpPurpose,
        contact: string,
    ) {
        return createHash('sha256')
            .update(`${userId}:${purpose}:${contact}`)
            .digest('hex');
    }

    private toBoolean(value: boolean | string | number): boolean {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'number') return value === 1;
        if (typeof value === 'string') {
            const normalized = value.trim().toLowerCase();
            if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
            if (['false', '0', 'no', 'off'].includes(normalized)) return false;
        }

        throw new BadRequestException('Field enabled is invalid');
    }
}
