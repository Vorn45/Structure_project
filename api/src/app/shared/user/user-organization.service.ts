// ===========================================================================>> Core Library
import { Injectable }       from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

// ===========================================================================>> Third Party Library
import { Repository } from 'typeorm';

// ===========================================================================>> Custom Library
// > Local
import { OrganizationMemberStatus } from 'src/app/enum/pms.enum';
import { OrganizationMember }       from 'src/app/model/organization/organization-member.entity';

// ======================================= >> Code Starts Here << ========================== //
@Injectable()
export class UserOrganizationService {
    constructor(
        @InjectRepository(OrganizationMember)
        private readonly organizationMemberRepo: Repository<OrganizationMember>,
    ) {}

    mapOrganizationMember(member?: OrganizationMember | null) {
        if (!member) return null;

        // Prefer the member's office name; fall back to the organization's
        // own name when the member has no office (or the office was removed).
        const name_en = member.organization_office?.name_en ?? member.organization?.name_en ?? null;
        const name_kh = member.organization_office?.name_kh ?? member.organization?.name_kh ?? null;

        return {
            id: member.organization?.id ?? member.organization_id,
            name_en,
            name_kh,
            role: {
                id:
                    member.organization_position?.id ??
                    member.position_id ??
                    null,
                name_en: member.organization_position?.name_en ?? null,
                name_kh: member.organization_position?.name_kh ?? null,
            },
        };
    }


    private activeMembershipsQuery(userId: number) {
        return this.organizationMemberRepo
            .createQueryBuilder('member')
            .leftJoinAndSelect('member.organization', 'organization')
            .leftJoinAndSelect(
                'member.organization_position',
                'role',
                'role.deleted_at IS NULL AND role.is_active = true',
            )
            .leftJoinAndSelect(
                'member.organization_office',
                'office',
                'office.deleted_at IS NULL AND office.is_active = true',
            )
            .where('member.user_id = :userId', { userId })
            .andWhere('member.status = :status', {
                status: OrganizationMemberStatus.ACTIVE,
            })
            .andWhere('member.deleted_at IS NULL')
            .andWhere('organization.deleted_at IS NULL');
    }

    /**
     * The organization the user is currently acting in. `organizationId` comes
     * from the JWT payload (the org tied to the active role), which is the only
     * authoritative answer when a user belongs to several organizations.
     * Falls back to the single/oldest membership when the token carries no org.
     */
    async getActiveOrganization(
        userId: number,
        organizationId?: string | null,
    ) {
        if (organizationId) {
            const member = await this.activeMembershipsQuery(userId)
                .andWhere('member.organization_id = :organizationId', {
                    organizationId,
                })
                .getOne();

            if (member) return this.mapOrganizationMember(member);
        }

        return this.getBiggestRoleOrganization(userId);
    }

    async getBiggestRoleOrganization(userId: number) {
        const member = await this.activeMembershipsQuery(userId)
            .orderBy('member.sort', 'ASC')
            .addOrderBy('member.joined_at', 'ASC')
            .getOne();

        return this.mapOrganizationMember(member);
    }
}
