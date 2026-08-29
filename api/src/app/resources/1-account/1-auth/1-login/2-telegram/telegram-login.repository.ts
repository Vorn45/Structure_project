// ===========================================================================>> Core Library
import { Injectable }       from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

// ===========================================================================>> Third Party Library
import { Repository } from 'typeorm';

// ===========================================================================>> Custom Library
// > Local
import { AuthProvider }     from 'src/app/enum/pms.enum';
import { Role }             from 'src/app/model/user/role.entity';
import { UserRole }         from 'src/app/model/user/user_role.entity';
import { User }             from 'src/app/model/user/users.entity';
import { TelegramLoginDto } from './telegram-login.dto';

// ======================================= >> Code Starts Here << ========================== //
@Injectable()
export class TelegramLoginRepository {
    constructor(
        @InjectRepository(User) private readonly userRepo: Repository<User>,
        @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
        @InjectRepository(UserRole)
        private readonly userRoleRepo: Repository<UserRole>,
    ) {}

    async findUserByTelegramId(telegram_id: string) {
        return await this.userRepo.findOne({
            where: { telegram_id },
            relations: ['avatar_file'],
        });
    }

    async getDefaultRole() {
        const userRole = await this.roleRepo.findOne({
            where: { slug: 'user' },
        });
        if (userRole) return userRole;

        return await this.roleRepo.findOne({ order: { id: 'ASC' } });
    }

    /** Build a display name from Telegram's first/last name, falling back to
     *  @username. Capped to the user.name_en column length (50). */
    private buildTelegramName(dto: TelegramLoginDto): string {
        const fullName = [dto.first_name, dto.last_name]
            .map((part) => part?.trim())
            .filter(Boolean)
            .join(' ')
            .trim();
        const name =
            fullName ||
            (dto.telegram_username ? `@${dto.telegram_username.trim()}` : '');
        return name.slice(0, 50);
    }

    async createTelegramUser(dto: TelegramLoginDto, role: Role) {
        const displayName = this.buildTelegramName(dto);
        const user = await this.userRepo.save(
            this.userRepo.create({
                sex_id: 1,
                name_kh: displayName,
                name_en: displayName,
                phone: null,
                email: null,
                password: null,
                is_active: role.id,
                auth_provider: AuthProvider.TELEGRAM,
                telegram_id: dto.telegram_id,
                telegram_username: dto.telegram_username ?? null,
                telegram_photo_url: dto.telegram_photo_url ?? null,
                first_name: dto.first_name ?? null,
                last_name: dto.last_name ?? null,
            }),
        );

        await this.userRoleRepo.save(
            this.userRoleRepo.create({
                user_id: user.id,
                role_id: role.id,
                organization_id: null,
                is_default: true,
            }),
        );

        return user;
    }

    async updateProfileNames(
        userId: number,
        firstName?: string,
        lastName?: string,
    ) {
        await this.userRepo.save({
            id: userId,
            ...(firstName !== undefined ? { first_name: firstName } : {}),
            ...(lastName !== undefined ? { last_name: lastName } : {}),
        });

        const user = await this.userRepo.findOne({
            where: { id: userId },
            relations: ['avatar_file'],
        });
        return user;
    }

    async updateTelegramUser(user: User, dto: TelegramLoginDto) {
        await this.userRepo.save({
            id: user.id,
            telegram_username: dto.telegram_username ?? user.telegram_username,
            telegram_photo_url:
                dto.telegram_photo_url ?? user.telegram_photo_url,
        });

        return await this.findUserByTelegramId(user.telegram_id);
    }
}
