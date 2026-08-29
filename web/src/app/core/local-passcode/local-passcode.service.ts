import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import jwt_decode from 'jwt-decode';
import { env } from 'envs/env';
import { firstValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UserService } from 'app/core/user/user.service';
import { UserPayload } from 'helper/interfaces/payload.interface';

export type PasscodeIdleTimeout = 1 | 5 | 60 | 300;

const ACTIVITY_EVENTS = ['click', 'keydown', 'mousemove', 'touchstart', 'scroll'] as const;
const ACTIVITY_DEBOUNCE_MS = 5_000;
const IDLE_CHECK_INTERVAL_MS = 10_000;
const BASE_URL = `${env.API_BASE_URL}/account/profile/local-passcode`;

interface StatusResponse {
    data: { enabled: boolean; idle_timeout_minutes: PasscodeIdleTimeout };
}

interface VerifyResponse {
    data: { valid: boolean };
}

interface ResetTokenResponse {
    data: { reset_token: string };
}

interface SendOtpResponse {
    data: { otp_token: string };
}

/**
 * Telegram-style local app lock. Unlike a per-browser client secret, the
 * passcode hash and "is a passcode configured" state live on the server —
 * verification is a real network round-trip, so clearing localStorage (or
 * anything else client-side) cannot bypass or disable the lock. `locked`
 * itself is a client-only UI/session concept (has this tab proven the
 * passcode since it loaded) layered on top of that server-sourced truth.
 */
@Injectable({ providedIn: 'root' })
export class LocalPasscodeService {
    readonly locked = signal(false);
    readonly enabled = signal(false);
    readonly idleTimeoutMinutes = signal<PasscodeIdleTimeout>(5);

    private _userId: number | null = null;
    /** Drives the idle-timeout-while-unlocked timer (`_checkIdle`) — touched
     *  on mouse/keyboard/etc. activity regardless of whether the passcode
     *  has ever been verified. NOT persisted, and NOT what a reload checks
     *  to decide whether to skip the lock screen — activity alone (e.g.
     *  sitting on the lock screen itself, or on a page you were browsing
     *  right before a reload landed you back at the guard) must never be
     *  read as "the passcode was verified." See `_lastVerifiedAt` for that. */
    private _lastActivityAt = Date.now();
    private _idleCheckTimer: ReturnType<typeof setInterval> | null = null;
    private _activityBound = false;
    /** True once this tab has proven the passcode (or found none enabled)
     *  since the user last identified themselves — reset on user change.
     *  Distinct from `locked`, which starts at its unpopulated `false`
     *  default before the first `refreshStatus()` even resolves; without
     *  this flag a guard reading `locked()` too early on a fresh page load
     *  would see "not locked" and let a should-be-locked session through. */
    private _provenThisSession = false;
    /** Coalesces concurrent `refreshStatus()` callers (the guard runs once
     *  per matched route segment — parent `canActivate` plus `canActivateChild`
     *  for every nested segment — and the constructor's `user$` subscription
     *  can also fire independently) onto a single in-flight HTTP call, so
     *  they can never resolve to different answers or fire `_redirectToLock()`
     *  from two places for one navigation. */
    private _refreshInFlight: Promise<void> | null = null;

    constructor(
        private _http: HttpClient,
        private _userService: UserService,
        private _router: Router,
    ) {
        // Resolved synchronously from the cached JWT (like AuthGuard does)
        // rather than waited for from `UserService.user$` — that observable
        // is only populated by `initialDataResolver`, which runs *after*
        // route `canActivate` guards (including `LocalPasscodeGuard`). On a
        // hard reload, this service is often constructed and its first
        // `refreshStatus()` call made by the guard before the resolver has
        // ever run, so waiting on `user$` here left `_userId` (and therefore
        // the per-user sessionStorage key for "last verified at") null at
        // exactly the moment the guard needed it — the persisted timestamp
        // was being written under one key and read back under `null`,
        // so a reload could never see itself as recently verified and
        // always re-locked regardless of the idle-timeout window.
        this._userId = this._readUserIdFromToken();

        // Only primes `enabled`/`idleTimeoutMinutes` so they're populated by
        // the time something reads them — deciding to lock-and-redirect is
        // deliberately left to `LocalPasscodeGuard` (which knows the actual
        // destination URL for the redirect) rather than done here. This
        // subscription's timing relative to a route's own guard/resolver
        // isn't guaranteed, so redirecting from here risked reading
        // `this._router.url` before the real navigation had updated it —
        // producing a `/lock?redirect=/` bounce instead of the real page.
        this._userService.user$.subscribe((user) => {
            const nextId = user?.id ?? this._userId;
            if (nextId === this._userId) return;
            this._userId = nextId;
            this._provenThisSession = false;
            if (nextId == null) {
                this.enabled.set(false);
                this.locked.set(false);
                return;
            }
            void this.refreshStatus(false);
        });
        this._bindActivityListeners();
        this._startIdleCheck();
    }

