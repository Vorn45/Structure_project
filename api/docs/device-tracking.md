# Device Tracking System

## Overview

The device tracking system records the device and network context used to access a user account. `UserDevice` stores the latest known state of a stable device, while `LoginHistory` (`user_session_log`) stores an immutable snapshot of each login.

This provides:

- Account security visibility and suspicious-login investigation.
- A current list of devices and active sessions.
- Historical IP, location, browser, OS, and device evidence.
- Reliable `last_activity_at` values for session management.

Passwords, OTP values, access tokens, and refresh tokens are never stored in device or login-history records.

## Features Implemented

- User-Agent parsing with `ua-parser-js`.
- Browser name and major-version detection.
- OS name and version detection.
- Device vendor, model, and type detection.
- Desktop fallback when the User-Agent has no device type.
- Stable client-provided or SHA-256 generated device IDs.
- Proxy-aware IP detection and localhost normalization.
- Geo-location lookup with `geoip-lite`.
- Reusable device and session upsert logic.
- Immutable login-history snapshots.
- Last-activity updates during login, OTP verification, and refresh.
- Session deactivation during logout.

## Architecture

```text
Login request
    |
    v
DeviceTrackingService
    |
    +--> User-Agent parsing
    +--> Client IP detection
    +--> GeoIP lookup
    +--> Stable device_id
    |
    v
Upsert UserDevice
    |
    v
Upsert Session
    |
    v
Save LoginHistory snapshot
```

```text
User (1)
  |
  +----< UserDevice (many)
  |          |
  |          +----< Session (many/current activity)
  |          |
  |          +----< LoginHistory (many/immutable audit events)
  |
  +----< Session
  +----< LoginHistory
```

The reusable implementation is in `src/common/service/device-tracking.service.ts`. Authentication services call it instead of implementing their own parsing, IP, location, or persistence rules.

## Database Changes

### `user_devices`

Purpose: latest known state for each stable user device.

Columns added:

- `ip varchar(45) null`
- `country_code varchar(10) null`
- `region varchar(100) null`
- `city varchar(100) null`
- `latitude numeric(10,7) null`
- `longitude numeric(10,7) null`
- `timezone varchar(100) null`
- `last_activity_at timestamp null`

Index/constraint:

- Unique partial index on `(user_id, device_id)` for active, non-null device IDs.
- Existing duplicate device references are reassigned to the newest device before duplicates are soft-deleted.
- `user_id` continues to reference `user.id`.

Example:

```sql
CREATE UNIQUE INDEX "IDX_user_devices_user_id_device_id"
ON "user_devices" ("user_id", "device_id")
WHERE "deleted_at" IS NULL AND "device_id" IS NOT NULL;
```

### `user_session`

Purpose: current session state for a device.

No new columns were required. Existing fields are now updated consistently:

- `user_device_id`
- `ip`
- `country_code`, `region`, `city`
- `latitude`, `longitude`, `timezone`
- `last_activity_at`
- `is_active`
- `logged_out_at`

### `user_session_log`

Purpose: immutable login-history snapshot.

Columns added:

- `device_id varchar(255) null`
- `country_code varchar(10) null`
- `region varchar(100) null`
- `city varchar(100) null`
- `latitude numeric(10,7) null`
- `longitude numeric(10,7) null`
- `timezone varchar(100) null`
- `device_name varchar(255) null`
- `platform varchar(50) null`
- `os varchar(50) null`
- `browser varchar(100) null`
- `device_type varchar(50) null`
- `user_agent text null`

Example history record:

```sql
{
  user_id: 42,
  user_device_id: 8,
  device_id: "9b8b...sha256",
  ip: "203.0.113.25",
  country_code: "KH",
  region: "Phnom Penh",
  city: "Phnom Penh",
  timezone: "Asia/Phnom_Penh",
  device_name: "Chrome on macOS",
  platform: "Apple",
  os: "macOS 15.6",
  browser: "Chrome 149",
  device_type: "desktop",
  created_at: "2026-06-19T08:00:00.000Z"
}
```

Schema changes are in `1770000000042-ImproveDeviceTracking.ts`.

## API Flow

### Login

`POST /auth/login`

After password validation:

- Parses device metadata.
- Resolves IP and location.
- Upserts `UserDevice`.
- Creates or updates the session.
- Creates a login-history snapshot.
- Generates and sends the OTP.

### Verify Login / OTP

`POST /auth/otp`

After OTP validation:

- Re-evaluates request metadata.
- Updates the same device and session.
- Updates `last_activity_at`.
- Returns the detected device in the response.
- Does not create a duplicate history row for the same password/OTP login sequence.

The client should send the same `device_id` during login and OTP verification when it manages its own ID.

### Refresh Token

`POST /auth/refresh`

- Validates the refresh token.
- Upserts/touches the current device and session.
- Updates IP, location, metadata, and `last_activity_at`.
- Does not create a login-history row.

### Logout

`POST /auth/logout`

- Requires the access token in `Authorization: Bearer <token>`.
- Resolves the device from `device_id` or the generated fingerprint.
- Sets matching active sessions to `is_active = false`.
- Sets `logged_out_at` and updates `last_activity_at`.

Telegram login also uses the same tracking service and creates a login-history snapshot.

## Device Identification Strategy

The API first checks:

1. `x-device-id` request header.
2. `device_id` request body.
3. Generated fallback ID.

The fallback is a SHA-256 hash of:

- User ID.
- Normalized IP.
- User-Agent.
- Platform.
- OS.
- Browser.

