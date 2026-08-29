# PMS API Functional Requirements

This document summarizes the functional requirements found from the current NestJS API structure, route modules, controllers, shared services, entities, seed data, and tests.

| Module / Tasks | Functionalities | Description |
| --- | --- | --- |
| Account / Authentication | Username login, OTP verification, Telegram login, Google sign-in, forgot password, reset password | The system shall allow users to authenticate through username/password with OTP, Telegram, and Google, and shall support password recovery and reset flows. |
| Account / Session Management | JWT session handling, login method tracking, session logs, device tracking | The system shall issue and validate authenticated sessions, record user session activity, and track devices used to access the platform. |
| Account / Profile | View profile, update profile, check password, change password, password last-change lookup | The system shall allow authenticated users to manage their personal profile and account password details. |
| Account / Role and Organization Switching | List roles, list organizations, switch active role or organization | The system shall support users who belong to multiple roles or organizations and allow switching active access context. |
| Account / Two-Factor Settings | View 2FA configuration, update phone OTP, Telegram OTP, and email OTP settings | The system shall allow users to configure OTP delivery channels for account security. |
| Account / QR Login | Generate QR login session, check QR status, scan QR login | The system shall support QR-based login sessions for device-to-device authentication. |
| User Home Dashboard | User info, project list, project team list, meeting schedule, unread activity | The system shall provide a personalized home dashboard with the user's profile context, assigned projects, team members, meetings, and unread activity indicators. |
| User Home Quick Create | Create task, create activity, create project | The system shall allow users to quickly create common work items from the home area, including file/image upload where supported. |
| User Home Task Summary | Task status counts, task list by status, my task list, confirmation task list | The system shall summarize user tasks by status and due date, including tasks requiring user confirmation or follow-up. |
| User Task Management | Table view, Kanban view, calendar view, search, create task, update task, archive task, delete task | The system shall allow users to manage tasks across tabular, Kanban, calendar, and search views. |
| User Task Detail | View task detail, update task detail, upload task files, replace attachment, delete attachment | The system shall allow users to inspect and maintain task metadata, assignments, status, dates, descriptions, and attachments. |
| User Task Filtering | Filter by organization, priority, status, type, and member | The system shall provide lookup filters so users can narrow task lists to relevant organizations, members, priorities, statuses, and task types. |
| Task Collaboration | Create chat room, view chat room, send message, edit message, delete message, delete attachment, unread count | The system shall provide task-level chat rooms with file attachments and unread message tracking. |
| Shared Task Detail | Cross-module task detail, task update, task chat room, task chat messages | The system shall expose shared task detail and chat functionality that can be reused by project, user, admin, and dashboard modules. |
| Activity Management | List activities, create activity, pin activity, archive activity, delete activity | The system shall allow users to manage project activities and mark them as pinned or archived. |
| Activity Tasks | View tasks under an activity, create activity with task files | The system shall allow activities to contain related tasks and task attachments. |
| Activity Filtering | Member list, create listing data, project filter, responsible-by filter | The system shall provide activity helper lists for creation and filtering by project and responsible person. |
| User Project List | List projects, create project, view project, update project, delete project, setup project types, setup project statuses | The system shall allow users to manage accessible projects and retrieve setup values needed by the project UI. |
| Project General | Project overview, update project general info, task status counts, recent tasks, recent activities | The system shall provide project-level summary information and allow project general information updates. |
| Project General Tasks | Create project task, list project tasks, list priority tasks, list task statuses, list task types | The system shall allow project users to create and inspect tasks from the project general area. |
| Project General Chat | View project messages, send project message, unread message count | The system shall provide project-level communication and unread status tracking. |
| Project Statistics | Activity statistics, task statistics, challenge statistics, suggestion statistics | The system shall calculate project-level progress and health metrics for dashboards and reports. |
| Project Team | View team, user setup list, global user list, project user list, create user, add user, update user, remove user | The system shall support project team membership management, including creating or adding users to projects. |
| Project Team Workload | View member task, create member task, view member activity, create member activity | The system shall allow project managers or permitted users to inspect and assign work for team members. |
| Project Team Chat | View member task chat room, send chat message, unread count | The system shall support communication around team member tasks inside a project context. |
| Project Technical Overview | View technical categories, restrict category access, list category members, add category member, remove category member | The system shall organize project technical information into categories and support category-level access control. |
| Project Technical Requirements | Business requirement, technical requirement | The system shall store and expose business and technical requirement content for a project. |
| Project Technical Stack | Technology, mockup, database, deployment | The system shall track project technologies, mockups, database notes, and deployment information. |
| Project Quality Work | QA, QC, testing | The system shall manage quality assurance, quality control, and testing phases, including checklist items where supported by the admin routes. |
| Project Service Requirements | File service, verify service, AI service, notification service, report service, payment service | The system shall track service-specific technical requirements and configurations for project integrations. |
| Project Plan | Task list, Kanban list, group count, update Kanban status, create task, update task, archive task, delete task, task detail | The system shall support project planning with task lists, Kanban grouping, status changes, and task lifecycle management. |
| Project Plan Activities | List activities, view activity detail, create activity, update activity, delete activity | The system shall support activity planning within projects. |
| Project Plan Challenges and Suggestions | List project challenges, list project suggestions | The system shall expose project challenges and suggestions for planning and improvement tracking. |
| Project Meetings | List meetings, create meeting, update meeting, delete meeting | The system shall manage meetings for a project with participant and schedule information. |
| Project Documents | List files/folders, create folder, upload file, update folder, update file, delete folder, delete file | The system shall provide project document management with folders and uploaded files. |
| User Reports | User info, plan count, my task status, task performance, task reports | The system shall provide user-level reports for workload, task status, and performance. |
| Task Performance | Performance score, rank, multiplier, period range, report generation | The system shall calculate and report task performance using configurable scoring rules, ranks, multipliers, and time periods. |
| Organization Admin Home | Admin user info, task status, task by status, user access, project list, member list, recent activity, priority list, task chart | The system shall provide organization administrators with a dashboard covering organization projects, members, tasks, and activity. |
| Organization Admin Project Management | List, create, view, update, delete organization projects | The system shall allow organization administrators to manage projects within their organization scope. |
| Organization Admin Project Areas | General, team, technical, plan, meeting, file | The system shall provide organization administrators the same project work areas as users, with broader organization-level permissions. |
| Organization Admin Member Management | Member list, member detail, create user, update user, change password | The system shall allow organization administrators to manage organization users and member accounts. |
| Organization Admin Member Statistics | Project statistics, activity statistics, task statistics per member | The system shall show per-member performance and work statistics for organization administrators. |
| Organization Admin Reports | General plan count, priority report, type-of-task report | The system shall provide organization-level reports grouped by plan count, priority, and task type. |
| Organization Settings | Organization user info, update organization info, member management, task management | The system shall allow organization administrators to maintain their organization profile, members, and organization tasks. |
| Organization Lookup Settings | Project type, project status, project priority | The system shall allow organization administrators to maintain project lookup data scoped to their organization. |
| Organization Position Settings | Project member roles, organization positions | The system shall allow organization administrators to maintain role and position lookup data. |
| Organization Task Settings | Task status, task type, task priority | The system shall allow organization administrators to maintain task lookup data scoped to their organization. |
| Organization Task Performance Settings | Task performance points and configuration | The system shall allow organization administrators to configure task performance scoring rules. |
| Super Admin Dashboard | Project count, my task status, task list | The system shall provide super administrators with global dashboard metrics and task visibility. |
| Super Admin User Management | List users, view user, create user, update user, change user password | The system shall allow super administrators to manage all user accounts. |
| Super Admin Organization Management | List organizations, create organization, view organization, update organization, delete organization | The system shall allow super administrators to manage organizations globally. |
| Super Admin Project Management | List, create, view, update, delete projects | The system shall allow super administrators to manage projects across the full system. |
| Super Admin Project Areas | General, team, technical, plan, meeting, file | The system shall provide super administrators global access to project operational modules. |
| Super Admin Project Settings | Project type, project status, project priority | The system shall allow super administrators to maintain global/default project lookup values. |
| Super Admin Position Settings | Project member roles, organization positions | The system shall allow super administrators to maintain global/default role and position values. |
| Super Admin Task Settings | Task status, task type, task priority | The system shall allow super administrators to maintain global/default task lookup values. |
| Super Admin About App | About app content, application functional entries | The system shall allow super administrators to manage app information and functional descriptions shown in the application. |
| Access Control | JWT middleware, user/admin/super-admin middleware, role guard, role decorator | The system shall enforce authenticated access and role-based authorization across route groups. |
| Audit Logging | Audit log entity and seed data | The system shall support recording system actions for traceability and administrative review. |
| Notifications | Notification entity, notification type, realtime gateway | The system shall support storing and broadcasting notification events to users. |
| Realtime Communication | Realtime gateway, chat gateway | The system shall support realtime updates for chat, notifications, and collaborative task/project interactions. |
| File Handling | Project files, task attachments, activity attachments, chat attachments, upload utilities | The system shall support file upload, replacement, retrieval, and deletion across projects, tasks, activities, and chat messages. |
| Custom Fields | Custom field definitions, custom field values, entity/type enums | The system shall support configurable metadata fields for supported business entities. |
| Lookup and Seed Data | Roles, permissions, statuses, priorities, task types, project types, days in week, notifications | The system shall provide seedable baseline data required for setup, filtering, permissions, and workflow states. |
| Data and Deployment | TypeORM data source, migrations, seed runner, Dockerfile, GitLab pipelines, Ansible deployment | The system shall support database setup, migrations, seed execution, containerized production builds, and CI/CD deployment. |
| API Quality | Unit tests, e2e test setup, performance tests, service specs | The system shall include automated tests for selected services and API behavior, including task performance, device tracking, lookup, file, and recreate utilities. |