    /** Reads localStorage directly (same key AuthGuard/AuthService use)
     *  rather than injecting AuthService — that would create a circular
     *  dependency, since AuthService itself injects LocalPasscodeService
     *  (to clear the lock on sign-out). */
    private _readUserIdFromToken(): number | null {
        const token = localStorage.getItem('accessToken');
        if (!token || token === 'undefined' || token === 'null' || !token.trim()) return null;
        try {
            const payload: UserPayload = jwt_decode(token);
            return payload?.user?.id ?? null;
        } catch {
            return null;
        }
    }

    /** Pulls current enabled/idle-timeout state from the server and, unless
     *  this tab has already proven itself this session OR the persisted
     *  last-*verified* timestamp shows the idle timeout hasn't actually
     *  elapsed since the passcode was genuinely proven, sets `locked` — a
     *  fresh page load (or a guard running before anything else has) hasn't
     *  proven the passcode yet in memory, but a reload moments after
     *  unlocking shouldn't re-prompt either (matches Telegram: it only
     *  re-locks once you've genuinely been away long enough, not on every
     *  relaunch). Deliberately keyed off verification, not mere page
     *  activity — sitting on the lock screen itself is "active" but must
     *  never count as proof the passcode was entered. Once proven (via
     *  `verify()` or `setPasscode()`), later calls (e.g. from the settings
     *  dialog) just refresh `enabled`/`idleTimeoutMinutes` without re-locking.
     *
     *  Deliberately never redirects itself — only sets the `locked` signal.
     *  `this._router.url` is not reliable here: this can resolve mid-guard,
     *  before the router has settled on the navigation's real target URL,
     *  so redirecting from here risked building the `/lock?redirect=...`
     *  URL from a stale/default router URL instead of the actual
     *  destination. Callers that need a redirect (the guard, the idle
     *  checker) build it themselves from a URL they know is current. */
    async refreshStatus(lockIfEnabled = true): Promise<void> {
        if (!this._refreshInFlight) {
            this._refreshInFlight = this._doRefreshStatus().finally(() => {
                this._refreshInFlight = null;
            });
        }
        await this._refreshInFlight;

        if (!this.enabled() || this._provenThisSession || !lockIfEnabled) return;

        const msSinceVerified = this._msSinceLastVerified();
        const stillWithinIdleWindow = msSinceVerified !== null && msSinceVerified < this.idleTimeoutMinutes() * 60_000;
        if (stillWithinIdleWindow) {
            this._provenThisSession = true;
            this._touchActivity();
            return;
        }

        this.locked.set(true);
    }

    private async _doRefreshStatus(): Promise<void> {
        const res = await firstValueFrom(
            this._http.get<StatusResponse>(BASE_URL).pipe(
                catchError(() => of<StatusResponse>({ data: { enabled: false, idle_timeout_minutes: 5 } })),
            ),
        );
        this.enabled.set(res.data.enabled);
        this.idleTimeoutMinutes.set(res.data.idle_timeout_minutes);

        if (!res.data.enabled) {
            this._provenThisSession = true;
            this.locked.set(false);
        }
    }

    isEnabled(): boolean {
        return this.enabled();
    }

    /** True once this tab has already proven the passcode (or confirmed none
     *  is enabled) this session — lets the guard skip a redundant server
     *  round-trip on every single route change once a session is settled,
     *  rather than re-checking on every navigation. */
    hasProvenThisSession(): boolean {
        return this._provenThisSession;
    }

    /** resetToken: only required when resetting via the forgot-passcode
     *  email-OTP flow; omitted for a normal in-session set/change, since the
     *  caller is already authenticated. */
    async setPasscode(
        passcode: string,
        idleTimeoutMinutes: PasscodeIdleTimeout = 5,
        opts: { resetToken?: string } = {},
    ): Promise<void> {
        await firstValueFrom(
            this._http.post(BASE_URL, {
                passcode,
                idle_timeout_minutes: idleTimeoutMinutes,
                reset_token: opts.resetToken,
            }),
        );
        this.enabled.set(true);
        this.idleTimeoutMinutes.set(idleTimeoutMinutes);
        this._touchActivity();
        this._markVerified();
        this._provenThisSession = true;
        this.locked.set(false);
    }

    async setIdleTimeout(idleTimeoutMinutes: PasscodeIdleTimeout): Promise<void> {
        if (!this.enabled()) return;
        await firstValueFrom(
            this._http.put(`${BASE_URL}/idle-timeout`, { idle_timeout_minutes: idleTimeoutMinutes }),
        );
        this.idleTimeoutMinutes.set(idleTimeoutMinutes);
    }

    /** Verifies against the server-stored hash — the client never receives
     *  or stores anything that alone lets it verify itself. */
    async verify(passcode: string): Promise<boolean> {
        if (!this.enabled()) return true;
        const res = await firstValueFrom(
            this._http.post<VerifyResponse>(`${BASE_URL}/verify`, { passcode }).pipe(
                catchError(() => of<VerifyResponse>({ data: { valid: false } })),
            ),
        );
        if (res.data.valid) {
            this._touchActivity();
            this._markVerified();
            this._provenThisSession = true;
            this.locked.set(false);
        }
        return res.data.valid;
    }

