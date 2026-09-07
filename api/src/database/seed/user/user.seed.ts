import { DataSource, In, Not } from 'typeorm';
import { User } from 'src/app/model/user/users.entity';
import * as bcrypt from 'bcrypt';
import { AuthProvider } from 'src/app/enum/pms.enum';

export class UserSeeder {
    public static seed = async (dataSource: DataSource) => {
        try {
            const repo = dataSource.getRepository(User);

            const activeUsers: Partial<User>[] = [
                {
                    sex_id: 1,
                    phone: '010843612',
                    name_kh: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត',
                    name_en: 'Piseth Panhavorn',
                    email: 'pisethpanhavorn544@gmail.com',
                    is_active: 1,
                    auth_provider: AuthProvider.LOCAL,
                },
                {
                    sex_id: 1,
                    phone: '087280875',
                    name_kh: 'ពុំ ព្រះមុនី',
                    name_en: 'Pum Prusmuny',
                    email: 'pumprusmuny@example.com',
                    is_active: 1,
                    auth_provider: AuthProvider.LOCAL,
                },
                {
                    sex_id: 1,
                    phone: '078776682',
                    name_kh: 'ថា វីនន័រ',
                    name_en: 'Tha Winner',
                    email: 'thawinner@example.com',
                    is_active: 1,
                    auth_provider: AuthProvider.LOCAL,
                },
                {
                    sex_id: 1,
                    phone: '087600063',
                    name_kh: 'ឡេង សុខឆាយ',
                    name_en: 'Leng sokchhay',
                    email: 'lengsokchhay.168@gmail.com',
                    is_active: 1,
                    auth_provider: AuthProvider.LOCAL,
                },
            ];

            const allowedPhones = activeUsers.map((u) => u.phone).filter(Boolean) as string[];

            // 1. Delete legacy / fake mock users from DB
            try {
                const legacyUsers = await repo.find({
                    where: {
                        phone: Not(In(allowedPhones)),
                    },
                });

                if (legacyUsers.length > 0) {
                    await repo.remove(legacyUsers);
                    console.log(`\x1b[33mRemoved ${legacyUsers.length} legacy/mock users from DB.\x1b[0m`);
                }
            } catch (delErr) {
                console.warn('Could not clean some legacy users (foreign key constraints):', delErr);
            }

            // 2. Insert or update the 3 main users + admin with password "wms@1234"
            const salt = await bcrypt.genSalt(10);
            const password = await bcrypt.hash('wms@1234', salt);

            for (const userData of activeUsers) {
                const userExists = await repo
                    .createQueryBuilder('user')
                    .where('user.phone = :phone', { phone: userData.phone })
                    .orWhere('LOWER(user.email) = LOWER(:email)', {
                        email: userData.email ?? '',
                    })
                    .getOne();

                if (!userExists) {
                    await repo.save(
                        repo.create({
                            ...userData,
                            password,
                        }),
                    );
                } else {
                    userExists.sex_id = userData.sex_id ?? userExists.sex_id;
                    userExists.phone = userData.phone ?? userExists.phone;
                    userExists.name_kh = userData.name_kh ?? userExists.name_kh;
                    userExists.name_en = userData.name_en ?? userExists.name_en;
                    userExists.email = userData.email ?? userExists.email;
                    userExists.password = password;
                    userExists.is_active = 1;
                    await repo.save(userExists);
                }
            }

            console.log('\x1b[32mClean users seeded successfully with password wms@1234.\x1b[0m');
        } catch (error) {
            console.error('\x1b[31mError seeding user:\x1b[0m', error);
        }
    };
}
