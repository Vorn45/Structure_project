// ===========================================================================>> Core Library
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

// ===========================================================================>> Third Party Library
import { Repository } from 'typeorm';

// ===========================================================================>> Custom Library
import { User } from 'src/app/model/user/users.entity';
import { TelegramThread } from 'src/app/model/user/telegram-thread.entity';
import { OrganizationMember } from 'src/app/model/organization/organization-member.entity';
import { OrganizationMemberStatus } from 'src/app/enum/pms.enum';

// ======================================= >> Code Starts Here << ========================== //
@Injectable()
export class TelegramBotRepository {
    constructor(
        @InjectRepository(User) private readonly userRepo: Repository<User>,
        @InjectRepository(TelegramThread)
        private readonly telegramThreadRepo: Repository<TelegramThread>,
        @InjectRepository(OrganizationMember)
        private readonly organizationMemberRepo: Repository<OrganizationMember>,
    ) {}

    async findByTelegramId(telegram_id: string) {
        return await this.userRepo.findOne({ where: { telegram_id } });
    }

    async findByTelegramSession(telegram_session: string) {
        return await this.userRepo.findOne({ where: { telegram_session } });
    }

    async findByPendingChatId(telegram_pending_chat_id: string) {
        return await this.userRepo.findOne({ where: { telegram_pending_chat_id } });
    }

    async findActiveByPhone(phone: string) {
        return await this.userRepo
            .createQueryBuilder('user')
            .where('user.phone IS NOT NULL')
            .andWhere('user.is_active = 1')
            .andWhere('user.telegram_id IS NULL')
            .andWhere(
                `REGEXP_REPLACE(
                    REGEXP_REPLACE(REGEXP_REPLACE(user.phone, '[^0-9]', '', 'g'), '^855', ''),
                    '^0', ''
                ) = :digits`,
                { digits: phone },
            )
            .getOne();
    }

    async setPendingChatId(userId: number, telegram_pending_chat_id: string) {
        await this.userRepo.save({ id: userId, telegram_pending_chat_id });
    }

    async linkTelegram(
        userId: number,
        data: { telegram_id: string; telegram_username?: string | null; telegram_photo_url?: string | null },
    ) {
        await this.userRepo.save({
            id: userId,
            ...data,
            telegram_session: null,
            telegram_pending_chat_id: null,
        });
        await this.telegramThreadRepo.delete({ user_id: userId });
        return await this.userRepo.findOne({ where: { id: userId } });
    }

    async unlinkTelegram(userId: number) {
        await this.userRepo.save({
            id: userId,
            telegram_id: null,
            telegram_username: null,
            telegram_photo_url: null,
        });
    }

    async findMemberOrganizations(userId: number) {
        return await this.organizationMemberRepo
            .createQueryBuilder('member')
            .innerJoin('member.organization', 'organization')
            .where('member.user_id = :userId', { userId })
            .andWhere('member.status = :status', { status: OrganizationMemberStatus.ACTIVE })
            .andWhere('member.deleted_at IS NULL')
            .andWhere('organization.deleted_at IS NULL')
            .select(['organization.id AS id', 'organization.name_en AS name_en', 'organization.name_kh AS name_kh'])
            .orderBy('organization.name_en', 'ASC')
            .getRawMany<{ id: string; name_en: string | null; name_kh: string | null }>();
    }

    async findMemberProjectsForThreads(_userId: number, _organizationId: string) {
        return [];
    }

    async countOrganizationProjects(_organizationId: string) {
        return 0;
    }

    async findMemberProjectById(_userId: number, _projectId: string) {
        return null;
    }

    async findThread(userId: number, projectId: string) {
        return await this.telegramThreadRepo.findOne({ where: { user_id: userId, project_id: projectId } });
    }

    async upsertThread(userId: number, projectId: string, messageThreadId?: number) {
        const existing = await this.findThread(userId, projectId);
        if (existing) {
            if (messageThreadId !== undefined) {
                await this.telegramThreadRepo.update(existing.id, { message_thread_id: messageThreadId });
                existing.message_thread_id = messageThreadId;
            }
            return existing;
        }

        return await this.telegramThreadRepo.save(
            this.telegramThreadRepo.create({
                user_id: userId,
                project_id: projectId,
                message_thread_id: messageThreadId ?? null,
            }),
        );
    }

    async deleteThread(userId: number, projectId: string) {
        await this.telegramThreadRepo.delete({ user_id: userId, project_id: projectId });
    }
}
