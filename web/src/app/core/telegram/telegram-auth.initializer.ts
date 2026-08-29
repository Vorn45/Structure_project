import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from 'app/core/auth/auth.service';

interface TelegramWebApp {
    initData: string;
    ready(): void;
    expand(): void;
    disableVerticalSwipes?(): void;
}

declare global {
    interface Window {
        Telegram?: { WebApp?: TelegramWebApp };
    }
}

/**
 * When the app is opened inside Telegram, exchange the launch parameters for a
 * PMS token so the current Telegram user lands straight in the app.
 *
 * Outside Telegram this is a no-op and the normal login flow is untouched. Any
 * failure here does not block application startup.
 */
export const telegramAuthInitializer = () => {
    const authService = inject(AuthService);

    return async (): Promise<void> => {
        const webApp = window.Telegram?.WebApp;

        // `initData` is empty in a plain browser even when the SDK script loads,
        // which makes it the reliable "am I really in Telegram" check.
        if (!webApp?.initData) return;

        webApp.ready();
        webApp.expand();
        // Stops drag-to-close from firing while scrolling content.
        webApp.disableVerticalSwipes?.();

        try {
            // Always exchange Telegram's current launch identity. A session
            // left by another PMS user must never win inside the Mini App.
            await firstValueFrom(authService.signInWithMiniApp(webApp.initData));
        } catch {
            // Disabled Mini App login, expired launch data, or an API failure
            // must not prevent the application from starting.
        }
    };
};
