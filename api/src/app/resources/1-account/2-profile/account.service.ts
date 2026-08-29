// ===========================================================================>> Core Library
import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes, randomUUID } from 'crypto';

// ===========================================================================>> Third Party Library
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { DataSource, EntityManager, Repository } from 'typeorm';
import jwtConstants from 'shared/jwt/constants';

// ===========================================================================>> Custom Library
// > Local
import { appConfig } from 'src/app.config';
import { AuthProvider } from 'src/app/enum/auth-provider.enum';
import { ClientRequest, DeviceTrackingService, } from 'src/app/shared/device/device-tracking.service';
import { FileService } from 'src/app/shared/file/file.service';
import { UserRoleService, RoleWithOrg } from 'src/app/shared/user/user-role.service';
import { OrganizationMember } from 'src/app/model/organization/organization-member.entity';
import { OrganizationTelegramMember } from 'src/app/model/organization/organization-telegram-member.entity';
import { Organization } from 'src/app/model/organization/organization.entity';
import { QrLoginSession } from 'src/app/model/user/qr-login-session.entity';
import { Role } from 'src/app/model/user/role.entity';
import { User } from 'src/app/model/user/users.entity';
import { UserSessions } from 'src/app/model/user/user_sessions.entity';
import { UserSessionLogs } from 'src/app/model/user/user_session_logs.entity';
import { UserRole } from 'src/app/model/user/user_role.entity';
import { UserPayload } from 'src/app/interface/jwt.interface';
import { ChangeOwnPasswordDto, CheckPasswordDto, QrLoginDto, SwitchRoleDto, UpdateOwnProfileInfoDto, } from './account.dto';
import { OrganizationMemberStatus } from 'src/app/enum/pms.enum';
import { RefreshTokenService } from 'src/app/shared/auth/refresh-token.service';

// ======================================= >> Code Starts Here << ========================== //
@Injectable()
export class AccountService {
    constructor(
        @InjectRepository(User) private readonly userRepo: Repository<User>,
        @InjectRepository(QrLoginSession)
        private readonly qrLoginRepo: Repository<QrLoginSession>,
        @InjectRepository(OrganizationTelegramMember)
        private readonly organizationTelegramMemberRepo: Repository<OrganizationTelegramMember>,
        @InjectRepository(UserSessions)
        private readonly userSessionsRepo: Repository<UserSessions>,
        @InjectRepository(UserSessionLogs)
        private readonly userSessionLogsRepo: Repository<UserSessionLogs>,
        private readonly dataSource: DataSource,
        private readonly fileService: FileService,
        private readonly deviceTrackingService: DeviceTrackingService,
        private readonly userRoleService: UserRoleService,
        private readonly refreshTokenService: RefreshTokenService,
    ) { }

    private mapFile(file?: any | null) {
        if (!file) return null;

        return {
            id: Number(file.id),
            file_domain: file.file_domain ?? null,
            uri: file.uri ?? null,
        };
    }

    private mapProfileInfo(user: User) {
        return {
            id: user.id,
            name_en: user.name_en ?? null,
            name_kh: user.name_kh ?? null,
            gender: user.sex_id ?? null,
            phone_number: user.phone ?? null,
            email: user.email ?? null,
            first_name: user.first_name ?? null,
            last_name: user.last_name ?? null,
            avatar: this.mapFile(user.avatar_file),
            background: this.mapFile(user.background_file),
        };
    }

    private mapPasswordChangedAt(user: User) {
        const changedAt = user.password_changed_at ?? null;
        const daysSinceChanged = changedAt
            ? Math.floor(
                (Date.now() - changedAt.getTime()) / (1000 * 60 * 60 * 24),
            )
            : null;

        return {
            last_password_changed_at: changedAt,
            // last_password_changed_date: changedAt ? changedAt.toISOString().slice(0, 10) : null,
            days_since_password_changed: daysSinceChanged,
        };
    }

    private mapSession(session: any) {
        return {
            id: session.id,
            device_id: session.device?.device_id ?? null,
            device_name: session.device?.device_name ?? null,
            platform: session.device?.platform ?? null,
            os: session.device?.os ?? null,
            browser: session.device?.browser ?? null,
            device_type: session.device?.device_type ?? null,
            user_agent: session.device?.user_agent ?? null,
            ip: session.ip,
            country_code: session.country_code,
            region: session.region,
            city: session.city,
            latitude: session.latitude,
            longitude: session.longitude,
            timezone: session.timezone,
            login_method: session.login_method,
            is_active: session.is_active,
            last_activity_at: session.last_activity_at,
            created_at: session.created_at,
        };
    }

