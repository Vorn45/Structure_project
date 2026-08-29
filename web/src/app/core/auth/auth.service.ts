import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { env } from 'envs/env';
import { catchError, finalize, map, Observable, of, ReplaySubject, shareReplay, switchMap, tap, throwError } from 'rxjs';
import type { AuthenticationResponseJSON, PublicKeyCredentialCreationOptionsJSON, PublicKeyCredentialRequestOptionsJSON, RegistrationResponseJSON } from '@simplewebauthn/browser';
import type { PasskeyCredentialSummary } from 'app/resources/1-account/2-profile/profile.type';
import { ResponseLogin, ResponseSingUp, ResponseSuccessfullLogin, SignUpChallenge, SignUpVerification } from './auth.types';
import { AuthUtils } from './auth.utils';
import { getRoleDefaultUrl, pickPrimaryRole, pickRoleByOrganizationName, resolveActiveRole } from './resolvers/role.util';
import jwt_decode from 'jwt-decode';
import { FcmService } from 'app/core/notification/fcm.service';
import { LocalPasscodeService } from 'app/core/local-passcode/local-passcode.service';

@Injectable({ providedIn: 'root' })
export class AuthService {

    private readonly _refreshSessionKey = 'hasRefreshSession';

    private _httpClient = inject(HttpClient);
    private _fcmService = inject(FcmService);
    private _localPasscodeService = inject(LocalPasscodeService);
    private _authenticated: boolean = false;
    private _username: ReplaySubject<{ username: string }> = new ReplaySubject<{ username: string }>(1);
    private _token: ReplaySubject<{ token: string }> = new ReplaySubject<{ token: string }>();
    private _refreshTokenInProgress: Observable<ResponseLogin> | null = null;
    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------
    /**
     * Setter & getter for access token
     */
    set accessToken(access_token: string) {
        if (!access_token || access_token === 'undefined' || access_token === 'null') {
            localStorage.removeItem('accessToken');
        } else {
            localStorage.setItem('accessToken', access_token);
            localStorage.setItem(this._refreshSessionKey, 'true');
        }
    }

    get accessToken(): string {
        const token = localStorage.getItem('accessToken');

        if (!token || token === 'undefined' || token === 'null' || token.trim() === '') {
            localStorage.removeItem('accessToken');
            return '';
        }

        return token;
    }

    /**
     * Setter & getter for refresh token
     */
    set refreshToken(refresh_token: string) {
        if (!refresh_token || refresh_token === 'undefined' || refresh_token === 'null') {
            localStorage.removeItem('refreshToken');
        } else if (refresh_token.startsWith('pms_rt_')) {
            // Opaque refresh tokens belong in the HttpOnly cookie set by the
            // API. Never persist them in JavaScript-readable storage.
            localStorage.removeItem('refreshToken');
            localStorage.setItem(this._refreshSessionKey, 'true');
        } else {
            // Temporary migration support for refresh JWTs issued by an older API.
            localStorage.setItem('refreshToken', refresh_token);
            localStorage.setItem(this._refreshSessionKey, 'true');
        }
    }

    get refreshToken(): string {
        const token = localStorage.getItem('refreshToken');

        if (!token || token === 'undefined' || token === 'null' || token.trim() === '') {
            localStorage.removeItem('refreshToken');
            return '';
        }

        return token;
    }

    get hasRefreshSession(): boolean {
        return (
            localStorage.getItem(this._refreshSessionKey) === 'true' ||
            !!this.refreshToken
        );
    }



    set username(value: { username: string }) {
        this._username.next(value)
    }

    get username$(): Observable<{ username: string }> {
        return this._username.asObservable();
    }

    set token(value: { token: string }) {
        this._token.next(value)
    }

    get token$(): Observable<{ token: string }> {
        return this._token.asObservable();
    }
    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Sign in
     *
     * @param credentials
    */
    // Method to sign in a user in the POS system
    signIn(credentials: { username: string; password: string }): Observable<ResponseLogin> {
        // Set default platform to "Web" if not provided
        const { username, password } = credentials;

        const requestBody = {
            username,
            password,
        };

        return this._httpClient.post<ResponseLogin>(`${env.API_BASE_URL}/auth/login`, requestBody).pipe(
            switchMap((response: ResponseLogin) => {
                this.accessToken = response.token; // Store the access token
                if (!response.requires_otp && response.token) {
                    if (response.refresh_token) {
                        this.refreshToken = response.refresh_token;
                    }
                    this._setDefaultRole(response.token);
                    void this._fcmService.registerForCurrentUser();
                }

                return of(response); // Return the response as a new observable
            }),
        );
    }

