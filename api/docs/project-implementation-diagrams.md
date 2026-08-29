# PMS Project Implementation Diagrams

## Introduction

The PMS project is implemented with several important backend and frontend logic flows. These flows are more specialized than normal CRUD operations because they connect multiple modules, servers, services, and database tables. The most important special implementations in PMS are authentication with OTP, realtime task updates, task chat, file upload, report generation, and automated deployment.

This document provides implementation diagrams and explanations for these special parts of the PMS project. The diagrams are based on the actual `PMS_project` structure, including the Angular frontend in `web/` and the NestJS backend in `api/`.

## 1. Authentication and OTP Implementation

### Diagram

```mermaid
flowchart TD
    A[User opens PMS login page] --> B[Angular Auth Module]
    B --> C[Send login request to NestJS Auth API]
    C --> D[Validate username/password or external login]
    D --> E{OTP required?}

    E -->|No| F[Create JWT and refresh token]
    F --> G[Create user session and device tracking]
    G --> H[Return authenticated user data]
    H --> I[Angular stores access token]
    I --> J[User enters PMS dashboard]

    E -->|Yes| K[Create OTP challenge]
    K --> L[Store OTP token in user_otp table]
    L --> M[User selects enabled OTP channel]
    M --> N{OTP channel}
    N -->|Phone| O[Send OTP through SMS gateway]
    N -->|Email| P[Send OTP through Gmail SMTP]
    N -->|Telegram| Q[Send OTP through Telegram service]
    O --> R[User submits OTP]
    P --> R
    Q --> R
    R --> S[Verify OTP token and OTP code]
    S --> T{OTP valid and not expired?}
    T -->|No| U[Return invalid or expired OTP error]
    T -->|Yes| V[Delete used OTP record]
    V --> F
```

### Explanation

The authentication logic is handled by the backend auth modules and shared OTP services. The Angular frontend sends login requests to the backend. The backend validates the login method, checks whether OTP is required, and either returns tokens immediately or creates an OTP challenge.

The OTP implementation uses `OtpService` and `OtpDeliveryService`. OTP settings are stored per user, and users can enable phone, email, or Telegram OTP. OTP records are stored temporarily in the `user_otp` table with an expiry time. After successful verification, the OTP record is deleted so it cannot be reused.

This implementation improves account security because sensitive login and password reset actions can require a second verification step.

## 2. Realtime Task Update Implementation

### Diagram

```mermaid
flowchart TD
    A[Angular PMS App starts] --> B[TaskSocketService]
    B --> C[Connect to Socket.IO namespace /realtime]
    C --> D[Send JWT in socket handshake auth token]
    D --> E[NestJS RealtimeGateway]
    E --> F{JWT valid?}
    F -->|No| G[Disconnect socket]
    F -->|Yes| H[Extract user id from JWT]
    H --> I[Join private room user:id]

    J[Task is created or updated] --> K[TaskService or HomeService]
    K --> L[Call RealtimeGateway.emitToUsers]
    L --> M[Send task:updated event to affected user rooms]
    M --> N[Angular receives task update event]
    N --> O[Refresh task list, task status, or dashboard data]
```

### Explanation

PMS uses a dedicated realtime gateway for live task updates. The frontend service `TaskSocketService` connects to the backend Socket.IO namespace `/realtime` and sends the same JWT used for HTTP authentication.

The backend `RealtimeGateway` verifies the JWT during socket connection. If the token is valid, the socket joins a private room named `user:<id>`. Backend services can then emit events only to affected users. For example, when a task is created or assigned, the backend emits `task:updated` to the reporter and assignees.

This implementation prevents the frontend from constantly polling the server and allows task changes to appear quickly for users who are affected by the change.

## 3. Task Chat Implementation

### Diagram

```mermaid
flowchart TD
    A[User opens task chat] --> B[Angular task/project chat UI]
    B --> C[Request chat room detail]
    C --> D[ChatRoomService validates task and project access]
    D --> E{User has access?}
    E -->|No| F[Return forbidden response]
    E -->|Yes| G[Find task chat room]
    G --> H[Ensure current user is ChatMember]
    H --> I[Mark chat room as read]
    I --> J[Load messages, members, attachments, and system logs]
    J --> K[Return chat timeline]

    L[User sends message] --> M[Send content, reply id, and files]
    M --> N[Validate room access and membership]
    N --> O{Content or file exists?}
    O -->|No| P[Reject empty message]
    O -->|Yes| Q[Start transaction]
    Q --> R[Create ChatMessage]
    R --> S{Files included?}
    S -->|Yes| T[Upload files through FileService]
    T --> U[Create ChatAttachment records]
    S -->|No| V[Skip attachment step]
    U --> W[Update room last_message_at]
    V --> W
    W --> X[Create notifications for other non-muted members]
    X --> Y[Commit transaction]
    Y --> Z[Emit chat room update event]
    Z --> AA[Return created message]
```

