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
    const superadminRole = roles.find(r => r.slug === 'superadmin');
    const userRole = roles.find(r => r.slug === 'user');

    console.log('Available roles:', roles.map(r => r.slug));

    // Target clean users
    const targetUsers = [
        {
            phone: '010843612',
            name_en: 'Piseth Panhavorn',
            name_kh: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត',
            email: 'pisethpanhavorn544@gmail.com',
            roles: ['superadmin', 'user'],
        },
        {
            phone: '087280875',
            name_en: 'Pum Prusmuny',
            name_kh: 'ពុំ ព្រះមុនី',
            email: 'pumprusmuny@example.com',
            roles: ['user'],
        },
        {
            phone: '078776682',
            name_en: 'Tha Winner',
            name_kh: 'ថា វីនន័រ',
            email: 'thawinner@example.com',
            roles: ['user'],
        },
        {
            phone: '087600063',
            name_en: 'Leng sokchhay',
            name_kh: 'ឡេង សុខឆាយ',
            email: 'lengsokchhay.168@gmail.com',
            roles: ['superadmin', 'user'],
        },
    ];

    const keepPhones = targetUsers.map(u => u.phone);

    // 1. Delete all other users
    const allUsers = await userRepo.find();
    for (const u of allUsers) {
        if (!keepPhones.includes(u.phone)) {
            try {
                // Delete user roles first
                await userRoleRepo.delete({ user_id: u.id });
                await userRepo.delete(u.id);
                console.log(`Deleted legacy user: ${u.name_en} (${u.phone})`);
            } catch (err) {
                console.warn(`Could not delete user ${u.id}:`, err);
            }
        }
    }

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
            user.password = passwordHash;
            user.is_active = 1;
            user = await userRepo.save(user);
            console.log(`Updated user: ${target.name_en} (${target.phone}) with password wms@1234`);
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