    /**
     * Exchange the stored refresh token for a new access token + refresh token.
     * Concurrent callers share a single in-flight request instead of firing one each.
     */
    refreshAccessToken(): Observable<ResponseLogin> {
        if (this._refreshTokenInProgress) {
            return this._refreshTokenInProgress;
        }

        let refresh_token = this.refreshToken;
        if (refresh_token) {
            try {
                if (
                    refresh_token.startsWith('pms_rt_') ||
                    AuthUtils.isTokenExpired(refresh_token)
                ) {
                    this.refreshToken = '';
                    refresh_token = '';
                }
            } catch {
                this.refreshToken = '';
                refresh_token = '';
            }
        }
        if (!refresh_token && !this.hasRefreshSession) {
            return throwError(() => new Error('No valid refresh token available'));
        }

        this._refreshTokenInProgress = this._httpClient
            .post<ResponseLogin>(
                `${env.API_BASE_URL}/auth/refresh`,
                refresh_token ? { refresh_token } : {},
                { withCredentials: true },
            )
            .pipe(
                tap((response: ResponseLogin) => {
                    this.accessToken = response.token;
                    if (response.refresh_token) {
                        this.refreshToken = response.refresh_token;
                    }
                }),
                catchError((error) => {
                    this.accessToken = '';
                    this.refreshToken = '';
                    localStorage.removeItem(this._refreshSessionKey);
                    return throwError(() => error);
                }),
                shareReplay(1),
                finalize(() => {
                    this._refreshTokenInProgress = null;
                }),
            );

        return this._refreshTokenInProgress;
    }

    /**
     * `mode` tells the backend which screen asked: 'login' refuses an unknown
     * Google address, 'signup' enrols it.
     */
    signInWithGoogle(accessToken: string, mode: 'login' | 'signup' = 'login'): Observable<ResponseLogin> {
        const url = `${env.API_BASE_URL}/auth/google`;
        const post = (body: Record<string, unknown>) => this._httpClient.post<ResponseLogin>(url, body);

        return post({ access_token: accessToken, mode })
            .pipe(
                // An API that predates `mode` may reject the unknown field.
                // Retrying without it keeps Google sign-in working there, at
                // the cost of that server's own (auto-create) behaviour.
                catchError((error) => {
                    const rejectedTheField =
                        (error?.status === 400 || error?.status === 422) &&
                        JSON.stringify(error?.error?.message ?? '').includes('mode');

                    return rejectedTheField
                        ? post({ access_token: accessToken })
                        : throwError(() => error);
                }),
                switchMap((response: ResponseLogin) => {
                    // Signing up holds the session back: storing the token here
                    // makes NoAuthGuard evict the user from the sign-up page
                    // before they have filled in their details.
                    if (mode !== 'signup') this.applySession(response);
                    return of(response);
                }),
            );
    }

    /**
     * Exchange a CDC SSO (Keycloak) access token for a PMS session. `mode`
     * mirrors Google: 'login' refuses an unknown identity, 'signup' provisions
     * it. On success the backend returns a PMS-issued token, same as any login.
     */
    signInWithSso(accessToken: string, mode: 'login' | 'signup' = 'login'): Observable<ResponseLogin> {
        const url = `${env.API_BASE_URL}/auth/sso`;
        const post = (body: Record<string, unknown>) => this._httpClient.post<ResponseLogin>(url, body);

        return post({ access_token: accessToken, mode })
            .pipe(
                catchError((error) => {
                    const rejectedTheField =
                        (error?.status === 400 || error?.status === 422) &&
                        JSON.stringify(error?.error?.message ?? '').includes('mode');

                    return rejectedTheField
                        ? post({ access_token: accessToken })
                        : throwError(() => error);
                }),
                switchMap((response: ResponseLogin) => {
                    if (mode !== 'signup') this.applySession(response);
                    return of(response);
                }),
            );
    }

