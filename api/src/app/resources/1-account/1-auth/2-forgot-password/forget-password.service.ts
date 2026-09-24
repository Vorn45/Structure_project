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

        // The reset code always goes to the email on the account, whichever
        // OTP channels the user has turned on for login.
        if (!user.email)
            throw new BadRequestException(
                'This account has no email address. Please contact your administrator.',
            );

        const challenge = await this.otpService.createChallenge(
            user.id,
            OtpPurpose.FORGOT_PASSWORD,
            5,
        );

        // Delivery is not awaited: the challenge is already stored, and waiting
        // on SMTP is what kept the code screen from appearing for seconds. A
        // failure is logged — the screen offers a resend.
        void this.sendEmail(user, challenge.otp_token).catch((err: any) => {
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
            channel: OtpChannel.EMAIL,
            sent_to: this.maskEmail(user.email),
            expires_at: challenge.expires_at,
            contact,
            message: 'OTP is required',
        };
    }

    private async sendEmail(user: User, otpToken: string) {
        const otpData = await this._dataSource
            .getRepository(UserOTP)
            .findOne({ where: { otp_token: otpToken } });

        const { SMTP_HOST, SMTP_USERNAME, SMTP_PASSWORD, FROM } = appConfig.SES;
        if (!(SMTP_HOST && SMTP_USERNAME && SMTP_PASSWORD && FROM)) {
            console.warn(
                `[forgot-password] SMTP is not configured; use the code ${otpData.otp} for user ${user.id}`,
            );
            return;
        }

        await this.otpDeliveryService.send(
            user,
            OtpChannel.EMAIL,
            otpData.otp,
            OtpPurpose.FORGOT_PASSWORD,
        );
    }

    // "sokha.dara@gmail.com" -> "so*******@gmail.com"
    private maskEmail(email: string) {
        const [name, domain] = email.split('@');
        const visible = name.slice(0, Math.min(2, name.length));
        return `${visible}${'*'.repeat(Math.max(name.length - visible.length, 3))}@${domain}`;
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
