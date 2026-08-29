// ===========================================================================>> Core Library
import { BadRequestException, Injectable, UnauthorizedException, } from '@nestjs/common';
import { createHash, createHmac, timingSafeEqual }                 from 'crypto';

// ===========================================================================>> Third Party Library
import * as jwt         from 'jsonwebtoken';
import type { Request } from 'express';
import jwtConstants     from 'shared/jwt/constants';

// ===========================================================================>> Custom Library
// > Local
import { appConfig }               from 'src/app.config';
import { UserPayload }             from 'src/app/interface/jwt.interface';
import { User }                    from 'src/app/model/user/users.entity';
import { TelegramLoginDto }        from './telegram-login.dto';
import { TelegramLoginRepository } from './telegram-login.repository';
import { DeviceTrackingService }   from 'src/app/shared/device/device-tracking.service';
import { UserRoleService, RoleWithOrg } from 'src/app/shared/user/user-role.service';
import { RefreshTokenService }          from 'src/app/shared/auth/refresh-token.service';

// ======================================= >> Code Starts Here << ========================== //
@Injectable()
export class TelegramLoginService {
    constructor(
        private readonly _repository: TelegramLoginRepository,
        private readonly deviceTrackingService: DeviceTrackingService,
        private readonly userRoleService: UserRoleService,
        private readonly refreshTokenService: RefreshTokenService,
    ) {}

    private async buildUserPayload(
        user: User,
        activeRoleId: number,
        activeOrganizationId: string | null,
        roles?: RoleWithOrg[],
    ): Promise<UserPayload> {
        const userRoles =
            roles ?? (await this.userRoleService.getRoles(user.id));
        const activeAvatar = this.userRoleService.mapAvatar(user.avatar_file) ?? {
            id: null,
            uri: user.telegram_photo_url ?? null,
            file_domain: null,
        };
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

    private verifyTelegramData(dto: TelegramLoginDto) {
        if (!appConfig.AUTH.TELEGRAM_BOT_TOKEN)
            throw new BadRequestException(
                'Telegram bot token is not configured',
            );

        const data: Record<string, string | number> = {
            id: dto.telegram_id,
            auth_date: dto.auth_date,
        };

        if (dto.first_name) data.first_name = dto.first_name;
        if (dto.last_name) data.last_name = dto.last_name;
        if (dto.telegram_username) data.username = dto.telegram_username;
        if (dto.telegram_photo_url) data.photo_url = dto.telegram_photo_url;

        const checkString = Object.keys(data)
            .sort()
            .map((key) => `${key}=${data[key]}`)
            .join('\n');

        const secretKey = createHash('sha256')
            .update(appConfig.AUTH.TELEGRAM_BOT_TOKEN)
            .digest();
        const calculatedHash = createHmac('sha256', secretKey)
            .update(checkString)
            .digest('hex');

        const calculated = Buffer.from(calculatedHash, 'hex');
        const received = Buffer.from(dto.hash, 'hex');

        if (
            calculated.length !== received.length ||
            !timingSafeEqual(calculated, received)
        ) {
            throw new UnauthorizedException('Invalid Telegram login data');
        }

        const isExpired =
            Date.now() / 1000 - Number(dto.auth_date) > 24 * 60 * 60;
        if (isExpired)
            throw new UnauthorizedException('Telegram login data expired');
    }

    async login(dto: TelegramLoginDto, req: Request) {
        this.verifyTelegramData(dto);

        return await this.loginVerified(dto, req);
    }

    /** Provisioning + token issuance for an already-authenticated Telegram
     *  identity. The Mini App flow verifies `initData` with a different secret
     *  derivation, so it calls this directly instead of `login()`. */
    async loginVerified(dto: TelegramLoginDto, req: Request) {
        let user = await this._repository.findUserByTelegramId(dto.telegram_id);

        if (!user) {
            const role = await this._repository.getDefaultRole();
            if (!role)
                throw new BadRequestException(
                    'User does not have any valid roles',
                );

            user = await this._repository.createTelegramUser(dto, role);
            user = await this._repository.findUserByTelegramId(dto.telegram_id);
        } else {
            user = await this._repository.updateTelegramUser(user, dto);
        }

        if (!user || user.deleted_at)
            throw new BadRequestException('User not found');

        let roles = await this.userRoleService.getRoles(user.id);
        let activeRole =
            roles.find((role) => role.is_default_role) ??
            roles[0];
        if (!activeRole) {
            roles = await this.userRoleService.ensureHasRole(user.id);
            activeRole = roles.find((role) => role.is_default_role) ?? roles[0];
        }
        if (!activeRole)
            throw new BadRequestException('User does not have any valid roles');
        const activeRoleId = activeRole.user_role_id;
        const activeOrganizationId = activeRole.organization_id;
        if (dto.first_name !== undefined || dto.last_name !== undefined) {
            user = await this._repository.updateProfileNames(
                user.id,
                dto.first_name,
                dto.last_name,
            );
        }

        const payload = await this.buildUserPayload(
            user,
            activeRoleId,
            activeOrganizationId,
            roles,
        );
        const tracked = await this.deviceTrackingService.trackLogin(
            user.id,
            req,
            {
                device_id: dto.device_id,
                login_method: 4,
                create_history: true,
            },
        );
        payload.session_id = tracked.session.id;
        const token = this.signAccessToken(payload);
        const refresh_token = await this.refreshTokenService.issue(
            tracked.session,
            payload,
        );

        return {
            status_code: 200,
            user: payload,
            device: {
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
            },
            token,
            refresh_token,
            message: 'Success',
        };
    }
}
