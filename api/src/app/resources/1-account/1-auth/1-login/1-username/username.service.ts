// ===========================================================================>> Core Library
import { BadRequestException, Injectable, UnauthorizedException, } from '@nestjs/common';
import { InjectRepository }                                        from '@nestjs/typeorm';

// ===========================================================================>> Third Party Library
import * as bcrypt      from 'bcrypt';
import * as jwt         from 'jsonwebtoken';
import { Repository }   from 'typeorm';
import jwtConstants     from 'shared/jwt/constants';
import type { Request } from 'express';

// ===========================================================================>> Custom Library
// > Local
import { LoginRequestDto, SendOtpDto, VerifyOtptDto } from './username.dto';
import { User }                                       from 'src/app/model/user/users.entity';
import { UserPayload }                                from 'src/app/interface/jwt.interface';
import { UserOTP }                                    from 'src/app/model/user/otp.entity';
import { appConfig }                                  from 'src/app.config';
import { TelegramService }                            from 'src/app/shared/telegram/telegram.service';
import { DeviceTrackingService }                      from 'src/app/shared/device/device-tracking.service';
import { OtpService }                                 from 'src/app/shared/otp/otp.service';
import { OtpChannel, OtpPurpose }                     from 'src/app/enum/otp-channel.enum';
import { UserRoleService, RoleWithOrg }               from 'src/app/shared/user/user-role.service';
import { AuthSessionService }                         from 'src/app/shared/auth/auth-session.service';
import { RefreshTokenService }                        from 'src/app/shared/auth/refresh-token.service';

// ======================================= >> Code Starts Here << ========================== //
interface RefreshPayload {
    user: UserPayload;
    type: 'refresh';
    iat?: number;
    exp?: number;
}

@Injectable()
export class UsernameService {
    constructor(
        @InjectRepository(User) private readonly userRepo: Repository<User>,
        @InjectRepository(UserOTP)
        private readonly otpRepo: Repository<UserOTP>,
        private readonly deviceTrackingService: DeviceTrackingService,
        private readonly telegramService: TelegramService,
        private readonly otpService: OtpService,
        private readonly userRoleService: UserRoleService,
        private readonly authSessionService: AuthSessionService,
        private readonly refreshTokenService: RefreshTokenService,
    ) {}

    private async buildUserPayload(
        user: User,
        activeRoleId: number,
        activeOrganizationId: string | null,
        roles?: RoleWithOrg[],
    ): Promise<UserPayload> {
        const activeAvatar = this.userRoleService.mapAvatar(user.avatar_file);
        const userRoles =
            roles ?? (await this.userRoleService.getRoles(user.id));
        const activeRole =
            userRoles.find(
                (role) =>
                    role.user_role_id === activeRoleId &&
                    role.organization_id === activeOrganizationId,
            ) ?? userRoles.find((role) => role.user_role_id === activeRoleId);
        const defaultRoles = userRoles.filter((role) => role.is_default_role);
        const responseRoles = defaultRoles.length ? defaultRoles : [activeRole];

        return {
            id: user.id,
            sex_id: user.sex_id,
            avatar: activeAvatar,
            name_kh: user.name_kh,
            name_en: user.name_en,
            phone: user.phone,
            email: user.email ?? null,
            is_active: activeRoleId,
            organization_id: activeOrganizationId,
            roles: responseRoles
                .filter((role) => !!role)
                .map((role) => ({
                    ...this.userRoleService.mapRole(
                        role,
                        activeRoleId,
                        activeAvatar,
                        {},
                        role.organization_id,
                    ),
                    is_default: role.is_default_role,
                })),
        };
    }

    private signAccessToken(payload: UserPayload): string {
        return jwt.sign({ user: payload }, jwtConstants.secret, {
            expiresIn: appConfig.AUTH.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
        });
    }

    private async getCurrentUser(id: number): Promise<User> {
        const user = await this.userRepo.findOne({
            where: { id },
            relations: ['avatar_file'],
        });
        if (!user || user.deleted_at)
            throw new UnauthorizedException('User not found');
        return user;
    }

    private async getActiveRole(
        user: User,
        requestedRoleId?: number,
        requestedOrganizationId?: string | null,
    ) {
        let roles = await this.userRoleService.getRoles(user.id);
        if (!roles.length) {
            roles = await this.userRoleService.ensureHasRole(user.id);
        }
        const activeRole =
            (requestedRoleId !== undefined
                ? roles.find(
                      (role) =>
                          role.user_role_id === requestedRoleId &&
                          (requestedOrganizationId === undefined ||
                              role.organization_id === requestedOrganizationId),
                  ) ?? roles.find((role) => role.user_role_id === requestedRoleId)
                : undefined) ??
            roles.find((role) => role.is_default_role) ??
            roles[0];

        return {
            activeRoleId: activeRole?.user_role_id,
            activeOrganizationId: activeRole?.organization_id ?? null,
            roles,
        };
    }

