// ===========================================================================>> Core Library
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository }                from '@nestjs/typeorm';

// ===========================================================================>> Third Party Library
import { randomBytes }  from 'crypto';
import type { Request } from 'express';
import * as jwt         from 'jsonwebtoken';
import { IsNull, Repository } from 'typeorm';
import jwtConstants     from 'shared/jwt/constants';

// ===========================================================================>> Custom Library
// > Local
import { appConfig }                                                 from 'src/app.config';
import { isRegisteredAccount }                                       from 'src/app/common/utils/registered-account.util';
import { OtpChannel, OtpPurpose }                                     from 'src/app/enum/otp-channel.enum';
import { AuthProvider }                                               from 'src/app/enum/pms.enum';
import { UserOTP }                                                    from 'src/app/model/user/otp.entity';
import { Role }                                                       from 'src/app/model/user/role.entity';
import { UserRole }                                                   from 'src/app/model/user/user_role.entity';
import { User }                                                       from 'src/app/model/user/users.entity';
import { AuthSessionService }                                         from 'src/app/shared/auth/auth-session.service';
import { OtpDeliveryService }                                         from 'src/app/shared/otp/otp-delivery.service';
import { OtpService }                                                 from 'src/app/shared/otp/otp.service';
import { GoogleRegistrationPayload }                                        from '../1-login/3-google/google-login.service';
import { SignUpCheckPhoneDto, SignUpCompleteDto, SignUpResendDto, SignUpStartDto, SignUpVerifyDto } from './signup.dto';

// ======================================= >> Code Starts Here << ========================== //
/** Minutes a signup OTP stays valid. */
const OTP_EXPIRES_MINUTES = 5;

/** How long the post-verification token may be used to finish the signup. */
const REGISTRATION_TOKEN_EXPIRES_IN = '15m';


interface RegistrationPayload {
    sub: number;
    type: 'signup';
}

@Injectable()
export class SignUpService {
    constructor(
        @InjectRepository(User) private readonly userRepo: Repository<User>,
        @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
        @InjectRepository(UserRole)
        private readonly userRoleRepo: Repository<UserRole>,
        @InjectRepository(UserOTP)
        private readonly otpRepo: Repository<UserOTP>,
        private readonly otpService: OtpService,
        private readonly otpDeliveryService: OtpDeliveryService,
        private readonly authSessionService: AuthSessionService,
    ) {}


    async start(dto: SignUpStartDto) {
        const email = dto.email.trim().toLowerCase();
        const existing = await this.findByEmail(email);
        if (existing?.deleted_at) {
            this.userRepo.merge(existing, {
                deleted_at: null,
                sex_id: 1,
                name_kh: '',
                name_en: email.split('@')[0].slice(0, 50),
                phone: null,
                email,
                password: null,
                avatar_id: null,
                google_id: null,
                telegram_id: null,
                is_active: 1,
                auth_provider: AuthProvider.LOCAL,
                email_verified: false,
            });
            await this.userRepo.save(existing);
        } else if (existing && (await this.isRegistered(existing))) {
            throw new BadRequestException('Email is already registered');
        }

        const user =
            existing ??
            (await this.userRepo.save(
                this.userRepo.create({
                    sex_id: 1,
                    name_kh: '',
                    name_en: email.split('@')[0].slice(0, 50),
                    phone: null,
                    email,
                    password: null,
                    is_active: 1,
                    auth_provider: AuthProvider.LOCAL,
                    email_verified: false,
                }),
            ));

        const challenge = await this.issueOtp(user);

        return {
            status_code: 200,
            signup_token: challenge.signup_token,
            expires_at: challenge.expires_at,
            email,
            message: 'Verification code sent',
        };
    }

    /**
     * Step 1b — mail a fresh code for a signup already in progress.
     */
    async resend(dto: SignUpResendDto) {
        const user = await this.getPendingUserByToken(dto.signup_token);
        const challenge = await this.issueOtp(user);

        return {
            status_code: 200,
            signup_token: challenge.signup_token,
            expires_at: challenge.expires_at,
            email: user.email,
            message: 'Verification code resent',
        };
    }

    /**
     * Step 2 — check the code and hand back a short lived token that
     * authorises the final step.
     */
    async verify(dto: SignUpVerifyDto) {
        const user = await this.otpService.verifyChallenge(
            dto.signup_token,
            dto.otp,
            OtpPurpose.SIGNUP,
        );

        if (await this.isRegistered(user))
            throw new BadRequestException('Email is already registered');

        await this.userRepo.update({ id: user.id }, { email_verified: true });

        const payload: RegistrationPayload = { sub: user.id, type: 'signup' };

        return {
            status_code: 200,
            email: user.email,
            registration_token: jwt.sign(payload, jwtConstants.secret, {
                expiresIn: REGISTRATION_TOKEN_EXPIRES_IN,
            }),
            message: 'Email verified',
        };
    }

