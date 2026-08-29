// ===========================================================================>> Core Library
import { BadRequestException, Injectable, InternalServerErrorException, Logger, } from '@nestjs/common';

// ===========================================================================>> Third Party Library
import axios from 'axios';

// ===========================================================================>> Custom Library
// > Local
import { appConfig }     from 'src/app.config';
import { OtpChannel, OtpPurpose } from 'src/app/enum/otp-channel.enum';
import { User }          from 'src/app/model/user/users.entity';
import { buildOtpEmail } from 'src/app/shared/mail/templates/otp.template';
import { SesService }    from 'src/app/shared/mail/ses.service';

// ======================================= >> Code Starts Here << ========================== //
@Injectable()
export class OtpDeliveryService {
    private readonly logger = new Logger(OtpDeliveryService.name);
    private readonly isDevMode = process.env.NODE_ENV === 'development';

    constructor(private readonly _sesService: SesService) {}

    async send(
        user: User,
        channel: OtpChannel,
        otp: string,
        purpose: OtpPurpose = OtpPurpose.LOGIN,
    ) {
        this.logger.warn(`\n\n========== OTP GENERATED ==========`);
        this.logger.warn(`User   : ${user.email || user.phone}`);
        this.logger.warn(`Channel: ${channel}`);
        this.logger.warn(`Purpose: ${purpose}`);
        this.logger.warn(`OTP    : ${otp}`);
        this.logger.warn(`==================================\n`);

        const message = `Your ${appConfig.APP.SYSTEM_NAME} OTP code is ${otp}.`;

        if (channel === OtpChannel.EMAIL) {
            try {
                await this.sendEmail(user, otp, purpose);
            } catch (err: any) {
                this.logger.error(`Failed to send email to ${user.email}: ${err?.message || err}`);
            }
            return;
        }

        if (channel === OtpChannel.TELEGRAM) {
            try {
                await this.sendTelegram(user, message);
            } catch (err: any) {
                this.logger.error(`Failed to send Telegram message to ${user.telegram_id}: ${err?.message || err}`);
            }
            return;
        }

        if (channel === OtpChannel.PHONE) {
            try {
                await this.sendSms(user, message);
            } catch (err: any) {
                this.logger.error(`Failed to send SMS to ${user.phone}: ${err?.message || err}`);
            }
            return;
        }

        throw new BadRequestException('Invalid OTP channel');
    }

    private async sendSms(user: User, message: string) {
        if (!user.phone)
            throw new BadRequestException('User phone is not available');
        if (!appConfig.OTP.SMS_API_URL)
            throw new InternalServerErrorException(
                'OTP SMS API is not configured',
            );

        await axios.post(
            appConfig.OTP.SMS_API_URL,
            { to: user.phone, message },
            {
                headers: appConfig.OTP.SMS_API_TOKEN
                    ? { Authorization: `Bearer ${appConfig.OTP.SMS_API_TOKEN}` }
                    : undefined,
                timeout: 30000,
            },
        );
    }

    private async sendTelegram(user: User, message: string) {
        if (!user.telegram_id)
            throw new BadRequestException('User Telegram is not available');
        if (!appConfig.AUTH.TELEGRAM_BOT_TOKEN)
            throw new InternalServerErrorException(
                'Telegram bot token is not configured',
            );

        await axios.post(
            `https://api.telegram.org/bot${appConfig.AUTH.TELEGRAM_BOT_TOKEN}/sendMessage`,
            {
                chat_id: user.telegram_id,
                text: message,
            },
            { timeout: 30000 },
        );
    }

    private async sendEmail(user: User, otp: string, purpose: OtpPurpose) {
        if (!user.email)
            throw new BadRequestException('User email is not available');

        const { subject, html, text, inline_images } = buildOtpEmail({
            otp,
            email: user.email,
            expires_in_minutes: 5,
            purpose,
        });

        const sent = await this._sesService.send({
            to: user.email,
            subject,
            html,
            text,
            inline_images,
        });

        if (!sent)
            throw new InternalServerErrorException(
                'Failed to send OTP email',
            );
    }
}