    private mapSessionLog(log: any) {
        return {
            id: log.id,
            device_id: log.device?.device_id ?? null,
            device_name: log.device?.device_name ?? null,
            platform: log.device?.platform ?? null,
            os: log.device?.os ?? null,
            browser: log.device?.browser ?? null,
            device_type: log.device?.device_type ?? null,
            user_agent: log.device?.user_agent ?? null,
            ip: log.ip,
            country_code: log.country_code ?? log.device?.country_code ?? null,
            region: log.region ?? log.device?.region ?? null,
            city: log.city ?? log.device?.city ?? null,
            latitude: log.latitude ?? null,
            longitude: log.longitude ?? null,
            timezone: log.timezone ?? null,
            created_at: log.created_at,
        };
    }

    private mapOrganizationMember(member: OrganizationMember) {
        return {
            id: member.organization?.id ?? member.organization_id,
            name: {
                name_en: member.organization?.name_en ?? null,
                name_kh: member.organization?.name_kh ?? null,
            },
            logo: this.mapFile(member.organization?.logo_file),
            primary_color: member.organization?.primary_color ?? null,
            organization_position: {
                name_en: member.organization_position?.name_en ?? null,
                name_kh: member.organization_position?.name_kh ?? null,
            },
        };
    }

    private roleNeedsOrganization(role?: Role | null) {
        return !!role && ['org_admin', 'user'].includes(role.slug);
    }

    private async getActiveOrganizationForRole(
        userId: number,
        role: RoleWithOrg,
    ) {
        if (!this.roleNeedsOrganization(role) || !role.organization_id)
            return null;

        const members = await this.getOrganizationMembers(userId);
        const member = members.find(
            (item) => item.organization_id === role.organization_id,
        );
        if (member) return this.mapOrganizationMember(member);

        return {
            id: role.organization_id,
            name: { name_en: null, name_kh: null },
            logo: null,
            primary_color: null,
            organization_position: null,
        };
    }

    private mapRoleOption(role: Role) {
        return {
            id: role.id,
            name: {
                name_en: role.name_en ?? null,
                name_kh: role.name_kh ?? null,
            },
        };
    }

    private mapRoleOrganizationOption(role: RoleWithOrg) {
        return {
            id: role.organization?.id ?? role.organization_id,
            name_en: role.organization?.name_en ?? null,
            name_kh: role.organization?.name_kh ?? null,
            abbreviation: role.organization?.abbreviation ?? null,
            logo: role.organization?.logo ?? null,
            is_default: role.is_default_role,
            role: {
                id: role.user_role_id,
                slug: role.slug,
                name_en: role.name_en ?? null,
                name_kh: role.name_kh ?? null,
            },
        };
    }

    private mapExistingRoles(roles: RoleWithOrg[], activeRoleId: number, avatar: ReturnType<UserRoleService['mapAvatar']>) {
        return roles.map((role) =>
            this.userRoleService.mapRole(role, activeRoleId, avatar),
        );
    }

    private async buildUserPayload(
        user: User,
        activeRoleId: number,
        activeOrganizationId: string | null,
        roles?: RoleWithOrg[],
        organization?: any | null,
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

        return {
            id: user.id,
            sex_id: user.sex_id,
            avatar: activeAvatar,
            name_kh: user.name_kh,
            name_en: user.name_en,
            phone: user.phone,
            email: user.email ?? null,
            is_active: activeRoleId,
            organization_id: organization?.id ?? activeOrganizationId ?? null,
            organization: organization ?? null,
            roles: activeRole
                ? [
                    this.userRoleService.mapRole(
                        activeRole,
                        activeRoleId,
                        activeAvatar,
                        {},
                        activeOrganizationId,
                    ),
                ]
                : [],
        };
    }

    private signUserToken(payload: UserPayload): string {
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
            throw new NotFoundException('User not found');
        return user;
    }

    private async getCurrentUserProfile(id: number): Promise<User> {
        const user = await this.userRepo.findOne({
            where: { id },
            relations: ['avatar_file', 'background_file'],
        });
        if (!user || user.deleted_at)
            throw new NotFoundException('User not found');
        return user;
    }

