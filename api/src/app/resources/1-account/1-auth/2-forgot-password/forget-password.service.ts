// ===========================================================================>> Core Library
import { BadRequestException, Injectable } from '@nestjs/common';

// ===========================================================================>> Third Party Library
import { Brackets, DataSource } from 'typeorm';

// ===========================================================================>> Custom Library
// > Local
import { appConfig }                           from 'src/app.config';
import { OtpDeliveryService }                  from 'src/app/shared/otp/otp-delivery.service';
import { OtpService }                          from 'src/app/shared/otp/otp.service';
import { OtpChannel, OtpPurpose }              from 'src/app/enum/otp-channel.enum';
import { UserOTP }                             from 'src/app/model/user/otp.entity';
import { User }                                from 'src/app/model/user/users.entity';
import { ForgetPasswordDto, ResetPasswordDto, VerifyResetOtpDto } from './forget-password.dto';

type PasswordIdentifierDto = {
    username?: string;
    phone?: string;
    email?: string;
};

// ======================================= >> Code Starts Here << ========================== //
@Injectable()
export class ForgetPasswordService {
    constructor(
        private readonly _dataSource: DataSource,
        private readonly otpService: OtpService,
        private readonly otpDeliveryService: OtpDeliveryService,
    ) {}

    private getIdentifier(dto: PasswordIdentifierDto) {
        const phone = dto.phone?.trim() || undefined;
        const email = dto.email?.trim().toLowerCase() || undefined;
        const username = dto.username?.trim() || undefined;

        if (!phone && !email && !username)
            throw new BadRequestException('Field username is required');

        return { phone, email, username };
    }

    private async getUser(dto: PasswordIdentifierDto) {
        const { phone, email, username } = this.getIdentifier(dto);
        const users = await this._dataSource
            .getRepository(User)
            .createQueryBuilder('user')
            .where('user.deleted_at IS NULL')
            .andWhere(
                new Brackets((qb) => {
                    if (phone) qb.orWhere('user.phone = :phone', { phone });

                    if (email)
                        qb.orWhere('LOWER(user.email) = :email', { email });

                    if (username)
                        qb.orWhere(
                            '(user.phone = :username OR LOWER(user.email) = LOWER(:username))',
                            { username },
                        );
                }),
            )
            .getMany();

        if (!users.length) throw new BadRequestException('User not found');

        const userIds = new Set(users.map((user) => user.id));
        if (userIds.size > 1)
            throw new BadRequestException(
                'Phone and email belong to different users',
            );

        return users[0];
    }

    private getContact(dto: PasswordIdentifierDto) {
        const { phone, email, username } = this.getIdentifier(dto);
        return phone ?? email ?? username;
    }

    async forgetPassword(dto: ForgetPasswordDto) {
        const user = await this.getUser(dto);
        const contact = this.getContact(dto);
        const channels = await this.otpService.getEnabledChannelsByUser(
            user.id,
        );

        const challenge = await this.otpService.createChallenge(
            user.id,
            OtpPurpose.FORGOT_PASSWORD,
            5,
        );

        // Reset password has no channel-picker UI (unlike login), so send
        // straight away — prefer email since that's what the user typed in.
        const channel = channels.includes(OtpChannel.EMAIL)
            ? OtpChannel.EMAIL
            : channels[0];

        // Delivery is not awaited: the challenge is already stored, and waiting
        // on SMTP is what kept the code screen from appearing for seconds. A
        // failure is logged — the screen offers a resend.
        const delivery = channel
            ? this.otpService.sendChallenge(user, challenge.otp_token, channel)
            : this.sendWithoutChannel(user, challenge.otp_token);

        void delivery.catch((err: any) => {
            console.error(
                `[forgot-password] could not send the code to user ${user.id}:`,
                err?.message || err,
            );
        });

        return {
            status_code: 200,
            requires_otp: true,
            go_to_reset_password: true,
            otp_token: challenge.otp_token,
            channel: channel ?? OtpChannel.EMAIL,
            channels,
            expires_at: challenge.expires_at,
            contact,
            message: 'OTP is required',
        };
    }

    private async sendWithoutChannel(user: User, otpToken: string) {
        const otpRepo = this._dataSource.getRepository(UserOTP);
        const otpData = await otpRepo.findOne({
            where: { otp_token: otpToken },
        });

        const { SMTP_HOST, SMTP_USERNAME, SMTP_PASSWORD, FROM } = appConfig.SES;
        const emailConfigured = !!(
            SMTP_HOST &&
            SMTP_USERNAME &&
            SMTP_PASSWORD &&
            FROM
        );

        if (user.email && emailConfigured) {
            await this.otpDeliveryService.send(
                user,
                OtpChannel.EMAIL,
                otpData.otp,
                OtpPurpose.FORGOT_PASSWORD,
            );
        } else {
            console.warn(
                `[forgot-password] no OTP channel to deliver on; use the code ${otpData.otp} for user ${user.id}`,
            );
        }

        return {
            otp_token: otpToken,
            channel: OtpChannel.EMAIL,
            expires_at: otpData.expires_at,
        };
    }
    async verifyOtp(dto: VerifyResetOtpDto) {
        const user = await this.getUser(dto);
        const otpUser = await this.otpService.checkChallenge(
            dto.otp_token,
            dto.otp,
            OtpPurpose.FORGOT_PASSWORD,
        );

        if (otpUser.id !== user.id)
            throw new BadRequestException('Invalid OTP token');

        return { status_code: 200, message: 'OTP verified' };
    }

    async resetPassword(dto: ResetPasswordDto) {
        if (dto.new_password !== dto.confirm_password)
            throw new BadRequestException('Passwords do not match');

        const user = await this.getUser(dto);

        if (!dto.otp_token || !dto.otp)
            throw new BadRequestException(
                'Field otp_token and otp are required',
            );

        const otpUser = await this.otpService.verifyChallenge(
            dto.otp_token,
            dto.otp,
            OtpPurpose.FORGOT_PASSWORD,
        );
        if (otpUser.id !== user.id)
            throw new BadRequestException('Invalid OTP token');

        await user.setPassword(dto.new_password);

        await this._dataSource.transaction(async (manager) => {
            await manager.getRepository(User).save({
                id: user.id,
                password: user.password,
                password_changed_at: new Date(),
            });
            await manager.getRepository(UserOTP).delete({ user_id: user.id });
        });

        return {
            status_code: 200,
            message: 'Password reset successfully',
        };
    }
}
