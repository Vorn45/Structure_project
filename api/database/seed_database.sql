-- =============================================================================
-- DIGITECH WFM DATABASE RESTORATION & SEED SCRIPT
-- Database: wfm_db (PostgreSQL)
-- This script restores all 5 projects and 21 tasks to their exact prior state.
-- Safe, idempotent, and copy-paste ready for pgAdmin Query Tool / psql.
-- =============================================================================

BEGIN;

-- 1. Ensure required extensions and schemas exist
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE SCHEMA IF NOT EXISTS "project";
CREATE SCHEMA IF NOT EXISTS "task";
CREATE SCHEMA IF NOT EXISTS "user";

-- 2. Ensure target relational tables exist
CREATE TABLE IF NOT EXISTS "project"."projects" (
    "id" VARCHAR(100) PRIMARY KEY,
    "code" VARCHAR(50) UNIQUE NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" VARCHAR(50) DEFAULT 'active',
    "priority" VARCHAR(50) DEFAULT 'medium',
    "category" VARCHAR(100) DEFAULT 'it',
    "progress" INTEGER DEFAULT 0,
    "budget_allocated" NUMERIC(14, 2) DEFAULT 0,
    "budget_spent" NUMERIC(14, 2) DEFAULT 0,
    "start_date" TIMESTAMP WITH TIME ZONE,
    "end_date" TIMESTAMP WITH TIME ZONE,
    "team_lead" JSONB,
    "lead" JSONB,
    "members" JSONB DEFAULT '[]'::jsonb,
    "logo" TEXT,
    "image" TEXT,
    "attachments" JSONB DEFAULT '[]'::jsonb,
    "attachments_count" INTEGER DEFAULT 0,
    "total_tasks" INTEGER DEFAULT 0,
    "completed_tasks" INTEGER DEFAULT 0,
    "links" JSONB DEFAULT '[]'::jsonb,
    "meetings" JSONB DEFAULT '[]'::jsonb,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "project"."project_phases" (
    "id" VARCHAR(100) PRIMARY KEY,
    "project_id" VARCHAR(100) NOT NULL,
    "number" INTEGER DEFAULT 1,
    "title" VARCHAR(255) NOT NULL,
    "quarter" VARCHAR(100),
    "status" VARCHAR(50) DEFAULT 'planned',
    "progress" INTEGER DEFAULT 0,
    "start_date" TIMESTAMP WITH TIME ZONE,
    "end_date" TIMESTAMP WITH TIME ZONE,
    "tasks_count" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "task"."tasks" (
    "id" BIGINT PRIMARY KEY,
    "code" VARCHAR(50),
    "project_id" VARCHAR(100) NOT NULL,
    "project_name" VARCHAR(255),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "task_type" VARCHAR(50) DEFAULT 'feature',
    "module" VARCHAR(100),
    "status" VARCHAR(50) DEFAULT 'new',
    "priority" VARCHAR(50) DEFAULT 'medium',
    "progress" INTEGER DEFAULT 0,
    "comments_count" INTEGER DEFAULT 0,
    "attachments_count" INTEGER DEFAULT 0,
    "due_date" TIMESTAMP WITH TIME ZONE,
    "start_date" TIMESTAMP WITH TIME ZONE,
    "reporter" JSONB,
    "assignee" JSONB,
    "assignees" JSONB DEFAULT '[]'::jsonb,
    "subtasks" JSONB DEFAULT '[]'::jsonb,
    "links" JSONB DEFAULT '[]'::jsonb,
    "attachments" JSONB DEFAULT '[]'::jsonb,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "task"."task_comments" (
    "id" BIGINT PRIMARY KEY,
    "task_id" BIGINT NOT NULL,
    "sender_id" INTEGER,
    "sender_name" VARCHAR(255) NOT NULL,
    "sender_avatar" TEXT,
    "text" TEXT,
    "time" VARCHAR(50),
    "is_self" BOOLEAN DEFAULT false,
    "is_system" BOOLEAN DEFAULT false,
    "attachments" JSONB DEFAULT '[]'::jsonb,
    "seen_by" JSONB DEFAULT '[]'::jsonb,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "user"."plan_store" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "key" VARCHAR(255) NOT NULL DEFAULT 'default_plans_store',
    "plans" JSONB DEFAULT '[]'::jsonb,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "user"."task_store" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "key" VARCHAR(255) NOT NULL DEFAULT 'default_tasks_store',
    "tasks" JSONB DEFAULT '[]'::jsonb,
    "comments" JSONB DEFAULT '{}'::jsonb,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "IDX_plan_store_key" ON "user"."plan_store" ("key");
CREATE UNIQUE INDEX IF NOT EXISTS "IDX_task_store_key" ON "user"."task_store" ("key");

-- =============================================================================
-- 3. SEED RELATIONAL PROJECTS (5 Projects)
-- =============================================================================

INSERT INTO "project"."projects" (
    "id", "code", "name", "description", "status", "priority", "category",
    "progress", "budget_allocated", "budget_spent", "start_date", "end_date",
    "team_lead", "lead", "members", "logo", "image", "total_tasks", "completed_tasks",
    "attachments", "attachments_count", "links", "meetings", "updated_at"
) VALUES (
    '0001',
    '0001',
    'WMS Digitech',
    'Workforce & Attendance Management System - Digitech Real-time QR & Payroll.',
    'active',
    'urgent',
    'Workforce',
    30,
    15000,
    4500,
    '2026-08-09T09:24:17.350Z'::timestamptz,
    '2026-10-23T09:24:17.350Z'::timestamptz,
    '{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null}'::jsonb,
    '{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null}'::jsonb,
    '[{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null},{"id":102,"name":"PUM BRUSMUNY","role":"Developer","phone":"087280875","email":"pumprusmuny@example.com","avatar":null},{"id":103,"name":"THA WINNER","role":"Developer","phone":"067776682","email":"thawinner@example.com","avatar":null},{"id":104,"name":"PHUONG SOVANNARA","role":"Developer","phone":"011242425","email":"phuongsovannara@gmail.com","avatar":null}]'::jsonb,
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120"><rect width="120" height="120" rx="28" fill="%230b1329"/><rect x="1.5" y="1.5" width="117" height="117" rx="27" fill="none" stroke="%231e293b" stroke-width="2"/><circle cx="60" cy="60" r="41" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="1.5"/><g transform="translate(60, 60)"><path d="M 0 -25 L 23 -12 L 0 1 L -23 -12 Z" fill="%23fb923c" stroke="%23ea580c" stroke-width="1.5" stroke-linejoin="round"/><path d="M -23 -12 L 0 1 L 0 26 L -23 13 Z" fill="%230284c7" stroke="%230369a1" stroke-width="1.5" stroke-linejoin="round"/><path d="M 0 1 L 23 -12 L 23 13 L 0 26 Z" fill="%23ea580c" stroke="%23c2410c" stroke-width="1.5" stroke-linejoin="round"/><path d="M 0 1 L 0 26 M 0 1 L -23 -12 M 0 1 L 23 -12" stroke="%23ffffff" stroke-width="2.5" stroke-linecap="round"/><path d="M -11.5 -5.5 L 0 -12 L 11.5 -5.5 L 0 1 Z" fill="none" stroke="%23ffffff" stroke-width="1.5" stroke-opacity="0.7"/><path d="M -11.5 7 L -11.5 -5.5 M 11.5 7 L 11.5 -5.5" stroke="%23ffffff" stroke-width="1.5" stroke-opacity="0.7"/></g></svg>',
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120"><rect width="120" height="120" rx="28" fill="%230b1329"/><rect x="1.5" y="1.5" width="117" height="117" rx="27" fill="none" stroke="%231e293b" stroke-width="2"/><circle cx="60" cy="60" r="41" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="1.5"/><g transform="translate(60, 60)"><path d="M 0 -25 L 23 -12 L 0 1 L -23 -12 Z" fill="%23fb923c" stroke="%23ea580c" stroke-width="1.5" stroke-linejoin="round"/><path d="M -23 -12 L 0 1 L 0 26 L -23 13 Z" fill="%230284c7" stroke="%230369a1" stroke-width="1.5" stroke-linejoin="round"/><path d="M 0 1 L 23 -12 L 23 13 L 0 26 Z" fill="%23ea580c" stroke="%23c2410c" stroke-width="1.5" stroke-linejoin="round"/><path d="M 0 1 L 0 26 M 0 1 L -23 -12 M 0 1 L 23 -12" stroke="%23ffffff" stroke-width="2.5" stroke-linecap="round"/><path d="M -11.5 -5.5 L 0 -12 L 11.5 -5.5 L 0 1 Z" fill="none" stroke="%23ffffff" stroke-width="1.5" stroke-opacity="0.7"/><path d="M -11.5 7 L -11.5 -5.5 M 11.5 7 L 11.5 -5.5" stroke="%23ffffff" stroke-width="1.5" stroke-opacity="0.7"/></g></svg>',
    4,
    1,
    '[]'::jsonb,
    0,
    '[]'::jsonb,
    '[]'::jsonb,
    now()
)
ON CONFLICT ("id") DO UPDATE SET
    "code" = EXCLUDED."code",
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "status" = EXCLUDED."status",
    "priority" = EXCLUDED."priority",
    "category" = EXCLUDED."category",
    "progress" = EXCLUDED."progress",
    "budget_allocated" = EXCLUDED."budget_allocated",
    "budget_spent" = EXCLUDED."budget_spent",
    "start_date" = EXCLUDED."start_date",
    "end_date" = EXCLUDED."end_date",
    "team_lead" = EXCLUDED."team_lead",
    "lead" = EXCLUDED."lead",
    "members" = EXCLUDED."members",
    "logo" = EXCLUDED."logo",
    "image" = EXCLUDED."image",
    "total_tasks" = EXCLUDED."total_tasks",
    "completed_tasks" = EXCLUDED."completed_tasks",
    "updated_at" = now();

INSERT INTO "project"."projects" (
    "id", "code", "name", "description", "status", "priority", "category",
    "progress", "budget_allocated", "budget_spent", "start_date", "end_date",
    "team_lead", "lead", "members", "logo", "image", "total_tasks", "completed_tasks",
    "attachments", "attachments_count", "links", "meetings", "updated_at"
) VALUES (
    '0002',
    '0002',
    'BMS Digitech',
    'Business Management System - Digitech Project Management, Sales & Invoicing Workflow.',
    'active',
    'high',
    'Business',
    33,
    20000,
    6600,
    '2026-08-24T09:24:17.350Z'::timestamptz,
    '2026-11-07T09:24:17.350Z'::timestamptz,
    '{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null}'::jsonb,
    '{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null}'::jsonb,
    '[{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null},{"id":102,"name":"PUM BRUSMUNY","role":"Developer","phone":"087280875","email":"pumprusmuny@example.com","avatar":null},{"id":103,"name":"THA WINNER","role":"Developer","phone":"067776682","email":"thawinner@example.com","avatar":null},{"id":104,"name":"PHUONG SOVANNARA","role":"Developer","phone":"011242425","email":"phuongsovannara@gmail.com","avatar":null}]'::jsonb,
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120"><defs><linearGradient id="bmsGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%230284c7"/><stop offset="100%" stop-color="%230369a1"/></linearGradient></defs><rect width="120" height="120" rx="28" fill="%230b1329"/><rect x="1.5" y="1.5" width="117" height="117" rx="27" fill="none" stroke="%231e293b" stroke-width="2"/><circle cx="60" cy="60" r="41" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="1.5"/><circle cx="60" cy="60" r="34" fill="url(%23bmsGrad)"/><line x1="39" y1="76" x2="81" y2="76" stroke="%2393c5fd" stroke-width="2.5" stroke-linecap="round"/><rect x="42" y="62" width="7" height="14" rx="2" fill="%23bae6fd"/><rect x="52" y="51" width="7" height="25" rx="2" fill="%23ffffff"/><rect x="62" y="57" width="7" height="19" rx="2" fill="%23bae6fd"/><rect x="72" y="44" width="7" height="32" rx="2" fill="%2338bdf8"/><path d="M 41 65 L 53 49 L 64 55 L 78 39" fill="none" stroke="%2338bdf8" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="78" cy="39" r="4" fill="%23ffffff" stroke="%230284c7" stroke-width="2"/><circle cx="53" cy="49" r="2.5" fill="%23ffffff"/><circle cx="64" cy="55" r="2.5" fill="%23ffffff"/></svg>',
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120"><defs><linearGradient id="bmsGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%230284c7"/><stop offset="100%" stop-color="%230369a1"/></linearGradient></defs><rect width="120" height="120" rx="28" fill="%230b1329"/><rect x="1.5" y="1.5" width="117" height="117" rx="27" fill="none" stroke="%231e293b" stroke-width="2"/><circle cx="60" cy="60" r="41" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="1.5"/><circle cx="60" cy="60" r="34" fill="url(%23bmsGrad)"/><line x1="39" y1="76" x2="81" y2="76" stroke="%2393c5fd" stroke-width="2.5" stroke-linecap="round"/><rect x="42" y="62" width="7" height="14" rx="2" fill="%23bae6fd"/><rect x="52" y="51" width="7" height="25" rx="2" fill="%23ffffff"/><rect x="62" y="57" width="7" height="19" rx="2" fill="%23bae6fd"/><rect x="72" y="44" width="7" height="32" rx="2" fill="%2338bdf8"/><path d="M 41 65 L 53 49 L 64 55 L 78 39" fill="none" stroke="%2338bdf8" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="78" cy="39" r="4" fill="%23ffffff" stroke="%230284c7" stroke-width="2"/><circle cx="53" cy="49" r="2.5" fill="%23ffffff"/><circle cx="64" cy="55" r="2.5" fill="%23ffffff"/></svg>',
    6,
    1,
    '[]'::jsonb,
    0,
    '[]'::jsonb,
    '[]'::jsonb,
    now()
)
ON CONFLICT ("id") DO UPDATE SET
    "code" = EXCLUDED."code",
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "status" = EXCLUDED."status",
    "priority" = EXCLUDED."priority",
    "category" = EXCLUDED."category",
    "progress" = EXCLUDED."progress",
    "budget_allocated" = EXCLUDED."budget_allocated",
    "budget_spent" = EXCLUDED."budget_spent",
    "start_date" = EXCLUDED."start_date",
    "end_date" = EXCLUDED."end_date",
    "team_lead" = EXCLUDED."team_lead",
    "lead" = EXCLUDED."lead",
    "members" = EXCLUDED."members",
    "logo" = EXCLUDED."logo",
    "image" = EXCLUDED."image",
    "total_tasks" = EXCLUDED."total_tasks",
    "completed_tasks" = EXCLUDED."completed_tasks",
    "updated_at" = now();

INSERT INTO "project"."projects" (
    "id", "code", "name", "description", "status", "priority", "category",
    "progress", "budget_allocated", "budget_spent", "start_date", "end_date",
    "team_lead", "lead", "members", "logo", "image", "total_tasks", "completed_tasks",
    "attachments", "attachments_count", "links", "meetings", "updated_at"
) VALUES (
    '0003',
    '0003',
    'EBMS',
    'EBMS Enterprise Business Management System.',
    'planned',
    'medium',
    'Enterprise',
    0,
    12000,
    0,
    '2026-09-18T00:00:00.000Z'::timestamptz,
    '2026-11-17T00:00:00.000Z'::timestamptz,
    '{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null}'::jsonb,
    '{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null}'::jsonb,
    '[{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null},{"id":102,"name":"PUM BRUSMUNY","role":"Developer","phone":"087280875","email":"pumprusmuny@example.com","avatar":null},{"id":103,"name":"THA WINNER","role":"Developer","phone":"067776682","email":"thawinner@example.com","avatar":null}]'::jsonb,
    '/images/logo/logo.png',
    '/images/logo/logo.png',
    0,
    0,
    '[]'::jsonb,
    0,
    '[]'::jsonb,
    '[]'::jsonb,
    now()
)
ON CONFLICT ("id") DO UPDATE SET
    "code" = EXCLUDED."code",
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "status" = EXCLUDED."status",
    "priority" = EXCLUDED."priority",
    "category" = EXCLUDED."category",
    "progress" = EXCLUDED."progress",
    "budget_allocated" = EXCLUDED."budget_allocated",
    "budget_spent" = EXCLUDED."budget_spent",
    "start_date" = EXCLUDED."start_date",
    "end_date" = EXCLUDED."end_date",
    "team_lead" = EXCLUDED."team_lead",
    "lead" = EXCLUDED."lead",
    "members" = EXCLUDED."members",
    "logo" = EXCLUDED."logo",
    "image" = EXCLUDED."image",
    "total_tasks" = EXCLUDED."total_tasks",
    "completed_tasks" = EXCLUDED."completed_tasks",
    "updated_at" = now();

INSERT INTO "project"."projects" (
    "id", "code", "name", "description", "status", "priority", "category",
    "progress", "budget_allocated", "budget_spent", "start_date", "end_date",
    "team_lead", "lead", "members", "logo", "image", "total_tasks", "completed_tasks",
    "attachments", "attachments_count", "links", "meetings", "updated_at"
) VALUES (
    '0004',
    '0004',
    'Evenbooking-System',
    'Evenbooking-System Online Event Booking & Ticketing Platform.',
    'active',
    'high',
    'Booking',
    40,
    25000,
    10000,
    '2026-09-18T00:00:00.000Z'::timestamptz,
    '2026-11-17T00:00:00.000Z'::timestamptz,
    '{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null}'::jsonb,
    '{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null}'::jsonb,
    '[{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null},{"id":102,"name":"PUM BRUSMUNY","role":"Developer","phone":"087280875","email":"pumprusmuny@example.com","avatar":null},{"id":103,"name":"THA WINNER","role":"Developer","phone":"067776682","email":"thawinner@example.com","avatar":null},{"id":104,"name":"PHUONG SOVANNARA","role":"Developer","phone":"011242425","email":"phuongsovannara@gmail.com","avatar":null}]'::jsonb,
    '/images/logo/logo.png',
    '/images/logo/logo.png',
    10,
    4,
    '[]'::jsonb,
    0,
    '[]'::jsonb,
    '[]'::jsonb,
    now()
)
ON CONFLICT ("id") DO UPDATE SET
    "code" = EXCLUDED."code",
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "status" = EXCLUDED."status",
    "priority" = EXCLUDED."priority",
    "category" = EXCLUDED."category",
    "progress" = EXCLUDED."progress",
    "budget_allocated" = EXCLUDED."budget_allocated",
    "budget_spent" = EXCLUDED."budget_spent",
    "start_date" = EXCLUDED."start_date",
    "end_date" = EXCLUDED."end_date",
    "team_lead" = EXCLUDED."team_lead",
    "lead" = EXCLUDED."lead",
    "members" = EXCLUDED."members",
    "logo" = EXCLUDED."logo",
    "image" = EXCLUDED."image",
    "total_tasks" = EXCLUDED."total_tasks",
    "completed_tasks" = EXCLUDED."completed_tasks",
    "updated_at" = now();

INSERT INTO "project"."projects" (
    "id", "code", "name", "description", "status", "priority", "category",
    "progress", "budget_allocated", "budget_spent", "start_date", "end_date",
    "team_lead", "lead", "members", "logo", "image", "total_tasks", "completed_tasks",
    "attachments", "attachments_count", "links", "meetings", "updated_at"
) VALUES (
    '0005',
    '0005',
    'TESTER',
    'Testing and Quality Assurance Project.',
    'active',
    'low',
    'QA',
    0,
    5000,
    0,
    '2026-09-17T00:00:00.000Z'::timestamptz,
    '2026-11-16T00:00:00.000Z'::timestamptz,
    '{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null}'::jsonb,
    '{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null}'::jsonb,
    '[{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null},{"id":102,"name":"PUM BRUSMUNY","role":"Developer","phone":"087280875","email":"pumprusmuny@example.com","avatar":null},{"id":103,"name":"THA WINNER","role":"Developer","phone":"067776682","email":"thawinner@example.com","avatar":null}]'::jsonb,
    '/images/logo/logo.png',
    '/images/logo/logo.png',
    1,
    0,
    '[]'::jsonb,
    0,
    '[]'::jsonb,
    '[]'::jsonb,
    now()
)
ON CONFLICT ("id") DO UPDATE SET
    "code" = EXCLUDED."code",
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "status" = EXCLUDED."status",
    "priority" = EXCLUDED."priority",
    "category" = EXCLUDED."category",
    "progress" = EXCLUDED."progress",
    "budget_allocated" = EXCLUDED."budget_allocated",
    "budget_spent" = EXCLUDED."budget_spent",
    "start_date" = EXCLUDED."start_date",
    "end_date" = EXCLUDED."end_date",
    "team_lead" = EXCLUDED."team_lead",
    "lead" = EXCLUDED."lead",
    "members" = EXCLUDED."members",
    "logo" = EXCLUDED."logo",
    "image" = EXCLUDED."image",
    "total_tasks" = EXCLUDED."total_tasks",
    "completed_tasks" = EXCLUDED."completed_tasks",
    "updated_at" = now();

-- =============================================================================
-- 4. SEED PROJECT PHASES
-- =============================================================================

INSERT INTO "project"."project_phases" (
    "id", "project_id", "number", "title", "quarter", "status", "progress",
    "start_date", "end_date", "tasks_count", "updated_at"
) VALUES (
    'wms-ph-1',
    '0001',
    1,
    'Phase 1: QR & Attendance Check-in',
    'Q1',
    'completed',
    100,
    '2026-08-09T00:00:00.000Z'::timestamptz,
    '2026-08-30T00:00:00.000Z'::timestamptz,
    2,
    now()
)
ON CONFLICT ("id") DO UPDATE SET
    "project_id" = EXCLUDED."project_id",
    "number" = EXCLUDED."number",
    "title" = EXCLUDED."title",
    "quarter" = EXCLUDED."quarter",
    "status" = EXCLUDED."status",
    "progress" = EXCLUDED."progress",
    "start_date" = EXCLUDED."start_date",
    "end_date" = EXCLUDED."end_date",
    "tasks_count" = EXCLUDED."tasks_count",
    "updated_at" = now();

INSERT INTO "project"."project_phases" (
    "id", "project_id", "number", "title", "quarter", "status", "progress",
    "start_date", "end_date", "tasks_count", "updated_at"
) VALUES (
    'wms-ph-2',
    '0001',
    2,
    'Phase 2: Department Structure & Reports',
    'Q2',
    'in_progress',
    60,
    '2026-09-01T00:00:00.000Z'::timestamptz,
    '2026-09-30T00:00:00.000Z'::timestamptz,
    2,
    now()
)
ON CONFLICT ("id") DO UPDATE SET
    "project_id" = EXCLUDED."project_id",
    "number" = EXCLUDED."number",
    "title" = EXCLUDED."title",
    "quarter" = EXCLUDED."quarter",
    "status" = EXCLUDED."status",
    "progress" = EXCLUDED."progress",
    "start_date" = EXCLUDED."start_date",
    "end_date" = EXCLUDED."end_date",
    "tasks_count" = EXCLUDED."tasks_count",
    "updated_at" = now();

INSERT INTO "project"."project_phases" (
    "id", "project_id", "number", "title", "quarter", "status", "progress",
    "start_date", "end_date", "tasks_count", "updated_at"
) VALUES (
    'wms-ph-3',
    '0001',
    3,
    'Phase 3: Geofencing & Biometrics',
    'Q3',
    'planned',
    0,
    '2026-10-01T00:00:00.000Z'::timestamptz,
    '2026-10-23T00:00:00.000Z'::timestamptz,
    0,
    now()
)
ON CONFLICT ("id") DO UPDATE SET
    "project_id" = EXCLUDED."project_id",
    "number" = EXCLUDED."number",
    "title" = EXCLUDED."title",
    "quarter" = EXCLUDED."quarter",
    "status" = EXCLUDED."status",
    "progress" = EXCLUDED."progress",
    "start_date" = EXCLUDED."start_date",
    "end_date" = EXCLUDED."end_date",
    "tasks_count" = EXCLUDED."tasks_count",
    "updated_at" = now();

INSERT INTO "project"."project_phases" (
    "id", "project_id", "number", "title", "quarter", "status", "progress",
    "start_date", "end_date", "tasks_count", "updated_at"
) VALUES (
    'bms-ph-1',
    '0002',
    1,
    'Phase 1: Project Management & Documents',
    'Q1',
    'completed',
    100,
    '2026-08-24T00:00:00.000Z'::timestamptz,
    '2026-09-10T00:00:00.000Z'::timestamptz,
    2,
    now()
)
ON CONFLICT ("id") DO UPDATE SET
    "project_id" = EXCLUDED."project_id",
    "number" = EXCLUDED."number",
    "title" = EXCLUDED."title",
    "quarter" = EXCLUDED."quarter",
    "status" = EXCLUDED."status",
    "progress" = EXCLUDED."progress",
    "start_date" = EXCLUDED."start_date",
    "end_date" = EXCLUDED."end_date",
    "tasks_count" = EXCLUDED."tasks_count",
    "updated_at" = now();

INSERT INTO "project"."project_phases" (
    "id", "project_id", "number", "title", "quarter", "status", "progress",
    "start_date", "end_date", "tasks_count", "updated_at"
) VALUES (
    'bms-ph-2',
    '0002',
    2,
    'Phase 2: Payment Gateway & Purchases',
    'Q2',
    'in_progress',
    50,
    '2026-09-11T00:00:00.000Z'::timestamptz,
    '2026-10-15T00:00:00.000Z'::timestamptz,
    3,
    now()
)
ON CONFLICT ("id") DO UPDATE SET
    "project_id" = EXCLUDED."project_id",
    "number" = EXCLUDED."number",
    "title" = EXCLUDED."title",
    "quarter" = EXCLUDED."quarter",
    "status" = EXCLUDED."status",
    "progress" = EXCLUDED."progress",
    "start_date" = EXCLUDED."start_date",
    "end_date" = EXCLUDED."end_date",
    "tasks_count" = EXCLUDED."tasks_count",
    "updated_at" = now();

INSERT INTO "project"."project_phases" (
    "id", "project_id", "number", "title", "quarter", "status", "progress",
    "start_date", "end_date", "tasks_count", "updated_at"
) VALUES (
    'bms-ph-3',
    '0002',
    3,
    'Phase 3: Sprint Analytics & Audits',
    'Q3',
    'planned',
    0,
    '2026-10-16T00:00:00.000Z'::timestamptz,
    '2026-11-07T00:00:00.000Z'::timestamptz,
    1,
    now()
)
ON CONFLICT ("id") DO UPDATE SET
    "project_id" = EXCLUDED."project_id",
    "number" = EXCLUDED."number",
    "title" = EXCLUDED."title",
    "quarter" = EXCLUDED."quarter",
    "status" = EXCLUDED."status",
    "progress" = EXCLUDED."progress",
    "start_date" = EXCLUDED."start_date",
    "end_date" = EXCLUDED."end_date",
    "tasks_count" = EXCLUDED."tasks_count",
    "updated_at" = now();

INSERT INTO "project"."project_phases" (
    "id", "project_id", "number", "title", "quarter", "status", "progress",
    "start_date", "end_date", "tasks_count", "updated_at"
) VALUES (
    'ebms-ph-1',
    '0003',
    1,
    'Phase 1: Architecture & Scope Definition',
    'Q3',
    'planned',
    0,
    '2026-09-18T00:00:00.000Z'::timestamptz,
    '2026-10-18T00:00:00.000Z'::timestamptz,
    0,
    now()
)
ON CONFLICT ("id") DO UPDATE SET
    "project_id" = EXCLUDED."project_id",
    "number" = EXCLUDED."number",
    "title" = EXCLUDED."title",
    "quarter" = EXCLUDED."quarter",
    "status" = EXCLUDED."status",
    "progress" = EXCLUDED."progress",
    "start_date" = EXCLUDED."start_date",
    "end_date" = EXCLUDED."end_date",
    "tasks_count" = EXCLUDED."tasks_count",
    "updated_at" = now();

INSERT INTO "project"."project_phases" (
    "id", "project_id", "number", "title", "quarter", "status", "progress",
    "start_date", "end_date", "tasks_count", "updated_at"
) VALUES (
    'evb-ph-1',
    '0004',
    1,
    'Phase 1: Landing Page, Navbar & User Profile',
    'Q1',
    'completed',
    100,
    '2026-08-25T00:00:00.000Z'::timestamptz,
    '2026-09-10T00:00:00.000Z'::timestamptz,
    4,
    now()
)
ON CONFLICT ("id") DO UPDATE SET
    "project_id" = EXCLUDED."project_id",
    "number" = EXCLUDED."number",
    "title" = EXCLUDED."title",
    "quarter" = EXCLUDED."quarter",
    "status" = EXCLUDED."status",
    "progress" = EXCLUDED."progress",
    "start_date" = EXCLUDED."start_date",
    "end_date" = EXCLUDED."end_date",
    "tasks_count" = EXCLUDED."tasks_count",
    "updated_at" = now();

INSERT INTO "project"."project_phases" (
    "id", "project_id", "number", "title", "quarter", "status", "progress",
    "start_date", "end_date", "tasks_count", "updated_at"
) VALUES (
    'evb-ph-2',
    '0004',
    2,
    'Phase 2: Event Layout & ECharts Analytics',
    'Q2',
    'in_progress',
    40,
    '2026-09-11T00:00:00.000Z'::timestamptz,
    '2026-10-10T00:00:00.000Z'::timestamptz,
    3,
    now()
)
ON CONFLICT ("id") DO UPDATE SET
    "project_id" = EXCLUDED."project_id",
    "number" = EXCLUDED."number",
    "title" = EXCLUDED."title",
    "quarter" = EXCLUDED."quarter",
    "status" = EXCLUDED."status",
    "progress" = EXCLUDED."progress",
    "start_date" = EXCLUDED."start_date",
    "end_date" = EXCLUDED."end_date",
    "tasks_count" = EXCLUDED."tasks_count",
    "updated_at" = now();

INSERT INTO "project"."project_phases" (
    "id", "project_id", "number", "title", "quarter", "status", "progress",
    "start_date", "end_date", "tasks_count", "updated_at"
) VALUES (
    'evb-ph-3',
    '0004',
    3,
    'Phase 3: Ticket Booking & Organizer Hub',
    'Q3',
    'planned',
    0,
    '2026-10-11T00:00:00.000Z'::timestamptz,
    '2026-11-17T00:00:00.000Z'::timestamptz,
    3,
    now()
)
ON CONFLICT ("id") DO UPDATE SET
    "project_id" = EXCLUDED."project_id",
    "number" = EXCLUDED."number",
    "title" = EXCLUDED."title",
    "quarter" = EXCLUDED."quarter",
    "status" = EXCLUDED."status",
    "progress" = EXCLUDED."progress",
    "start_date" = EXCLUDED."start_date",
    "end_date" = EXCLUDED."end_date",
    "tasks_count" = EXCLUDED."tasks_count",
    "updated_at" = now();

INSERT INTO "project"."project_phases" (
    "id", "project_id", "number", "title", "quarter", "status", "progress",
    "start_date", "end_date", "tasks_count", "updated_at"
) VALUES (
    'tst-ph-1',
    '0005',
    1,
    'Phase 1: End-to-End Smoke Testing',
    'Q3',
    'planned',
    0,
    '2026-09-17T00:00:00.000Z'::timestamptz,
    '2026-11-16T00:00:00.000Z'::timestamptz,
    1,
    now()
)
ON CONFLICT ("id") DO UPDATE SET
    "project_id" = EXCLUDED."project_id",
    "number" = EXCLUDED."number",
    "title" = EXCLUDED."title",
    "quarter" = EXCLUDED."quarter",
    "status" = EXCLUDED."status",
    "progress" = EXCLUDED."progress",
    "start_date" = EXCLUDED."start_date",
    "end_date" = EXCLUDED."end_date",
    "tasks_count" = EXCLUDED."tasks_count",
    "updated_at" = now();

-- =============================================================================
-- 5. SEED TASKS (21 Tasks across all 5 projects)
-- =============================================================================

INSERT INTO "task"."tasks" (
    "id", "code", "project_id", "project_name", "title", "description",
    "task_type", "module", "status", "priority", "progress",
    "comments_count", "attachments_count", "due_date", "start_date",
    "reporter", "assignee", "assignees", "subtasks", "links", "attachments",
    "created_at", "updated_at"
) VALUES (
    1001,
    '#0004-1',
    '0004',
    'Evenbooking-System',
    'About us and contact us',
    'Implement about us page layout, company contact details, and inquiry form submission.',
    'feature',
    'Information',
    'done',
    'high',
    100,
    8,
    0,
    '2026-09-25T00:00:00.000Z'::timestamptz,
    '2026-08-25T08:00:00.000Z'::timestamptz,
    '{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null}'::jsonb,
    '{"id":103,"name":"THA WINNER","role":"Developer","phone":"067776682","email":"thawinner@example.com","avatar":null}'::jsonb,
    '[{"id":103,"name":"THA WINNER","role":"Developer","phone":"067776682","email":"thawinner@example.com","avatar":null}]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '2026-08-25T08:00:00.000Z'::timestamptz,
    '2026-09-10T12:00:00.000Z'::timestamptz
)
ON CONFLICT ("id") DO UPDATE SET
    "code" = EXCLUDED."code",
    "project_id" = EXCLUDED."project_id",
    "project_name" = EXCLUDED."project_name",
    "title" = EXCLUDED."title",
    "description" = EXCLUDED."description",
    "task_type" = EXCLUDED."task_type",
    "module" = EXCLUDED."module",
    "status" = EXCLUDED."status",
    "priority" = EXCLUDED."priority",
    "progress" = EXCLUDED."progress",
    "comments_count" = EXCLUDED."comments_count",
    "attachments_count" = EXCLUDED."attachments_count",
    "due_date" = EXCLUDED."due_date",
    "start_date" = EXCLUDED."start_date",
    "reporter" = EXCLUDED."reporter",
    "assignee" = EXCLUDED."assignee",
    "assignees" = EXCLUDED."assignees",
    "updated_at" = now();

INSERT INTO "task"."tasks" (
    "id", "code", "project_id", "project_name", "title", "description",
    "task_type", "module", "status", "priority", "progress",
    "comments_count", "attachments_count", "due_date", "start_date",
    "reporter", "assignee", "assignees", "subtasks", "links", "attachments",
    "created_at", "updated_at"
) VALUES (
    1002,
    '#0004-2',
    '0004',
    'Evenbooking-System',
    'Improve Navbar',
    'Refactor responsive navigation bar with mobile burger menu and active route highlight.',
    'feature',
    'Navigation',
    'done',
    'medium',
    100,
    10,
    2,
    '2026-09-25T00:00:00.000Z'::timestamptz,
    '2026-08-25T08:15:00.000Z'::timestamptz,
    '{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null}'::jsonb,
    '{"id":103,"name":"THA WINNER","role":"Developer","phone":"067776682","email":"thawinner@example.com","avatar":null}'::jsonb,
    '[{"id":103,"name":"THA WINNER","role":"Developer","phone":"067776682","email":"thawinner@example.com","avatar":null}]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '2026-08-25T08:15:00.000Z'::timestamptz,
    '2026-09-10T12:00:00.000Z'::timestamptz
)
ON CONFLICT ("id") DO UPDATE SET
    "code" = EXCLUDED."code",
    "project_id" = EXCLUDED."project_id",
    "project_name" = EXCLUDED."project_name",
    "title" = EXCLUDED."title",
    "description" = EXCLUDED."description",
    "task_type" = EXCLUDED."task_type",
    "module" = EXCLUDED."module",
    "status" = EXCLUDED."status",
    "priority" = EXCLUDED."priority",
    "progress" = EXCLUDED."progress",
    "comments_count" = EXCLUDED."comments_count",
    "attachments_count" = EXCLUDED."attachments_count",
    "due_date" = EXCLUDED."due_date",
    "start_date" = EXCLUDED."start_date",
    "reporter" = EXCLUDED."reporter",
    "assignee" = EXCLUDED."assignee",
    "assignees" = EXCLUDED."assignees",
    "updated_at" = now();

INSERT INTO "task"."tasks" (
    "id", "code", "project_id", "project_name", "title", "description",
    "task_type", "module", "status", "priority", "progress",
    "comments_count", "attachments_count", "due_date", "start_date",
    "reporter", "assignee", "assignees", "subtasks", "links", "attachments",
    "created_at", "updated_at"
) VALUES (
    1003,
    '#0004-3',
    '0004',
    'Evenbooking-System',
    'Improve profile panel',
    'Design user profile side drawer with account summary, edit button, and logout option.',
    'feature',
    'User Profile',
    'done',
    'medium',
    100,
    6,
    1,
    '2026-09-25T00:00:00.000Z'::timestamptz,
    '2026-08-25T08:30:00.000Z'::timestamptz,
    '{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null}'::jsonb,
    '{"id":103,"name":"THA WINNER","role":"Developer","phone":"067776682","email":"thawinner@example.com","avatar":null}'::jsonb,
    '[{"id":103,"name":"THA WINNER","role":"Developer","phone":"067776682","email":"thawinner@example.com","avatar":null}]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '2026-08-25T08:30:00.000Z'::timestamptz,
    '2026-09-10T12:00:00.000Z'::timestamptz
)
ON CONFLICT ("id") DO UPDATE SET
    "code" = EXCLUDED."code",
    "project_id" = EXCLUDED."project_id",
    "project_name" = EXCLUDED."project_name",
    "title" = EXCLUDED."title",
    "description" = EXCLUDED."description",
    "task_type" = EXCLUDED."task_type",
    "module" = EXCLUDED."module",
    "status" = EXCLUDED."status",
    "priority" = EXCLUDED."priority",
    "progress" = EXCLUDED."progress",
    "comments_count" = EXCLUDED."comments_count",
    "attachments_count" = EXCLUDED."attachments_count",
    "due_date" = EXCLUDED."due_date",
    "start_date" = EXCLUDED."start_date",
    "reporter" = EXCLUDED."reporter",
    "assignee" = EXCLUDED."assignee",
    "assignees" = EXCLUDED."assignees",
    "updated_at" = now();

INSERT INTO "task"."tasks" (
    "id", "code", "project_id", "project_name", "title", "description",
    "task_type", "module", "status", "priority", "progress",
    "comments_count", "attachments_count", "due_date", "start_date",
    "reporter", "assignee", "assignees", "subtasks", "links", "attachments",
    "created_at", "updated_at"
) VALUES (
    1004,
    '#0004-4',
    '0004',
    'Evenbooking-System',
    'Redesign event layout',
    'Modernize event cards grid with banner images, date badge, venue tag, and book button.',
    'feature',
    'Events',
    'new',
    'urgent',
    20,
    6,
    2,
    '2026-09-25T00:00:00.000Z'::timestamptz,
    '2026-08-25T08:45:00.000Z'::timestamptz,
    '{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null}'::jsonb,
    '{"id":103,"name":"THA WINNER","role":"Developer","phone":"067776682","email":"thawinner@example.com","avatar":null}'::jsonb,
    '[{"id":103,"name":"THA WINNER","role":"Developer","phone":"067776682","email":"thawinner@example.com","avatar":null}]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '2026-08-25T08:45:00.000Z'::timestamptz,
    '2026-09-18T12:00:00.000Z'::timestamptz
)
ON CONFLICT ("id") DO UPDATE SET
    "code" = EXCLUDED."code",
    "project_id" = EXCLUDED."project_id",
    "project_name" = EXCLUDED."project_name",
    "title" = EXCLUDED."title",
    "description" = EXCLUDED."description",
    "task_type" = EXCLUDED."task_type",
    "module" = EXCLUDED."module",
    "status" = EXCLUDED."status",
    "priority" = EXCLUDED."priority",
    "progress" = EXCLUDED."progress",
    "comments_count" = EXCLUDED."comments_count",
    "attachments_count" = EXCLUDED."attachments_count",
    "due_date" = EXCLUDED."due_date",
    "start_date" = EXCLUDED."start_date",
    "reporter" = EXCLUDED."reporter",
    "assignee" = EXCLUDED."assignee",
    "assignees" = EXCLUDED."assignees",
    "updated_at" = now();

INSERT INTO "task"."tasks" (
    "id", "code", "project_id", "project_name", "title", "description",
    "task_type", "module", "status", "priority", "progress",
    "comments_count", "attachments_count", "due_date", "start_date",
    "reporter", "assignee", "assignees", "subtasks", "links", "attachments",
    "created_at", "updated_at"
) VALUES (
    1005,
    '#0004-5',
    '0004',
    'Evenbooking-System',
    'Improve Footer UI',
    'Update footer links, social media icons, copyright notice, and dark mode styling.',
    'improvement',
    'Footer',
    'done',
    'medium',
    100,
    5,
    2,
    '2026-09-25T00:00:00.000Z'::timestamptz,
    '2026-08-25T09:00:00.000Z'::timestamptz,
    '{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null}'::jsonb,
    '{"id":103,"name":"THA WINNER","role":"Developer","phone":"067776682","email":"thawinner@example.com","avatar":null}'::jsonb,
    '[{"id":103,"name":"THA WINNER","role":"Developer","phone":"067776682","email":"thawinner@example.com","avatar":null}]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '2026-08-25T09:00:00.000Z'::timestamptz,
    '2026-09-10T12:00:00.000Z'::timestamptz
)
ON CONFLICT ("id") DO UPDATE SET
    "code" = EXCLUDED."code",
    "project_id" = EXCLUDED."project_id",
    "project_name" = EXCLUDED."project_name",
    "title" = EXCLUDED."title",
    "description" = EXCLUDED."description",
    "task_type" = EXCLUDED."task_type",
    "module" = EXCLUDED."module",
    "status" = EXCLUDED."status",
    "priority" = EXCLUDED."priority",
    "progress" = EXCLUDED."progress",
    "comments_count" = EXCLUDED."comments_count",
    "attachments_count" = EXCLUDED."attachments_count",
    "due_date" = EXCLUDED."due_date",
    "start_date" = EXCLUDED."start_date",
    "reporter" = EXCLUDED."reporter",
    "assignee" = EXCLUDED."assignee",
    "assignees" = EXCLUDED."assignees",
    "updated_at" = now();

INSERT INTO "task"."tasks" (
    "id", "code", "project_id", "project_name", "title", "description",
    "task_type", "module", "status", "priority", "progress",
    "comments_count", "attachments_count", "due_date", "start_date",
    "reporter", "assignee", "assignees", "subtasks", "links", "attachments",
    "created_at", "updated_at"
) VALUES (
    1006,
    '#0004-6',
    '0004',
    'Evenbooking-System',
    'Improve or redesign home page',
    'Implement hero banner slider, trending events carousel, and category pill filters.',
    'feature',
    'Home Page',
    'new',
    'urgent',
    15,
    5,
    1,
    '2026-09-25T00:00:00.000Z'::timestamptz,
    '2026-08-25T09:15:00.000Z'::timestamptz,
    '{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null}'::jsonb,
    '{"id":103,"name":"THA WINNER","role":"Developer","phone":"067776682","email":"thawinner@example.com","avatar":null}'::jsonb,
    '[{"id":103,"name":"THA WINNER","role":"Developer","phone":"067776682","email":"thawinner@example.com","avatar":null}]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '2026-08-25T09:15:00.000Z'::timestamptz,
    '2026-09-18T12:00:00.000Z'::timestamptz
)
ON CONFLICT ("id") DO UPDATE SET
    "code" = EXCLUDED."code",
    "project_id" = EXCLUDED."project_id",
    "project_name" = EXCLUDED."project_name",
    "title" = EXCLUDED."title",
    "description" = EXCLUDED."description",
    "task_type" = EXCLUDED."task_type",
    "module" = EXCLUDED."module",
    "status" = EXCLUDED."status",
    "priority" = EXCLUDED."priority",
    "progress" = EXCLUDED."progress",
    "comments_count" = EXCLUDED."comments_count",
    "attachments_count" = EXCLUDED."attachments_count",
    "due_date" = EXCLUDED."due_date",
    "start_date" = EXCLUDED."start_date",
    "reporter" = EXCLUDED."reporter",
    "assignee" = EXCLUDED."assignee",
    "assignees" = EXCLUDED."assignees",
    "updated_at" = now();

INSERT INTO "task"."tasks" (
    "id", "code", "project_id", "project_name", "title", "description",
    "task_type", "module", "status", "priority", "progress",
    "comments_count", "attachments_count", "due_date", "start_date",
    "reporter", "assignee", "assignees", "subtasks", "links", "attachments",
    "created_at", "updated_at"
) VALUES (
    1007,
    '#0004-7',
    '0004',
    'Evenbooking-System',
    'Improve bar chart change to use echart',
    'Replace standard canvas chart with Apache ECharts for ticket sales analytics.',
    'feature',
    'Analytics',
    'new',
    'medium',
    30,
    5,
    1,
    '2026-09-25T00:00:00.000Z'::timestamptz,
    '2026-08-25T09:30:00.000Z'::timestamptz,
    '{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null}'::jsonb,
    '{"id":103,"name":"THA WINNER","role":"Developer","phone":"067776682","email":"thawinner@example.com","avatar":null}'::jsonb,
    '[{"id":103,"name":"THA WINNER","role":"Developer","phone":"067776682","email":"thawinner@example.com","avatar":null}]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '2026-08-25T09:30:00.000Z'::timestamptz,
    '2026-09-18T12:00:00.000Z'::timestamptz
)
ON CONFLICT ("id") DO UPDATE SET
    "code" = EXCLUDED."code",
    "project_id" = EXCLUDED."project_id",
    "project_name" = EXCLUDED."project_name",
    "title" = EXCLUDED."title",
    "description" = EXCLUDED."description",
    "task_type" = EXCLUDED."task_type",
    "module" = EXCLUDED."module",
    "status" = EXCLUDED."status",
    "priority" = EXCLUDED."priority",
    "progress" = EXCLUDED."progress",
    "comments_count" = EXCLUDED."comments_count",
    "attachments_count" = EXCLUDED."attachments_count",
    "due_date" = EXCLUDED."due_date",
    "start_date" = EXCLUDED."start_date",
    "reporter" = EXCLUDED."reporter",
    "assignee" = EXCLUDED."assignee",
    "assignees" = EXCLUDED."assignees",
    "updated_at" = now();

INSERT INTO "task"."tasks" (
    "id", "code", "project_id", "project_name", "title", "description",
    "task_type", "module", "status", "priority", "progress",
    "comments_count", "attachments_count", "due_date", "start_date",
    "reporter", "assignee", "assignees", "subtasks", "links", "attachments",
    "created_at", "updated_at"
) VALUES (
    1008,
    '#0004-8',
    '0004',
    'Evenbooking-System',
    'Allow change phone number',
    'Add OTP verification step when user requests phone number update in settings.',
    'feature',
    'User Settings',
    'new',
    'medium',
    0,
    3,
    1,
    '2026-09-25T00:00:00.000Z'::timestamptz,
    '2026-08-25T09:45:00.000Z'::timestamptz,
    '{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null}'::jsonb,
    '{"id":103,"name":"THA WINNER","role":"Developer","phone":"067776682","email":"thawinner@example.com","avatar":null}'::jsonb,
    '[{"id":103,"name":"THA WINNER","role":"Developer","phone":"067776682","email":"thawinner@example.com","avatar":null}]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '2026-08-25T09:45:00.000Z'::timestamptz,
    '2026-09-18T12:00:00.000Z'::timestamptz
)
ON CONFLICT ("id") DO UPDATE SET
    "code" = EXCLUDED."code",
    "project_id" = EXCLUDED."project_id",
    "project_name" = EXCLUDED."project_name",
    "title" = EXCLUDED."title",
    "description" = EXCLUDED."description",
    "task_type" = EXCLUDED."task_type",
    "module" = EXCLUDED."module",
    "status" = EXCLUDED."status",
    "priority" = EXCLUDED."priority",
    "progress" = EXCLUDED."progress",
    "comments_count" = EXCLUDED."comments_count",
    "attachments_count" = EXCLUDED."attachments_count",
    "due_date" = EXCLUDED."due_date",
    "start_date" = EXCLUDED."start_date",
    "reporter" = EXCLUDED."reporter",
    "assignee" = EXCLUDED."assignee",
    "assignees" = EXCLUDED."assignees",
    "updated_at" = now();

INSERT INTO "task"."tasks" (
    "id", "code", "project_id", "project_name", "title", "description",
    "task_type", "module", "status", "priority", "progress",
    "comments_count", "attachments_count", "due_date", "start_date",
    "reporter", "assignee", "assignees", "subtasks", "links", "attachments",
    "created_at", "updated_at"
) VALUES (
    1009,
    '#0004-9',
    '0004',
    'Evenbooking-System',
    'Add organizer name in event',
    'Display organizer brand, profile avatar, and verified badge on event detail screen.',
    'feature',
    'Events',
    'new',
    'medium',
    0,
    3,
    1,
    '2026-09-25T00:00:00.000Z'::timestamptz,
    '2026-08-25T10:00:00.000Z'::timestamptz,
    '{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null}'::jsonb,
    '{"id":103,"name":"THA WINNER","role":"Developer","phone":"067776682","email":"thawinner@example.com","avatar":null}'::jsonb,
    '[{"id":103,"name":"THA WINNER","role":"Developer","phone":"067776682","email":"thawinner@example.com","avatar":null}]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '2026-08-25T10:00:00.000Z'::timestamptz,
    '2026-09-18T12:00:00.000Z'::timestamptz
)
ON CONFLICT ("id") DO UPDATE SET
    "code" = EXCLUDED."code",
    "project_id" = EXCLUDED."project_id",
    "project_name" = EXCLUDED."project_name",
    "title" = EXCLUDED."title",
    "description" = EXCLUDED."description",
    "task_type" = EXCLUDED."task_type",
    "module" = EXCLUDED."module",
    "status" = EXCLUDED."status",
    "priority" = EXCLUDED."priority",
    "progress" = EXCLUDED."progress",
    "comments_count" = EXCLUDED."comments_count",
    "attachments_count" = EXCLUDED."attachments_count",
    "due_date" = EXCLUDED."due_date",
    "start_date" = EXCLUDED."start_date",
    "reporter" = EXCLUDED."reporter",
    "assignee" = EXCLUDED."assignee",
    "assignees" = EXCLUDED."assignees",
    "updated_at" = now();

INSERT INTO "task"."tasks" (
    "id", "code", "project_id", "project_name", "title", "description",
    "task_type", "module", "status", "priority", "progress",
    "comments_count", "attachments_count", "due_date", "start_date",
    "reporter", "assignee", "assignees", "subtasks", "links", "attachments",
    "created_at", "updated_at"
) VALUES (
    1010,
    '#0004-10',
    '0004',
    'Evenbooking-System',
    'Make it can upload profile',
    'Enable profile image cropping, drag and drop upload, and cloud image optimization.',
    'feature',
    'User Profile',
    'new',
    'medium',
    0,
    2,
    1,
    '2026-09-25T00:00:00.000Z'::timestamptz,
    '2026-08-25T10:15:00.000Z'::timestamptz,
    '{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null}'::jsonb,
    '{"id":103,"name":"THA WINNER","role":"Developer","phone":"067776682","email":"thawinner@example.com","avatar":null}'::jsonb,
    '[{"id":103,"name":"THA WINNER","role":"Developer","phone":"067776682","email":"thawinner@example.com","avatar":null}]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '2026-08-25T10:15:00.000Z'::timestamptz,
    '2026-09-18T12:00:00.000Z'::timestamptz
)
ON CONFLICT ("id") DO UPDATE SET
    "code" = EXCLUDED."code",
    "project_id" = EXCLUDED."project_id",
    "project_name" = EXCLUDED."project_name",
    "title" = EXCLUDED."title",
    "description" = EXCLUDED."description",
    "task_type" = EXCLUDED."task_type",
    "module" = EXCLUDED."module",
    "status" = EXCLUDED."status",
    "priority" = EXCLUDED."priority",
    "progress" = EXCLUDED."progress",
    "comments_count" = EXCLUDED."comments_count",
    "attachments_count" = EXCLUDED."attachments_count",
    "due_date" = EXCLUDED."due_date",
    "start_date" = EXCLUDED."start_date",
    "reporter" = EXCLUDED."reporter",
    "assignee" = EXCLUDED."assignee",
    "assignees" = EXCLUDED."assignees",
    "updated_at" = now();

INSERT INTO "task"."tasks" (
    "id", "code", "project_id", "project_name", "title", "description",
    "task_type", "module", "status", "priority", "progress",
    "comments_count", "attachments_count", "due_date", "start_date",
    "reporter", "assignee", "assignees", "subtasks", "links", "attachments",
    "created_at", "updated_at"
) VALUES (
    2001,
    '#0002-1',
    '0002',
    'BMS Digitech',
    'Project | Folder | Drag & Drop',
    'Implement intuitive drag and drop folder organization for project documents.',
    'feature',
    'Project | Folder',
    'done',
    'high',
    100,
    4,
    2,
    '2026-10-15T00:00:00.000Z'::timestamptz,
    '2026-08-24T09:00:00.000Z'::timestamptz,
    '{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null}'::jsonb,
    '{"id":102,"name":"PUM BRUSMUNY","role":"Developer","phone":"087280875","email":"pumprusmuny@example.com","avatar":null}'::jsonb,
    '[{"id":102,"name":"PUM BRUSMUNY","role":"Developer","phone":"087280875","email":"pumprusmuny@example.com","avatar":null}]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '2026-08-24T09:00:00.000Z'::timestamptz,
    '2026-09-18T12:00:00.000Z'::timestamptz
)
ON CONFLICT ("id") DO UPDATE SET
    "code" = EXCLUDED."code",
    "project_id" = EXCLUDED."project_id",
    "project_name" = EXCLUDED."project_name",
    "title" = EXCLUDED."title",
    "description" = EXCLUDED."description",
    "task_type" = EXCLUDED."task_type",
    "module" = EXCLUDED."module",
    "status" = EXCLUDED."status",
    "priority" = EXCLUDED."priority",
    "progress" = EXCLUDED."progress",
    "comments_count" = EXCLUDED."comments_count",
    "attachments_count" = EXCLUDED."attachments_count",
    "due_date" = EXCLUDED."due_date",
    "start_date" = EXCLUDED."start_date",
    "reporter" = EXCLUDED."reporter",
    "assignee" = EXCLUDED."assignee",
    "assignees" = EXCLUDED."assignees",
    "updated_at" = now();

INSERT INTO "task"."tasks" (
    "id", "code", "project_id", "project_name", "title", "description",
    "task_type", "module", "status", "priority", "progress",
    "comments_count", "attachments_count", "due_date", "start_date",
    "reporter", "assignee", "assignees", "subtasks", "links", "attachments",
    "created_at", "updated_at"
) VALUES (
    2002,
    '#0002-2',
    '0002',
    'BMS Digitech',
    'My Work | Profile | Missing Cover',
    'Fix image cover banner rendering on responsive mobile screens.',
    'bug',
    'My Work | Profile',
    'confirmed',
    'high',
    90,
    2,
    1,
    '2026-10-18T00:00:00.000Z'::timestamptz,
    '2026-08-24T09:30:00.000Z'::timestamptz,
    '{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null}'::jsonb,
    '{"id":102,"name":"PUM BRUSMUNY","role":"Developer","phone":"087280875","email":"pumprusmuny@example.com","avatar":null}'::jsonb,
    '[{"id":102,"name":"PUM BRUSMUNY","role":"Developer","phone":"087280875","email":"pumprusmuny@example.com","avatar":null}]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '2026-08-24T09:30:00.000Z'::timestamptz,
    '2026-09-18T12:00:00.000Z'::timestamptz
)
ON CONFLICT ("id") DO UPDATE SET
    "code" = EXCLUDED."code",
    "project_id" = EXCLUDED."project_id",
    "project_name" = EXCLUDED."project_name",
    "title" = EXCLUDED."title",
    "description" = EXCLUDED."description",
    "task_type" = EXCLUDED."task_type",
    "module" = EXCLUDED."module",
    "status" = EXCLUDED."status",
    "priority" = EXCLUDED."priority",
    "progress" = EXCLUDED."progress",
    "comments_count" = EXCLUDED."comments_count",
    "attachments_count" = EXCLUDED."attachments_count",
    "due_date" = EXCLUDED."due_date",
    "start_date" = EXCLUDED."start_date",
    "reporter" = EXCLUDED."reporter",
    "assignee" = EXCLUDED."assignee",
    "assignees" = EXCLUDED."assignees",
    "updated_at" = now();

INSERT INTO "task"."tasks" (
    "id", "code", "project_id", "project_name", "title", "description",
    "task_type", "module", "status", "priority", "progress",
    "comments_count", "attachments_count", "due_date", "start_date",
    "reporter", "assignee", "assignees", "subtasks", "links", "attachments",
    "created_at", "updated_at"
) VALUES (
    2003,
    '#0002-3',
    '0002',
    'BMS Digitech',
    'User | Report | Progress Compare',
    'Generate visual analytics comparing team velocity across sprints.',
    'feature',
    'User | Report',
    'in_review',
    'medium',
    85,
    3,
    0,
    '2026-10-20T00:00:00.000Z'::timestamptz,
    '2026-08-24T10:00:00.000Z'::timestamptz,
    '{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null}'::jsonb,
    '{"id":102,"name":"PUM BRUSMUNY","role":"Developer","phone":"087280875","email":"pumprusmuny@example.com","avatar":null}'::jsonb,
    '[{"id":102,"name":"PUM BRUSMUNY","role":"Developer","phone":"087280875","email":"pumprusmuny@example.com","avatar":null}]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '2026-08-24T10:00:00.000Z'::timestamptz,
    '2026-09-18T12:00:00.000Z'::timestamptz
)
ON CONFLICT ("id") DO UPDATE SET
    "code" = EXCLUDED."code",
    "project_id" = EXCLUDED."project_id",
    "project_name" = EXCLUDED."project_name",
    "title" = EXCLUDED."title",
    "description" = EXCLUDED."description",
    "task_type" = EXCLUDED."task_type",
    "module" = EXCLUDED."module",
    "status" = EXCLUDED."status",
    "priority" = EXCLUDED."priority",
    "progress" = EXCLUDED."progress",
    "comments_count" = EXCLUDED."comments_count",
    "attachments_count" = EXCLUDED."attachments_count",
    "due_date" = EXCLUDED."due_date",
    "start_date" = EXCLUDED."start_date",
    "reporter" = EXCLUDED."reporter",
    "assignee" = EXCLUDED."assignee",
    "assignees" = EXCLUDED."assignees",
    "updated_at" = now();

INSERT INTO "task"."tasks" (
    "id", "code", "project_id", "project_name", "title", "description",
    "task_type", "module", "status", "priority", "progress",
    "comments_count", "attachments_count", "due_date", "start_date",
    "reporter", "assignee", "assignees", "subtasks", "links", "attachments",
    "created_at", "updated_at"
) VALUES (
    2004,
    '#0002-4',
    '0002',
    'BMS Digitech',
    'Profile | Switch Org | Exit Org',
    'Ensure smooth transition and state purge when switching organization context.',
    'feature',
    'Profile',
    'done',
    'low',
    100,
    2,
    0,
    '2026-09-12T00:00:00.000Z'::timestamptz,
    '2026-08-24T10:30:00.000Z'::timestamptz,
    '{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null}'::jsonb,
    '{"id":102,"name":"PUM BRUSMUNY","role":"Developer","phone":"087280875","email":"pumprusmuny@example.com","avatar":null}'::jsonb,
    '[{"id":102,"name":"PUM BRUSMUNY","role":"Developer","phone":"087280875","email":"pumprusmuny@example.com","avatar":null}]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '2026-08-24T10:30:00.000Z'::timestamptz,
    '2026-09-18T12:00:00.000Z'::timestamptz
)
ON CONFLICT ("id") DO UPDATE SET
    "code" = EXCLUDED."code",
    "project_id" = EXCLUDED."project_id",
    "project_name" = EXCLUDED."project_name",
    "title" = EXCLUDED."title",
    "description" = EXCLUDED."description",
    "task_type" = EXCLUDED."task_type",
    "module" = EXCLUDED."module",
    "status" = EXCLUDED."status",
    "priority" = EXCLUDED."priority",
    "progress" = EXCLUDED."progress",
    "comments_count" = EXCLUDED."comments_count",
    "attachments_count" = EXCLUDED."attachments_count",
    "due_date" = EXCLUDED."due_date",
    "start_date" = EXCLUDED."start_date",
    "reporter" = EXCLUDED."reporter",
    "assignee" = EXCLUDED."assignee",
    "assignees" = EXCLUDED."assignees",
    "updated_at" = now();

INSERT INTO "task"."tasks" (
    "id", "code", "project_id", "project_name", "title", "description",
    "task_type", "module", "status", "priority", "progress",
    "comments_count", "attachments_count", "due_date", "start_date",
    "reporter", "assignee", "assignees", "subtasks", "links", "attachments",
    "created_at", "updated_at"
) VALUES (
    2005,
    '#0002-14',
    '0002',
    'BMS Digitech',
    'Api | Payment | Home Page + CRUD',
    'Build payment gateway callback webhooks and transaction ledger.',
    'feature',
    'Api | Payment',
    'in_progress',
    'medium',
    50,
    7,
    1,
    '2026-09-18T00:00:00.000Z'::timestamptz,
    '2026-09-01T08:00:00.000Z'::timestamptz,
    '{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null}'::jsonb,
    '{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null}'::jsonb,
    '[{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null}]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '2026-09-01T08:00:00.000Z'::timestamptz,
    '2026-09-18T12:00:00.000Z'::timestamptz
)
ON CONFLICT ("id") DO UPDATE SET
    "code" = EXCLUDED."code",
    "project_id" = EXCLUDED."project_id",
    "project_name" = EXCLUDED."project_name",
    "title" = EXCLUDED."title",
    "description" = EXCLUDED."description",
    "task_type" = EXCLUDED."task_type",
    "module" = EXCLUDED."module",
    "status" = EXCLUDED."status",
    "priority" = EXCLUDED."priority",
    "progress" = EXCLUDED."progress",
    "comments_count" = EXCLUDED."comments_count",
    "attachments_count" = EXCLUDED."attachments_count",
    "due_date" = EXCLUDED."due_date",
    "start_date" = EXCLUDED."start_date",
    "reporter" = EXCLUDED."reporter",
    "assignee" = EXCLUDED."assignee",
    "assignees" = EXCLUDED."assignees",
    "updated_at" = now();

INSERT INTO "task"."tasks" (
    "id", "code", "project_id", "project_name", "title", "description",
    "task_type", "module", "status", "priority", "progress",
    "comments_count", "attachments_count", "due_date", "start_date",
    "reporter", "assignee", "assignees", "subtasks", "links", "attachments",
    "created_at", "updated_at"
) VALUES (
    2006,
    '#0002-24',
    '0002',
    'BMS Digitech',
    'Web | Report | Purchases Page',
    'Purchases data export to Excel and PDF formats for finance audit.',
    'feature',
    'Web | Report',
    'new',
    'medium',
    10,
    2,
    1,
    '2026-09-18T00:00:00.000Z'::timestamptz,
    '2026-09-01T08:30:00.000Z'::timestamptz,
    '{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null}'::jsonb,
    '{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null}'::jsonb,
    '[{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null}]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '2026-09-01T08:30:00.000Z'::timestamptz,
    '2026-09-18T12:00:00.000Z'::timestamptz
)
ON CONFLICT ("id") DO UPDATE SET
    "code" = EXCLUDED."code",
    "project_id" = EXCLUDED."project_id",
    "project_name" = EXCLUDED."project_name",
    "title" = EXCLUDED."title",
    "description" = EXCLUDED."description",
    "task_type" = EXCLUDED."task_type",
    "module" = EXCLUDED."module",
    "status" = EXCLUDED."status",
    "priority" = EXCLUDED."priority",
    "progress" = EXCLUDED."progress",
    "comments_count" = EXCLUDED."comments_count",
    "attachments_count" = EXCLUDED."attachments_count",
    "due_date" = EXCLUDED."due_date",
    "start_date" = EXCLUDED."start_date",
    "reporter" = EXCLUDED."reporter",
    "assignee" = EXCLUDED."assignee",
    "assignees" = EXCLUDED."assignees",
    "updated_at" = now();

INSERT INTO "task"."tasks" (
    "id", "code", "project_id", "project_name", "title", "description",
    "task_type", "module", "status", "priority", "progress",
    "comments_count", "attachments_count", "due_date", "start_date",
    "reporter", "assignee", "assignees", "subtasks", "links", "attachments",
    "created_at", "updated_at"
) VALUES (
    101,
    '#0001-1',
    '0001',
    'WMS Digitech',
    'Org Admin | Structure | Department',
    'Manage departmental structures, permissions, and organizational units in core hierarchy.',
    'feature',
    'Org Admin | Structure',
    'in_review',
    'high',
    85,
    1,
    2,
    '2026-10-15T00:00:00.000Z'::timestamptz,
    '2026-08-09T08:00:00.000Z'::timestamptz,
    '{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null}'::jsonb,
    '{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null}'::jsonb,
    '[{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null}]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '2026-08-09T08:00:00.000Z'::timestamptz,
    '2026-09-18T12:00:00.000Z'::timestamptz
)
ON CONFLICT ("id") DO UPDATE SET
    "code" = EXCLUDED."code",
    "project_id" = EXCLUDED."project_id",
    "project_name" = EXCLUDED."project_name",
    "title" = EXCLUDED."title",
    "description" = EXCLUDED."description",
    "task_type" = EXCLUDED."task_type",
    "module" = EXCLUDED."module",
    "status" = EXCLUDED."status",
    "priority" = EXCLUDED."priority",
    "progress" = EXCLUDED."progress",
    "comments_count" = EXCLUDED."comments_count",
    "attachments_count" = EXCLUDED."attachments_count",
    "due_date" = EXCLUDED."due_date",
    "start_date" = EXCLUDED."start_date",
    "reporter" = EXCLUDED."reporter",
    "assignee" = EXCLUDED."assignee",
    "assignees" = EXCLUDED."assignees",
    "updated_at" = now();

INSERT INTO "task"."tasks" (
    "id", "code", "project_id", "project_name", "title", "description",
    "task_type", "module", "status", "priority", "progress",
    "comments_count", "attachments_count", "due_date", "start_date",
    "reporter", "assignee", "assignees", "subtasks", "links", "attachments",
    "created_at", "updated_at"
) VALUES (
    102,
    '#0001-2',
    '0001',
    'WMS Digitech',
    'Project | Folder | Cannot Scroll PDF',
    'Resolve touch and trackpad event bubbling preventing embedded PDF scrolling.',
    'bug',
    'Project | Folder',
    'new',
    'urgent',
    0,
    3,
    1,
    '2026-10-18T00:00:00.000Z'::timestamptz,
    '2026-08-09T08:30:00.000Z'::timestamptz,
    '{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null}'::jsonb,
    '{"id":102,"name":"PUM BRUSMUNY","role":"Developer","phone":"087280875","email":"pumprusmuny@example.com","avatar":null}'::jsonb,
    '[{"id":102,"name":"PUM BRUSMUNY","role":"Developer","phone":"087280875","email":"pumprusmuny@example.com","avatar":null}]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '2026-08-09T08:30:00.000Z'::timestamptz,
    '2026-09-18T12:00:00.000Z'::timestamptz
)
ON CONFLICT ("id") DO UPDATE SET
    "code" = EXCLUDED."code",
    "project_id" = EXCLUDED."project_id",
    "project_name" = EXCLUDED."project_name",
    "title" = EXCLUDED."title",
    "description" = EXCLUDED."description",
    "task_type" = EXCLUDED."task_type",
    "module" = EXCLUDED."module",
    "status" = EXCLUDED."status",
    "priority" = EXCLUDED."priority",
    "progress" = EXCLUDED."progress",
    "comments_count" = EXCLUDED."comments_count",
    "attachments_count" = EXCLUDED."attachments_count",
    "due_date" = EXCLUDED."due_date",
    "start_date" = EXCLUDED."start_date",
    "reporter" = EXCLUDED."reporter",
    "assignee" = EXCLUDED."assignee",
    "assignees" = EXCLUDED."assignees",
    "updated_at" = now();

INSERT INTO "task"."tasks" (
    "id", "code", "project_id", "project_name", "title", "description",
    "task_type", "module", "status", "priority", "progress",
    "comments_count", "attachments_count", "due_date", "start_date",
    "reporter", "assignee", "assignees", "subtasks", "links", "attachments",
    "created_at", "updated_at"
) VALUES (
    103,
    '#0001-3',
    '0001',
    'WMS Digitech',
    'Security setting UI improvements',
    'Enhance 2FA configuration flow and passkey biometric enrollment prompts.',
    'improvement',
    'Security Settings',
    'confirmed',
    'medium',
    75,
    2,
    0,
    '2026-10-22T00:00:00.000Z'::timestamptz,
    '2026-08-09T09:00:00.000Z'::timestamptz,
    '{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null}'::jsonb,
    '{"id":102,"name":"PUM BRUSMUNY","role":"Developer","phone":"087280875","email":"pumprusmuny@example.com","avatar":null}'::jsonb,
    '[{"id":102,"name":"PUM BRUSMUNY","role":"Developer","phone":"087280875","email":"pumprusmuny@example.com","avatar":null}]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '2026-08-09T09:00:00.000Z'::timestamptz,
    '2026-09-18T12:00:00.000Z'::timestamptz
)
ON CONFLICT ("id") DO UPDATE SET
    "code" = EXCLUDED."code",
    "project_id" = EXCLUDED."project_id",
    "project_name" = EXCLUDED."project_name",
    "title" = EXCLUDED."title",
    "description" = EXCLUDED."description",
    "task_type" = EXCLUDED."task_type",
    "module" = EXCLUDED."module",
    "status" = EXCLUDED."status",
    "priority" = EXCLUDED."priority",
    "progress" = EXCLUDED."progress",
    "comments_count" = EXCLUDED."comments_count",
    "attachments_count" = EXCLUDED."attachments_count",
    "due_date" = EXCLUDED."due_date",
    "start_date" = EXCLUDED."start_date",
    "reporter" = EXCLUDED."reporter",
    "assignee" = EXCLUDED."assignee",
    "assignees" = EXCLUDED."assignees",
    "updated_at" = now();

INSERT INTO "task"."tasks" (
    "id", "code", "project_id", "project_name", "title", "description",
    "task_type", "module", "status", "priority", "progress",
    "comments_count", "attachments_count", "due_date", "start_date",
    "reporter", "assignee", "assignees", "subtasks", "links", "attachments",
    "created_at", "updated_at"
) VALUES (
    104,
    '#0001-4',
    '0001',
    'WMS Digitech',
    'User | Report | Progress',
    'Export daily attendance timesheets and check-in geolocation heatmaps.',
    'feature',
    'User | Report',
    'done',
    'medium',
    100,
    2,
    0,
    '2026-09-10T00:00:00.000Z'::timestamptz,
    '2026-08-09T09:30:00.000Z'::timestamptz,
    '{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null}'::jsonb,
    '{"id":102,"name":"PUM BRUSMUNY","role":"Developer","phone":"087280875","email":"pumprusmuny@example.com","avatar":null}'::jsonb,
    '[{"id":102,"name":"PUM BRUSMUNY","role":"Developer","phone":"087280875","email":"pumprusmuny@example.com","avatar":null}]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '2026-08-09T09:30:00.000Z'::timestamptz,
    '2026-09-18T12:00:00.000Z'::timestamptz
)
ON CONFLICT ("id") DO UPDATE SET
    "code" = EXCLUDED."code",
    "project_id" = EXCLUDED."project_id",
    "project_name" = EXCLUDED."project_name",
    "title" = EXCLUDED."title",
    "description" = EXCLUDED."description",
    "task_type" = EXCLUDED."task_type",
    "module" = EXCLUDED."module",
    "status" = EXCLUDED."status",
    "priority" = EXCLUDED."priority",
    "progress" = EXCLUDED."progress",
    "comments_count" = EXCLUDED."comments_count",
    "attachments_count" = EXCLUDED."attachments_count",
    "due_date" = EXCLUDED."due_date",
    "start_date" = EXCLUDED."start_date",
    "reporter" = EXCLUDED."reporter",
    "assignee" = EXCLUDED."assignee",
    "assignees" = EXCLUDED."assignees",
    "updated_at" = now();

INSERT INTO "task"."tasks" (
    "id", "code", "project_id", "project_name", "title", "description",
    "task_type", "module", "status", "priority", "progress",
    "comments_count", "attachments_count", "due_date", "start_date",
    "reporter", "assignee", "assignees", "subtasks", "links", "attachments",
    "created_at", "updated_at"
) VALUES (
    3001,
    '#0005-1',
    '0005',
    'TESTER',
    'Testing project setup and verification',
    'End to end smoke testing for newly deployed microservices.',
    'feature',
    'Testing',
    'new',
    'medium',
    0,
    1,
    0,
    '2026-11-16T00:00:00.000Z'::timestamptz,
    '2026-09-17T08:00:00.000Z'::timestamptz,
    '{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null}'::jsonb,
    '{"id":103,"name":"THA WINNER","role":"Developer","phone":"067776682","email":"thawinner@example.com","avatar":null}'::jsonb,
    '[{"id":103,"name":"THA WINNER","role":"Developer","phone":"067776682","email":"thawinner@example.com","avatar":null}]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '2026-09-17T08:00:00.000Z'::timestamptz,
    '2026-09-18T12:00:00.000Z'::timestamptz
)
ON CONFLICT ("id") DO UPDATE SET
    "code" = EXCLUDED."code",
    "project_id" = EXCLUDED."project_id",
    "project_name" = EXCLUDED."project_name",
    "title" = EXCLUDED."title",
    "description" = EXCLUDED."description",
    "task_type" = EXCLUDED."task_type",
    "module" = EXCLUDED."module",
    "status" = EXCLUDED."status",
    "priority" = EXCLUDED."priority",
    "progress" = EXCLUDED."progress",
    "comments_count" = EXCLUDED."comments_count",
    "attachments_count" = EXCLUDED."attachments_count",
    "due_date" = EXCLUDED."due_date",
    "start_date" = EXCLUDED."start_date",
    "reporter" = EXCLUDED."reporter",
    "assignee" = EXCLUDED."assignee",
    "assignees" = EXCLUDED."assignees",
    "updated_at" = now();

-- =============================================================================
-- 6. SEED TASK COMMENTS & CHAT HISTORY
-- =============================================================================

INSERT INTO "task"."task_comments" (
    "id", "task_id", "sender_id", "sender_name", "sender_avatar", "text",
    "time", "is_self", "is_system", "attachments", "seen_by", "created_at", "updated_at"
) VALUES (
    10001,
    1001,
    0,
    'ប្រព័ន្ធ (System)',
    NULL,
    'ភារកិច្ច #0004-1 ត្រូវបានបង្កើតឡើង',
    '08:00 AM',
    false,
    true,
    '[]'::jsonb,
    '[]'::jsonb,
    '2026-08-25T08:00:00.000Z'::timestamptz,
    now()
)
ON CONFLICT ("id") DO UPDATE SET
    "text" = EXCLUDED."text",
    "time" = EXCLUDED."time",
    "updated_at" = now();

INSERT INTO "task"."task_comments" (
    "id", "task_id", "sender_id", "sender_name", "sender_avatar", "text",
    "time", "is_self", "is_system", "attachments", "seen_by", "created_at", "updated_at"
) VALUES (
    10002,
    1001,
    101,
    'PISETH PANHAVORN',
    NULL,
    'សួស្តី @THA WINNER! សូមជួយរៀបចំទំព័រ About Us និង Contact Us តាមលក្ខខណ្ឌការងារ។',
    '08:15 AM',
    false,
    false,
    '[]'::jsonb,
    '[]'::jsonb,
    '2026-08-25T08:15:00.000Z'::timestamptz,
    now()
)
ON CONFLICT ("id") DO UPDATE SET
    "text" = EXCLUDED."text",
    "time" = EXCLUDED."time",
    "updated_at" = now();

INSERT INTO "task"."task_comments" (
    "id", "task_id", "sender_id", "sender_name", "sender_avatar", "text",
    "time", "is_self", "is_system", "attachments", "seen_by", "created_at", "updated_at"
) VALUES (
    10003,
    1002,
    0,
    'ប្រព័ន្ធ (System)',
    NULL,
    'ភារកិច្ច #0004-2 ត្រូវបានបង្កើតឡើង',
    '08:15 AM',
    false,
    true,
    '[]'::jsonb,
    '[]'::jsonb,
    '2026-08-25T08:15:00.000Z'::timestamptz,
    now()
)
ON CONFLICT ("id") DO UPDATE SET
    "text" = EXCLUDED."text",
    "time" = EXCLUDED."time",
    "updated_at" = now();

INSERT INTO "task"."task_comments" (
    "id", "task_id", "sender_id", "sender_name", "sender_avatar", "text",
    "time", "is_self", "is_system", "attachments", "seen_by", "created_at", "updated_at"
) VALUES (
    10004,
    1003,
    0,
    'ប្រព័ន្ធ (System)',
    NULL,
    'ភារកិច្ច #0004-3 ត្រូវបានបង្កើតឡើង',
    '08:30 AM',
    false,
    true,
    '[]'::jsonb,
    '[]'::jsonb,
    '2026-08-25T08:30:00.000Z'::timestamptz,
    now()
)
ON CONFLICT ("id") DO UPDATE SET
    "text" = EXCLUDED."text",
    "time" = EXCLUDED."time",
    "updated_at" = now();

INSERT INTO "task"."task_comments" (
    "id", "task_id", "sender_id", "sender_name", "sender_avatar", "text",
    "time", "is_self", "is_system", "attachments", "seen_by", "created_at", "updated_at"
) VALUES (
    10005,
    1004,
    0,
    'ប្រព័ន្ធ (System)',
    NULL,
    'ភារកិច្ច #0004-4 ត្រូវបានបង្កើតឡើង',
    '08:45 AM',
    false,
    true,
    '[]'::jsonb,
    '[]'::jsonb,
    '2026-08-25T08:45:00.000Z'::timestamptz,
    now()
)
ON CONFLICT ("id") DO UPDATE SET
    "text" = EXCLUDED."text",
    "time" = EXCLUDED."time",
    "updated_at" = now();

INSERT INTO "task"."task_comments" (
    "id", "task_id", "sender_id", "sender_name", "sender_avatar", "text",
    "time", "is_self", "is_system", "attachments", "seen_by", "created_at", "updated_at"
) VALUES (
    10006,
    1005,
    0,
    'ប្រព័ន្ធ (System)',
    NULL,
    'ភារកិច្ច #0004-5 ត្រូវបានបង្កើតឡើង',
    '09:00 AM',
    false,
    true,
    '[]'::jsonb,
    '[]'::jsonb,
    '2026-08-25T09:00:00.000Z'::timestamptz,
    now()
)
ON CONFLICT ("id") DO UPDATE SET
    "text" = EXCLUDED."text",
    "time" = EXCLUDED."time",
    "updated_at" = now();

INSERT INTO "task"."task_comments" (
    "id", "task_id", "sender_id", "sender_name", "sender_avatar", "text",
    "time", "is_self", "is_system", "attachments", "seen_by", "created_at", "updated_at"
) VALUES (
    10007,
    1006,
    0,
    'ប្រព័ន្ធ (System)',
    NULL,
    'ភារកិច្ច #0004-6 ត្រូវបានបង្កើតឡើង',
    '09:15 AM',
    false,
    true,
    '[]'::jsonb,
    '[]'::jsonb,
    '2026-08-25T09:15:00.000Z'::timestamptz,
    now()
)
ON CONFLICT ("id") DO UPDATE SET
    "text" = EXCLUDED."text",
    "time" = EXCLUDED."time",
    "updated_at" = now();

INSERT INTO "task"."task_comments" (
    "id", "task_id", "sender_id", "sender_name", "sender_avatar", "text",
    "time", "is_self", "is_system", "attachments", "seen_by", "created_at", "updated_at"
) VALUES (
    10008,
    1007,
    0,
    'ប្រព័ន្ធ (System)',
    NULL,
    'ភារកិច្ច #0004-7 ត្រូវបានបង្កើតឡើង',
    '09:30 AM',
    false,
    true,
    '[]'::jsonb,
    '[]'::jsonb,
    '2026-08-25T09:30:00.000Z'::timestamptz,
    now()
)
ON CONFLICT ("id") DO UPDATE SET
    "text" = EXCLUDED."text",
    "time" = EXCLUDED."time",
    "updated_at" = now();

INSERT INTO "task"."task_comments" (
    "id", "task_id", "sender_id", "sender_name", "sender_avatar", "text",
    "time", "is_self", "is_system", "attachments", "seen_by", "created_at", "updated_at"
) VALUES (
    10009,
    1008,
    0,
    'ប្រព័ន្ធ (System)',
    NULL,
    'ភារកិច្ច #0004-8 ត្រូវបានបង្កើតឡើង',
    '09:45 AM',
    false,
    true,
    '[]'::jsonb,
    '[]'::jsonb,
    '2026-08-25T09:45:00.000Z'::timestamptz,
    now()
)
ON CONFLICT ("id") DO UPDATE SET
    "text" = EXCLUDED."text",
    "time" = EXCLUDED."time",
    "updated_at" = now();

INSERT INTO "task"."task_comments" (
    "id", "task_id", "sender_id", "sender_name", "sender_avatar", "text",
    "time", "is_self", "is_system", "attachments", "seen_by", "created_at", "updated_at"
) VALUES (
    10010,
    1009,
    0,
    'ប្រព័ន្ធ (System)',
    NULL,
    'ភារកិច្ច #0004-9 ត្រូវបានបង្កើតឡើង',
    '10:00 AM',
    false,
    true,
    '[]'::jsonb,
    '[]'::jsonb,
    '2026-08-25T10:00:00.000Z'::timestamptz,
    now()
)
ON CONFLICT ("id") DO UPDATE SET
    "text" = EXCLUDED."text",
    "time" = EXCLUDED."time",
    "updated_at" = now();

INSERT INTO "task"."task_comments" (
    "id", "task_id", "sender_id", "sender_name", "sender_avatar", "text",
    "time", "is_self", "is_system", "attachments", "seen_by", "created_at", "updated_at"
) VALUES (
    10011,
    1010,
    0,
    'ប្រព័ន្ធ (System)',
    NULL,
    'ភារកិច្ច #0004-10 ត្រូវបានបង្កើតឡើង',
    '10:15 AM',
    false,
    true,
    '[]'::jsonb,
    '[]'::jsonb,
    '2026-08-25T10:15:00.000Z'::timestamptz,
    now()
)
ON CONFLICT ("id") DO UPDATE SET
    "text" = EXCLUDED."text",
    "time" = EXCLUDED."time",
    "updated_at" = now();

INSERT INTO "task"."task_comments" (
    "id", "task_id", "sender_id", "sender_name", "sender_avatar", "text",
    "time", "is_self", "is_system", "attachments", "seen_by", "created_at", "updated_at"
) VALUES (
    20001,
    2001,
    0,
    'ប្រព័ន្ធ (System)',
    NULL,
    'ភារកិច្ច #0002-1 ត្រូវបានបង្កើតឡើង',
    '09:00 AM',
    false,
    true,
    '[]'::jsonb,
    '[]'::jsonb,
    '2026-08-24T09:00:00.000Z'::timestamptz,
    now()
)
ON CONFLICT ("id") DO UPDATE SET
    "text" = EXCLUDED."text",
    "time" = EXCLUDED."time",
    "updated_at" = now();

INSERT INTO "task"."task_comments" (
    "id", "task_id", "sender_id", "sender_name", "sender_avatar", "text",
    "time", "is_self", "is_system", "attachments", "seen_by", "created_at", "updated_at"
) VALUES (
    20002,
    2001,
    101,
    'PISETH PANHAVORN',
    NULL,
    'សួស្តី @PUM BRUSMUNY! សូមពិនិត្យមើល drag & drop folder ក្នុង BMS។',
    '09:15 AM',
    false,
    false,
    '[]'::jsonb,
    '[]'::jsonb,
    '2026-08-24T09:15:00.000Z'::timestamptz,
    now()
)
ON CONFLICT ("id") DO UPDATE SET
    "text" = EXCLUDED."text",
    "time" = EXCLUDED."time",
    "updated_at" = now();

INSERT INTO "task"."task_comments" (
    "id", "task_id", "sender_id", "sender_name", "sender_avatar", "text",
    "time", "is_self", "is_system", "attachments", "seen_by", "created_at", "updated_at"
) VALUES (
    20003,
    2005,
    0,
    'ប្រព័ន្ធ (System)',
    NULL,
    'ភារកិច្ច #0002-14 ត្រូវបានបង្កើតឡើង',
    '08:00 AM',
    false,
    true,
    '[]'::jsonb,
    '[]'::jsonb,
    '2026-09-01T08:00:00.000Z'::timestamptz,
    now()
)
ON CONFLICT ("id") DO UPDATE SET
    "text" = EXCLUDED."text",
    "time" = EXCLUDED."time",
    "updated_at" = now();

INSERT INTO "task"."task_comments" (
    "id", "task_id", "sender_id", "sender_name", "sender_avatar", "text",
    "time", "is_self", "is_system", "attachments", "seen_by", "created_at", "updated_at"
) VALUES (
    20004,
    2006,
    0,
    'ប្រព័ន្ធ (System)',
    NULL,
    'ភារកិច្ច #0002-24 ត្រូវបានបង្កើតឡើង',
    '08:30 AM',
    false,
    true,
    '[]'::jsonb,
    '[]'::jsonb,
    '2026-09-01T08:30:00.000Z'::timestamptz,
    now()
)
ON CONFLICT ("id") DO UPDATE SET
    "text" = EXCLUDED."text",
    "time" = EXCLUDED."time",
    "updated_at" = now();

INSERT INTO "task"."task_comments" (
    "id", "task_id", "sender_id", "sender_name", "sender_avatar", "text",
    "time", "is_self", "is_system", "attachments", "seen_by", "created_at", "updated_at"
) VALUES (
    30001,
    101,
    0,
    'ប្រព័ន្ធ (System)',
    NULL,
    'ភារកិច្ច #0001-1 ត្រូវបានបង្កើតឡើង',
    '08:00 AM',
    false,
    true,
    '[]'::jsonb,
    '[]'::jsonb,
    '2026-08-09T08:00:00.000Z'::timestamptz,
    now()
)
ON CONFLICT ("id") DO UPDATE SET
    "text" = EXCLUDED."text",
    "time" = EXCLUDED."time",
    "updated_at" = now();

INSERT INTO "task"."task_comments" (
    "id", "task_id", "sender_id", "sender_name", "sender_avatar", "text",
    "time", "is_self", "is_system", "attachments", "seen_by", "created_at", "updated_at"
) VALUES (
    30002,
    102,
    0,
    'ប្រព័ន្ធ (System)',
    NULL,
    'ភារកិច្ច #0001-2 ត្រូវបានបង្កើតឡើង',
    '08:30 AM',
    false,
    true,
    '[]'::jsonb,
    '[]'::jsonb,
    '2026-08-09T08:30:00.000Z'::timestamptz,
    now()
)
ON CONFLICT ("id") DO UPDATE SET
    "text" = EXCLUDED."text",
    "time" = EXCLUDED."time",
    "updated_at" = now();

INSERT INTO "task"."task_comments" (
    "id", "task_id", "sender_id", "sender_name", "sender_avatar", "text",
    "time", "is_self", "is_system", "attachments", "seen_by", "created_at", "updated_at"
) VALUES (
    30003,
    103,
    0,
    'ប្រព័ន្ធ (System)',
    NULL,
    'ភារកិច្ច #0001-3 ត្រូវបានបង្កើតឡើង',
    '09:00 AM',
    false,
    true,
    '[]'::jsonb,
    '[]'::jsonb,
    '2026-08-09T09:00:00.000Z'::timestamptz,
    now()
)
ON CONFLICT ("id") DO UPDATE SET
    "text" = EXCLUDED."text",
    "time" = EXCLUDED."time",
    "updated_at" = now();

INSERT INTO "task"."task_comments" (
    "id", "task_id", "sender_id", "sender_name", "sender_avatar", "text",
    "time", "is_self", "is_system", "attachments", "seen_by", "created_at", "updated_at"
) VALUES (
    30004,
    104,
    0,
    'ប្រព័ន្ធ (System)',
    NULL,
    'ភារកិច្ច #0001-4 ត្រូវបានបង្កើតឡើង',
    '09:30 AM',
    false,
    true,
    '[]'::jsonb,
    '[]'::jsonb,
    '2026-08-09T09:30:00.000Z'::timestamptz,
    now()
)
ON CONFLICT ("id") DO UPDATE SET
    "text" = EXCLUDED."text",
    "time" = EXCLUDED."time",
    "updated_at" = now();

INSERT INTO "task"."task_comments" (
    "id", "task_id", "sender_id", "sender_name", "sender_avatar", "text",
    "time", "is_self", "is_system", "attachments", "seen_by", "created_at", "updated_at"
) VALUES (
    40001,
    3001,
    0,
    'ប្រព័ន្ធ (System)',
    NULL,
    'ភារកិច្ច #0005-1 ត្រូវបានបង្កើតឡើង',
    '08:00 AM',
    false,
    true,
    '[]'::jsonb,
    '[]'::jsonb,
    '2026-09-17T08:00:00.000Z'::timestamptz,
    now()
)
ON CONFLICT ("id") DO UPDATE SET
    "text" = EXCLUDED."text",
    "time" = EXCLUDED."time",
    "updated_at" = now();

-- =============================================================================
-- 7. SEED JSON BACKUP STORES (user.plan_store & user.task_store)
-- =============================================================================

INSERT INTO "user"."plan_store" ("key", "plans", "updated_at")
VALUES (
    'default_plans_store',
    '[{"id":"0001","code":"0001","name":"WMS Digitech","description":"Workforce & Attendance Management System - Digitech Real-time QR & Payroll.","status":"active","priority":"urgent","category":"Workforce","progress":30,"total_tasks":4,"completed_tasks":1,"budget_allocated":15000,"budget_spent":4500,"start_date":"2026-08-09T09:24:17.350Z","end_date":"2026-10-23T09:24:17.350Z","logo":"data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 120 120\" width=\"120\" height=\"120\"><rect width=\"120\" height=\"120\" rx=\"28\" fill=\"%230b1329\"/><rect x=\"1.5\" y=\"1.5\" width=\"117\" height=\"117\" rx=\"27\" fill=\"none\" stroke=\"%231e293b\" stroke-width=\"2\"/><circle cx=\"60\" cy=\"60\" r=\"41\" fill=\"%23ffffff\" stroke=\"%23cbd5e1\" stroke-width=\"1.5\"/><g transform=\"translate(60, 60)\"><path d=\"M 0 -25 L 23 -12 L 0 1 L -23 -12 Z\" fill=\"%23fb923c\" stroke=\"%23ea580c\" stroke-width=\"1.5\" stroke-linejoin=\"round\"/><path d=\"M -23 -12 L 0 1 L 0 26 L -23 13 Z\" fill=\"%230284c7\" stroke=\"%230369a1\" stroke-width=\"1.5\" stroke-linejoin=\"round\"/><path d=\"M 0 1 L 23 -12 L 23 13 L 0 26 Z\" fill=\"%23ea580c\" stroke=\"%23c2410c\" stroke-width=\"1.5\" stroke-linejoin=\"round\"/><path d=\"M 0 1 L 0 26 M 0 1 L -23 -12 M 0 1 L 23 -12\" stroke=\"%23ffffff\" stroke-width=\"2.5\" stroke-linecap=\"round\"/><path d=\"M -11.5 -5.5 L 0 -12 L 11.5 -5.5 L 0 1 Z\" fill=\"none\" stroke=\"%23ffffff\" stroke-width=\"1.5\" stroke-opacity=\"0.7\"/><path d=\"M -11.5 7 L -11.5 -5.5 M 11.5 7 L 11.5 -5.5\" stroke=\"%23ffffff\" stroke-width=\"1.5\" stroke-opacity=\"0.7\"/></g></svg>","image":"data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 120 120\" width=\"120\" height=\"120\"><rect width=\"120\" height=\"120\" rx=\"28\" fill=\"%230b1329\"/><rect x=\"1.5\" y=\"1.5\" width=\"117\" height=\"117\" rx=\"27\" fill=\"none\" stroke=\"%231e293b\" stroke-width=\"2\"/><circle cx=\"60\" cy=\"60\" r=\"41\" fill=\"%23ffffff\" stroke=\"%23cbd5e1\" stroke-width=\"1.5\"/><g transform=\"translate(60, 60)\"><path d=\"M 0 -25 L 23 -12 L 0 1 L -23 -12 Z\" fill=\"%23fb923c\" stroke=\"%23ea580c\" stroke-width=\"1.5\" stroke-linejoin=\"round\"/><path d=\"M -23 -12 L 0 1 L 0 26 L -23 13 Z\" fill=\"%230284c7\" stroke=\"%230369a1\" stroke-width=\"1.5\" stroke-linejoin=\"round\"/><path d=\"M 0 1 L 23 -12 L 23 13 L 0 26 Z\" fill=\"%23ea580c\" stroke=\"%23c2410c\" stroke-width=\"1.5\" stroke-linejoin=\"round\"/><path d=\"M 0 1 L 0 26 M 0 1 L -23 -12 M 0 1 L 23 -12\" stroke=\"%23ffffff\" stroke-width=\"2.5\" stroke-linecap=\"round\"/><path d=\"M -11.5 -5.5 L 0 -12 L 11.5 -5.5 L 0 1 Z\" fill=\"none\" stroke=\"%23ffffff\" stroke-width=\"1.5\" stroke-opacity=\"0.7\"/><path d=\"M -11.5 7 L -11.5 -5.5 M 11.5 7 L 11.5 -5.5\" stroke=\"%23ffffff\" stroke-width=\"1.5\" stroke-opacity=\"0.7\"/></g></svg>","lead":{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null},"team_lead":{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null},"members":[{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null},{"id":102,"name":"PUM BRUSMUNY","role":"Developer","phone":"087280875","email":"pumprusmuny@example.com","avatar":null},{"id":103,"name":"THA WINNER","role":"Developer","phone":"067776682","email":"thawinner@example.com","avatar":null},{"id":104,"name":"PHUONG SOVANNARA","role":"Developer","phone":"011242425","email":"phuongsovannara@gmail.com","avatar":null}]},{"id":"0002","code":"0002","name":"BMS Digitech","description":"Business Management System - Digitech Project Management, Sales & Invoicing Workflow.","status":"active","priority":"high","category":"Business","progress":33,"total_tasks":6,"completed_tasks":1,"budget_allocated":20000,"budget_spent":6600,"start_date":"2026-08-24T09:24:17.350Z","end_date":"2026-11-07T09:24:17.350Z","logo":"data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 120 120\" width=\"120\" height=\"120\"><defs><linearGradient id=\"bmsGrad\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\"><stop offset=\"0%\" stop-color=\"%230284c7\"/><stop offset=\"100%\" stop-color=\"%230369a1\"/></linearGradient></defs><rect width=\"120\" height=\"120\" rx=\"28\" fill=\"%230b1329\"/><rect x=\"1.5\" y=\"1.5\" width=\"117\" height=\"117\" rx=\"27\" fill=\"none\" stroke=\"%231e293b\" stroke-width=\"2\"/><circle cx=\"60\" cy=\"60\" r=\"41\" fill=\"%23ffffff\" stroke=\"%23cbd5e1\" stroke-width=\"1.5\"/><circle cx=\"60\" cy=\"60\" r=\"34\" fill=\"url(%23bmsGrad)\"/><line x1=\"39\" y1=\"76\" x2=\"81\" y2=\"76\" stroke=\"%2393c5fd\" stroke-width=\"2.5\" stroke-linecap=\"round\"/><rect x=\"42\" y=\"62\" width=\"7\" height=\"14\" rx=\"2\" fill=\"%23bae6fd\"/><rect x=\"52\" y=\"51\" width=\"7\" height=\"25\" rx=\"2\" fill=\"%23ffffff\"/><rect x=\"62\" y=\"57\" width=\"7\" height=\"19\" rx=\"2\" fill=\"%23bae6fd\"/><rect x=\"72\" y=\"44\" width=\"7\" height=\"32\" rx=\"2\" fill=\"%2338bdf8\"/><path d=\"M 41 65 L 53 49 L 64 55 L 78 39\" fill=\"none\" stroke=\"%2338bdf8\" stroke-width=\"3.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><circle cx=\"78\" cy=\"39\" r=\"4\" fill=\"%23ffffff\" stroke=\"%230284c7\" stroke-width=\"2\"/><circle cx=\"53\" cy=\"49\" r=\"2.5\" fill=\"%23ffffff\"/><circle cx=\"64\" cy=\"55\" r=\"2.5\" fill=\"%23ffffff\"/></svg>","image":"data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 120 120\" width=\"120\" height=\"120\"><defs><linearGradient id=\"bmsGrad\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\"><stop offset=\"0%\" stop-color=\"%230284c7\"/><stop offset=\"100%\" stop-color=\"%230369a1\"/></linearGradient></defs><rect width=\"120\" height=\"120\" rx=\"28\" fill=\"%230b1329\"/><rect x=\"1.5\" y=\"1.5\" width=\"117\" height=\"117\" rx=\"27\" fill=\"none\" stroke=\"%231e293b\" stroke-width=\"2\"/><circle cx=\"60\" cy=\"60\" r=\"41\" fill=\"%23ffffff\" stroke=\"%23cbd5e1\" stroke-width=\"1.5\"/><circle cx=\"60\" cy=\"60\" r=\"34\" fill=\"url(%23bmsGrad)\"/><line x1=\"39\" y1=\"76\" x2=\"81\" y2=\"76\" stroke=\"%2393c5fd\" stroke-width=\"2.5\" stroke-linecap=\"round\"/><rect x=\"42\" y=\"62\" width=\"7\" height=\"14\" rx=\"2\" fill=\"%23bae6fd\"/><rect x=\"52\" y=\"51\" width=\"7\" height=\"25\" rx=\"2\" fill=\"%23ffffff\"/><rect x=\"62\" y=\"57\" width=\"7\" height=\"19\" rx=\"2\" fill=\"%23bae6fd\"/><rect x=\"72\" y=\"44\" width=\"7\" height=\"32\" rx=\"2\" fill=\"%2338bdf8\"/><path d=\"M 41 65 L 53 49 L 64 55 L 78 39\" fill=\"none\" stroke=\"%2338bdf8\" stroke-width=\"3.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><circle cx=\"78\" cy=\"39\" r=\"4\" fill=\"%23ffffff\" stroke=\"%230284c7\" stroke-width=\"2\"/><circle cx=\"53\" cy=\"49\" r=\"2.5\" fill=\"%23ffffff\"/><circle cx=\"64\" cy=\"55\" r=\"2.5\" fill=\"%23ffffff\"/></svg>","lead":{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null},"team_lead":{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null},"members":[{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null},{"id":102,"name":"PUM BRUSMUNY","role":"Developer","phone":"087280875","email":"pumprusmuny@example.com","avatar":null},{"id":103,"name":"THA WINNER","role":"Developer","phone":"067776682","email":"thawinner@example.com","avatar":null},{"id":104,"name":"PHUONG SOVANNARA","role":"Developer","phone":"011242425","email":"phuongsovannara@gmail.com","avatar":null}]},{"id":"0003","code":"0003","name":"EBMS","description":"EBMS Enterprise Business Management System.","status":"planned","priority":"medium","category":"Enterprise","progress":0,"total_tasks":0,"completed_tasks":0,"budget_allocated":12000,"budget_spent":0,"start_date":"2026-09-18T00:00:00.000Z","end_date":"2026-11-17T00:00:00.000Z","logo":"/images/logo/logo.png","image":"/images/logo/logo.png","lead":{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null},"team_lead":{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null},"members":[{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null},{"id":102,"name":"PUM BRUSMUNY","role":"Developer","phone":"087280875","email":"pumprusmuny@example.com","avatar":null},{"id":103,"name":"THA WINNER","role":"Developer","phone":"067776682","email":"thawinner@example.com","avatar":null}]},{"id":"0004","code":"0004","name":"Evenbooking-System","description":"Evenbooking-System Online Event Booking & Ticketing Platform.","status":"active","priority":"high","category":"Booking","progress":40,"total_tasks":10,"completed_tasks":4,"budget_allocated":25000,"budget_spent":10000,"start_date":"2026-09-18T00:00:00.000Z","end_date":"2026-11-17T00:00:00.000Z","logo":"/images/logo/logo.png","image":"/images/logo/logo.png","lead":{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null},"team_lead":{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null},"members":[{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null},{"id":102,"name":"PUM BRUSMUNY","role":"Developer","phone":"087280875","email":"pumprusmuny@example.com","avatar":null},{"id":103,"name":"THA WINNER","role":"Developer","phone":"067776682","email":"thawinner@example.com","avatar":null},{"id":104,"name":"PHUONG SOVANNARA","role":"Developer","phone":"011242425","email":"phuongsovannara@gmail.com","avatar":null}]},{"id":"0005","code":"0005","name":"TESTER","description":"Testing and Quality Assurance Project.","status":"active","priority":"low","category":"QA","progress":0,"total_tasks":1,"completed_tasks":0,"budget_allocated":5000,"budget_spent":0,"start_date":"2026-09-17T00:00:00.000Z","end_date":"2026-11-16T00:00:00.000Z","logo":"/images/logo/logo.png","image":"/images/logo/logo.png","lead":{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null},"team_lead":{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null},"members":[{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null},{"id":102,"name":"PUM BRUSMUNY","role":"Developer","phone":"087280875","email":"pumprusmuny@example.com","avatar":null},{"id":103,"name":"THA WINNER","role":"Developer","phone":"067776682","email":"thawinner@example.com","avatar":null}]}]'::jsonb,
    now()
)
ON CONFLICT ("key") DO UPDATE SET
    "plans" = EXCLUDED."plans",
    "updated_at" = now();

INSERT INTO "user"."task_store" ("key", "tasks", "comments", "updated_at")
VALUES (
    'default_tasks_store',
    '[{"id":1001,"code":"#0004-1","title":"About us and contact us","description":"Implement about us page layout, company contact details, and inquiry form submission.","task_type":"feature","module":"Information","status":"done","priority":"high","progress":100,"comments_count":8,"attachments_count":0,"due_date":"2026-09-25T00:00:00.000Z","start_date":"2026-08-25T08:00:00.000Z","project_id":"0004","project_name":"Evenbooking-System","reporter":{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null},"assignee":{"id":103,"name":"THA WINNER","role":"Developer","phone":"067776682","email":"thawinner@example.com","avatar":null},"assignees":[{"id":103,"name":"THA WINNER","role":"Developer","phone":"067776682","email":"thawinner@example.com","avatar":null}],"created_at":"2026-08-25T08:00:00.000Z","updated_at":"2026-09-10T12:00:00.000Z"},{"id":1002,"code":"#0004-2","title":"Improve Navbar","description":"Refactor responsive navigation bar with mobile burger menu and active route highlight.","task_type":"feature","module":"Navigation","status":"done","priority":"medium","progress":100,"comments_count":10,"attachments_count":2,"due_date":"2026-09-25T00:00:00.000Z","start_date":"2026-08-25T08:15:00.000Z","project_id":"0004","project_name":"Evenbooking-System","reporter":{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null},"assignee":{"id":103,"name":"THA WINNER","role":"Developer","phone":"067776682","email":"thawinner@example.com","avatar":null},"assignees":[{"id":103,"name":"THA WINNER","role":"Developer","phone":"067776682","email":"thawinner@example.com","avatar":null}],"created_at":"2026-08-25T08:15:00.000Z","updated_at":"2026-09-10T12:00:00.000Z"},{"id":1003,"code":"#0004-3","title":"Improve profile panel","description":"Design user profile side drawer with account summary, edit button, and logout option.","task_type":"feature","module":"User Profile","status":"done","priority":"medium","progress":100,"comments_count":6,"attachments_count":1,"due_date":"2026-09-25T00:00:00.000Z","start_date":"2026-08-25T08:30:00.000Z","project_id":"0004","project_name":"Evenbooking-System","reporter":{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null},"assignee":{"id":103,"name":"THA WINNER","role":"Developer","phone":"067776682","email":"thawinner@example.com","avatar":null},"assignees":[{"id":103,"name":"THA WINNER","role":"Developer","phone":"067776682","email":"thawinner@example.com","avatar":null}],"created_at":"2026-08-25T08:30:00.000Z","updated_at":"2026-09-10T12:00:00.000Z"},{"id":1004,"code":"#0004-4","title":"Redesign event layout","description":"Modernize event cards grid with banner images, date badge, venue tag, and book button.","task_type":"feature","module":"Events","status":"new","priority":"urgent","progress":20,"comments_count":6,"attachments_count":2,"due_date":"2026-09-25T00:00:00.000Z","start_date":"2026-08-25T08:45:00.000Z","project_id":"0004","project_name":"Evenbooking-System","reporter":{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null},"assignee":{"id":103,"name":"THA WINNER","role":"Developer","phone":"067776682","email":"thawinner@example.com","avatar":null},"assignees":[{"id":103,"name":"THA WINNER","role":"Developer","phone":"067776682","email":"thawinner@example.com","avatar":null}],"created_at":"2026-08-25T08:45:00.000Z","updated_at":"2026-09-18T12:00:00.000Z"},{"id":1005,"code":"#0004-5","title":"Improve Footer UI","description":"Update footer links, social media icons, copyright notice, and dark mode styling.","task_type":"improvement","module":"Footer","status":"done","priority":"medium","progress":100,"comments_count":5,"attachments_count":2,"due_date":"2026-09-25T00:00:00.000Z","start_date":"2026-08-25T09:00:00.000Z","project_id":"0004","project_name":"Evenbooking-System","reporter":{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null},"assignee":{"id":103,"name":"THA WINNER","role":"Developer","phone":"067776682","email":"thawinner@example.com","avatar":null},"assignees":[{"id":103,"name":"THA WINNER","role":"Developer","phone":"067776682","email":"thawinner@example.com","avatar":null}],"created_at":"2026-08-25T09:00:00.000Z","updated_at":"2026-09-10T12:00:00.000Z"},{"id":1006,"code":"#0004-6","title":"Improve or redesign home page","description":"Implement hero banner slider, trending events carousel, and category pill filters.","task_type":"feature","module":"Home Page","status":"new","priority":"urgent","progress":15,"comments_count":5,"attachments_count":1,"due_date":"2026-09-25T00:00:00.000Z","start_date":"2026-08-25T09:15:00.000Z","project_id":"0004","project_name":"Evenbooking-System","reporter":{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null},"assignee":{"id":103,"name":"THA WINNER","role":"Developer","phone":"067776682","email":"thawinner@example.com","avatar":null},"assignees":[{"id":103,"name":"THA WINNER","role":"Developer","phone":"067776682","email":"thawinner@example.com","avatar":null}],"created_at":"2026-08-25T09:15:00.000Z","updated_at":"2026-09-18T12:00:00.000Z"},{"id":1007,"code":"#0004-7","title":"Improve bar chart change to use echart","description":"Replace standard canvas chart with Apache ECharts for ticket sales analytics.","task_type":"feature","module":"Analytics","status":"new","priority":"medium","progress":30,"comments_count":5,"attachments_count":1,"due_date":"2026-09-25T00:00:00.000Z","start_date":"2026-08-25T09:30:00.000Z","project_id":"0004","project_name":"Evenbooking-System","reporter":{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null},"assignee":{"id":103,"name":"THA WINNER","role":"Developer","phone":"067776682","email":"thawinner@example.com","avatar":null},"assignees":[{"id":103,"name":"THA WINNER","role":"Developer","phone":"067776682","email":"thawinner@example.com","avatar":null}],"created_at":"2026-08-25T09:30:00.000Z","updated_at":"2026-09-18T12:00:00.000Z"},{"id":1008,"code":"#0004-8","title":"Allow change phone number","description":"Add OTP verification step when user requests phone number update in settings.","task_type":"feature","module":"User Settings","status":"new","priority":"medium","progress":0,"comments_count":3,"attachments_count":1,"due_date":"2026-09-25T00:00:00.000Z","start_date":"2026-08-25T09:45:00.000Z","project_id":"0004","project_name":"Evenbooking-System","reporter":{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null},"assignee":{"id":103,"name":"THA WINNER","role":"Developer","phone":"067776682","email":"thawinner@example.com","avatar":null},"assignees":[{"id":103,"name":"THA WINNER","role":"Developer","phone":"067776682","email":"thawinner@example.com","avatar":null}],"created_at":"2026-08-25T09:45:00.000Z","updated_at":"2026-09-18T12:00:00.000Z"},{"id":1009,"code":"#0004-9","title":"Add organizer name in event","description":"Display organizer brand, profile avatar, and verified badge on event detail screen.","task_type":"feature","module":"Events","status":"new","priority":"medium","progress":0,"comments_count":3,"attachments_count":1,"due_date":"2026-09-25T00:00:00.000Z","start_date":"2026-08-25T10:00:00.000Z","project_id":"0004","project_name":"Evenbooking-System","reporter":{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null},"assignee":{"id":103,"name":"THA WINNER","role":"Developer","phone":"067776682","email":"thawinner@example.com","avatar":null},"assignees":[{"id":103,"name":"THA WINNER","role":"Developer","phone":"067776682","email":"thawinner@example.com","avatar":null}],"created_at":"2026-08-25T10:00:00.000Z","updated_at":"2026-09-18T12:00:00.000Z"},{"id":1010,"code":"#0004-10","title":"Make it can upload profile","description":"Enable profile image cropping, drag and drop upload, and cloud image optimization.","task_type":"feature","module":"User Profile","status":"new","priority":"medium","progress":0,"comments_count":2,"attachments_count":1,"due_date":"2026-09-25T00:00:00.000Z","start_date":"2026-08-25T10:15:00.000Z","project_id":"0004","project_name":"Evenbooking-System","reporter":{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null},"assignee":{"id":103,"name":"THA WINNER","role":"Developer","phone":"067776682","email":"thawinner@example.com","avatar":null},"assignees":[{"id":103,"name":"THA WINNER","role":"Developer","phone":"067776682","email":"thawinner@example.com","avatar":null}],"created_at":"2026-08-25T10:15:00.000Z","updated_at":"2026-09-18T12:00:00.000Z"},{"id":2001,"code":"#0002-1","title":"Project | Folder | Drag & Drop","description":"Implement intuitive drag and drop folder organization for project documents.","task_type":"feature","module":"Project | Folder","status":"done","priority":"high","progress":100,"comments_count":4,"attachments_count":2,"due_date":"2026-10-15T00:00:00.000Z","start_date":"2026-08-24T09:00:00.000Z","project_id":"0002","project_name":"BMS Digitech","reporter":{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null},"assignee":{"id":102,"name":"PUM BRUSMUNY","role":"Developer","phone":"087280875","email":"pumprusmuny@example.com","avatar":null},"assignees":[{"id":102,"name":"PUM BRUSMUNY","role":"Developer","phone":"087280875","email":"pumprusmuny@example.com","avatar":null}],"created_at":"2026-08-24T09:00:00.000Z","updated_at":"2026-09-18T12:00:00.000Z"},{"id":2002,"code":"#0002-2","title":"My Work | Profile | Missing Cover","description":"Fix image cover banner rendering on responsive mobile screens.","task_type":"bug","module":"My Work | Profile","status":"confirmed","priority":"high","progress":90,"comments_count":2,"attachments_count":1,"due_date":"2026-10-18T00:00:00.000Z","start_date":"2026-08-24T09:30:00.000Z","project_id":"0002","project_name":"BMS Digitech","reporter":{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null},"assignee":{"id":102,"name":"PUM BRUSMUNY","role":"Developer","phone":"087280875","email":"pumprusmuny@example.com","avatar":null},"assignees":[{"id":102,"name":"PUM BRUSMUNY","role":"Developer","phone":"087280875","email":"pumprusmuny@example.com","avatar":null}],"created_at":"2026-08-24T09:30:00.000Z","updated_at":"2026-09-18T12:00:00.000Z"},{"id":2003,"code":"#0002-3","title":"User | Report | Progress Compare","description":"Generate visual analytics comparing team velocity across sprints.","task_type":"feature","module":"User | Report","status":"in_review","priority":"medium","progress":85,"comments_count":3,"attachments_count":0,"due_date":"2026-10-20T00:00:00.000Z","start_date":"2026-08-24T10:00:00.000Z","project_id":"0002","project_name":"BMS Digitech","reporter":{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null},"assignee":{"id":102,"name":"PUM BRUSMUNY","role":"Developer","phone":"087280875","email":"pumprusmuny@example.com","avatar":null},"assignees":[{"id":102,"name":"PUM BRUSMUNY","role":"Developer","phone":"087280875","email":"pumprusmuny@example.com","avatar":null}],"created_at":"2026-08-24T10:00:00.000Z","updated_at":"2026-09-18T12:00:00.000Z"},{"id":2004,"code":"#0002-4","title":"Profile | Switch Org | Exit Org","description":"Ensure smooth transition and state purge when switching organization context.","task_type":"feature","module":"Profile","status":"done","priority":"low","progress":100,"comments_count":2,"attachments_count":0,"due_date":"2026-09-12T00:00:00.000Z","start_date":"2026-08-24T10:30:00.000Z","project_id":"0002","project_name":"BMS Digitech","reporter":{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null},"assignee":{"id":102,"name":"PUM BRUSMUNY","role":"Developer","phone":"087280875","email":"pumprusmuny@example.com","avatar":null},"assignees":[{"id":102,"name":"PUM BRUSMUNY","role":"Developer","phone":"087280875","email":"pumprusmuny@example.com","avatar":null}],"created_at":"2026-08-24T10:30:00.000Z","updated_at":"2026-09-18T12:00:00.000Z"},{"id":2005,"code":"#0002-14","title":"Api | Payment | Home Page + CRUD","description":"Build payment gateway callback webhooks and transaction ledger.","task_type":"feature","module":"Api | Payment","status":"in_progress","priority":"medium","progress":50,"comments_count":7,"attachments_count":1,"due_date":"2026-09-18T00:00:00.000Z","start_date":"2026-09-01T08:00:00.000Z","project_id":"0002","project_name":"BMS Digitech","reporter":{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null},"assignee":{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null},"assignees":[{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null}],"created_at":"2026-09-01T08:00:00.000Z","updated_at":"2026-09-18T12:00:00.000Z"},{"id":2006,"code":"#0002-24","title":"Web | Report | Purchases Page","description":"Purchases data export to Excel and PDF formats for finance audit.","task_type":"feature","module":"Web | Report","status":"new","priority":"medium","progress":10,"comments_count":2,"attachments_count":1,"due_date":"2026-09-18T00:00:00.000Z","start_date":"2026-09-01T08:30:00.000Z","project_id":"0002","project_name":"BMS Digitech","reporter":{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null},"assignee":{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null},"assignees":[{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null}],"created_at":"2026-09-01T08:30:00.000Z","updated_at":"2026-09-18T12:00:00.000Z"},{"id":101,"code":"#0001-1","title":"Org Admin | Structure | Department","description":"Manage departmental structures, permissions, and organizational units in core hierarchy.","task_type":"feature","module":"Org Admin | Structure","status":"in_review","priority":"high","progress":85,"comments_count":1,"attachments_count":2,"due_date":"2026-10-15T00:00:00.000Z","start_date":"2026-08-09T08:00:00.000Z","project_id":"0001","project_name":"WMS Digitech","reporter":{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null},"assignee":{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null},"assignees":[{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null}],"created_at":"2026-08-09T08:00:00.000Z","updated_at":"2026-09-18T12:00:00.000Z"},{"id":102,"code":"#0001-2","title":"Project | Folder | Cannot Scroll PDF","description":"Resolve touch and trackpad event bubbling preventing embedded PDF scrolling.","task_type":"bug","module":"Project | Folder","status":"new","priority":"urgent","progress":0,"comments_count":3,"attachments_count":1,"due_date":"2026-10-18T00:00:00.000Z","start_date":"2026-08-09T08:30:00.000Z","project_id":"0001","project_name":"WMS Digitech","reporter":{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null},"assignee":{"id":102,"name":"PUM BRUSMUNY","role":"Developer","phone":"087280875","email":"pumprusmuny@example.com","avatar":null},"assignees":[{"id":102,"name":"PUM BRUSMUNY","role":"Developer","phone":"087280875","email":"pumprusmuny@example.com","avatar":null}],"created_at":"2026-08-09T08:30:00.000Z","updated_at":"2026-09-18T12:00:00.000Z"},{"id":103,"code":"#0001-3","title":"Security setting UI improvements","description":"Enhance 2FA configuration flow and passkey biometric enrollment prompts.","task_type":"improvement","module":"Security Settings","status":"confirmed","priority":"medium","progress":75,"comments_count":2,"attachments_count":0,"due_date":"2026-10-22T00:00:00.000Z","start_date":"2026-08-09T09:00:00.000Z","project_id":"0001","project_name":"WMS Digitech","reporter":{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null},"assignee":{"id":102,"name":"PUM BRUSMUNY","role":"Developer","phone":"087280875","email":"pumprusmuny@example.com","avatar":null},"assignees":[{"id":102,"name":"PUM BRUSMUNY","role":"Developer","phone":"087280875","email":"pumprusmuny@example.com","avatar":null}],"created_at":"2026-08-09T09:00:00.000Z","updated_at":"2026-09-18T12:00:00.000Z"},{"id":104,"code":"#0001-4","title":"User | Report | Progress","description":"Export daily attendance timesheets and check-in geolocation heatmaps.","task_type":"feature","module":"User | Report","status":"done","priority":"medium","progress":100,"comments_count":2,"attachments_count":0,"due_date":"2026-09-10T00:00:00.000Z","start_date":"2026-08-09T09:30:00.000Z","project_id":"0001","project_name":"WMS Digitech","reporter":{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null},"assignee":{"id":102,"name":"PUM BRUSMUNY","role":"Developer","phone":"087280875","email":"pumprusmuny@example.com","avatar":null},"assignees":[{"id":102,"name":"PUM BRUSMUNY","role":"Developer","phone":"087280875","email":"pumprusmuny@example.com","avatar":null}],"created_at":"2026-08-09T09:30:00.000Z","updated_at":"2026-09-18T12:00:00.000Z"},{"id":3001,"code":"#0005-1","title":"Testing project setup and verification","description":"End to end smoke testing for newly deployed microservices.","task_type":"feature","module":"Testing","status":"new","priority":"medium","progress":0,"comments_count":1,"attachments_count":0,"due_date":"2026-11-16T00:00:00.000Z","start_date":"2026-09-17T08:00:00.000Z","project_id":"0005","project_name":"TESTER","reporter":{"id":101,"name":"PISETH PANHAVORN","role":"Project Manager","phone":"010843612","email":"pisethpanhavorn544@gmail.com","avatar":null},"assignee":{"id":103,"name":"THA WINNER","role":"Developer","phone":"067776682","email":"thawinner@example.com","avatar":null},"assignees":[{"id":103,"name":"THA WINNER","role":"Developer","phone":"067776682","email":"thawinner@example.com","avatar":null}],"created_at":"2026-09-17T08:00:00.000Z","updated_at":"2026-09-18T12:00:00.000Z"}]'::jsonb,
    '{"101":[{"id":30001,"sender_id":0,"sender_name":"ប្រព័ន្ធ (System)","sender_avatar":null,"text":"ភារកិច្ច #0001-1 ត្រូវបានបង្កើតឡើង","time":"08:00 AM","is_self":false,"is_system":true,"created_at":"2026-08-09T08:00:00.000Z"}],"102":[{"id":30002,"sender_id":0,"sender_name":"ប្រព័ន្ធ (System)","sender_avatar":null,"text":"ភារកិច្ច #0001-2 ត្រូវបានបង្កើតឡើង","time":"08:30 AM","is_self":false,"is_system":true,"created_at":"2026-08-09T08:30:00.000Z"}],"103":[{"id":30003,"sender_id":0,"sender_name":"ប្រព័ន្ធ (System)","sender_avatar":null,"text":"ភារកិច្ច #0001-3 ត្រូវបានបង្កើតឡើង","time":"09:00 AM","is_self":false,"is_system":true,"created_at":"2026-08-09T09:00:00.000Z"}],"104":[{"id":30004,"sender_id":0,"sender_name":"ប្រព័ន្ធ (System)","sender_avatar":null,"text":"ភារកិច្ច #0001-4 ត្រូវបានបង្កើតឡើង","time":"09:30 AM","is_self":false,"is_system":true,"created_at":"2026-08-09T09:30:00.000Z"}],"1001":[{"id":10001,"sender_id":0,"sender_name":"ប្រព័ន្ធ (System)","sender_avatar":null,"text":"ភារកិច្ច #0004-1 ត្រូវបានបង្កើតឡើង","time":"08:00 AM","is_self":false,"is_system":true,"created_at":"2026-08-25T08:00:00.000Z"},{"id":10002,"sender_id":101,"sender_name":"PISETH PANHAVORN","sender_avatar":null,"text":"សួស្តី @THA WINNER! សូមជួយរៀបចំទំព័រ About Us និង Contact Us តាមលក្ខខណ្ឌការងារ។","time":"08:15 AM","is_self":false,"is_system":false,"created_at":"2026-08-25T08:15:00.000Z"}],"1002":[{"id":10003,"sender_id":0,"sender_name":"ប្រព័ន្ធ (System)","sender_avatar":null,"text":"ភារកិច្ច #0004-2 ត្រូវបានបង្កើតឡើង","time":"08:15 AM","is_self":false,"is_system":true,"created_at":"2026-08-25T08:15:00.000Z"}],"1003":[{"id":10004,"sender_id":0,"sender_name":"ប្រព័ន្ធ (System)","sender_avatar":null,"text":"ភារកិច្ច #0004-3 ត្រូវបានបង្កើតឡើង","time":"08:30 AM","is_self":false,"is_system":true,"created_at":"2026-08-25T08:30:00.000Z"}],"1004":[{"id":10005,"sender_id":0,"sender_name":"ប្រព័ន្ធ (System)","sender_avatar":null,"text":"ភារកិច្ច #0004-4 ត្រូវបានបង្កើតឡើង","time":"08:45 AM","is_self":false,"is_system":true,"created_at":"2026-08-25T08:45:00.000Z"}],"1005":[{"id":10006,"sender_id":0,"sender_name":"ប្រព័ន្ធ (System)","sender_avatar":null,"text":"ភារកិច្ច #0004-5 ត្រូវបានបង្កើតឡើង","time":"09:00 AM","is_self":false,"is_system":true,"created_at":"2026-08-25T09:00:00.000Z"}],"1006":[{"id":10007,"sender_id":0,"sender_name":"ប្រព័ន្ធ (System)","sender_avatar":null,"text":"ភារកិច្ច #0004-6 ត្រូវបានបង្កើតឡើង","time":"09:15 AM","is_self":false,"is_system":true,"created_at":"2026-08-25T09:15:00.000Z"}],"1007":[{"id":10008,"sender_id":0,"sender_name":"ប្រព័ន្ធ (System)","sender_avatar":null,"text":"ភារកិច្ច #0004-7 ត្រូវបានបង្កើតឡើង","time":"09:30 AM","is_self":false,"is_system":true,"created_at":"2026-08-25T09:30:00.000Z"}],"1008":[{"id":10009,"sender_id":0,"sender_name":"ប្រព័ន្ធ (System)","sender_avatar":null,"text":"ភារកិច្ច #0004-8 ត្រូវបានបង្កើតឡើង","time":"09:45 AM","is_self":false,"is_system":true,"created_at":"2026-08-25T09:45:00.000Z"}],"1009":[{"id":10010,"sender_id":0,"sender_name":"ប្រព័ន្ធ (System)","sender_avatar":null,"text":"ភារកិច្ច #0004-9 ត្រូវបានបង្កើតឡើង","time":"10:00 AM","is_self":false,"is_system":true,"created_at":"2026-08-25T10:00:00.000Z"}],"1010":[{"id":10011,"sender_id":0,"sender_name":"ប្រព័ន្ធ (System)","sender_avatar":null,"text":"ភារកិច្ច #0004-10 ត្រូវបានបង្កើតឡើង","time":"10:15 AM","is_self":false,"is_system":true,"created_at":"2026-08-25T10:15:00.000Z"}],"2001":[{"id":20001,"sender_id":0,"sender_name":"ប្រព័ន្ធ (System)","sender_avatar":null,"text":"ភារកិច្ច #0002-1 ត្រូវបានបង្កើតឡើង","time":"09:00 AM","is_self":false,"is_system":true,"created_at":"2026-08-24T09:00:00.000Z"},{"id":20002,"sender_id":101,"sender_name":"PISETH PANHAVORN","sender_avatar":null,"text":"សួស្តី @PUM BRUSMUNY! សូមពិនិត្យមើល drag & drop folder ក្នុង BMS។","time":"09:15 AM","is_self":false,"is_system":false,"created_at":"2026-08-24T09:15:00.000Z"}],"2005":[{"id":20003,"sender_id":0,"sender_name":"ប្រព័ន្ធ (System)","sender_avatar":null,"text":"ភារកិច្ច #0002-14 ត្រូវបានបង្កើតឡើង","time":"08:00 AM","is_self":false,"is_system":true,"created_at":"2026-09-01T08:00:00.000Z"}],"2006":[{"id":20004,"sender_id":0,"sender_name":"ប្រព័ន្ធ (System)","sender_avatar":null,"text":"ភារកិច្ច #0002-24 ត្រូវបានបង្កើតឡើង","time":"08:30 AM","is_self":false,"is_system":true,"created_at":"2026-09-01T08:30:00.000Z"}],"3001":[{"id":40001,"sender_id":0,"sender_name":"ប្រព័ន្ធ (System)","sender_avatar":null,"text":"ភារកិច្ច #0005-1 ត្រូវបានបង្កើតឡើង","time":"08:00 AM","is_self":false,"is_system":true,"created_at":"2026-09-17T08:00:00.000Z"}]}'::jsonb,
    now()
)
ON CONFLICT ("key") DO UPDATE SET
    "tasks" = EXCLUDED."tasks",
    "comments" = EXCLUDED."comments",
    "updated_at" = now();

COMMIT;

-- =============================================================================
-- VERIFICATION QUERIES (Run these to verify row counts)
-- =============================================================================
SELECT 'Projects count:' AS metric, count(*) AS total FROM "project"."projects"
UNION ALL
SELECT 'Phases count:', count(*) FROM "project"."project_phases"
UNION ALL
SELECT 'Tasks count:', count(*) FROM "task"."tasks"
UNION ALL
SELECT 'Comments count:', count(*) FROM "task"."task_comments"
UNION ALL
SELECT 'Plan store count:', count(*) FROM "user"."plan_store"
UNION ALL
SELECT 'Task store count:', count(*) FROM "user"."task_store";