    private getActiveRole(
        user: User,
        roles: RoleWithOrg[],
        currentRoleId?: number,
        currentOrganizationId?: string | null,
    ): RoleWithOrg | undefined {
        return (
            (currentRoleId !== undefined
                ? (roles.find(
                    (role) =>
                        role.user_role_id === currentRoleId &&
                        role.organization_id === (currentOrganizationId ?? null),
                ) ?? roles.find((role) => role.user_role_id === currentRoleId))
                : undefined) ??
            roles.find((role) => role.is_default_role) ??
            roles[0]
        );
    }

    private getActiveRoleId(
        user: User,
        roles: RoleWithOrg[],
        currentRoleId?: number,
        currentOrganizationId?: string | null,
    ) {
        return this.getActiveRole(user, roles, currentRoleId, currentOrganizationId)
            ?.user_role_id;
    }

    private async getOrganizationMembers(userId: number) {
        return await this.dataSource.getRepository(OrganizationMember).find({
            where: {
                user_id: userId,
                status: OrganizationMemberStatus.ACTIVE,
            },
            relations: [
                'organization',
                'organization.logo_file',
                'organization_position',
            ],
            order: {
                joined_at: 'ASC',
            },
        });
    }

    private async getOwnedOrganizations(userId: number) {
        return await this.dataSource.getRepository(Organization).find({
            where: { owner_id: userId },
            relations: ['logo_file'],
            order: {
                sort: 'ASC',
                created_at: 'ASC',
            },
        });
    }

    private async getAccessibleOrganizations(userId: number) {
        const members = await this.getOrganizationMembers(userId);
        const ownedOrganizations = await this.getOwnedOrganizations(userId);

        return [
            ...members.map((member) => member.organization).filter(Boolean),
            ...ownedOrganizations.filter(
                (organization) =>
                    !members.some(
                        (member) => member.organization_id === organization.id,
                    ),
            ),
        ];
    }

    private async ensureUniqueUser(
        phone?: string,
        email?: string,
        excludeId?: number,
    ): Promise<void> {
        if (phone) {
            const exists = await this.userRepo.findOne({
                where: { phone },
                withDeleted: true,
            });
            if (exists && exists.id !== excludeId)
                throw new BadRequestException('Phone already exists');
        }
        if (email) {
            const exists = await this.userRepo.findOne({
                where: { email },
                withDeleted: true,
            });
            if (exists && exists.id !== excludeId)
                throw new BadRequestException('Email already exists');
        }
    }

    /** Persists the switched-to role as the user's new default (login) role. */
    private async setDefaultUserRole(userId: number, userRoleId: number) {
        await this.dataSource.transaction(async (manager) => {
            const repo = manager.getRepository(UserRole);
            await repo.update(
                { user_id: userId, is_default: true },
                { is_default: false },
            );
            await repo.update({ id: userRoleId }, { is_default: true });
        });
    }

    async switchRole(currentUser: UserPayload, dto: SwitchRoleDto) {
        try {
            const user = await this.getCurrentUser(currentUser.id);
            const roles = await this.userRoleService.getRoles(user.id);
            const requestedRoleId = Number(dto.role_id);
            const role =
                roles.find((item) => item.user_role_id === requestedRoleId) ??
                null;

            if (!role)
                throw new BadRequestException(
                    'User does not have the specified role',
                );

            await this.setDefaultUserRole(user.id, role.user_role_id);

            const organization = await this.getActiveOrganizationForRole(
                user.id,
                role,
            );

            const payload = await this.buildUserPayload(
                user,
                role.user_role_id,
                role.organization_id,
                roles,
                organization,
            );
            const avatar = this.userRoleService.mapAvatar(user.avatar_file);
            payload.roles = [
                this.userRoleService.mapRole(
                    role,
                    role.user_role_id,
                    avatar,
                    {},
                    role.organization_id,
                ) as any,
            ];
            payload.session_id = currentUser.session_id;
            await this.refreshTokenService.updateContext(payload);
            const token = this.signUserToken(payload);

            return {
                status_code: 200,
                user: payload,
                token,
                message: 'Role switched successfully',
            };
        } catch (err: any) {
            throw new BadRequestException(err.message);
        }
    }

