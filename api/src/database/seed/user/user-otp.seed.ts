import { DataSource } from 'typeorm';
import { UserOTP } from 'src/app/model/user/otp.entity';
import { UserOtpSetting } from 'src/app/model/user/user-otp-setting.entity';
import { User } from 'src/app/model/user/users.entity';
import { OtpChannel, OtpPurpose } from 'src/app/enum/otp-channel.enum';

export class UserOTPSeeder {
    public static async seed(dataSource: DataSource) {
        const userRepo = dataSource.getRepository(User);
        const otpRepo = dataSource.getRepository(UserOTP);
        const otpSettingRepo = dataSource.getRepository(UserOtpSetting);

        const admin = await userRepo.findOne({ where: { phone: '087600063' } });

        if (!admin) {
            console.log(
                '\x1b[33mUser OTP seed skipped because user 087600063 is missing.\x1b[0m',
            );
            return;
        }

        // 2FA is opt-in: seed the setting row with every channel disabled so
        // no account gets the OTP popup by default. Users turn it on
        // themselves via the profile security (2FA) settings.
        const setting = await otpSettingRepo.findOne({
            where: { user_id: admin.id },
        });

        if (!setting) {
            await otpSettingRepo.save(
                otpSettingRepo.create({
                    user_id: admin.id,
                    phone_enabled: false,
                    telegram_enabled: false,
                    email_enabled: false,
                }),
            );
        }

        const exists = await otpRepo.findOne({
            where: { user_id: admin.id, otp: '123456' },
        });

        if (!exists) {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 1);

            await otpRepo.save(
                otpRepo.create({
                    user_id: admin.id,
                    otp: '123456',
                    purpose: OtpPurpose.LOGIN,
                    channel: OtpChannel.EMAIL,
                    expires_at: expiresAt,
                }),
            );
        } else {
            exists.purpose = OtpPurpose.LOGIN;
            exists.channel = OtpChannel.EMAIL;
            await otpRepo.save(exists);
        }

        console.log('\x1b[32mUser OTP seeded successfully\x1b[0m');
    }
}