    /**
     * Persists a session the caller was holding on to (the Google sign-up
     * flow), exactly as a normal sign-in would.
     */
    applySession(response: ResponseLogin): void {
        this.accessToken = response.token;
        if (response.refresh_token) {
            this.refreshToken = response.refresh_token;
        }
        this._setDefaultRole(response.token);
        void this._fcmService.registerForCurrentUser();
    }

    /**
     * Sign in using the Telegram Mini App launch parameters. `init_data` must be
     * the raw, still-encoded string from Telegram — its signature covers that
     * exact text, so it cannot be parsed or re-encoded before sending.
     */
    signInWithMiniApp(init_data: string): Observable<ResponseLogin> {
        return this._httpClient
            .post<ResponseLogin>(`${env.API_BASE_URL}/auth/mini-app`, { init_data })
            .pipe(
                switchMap((response: ResponseLogin) => {
                    this.applySession(response);
                    return of(response);
                }),
            );
    }

    /** Discoverable/resident-key flow: no username is submitted, the server
     *  returns options with no `allowCredentials`, so the browser's own
     *  account picker offers every passkey stored for this site. */
    getPasskeyLoginOptions(): Observable<{ options: PublicKeyCredentialRequestOptionsJSON; challenge_token: string }> {
        return this._httpClient
            .post<{ options: Record<string, unknown>; challenge_token: string }>(
                `${env.API_BASE_URL}/auth/passkey/login-options`,
                {},
            )
            .pipe(
                map((response) => ({
                    options: this._toCamelCaseDeep(response.options) as PublicKeyCredentialRequestOptionsJSON,
                    challenge_token: response.challenge_token,
                })),
            );
    }

    signInWithPasskey(credential: AuthenticationResponseJSON, challengeToken: string): Observable<ResponseLogin> {
        return this._httpClient
            .post<ResponseLogin>(`${env.API_BASE_URL}/auth/passkey/login-verify`, {
                challenge_token: challengeToken,
                credential,
            })
            .pipe(
                switchMap((response: ResponseLogin) => {
                    this.applySession(response);
                    return of(response);
                }),
            );
    }

    /** Authenticated (JWT via interceptor) — begins registering a new passkey for the current user. */
    getPasskeyRegistrationOptions(): Observable<{ options: PublicKeyCredentialCreationOptionsJSON; challenge_token: string }> {
        return this._httpClient
            .post<{ response_code: number; response_msg: string; data: { options: Record<string, unknown>; challenge_token: string } }>(
                `${env.API_BASE_URL}/account/profile/passkey/registration-options`,
                {},
            )
            .pipe(
                map((response) => ({
                    options: this._toCamelCaseDeep(response.data.options) as PublicKeyCredentialCreationOptionsJSON,
                    challenge_token: response.data.challenge_token,
                })),
            );
    }

    verifyPasskeyRegistration(
        credential: RegistrationResponseJSON,
        challengeToken: string,
        deviceName?: string,
    ): Observable<PasskeyCredentialSummary> {
        return this._httpClient
            .post<{ response_code: number; response_msg: string; data: PasskeyCredentialSummary }>(
                `${env.API_BASE_URL}/account/profile/passkey/registration-verify`,
                { challenge_token: challengeToken, credential, device_name: deviceName },
            )
            .pipe(map((response) => response.data));
    }

    checkAccountExistence(value: { code: string, password: string }): Observable<ResponseLogin> {
        // Set default platform to "Web" if not provided
        const { code, password } = value;

        const requestBody = {
            code,
            password,
        };
        // return;
        return this._httpClient.post<ResponseLogin>(`${env.API_BASE_URL}/account/auth/login-with-code`, requestBody).pipe(
            switchMap((response: ResponseLogin) => {
                this.accessToken = response.token; // Store the access token
                return of(response); // Return the response as a new observable
            }),
        );
    }


    // -----------------------------------------------------------------------------------------------------
    // @ Self sign-up (email → 6 digit code → name & password)
    // -----------------------------------------------------------------------------------------------------

    /**
     * Step 1 — mail a verification code to the address and open a signup
     * session. `signup_token` identifies that session for the next calls.
     */
    signUpStart(email: string): Observable<SignUpChallenge> {
        return this._httpClient.post<SignUpChallenge>(`${env.API_BASE_URL}/auth/signup`, { email });
    }