    /**
     * Step 3 — set the name and password, grant the default `user` role and
     * return the same payload a normal login would, so the client can drop the
     * new user straight into the app.
     */
    async complete(dto: SignUpCompleteDto, req: Request) {
        if (dto.password && dto.password !== dto.confirm_password)
            throw new BadRequestException('Passwords do not match');

        // A Google signup arrives already carrying its google_id, so the
        // "already registered" guard only applies to the email flow.
        const { user, isGoogle } = await this.getUserByRegistrationToken(
            dto.registration_token,
        );

        if (!isGoogle && (await this.isRegistered(user)))
            throw new BadRequestException('Email is already registered');

        const role = await this.roleRepo.findOne({ where: { slug: 'user' } });
        if (!role) throw new BadRequestException('Default User role not found');

        const personalWorkspaceRole = await this.roleRepo.findOne({
            where: { slug: 'personal_workspace' },
        });

        const phone = dto.phone?.trim() || null;
        if (phone) await this.assertPhoneIsFree(phone, user.id);

        if (dto.password) {
            await user.setPassword(dto.password);
            user.password_changed_at = new Date();
        }

        user.name_kh = dto.name_kh.trim().slice(0, 50);
        user.name_en = dto.name_en.trim().slice(0, 50);
        user.sex_id = dto.sex_id;
        user.phone = phone;
        user.email_verified = true;
        user.is_active = 1;
        const saved = await this.userRepo.save(user);

        // UQ_user_role_one_default has no deleted_at clause, so it counts
        // soft-deleted rows too — a revived account setting is_default below
        // would collide with any old row (deleted or not) still flagged
        // default from before the account was deleted. Clear every row first.
        await this.userRoleRepo
            .createQueryBuilder()
            .update()
            .set({ is_default: false })
            .where('user_id = :userId', { userId: saved.id })
            .andWhere('is_default = TRUE')
            .execute();

        // The uniqueness indexes on user_role ignore deleted_at, so an account
        // signing up again revives its old row instead of inserting a second.
        const hasRole = await this.userRoleRepo.findOne({
            where: {
                user_id: saved.id,
                role_id: role.id,
                organization_id: IsNull(),
            },
            withDeleted: true,
        });

        if (hasRole) {
            hasRole.deleted_at = null;
            hasRole.is_default = true;
            await this.userRoleRepo.save(hasRole);
        } else {
            await this.userRoleRepo.save({
                user_id: saved.id,
                role_id: role.id,
                organization_id: null,
                is_default: true,
            });
        }

        // Every self-registered user also gets a personal workspace — an
        // org-less role aggregating their tasks across every organization
        // they join later. Not `is_default`: the plain `user` role above
        // stays the landing role after signup.
        if (personalWorkspaceRole) {
            const hasPersonalWorkspaceRole = await this.userRoleRepo.findOne({
                where: {
                    user_id: saved.id,
                    role_id: personalWorkspaceRole.id,
                    organization_id: IsNull(),
                },
                withDeleted: true,
            });

            if (hasPersonalWorkspaceRole) {
                hasPersonalWorkspaceRole.deleted_at = null;
                await this.userRoleRepo.save(hasPersonalWorkspaceRole);
            } else {
                await this.userRoleRepo.save({
                    user_id: saved.id,
                    role_id: personalWorkspaceRole.id,
                    organization_id: null,
                    is_default: false,
                });
            }
        }

        await this.otpRepo.delete({
            user_id: saved.id,
            purpose: OtpPurpose.SIGNUP,
        });

        return await this.authSessionService.createLoginResponse(saved, req, {
            device_id: dto.device_id,
            login_method: 1,
            create_history: true,
        });
    }

    /**
     * Tells the details screen whether a number is still free, so a taken one is
     * reported while the user is looking at the phone field instead of after
     * they have gone on to pick a password.
     *
     * The token is only used to skip the signup's own row; an unreadable one is
     * ignored, because `complete()` re-checks anyway and this must never block
     * the step with a session error.
     */
    async checkPhone(dto: SignUpCheckPhoneDto) {
        const phone = dto.phone?.trim();
        if (!phone) return { available: true };

        let userId = 0;
        if (dto.registration_token) {
            try {
                const decoded = jwt.verify(
                    dto.registration_token,
                    jwtConstants.secret,
                ) as unknown as RegistrationPayload;
                if (decoded.type === 'signup' && decoded.sub) userId = decoded.sub;
            } catch {
                // Left as 0 — no row to exclude.
            }
        }

        await this.assertPhoneIsFree(phone, userId);

        return { available: true };
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------
    private async isRegistered(user: User): Promise<boolean> {
        return await isRegisteredAccount(this.userRepo.manager, user);
    }

    private async findByEmail(email: string): Promise<User | null> {
        return await this.userRepo
            .createQueryBuilder('user')
            .withDeleted()
            .where('LOWER(user.email) = :email', { email })
            .getOne();
    }

    /**
     * Replaces any in-flight signup code for the user with a new one and mails
     * it out. The token is what the client echoes back, so the raw code never
     * leaves the mailbox.
     */
    private async issueOtp(user: User) {
        
        const otp = this.otpService.generateOtp();
        const signupToken = randomBytes(32).toString('hex');

        await this.otpRepo.delete({
            user_id: user.id,
            purpose: OtpPurpose.SIGNUP,
        });

        const saved = await this.otpRepo.save({
            user_id: user.id,
            otp,
            otp_token: signupToken,
            purpose: OtpPurpose.SIGNUP,
            channel: OtpChannel.EMAIL,
            expires_at: new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000),
        });

        if (!this.isEmailConfigured()) {
            throw new BadRequestException(
                'Email delivery is not configured, so a verification code cannot be sent',
            );
        }

        // The code is already stored, so the caller does not need to wait for
        // the SMTP round trip — that handshake is what made the code screen
        // take seconds to appear. Failures are logged, not surfaced: the user
        // can resend from the code screen.
        void this.otpDeliveryService
            .send(user, OtpChannel.EMAIL, otp, OtpPurpose.SIGNUP)
            .catch((err: any) => {
                console.error(
                    `[signup] could not mail the code to ${user.email}:`,
                    err?.message || err,
                );
            });

        return { signup_token: saved.otp_token, expires_at: saved.expires_at };
    }