    /** Disabling requires the current passcode — call `verify()` first. */
    async disable(passcode: string): Promise<void> {
        await firstValueFrom(this._http.delete(BASE_URL, { body: { passcode } }));
        this.enabled.set(false);
        this.locked.set(false);
        this._clearVerified();
    }

    async requestResetOtp(): Promise<string> {
        const res = await firstValueFrom(
            this._http.post<SendOtpResponse>(`${BASE_URL}/reset/send-otp`, {}),
        );
        return res.data.otp_token;
    }

    /** Verifying the OTP alone does not reset the passcode — it proves
     *  identity and mints a short-lived `reset_token` to pass into
     *  `setPasscode()`, mirroring the account's own forgot-password flow. */
    async verifyResetOtp(otp: string, otpToken: string): Promise<string> {
        const res = await firstValueFrom(
            this._http.post<ResetTokenResponse>(`${BASE_URL}/reset/verify-otp`, { otp, otp_token: otpToken }),
        );
        return res.data.reset_token;
    }

    /** Always drop the local lock on sign-out — it must not leak into
     *  whatever account signs into this browser next. */
    clearForSignOut(): void {
        this._clearVerified();
        this.enabled.set(false);
        this.locked.set(false);
        this._userId = null;
        this._provenThisSession = false;
    }

    lockNow(): void {
        if (!this.enabled() || this.locked()) return;
        this._provenThisSession = false;
        this._clearVerified();
        this.locked.set(true);
        this._redirectToLock();
    }

    private _redirectToLock(): void {
        const currentUrl = this._router.url;
        if (currentUrl.startsWith('/lock') || currentUrl.startsWith('/auth')) return;
        this._router.navigate(['/lock'], { queryParams: { redirect: currentUrl } });
    }

    private _bindActivityListeners(): void {
        if (this._activityBound || typeof window === 'undefined') return;
        this._activityBound = true;

        let debounceTimer: ReturnType<typeof setTimeout> | null = null;
        const onActivity = () => {
            if (debounceTimer) return;
            debounceTimer = setTimeout(() => {
                debounceTimer = null;
            }, ACTIVITY_DEBOUNCE_MS);
            this._touchActivity();
        };

        ACTIVITY_EVENTS.forEach((event) =>
            window.addEventListener(event, onActivity, { passive: true }),
        );
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') this._checkIdle();
        });
    }

    private _touchActivity(): void {
        this._lastActivityAt = Date.now();
    }

    /** Scoped per-user so switching accounts in the same browser tab can
     *  never read a previous user's leftover verified-at timestamp and skip
     *  a lock that should apply to the new user. */
    private get _lastVerifiedStorageKey(): string | null {
        return this._userId != null ? `local_passcode_last_verified_${this._userId}` : null;
    }

    /** Records that the passcode was just successfully verified (or a
     *  passcode was just set) — persisted to sessionStorage so a reload
     *  moments later can skip the lock screen, matching Telegram. Only ever
     *  written from an actual `verify()`/`setPasscode()` success, never from
     *  general page activity — activity alone (sitting on the lock screen,
     *  browsing right before a reload) must never be mistaken for having
     *  proven the passcode. sessionStorage (not localStorage) so this never
     *  survives past closing the tab, and is never a substitute for the
     *  server-side passcode check itself — it only ever widens or narrows
     *  how eagerly the *client* re-prompts. */
    private _markVerified(): void {
        const key = this._lastVerifiedStorageKey;
        if (!key) return;
        try {
            sessionStorage.setItem(key, String(Date.now()));
        } catch {
            // sessionStorage unavailable (private browsing, etc.) — falls back
            // to always re-locking on reload, i.e. the safe default.
        }
    }

    private _clearVerified(): void {
        const key = this._lastVerifiedStorageKey;
        if (!key) return;
        try {
            sessionStorage.removeItem(key);
        } catch {
            // Ignore.
        }
    }

    /** Milliseconds since the passcode was last verified this browser
     *  session, or `null` if it never has been (this tab, this user). */
    private _msSinceLastVerified(): number | null {
        const key = this._lastVerifiedStorageKey;
        if (!key) return null;
        try {
            const stored = sessionStorage.getItem(key);
            if (!stored) return null;
            return Date.now() - Number(stored);
        } catch {
            return null;
        }
    }

    private _startIdleCheck(): void {
        if (typeof window === 'undefined') return;
        this._idleCheckTimer = setInterval(() => this._checkIdle(), IDLE_CHECK_INTERVAL_MS);
    }

    private _checkIdle(): void {
        if (this.locked() || !this.enabled()) return;
        const timeoutMinutes = this.idleTimeoutMinutes();

        if (Date.now() - this._lastActivityAt >= timeoutMinutes * 60_000) {
            this._provenThisSession = false;
            this._clearVerified();
            this.locked.set(true);
            this._redirectToLock();
        }
    }
}