    /**
     * Step 1b — mail a fresh code for the same session.
     */
    signUpResend(signupToken: string): Observable<SignUpChallenge> {
        return this._httpClient.post<SignUpChallenge>(`${env.API_BASE_URL}/auth/signup/resend`, {
            signup_token: signupToken,
        });
    }

    /**
     * Step 2 — exchange the code for a short lived token that authorises the
     * final step.
     */
    signUpVerify(body: { signup_token: string; otp: string }): Observable<SignUpVerification> {
        return this._httpClient.post<SignUpVerification>(`${env.API_BASE_URL}/auth/signup/verify`, body);
    }

    /**
     * Step 2b — is this number still free? Asked from the details screen so a
     * number already in use is reported there, not one screen later.
     */
    signUpCheckPhone(body: { phone: string; registration_token?: string }): Observable<{ available: boolean }> {
        return this._httpClient.post<{ available: boolean }>(
            `${env.API_BASE_URL}/auth/signup/check-phone`,
            body,
        );
    }

    /**
     * Step 3 — set the name and password. The backend answers with a normal
     * login payload, so the new account is signed in straight away.
     */
    signUpComplete(body: {
        registration_token: string;
        name_kh: string;
        name_en: string;
        sex_id: number;
        phone?: string;
        password?: string;
        confirm_password?: string;
    }): Observable<ResponseLogin> {
        return this._httpClient.post<ResponseLogin>(`${env.API_BASE_URL}/auth/signup/complete`, body).pipe(
            switchMap((response: ResponseLogin) => {
                this.accessToken = response.token;
                if (response.refresh_token) {
                    this.refreshToken = response.refresh_token;
                }
                this._setDefaultRole(response.token);
                void this._fcmService.registerForCurrentUser();
                return of(response);
            }),
        );
    }

    status: boolean
    signUp(signup: { name: string; email: string; phone: string; password: string; }): Observable<ResponseSingUp> {
        return this._httpClient.post<ResponseSingUp>(`${env.API_BASE_URL}/account/auth/signup`, signup).pipe(
            switchMap((response: ResponseSingUp) => {
                this.accessToken = response.token; // Store the access token
                return of(response); // Return the response as a new observable
            }),
        );
    }

    checkExistUser(credentials: { username: string }): Observable<{ data: boolean; message: string }> {
        const { username } = credentials;

        const requestBody = {
            username,
        };
        return this._httpClient.post<{ data: boolean; message: string }>(
            `${env.API_BASE_URL}/account/auth/check-user`,
            requestBody
        ).pipe(
            switchMap((response) => {
                return of(response);
            }),
        );
    }

    checkEmailExists(email: string): Observable<boolean> {
        return this._httpClient.get<{ exists: boolean }>(`${env.API_BASE_URL}/account/auth/check-email`, {
            params: { email }
        }).pipe(
            map(response => response.exists),
            catchError(() => of(false)) // Fallback if API fails
        );
    }

    checkPhoneExists(phone: string): Observable<boolean> {
        return this._httpClient.get<{ exists: boolean }>(`${env.API_BASE_URL}/account/auth/check-phone`, {
            params: { phone }
        }).pipe(
            map(response => response.exists),
            catchError(() => of(false)) // Fallback if API fails
        );
    }

    sendOtp(credentials: { username: string; channel?: string }): Observable<{ status_code: number; message: string; otp_token?: string; channel?: string; channels?: string[] }> {
        return this._httpClient
            .post<{ status_code: number; message: string; otp_token?: string; channel?: string; channels?: string[] }>(
                `${env.API_BASE_URL}/auth/resend-otp`,
                credentials
            )
            .pipe(switchMap((response) => of(response)));
    }


    verifyOtp(credentials: { username: string; otp: string; otp_token?: string }): Observable<ResponseSuccessfullLogin> {
        const { username, otp, otp_token } = credentials;

        const requestBody: any = {
            username,
            otp,
        };
        if (otp_token && otp_token.trim() !== '') {
            requestBody.otp_token = otp_token;
        }

        return this._httpClient.post<ResponseSuccessfullLogin>(`${env.API_BASE_URL}/auth/otp`, requestBody).pipe(
            switchMap((response: ResponseSuccessfullLogin) => {

                // ===============>>>>>>>>>> Store access token from the response
                const token = response.token || (response as any).data?.token || (response as any).access_token;
                if (token) {
                    this.accessToken = token;
                    this._setDefaultRole(token);
                }
                // ===============>>>>>>>>>> clear temp email after otp
                localStorage.removeItem('email');
                void this._fcmService.registerForCurrentUser();

                return of(response); // Return a new observable with the response

            }),
        );
    }

