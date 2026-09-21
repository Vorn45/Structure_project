const { Client } = require('pg');

async function main() {
    require('dotenv').config();

    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || '123vorn',
        database: process.env.DB_DATABASE || 'pms_db',
    });

    await client.connect();

    // 1. Find or create an Organization
    let orgRes = await client.query(`SELECT id FROM "organization"."organization" WHERE slug = 'digitech-kh' LIMIT 1;`);
    let orgId;

    if (orgRes.rows.length === 0) {
        const insertOrg = await client.query(`
            INSERT INTO "organization"."organization" (
                name_en, name_kh, abbreviation, slug, description, primary_color, owner_id, status
            ) VALUES (
                'Digitech KH', 'ឌីជីថេក ខេអេច', 'DTKH', 'digitech-kh', 'Digitech Technology & Software Solutions', '#3b82f6', 1, 'active'
            ) RETURNING id;
        `);
        orgId = insertOrg.rows[0].id;
        console.log('Created Organization "Digitech KH" with id:', orgId);
    } else {
        orgId = orgRes.rows[0].id;
        console.log('Existing Organization id:', orgId);
    }

    // 2. Fetch roles
    const superadminRole = (await client.query(`SELECT id FROM "user"."role" WHERE slug = 'superadmin' LIMIT 1;`)).rows[0];
    const orgAdminRole = (await client.query(`SELECT id FROM "user"."role" WHERE slug = 'org_admin' LIMIT 1;`)).rows[0];
    const userRole = (await client.query(`SELECT id FROM "user"."role" WHERE slug = 'user' LIMIT 1;`)).rows[0];

    // 3. For all users in the DB
    const users = (await client.query(`SELECT id, name_en, phone FROM "user"."user" ORDER BY id ASC;`)).rows;

    for (const u of users) {
        // Reset default roles first to prevent unique constraint conflicts
        await client.query(`UPDATE "user"."user_role" SET is_default = false WHERE user_id = $1;`, [u.id]);

        // Add as Organization Member
        await client.query(`
            INSERT INTO "organization"."organization_member" (
                organization_id, user_id, creator_id, status, sort
            ) VALUES (
                $1, $2, $2, 'active', 1
            )
            ON CONFLICT ("organization_id", "user_id") DO UPDATE SET status = 'active';
        `, [orgId, u.id]);

        // Role 1: Super Administrator (Default)
        await client.query(`
            INSERT INTO "user"."user_role" (user_id, role_id, organization_id, is_default)
            VALUES ($1, $2, NULL, true)
            ON CONFLICT ("user_id", "role_id") WHERE "organization_id" IS NULL DO UPDATE
            SET is_default = true, deleted_at = NULL;
        `, [u.id, superadminRole.id]);

        // Role 2: Organization Admin (Digitech KH)
        await client.query(`
            INSERT INTO "user"."user_role" (user_id, role_id, organization_id, is_default)
            VALUES ($1, $2, $3, false)
            ON CONFLICT ("user_id", "role_id", "organization_id") WHERE "organization_id" IS NOT NULL DO UPDATE
            SET is_default = false, deleted_at = NULL;
        `, [u.id, orgAdminRole.id, orgId]);

        // Role 3: User (Standard User)
        if (userRole) {
            await client.query(`
                INSERT INTO "user"."user_role" (user_id, role_id, organization_id, is_default)
                VALUES ($1, $2, NULL, false)
                ON CONFLICT ("user_id", "role_id") WHERE "organization_id" IS NULL DO UPDATE
                SET is_default = false, deleted_at = NULL;
            `, [u.id, userRole.id]);
        }

        console.log(`Assigned roles to ${u.name_en} (${u.phone}): Super Administrator, Organization Admin & User`);
    }

    // 4. Verify result
    const rolesResult = await client.query(`
        SELECT ur.id AS user_role_id, u.name_en AS user, r.name_en AS role, r.slug, o.name_en AS org, ur.is_default
        FROM "user"."user_role" ur
        JOIN "user"."user" u ON u.id = ur.user_id
        JOIN "user"."role" r ON r.id = ur.role_id
        LEFT JOIN "organization"."organization" o ON o.id = ur.organization_id
        ORDER BY u.id ASC, ur.is_default DESC;
    `);

    console.log('\n--- Current User Roles ---');
    console.table(rolesResult.rows);

    await client.end();
}

main().catch(console.error);
