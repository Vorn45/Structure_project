// ===========================================================================>> Core Library
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

// ===========================================================================>> Third Party Library
import { EntityManager, IsNull, Repository } from 'typeorm';

// ===========================================================================>> Custom Library
// > Local
import { Role }     from 'src/app/model/user/role.entity';
import { UserRole } from 'src/app/model/user/user_role.entity';

// ======================================= >> Code Starts Here << ========================== //
export type RoleWithOrg = Role & {
    user_role_id: number;
    organization_id: string | null;
    organization: {
        id: string;
        name_kh: string;
        name_en: string;
        abbreviation?: string | null;
        logo: { id: number; file_domain: string | null; uri: string | null } | null;
        primary_color: string | null;
    } | null;
    is_default_role: boolean;
    created_at?: Date;
    updated_at?: Date;
};

@Injectable()
export class UserRoleService {
    constructor(
        @InjectRepository(UserRole)
        private readonly userRoleRepo: Repository<UserRole>,
        @InjectRepository(Role)
        private readonly roleRepo: Repository<Role>,
    ) {}

    mapAvatar(file?: { id: number; file_domain?: string | null; uri?: string | null } | null) {
        if (!file) return null;

        return {
            id: Number(file.id),
            file_domain: file.file_domain ?? null,
            uri: file.uri ?? null,
        };
    }

    private mapUserRoleToRoleWithOrg(userRole: UserRole): RoleWithOrg {
        return {
            ...userRole.role,
            user_role_id: userRole.id,
            organization_id: userRole.organization_id,
            organization: userRole.organization
                ? {
                      id: userRole.organization.id,
                      name_kh: userRole.organization.name_kh,
                      name_en: userRole.organization.name_en,
                      abbreviation: userRole.organization.abbreviation ?? null,
                      logo: this.mapAvatar(userRole.organization.logo_file),
                      primary_color: userRole.organization.primary_color ?? null,
                  }
                : null,
            is_default_role: userRole.is_default,
            created_at: userRole.created_at,
            updated_at: userRole.updated_at,
        };
    }

    async getRoles(userId: number): Promise<RoleWithOrg[]> {
        const userRoles = await this.userRoleRepo.find({
            where: { user_id: userId },
            relations: ['role', 'organization', 'organization.logo_file'],
            order: { is_default: 'DESC', updated_at: 'DESC' },
        });

        return userRoles
            .filter((userRole) => !!userRole.role)
            .map((userRole) => this.mapUserRoleToRoleWithOrg(userRole));
    }
    async ensureHasRole(userId: number): Promise<RoleWithOrg[]> {
        const roles = await this.getRoles(userId);
        if (roles.length) return roles;

        let role = await this.roleRepo.findOne({ where: { slug: 'superadmin' } });
        if (!role) {
            const defaultRoles = [
                {
                    name_kh: 'អភិបាលប្រព័ន្ធ',
                    name_en: 'Super Administrator',
                    slug: 'superadmin',
                    icon: 'crown',
                    color: 'purple',
                },
                {
                    name_kh: 'អ្នកគ្រប់គ្រងអង្គភាព',
                    name_en: 'Organization Admin',
                    slug: 'org_admin',
                    icon: 'building',
                    color: 'green',
                },
                {
                    name_kh: 'អ្នកប្រើប្រាស់',
                    name_en: 'User',
                    slug: 'user',
                    icon: 'user',
                    color: 'blue',
                },
                {
                    name_kh: 'កន្លែងធ្វើការផ្ទាល់ខ្លួន',
                    name_en: 'Personal Workspace',
                    slug: 'personal_workspace',
                    icon: 'user-circle',
                    color: 'teal',
                },
            ];
            for (const r of defaultRoles) {
                const found = await this.roleRepo.findOne({
                    where: { slug: r.slug },
                });
                if (!found) {
                    await this.roleRepo.save(this.roleRepo.create(r));
                }
            }
            role = await this.roleRepo.findOne({
                where: { slug: 'superadmin' },
            });
        }

        const fallbackRole =
            role || (await this.roleRepo.findOne({ where: { slug: 'user' } }));
        if (!fallbackRole) return roles;

        const existing = await this.userRoleRepo.findOne({
            where: {
                user_id: userId,
                role_id: fallbackRole.id,
                organization_id: IsNull(),
            },
            withDeleted: true,
        });

        if (existing) {
            existing.deleted_at = null;
            existing.is_default = true;
            await this.userRoleRepo.save(existing);
        } else {
            await this.userRoleRepo.save({
                user_id: userId,
                role_id: fallbackRole.id,
                organization_id: null,
                is_default: true,
            });
        }

        return this.getRoles(userId);
    }

    mapRole(
        role: RoleWithOrg,
        activeRoleId: number,
        avatar: { id: number; file_domain: string | null; uri: string | null } | null = null,
        extra: Record<string, any> = {},
        activeOrganizationId: string | null = null,
    ) {
        return {
            id: role.user_role_id,
            name_kh: role.name_kh,
            name_en: role.name_en,
            slug: role.slug,
            color: role.color,
            icon: role.icon,
            organization_id: role.organization_id,
            organization: role.organization,
            avatar,
            ...extra,
            is_default:
                role.user_role_id === activeRoleId &&
                role.organization_id === activeOrganizationId,
        };
    }

    /**
     * Replaces a user's UserRole rows for the given organization scope with `assignments`.
     * `organizationId: null` scopes to org-less roles (e.g. superadmin); a non-null value
     * only touches that organization's rows, leaving the user's roles in other orgs intact.
     */
    async saveUserRoles(
        manager: EntityManager,
        userId: number,
        organizationId: string | null,
        roleIds: number[],
    ) {
        const userRoleRepo = manager.getRepository(UserRole);

        await userRoleRepo.delete({
            user_id: userId,
            organization_id: organizationId,
        });

        if (!roleIds.length) return;

        const uniqueRoleIds = [...new Set(roleIds)];
        const hasDefault = await userRoleRepo.exists({
            where: { user_id: userId, is_default: true },
        });

        await userRoleRepo.insert(
            uniqueRoleIds.map((roleId, index) => ({
                user_id: userId,
                role_id: roleId,
                organization_id: organizationId,
                is_default: !hasDefault && index === 0,
            })),
        );
    }
}
