// ===========================================================================>> Core Library
import { Injectable, Logger } from '@nestjs/common';

// ===========================================================================>> Third Party Library
import { cert, getApps, initializeApp, App } from 'firebase-admin/app';
import { getMessaging, Messaging } from 'firebase-admin/messaging';

// ===========================================================================>> Custom Library
// > Local
import { appConfig } from 'src/app.config';

// ======================================= >> Code Starts Here << ========================== //
export interface PushPayload {
    title: string;
    body: string;
    data?: Record<string, string>;
}

@Injectable()
export class FirebaseService {
    private readonly _logger = new Logger(FirebaseService.name);
    private readonly _messaging: Messaging | null;

    constructor() {
        const { PROJECT_ID, CLIENT_EMAIL, PRIVATE_KEY } = appConfig.FIREBASE;

        if (!PROJECT_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
            this._logger.warn(
                'Firebase credentials are not configured — push notifications are disabled.',
            );
            this._messaging = null;
            return;
        }

        const app: App = getApps()[0] ?? initializeApp({
            credential: cert({
                projectId: PROJECT_ID,
                clientEmail: CLIENT_EMAIL,
                privateKey: PRIVATE_KEY,
            }),
        });

        this._messaging = getMessaging(app);
        this._logger.log(`Firebase initialized for project "${PROJECT_ID}" — push notifications enabled.`);
    }

    /** Sends to many device tokens at once, returning the tokens that are invalid/unregistered so callers can prune them. */
    async sendToTokens(tokens: string[], payload: PushPayload): Promise<{ invalidTokens: string[] }> {
        if (!this._messaging || !tokens.length) return { invalidTokens: [] };

        try {
            // Data-only message (no top-level `notification` field): if both are set, browsers
            // auto-render the OS notification straight from `notification` and skip our
            // onBackgroundMessage/showNotification call — so the `data` payload (incl. the
            // deep-link `link`) never reaches the notification we actually display, and
            // notificationclick has nothing to navigate to. Sending data-only forces every
            // platform through our own handler, where title/body/data are applied together.
            const message = {
                tokens,
                data: { title: payload.title, body: payload.body, ...payload.data },
            };

            const response = await this._messaging.sendEachForMulticast(message);

            const invalidTokens: string[] = [];
            response.responses.forEach((result, index) => {
                if (result.success) return;
                const code = result.error?.code;
                if (
                    code === 'messaging/registration-token-not-registered' ||
                    code === 'messaging/invalid-registration-token'
                ) {
                    invalidTokens.push(tokens[index]);
                }
            });

            this._logger.log(
                `FCM send: ${response.successCount}/${tokens.length} succeeded, ${response.failureCount} failed` +
                    (invalidTokens.length ? `, ${invalidTokens.length} invalid token(s) pruned` : ''),
            );

            return { invalidTokens };
        } catch (error) {
            this._logger.error(`FCM send failed: ${String(error)}`);
            return { invalidTokens: [] };
        }
    }
}