### Explanation

Task chat is implemented with `ChatRoomService`, `TaskChatRoomService`, and the chat entities. Each task can have a chat room with `type = task`. When a task is created, PMS ensures a matching chat room exists and adds the task creator and assignees as chat members.

When users open a chat, the backend validates that the task and project exist and that the user has access. If the user has project access but is not yet a chat member, PMS automatically adds the user as a member. The chat timeline includes normal chat messages and system messages from task activity logs and project audit logs.

When a message is sent, the backend saves the message and attachments inside a transaction, updates the room activity time, creates notifications for other members, and emits a chat update event. This keeps task discussion connected directly to the task workflow.

## 4. File Upload Implementation

### Diagram

```mermaid
flowchart TD
    A[User uploads file or image] --> B[Angular upload component]
    B --> C[NestJS controller receives multipart file or base64 image]
    C --> D[Validate file type and size]
    D --> E[FileService]
    E --> F[Build Basic Auth headers from FILE_USERNAME and FILE_PASSWORD]
    F --> G[Find or create folder in external file service]
    G --> H[Upload file to external file server]
    H --> I[Receive uploaded file URI and metadata]
    I --> J[Store metadata in file.file table]
    J --> K[Create feature attachment record]
    K --> L[Return file information to frontend]
```

### Explanation

PMS separates actual file storage from PMS business data. The backend `FileService` communicates with the external file service using environment variables such as `FILE_BASE_URL`, `FILE_USERNAME`, `FILE_PASSWORD`, `FILE_UPLOAD_PROJECT_ID`, and `FILE_UPLOAD_FOLDER_ID`.

After a file is uploaded externally, PMS stores the file metadata in the internal `file.file` table. Feature-specific attachment tables then link the file to tasks, activities, chat messages, projects, users, or other modules.

This implementation keeps the PMS database focused on metadata and relationships while the file service handles physical file storage.

## 5. Report Generation Implementation

### Diagram

```mermaid
flowchart TD
    A[User requests report] --> B[Angular report screen]
    B --> C[NestJS report controller]
    C --> D[Report service collects PMS data]
    D --> E[Build report payload]
    E --> F[JsReportService]
    F --> G[Send template name and data to JS Report server]
    G --> H{Requested output type}
    H -->|Base64| I[Return base64 report]
    H -->|Stream| J[Return report stream]
    H -->|Buffer| K[Return report buffer]
    H -->|Image preview| L[Return PNG image buffer]
    I --> M[Frontend downloads or displays report]
    J --> M
    K --> M
    L --> M
```

### Explanation

Report generation is implemented through `JsReportService`. PMS collects report data from tasks, projects, activities, users, and performance services, then sends that data to the JS Report server. The report service is configured by `JS_BASE_URL`, `JS_USERNAME`, and `JS_PASSWORD`.

The implementation supports multiple output modes, including base64, stream, buffer, and image preview. This allows different report screens to download PDFs, preview report images, or handle generated files in memory.

## 6. Deployment Implementation

### Diagram

```mermaid
flowchart TD
    A[Developer pushes code to GitLab dev branch] --> B[GitLab CI/CD pipeline starts]
    B --> C{Project}
    C -->|api| D[API pipeline loads environment variables]
    C -->|web| E[Web pipeline loads environment variables]

    D --> F[Run API deployment script]
    F --> G[Ansible connects to deployment server]
    G --> H[Clone API repository into app directory]
    H --> I[Build Docker image from api/DockerfileProd]
    I --> J[Start pms_api_dev container]
    J --> K[Expose API on port 2410 mapped to 3000]

    E --> L[Install frontend dependencies]
    L --> M[Build Angular dist]
    M --> N[Ansible syncs dist to server]
    N --> O[Start pms_web_dev Nginx container]
    O --> P[Expose web on port 2411 mapped to 80]
```

### Explanation

The PMS project includes deployment automation for both `api/` and `web/`. GitLab CI/CD starts deployment jobs for the `dev` branch. The API deployment uses Ansible and Docker Compose to build and run the NestJS backend container. The frontend deployment builds the Angular `dist` folder and serves it using an Nginx container.

The development deployment configuration uses the target server IP `217.15.164.171`. The API container is named `pms_api_dev` and maps `2410:3000`. The web container is named `pms_web_dev` and maps `2411:80`.

This deployment implementation separates source code, build steps, and runtime containers, making the project easier to deploy consistently.

## Summary

The PMS project contains several important implementation flows beyond basic CRUD. Authentication uses JWT and OTP channels. Realtime task updates use Socket.IO and private user rooms. Task chat combines chat messages, attachments, notifications, and activity logs. File upload uses an external file service while storing metadata in PMS. Reports are generated through JS Report. Deployment uses GitLab CI/CD, Ansible, Docker, Node.js, and Nginx.

Together, these implementations support the main PMS features: secure login, live task updates, task-based collaboration, document handling, reporting, and repeatable deployment.

