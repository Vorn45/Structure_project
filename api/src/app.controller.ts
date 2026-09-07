import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { DataSource } from 'typeorm';
import { User } from './app/model/user/users.entity';
import { Role } from './app/model/user/role.entity';
import { UserRole } from './app/model/user/user_role.entity';
import * as bcrypt from 'bcrypt';
import { AuthProvider } from './app/enum/pms.enum';

@Controller()
export class AppController {
    constructor(
        private readonly appService: AppService,
        private readonly dataSource: DataSource,
    ) {}

    @Get()
    async getHello() {
        return await this.appService.getHello();
    }

    @Get('clean-users-sync')
    @Post('clean-users-sync')
    async syncCleanUsers() {
        const results: any[] = [];
        try {
            const userRepo = this.dataSource.getRepository(User);
            const roleRepo = this.dataSource.getRepository(Role);
            const userRoleRepo = this.dataSource.getRepository(UserRole);

            // 1. Ensure roles exist
            let superadminRole = await roleRepo.findOne({ where: { slug: 'superadmin' } });
            if (!superadminRole) {
                superadminRole = await roleRepo.save(roleRepo.create({ name: 'Super Admin', slug: 'superadmin' }));
            }
            let userRole = await roleRepo.findOne({ where: { slug: 'user' } });
            if (!userRole) {
                userRole = await roleRepo.save(roleRepo.create({ name: 'User', slug: 'user' }));
            }

            const targetUsers = [
                {
                    phone: '010843612',
                    name_en: 'PISETH PANHAVORN',
                    name_kh: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត',
                    email: 'pisethpanhavorn544@gmail.com',
                    roles: ['superadmin', 'user'],
                    telegram_id: '853828296',
                },
                {
                    phone: '087280875',
                    name_en: 'PUM BRUSMUNY',
                    name_kh: 'ពុំ ប្រុសមុន្នី',
                    email: 'pumprusmuny@example.com',
                    roles: ['user'],
                    telegram_id: null,
                },
                {
                    phone: '067776682',
                    name_en: 'THA WINNER',
                    name_kh: 'ថា វីនណឺរ',
                    email: 'thawinner@example.com',
                    roles: ['user'],
                    telegram_id: '1174417436',
                },
            ];

            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash('wms@1234', salt);
            const availableRoles = await roleRepo.find();

            for (const target of targetUsers) {
                // Remove telegram_id from others if conflicts
                if (target.telegram_id) {
                    await userRepo.createQueryBuilder()
                        .update(User)
                        .set({ telegram_id: null as any })
                        .where('telegram_id = :tid AND phone != :phone', { tid: target.telegram_id, phone: target.phone })
                        .execute();
                }

                let u = await userRepo.createQueryBuilder('user')
                    .withDeleted()
                    .where('user.phone = :phone', { phone: target.phone })
                    .getOne();

                if (!u) {
                    u = userRepo.create({
                        phone: target.phone,
                        name_en: target.name_en,
                        name_kh: target.name_kh,
                        email: target.email,
                        telegram_id: target.telegram_id as any,
                        password: passwordHash,
                        is_active: 1,
                        sex_id: 1,
                        auth_provider: AuthProvider.LOCAL,
                        deleted_at: null as any,
                    });
                    u = await userRepo.save(u);
                    results.push({ action: 'created', phone: target.phone, id: u.id });
                } else {
                    u.name_en = target.name_en;
                    u.name_kh = target.name_kh;
                    u.email = target.email;
                    u.telegram_id = target.telegram_id as any;
                    u.password = passwordHash;
                    u.is_active = 1;
                    u.deleted_at = null as any;
                    u = await userRepo.save(u);
                    results.push({ action: 'updated', phone: target.phone, id: u.id });
                }

                for (const rSlug of target.roles) {
                    const r = availableRoles.find((role) => role.slug === rSlug);
                    if (r) {
                        const existingUr = await userRoleRepo.findOne({
                            where: { user_id: u.id, role_id: r.id },
                        });
                        if (!existingUr) {
                            await userRoleRepo.save(
                                userRoleRepo.create({
                                    user_id: u.id,
                                    role_id: r.id,
                                    organization_id: null as any,
                                }),
                            );
                        }
                    }
                }
            }

            const allUsers = await userRepo.find({
                select: ['id', 'name_en', 'name_kh', 'phone', 'email', 'telegram_id', 'is_active', 'deleted_at'],
            });

            return {
                status: 'success',
                message: 'Clean users synchronized successfully',
                results,
                users: allUsers,
            };
        } catch (err: any) {
            return {
                status: 'error',
                message: err?.message || String(err),
                results,
            };
        }
    }
}

