-- ===========================================================================
-- MCP API keys
-- Mirrors src/app/model/user/mcp-api-key.entity.ts (TypeORM synchronize output).
-- Run against the target database before deploying the MCP feature.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Table: user.mcp_api_keys
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "user"."mcp_api_keys" (
    "id"                      uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id"                 integer NOT NULL,
    "name"                    varchar(100) NOT NULL,
    "key_hash"                varchar(64) NOT NULL,
    "key_prefix"              varchar(20) NOT NULL,
    "active_role_id"          integer,
    "active_organization_id"  uuid,
    "scopes"                  text[] NOT NULL DEFAULT ARRAY['setup:read', 'tasks:read']::text[],
    "expires_at"              TIMESTAMP NOT NULL DEFAULT (now() + INTERVAL '90 days'),
    "last_used_at"            TIMESTAMP,
    "revoked_at"              TIMESTAMP,
    "created_at"              TIMESTAMP NOT NULL DEFAULT now(),
    "updated_at"              TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "PK_mcp_api_keys_id" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "IDX_mcp_api_keys_key_hash"
    ON "user"."mcp_api_keys" ("key_hash");

ALTER TABLE "user"."mcp_api_keys"
    ADD CONSTRAINT "FK_mcp_api_keys_user_id"
    FOREIGN KEY ("user_id") REFERENCES "user"."user"("id") ON DELETE CASCADE;