    verifyOtpSingUp(credentials: { temporaryToken: string; otp: string }): Observable<ResponseSuccessfullLogin> {
        const { temporaryToken, otp } = credentials;

        const requestBody = {
            temporaryToken,
            otp,
        };
        return this._httpClient.post<ResponseSuccessfullLogin>(`${env.API_BASE_URL}/account/auth/signup-verify-otp`, requestBody).pipe(
            switchMap((response: ResponseSuccessfullLogin) => {
                this.accessToken = response.token; // Store access token from the response
                return of(response); // Return a new observable with the response
            }),
        );
    }
    signUpFinal(signup: {
        finalToken: string,
        group_id: string,
        name: string;
        password: string;
        phone: string;
        school_id: string;
    }): Observable<ResponseSingUp> {
        return this._httpClient.post<ResponseSingUp>(`${env.API_BASE_URL}/account/auth/signup-final-step`, signup).pipe(
            switchMap((response: ResponseSingUp) => {
                this.status = response.status; // Store the access token
                return of(response); // Return the response as a new observable
            }),
        );
    }

    // ADDED: calls POST /auth/forget-password to generate and store OTP in DB
    forgetPassword(username: string): Observable<{ status_code: number; go_to_reset_password: boolean; contact: string; message: string }> {
        return this._httpClient.post<any>(`${env.API_BASE_URL}/auth/forget-password`, { username });
    }
    verifyResetPasswordOtp(body: { username: string; otp: string; otp_token: string }): Observable<any> {
        return this._httpClient.post<any>(`${env.API_BASE_URL}/auth/verify-reset-otp`, body);
    }

    verifyEmailForCode(body: { code: string, email: string }): Observable<any> {
        return this._httpClient.put<any>(`${env.API_BASE_URL}/account/auth/verify-email-with-code`, body, {
            headers: new HttpHeaders().set('Content-Type', 'application/json')
        });
    }


    verifyEmailSignUp(body: { email: string }): Observable<any> {
        return this._httpClient.post<any>(`${env.API_BASE_URL}/account/auth/signup-check-email`, body, {
            headers: new HttpHeaders().set('Content-Type', 'application/json')
        });
    }
    /**
     * Verify reset OTP and allow user to reset password
     */
    verifyResetOtp(credentials: { email: string; otp: string }): Observable<{ message: string }> {
        return this._httpClient
            .post<{ message: string }>(`${env.API_BASE_URL}/account/auth/verify-reset-otp`, credentials)
            .pipe(
                switchMap((response: { message: string }) => {
                    // Assuming you may store a token here if needed for future requests
                    return of(response);
                })
            );
    }
    updatePassword(body: { username: string, password: string }): Observable<any> {
        return this._httpClient.put<any>(`${env.API_BASE_URL}/account/auth/reset-to-new-password`, body, {
            headers: new HttpHeaders().set('Content-Type', 'application/json')
        });
    }

    /**
     * Reset password using the verified OTP
     */
    resetPassword(credentials: { email: string; newPassword: string }): Observable<{ message: string }> {
        // Prepare the request body with email and newPassword
        const { email, newPassword } = credentials;

        const requestBody = {
            email,
            newPassword,
        };

        // Make the HTTP POST request to the backend API to reset the password
        return this._httpClient
            .post<{ message: string }>(`${env.API_BASE_URL}/account/auth/reset-password`, requestBody)
            .pipe(
                switchMap((response: { message: string }) => {
                    // You could optionally clear or update any stored tokens or session data here if needed
                    // For example, after resetting the password, you could remove the token

                    // Return the response, which includes a success message
                    return of(response);
                })
            );
    }

    // ADDED: calls POST /auth/reset-password to verify OTP and update the password
    resetPasswordWithOtp(body: { username: string; otp?: string; otp_token?: string; new_password: string; confirm_password: string }): Observable<{ status_code: number; message: string }> {
        return this._httpClient.post<any>(`${env.API_BASE_URL}/auth/reset-password`, body);
    }

