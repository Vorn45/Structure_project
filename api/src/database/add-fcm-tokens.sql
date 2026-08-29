-- ===========================================================================
-- FCM push notification tokens
-- Mirrors src/app/model/user/fcm-token.entity.ts (TypeORM synchronize output).
-- Run against the target database before deploying the FCM push feature.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Enum
-- ---------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE "user"."fcm_tokens_platform_enum" AS ENUM ('android', 'ios', 'web');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Enum values verified against src/app/enum/fcm-platform.enum.ts (FcmPlatform).

-- ---------------------------------------------------------------------------
-- Table: user.fcm_tokens
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "user"."fcm_tokens" (
    "id"            uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id"       integer NOT NULL,
    "token"         text NOT NULL,
    "platform"      "user"."fcm_tokens_platform_enum" NOT NULL DEFAULT 'web',
    "device_id"     varchar(255),
    "last_used_at"  TIMESTAMP,
    "created_at"    TIMESTAMP NOT NULL DEFAULT now(),
    "updated_at"    TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "PK_fcm_tokens_id" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "IDX_fcm_tokens_token"
    ON "user"."fcm_tokens" ("token");

ALTER TABLE "user"."fcm_tokens"
    ADD CONSTRAINT "FK_fcm_tokens_user_id"
    FOREIGN KEY ("user_id") REFERENCES "user"."user"("id") ON DELETE CASCADE;
