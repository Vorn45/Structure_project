-- Grant the "superadmin" role to a user, identified by phone or email.
-- Fill in exactly one of the two values in the `target` CTE below.

WITH target AS (
    SELECT '0966326299'::text AS phone, NULL::text AS email
    -- Or, to target by email instead:
    -- SELECT NULL::text AS phone, 'someone@example.com'::text AS email
),
matched_user AS (
    SELECT u.id
    FROM "user"."user" u, target t
    WHERE (t.phone IS NOT NULL AND u.phone = t.phone)
       OR (t.email IS NOT NULL AND LOWER(u.email) = LOWER(t.email))
),
superadmin_role AS (
    SELECT id FROM "user"."role" WHERE slug = 'superadmin'
)
INSERT INTO "user"."user_role" ("user_id", "role_id", "organization_id", "is_default")
SELECT matched_user.id, superadmin_role.id, NULL, false
FROM matched_user, superadmin_role
ON CONFLICT ("user_id", "role_id") WHERE "organization_id" IS NULL DO UPDATE
SET deleted_at = NULL;

-- Verify
SELECT ur.id, u.id AS user_id, u.name_en, u.phone, u.email, r.slug AS role, ur.organization_id, ur.is_default, ur.deleted_at
FROM "user"."user_role" ur
JOIN "user"."user" u ON u.id = ur.user_id
JOIN "user"."role" r ON r.id = ur.role_id
WHERE r.slug = 'superadmin'
ORDER BY ur.id DESC;