    private isEmailConfigured(): boolean {
        return !!(
            appConfig.SES.SMTP_HOST &&
            appConfig.SES.SMTP_USERNAME &&
            appConfig.SES.SMTP_PASSWORD &&
            appConfig.SES.FROM
        );
    }

    /**
     * Only live accounts hold a number: a deleted one cannot be signed in to,
     * so it releases its phone for whoever registers next.
     */
    private async assertPhoneIsFree(phone: string, userId: number) {
        const owner = await this.userRepo
            .createQueryBuilder('user')
            .where('user.phone = :phone', { phone })
            .andWhere('user.id != :userId', { userId })
            .getOne();

        if (owner)
            throw new BadRequestException(
                'Phone number is already used by another account',
            );
    }

    private async getPendingUserByToken(signupToken: string): Promise<User> {
        const otpData = await this.otpRepo.findOne({
            where: { otp_token: signupToken, purpose: OtpPurpose.SIGNUP },
            relations: ['user'],
            order: { id: 'DESC' },
        });
        if (!otpData?.user) throw new BadRequestException('Invalid signup token');
        if (await this.isRegistered(otpData.user))
            throw new BadRequestException('Email is already registered');

        return otpData.user;
    }

    private async getUserByRegistrationToken(
        token: string,
    ): Promise<{ user: User; isGoogle: boolean }> {
        let decoded: RegistrationPayload | GoogleRegistrationPayload;

        try {
            decoded = jwt.verify(token, jwtConstants.secret) as unknown as
                | RegistrationPayload
                | GoogleRegistrationPayload;
        } catch {
            throw new BadRequestException(
                'Registration session expired, please start again',
            );
        }

        // Google signups carry the verified identity rather than a user id —
        // nothing was written when the popup closed, so the row is created here.
        if (decoded.type === 'google-signup')
            return {
                user: await this.userFromGoogleToken(decoded),
                isGoogle: true,
            };

        if (decoded.type !== 'signup' || !decoded.sub)
            throw new BadRequestException('Invalid registration token');

        const user = await this.userRepo.findOne({
            where: { id: decoded.sub },
            relations: ['avatar_file'],
        });
        if (!user || user.deleted_at)
            throw new BadRequestException('User not found');

        return { user, isGoogle: false };
    }

    /**
     * Creates (or revives) the account a verified Google identity belongs to.
     * The caller fills in the name, sex and phone before saving, so this only
     * has to establish the row.
     */
    private async userFromGoogleToken(
        payload: GoogleRegistrationPayload,
    ): Promise<User> {
        const existing = await this.findByEmail(payload.email);

        if (existing && (await this.isRegistered(existing)))
            throw new BadRequestException('Email is already registered');

        // Reuses whatever row is there — a deleted account, or one left
        // pending by an abandoned email signup.
        if (existing) {
            this.userRepo.merge(existing, {
                deleted_at: null,
                sex_id: 1,
                name_kh: '',
                name_en: payload.name_en.slice(0, 50),
                phone: null,
                email: payload.email,
                password: null,
                avatar_id: null,
                telegram_id: null,
                auth_provider: AuthProvider.GOOGLE,
                google_id: payload.google_id,
                email_verified: true,
                first_name: payload.first_name,
                last_name: payload.last_name,
            });

            return await this.userRepo.save(existing);
        }

        return await this.userRepo.save(
            this.userRepo.create({
                sex_id: 1,
                name_kh: '',
                name_en: payload.name_en.slice(0, 50),
                phone: null,
                email: payload.email,
                password: null,
                is_active: 1,
                auth_provider: AuthProvider.GOOGLE,
                google_id: payload.google_id,
                email_verified: true,
                first_name: payload.first_name,
                last_name: payload.last_name,
            }),
        );
    }
}
