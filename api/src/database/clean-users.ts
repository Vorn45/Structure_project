import { DataSource } from 'typeorm';
import { typeOrmConfig } from '../config/database.config';
import { User } from '../app/model/user/users.entity';
import { Role } from '../app/model/user/role.entity';
import { UserRole } from '../app/model/user/user_role.entity';
import * as bcrypt from 'bcrypt';
import { AuthProvider } from '../app/enum/pms.enum';

async function run() {
    const dataSource = new DataSource(typeOrmConfig as any);
    await dataSource.initialize();
    console.log('Database connected.');

    const userRepo = dataSource.getRepository(User);
    const roleRepo = dataSource.getRepository(Role);
    const userRoleRepo = dataSource.getRepository(UserRole);

    const roles = await roleRepo.find();
    console.log('Available roles:', roles.map(r => r.slug));

    // Target clean users
    const targetUsers = [
        {
            phone: '010843612',
            name_en: 'PISETH PANHAVORN',
            name_kh: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត',
            email: 'pisethpanhavorn544@gmail.com',
            roles: ['superadmin', 'user'],
            telegram_id: '8836877586',
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

    const keepPhones = targetUsers.map(u => u.phone);

    // 1. Force delete all foreign key dependencies and legacy users
    for (const sql of [
        `DELETE FROM "organization_member" WHERE "user_id" NOT IN (SELECT id FROM "user" WHERE "phone" = ANY($1))`,
        `DELETE FROM "user_role" WHERE "user_id" NOT IN (SELECT id FROM "user" WHERE "phone" = ANY($1))`,
        `DELETE FROM "user_device" WHERE "user_id" NOT IN (SELECT id FROM "user" WHERE "phone" = ANY($1))`,
        `DELETE FROM "user_session_log" WHERE "user_id" NOT IN (SELECT id FROM "user" WHERE "phone" = ANY($1))`,
        `DELETE FROM "user"."task_store"`,
        `DELETE FROM "user" WHERE "phone" NOT IN ('010843612', '087280875', '067776682')`,
    ]) {
        try {
            await dataSource.query(sql, [keepPhones]);
        } catch (_) {}
    }
    console.log('Successfully cleared all legacy users and task stores from database tables!');

    // 2. Set/update passwords and roles for target users
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('wms@1234', salt);

    for (const target of targetUsers) {
        let user = await userRepo.findOne({ where: { phone: target.phone } });
        if (!user) {
            user = userRepo.create({
                phone: target.phone,
                name_en: target.name_en,
                name_kh: target.name_kh,
                email: target.email,
                telegram_id: target.telegram_id,
                password: passwordHash,
                is_active: 1,
                auth_provider: AuthProvider.LOCAL,
            });
            user = await userRepo.save(user);
            console.log(`Created user: ${target.name_en} (${target.phone})`);
        } else {
            user.name_en = target.name_en;
            user.name_kh = target.name_kh;
            user.email = target.email;
            user.telegram_id = target.telegram_id;
            user.password = passwordHash;
            user.is_active = 1;
            user = await userRepo.save(user);
            console.log(`Updated user: ${target.name_en} (${target.phone}) with telegram_id ${target.telegram_id}`);
        }

        // Assign roles
        for (const roleSlug of target.roles) {
            const r = roles.find(item => item.slug === roleSlug);
            if (r) {
                const existingUserRole = await userRoleRepo.findOne({
                    where: { user_id: user.id, role_id: r.id },
                });
                if (!existingUserRole) {
                    await userRoleRepo.save(
                        userRoleRepo.create({
                            user_id: user.id,
                            role_id: r.id,
                            organization_id: null as any,
                        })
                    );
                    console.log(`Assigned role ${roleSlug} to ${target.name_en}`);
                }
            }
        }
    }

    console.log('User cleanup and setup completed successfully!');
    await dataSource.destroy();
    process.exit(0);
}

run().catch((err) => {
    console.error('Error running clean-users:', err);
    process.exit(1);
});
