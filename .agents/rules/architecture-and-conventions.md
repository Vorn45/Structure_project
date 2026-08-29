# System & PMS Architecture & Engineering Guide

This document captures the complete architectural patterns, folder conventions, and engineering standards derived from the PMS codebase.

---

## 1. High-Level Architecture Overview

The system is organized as a full-stack monorepo:
- **`api/`**: NestJS 11 backend service (TypeScript, TypeORM, PostgreSQL, Redis cache, MCP Server tools).
- **`web/`**: Angular 18 frontend application (Tailwind CSS, Angular Material, Transloco i18n, ApexCharts / Chart.js, Custom Helper framework).
- **`.agents/`**: AI development skills (e.g. `angular-developer`) and workspace rules.

---

## 2. Frontend (`web/`) Conventions & Patterns

### 2.1 Role-Based Resource Hierarchy
Features in `src/app/resources/` are structured by user persona / role:
- **`1-account/`**: Authentication, profile settings, 2FA (TOTP, Telegram, SMS), passkeys, account security.
- **`2-user/`**: General user dashboard, personal tasks, activities, assigned projects, reports, chat.
- **`3-org-admin/`**: Organization admin dashboard, member management, project setup wizards, organization-wide reports.
- **`4-super-admin/` (or `r4-super-admin/`)**: Platform super admin, invoices, packages, subscriptions, global settings.

### 2.2 Component & File Naming Conventions
- **Feature components & dialogs** are separated into modular folders containing:
  - `component.ts` — Angular component logic.
  - `template.html` — HTML template.
  - `style.scss` — Scoped SCSS styles.
  - `*.service.ts` — Feature data access service (using `HttpClient`).
  - `*.type.ts` — TypeScript interfaces, types, and DTO contracts.
- **Shared Dialogs & Widgets**: Placed in `src/app/shared/` for reusable modals, wizards, and selectors.

### 2.3 Helper Framework (`src/helper/`)
- **Animations (`src/helper/animations/`)**: Standard reusable triggers (`expandCollapse`, `fadeIn`, `slideIn`, `zoomIn`) using `HelperAnimationCurves` and `HelperAnimationDurations`.
- **UI Components (`src/helper/components/`)**:
  - `alert`, `card`, `drawer`, `form_field` (custom & inline), `navigation` (basic, collapsable, group, divider), `loading-bar`, `bar-chart`, `img-viewer`, `pdf-viewer`.
- **Directives (`src/helper/directives/`)**: `horizontal-wheel-scroll`, `scroll-reset`, `scrollbar`.
- **Services (`src/helper/services/`)**: `snack-bar`, `loading`, `confirmation`, `media-watcher`, `splash-screen`, `platform`, `config`, `utils`.
- **Layouts (`src/app/layout/`)**: Multiple shell presets (`classy`, `compact`, `thin`, `thin-header`, `empty`, `common`).
- **Styling**: Tailwind CSS configured with custom color tokens, dark mode classes, and glassmorphism helpers.

---

## 3. Backend (`api/`) Conventions & Patterns

### 3.1 Resource-Based Modular Architecture
Endpoints in `src/app/resources/` mirror the frontend roles:
- `1-account/` (1-auth, 2-profile, 3-project, 4-organization)
- `2-user/` (1-home, 2-task, 3-activity, 4-project, 5-report, 6-invitation, 7-organization-chat)
- `3-org-admin/` (1-home, 2-project, 3-member, 4-report, 5-organization)
- `4-sup-admin/` (1-home, 2-invoice, 3-project, 4-organization, 5-package, 6-users, 7-setting)
- `5-webhook/` (Telegram webhooks, integrations)
- `6-invitation/`
- `7-mcp/` (Model Context Protocol tools for AI agent interoperability)
- `8-invite-link/`

### 3.2 Common Cross-Cutting Layer (`src/app/common/`)
- **Decorators**: Custom decorators like `@Roles(...)`.
- **Guards**: `RoleGuard` for RBAC enforcement.
- **Interceptors**:
  - `LoggingInterceptor` — Request / response logging.
  - `RefreshTokenCookieInterceptor` — Secure cookie management.
  - `SnakeCaseResponseInterceptor` — Automatic camelCase to snake_case response transformation.
- **Middlewares**:
  - `JwtMiddleware` — Token verification & user hydration.
  - `AdminMiddleware` & `SuperAdminMiddleware` — Permission validation.
  - `SnakeCaseRequestAliasMiddleware` — Request payload transformation.
- **Utils**: Domain utilities for crypto, access validation, soft-delete management, task recurrence, and response formatting.

### 3.3 Domain Entity Models (`src/app/model/`)
Entities grouped into domain subfolders:
`activity`, `application`, `audit`, `chat`, `custom-field`, `file`, `meeting`, `milestone`, `notification`, `organization`, `package`, `project`, `report`, `sprint`, `task`, `user`.

### 3.4 Database & Migrations (`src/database/`)
- `data-source.ts` — TypeORM configuration.
- `migrate.ts` & `seeder.ts` — Schema migrations and seed data runners.

---

## 4. Key Engineering Practices

1. **Clean Separation of Concerns**: Keep business logic in services, controllers lightweight, and DTOs explicitly typed.
2. **Standardized Responses**: Responses pass through snake_case transform interceptors; API contracts should remain consistent across frontend and backend.
3. **Reactive Patterns**: Use RxJS observables and Angular Signals for reactive UI state.
4. **Rich Aesthetics**: Maintain dark mode compatibility, refined animations (`src/helper/animations`), and responsive dialogs throughout all frontend features.
