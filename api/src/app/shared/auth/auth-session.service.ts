// ===========================================================================>> Core Library
import { BadRequestException, Injectable } from '@nestjs/common';

// ===========================================================================>> Third Party Library
import type { Request } from 'express';
import * as jwt         from 'jsonwebtoken';
import jwtConstants     from 'shared/jwt/constants';

// ===========================================================================>> Custom Library
import { appConfig }              from 'src/app.config';
import { UserPayload }            from 'src/app/interface/jwt.interface';
import { User }                   from 'src/app/model/user/users.entity';
import { DeviceTrackingService }  from '../device/device-tracking.service';
import { UserRoleService }        from '../user/user-role.service';
import { RefreshTokenService }    from './refresh-token.service';

// ======================================= >> Code Starts Here << ========================== //
@Injectable()
export class AuthSessionService {
    constructor(
        private readonly deviceTrackingService: DeviceTrackingService,
        private readonly userRoleService: UserRoleService,
        private readonly refreshTokenService: RefreshTokenService,
    ) {}

    async createLoginResponse(
        user: User,
        req: Request,
        options: {
            device_id?: string;
            login_method: number;
            create_history?: boolean;
        },
    ) {
        if (!user || user.deleted_at)
            throw new BadRequestException('User not found');

        let roles = await this.userRoleService.getRoles(user.id);
        let activeRole =
            roles.find((role) => role.is_default_role) ?? roles[0];
        if (!activeRole) {
            roles = await this.userRoleService.ensureHasRole(user.id);
            activeRole = roles.find((role) => role.is_default_role) ?? roles[0];
        }
        if (!activeRole)
            throw new BadRequestException('User does not have any valid roles');
        const activeRoleId = activeRole.user_role_id;
        const activeOrganizationId = activeRole.organization_id;

        const avatar = this.userRoleService.mapAvatar(user.avatar_file);
        const defaultRoles = roles.filter((role) => role.is_default_role);
        const responseRoles = defaultRoles.length ? defaultRoles : [activeRole];
        const payload: UserPayload = {
            id: user.id,
            sex_id: user.sex_id,
            avatar,
            name_kh: user.name_kh,
            name_en: user.name_en,
            phone: user.phone,
            email: user.email ?? null,
            is_active: activeRoleId,
            organization_id: activeOrganizationId,
            roles: responseRoles.map((role) => ({
                ...this.userRoleService.mapRole(
                    role,
                    activeRoleId,
                    avatar,
                    {},
                    role.organization_id,
                ),
                is_default: role.is_default_role,
            })),
        };
        const tracked = await this.deviceTrackingService.trackLogin(
            user.id,
            req,
            {
                device_id: options.device_id,
                login_method: options.login_method,
                create_history: options.create_history,
            },
        );
        payload.session_id = tracked.session.id;
        const token = jwt.sign({ user: payload }, jwtConstants.secret, {
            expiresIn: appConfig.AUTH.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
        });
        const refresh_token = await this.refreshTokenService.issue(
            tracked.session,
            payload,
        );

        return {
            status_code: 200,
            user: payload,
            device: this.mapTrackedDevice(tracked),
            token,
            refresh_token,
            message: 'Success',
        };
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
