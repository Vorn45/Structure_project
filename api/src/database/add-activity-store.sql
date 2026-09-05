-- ===========================================================================
-- Activity Store & Plan Store Tables Migration
-- Mirrors src/app/model/user/activity-store.entity.ts & plan-store.entity.ts
-- ===========================================================================

-- 1. Ensure required extensions & schemas
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE SCHEMA IF NOT EXISTS "user";

-- ---------------------------------------------------------------------------
-- Table: user.activity_store
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "user"."activity_store" (
    "id"                    uuid NOT NULL DEFAULT gen_random_uuid(),
    "key"                   varchar(255) NOT NULL DEFAULT 'default_activities_store',
    "projects"              jsonb NULL DEFAULT '[]'::jsonb,
    "tasks_map"             jsonb NULL DEFAULT '{}'::jsonb,
    "activities"            jsonb NULL DEFAULT '[]'::jsonb,
    "selected_project_ids"  jsonb NULL DEFAULT '{}'::jsonb,
    "created_at"            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updated_at"            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT "PK_activity_store_id" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "IDX_activity_store_key"
    ON "user"."activity_store" ("key");

-- ---------------------------------------------------------------------------
-- Table: user.plan_store
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "user"."plan_store" (
    "id"            uuid NOT NULL DEFAULT gen_random_uuid(),
    "key"           varchar(255) NOT NULL DEFAULT 'default_plans_store',
    "plans"         jsonb NULL DEFAULT '[]'::jsonb,
    "created_at"    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updated_at"    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT "PK_plan_store_id" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "IDX_plan_store_key"
    ON "user"."plan_store" ("key");

-- ---------------------------------------------------------------------------
-- Table: user.task_store
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "user"."task_store" (
    "id"            uuid NOT NULL DEFAULT gen_random_uuid(),
    "key"           varchar(255) NOT NULL DEFAULT 'default_tasks_store',
    "tasks"         jsonb NULL DEFAULT '[]'::jsonb,
    "comments"      jsonb NULL DEFAULT '{}'::jsonb,
    "created_at"    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updated_at"    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT "PK_task_store_id" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "IDX_task_store_key"
    ON "user"."task_store" ("key");