Only the resulting hash is stored as `device_id`; the raw fingerprint source is not stored as a combined value. The User-Agent is stored separately as device metadata for auditing.

Duplicate devices are detected by `(user_id, device_id)`. Existing records receive updated metadata, location, IP, and activity time. A new record is created when no match exists. A database unique index protects this rule during concurrent logins.

## IP Detection Strategy

Priority:

1. `x-forwarded-for` first address.
2. `x-real-ip`.
3. `req.ip`.
4. `req.socket.remoteAddress`.

Examples:

```text
x-forwarded-for: 203.0.113.25, 10.0.0.10
result: 203.0.113.25

x-real-ip: 198.51.100.9
result: 198.51.100.9

socket.remoteAddress: ::1
result: 127.0.0.1

socket.remoteAddress: ::ffff:127.0.0.1
result: 127.0.0.1
```

When deployed behind Nginx or a load balancer, set `TRUST_PROXY` to the trusted hop count or subnet, for example:

```env
TRUST_PROXY=1
```

Only trust infrastructure-controlled proxies. Forwarding headers can be spoofed when the application is directly reachable by untrusted clients.

## Location Detection Strategy

`geoip-lite` performs a local database lookup for public IP addresses. A successful result can provide country code, region, city, coordinates, and timezone.

Location remains null for:

- `127.0.0.1` / localhost.
- RFC1918 private IPv4 networks.
- Link-local addresses.
- Private/link-local IPv6 addresses.
- Missing or unknown GeoIP records.
- Lookup errors.

Local and private addresses are not globally routable, so they cannot identify a public country or city. Production requests normally produce location data when the application receives the real public client IP through correctly configured proxies.

GeoIP country codes are stored in the database. API detail responses also convert known codes to English country names, such as `KH` to `Cambodia`.

## Known Limitations

- Postman commonly sends `PostmanRuntime/...`, not a browser/OS User-Agent, so browser, OS, vendor, and model can be `Unknown`.
- VPN and corporate proxy users can appear at the VPN/proxy location.
- Mobile browsers can intentionally hide or reduce model and OS details.
- Modern browser User-Agent reduction can report a generalized OS version.
- GeoIP data is approximate and can be missing or outdated.
- A generated fallback ID can change when the IP or User-Agent changes. Clients should provide a persistent random `device_id` for the most stable result.

## Security Considerations

- Passwords, OTP values, access tokens, and refresh tokens are never written to device/history tables.
- Generated device IDs use SHA-256 so the combined fingerprint source is not exposed.
- A device hash is an identifier, not an authentication secret.
- User-Agent and IP data are personal data in many jurisdictions. Restrict access to authorized administrators.
- Define retention rules for login history. A common starting point is 90–365 days, depending on audit and legal requirements.
- Consider periodically updating the GeoIP database package.
- Configure trusted proxies narrowly and reject untrusted forwarding headers at the edge.

## Testing Guide

### Browser Login

Send a Chrome/Safari/Firefox browser request through login and OTP.

Expected:

- One `user_devices` row.
- One active `user_session` row.
- One `user_session_log` row from login.
- Browser, OS, platform, type, and name are populated.

### Mobile Login

Use a real mobile browser or mobile User-Agent.

Expected:

- `device_type` is `mobile` or `tablet`.
- Vendor/model are used by parsing when available.
- Name remains browser-oriented, for example `Mobile Safari on iOS`.

### Postman Login

Use the default `PostmanRuntime` User-Agent.

Expected:

- IP and device ID are still stored.
- `device_type` defaults to `desktop`.
- Browser/OS can be `Unknown`.
- Set a real browser User-Agent manually to test browser parsing.

### Localhost Login

Call the API from the same machine.

Expected:

- IP is normalized to `127.0.0.1`.
- Country, region, city, coordinates, and timezone are null.
- No GeoIP error is thrown.

### Production Login

Call through the configured Nginx/load balancer with a public client IP.

Expected:

- The first trusted `x-forwarded-for` address is stored.
- Available GeoIP fields are populated.
- `TRUST_PROXY` matches the deployment topology.

### Existing Device Login

Repeat login with the same user and `device_id`.

Expected:

- No second active `user_devices` row.
- Device metadata, IP, location, and `last_activity_at` are updated.
- A new login-history snapshot is created.

### New Device Login

Login with a different client `device_id`.

Expected:

- A new `user_devices` row.
- A session linked through the new `user_device_id`.
- A new login-history snapshot.

Recommended database checks:

```sql
SELECT * FROM user_devices WHERE user_id = 42 ORDER BY last_activity_at DESC;
SELECT * FROM user_session WHERE user_id = 42 ORDER BY last_activity_at DESC;
SELECT * FROM user_session_log WHERE user_id = 42 ORDER BY created_at DESC;
```

## Sample Responses

### Browser Login

```json
{
  "name": "Chrome on macOS",
  "platform": "Apple",
  "os": "macOS 15.6",
  "browser": "Chrome 149",
  "device_type": "desktop",
  "ip": "203.0.113.25",
  "country": "Cambodia",
  "country_code": "KH",
  "region": "Phnom Penh",
  "city": "Phnom Penh",
  "timezone": "Asia/Phnom_Penh"
}
```

### Localhost Login

```json
{
  "name": "Chrome on macOS",
  "platform": "Apple",
  "os": "macOS 15.6",
  "browser": "Chrome 149",
  "device_type": "desktop",
  "ip": "127.0.0.1",
  "country": null,
  "country_code": null,
  "region": null,
  "city": null,
  "timezone": null
}
```
