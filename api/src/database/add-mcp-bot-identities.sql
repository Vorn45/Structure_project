-- ===========================================================================
-- MCP bot identities
-- Mirrors src/app/model/user/mcp-bot-identity.entity.ts (TypeORM synchronize output).
-- Run against the target database before deploying the MCP chat-write feature.
--
-- Superseded shape: an earlier version of this table keyed one bot per MCP
-- client only (PK "client_key", no "owner_user_id"). If that version was
-- already applied, this DROPs it before recreating — safe only because the
-- table has never held anything but disposable test rows so far. Do not
-- reuse this DROP once real usage data exists; write a proper ALTER instead.
-- ===========================================================================

DROP TABLE IF EXISTS "user"."mcp_bot_identities" CASCADE;

-- ---------------------------------------------------------------------------
-- Table: user.mcp_bot_identities
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "user"."mcp_bot_identities" (
    "id"            SERIAL NOT NULL,
    "client_key"    varchar(100) NOT NULL,
    "owner_user_id" integer NOT NULL,
    "user_id"       integer NOT NULL,
    "created_at"    TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "PK_mcp_bot_identities_id" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "IDX_mcp_bot_identities_client_owner"
    ON "user"."mcp_bot_identities" ("client_key", "owner_user_id");

ALTER TABLE "user"."mcp_bot_identities"
    ADD CONSTRAINT "FK_mcp_bot_identities_owner_user_id"
    FOREIGN KEY ("owner_user_id") REFERENCES "user"."user"("id") ON DELETE CASCADE;

ALTER TABLE "user"."mcp_bot_identities"
    ADD CONSTRAINT "FK_mcp_bot_identities_user_id"
    FOREIGN KEY ("user_id") REFERENCES "user"."user"("id") ON DELETE CASCADE;
