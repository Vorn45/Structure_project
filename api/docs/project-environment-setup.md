# PMS Project Environment and Tools Setup

## Introduction

To set up the required environment and tools for the PMS project, prepare both applications in the `PMS_project` workspace: the backend API in `api/` and the frontend web app in `web/`. The backend is a NestJS application that uses PostgreSQL, Redis, JWT authentication, OTP, file service integration, Telegram, Google login, and report service integration. The frontend is an Angular application that communicates with the backend API and realtime socket server.

This document explains the tools, environment variables, installation steps, and commands required to run the PMS project locally and prepare it for deployment.

## Required Tools

Install the following tools before running the project:

- **Node.js 20**: Required by both the backend and frontend projects.
- **npm**: Used to install dependencies and run project scripts.
- **PostgreSQL**: Main relational database for PMS data.
- **Redis**: Cache/session support service used by the backend.
- **Git**: Used for source code management.
- **Docker**: Optional for containerized build and deployment.
- **Docker Compose**: Optional for running containers in deployment.
- **Ansible**: Optional for server deployment automation.
- **Angular CLI**: Used by the frontend build and serve commands.
- **NestJS CLI**: Used by the backend build and start commands through project scripts.

## Project Structure

```text
PMS_project/
├── api/   # NestJS backend API
└── web/   # Angular frontend application
```

## Backend API Setup

Go to the backend project directory:

```bash
cd /Users/biney/Documents/PMS_project/api
```

Install backend dependencies:

```bash
npm install
```

Create the backend environment file:

```bash
cp .env.example .env
```

Update `.env` with local values. The most important backend environment variables are:

```env
NODE_ENV=development
ENV=development
SYSTEM_NAME=PMS
ENVIRONMENT=DEVELOPMENT
PORT=3000
GLOBAL_PREFIX=api

DB_CONNECTION=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_database_user
DB_PASSWORD=your_database_password
DB_DATABASE=your_database_name
DB_SYNCHRONIZE=false

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_EXPIRES=1d
JWT_REFRESH_EXPIRES=7d

FILE_BASE_URL=your_file_service_url
FILE_KEY=your_file_key
FILE_USERNAME=your_file_username
FILE_PASSWORD=your_file_password

GOOGLE_CLIENT_ID=your_google_client_id
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

OTP_SMS_API_URL=your_sms_api_url
OTP_SMS_API_TOKEN=your_sms_api_token
OTP_GMAIL_HOST=smtp.gmail.com
OTP_GMAIL_PORT=465
OTP_GMAIL_USER=your_email
OTP_GMAIL_APP_PASSWORD=your_email_app_password
OTP_GMAIL_FROM=your_email

JS_BASE_URL=your_js_report_url
JS_USERNAME=your_js_report_username
JS_PASSWORD=your_js_report_password
```

Run the backend in development mode:

```bash
npm run start:dev
```

The backend runs on:

```text
http://localhost:3000/api
```

## Backend Database Setup

Create a PostgreSQL database that matches `DB_DATABASE` in the API `.env` file.

The backend uses TypeORM entities located in:

```text
api/src/app/model/
```

The database uses multiple PostgreSQL schemas, including:

```text
activity
application
audit
chat
custom_field
file
meeting
notification
organization
project
report
sprint
task
user
```

Run the database setup or seed command when required:

```bash
npm run seeder
```

If a migration/backfill is needed for project file folders, run:

```bash
npm run backfill:project-file-folder-ids
```

Note: migration generation and migration run scripts are disabled in this project. The project expects setup and seed behavior through the seeder scripts.

## Redis Setup

Start Redis locally before running backend features that depend on cache/session behavior:

```bash
redis-server
```

Default Redis configuration used by the backend:

```text
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Frontend Web Setup

Go to the frontend project directory:

```bash
cd /Users/biney/Documents/PMS_project/web
```

Install frontend dependencies:

```bash
npm install --legacy-peer-deps
```

Create the frontend environment file:

```bash
cp .env.example .env
```

Update `.env` with API, file, and socket URLs:

```env
API_BASE_URL=http://localhost:3000/api
FILE_BASE_URL=your_file_service_url
SOCKET_URL=http://localhost:3000
RecaptchaSiteKey=
```

Run the Angular development server:

```bash
npm start
```

The frontend runs on:

```text
http://localhost:4002
```

## Frontend Build

To build the frontend:

```bash
npm run build
```

The Angular build output is created in:

```text
web/dist/
```

In production-style Docker deployment, this `dist` folder is served by Nginx.

## Backend Build and Test Commands

Use these commands from the `api/` directory:

```bash
npm run build
npm run test
npm run test:e2e
npm run lint
npm run format
```

Common backend scripts:

- `npm run start:dev`: Start NestJS in watch mode.
- `npm run build`: Build the backend into `dist/`.
- `npm run start:prod`: Run the compiled backend.
- `npm run seeder`: Run database seed scripts.
- `npm run test`: Run unit tests.
- `npm run test:e2e`: Run end-to-end tests.
- `npm run lint`: Run ESLint with automatic fixes.
- `npm run format`: Format TypeScript files with Prettier.

## Frontend Build and Test Commands

Use these commands from the `web/` directory:

```bash
npm start
npm run build
npm run watch
```

Common frontend scripts:

- `npm start`: Start Angular development server with HMR.
- `npm run build`: Build Angular for production.
- `npm run watch`: Build in watch mode using development configuration.

## Optional Docker Setup

The backend production Dockerfile uses Node.js 20:

```text
api/DockerfileProd
```

The frontend Docker setup builds Angular with Node.js 20 and serves the result with Nginx:

```text
web/Dockerfile
web/DockerfileProd
```

Backend container behavior:

- Installs npm dependencies.
- Builds the NestJS project.
- Starts the compiled application.

Frontend container behavior:

- Builds the Angular project.
- Copies `dist/` into Nginx.
- Serves the frontend as static files.

## Optional Deployment Tools

This project includes GitLab CI/CD and Ansible files for deployment:

```text
api/.gitlab-ci.yml
api/pipelines/
api/ansible/

web/.gitlab-ci.yml
web/pipelines/
web/ansible/
```

In the development deployment files:

- API service type is `api`.
- Web service type is `web`.
- API container name is `pms_api_dev`.
- Web container name is `pms_web_dev`.
- API port mapping is `2410:3000`.
- Web port mapping is `2411:80`.

## External Service Configuration

Some PMS features require external services:

- **File service**: Used for file upload and file access.
- **Google OAuth**: Used for Google login.
- **Telegram**: Used for Telegram login, OTP, and notifications.
- **SMS gateway**: Used for OTP delivery.
- **Gmail SMTP**: Used for email OTP delivery.
- **JS Report service**: Used for report generation.

For local development, these values can be left empty only if the related feature is not being tested. For full system testing, configure all required service credentials in `api/.env` and frontend URLs in `web/.env`.

## Verification Checklist

After setup, verify the project with the following checklist:

1. PostgreSQL is running.
2. Redis is running.
3. Backend `.env` contains database, Redis, JWT, and required integration settings.
4. Backend dependencies are installed.
5. Backend starts successfully with `npm run start:dev`.
6. Frontend `.env` points to the backend API and socket URL.
7. Frontend dependencies are installed.
8. Frontend starts successfully with `npm start`.
9. Browser can open `http://localhost:4002`.
10. Frontend can call `http://localhost:3000/api`.

## Summary

To set up the PMS project, install Node.js 20, npm, PostgreSQL, Redis, and optional deployment tools such as Docker and Ansible. Configure the backend `.env` file for database, JWT, Redis, OTP, file service, Google, Telegram, and report service settings. Configure the frontend `.env` file with API, file, and socket URLs. Start the backend from `api/` using `npm run start:dev`, then start the frontend from `web/` using `npm start`. Once both applications are running, PMS can be accessed from the browser at `http://localhost:4002`.