    async login(loginDto: LoginRequestDto, req: Request) {
        try {
            const { username, password } = loginDto;

            const user = await this.userRepo
                .createQueryBuilder('user')
                .leftJoinAndSelect('user.avatar_file', 'avatar_file')
                .where('user.phone = :username', { username })
                .orWhere('LOWER(user.email) = LOWER(:username)', { username })
                .getOne();

            if (!user)
                throw new BadRequestException('Invalid username or password');

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch)
                throw new BadRequestException('Invalid username or password');

            const channels = await this.otpService.getEnabledChannelsByUser(
                user.id,
            );

            if (!channels.length) {
                const response =
                    await this.authSessionService.createLoginResponse(
                        user,
                        req,
                        {
                            device_id: loginDto.device_id,
                            login_method: 1,
                            create_history: true,
                        },
                    );

                return { ...response, requires_otp: false };
            }

            const challenge = await this.otpService.createChallenge(
                user.id,
                OtpPurpose.LOGIN,
                5,
            );

            // Prefer Authenticator if enabled, otherwise Email, otherwise first enabled channel
            const channel = channels.includes(OtpChannel.AUTHENTICATOR)
                ? OtpChannel.AUTHENTICATOR
                : (channels.includes(OtpChannel.EMAIL)
                    ? OtpChannel.EMAIL
                    : (channels[0] || OtpChannel.EMAIL));

            // Only send delivery challenge if not Authenticator (TOTP is generated offline)
            if (channel !== OtpChannel.AUTHENTICATOR) {
                await this.otpService.sendChallenge(
                    user,
                    challenge.otp_token,
                    channel,
                );
            }

            this.telegramService
                .sendLoginLog({
                    system: appConfig.APP.SYSTEM_NAME,
                    environment: appConfig.APP.ENV_LABEL,
                    user:
                        user.name_kh ||
                        user.name_en ||
                        user.phone ||
                        user.email ||
                        'Unknown',
                    credential: username,
                    ip:
                        this.deviceTrackingService.getClientIp(req) ??
                        'Unknown',
                    device: 'OTP',
                    browser: 'Pending',
                })
                .catch((err) =>
                    console.error(
                        'Failed to send login Telegram log',
                        err?.message || err,
                    ),
                );

            const setting = await this.otpService.getSetting(user.id);

            return {
                status_code: 200,
                requires_otp: true,
                otp_token: challenge.otp_token,
                channel,
                channels,
                user: {
                    id: user.id,
                    email: setting?.security_email || user.email,
                    phone: setting?.security_phone || user.phone,
                    name_kh: user.name_kh,
                    name_en: user.name_en,
                },
                expires_at: challenge.expires_at,
                message: 'OTP is required',
            };
        } catch (err: any) {
            console.log(err);
            throw new BadRequestException(err.message || 'Login failed');
        }
    }

    async verifyOtp(body: VerifyOtptDto, req: Request) {
        try {
            let user: User;
            if (body.otp_token) {
                const otpData = await this.otpRepo.findOne({
                    where: { otp_token: body.otp_token, purpose: OtpPurpose.LOGIN },
                    relations: ['user', 'user.avatar_file'],
                });
                if (otpData?.user) {
                    const isTotpValid = await this.otpService.verifyUserTotpOrBackupCode(
                        otpData.user.id,
                        body.otp,
                    );
                    if (isTotpValid) {
                        user = otpData.user;
                        await this.otpRepo.delete({ id: otpData.id });
                    } else {
                        user = await this.otpService.verifyChallenge(
                            body.otp_token,
                            body.otp,
                            OtpPurpose.LOGIN,
                        );
                    }
                } else {
                    user = await this.otpService.verifyChallenge(
                        body.otp_token,
                        body.otp,
                        OtpPurpose.LOGIN,
                    );
                }
            } else {
                user = await this.verifyLegacyOtp(body);
            }
            const { activeRoleId, activeOrganizationId, roles } =
                await this.getActiveRole(user);

            if (!activeRoleId)
                throw new BadRequestException(
                    'User does not have any valid roles',
                );

            const payload = await this.buildUserPayload(
                user,
                activeRoleId,
                activeOrganizationId,
                roles,
            );
            const tracked = await this.deviceTrackingService.touchActivity(
                user.id,
                req,
                {
                    device_id: body.device_id,
                    login_method: 1,
                },
            );
            payload.session_id = tracked.session.id;
            const token = this.signAccessToken(payload);
            const refresh_token = await this.refreshTokenService.issue(
                tracked.session,
                payload,
            );

            this.telegramService
                .sendOtpVerificationLog({
                    system: appConfig.APP.SYSTEM_NAME,
                    environment: appConfig.APP.ENV_LABEL,
                    user:
                        user.name_kh ||
                        user.name_en ||
                        user.phone ||
                        user.email ||
                        'Unknown',
                    credential: body.username ?? body.otp_token ?? 'OTP',
                })
                .catch((err) =>
                    console.error(
                        'Failed to send OTP Telegram log',
                        err?.message || err,
                    ),
                );

            return {
                status_code: 200,
                user: payload,
                device: this.mapTrackedDevice(tracked),
                token,
                refresh_token,
                message: 'Success',
            };
        } catch (err: any) {
            throw new BadRequestException(err.message);
        }
    }

    async sendOtp(body: SendOtpDto) {
        if (body.channel === OtpChannel.AUTHENTICATOR) {
            return {
                status_code: 200,
                message: 'Use Google Authenticator on your device',
                data: {
                    otp_token: body.otp_token,
                    channel: OtpChannel.AUTHENTICATOR,
                },
            };
        }

        const otpData = await this.otpRepo.findOne({
            where: { otp_token: body.otp_token },
            relations: ['user'],
            order: { id: 'DESC' },
        });
        if (!otpData?.user) throw new BadRequestException('Invalid OTP token');

        const data = await this.otpService.sendChallenge(
            otpData.user,
            body.otp_token,
            body.channel,
        );

        const setting = await this.otpService.getSetting(otpData.user.id);

        return {
            status_code: 200,
            message: 'OTP sent successfully',
            data,
            user: {
                id: otpData.user.id,
                email: setting?.security_email || otpData.user.email,
                phone: setting?.security_phone || otpData.user.phone,
            },
        };
    }

    async resendOtp(username: string, requestedChannel?: OtpChannel) {
        try {
            const user = await this.userRepo
                .createQueryBuilder('user')
                .where('user.phone = :username', { username })
                .orWhere('LOWER(user.email) = LOWER(:username)', { username })
                .getOne();
            if (!user) throw new BadRequestException('User not found');

            const channels = await this.otpService.getEnabledChannelsByUser(
                user.id,
            );
            const channel = (requestedChannel && (channels.includes(requestedChannel) || requestedChannel === OtpChannel.EMAIL || requestedChannel === OtpChannel.PHONE || requestedChannel === OtpChannel.AUTHENTICATOR))
                ? requestedChannel
                : (channels.includes(OtpChannel.AUTHENTICATOR)
                    ? OtpChannel.AUTHENTICATOR
                    : (channels.includes(OtpChannel.EMAIL) ? OtpChannel.EMAIL : channels[0] || OtpChannel.EMAIL));

            const challenge = await this.otpService.createChallenge(
                user.id,
                OtpPurpose.LOGIN,
                5,
            );

            if (channel !== OtpChannel.AUTHENTICATOR) {
                await this.otpService.sendChallenge(
                    user,
                    challenge.otp_token,
                    channel,
                );
            }

            const setting = await this.otpService.getSetting(user.id);

            return {
                status_code: 200,
                message: channel === OtpChannel.AUTHENTICATOR ? 'Use Google Authenticator on your device' : 'OTP resent successfully',
                otp_token: challenge.otp_token,
                channel,
                channels,
                user: {
                    id: user.id,
                    email: setting?.security_email || user.email,
                    phone: setting?.security_phone || user.phone,
                },
            };
        } catch (err: any) {
            throw new BadRequestException(err.message);
        }
    }

    private async verifyLegacyOtp(body: VerifyOtptDto) {
        if (!body.username)
            throw new BadRequestException(
                'Field username or otp_token is required',
            );

        const isDevMode = process.env.NODE_ENV === 'development' || process.env.ENABLE_DEV_OTP === 'true';
        const isDevOtp = isDevMode && (body.otp === '123456' || body.otp === process.env.OTP_FIXED_CODE);

        const dbUser = await this.userRepo
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.avatar_file', 'avatar_file')
            .where(
                '(user.phone = :username OR LOWER(user.email) = LOWER(:username))',
                { username: body.username },
            )
            .getOne();

        if (dbUser) {
            const isTotpValid = await this.otpService.verifyUserTotpOrBackupCode(
                dbUser.id,
                body.otp,
            );
            if (isTotpValid) {
                return dbUser;
            }
        }

        const qb = this.otpRepo
            .createQueryBuilder('otp')
            .leftJoinAndSelect('otp.user', 'user')
            .leftJoinAndSelect('user.avatar_file', 'avatar_file')
            .where(
                '(user.phone = :username OR LOWER(user.email) = LOWER(:username))',
                { username: body.username },
            );

        if (!isDevOtp) {
            qb.andWhere('otp.otp = :otp', { otp: body.otp });
        }

        const otpData = await qb.orderBy('otp.id', 'DESC').getOne();

        if (!otpData) throw new BadRequestException('Invalid OTP');
        if (otpData.expires_at < new Date())
            throw new BadRequestException('OTP expired');
        await this.otpRepo.delete({ id: otpData.id });

        return otpData.user;
    }

    async refreshToken(refreshToken: string, req: Request, deviceId?: string) {
        try {
            let userId: number;
            let requestedRoleId: number | undefined;
            let requestedOrganizationId: string | null | undefined;
            let nextRefreshToken: string | undefined;
            let trackedDeviceId = deviceId;

            if (this.refreshTokenService.isOpaqueToken(refreshToken)) {
                const rotated = await this.refreshTokenService.rotate(refreshToken);
                userId = rotated.stored.user_id;
                requestedRoleId = rotated.stored.active_role_id ?? undefined;
                requestedOrganizationId =
                    rotated.stored.active_organization_id ?? null;
                nextRefreshToken = rotated.refreshToken;
                trackedDeviceId = rotated.session.device?.device_id ?? deviceId;
            } else {
                // Temporary migration path for refresh JWTs issued before this
                // release. Every successful use upgrades the session to an
                // opaque, revocable refresh token.
                const decoded = jwt.verify(
                    refreshToken,
                    appConfig.AUTH.JWT_REFRESH_SECRET,
                ) as RefreshPayload;
                if (decoded.type !== 'refresh' || !decoded.user?.id) {
                    throw new UnauthorizedException('Invalid refresh token');
                }
                userId = decoded.user.id;
                requestedRoleId = decoded.user.is_active;
                requestedOrganizationId = decoded.user.organization_id;
            }

            const user = await this.getCurrentUser(userId);
            const { activeRoleId, activeOrganizationId, roles } =
                await this.getActiveRole(
                    user,
                    requestedRoleId,
                    requestedOrganizationId,
                );

            if (!activeRoleId)
                throw new UnauthorizedException(
                    'User does not have any valid roles',
                );

            const tracked = await this.deviceTrackingService.touchActivity(
                user.id,
                req,
                {
                    device_id: trackedDeviceId,
                },
            );
            const payload = await this.buildUserPayload(
                user,
                activeRoleId,
                activeOrganizationId,
                roles,
            );
            payload.session_id = tracked.session.id;
            if (nextRefreshToken) {
                await this.refreshTokenService.updateContext(payload);
            }
            const token = this.signAccessToken(payload);
            const refresh_token =
                nextRefreshToken ??
                (await this.refreshTokenService.issue(tracked.session, payload));

            return {
                status_code: 200,
                user: payload,
                device: this.mapTrackedDevice(tracked),
                token,
                refresh_token,
                message: 'Token refreshed successfully',
            };
        } catch (err) {
            if (err instanceof UnauthorizedException) throw err;
            throw new UnauthorizedException('Invalid or expired refresh token');
        }
    }

    async logout(req: Request, deviceId?: string) {
        const authorization = req.headers.authorization;
        if (!authorization?.startsWith('Bearer ')) {
            throw new UnauthorizedException('Authorization token is required');
        }

        try {
            const decoded = jwt.verify(
                authorization.slice(7),
                jwtConstants.secret,
            ) as { user: UserPayload };
            await this.refreshTokenService.revokeSession(
                decoded.user.id,
                decoded.user.session_id,
            );
            await this.deviceTrackingService.logout(
                decoded.user.id,
                req,
                deviceId,
            );
            return { status_code: 200, message: 'Logged out successfully' };
        } catch {
            throw new UnauthorizedException('Invalid or expired access token');
        }
    }

    private mapTrackedDevice(
        tracked: Awaited<ReturnType<DeviceTrackingService['trackLogin']>>,
    ) {
        return {
            id: tracked.device.id,
            device_id: tracked.device.device_id,
            name: tracked.device.device_name,
            platform: tracked.device.platform,
            os: tracked.device.os,
            browser: tracked.device.browser,
            device_type: tracked.device.device_type,
            ip: tracked.ip,
            country: this.deviceTrackingService.getCountryName(
                tracked.location.country_code,
            ),
            country_code: tracked.location.country_code,
            region: tracked.location.region,
            city: tracked.location.city,
            timezone: tracked.location.timezone,
            last_activity_at: tracked.device.last_activity_at,
        };
    }
}
