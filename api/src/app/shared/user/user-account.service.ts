// ===========================================================================>> Core Library
import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

// ===========================================================================>> Third Party Library
import { EntityManager, In, IsNull, Repository } from 'typeorm';

// ===========================================================================>> Custom Library
// > Local
import { FileService }                  from 'src/app/shared/file/file.service';
import { OrganizationMemberStatus }     from 'src/app/enum/pms.enum';
import { File }                         from 'src/app/model/file/file.entity';
import { OrganizationPositionEntity }   from 'src/app/model/organization/organization-position.entity';
import { OrganizationMember }           from 'src/app/model/organization/organization-member.entity';
import { Organization }                 from 'src/app/model/organization/organization.entity';
import { Role }                         from 'src/app/model/user/role.entity';
import { UserRole }                     from 'src/app/model/user/user_role.entity';
import { User }                         from 'src/app/model/user/users.entity';

// ======================================= >> Code Starts Here << ========================== //
export interface SupAdminUserAvatarFile {
    originalname?: string;
    mimetype?: string;
    size?: number;
    buffer?: Buffer;
}

@Injectable()
export class SupAdminUserAccountService {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        @InjectRepository(Role)
        private readonly roleRepo: Repository<Role>,
        @InjectRepository(Organization)
        private readonly organizationRepo: Repository<Organization>,
        @InjectRepository(OrganizationPositionEntity)
        private readonly organizationPositionRepo: Repository<OrganizationPositionEntity>,
        private readonly _fileService: FileService,
    ) {}

    validateAvatar(avatar?: SupAdminUserAvatarFile) {
        if (!avatar) return;
        if (!avatar.mimetype?.startsWith('image/')) {
            throw new BadRequestException('Avatar must be an image');
        }
        if (!avatar.buffer?.length) {
            throw new BadRequestException('Avatar file is empty');
        }
    }

    async getReferences(
        userRoleId: number,
        organizationId?: string,
        organizationPositionId?: number,
    ) {
        const role = await this.roleRepo.findOne({ where: { id: userRoleId } });
        if (!role) throw new NotFoundException('User role not found');

        if (!organizationId) {
            if (!organizationPositionId) {
                return { role, organization: null, organizationPosition: null };
            }

            const organizationPosition = await this.organizationPositionRepo.findOne({
                where: { id: organizationPositionId, deleted_at: IsNull(), is_active: true },
            });
            if (!organizationPosition) {
                throw new NotFoundException('Organization position not found');
            }

            return { role, organization: null, organizationPosition };
        }

        const organization = await this.organizationRepo.findOne({
            where: { id: organizationId },
        });
        if (!organization || organization.deleted_at) {
            throw new NotFoundException('Organization not found');
        }

        if (!organizationPositionId) {
            return { role, organization, organizationPosition: null };
        }

        const organizationPosition = await this.organizationPositionRepo
            .createQueryBuilder('organization_position')
            .where('organization_position.id = :organizationPositionId', {
                organizationPositionId,
            })
            .andWhere('organization_position.deleted_at IS NULL')
            .andWhere('organization_position.is_active = true')
            .andWhere(
                `(
          organization_position.creator_id IS NULL
          OR organization_position.creator_id = :organizationOwnerId
          OR EXISTS (
            SELECT 1
            FROM organization_member role_creator_member
            WHERE role_creator_member.organization_id = :organizationId
            AND role_creator_member.user_id = organization_position.creator_id
            AND role_creator_member.deleted_at IS NULL
          )
          OR EXISTS (
            SELECT 1
            FROM organization_member role_usage_member
            WHERE role_usage_member.organization_id = :organizationId
            AND role_usage_member.position_id = organization_position.id
            AND role_usage_member.deleted_at IS NULL
          )
        )`,
                {
                    organizationId: organization.id,
                    organizationOwnerId: organization.owner_id,
                },
            )
            .getOne();

        if (!organizationPosition) {
            throw new BadRequestException(
                'Organization position does not belong to this organization',
            );
        }

        return { role, organization, organizationPosition };
    }

    async uploadAvatar(
        manager: EntityManager,
        avatar: SupAdminUserAvatarFile | undefined,
        phone: string,
        updatedBy: string,
    ) {
        if (!avatar) return null;

        const uploadedAvatar = await this._fileService.uploadMultipartFile(
            'user_avatar',
            avatar,
        );

        return await this._fileService.storeFile(manager, uploadedAvatar, {
            ref_table: 'users',
            created_by: updatedBy,
            updated_by: updatedBy,
            fallback_title: avatar.originalname ?? `${phone}-avatar`,
            fallback_mimetype: avatar.mimetype,
            fallback_size: avatar.size,
        });
    }

    async saveOrganizationMember(
        manager: EntityManager,
        organizationId: string,
        userId: number,
        positionId: number | null,
        createdBy: number | null,
    ) {
        const memberRepo = manager.getRepository(OrganizationMember);
        const existing = await memberRepo.findOne({
            where: {
                organization_id: organizationId,
                user_id: userId,
            },
            withDeleted: true,
        });

        const member = existing
            ? memberRepo.merge(existing, {
                  position_id: positionId,
                  creator_id: createdBy,
                  status: OrganizationMemberStatus.ACTIVE,
                  deleted_at: null,
              })
            : memberRepo.create({
                  organization_id: organizationId,
                  user_id: userId,
                  position_id: positionId,
                  creator_id: createdBy,
                  status: OrganizationMemberStatus.ACTIVE,
              });

        return await memberRepo.save(member);
    }

    async setFileReference(
        manager: EntityManager,
        file: File | null,
        userId: number,
    ) {
        if (!file) return;
        file.ref_id = String(userId);
        await manager.getRepository(File).save(file);
    }

    private splitName(name?: string | null) {
        const parts = (name || '').trim().split(/\s+/).filter(Boolean);
        return {
            first_name: parts[0] ?? null,
            last_name: parts.length > 1 ? parts.slice(1).join(' ') : null,
        };
    }

    async saveUserRole(
        manager: EntityManager,
        userId: number,
        roleId: number,
        organizationId: string | null,
    ) {
        const userRoleRepo = manager.getRepository(UserRole);
        const existing = await userRoleRepo.findOne({
            where: { user_id: userId, role_id: roleId, organization_id: organizationId },
        });
        if (existing) return;

        await userRoleRepo.save(
            userRoleRepo.create({
                user_id: userId,
                role_id: roleId,
                organization_id: organizationId,
            }),
        );
    }

    async saveProfile(
        manager: EntityManager,
        userId: number,
        avatarId?: number | null,
        name?: string | null,
    ) {
        const userRepo = manager.getRepository(User);
        const existing = await userRepo.findOne({ where: { id: userId } });
        const names = this.splitName(name);

        await userRepo.save({
            id: userId,
            avatar_id: avatarId ?? existing?.avatar_id ?? null,
            first_name: existing?.first_name ?? names.first_name,
            last_name: existing?.last_name ?? names.last_name,
        });
    }

    async replaceUserRoles(
        manager: EntityManager,
        userId: number,
        resolvedRoles: Array<{
            role: Role;
            organization: Organization | null;
            organizationPosition: OrganizationPositionEntity | null;
        }>,
        updatedBy: number | null,
    ) {
        const userRoleRepo = manager.getRepository(UserRole);
        const memberRepo = manager.getRepository(OrganizationMember);

        const keptOrganizationIds = [
            ...new Set(
                resolvedRoles
                    .map((entry) => entry.organization?.id)
                    .filter((id): id is string => !!id),
            ),
        ];

        const staleUserRoles = await userRoleRepo.find({
            where: { user_id: userId },
        });
        const isKept = (organizationId: string | null, roleId: number) =>
            resolvedRoles.some(
                (entry) =>
                    (entry.organization?.id ?? null) === organizationId &&
                    entry.role.id === roleId,
            );

        const staleIds = staleUserRoles
            .filter((item) => !isKept(item.organization_id, item.role_id))
            .map((item) => item.id);

        if (staleIds.length) {
            await userRoleRepo.update({ id: In(staleIds) }, { is_default: false });
            await userRoleRepo.softDelete(staleIds);
        }

        const staleMemberDeleteQb = memberRepo
            .createQueryBuilder()
            .softDelete()
            .where('user_id = :userId', { userId });
        if (keptOrganizationIds.length) {
            staleMemberDeleteQb.andWhere(
                'organization_id NOT IN (:...keptOrganizationIds)',
                { keptOrganizationIds },
            );
        }
        await staleMemberDeleteQb.execute();

        let hasDefault = await userRoleRepo.exists({
            where: { user_id: userId, is_default: true },
        });

        for (const { role, organization, organizationPosition } of resolvedRoles) {
            if (organization) {
                await this.saveOrganizationMember(
                    manager,
                    organization.id,
                    userId,
                    organizationPosition?.id ?? null,
                    updatedBy,
                );
            }

            const existing = await userRoleRepo.findOne({
                where: {
                    user_id: userId,
                    role_id: role.id,
                    organization_id: organization?.id ?? null,
                },
                withDeleted: true,
            });

            if (existing) {
                if (existing.deleted_at) {
                    await userRoleRepo.save(
                        userRoleRepo.merge(existing, {
                            deleted_at: null,
                            is_default: existing.is_default || !hasDefault,
                        }),
                    );
                    if (!hasDefault) hasDefault = true;
                }
            } else {
                await userRoleRepo.save(
                    userRoleRepo.create({
                        user_id: userId,
                        role_id: role.id,
                        organization_id: organization?.id ?? null,
                        is_default: !hasDefault,
                    }),
                );
                if (!hasDefault) hasDefault = true;
            }
        }
    }

    async getUser(userId: number) {
        const user = await this.userRepo.findOne({
            where: { id: userId },
            relations: [
                'user_roles',
                'user_roles.role',
                'user_roles.organization',
                'avatar_file',
                'organization_members',
                'organization_members.organization',
                'organization_members.organization_position',
            ],
        });

        if (!user || user.deleted_at)
            throw new NotFoundException('User not found');
        return user;
    }

    mapUser(user: User, organizationId?: string) {
        const member = organizationId
            ? user.organization_members?.find(
                  (item) => item.organization_id === organizationId,
              )
            : user.organization_members?.[0];
        const userRole = organizationId
            ? user.user_roles?.find(
                  (item) => item.organization_id === organizationId,
              )
            : (user.user_roles?.find((item) => item.is_default) ??
                  user.user_roles?.[0]);
        const avatar = user.avatar_file;

        return {
            id: user.id,
            avatar: avatar
                ? {
                      id: avatar.id,
                      file_domain: avatar.file_domain ?? null,
                      uri: avatar.uri ?? null,
                  }
                : null,
            name_en: user.name_en,
            name_kh: user.name_kh,
            gender: user.sex_id,
            phone_number: user.phone,
            email: user.email ?? null,
            user_role: userRole?.role
                ? {
                      id: userRole.role.id,
                      name_en: userRole.role.name_en,
                      name_kh: userRole.role.name_kh,
                  }
                : null,
            organization: userRole?.organization
                ? {
                      id: userRole.organization.id,
                      name_en: userRole.organization.name_en,
                      name_kh: userRole.organization.name_kh,
                  }
                : null,
            organization_position: member?.organization_position
                ? {
                      id: member.organization_position.id,
                      name_en: member.organization_position.name_en,
                      name_kh: member.organization_position.name_kh,
                  }
                : null,
            created_at: user.created_at,
            updated_at: user.updated_at,
        };
    }
}
