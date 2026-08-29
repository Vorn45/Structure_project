// ===========================================================================>> Core Library
import { BadRequestException, ForbiddenException, Injectable, NotFoundException, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

// ===========================================================================>> Third Party Library
import * as bcrypt        from 'bcrypt';
import { randomBytes }    from 'crypto';
import { Repository }     from 'typeorm';

// ===========================================================================>> Custom Library
// > Local
import { OtpChannel, OtpPurpose } from 'src/app/enum/otp-channel.enum';
import { OtpDeliveryService }     from 'src/app/shared/otp/otp-delivery.service';
import { OtpService }             from 'src/app/shared/otp/otp.service';
import { UserOTP }                from 'src/app/model/user/otp.entity';
import { User }                   from 'src/app/model/user/users.entity';
import { UserPasscode }           from 'src/app/model/user/user-passcode.entity';
import { UserPayload }            from 'src/app/interface/jwt.interface';
import {
    RequestPasscodeResetOtpDto,
    SetPasscodeDto,
    UpdateIdleTimeoutDto,
    VerifyPasscodeDto,
    VerifyPasscodeResetOtpDto,
} from './passcode.dto';

// ======================================= >> Code Starts Here << ========================== //
// No existing brute-force throttling primitive in this codebase to reuse (see
// account-security review) — a short passcode is materially weaker than the
// account password, so this feature gets its own minimal lockout: 5 wrong
// attempts locks verification out for 5 minutes.
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 5;

@Injectable()
export class PasscodeService {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        @InjectRepository(UserPasscode)
        private readonly passcodeRepo: Repository<UserPasscode>,
        @InjectRepository(UserOTP)
        private readonly otpRepo: Repository<UserOTP>,
        private readonly otpService: OtpService,
        private readonly otpDeliveryService: OtpDeliveryService,
    ) {}

    async getStatus(currentUser: UserPayload) {
        const record = await this.passcodeRepo.findOne({ where: { user_id: currentUser.id } });

        return {
            response_code: 200,
            response_msg: 'Success',
            data: {
                enabled: record?.enabled ?? false,
                idle_timeout_minutes: record?.idle_timeout_minutes ?? 5,
            },
        };
    }

    /** Sets (or resets) the passcode. The caller is already authenticated
     *  (JWT), which is enough to set/change the passcode in-session; a
     *  `reset_token` minted by `verifyResetOtp` is only required for the
     *  forgot-passcode-via-email flow, which proves identity out of band
     *  instead. */
    async setPasscode(currentUser: UserPayload, dto: SetPasscodeDto) {
        const user = await this.userRepo.findOne({ where: { id: currentUser.id } });
        if (!user || user.deleted_at) throw new NotFoundException('User not found');

        const record = await this.getOrCreate(currentUser.id);

        if (dto.reset_token) {
            this.redeemResetTicket(record, dto.reset_token);
        }

        await record.setPasscode(dto.passcode);
        record.enabled = true;
        record.failed_attempts = 0;
        record.locked_until = null;
        record.reset_ticket = null;
        record.reset_ticket_expires_at = null;
        if (dto.idle_timeout_minutes != null) record.idle_timeout_minutes = dto.idle_timeout_minutes;
        await this.passcodeRepo.save(record);

        return {
            response_code: 200,
            response_msg: 'Local passcode set successfully',
            data: { enabled: true, idle_timeout_minutes: record.idle_timeout_minutes },
        };
    }

    /** Throws unless `token` is exactly the ticket `verifyResetOtp` just
     *  minted for this user, and it hasn't expired — does not clear the
     *  ticket itself (the caller clears it as part of the same save once the
     *  new passcode is actually persisted, so a failed `setPasscode` call
     *  doesn't burn the ticket). */
    private redeemResetTicket(record: UserPasscode, token: string): void {
        if (
            !record.reset_ticket ||
            record.reset_ticket !== token ||
            !record.reset_ticket_expires_at ||
            record.reset_ticket_expires_at < new Date()
        ) {
            throw new BadRequestException('Reset session expired or invalid — verify your email again');
        }
    }

    async updateIdleTimeout(currentUser: UserPayload, dto: UpdateIdleTimeoutDto) {
        const record = await this.passcodeRepo.findOne({ where: { user_id: currentUser.id } });
        if (!record || !record.enabled) throw new BadRequestException('Local passcode is not enabled');

        record.idle_timeout_minutes = dto.idle_timeout_minutes;
        await this.passcodeRepo.save(record);

        return {
            response_code: 200,
            response_msg: 'Idle timeout updated successfully',
            data: { idle_timeout_minutes: record.idle_timeout_minutes },
        };
    }

    /** Verifies a passcode attempt against the server-stored hash — the
     *  client never receives or stores anything that alone lets it verify
     *  itself, which is the whole point of moving this server-side. */
    async verify(currentUser: UserPayload, dto: VerifyPasscodeDto) {
        const record = await this.passcodeRepo.findOne({ where: { user_id: currentUser.id } });
        if (!record || !record.enabled || !record.passcode_hash) {
            return { response_code: 200, response_msg: 'Success', data: { valid: true } };
        }

        if (record.locked_until && record.locked_until > new Date()) {
            const secondsLeft = Math.ceil((record.locked_until.getTime() - Date.now()) / 1000);
            throw new ForbiddenException(`Too many attempts — try again in ${secondsLeft}s`);
        }

        const isMatch = await bcrypt.compare(dto.passcode, record.passcode_hash);

        if (!isMatch) {
            record.failed_attempts += 1;
            if (record.failed_attempts >= MAX_FAILED_ATTEMPTS) {
                record.locked_until = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
                record.failed_attempts = 0;
            }
            await this.passcodeRepo.save(record);
            return { response_code: 200, response_msg: 'Success', data: { valid: false } };
        }

        record.failed_attempts = 0;
        record.locked_until = null;
        await this.passcodeRepo.save(record);
        return { response_code: 200, response_msg: 'Success', data: { valid: true } };
    }

    /** Disabling requires the current passcode, same defense-in-depth the
     *  account password change already applies to itself. */
    async disable(currentUser: UserPayload, dto: VerifyPasscodeDto) {
        const record = await this.passcodeRepo.findOne({ where: { user_id: currentUser.id } });
        if (!record || !record.enabled) {
            return { response_code: 200, response_msg: 'Local passcode already disabled', data: { enabled: false } };
        }

        const verifyResult = await this.verify(currentUser, dto);
        if (!verifyResult.data.valid) throw new BadRequestException('Passcode is incorrect');

        record.enabled = false;
        record.passcode_hash = null;
        record.failed_attempts = 0;
        record.locked_until = null;
        await this.passcodeRepo.save(record);

        return {
            response_code: 200,
            response_msg: 'Local passcode disabled successfully',
            data: { enabled: false },
        };
    }

    /** Forgot-passcode is an account-recovery flow, not a routine login
     *  step — it must always be able to reach the user's email regardless
     *  of their optional 2FA channel toggles (email/phone/telegram), same
     *  as the account's own forgot-password flow. `OtpService.sendChallenge`
     *  gates delivery on those toggles (meant for login/verify prompts), so
     *  this delivers directly via `OtpDeliveryService` instead, mirroring
     *  `ForgetPasswordService.sendWithoutChannel`. */
    async requestResetOtp(currentUser: UserPayload, _dto: RequestPasscodeResetOtpDto) {
        const user = await this.userRepo.findOne({ where: { id: currentUser.id } });
        if (!user) throw new NotFoundException('User not found');
        if (!user.email) throw new BadRequestException('No email on file for this account');

        const challenge = await this.otpService.createChallenge(user.id, OtpPurpose.RESET_PASSCODE);
        const otpData = await this.otpRepo.findOne({ where: { otp_token: challenge.otp_token } });

        await this.otpDeliveryService.send(user, OtpChannel.EMAIL, otpData.otp, OtpPurpose.RESET_PASSCODE);

        return {
            response_code: 200,
            response_msg: 'OTP sent to your email',
            data: { otp_token: challenge.otp_token },
        };
    }

    /** Verifying the OTP alone does NOT reset the passcode — it only proves
     *  identity and mints a short-lived, single-use `reset_token`. The
     *  caller still has to submit a new passcode via `setPasscode()` with
     *  that token, mirroring how the account's own forgot-password flow
     *  separates "verify" from "set new value" into two steps. */
    async verifyResetOtp(currentUser: UserPayload, dto: VerifyPasscodeResetOtpDto) {
        const user = await this.otpService.verifyChallenge(dto.otp_token, dto.otp, OtpPurpose.RESET_PASSCODE);
        if (user.id !== currentUser.id) throw new BadRequestException('Invalid OTP token');

        const record = await this.getOrCreate(user.id);
        record.reset_ticket = randomBytes(32).toString('hex');
        record.reset_ticket_expires_at = new Date(Date.now() + 5 * 60 * 1000);
        await this.passcodeRepo.save(record);

        return {
            response_code: 200,
            response_msg: 'Email verified',
            data: { reset_token: record.reset_ticket },
        };
    }

    private async getOrCreate(userId: number): Promise<UserPasscode> {
        const existing = await this.passcodeRepo.findOne({ where: { user_id: userId } });
        if (existing) return existing;
        return this.passcodeRepo.create({ user_id: userId });
    }
}