    async getOrganizations(currentUser: UserPayload) {
        const user = await this.getCurrentUser(currentUser.id);
        const roles = await this.userRoleService.getRoles(user.id);
        const activeRoleId = this.getActiveRoleId(
            user,
            roles,
            currentUser.is_active,
            currentUser.organization_id,
        );
        const role = roles.find((item) => item.user_role_id === activeRoleId);
        if (!role)
            throw new BadRequestException('User does not have any valid roles');

        if (!this.roleNeedsOrganization(role)) {
            return {
                response_code: 200,
                response_msg: 'Success',
                data: [this.mapRoleOption(role)],
            };
        }

        return {
            response_code: 200,
            response_msg: 'Success',
            data: roles
                .filter(
                    (item) =>
                        this.roleNeedsOrganization(item) && item.organization_id,
                )
                .map((item) => this.mapRoleOrganizationOption(item)),
        };
    }

    async getExistingRoles(currentUser: UserPayload) {
        const user = await this.getCurrentUser(currentUser.id);
        const roles = await this.userRoleService.getRoles(user.id);
        const activeRoleId = this.getActiveRoleId(
            user,
            roles,
            currentUser.is_active,
            currentUser.organization_id,
        );
        if (!activeRoleId)
            throw new BadRequestException('User does not have any valid roles');

        const avatar = this.userRoleService.mapAvatar(user.avatar_file);

        return {
            response_code: 200,
            response_msg: 'Success',
            data: {
                user_id: user.id,
                is_active: activeRoleId,
                roles: this.mapExistingRoles(roles, activeRoleId, avatar),
            },
        };
    }

    private validateMultipartImage(file?: any, fieldName = 'avatar') {
        if (!file) return;
        if (!file.mimetype?.startsWith('image/'))
            throw new BadRequestException(`Invalid ${fieldName} file`);
        if (!file.buffer?.length)
            throw new BadRequestException(`${fieldName} file is empty`);
    }

    private getUploadFile(
        files: Record<string, any[]> | undefined,
        key: string,
    ) {
        return files?.[key]?.[0] ?? null;
    }

    private async uploadProfileImage(refTable: string, file: any) {
        if (!file) return null;
        this.validateMultipartImage(file, refTable);

        return await this.fileService.uploadMultipartFile(refTable, file);
    }

    private async storeProfileImage(
        manager: EntityManager,
        refTable: string,
        file: any,
        updatedBy: string,
        fallbackTitle: string,
    ) {
        const uploaded = await this.uploadProfileImage(refTable, file);
        if (!uploaded) return null;

        return await this.fileService.storeFile(manager, uploaded, {
            ref_table: refTable,
            updated_by: updatedBy,
            fallback_title: fallbackTitle,
        });
    }

    async getOwnProfileInfo(currentUser: UserPayload) {
        const user = await this.getCurrentUserProfile(currentUser.id);

        return {
            response_code: 200,
            response_msg: 'Success',
            data: this.mapProfileInfo(user),
        };
    }

    async getOwnPasswordLastChanged(currentUser: UserPayload) {
        const user = await this.getCurrentUser(currentUser.id);

        return {
            response_code: 200,
            response_msg: 'Success',
            data: this.mapPasswordChangedAt(user),
        };
    }

    async getOwnActiveDevices(currentUser: UserPayload, req: ClientRequest) {
        const currentDeviceId = this.deviceTrackingService.getRequestDeviceId(
            currentUser.id,
            req,
        );
        const devices = await this.deviceTrackingService.getActiveDevicesByUser(
            currentUser.id,
            currentDeviceId,
        );

        return {
            response_code: 200,
            response_msg: 'Success',
            data: {
                devices,
            },
        };
    }

    async getOwnSessions(currentUser: UserPayload) {
        const user = await this.userRepo.findOne({
            where: { id: Number(currentUser.id) },
            select: ['id'],
        });
        if (!user) throw new NotFoundException('User not found');

        // Two independent queries instead of one query joining both
        // one-to-many relations off `user` — a combined join produces a
        // cross product of sessions x logs (e.g. 50 sessions x 2000 logs
        // = 100k rows), which is what made this endpoint take 20s+ for
        // active accounts. `session_logs` is also capped since it's an
        // ever-growing login history, not something a sessions page needs
        // to show in full.
        const [sessions, sessionLogs] = await Promise.all([
            this.userSessionsRepo.find({
                where: { user_id: user.id },
                relations: ['device'],
                order: { last_activity_at: 'DESC' },
            }),
            this.userSessionLogsRepo.find({
                where: { user_id: user.id },
                relations: ['device'],
                order: { created_at: 'DESC' },
                take: 50,
            }),
        ]);

        return {
            response_code: 200,
            response_msg: 'Success',
            data: {
                sessions: sessions.map((session) => this.mapSession(session)),
                session_logs: sessionLogs.map((log) => this.mapSessionLog(log)),
            },
        };
    }

