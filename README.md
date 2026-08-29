# Project Structure & Security System

Clean full-stack project structure featuring Angular 18 frontend and NestJS API backend with enterprise security and authentication architecture.

---

## 📁 Repository Structure

```
├── api/            # NestJS Backend API (PostgreSQL + TypeORM, Auth, Passkeys, WebAuthn, OTP, 2FA)
├── web/            # Angular 18 Frontend (Tailwind CSS, Material, Transloco i18n, Security UI)
└── .agents/        # AI Coding Agent Skills and Guidelines
```

---

## 🚀 Getting Started

### 1. API (Backend)
```bash
cd api
npm install
npm run seeder
npm run start:dev
```
- API Base URL: `http://localhost:3000/api`

### 2. Web (Frontend)
```bash
cd web
npm install
npm start
```
- Web Application: `http://localhost:4200`

---

## 🔐 Security Features
- **Multi-Factor Authentication (2FA)**: Google Authenticator (TOTP), Email OTP, Telegram OTP.
- **Passkeys (WebAuthn / FIDO2)**: Hardware security keys & biometric login.
- **Local Screen Lock**: 6-digit passcode lock guard.
- **Session & Device Management**: Active token tracking and session revocation.
