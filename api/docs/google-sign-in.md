# Google Sign-In

Google Sign-In is an additional authentication method. Password, OTP, Telegram,
access-token, refresh-token, role, device, and login-history behavior remain
unchanged.

## Configuration

Backend `.env`:

```env
GOOGLE_CLIENT_ID=366642157067-22ps42co5pvo9uktbn1feg9t5rsivq5c.apps.googleusercontent.com
```

The Angular frontend must expose the same value in its build environment as
`GOOGLE_CLIENT_ID`. Add the frontend origin to the OAuth client's authorized
JavaScript origins in Google Cloud Console.

## API flow

1. Angular renders Google Identity Services and receives an ID-token
   `credential` from Google.
2. Angular sends `POST /auth/google` with `{ "credential": "..." }`.
3. `GoogleAuthService` verifies the signature, expiry, audience, and verified
   email using `google-auth-library`.
4. The API finds the user by Google `sub`, links a matching verified email, or
   creates an account with only the `user` role.
5. `AuthSessionService` creates the same access token, refresh token, device,
   login-history, user DTO, and response shape used by password login.

Run `npm run migrate` when deploying the entity changes. The migration adds
nullable `google_id`, `email_verified` with a false default, and the `google`
provider value without changing existing users.