    async updateOwnProfileInfo(
        currentUser: UserPayload,
        dto: UpdateOwnProfileInfoDto,
        updatedBy = 'system',
        files?: Record<string, any[]>,
    ) {
        const avatar = this.getUploadFile(files, 'avatar');
        const background = this.getUploadFile(files, 'background');
        this.validateMultipartImage(avatar, 'avatar');
        this.validateMultipartImage(background, 'background');

        const user = await this.getCurrentUserProfile(currentUser.id);
        const roles = await this.userRoleService.getRoles(user.id);
        const phone = dto.phone_number ?? dto.phone;
        await this.ensureUniqueUser(phone, dto.email, user.id);
        const activeToken = this.getActiveRole(
            user,
            roles,
            currentUser.is_active,
            currentUser.organization_id,
        );
        const activeTokenRoleId = activeToken?.user_role_id;
        if (!activeTokenRoleId)
            throw new BadRequestException('User does not have any valid roles');
        const nameEn = dto.name_en ?? dto.name;
        const nameKh = dto.name_kh ?? dto.name;

        await this.dataSource.transaction(async (manager) => {
            const genderValue = dto.gender ?? dto.sex_id;
            const gender =
                genderValue !== undefined ? Number(genderValue) : undefined;

            if (genderValue !== undefined && Number.isNaN(gender)) {
                throw new BadRequestException('Field gender is invalid');
            }

            const storedAvatar = await this.storeProfileImage(
                manager,
                'user',
                avatar,
                updatedBy,
                `${phone ?? user.phone ?? user.id}-avatar`,
            );
            const storedBackground = await this.storeProfileImage(
                manager,
                'user',
                background,
                updatedBy,
                `${phone ?? user.phone ?? user.id}-background`,
            );

            const emailChanged =
                dto.email !== undefined &&
                dto.email !== user.email &&
                !!user.google_id;

            await manager.getRepository(User).save({
                id: user.id,
                ...(nameEn !== undefined ? { name_en: nameEn } : {}),
                ...(nameKh !== undefined ? { name_kh: nameKh } : {}),
                ...(gender !== undefined ? { sex_id: gender } : {}),
                ...(phone !== undefined ? { phone } : {}),
                ...(dto.email !== undefined ? { email: dto.email } : {}),
                // The old Google account is no longer this user's current email;
                // unlink it so "Login with Google" can't sign back in via the old
                // Google identity. The user can re-link Google under the new email.
                ...(emailChanged
                    ? {
                          google_id: null,
                          email_verified: false,
                          ...(user.auth_provider === AuthProvider.GOOGLE
                              ? { auth_provider: AuthProvider.LOCAL }
                              : {}),
                      }
                    : {}),
                ...(dto.telegram_username !== undefined
                    ? { telegram_username: dto.telegram_username }
                    : {}),
                ...(dto.first_name !== undefined
                    ? { first_name: dto.first_name }
                    : {}),
                ...(dto.last_name !== undefined
                    ? { last_name: dto.last_name }
                    : {}),
                ...(storedAvatar ? { avatar_id: storedAvatar.id } : {}),
                ...(storedBackground
                    ? { background_id: storedBackground.id }
                    : {}),
            });
        });

        const refreshedUser = await this.getCurrentUserProfile(user.id);
        const refreshedRoles = await this.userRoleService.getRoles(
            refreshedUser.id,
        );

        const payload = await this.buildUserPayload(
            refreshedUser,
            activeTokenRoleId,
            activeToken?.organization_id ?? null,
            refreshedRoles,
        );
        payload.session_id = currentUser.session_id;
        await this.refreshTokenService.updateContext(payload);
        const token = this.signUserToken(payload);
        const activeRole = refreshedRoles.find(
            (role) =>
                role.user_role_id === activeTokenRoleId &&
                role.organization_id === (activeToken?.organization_id ?? null),
        );

        return {
            response_code: 200,
            response_msg: 'Profile updated successfully',
            data: {
                ...this.mapProfileInfo(refreshedUser),
                role: activeRole
                    ? {
                        id: activeRole.user_role_id,
                        name_kh: activeRole.name_kh,
                        name_en: activeRole.name_en,
                        slug: activeRole.slug,
                    }
                    : null,
            },
            token,
        };
    }

