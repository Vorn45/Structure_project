# 7.2. Strong Points, 7.3. Limitations, and 7.4. Challenges

## Introduction

This section describes the strong points, limitations, and challenges of the PMS project. The analysis is based on the complete project structure, including the NestJS backend API, Angular frontend application, PostgreSQL database design, Socket.IO realtime service, file service integration, report generation, Docker deployment files, GitLab CI/CD configuration, and the existing documentation in the `docs/` folder.

The PMS project is a role-based project management system designed for Members, Organization Admins, and Super Admins. It supports core project workflows such as authentication, organization management, user and member management, project management, task creation, task assignment, activity tracking, task chat, reports, dashboards, file attachment, and deployment preparation.

## 7.2. Strong Points

The PMS project has several strong points that show it is already built as a complete business system rather than a simple prototype. The main strengths are its clear structure, role-based design, rich task/project workflow, and integration with important supporting services.

| Strong Point | Explanation |
|---|---|
| Clear backend structure | The backend is organized into modules such as authentication, account, member, organization admin, super admin, shared services, realtime, task, project, report, file, OTP, and technical project data. This makes the API easier to maintain and extend. |
| Clear frontend structure | The Angular application is separated into role-based resource folders for account, member, organization admin, and super admin pages. This matches the backend structure and helps developers understand the system flow. |
| Role-based access control | The system separates users into Member, Organization Admin, and Super Admin roles. Backend routes and frontend route guards protect different parts of the system based on authentication and user role. |
| Strong authentication flow | The project supports JWT authentication, refresh tokens, OTP verification, password reset, Google sign-in support, Telegram-related OTP support, and device/session tracking. |
| Complete project management workflow | PMS includes project listing, project details, project overview, teamwork, technology, tasks, activities, issues, requests, progress, notes, meetings, and files. This gives users a full project workspace. |
| Complete task workflow | The system supports creating tasks, assigning tasks, selecting status, priority, type, activity, responsible users, attachments, detail views, timeline data, and activity logs. |
| Activity and task relationship | Activities can contain related tasks, which makes planning and tracking work clearer for project teams. |
| Task chat support | The project includes task chat rooms, messages, replies, attachments, read state, and notification records. This helps team members discuss work directly inside the task context. |
| Realtime foundation | The backend includes a Socket.IO realtime gateway with JWT authentication and user-specific rooms. This creates a good base for instant updates in the application. |
| File service integration | The backend connects to an external file service and stores file metadata in the database. This supports task attachments, avatars, organization logos, and report files. |
| Reporting support | The system includes member reports, organization admin reports, dashboard summaries, and JSReport integration for generating report output. |
| Database coverage | The project has many TypeORM entities covering users, organizations, projects, tasks, activities, chat, files, reports, notifications, audits, meetings, and technical data. |
| Deployment preparation | Both API and web projects include Docker files, GitLab CI/CD files, and Ansible-related configuration for deployment. |
| Existing API documentation | The project includes Postman API collections and several Markdown documents, including database, activity, architecture, setup, and implementation diagrams. |
| Modern technology stack | The backend uses NestJS, TypeScript, TypeORM, PostgreSQL, Redis/cache support, Socket.IO, JWT, Docker, and CI/CD. The frontend uses Angular, Angular Material, Tailwind CSS, Transloco, Socket.IO client, and reporting/chart libraries. |

### Explanation

The strongest part of PMS is its system organization. The backend and frontend both follow a role-based structure, so the application is easier to understand from both technical and business perspectives. Member, Organization Admin, and Super Admin features are separated clearly, while shared services are reused for common logic such as task management, project management, file upload, OTP, and reporting.

Another strong point is the task and project workflow. The project does not only store project records; it also provides task assignment, activity planning, status tracking, attachments, chat, meetings, progress views, and reports. This makes the PMS project suitable for real project coordination.

The project also has a strong technical base. It uses a modern backend framework, a structured frontend framework, database entities, authentication middleware, realtime communication, Docker deployment, and CI/CD files. These technologies make the system scalable and easier to prepare for production.

## 7.3. Limitations

Although the PMS project has many completed features, some areas are still limited or partially completed. These limitations should be considered when preparing the system for final submission or production use.