    getDataSetup() {
        let params = new HttpParams();
        return this._httpClient.get(`${env.API_BASE_URL}/account/auth/setup-data`, { params });

    }

    // =========== QR CODE SECTION =========

    verified(token: string): void {
        // Store the access token in the local storage
        this.accessToken = token;

        // Set the authenticated flag to true
        this._authenticated = true;
    }

    /**
     * Check the authentication status
     */
    check(): Observable<boolean> {
        // Check if the user is logged in
        if (this._authenticated) {
            return of(true);
        }

        // Check the access token availability
        if (!this.accessToken) {
            return of(false);
        }

        // Check the access token expire date
        if (AuthUtils.isTokenExpired(this.accessToken)) {
            return of(false);
        }

        return of(true);
    }

    /** The backend's global response interceptor snake_cases every key, which
     *  breaks the WebAuthn options object — @simplewebauthn/browser needs its
     *  exact camelCase shape (pubKeyCredParams, authenticatorSelection, etc.)
     *  to call navigator.credentials.create()/get(). Converts it back. */
    private _toCamelCaseDeep(value: unknown): unknown {
        if (Array.isArray(value)) return value.map((item) => this._toCamelCaseDeep(item));
        if (!value || typeof value !== 'object' || value instanceof Date) return value;

        return Object.entries(value as Record<string, unknown>).reduce((result, [key, item]) => {
            const camelKey = key.replace(/_([a-z0-9])/g, (_match, char: string) => char.toUpperCase());
            result[camelKey] = this._toCamelCaseDeep(item);
            return result;
        }, {} as Record<string, unknown>);
    }

    /** Persist the account's primary (highest-privilege) role as the active one. */
    private _setDefaultRole(token: string): void {
        try {
            const payload: any = jwt_decode(token);
            const primary = pickPrimaryRole(payload);
            if (primary?.id != null) {
                localStorage.setItem('preferredRoleId', String(primary.id));
            } else {
                localStorage.removeItem('preferredRoleId');
            }
        } catch {
            localStorage.removeItem('preferredRoleId');
        }
    }

    getRedirectUrl(): string {
        try {
            const token = this.accessToken;
            if (!token) return '/auth/sign-in';
            const payload: any = jwt_decode(token);
            const activeRole = resolveActiveRole(payload);
            const url = getRoleDefaultUrl(activeRole?.slug);
            return url === '/auth' ? '/auth/sign-in' : url;
        } catch {
            return '/auth/sign-in';
        }
    }

    /**
     * Pins the role tied to `organizationNameEn`/`organizationNameKh` as active,
     * so a freshly accepted invitation lands the user in the organization they
     * just joined instead of wherever their highest-privilege role is.
     *
     * Skipped when the token already carries a role the backend itself marked
     * `is_default` — `_setDefaultRole` (called by `applySession` just before
     * this) already pinned that one, and it's the authoritative answer. Matching
     * by organization name is only a fallback for tokens without that flag.
     */
    setPreferredOrganization(organizationNameEn?: string, organizationNameKh?: string): void {
        try {
            const token = this.accessToken;
            if (!token) return;
            const payload: any = jwt_decode(token);
            const roles = payload?.user?.roles;
            const hasBackendDefault = Array.isArray(roles)
                ? roles.some((role: any) => role?.is_default)
                : !!(roles && typeof roles === 'object' && Object.values(roles).some((role: any) => role?.is_default));
            if (hasBackendDefault) return;

            const role = pickRoleByOrganizationName(payload, organizationNameEn, organizationNameKh);
            if (role?.id != null) {
                localStorage.setItem('preferredRoleId', String(role.id));
            }
        } catch {
            // Falls back to whatever _setDefaultRole already picked.
        }
    }

    signOut(): Observable<boolean> {
        if (this.accessToken) {
            this._httpClient
                .post(
                    `${env.API_BASE_URL}/auth/logout`,
                    {},
                    { withCredentials: true },
                )
                .pipe(catchError(() => of(null)))
                .subscribe();
        }
        void this._fcmService.unregisterCurrentDevice();
        this._localPasscodeService.clearForSignOut();
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem(this._refreshSessionKey);
        localStorage.removeItem('preferredRoleId');
        return of(true);
    }

}
