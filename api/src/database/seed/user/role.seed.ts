import { Role } from 'src/app/model/user/role.entity';
import { DataSource } from 'typeorm';

export class RoleSeeder {
    public static async seed(dataSource: DataSource) {
        const repo = dataSource.getRepository(Role);

        const roles = [
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

        for (const role of roles) {
            const exists = await repo.findOne({ where: { slug: role.slug } });

            if (!exists) {
                await repo.save(repo.create(role));
            } else {
                await repo.update({ id: exists.id }, role);
            }
        }

        await dataSource.query(`
            DO $$
            DECLARE
                organization_admin_id integer;
                user_role_id integer;
            BEGIN
                SELECT "id" INTO organization_admin_id FROM "role" WHERE "slug" = 'org_admin';
                SELECT "id" INTO user_role_id FROM "role" WHERE "slug" = 'user';

                IF organization_admin_id IS NOT NULL THEN
                    INSERT INTO "user_role" ("user_id", "role_id", "organization_id")
                    SELECT "user_id", organization_admin_id, "organization_id"
                    FROM "user_role"
                    WHERE "role_id" IN (SELECT "id" FROM "role" WHERE "slug" = 'admin')
                    ON CONFLICT DO NOTHING;

                    INSERT INTO "role_permission" ("role_id", "permission_id")
                    SELECT organization_admin_id, "permission_id"
                    FROM "role_permission"
                    WHERE "role_id" IN (SELECT "id" FROM "role" WHERE "slug" = 'admin')
                    ON CONFLICT DO NOTHING;
                END IF;

                IF user_role_id IS NOT NULL THEN
                    INSERT INTO "user_role" ("user_id", "role_id", "organization_id")
                    SELECT "user_id", user_role_id, "organization_id"
                    FROM "user_role"
                    WHERE "role_id" IN (SELECT "id" FROM "role" WHERE "slug" = 'bank_admin')
                    ON CONFLICT DO NOTHING;
                END IF;

                DELETE FROM "role_permission"
                WHERE "role_id" IN (
                    SELECT "id" FROM "role"
                    WHERE "slug" NOT IN ('superadmin', 'org_admin', 'user', 'personal_workspace')
                );

                DELETE FROM "user_role"
                WHERE "role_id" IN (
                    SELECT "id" FROM "role"
                    WHERE "slug" NOT IN ('superadmin', 'org_admin', 'user', 'personal_workspace')
                );

                DELETE FROM "role"
                WHERE "slug" NOT IN ('superadmin', 'org_admin', 'user', 'personal_workspace');
            END $$;
        `);

        console.log('\x1b[32mRole seeded successfully\x1b[0m');
    }
}
