import { Injectable } from '@angular/core';
import { env }        from 'envs/env';

// ============================================================================>>
// CDC SSO (Keycloak) OIDC authorization-code + PKCE helper for the PMS web app.
//
// Flow:
//   1. begin(): build a PKCE challenge, stash verifier/state in sessionStorage,
//      and redirect the browser to Keycloak's authorize endpoint.
//   2. Keycloak redirects back to /auth/sso-callback?code=...&state=...
//   3. exchangeCode(): swap the code for a Keycloak access token at the token
//      endpoint (public client + PKCE — no client secret in the browser).
//   4. The caller posts that access token to the PMS API (/auth/sso).
// ============================================================================>>

const STORAGE_STATE = 'pms_sso_state';
const STORAGE_VERIFIER = 'pms_sso_verifier';
const STORAGE_MODE = 'pms_sso_mode';
const OIDC_SCOPE = 'openid profile email';

export type SsoMode = 'login' | 'signup';

@Injectable({ providedIn: 'root' })
export class SsoService {
    /** True when SSO is configured (issuer + client id present). */
    get enabled(): boolean {
        return !!env.SSO_AUTH_URL && !!env.SSO_CLIENT_ID;
    }

    private get redirectUri(): string {
        // Keycloak returns to a static landing page (public/sso-callback.html)
        // with ?code&state in a real query string. That page forwards into the
        // app's hash route /#/auth/sso-callback?code&state — sidestepping the
        // hash-router's inability to read a pre-hash query string.
        return `${window.location.origin}/sso-callback.html`;
    }

    /** Start the OIDC redirect. Never returns (navigates away). */
    async begin(mode: SsoMode = 'login'): Promise<void> {
        if (!this.enabled) {
            console.error('[SSO] not configured: SSO_AUTH_URL / SSO_CLIENT_ID empty');
            return;
        }

        const state = this._random(16);
        const verifier = this._base64Url(crypto.getRandomValues(new Uint8Array(32)));
        const challenge = await this._pkceChallenge(verifier);

        sessionStorage.setItem(STORAGE_STATE, state);
        sessionStorage.setItem(STORAGE_VERIFIER, verifier);
        sessionStorage.setItem(STORAGE_MODE, mode);

        const method = sessionStorage.getItem('pms_sso_pkce_plain') ? 'plain' : 'S256';
        const params = new URLSearchParams({
            client_id: env.SSO_CLIENT_ID,
            response_type: 'code',
            scope: OIDC_SCOPE,
            redirect_uri: this.redirectUri,
            state,
            code_challenge: challenge,
            code_challenge_method: method,
        });

        const target =
            `${env.SSO_AUTH_URL}/protocol/openid-connect/auth?${params.toString()}`;
        console.info('[SSO] redirecting to', target);
        window.location.href = target;
    }

    /** The mode ('login'/'signup') the redirect was started with. */
    consumeMode(): SsoMode {
        const mode = (sessionStorage.getItem(STORAGE_MODE) as SsoMode) || 'login';
        return mode;
    }

    /**
     * Redeem the authorization code for a Keycloak access token. Validates the
     * returned `state` against the one we stored. Clears the PKCE material.
     */
    async exchangeCode(code: string, state: string | null): Promise<string> {
        const savedState = sessionStorage.getItem(STORAGE_STATE);
        const verifier = sessionStorage.getItem(STORAGE_VERIFIER);
        this._clear();

        console.info('[SSO] callback', {
            hasCode: !!code,
            returnedState: state,
            savedState,
            hasVerifier: !!verifier,
        });

        if (!savedState || state !== savedState)
            throw new Error('SSO state mismatch');
        if (!verifier) throw new Error('Missing PKCE verifier');

        const body = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: env.SSO_CLIENT_ID,
            code,
            redirect_uri: this.redirectUri,
            code_verifier: verifier,
        });

        const res = await fetch(
            `${env.SSO_AUTH_URL}/protocol/openid-connect/token`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: body.toString(),
            },
        );
        if (!res.ok) {
            const detail = await res.text().catch(() => '');
            console.error('[SSO] token exchange failed', res.status, detail);
            throw new Error('SSO token exchange failed');
        }

        const json = (await res.json()) as { access_token?: string };
        if (!json.access_token) throw new Error('SSO token missing');
        return json.access_token;
    }

    /**
     * S256 PKCE challenge. crypto.subtle is only present in secure contexts
     * (https or http://localhost); if it's missing we fall back to the "plain"
     * method so login still works over a bare-IP dev host.
     */
    private async _pkceChallenge(verifier: string): Promise<string> {
        if (crypto?.subtle?.digest) {
            const digest = await crypto.subtle.digest(
                'SHA-256',
                new TextEncoder().encode(verifier),
            );
            return this._base64Url(new Uint8Array(digest));
        }
        // Fallback: plain challenge (verifier == challenge). Keycloak must allow
        // it; we still send method=plain below via a flag on sessionStorage.
        sessionStorage.setItem('pms_sso_pkce_plain', '1');
        return verifier;
    }

    private _clear(): void {
        sessionStorage.removeItem(STORAGE_STATE);
        sessionStorage.removeItem(STORAGE_VERIFIER);
        sessionStorage.removeItem(STORAGE_MODE);
    }

    private _random(bytes: number): string {
        return this._base64Url(crypto.getRandomValues(new Uint8Array(bytes)));
    }

    private _base64Url(bytes: Uint8Array): string {
        let str = '';
        for (const b of bytes) str += String.fromCharCode(b);
        return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
}
