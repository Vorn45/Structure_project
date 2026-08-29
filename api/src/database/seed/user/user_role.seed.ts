import { DataSource } from 'typeorm';

export class UserRoleSeeder {
    public static async seed(dataSource: DataSource) {
        try {
            const departmentMembers = [
                'Leng Sokchhay',
                'Leng Kimlang',
                'Cheng Chanpanha',
                'Sorn Leang',
                'Panha Viraktitya',
                'Muy Methy',
                'Ei Sreyroth',
                'Yoeun Satya',
                'Samkhan Sovichea',
                'Chin Sophal',
                'Yim Khleok',
            ];
            const geekAndCamCyberExcluded = [
                'Leng Kimlang',
                'Ei Sreyroth',
                'Yoeun Satya',
                'Samkhan Sovichea',
                'Chin Sophal',
                'Yim Khleok',
            ];

            await dataSource.query(`
                INSERT INTO "user_role" ("user_id", "role_id", "organization_id")
                SELECT "user"."id", "role"."id", NULL
                FROM "user"
                CROSS JOIN "role"
                WHERE "user"."phone" = '0965416704'
                AND "role"."slug" = 'superadmin'
                ON CONFLICT ("user_id", "role_id") WHERE "organization_id" IS NULL DO NOTHING
            `);

            await dataSource.query(`
                INSERT INTO "user_role" ("user_id", "role_id", "organization_id")
                SELECT "user"."id", "role"."id", NULL
                FROM "user"
                CROSS JOIN "role"
                WHERE "user"."name_en" = 'Choeng Kimlay'
                AND "role"."slug" = 'superadmin'
                ON CONFLICT ("user_id", "role_id") WHERE "organization_id" IS NULL DO NOTHING
            `);

            await dataSource.query(`
                INSERT INTO "user_role" ("user_id", "role_id", "organization_id")
                SELECT "user"."id", "role"."id", NULL
                FROM "user"
                CROSS JOIN "role"
                WHERE "user"."name_en" = 'Leng Kimlang'
                AND "role"."slug" = 'superadmin'
                ON CONFLICT ("user_id", "role_id") WHERE "organization_id" IS NULL DO NOTHING
            `);

            await dataSource.query(`
                INSERT INTO "user_role" ("user_id", "role_id", "organization_id")
                SELECT "user"."id", "role"."id", NULL
                FROM "user"
                CROSS JOIN "role"
                WHERE "user"."phone" = '087600063'
                AND "role"."slug" = 'superadmin'
                ON CONFLICT ("user_id", "role_id") WHERE "organization_id" IS NULL DO NOTHING
            `);

            await dataSource.query(
                `
                DELETE FROM "user_role"
                USING "organization"
                WHERE "user_role"."organization_id" = "organization"."id"
                AND "organization"."slug" = 'mpwt'
                AND "user_role"."user_id" NOT IN (
                    SELECT "id" FROM "user" WHERE "name_en" = ANY($1)
                )
                `,
                [departmentMembers],
            );

            await dataSource.query(`
                DELETE FROM "user_role"
                USING "organization", "role"
                WHERE "user_role"."organization_id" = "organization"."id"
                AND "user_role"."role_id" = "role"."id"
                AND "organization"."slug" = 'mpwt'
                AND "role"."slug" <> 'user'
                AND NOT (
                    "role"."slug" = 'org_admin'
                    AND "user_role"."user_id" IN (
                        SELECT "id" FROM "user" WHERE "name_en" = 'Leng Kimlang' OR "phone" = '087600063'
                    )
                )
            `);

            await dataSource.query(
                `
                INSERT INTO "user_role" ("user_id", "role_id", "organization_id")
                SELECT "user"."id", "role"."id", "organization"."id"
                FROM "user"
                CROSS JOIN "role"
                CROSS JOIN "organization"
                WHERE "user"."name_en" = ANY($1)
                AND "role"."slug" = 'user'
                AND "organization"."slug" = 'mpwt'
                ON CONFLICT ("user_id", "role_id", "organization_id") WHERE "organization_id" IS NOT NULL DO NOTHING
                `,
                [departmentMembers],
            );

            await dataSource.query(`
                INSERT INTO "user_role" ("user_id", "role_id", "organization_id")
                SELECT "user"."id", "role"."id", "organization"."id"
                FROM "user"
                CROSS JOIN "role"
                CROSS JOIN "organization"
                WHERE "user"."name_en" = 'Leng Kimlang'
                AND "role"."slug" = 'org_admin'
                AND "organization"."slug" = 'mpwt'
                ON CONFLICT ("user_id", "role_id", "organization_id") WHERE "organization_id" IS NOT NULL DO NOTHING
            `);

            await dataSource.query(`
                INSERT INTO "user_role" ("user_id", "role_id", "organization_id")
                SELECT "user"."id", "role"."id", "organization"."id"
                FROM "user"
                CROSS JOIN "role"
                CROSS JOIN "organization"
                WHERE "user"."phone" = '087600063'
                AND "role"."slug" = 'org_admin'
                AND "organization"."slug" = 'mpwt'
                ON CONFLICT ("user_id", "role_id", "organization_id") WHERE "organization_id" IS NOT NULL DO NOTHING
            `);

            await dataSource.query(`
                INSERT INTO "user_role" ("user_id", "role_id", "organization_id")
                SELECT "user"."id", "role"."id", "organization"."id"
                FROM "user"
                CROSS JOIN "role"
                CROSS JOIN "organization"
                WHERE "user"."phone" = '087600063'
                AND "role"."slug" = 'user'
                AND "organization"."slug" = 'mpwt'
                ON CONFLICT ("user_id", "role_id", "organization_id") WHERE "organization_id" IS NOT NULL DO NOTHING
            `);

            await dataSource.query(
                `
                DELETE FROM "user_role"
                USING "organization"
                WHERE "user_role"."organization_id" = "organization"."id"
                AND "organization"."slug" IN ('geek-digital', 'camcyber')
                AND "user_role"."user_id" IN (
                    SELECT "id" FROM "user" WHERE "name_en" = ANY($1)
                )
                `,
                [geekAndCamCyberExcluded],
            );

            await dataSource.query(`
                DELETE FROM "user_role"
                USING "organization", "role", "user"
                WHERE "user_role"."organization_id" = "organization"."id"
                AND "user_role"."role_id" = "role"."id"
                AND "user_role"."user_id" = "user"."id"
                AND "organization"."slug" IN ('geek-digital', 'camcyber')
                AND "role"."slug" = 'org_admin'
                AND NOT (
                    "user"."name_en" = 'Khouch Koeun'
                    OR "user"."phone" = '087600063'
                    OR (
                        "user"."name_en" = 'Choeng Kimlay'
                        AND "organization"."slug" = 'geek-digital'
                    )
                )
            `);

            await dataSource.query(
                `
                INSERT INTO "user_role" ("user_id", "role_id", "organization_id")
                SELECT "user"."id", "role"."id", "organization"."id"
                FROM "user"
                CROSS JOIN "role"
                CROSS JOIN "organization"
                WHERE "user"."name_en" <> ALL($1)
                AND "role"."slug" = 'user'
                AND "organization"."slug" IN ('geek-digital', 'camcyber')
                ON CONFLICT ("user_id", "role_id", "organization_id") WHERE "organization_id" IS NOT NULL DO NOTHING
                `,
                [geekAndCamCyberExcluded],
            );

            await dataSource.query(`
                INSERT INTO "user_role" ("user_id", "role_id", "organization_id")
                SELECT "user"."id", "role"."id", "organization"."id"
                FROM "user"
                CROSS JOIN "role"
                CROSS JOIN "organization"
                WHERE "user"."name_en" = 'Khouch Koeun'
                AND "role"."slug" = 'org_admin'
                AND "organization"."slug" IN ('geek-digital', 'camcyber')
                ON CONFLICT ("user_id", "role_id", "organization_id") WHERE "organization_id" IS NOT NULL DO NOTHING
            `);

            await dataSource.query(`
                INSERT INTO "user_role" ("user_id", "role_id", "organization_id")
                SELECT "user"."id", "role"."id", "organization"."id"
                FROM "user"
                CROSS JOIN "role"
                CROSS JOIN "organization"
                WHERE "user"."phone" = '087600063'
                AND "role"."slug" = 'org_admin'
                AND "organization"."slug" IN ('geek-digital', 'camcyber')
                ON CONFLICT ("user_id", "role_id", "organization_id") WHERE "organization_id" IS NOT NULL DO NOTHING
            `);

            await dataSource.query(`
                INSERT INTO "user_role" ("user_id", "role_id", "organization_id")
                SELECT "user"."id", "role"."id", "organization"."id"
                FROM "user"
                CROSS JOIN "role"
                CROSS JOIN "organization"
                WHERE (
                    "user"."name_en" = 'Choeng Kimlay'
                    OR "user"."phone" = '098787839'
                )
                AND "role"."slug" IN ('user', 'org_admin')
                AND "organization"."slug" = 'geek-digital'
                ON CONFLICT ("user_id", "role_id", "organization_id") WHERE "organization_id" IS NOT NULL DO UPDATE SET
                    "deleted_at" = NULL
            `);

            await dataSource.query(`
                INSERT INTO "user_role" ("user_id", "role_id", "organization_id", "is_default")
                SELECT "user"."id", "role"."id", NULL, TRUE
                FROM "user"
                INNER JOIN "role" ON "role"."slug" = 'user'
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM "user_role"
                    WHERE "user_role"."user_id" = "user"."id"
                )
                ON CONFLICT ("user_id", "role_id") WHERE "organization_id" IS NULL DO NOTHING
            `);

            // Backfill: every user who already holds a `user` role (in any
            // organization) also gets an org-less `personal_workspace` role,
            // aggregating their tasks across every organization they belong
            // to. Idempotent — safe to rerun (see the `user_role` partial
            // unique index on `(user_id, role_id) WHERE organization_id IS NULL`).
            await dataSource.query(`
                INSERT INTO "user_role" ("user_id", "role_id", "organization_id", "is_default")
                SELECT DISTINCT "existing_role"."user_id", "personal_workspace_role"."id", NULL, FALSE
                FROM "user_role" "existing_role"
                INNER JOIN "role" "user_role_kind" ON "user_role_kind"."id" = "existing_role"."role_id"
                CROSS JOIN "role" "personal_workspace_role"
                WHERE "user_role_kind"."slug" = 'user'
                AND "personal_workspace_role"."slug" = 'personal_workspace'
                ON CONFLICT ("user_id", "role_id") WHERE "organization_id" IS NULL DO NOTHING
            `);

            await dataSource.query(
                `
                DELETE FROM "organization_member"
                USING "organization"
                WHERE "organization_member"."organization_id" = "organization"."id"
                AND "organization"."slug" = 'mpwt'
                AND "organization_member"."user_id" NOT IN (
                    SELECT "id" FROM "user" WHERE "name_en" = ANY($1)
                )
                `,
                [departmentMembers],
            );

            await dataSource.query(
                `
                INSERT INTO "organization_member"
                    ("organization_id", "user_id", "position_id", "creator_id", "status", "joined_at", "created_at", "updated_at")
                SELECT
                    "organization"."id",
                    "user"."id",
                    CASE WHEN "user"."name_en" = 'Leng Kimlang' OR "user"."phone" = '087600063' THEN 1 ELSE 3 END,
                    NULL,
                    'active',
                    now(),
                    now(),
                    now()
                FROM "organization"
                CROSS JOIN "user"
                WHERE "organization"."slug" = 'mpwt'
                AND "user"."name_en" = ANY($1)
                ON CONFLICT ("organization_id", "user_id") DO UPDATE SET
                    "position_id" = EXCLUDED."position_id",
                    "status" = 'active',
                    "deleted_at" = NULL,
                    "updated_at" = now()
                `,
                [departmentMembers],
            );

            await dataSource.query(
                `
                DELETE FROM "organization_member"
                USING "organization"
                WHERE "organization_member"."organization_id" = "organization"."id"
                AND "organization"."slug" IN ('geek-digital', 'camcyber')
                AND "organization_member"."user_id" IN (
                    SELECT "id" FROM "user" WHERE "name_en" = ANY($1)
                )
                `,
                [geekAndCamCyberExcluded],
            );

            await dataSource.query(
                `
                INSERT INTO "organization_member"
                    ("organization_id", "user_id", "position_id", "creator_id", "status", "joined_at", "created_at", "updated_at")
                SELECT
                    "organization"."id",
                    "user"."id",
                    CASE
                        WHEN "user"."name_en" = 'Khouch Koeun' THEN 1
                        WHEN "user"."phone" = '087600063' THEN 1
                        WHEN "user"."name_en" = 'Choeng Kimlay'
                            AND "organization"."slug" = 'geek-digital'
                            THEN 1
                        ELSE 3
                    END,
                    NULL,
                    'active',
                    now(),
                    now(),
                    now()
                FROM "organization"
                CROSS JOIN "user"
                WHERE "organization"."slug" IN ('geek-digital', 'camcyber')
                AND "user"."name_en" <> ALL($1)
                ON CONFLICT ("organization_id", "user_id") DO UPDATE SET
                    "position_id" = EXCLUDED."position_id",
                    "status" = 'active',
                    "deleted_at" = NULL,
                    "updated_at" = now()
                `,
                [geekAndCamCyberExcluded],
            );

            await dataSource.query(`
                INSERT INTO "organization_member"
                    ("organization_id", "user_id", "position_id", "creator_id", "status", "joined_at", "created_at", "updated_at")
                SELECT
                    "organization"."id",
                    "user"."id",
                    1,
                    NULL,
                    'active',
                    now(),
                    now(),
                    now()
                FROM "organization"
                CROSS JOIN "user"
                WHERE "organization"."slug" = 'geek-digital'
                AND (
                    "user"."name_en" = 'Choeng Kimlay'
                    OR "user"."phone" = '098787839'
                )
                ON CONFLICT ("organization_id", "user_id") DO UPDATE SET
                    "position_id" = EXCLUDED."position_id",
                    "status" = 'active',
                    "deleted_at" = NULL,
                    "updated_at" = now()
            `);

            console.log('\x1b[32mUser roles seeded successfully.\x1b[0m');
        } catch (error) {
            console.error('\x1b[31mError seeding user roles:\x1b[0m', error);
        }
    }
}