| Limitation | Explanation |
|---|---|
| Chat WebSocket broadcasting is incomplete | The task chat HTTP feature is implemented, but the dedicated chat gateway currently acts as a placeholder and does not broadcast room updates in real time. |
| Database migrations are disabled | The `package.json` migration commands only print a message saying migrations are disabled and to use the seeder instead. This limits controlled database versioning. |
| Some organization settings are unfinished | The frontend has TODO markers for online operation settings and notification channel settings, showing these pages still need final wiring. |
| Some placeholder pages still exist | The frontend includes placeholder components for Member and Organization Admin sections, meaning some routes or future pages are not fully implemented. |
| Frontend social login/QR provider flow is partial | The sign-in component includes a TODO for wiring provider OAuth or QR flows, even though backend support exists for some authentication integrations. |
| Automated testing is not complete | The project has selected test files, but test coverage does not appear complete for all important modules such as task chat, file upload, permissions, reports, and deployment behavior. |
| Production/UAT deployment is not fully finalized | Docker and development CI/CD files exist, but final UAT and production deployment readiness still needs environment-specific verification. |
| Main README is not enough as full project documentation | The project has useful docs in the `docs/` folder, but the main README still needs to be improved as a complete setup and usage guide. |
| External services create dependency risk | File service, Telegram, Google, JSReport, PostgreSQL, Redis/cache, and deployment servers must be correctly configured for the full system to work. |
| Large feature scope increases maintenance work | PMS covers many modules, so keeping frontend, backend, database, permissions, and reports consistent requires careful coordination. |

### Explanation

The most important limitation is the gap between implemented HTTP features and full realtime behavior. Task chat can store and return messages, but live chat room broadcasting still needs completion. This means users may need to refresh or rely on normal API calls for some chat updates instead of receiving every update instantly.

Another limitation is database migration management. Since migration commands are disabled, database changes depend more on synchronization or seed scripts. This can be acceptable during development, but it is risky for production because database schema changes should be tracked and applied in a controlled way.

The frontend also still contains some TODO and placeholder areas. These do not stop the main project workflow, but they show that some settings and extra pages still require final implementation before the application can be considered fully complete.

## 7.4. Challenges

Developing the PMS project involves several technical and project-management challenges because the system connects many modules, user roles, and external services.

| Challenge | Explanation |
|---|---|
| Managing role-specific behavior | The system must correctly handle Member, Organization Admin, and Super Admin access across both backend APIs and frontend routes. Any mistake can expose data to the wrong user role. |
| Keeping task, activity, and project data consistent | Tasks are connected to projects, activities, assignees, files, chat rooms, status, priority, type, and logs. Updating one part of the workflow must not break the others. |
| Implementing reliable realtime features | Socket.IO requires authenticated connections, correct room membership, event broadcasting, and frontend listeners. Chat and task updates must be synchronized carefully. |
| Handling file uploads with an external file service | The backend must communicate with another service using credentials, folder configuration, file metadata, and error handling. If the external file service fails, PMS file features are affected. |
| Designing a large database schema | The system has many entities and relationships. Maintaining data integrity between users, organizations, projects, tasks, chat, files, reports, and audits is complex. |
| Maintaining frontend and backend consistency | API response fields, frontend interfaces, forms, route paths, permissions, and validation rules must stay aligned as features change. |
| Supporting reports and dashboards | Report data must be accurate and collected from multiple modules such as tasks, projects, activities, users, and progress records. |
| Preparing for production deployment | The API, web app, database, cache, file service, JSReport service, environment variables, Docker, Nginx, and CI/CD pipelines all need correct configuration. |
| Testing complex workflows | Features such as authentication, OTP, task creation, task assignment, chat, file upload, and reporting require integration testing, not only small unit tests. |
| Managing multilingual UI | The Angular frontend uses Transloco and Khmer/English UI text, so labels, messages, and report content must remain consistent across languages. |

### Explanation

The main development challenge is integration. PMS is not a single small module; it is a complete project management platform with authentication, user roles, projects, activities, tasks, chat, files, notifications, reports, dashboards, and deployment. Each module depends on other modules, so changes must be tested across the whole workflow.

Another challenge is realtime communication. The project already has a realtime gateway, but making chat and task updates fully live requires careful event design. The backend must know which users should receive updates, and the frontend must update the correct screens without showing stale data.

Deployment is also a challenge because PMS depends on several services. The API, Angular frontend, PostgreSQL database, file service, JSReport, Redis/cache, and environment variables must all work together. A small configuration error can affect login, file upload, reporting, or realtime communication.

## Conclusion

Overall, the PMS project has a strong foundation and many completed core features. Its strongest points are the clear role-based architecture, complete project and task workflow, integrated file/report services, and deployment preparation. The main limitations are incomplete realtime chat broadcasting, disabled database migrations, unfinished settings pages, placeholder frontend pages, partial deployment readiness, and limited automated test coverage.

To improve the system further, the next priorities should be completing the chat WebSocket gateway, enabling proper database migrations, finishing organization settings pages, expanding automated tests, cleaning placeholder pages, and finalizing UAT/production deployment configuration.
