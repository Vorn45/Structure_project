# File Service V3 (`file-v3`)

High-performance Express.js & TypeScript microservice for file upload, storage, preview, and download.

---

## 📁 Architecture & Folder Structure

```text
file-v3/
├── dist/                # Compiled JavaScript code (via npm run build)
├── node_modules/        # Installed dependencies
├── public/              # Static files and file storage
│   └── uploads/         # Uploaded files destination
├── src/
│   ├── configs/         # App and environment configurations
│   ├── controllers/     # Request handlers & file logic
│   ├── database/        # Database storage / persistence
│   ├── exceptions/      # HTTP & custom error exception classes
│   ├── models/          # Data models & interfaces
│   ├── routers/         # API routes & endpoint definitions
│   ├── shared/          # Multer storage, utilities & helpers
│   ├── view/            # Dashboard & UI templates
│   └── main.ts          # Application entry point
├── .dockerignore
├── .env
├── .env.example
├── .gitignore
├── Dockerfile
├── nodemon.json
├── package.json
├── README.md
└── tsconfig.json
```

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
The server will start at `http://localhost:5000`.

### 3. Build & Run in Production
```bash
npm run build
npm start
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Service health status & web test interface |
| `POST` | `/api/v1/files/upload` | Upload a single file (`multipart/form-data`, key: `file`) |
| `POST` | `/api/v1/files/upload-multiple` | Upload multiple files (key: `files`, max: 10) |
| `GET` | `/api/v1/files` | List all uploaded files |
| `GET` | `/api/v1/files/:id` | Get file metadata |
| `GET` | `/api/v1/files/view/:filename` | Stream/preview file inline in browser |
| `GET` | `/api/v1/files/download/:filename` | Download file as attachment |
| `PATCH` / `PUT` | `/api/v1/files/:id/rename` | Rename file (`{"newName": "new_name.png"}`) |
| `DELETE` | `/api/v1/files/:id` | Delete file from disk & storage |
