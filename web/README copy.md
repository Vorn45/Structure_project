# TMS — Web Frontend

Angular 18 web application for the Transport Management System, built on the CamCyber admin template.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Angular 18 |
| UI | Angular Material 18 + Tailwind CSS |
| Charts | ApexCharts, Chart.js, ECharts |
| Real-time | Socket.IO |
| i18n | Transloco |
| PDF / Export | jsPDF, FileSaver, JSZip |

## Prerequisites

- Node.js 20+
- npm 9+

## Getting Started

```bash
# Install dependencies
npm install --legacy-peer-deps

# Copy and fill in environment variables
cp .env.example .env

# Start dev server with HMR
npm start
```

The app runs at `http://localhost:4200` by default.

## Environment Variables

| Variable | Description |
|---|---|
| `API_BASE_URL` | Backend REST API base URL |
| `FILE_BASE_URL` | File/media server base URL |
| `SOCKET_URL` | WebSocket server URL |
| `RecaptchaSiteKey` | Google reCAPTCHA v2/v3 site key |

## Build

```bash
# Production build
npm run build
```

Output is written to `dist/`.

## Docker

```bash
docker build \
  --build-arg API_BASE_URL=https://api.example.com \
  --build-arg FILE_BASE_URL=https://files.example.com \
  --build-arg SOCKET_URL=https://ws.example.com \
  -t tms-web .
```

The image serves the built app via Nginx.

## Project Structure

```
src/app/
├── core/               # Auth guards, interceptors, user service
├── layout/             # Shell layout, notifications, language switcher
└── resources/
    ├── 1-account/      # Sign-in, sign-up, OTP, password reset, profile
    └── r2-admin/
        ├── a1-home/    # Dashboard & charts
        ├── a2-invoice/ # Invoice viewer
        ├── a3-customer/# Customer management
        ├── a4-bank/    # Bank configuration
        ├── a5-org/     # Organisation management
        ├── a6-setting/ # App settings
        ├── p2-operation/ # Operations (CRUD)
        ├── p3-invoice/ # Invoice management (CRUD)
        ├── p4-price/   # Pricing & indicators
        └── p5-user/    # User management
```

## License

Private — CamCyber Digital Tech Team
