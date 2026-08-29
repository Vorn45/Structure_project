# QR Login Flow

QR login lets a logged-in user create a short-lived QR token, then another client can scan that token one time to receive normal JWT login tokens.

This flow does not expose phone number or password. The QR only contains a one-time `qr_token`.

## 1. Create QR Login

```http
GET /account/profile/qr-login
Authorization: Bearer {{token}}
```

The user must already be logged in. Backend creates a pending QR login session for that user.

Response:

```json
{
  "response_code": 200,
  "response_msg": "Success",
  "data": {
    "qr_token": "...",
    "status": "pending",
    "expires_at": "2026-06-29T..."
  }
}
```

Frontend should build the QR value from `data.qr_token`, then convert that value to a QR image.

Example:

```ts
const qrValue = `pms://qr-login?token=${qr_token}`;
```

When creating a new QR login, old pending QR sessions for the same user are changed to `expired`.

## 2. Check QR Status

```http
GET /account/profile/qr-login/status?qr_token={{qr_token}}
```

This route is public.

Possible statuses:

```txt
pending
used
expired
```

Response:

```json
{
  "response_code": 200,
  "response_msg": "Success",
  "data": {
    "status": "pending",
    "expires_at": "2026-06-29T...",
    "used_at": null
  }
}
```

## 3. Scan QR Login

```http
POST /account/profile/qr-login/scan
```

Body:

```json
{
  "qr_token": "{{qr_token}}"
}
```

This route is public.

Backend checks:

```txt
qr_token exists
status is pending
token is not expired
token has not been used before
```

If valid, backend changes status from `pending` to `used` and returns login tokens.

Response:

```json
{
  "response_code": 200,
  "response_msg": "QR login successful",
  "data": {
    "status": "used",
    "user": {}
  },
  "token": "...",
  "refresh_token": "..."
}
```

If the same QR is scanned again, backend returns an error because the QR is no longer pending.

## Full Frontend Flow

1. Logged-in browser calls `GET /account/profile/qr-login`.
2. Frontend builds QR value from `data.qr_token` and renders it as QR image.
3. Scanner reads `pms://qr-login?token=...`.
4. Scanner calls `POST /account/profile/qr-login/scan`.
5. Backend marks QR as `used`.
6. Scanner receives `token` and `refresh_token`.
7. Any second scan fails.
8. To login again, call `GET /account/profile/qr-login` again to create a new QR.

## Postman Testing

Use these requests in `PMS Member APIs.postman_collection.json`:

```txt
1-account / 2-profile / QR Login / Create QR Login
1-account / 2-profile / QR Login / QR Login Status
1-account / 2-profile / QR Login / Scan QR Login
```

`Create QR Login` saves `qr_token` into collection variables automatically.

## Database

Table:

```txt
qr_login_session
```

Important fields:

```txt
user_id
qr_token
status
expires_at
used_at
created_at
updated_at
```

Migration:

```txt
1770000000053-CreateQrLoginSession.ts
```

Run:

```bash
npm run migration:run
```
