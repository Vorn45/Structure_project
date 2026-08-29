-- ===========================================================================
-- User "last seen" timestamp
-- Mirrors src/app/model/user/users.entity.ts (TypeORM synchronize output).
-- Run against the target database before deploying the last-active/last-seen feature.
-- ===========================================================================

ALTER TABLE "user"."user"
    ADD COLUMN IF NOT EXISTS "last_active_at" TIMESTAMP;
