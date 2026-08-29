import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { env } from 'envs/env';
import { firstValueFrom } from 'rxjs';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, deleteToken, isSupported, Messaging } from 'firebase/messaging';

const FCM_TOKEN_STORAGE_KEY = 'fcmToken';

interface FirebaseWebConfig {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    vapidKey: string;
}

interface FirebaseWebConfigResponse {
    status_code: number;
    success: number;
    message: string;
    data: FirebaseWebConfig;
}

@Injectable({ providedIn: 'root' })
export class FcmService {
    private _app: FirebaseApp | null = null;
    private _messaging: Messaging | null = null;
    private _config: FirebaseWebConfig | null = null;
    private _initPromise: Promise<Messaging | null> | null = null;
    private _swRegistration: ServiceWorkerRegistration | null = null;

    constructor(
        private _httpClient: HttpClient,
        private _router: Router,
    ) {
        // A background (OS-level) notification was clicked — navigate this tab to its deep link.
        navigator.serviceWorker?.addEventListener('message', (event) => {
            console.log('[FCM] message from service worker', event.data);
            if (event.data?.type === 'fcm-notification-click' && event.data.link) {
                this._router.navigateByUrl(event.data.link).then(
                    (ok) => console.log('[FCM] navigateByUrl result', ok, event.data.link),
                    (err) => console.error('[FCM] navigateByUrl error', err),
                );
            }
        });
    }

    private _navigateToLink(link?: string): void {
        if (!link) return;
        this._router.navigateByUrl(link);
    }

    // Firebase config is served by the API at runtime rather than baked into
    // the web build, so it lives in one place and isn't duplicated per client.
    private async _fetchConfig(): Promise<FirebaseWebConfig | null> {
        if (this._config) return this._config;

        try {
            const response = await firstValueFrom(
                this._httpClient.get<FirebaseWebConfigResponse>(`${env.API_BASE_URL}/shared/notification/firebase-config`),
            );
            const config = response?.data;
            if (!config?.apiKey || !config.projectId || !config.appId || !config.vapidKey) return null;

            this._config = config;
            return config;
        } catch {
            return null;
        }
    }

    private async _init(): Promise<Messaging | null> {
        if (!(await isSupported())) {
            console.error('[FCM] isSupported() returned false — not a secure context or unsupported browser');
            return null;
        }

        const config = await this._fetchConfig();
        if (!config) {
            console.error('[FCM] _fetchConfig() returned null — config fetch failed or fields missing');
            return null;
        }

        if (!this._app) {
            this._app = initializeApp({
                apiKey: config.apiKey,
                authDomain: config.authDomain,
                projectId: config.projectId,
                storageBucket: config.storageBucket,
                messagingSenderId: config.messagingSenderId,
                appId: config.appId,
            });
        }

        if (!this._messaging) {
            try {
                this._swRegistration = await navigator.serviceWorker.register(
                    `/firebase-messaging-sw.js?${new URLSearchParams({
                        apiKey: config.apiKey,
                        authDomain: config.authDomain,
                        projectId: config.projectId,
                        storageBucket: config.storageBucket,
                        messagingSenderId: config.messagingSenderId,
                        appId: config.appId,
                    }).toString()}`,
                );
                this._messaging = getMessaging(this._app);
                // Foreground push: the browser won't show an OS notification on its own,
                // so show one ourselves and navigate on click (mirrors the background
                // notificationclick handler in firebase-messaging-sw.js). Messages are sent
                // data-only (no top-level `notification` field — see firebase.service.ts),
                // so title/body/link all come from `payload.data`.
                onMessage(this._messaging, (payload) => {
                    console.log('[FCM] onMessage payload', payload);
                    const title = payload.data?.['title'] ?? 'Notification';
                    const body = payload.data?.['body'];
                    const link = payload.data?.['link'];

                    // Sound is played by NotificationsService on the realtime
                    // `notification:new` event, which covers both foreground and
                    // background FCM delivery — so we don't play it here too.

                    if (Notification.permission === 'granted') {
                        const popup = new Notification(title, { body });
                        popup.onclick = () => {
                            window.focus();
                            this._navigateToLink(link);
                        };
                    } else {
                        this._navigateToLink(link);
                    }
                });
            } catch (err) {
                console.error('[FCM] service worker registration failed', err);
                return null;
            }
        }

        return this._messaging;
    }

    private _messagingReady(): Promise<Messaging | null> {
        if (!this._initPromise) {
            this._initPromise = this._init();
            // Only keep the memo when init actually succeeds. A failed attempt
            // (e.g. the firebase-config fetch ran before the auth token was ready
            // right after login, or a transient error) must not be cached, or every
            // later registerForCurrentUser() — including after re-login — would keep
            // getting the same null without ever retrying.
            this._initPromise
                .then((messaging) => {
                    if (!messaging) this._initPromise = null;
                })
                .catch(() => {
                    this._initPromise = null;
                });
        }
        return this._initPromise;
    }

    async registerForCurrentUser(): Promise<void> {
        try {
            const messaging = await this._messagingReady();
            if (!messaging || !this._config) {
                console.error('[FCM] registerForCurrentUser aborted — messaging or config not ready', { messaging: !!messaging, config: !!this._config });
                return;
            }

            if (Notification.permission === 'default') {
                await Notification.requestPermission();
            }
            if (Notification.permission !== 'granted') {
                console.error('[FCM] Notification permission not granted:', Notification.permission);
                return;
            }

            const token = await getToken(messaging, {
                vapidKey: this._config.vapidKey,
                serviceWorkerRegistration: this._swRegistration ?? undefined,
            });
            if (!token) {
                console.error('[FCM] getToken() returned empty token');
                return;
            }

            localStorage.setItem(FCM_TOKEN_STORAGE_KEY, token);

            await firstValueFrom(
                this._httpClient.post(`${env.API_BASE_URL}/shared/notification/fcm-token`, {
                    token,
                    platform: 'web',
                }),
            );
        } catch (err) {
            console.error('[FCM] registerForCurrentUser failed', err);
        }
    }

    async unregisterCurrentDevice(): Promise<void> {
        const token = localStorage.getItem(FCM_TOKEN_STORAGE_KEY);
        if (!token) return;
        // Clear before the request resolves so a re-entrant call (e.g. the
        // interceptor signing out again while this DELETE is still in flight)
        // sees no token and short-circuits instead of firing a duplicate DELETE.
        localStorage.removeItem(FCM_TOKEN_STORAGE_KEY);

        try {
            await firstValueFrom(
                this._httpClient.request('delete', `${env.API_BASE_URL}/shared/notification/fcm-token`, {
                    body: { token },
                }),
            );
        } catch {
            // Ignore — token will simply go stale server-side if this fails.
        }

        try {
            const messaging = await this._messagingReady();
            if (messaging) await deleteToken(messaging);
        } catch {
            // Ignore.
        }
    }
}