    async createQrLogin(currentUser: UserPayload) {
        const user = await this.getCurrentUser(currentUser.id);
        const qrToken = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 2 * 60 * 1000);

        await this.qrLoginRepo.update(
            { user_id: user.id, status: 'pending' },
            { status: 'expired' },
        );

        const qrLogin = await this.qrLoginRepo.save(
            this.qrLoginRepo.create({
                user_id: user.id,
                qr_token: qrToken,
                status: 'pending',
                expires_at: expiresAt,
                used_at: null,
            }),
        );

        return {
            response_code: 200,
            response_msg: 'Success',
            data: {
                qr_token: qrLogin.qr_token,
                status: qrLogin.status,
                expires_at: qrLogin.expires_at,
            },
        };
    }

    async getQrLoginStatus(dto: QrLoginDto) {
        const qrLogin = await this.qrLoginRepo.findOne({
            where: { qr_token: dto.qr_token },
        });
        if (!qrLogin) throw new NotFoundException('QR login not found');

        const status =
            qrLogin.status === 'pending' && qrLogin.expires_at < new Date()
                ? 'expired'
                : qrLogin.status;

        if (status === 'expired' && qrLogin.status !== 'expired') {
            await this.qrLoginRepo.update(qrLogin.id, { status });
        }

        return {
            response_code: 200,
            response_msg: 'Success',
            data: {
                status,
                expires_at: qrLogin.expires_at,
                used_at: qrLogin.used_at,
            },
        };
    }

    async scanQrLogin(dto: QrLoginDto, req: ClientRequest) {
        const qrLogin = await this.qrLoginRepo.findOne({
            where: { qr_token: dto.qr_token },
            relations: ['user'],
        });

        if (!qrLogin) throw new NotFoundException('QR login not found');
        if (qrLogin.status !== 'pending')
            throw new BadRequestException('QR login already used');
        if (qrLogin.expires_at < new Date()) {
            await this.qrLoginRepo.update(qrLogin.id, { status: 'expired' });
            throw new BadRequestException('QR login expired');
        }
        if (!qrLogin.user || qrLogin.user.deleted_at)
            throw new NotFoundException('User not found');

        const updateResult = await this.qrLoginRepo
            .createQueryBuilder()
            .update(QrLoginSession)
            .set({ status: 'used', used_at: new Date() })
            .where('id = :id', { id: qrLogin.id })
            .andWhere('status = :status', { status: 'pending' })
            .execute();

        if (!updateResult.affected)
            throw new BadRequestException('QR login already used');

        const roles = await this.userRoleService.getRoles(
            qrLogin.user.id,
        );
        const activeRole = this.getActiveRole(qrLogin.user, roles);
        if (!activeRole)
            throw new BadRequestException('User does not have any valid roles');

        const payload = await this.buildUserPayload(
            qrLogin.user,
            activeRole.user_role_id,
            activeRole.organization_id,
            roles,
        );
        const tracked = await this.deviceTrackingService.trackLogin(
            qrLogin.user.id,
            req,
            { login_method: 1, create_history: true },
        );
        payload.session_id = tracked.session.id;
        const token = this.signUserToken(payload);
        const refresh_token = await this.refreshTokenService.issue(
            tracked.session,
            payload,
        );

        return {
            response_code: 200,
            response_msg: 'QR login successful',
            data: {
                status: 'used',
                user: payload,
            },
            token,
            refresh_token,
        };
    }

    async getTelegramStatus(currentUser: UserPayload) {
        const user = await this.getCurrentUser(currentUser.id);

        return {
            response_code: 200,
            response_msg: 'Success',
            data: {
                telegram_linked: !!user.telegram_id,
                telegram_username: user.telegram_username ?? null,
            },
        };
    }

    async generateTelegramLink(currentUser: UserPayload) {
        const botUsername = appConfig.AUTH.TELEGRAM_BOT_USERNAME;
        if (!botUsername)
            throw new BadRequestException('Telegram bot is not configured');

        const telegramSession = randomUUID();
        await this.userRepo.save({
            id: currentUser.id,
            telegram_session: telegramSession,
        });

        return {
            response_code: 200,
            response_msg: 'Success',
            data: {
                link: `https://t.me/${botUsername}?start=${telegramSession}`,
            },
        };
    }

    async getOrgTelegramStatus(currentUser: UserPayload, organizationId: string) {
        await this.assertOrganizationMember(currentUser.id, organizationId);

        const link = await this.organizationTelegramMemberRepo.findOne({
            where: { organization_id: organizationId, user_id: currentUser.id },
        });

        return {
            response_code: 200,
            response_msg: 'Success',
            data: {
                telegram_linked: !!link?.telegram_id,
                telegram_username: link?.telegram_username ?? null,
            },
        };
    }

    async generateOrgTelegramLink(currentUser: UserPayload, organizationId: string) {
        await this.assertOrganizationMember(currentUser.id, organizationId);

        const organization = await this.dataSource.getRepository(Organization).findOne({
            where: { id: organizationId },
        });
        if (!organization) throw new NotFoundException('Organization not found');
        if (!organization.telegram_bot_username)
            throw new BadRequestException('Telegram bot is not configured for this organization');

        const telegramSession = randomUUID();
        await this.organizationTelegramMemberRepo.upsert(
            {
                organization_id: organizationId,
                user_id: currentUser.id,
                telegram_session: telegramSession,
            },
            ['organization_id', 'user_id'],
        );

        return {
            response_code: 200,
            response_msg: 'Success',
            data: {
                link: `https://t.me/${organization.telegram_bot_username}?start=${telegramSession}`,
            },
        };
    }

    private async assertOrganizationMember(userId: number, organizationId: string) {
        const member = await this.dataSource.getRepository(OrganizationMember).findOne({
            where: { organization_id: organizationId, user_id: userId, status: OrganizationMemberStatus.ACTIVE },
        });
        if (!member) throw new NotFoundException('Organization not found');
    }

    async checkPassword(currentUser: UserPayload, dto: CheckPasswordDto) {
        const user = await this.getCurrentUser(currentUser.id);
        const isMatch = await bcrypt.compare(dto.password, user.password);
        if (!isMatch) throw new BadRequestException('Password is incorrect');
        return { response_code: 200, response_msg: 'Password is correct' };
    }

    async changeOwnPassword(
        currentUser: UserPayload,
        dto: ChangeOwnPasswordDto,
    ) {
        const user = await this.getCurrentUser(currentUser.id);
        const isMatch = await bcrypt.compare(
            dto.current_password,
            user.password,
        );
        if (!isMatch)
            throw new BadRequestException('Current password is incorrect');

        const newPassword = dto.new_password?.trim();
        if (!newPassword || newPassword.length < 6)
            throw new BadRequestException(
                'new_password must be at least 6 characters',
            );

        await user.setPassword(newPassword);
        await this.userRepo.save({
            id: user.id,
            password: user.password,
            password_changed_at: new Date(),
        });

        return {
            response_code: 200,
            response_msg: 'Password changed successfully',
        };
    }

    async leaveOrganization(currentUser: UserPayload, organizationId: string) {
        const userId = currentUser.id;

        await this.dataSource.transaction(async (manager) => {
            // 1. Soft-delete user_role entries for this organization
            await manager.query(
                `UPDATE "user".user_role SET deleted_at = NOW() WHERE user_id = $1 AND organization_id = $2 AND deleted_at IS NULL`,
                [userId, organizationId],
            );

            // 2. Update organization_member status to LEFT / soft-delete
            await manager.query(
                `UPDATE organization.organization_member SET status = $1, deleted_at = NOW() WHERE user_id = $2 AND organization_id = $3 AND deleted_at IS NULL`,
                [OrganizationMemberStatus.LEFT, userId, organizationId],
            );

            // 3. Archive project_member entries in this organization's projects
            await manager.query(
                `
                UPDATE project.project_member
                SET archived_at = NOW()
                WHERE user_id = $1
                  AND project_id IN (
                      SELECT project_id FROM project.project_organization
                      WHERE organization_id = $2 AND deleted_at IS NULL
                  )
                  AND archived_at IS NULL
                `,
                [userId, organizationId],
            );
        });

        return {
            response_code: 200,
            response_msg: 'Successfully left organization',
        };
    }
}
