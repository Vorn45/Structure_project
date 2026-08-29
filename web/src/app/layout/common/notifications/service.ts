import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { TaskSocketService } from 'app/core/realtime/task-socket.service';
import {
    ChatNotificationEntry,
    InvitationDetail,
    Notification,
    NotificationAvatarRef,
    NotificationSettingData,
    NotificationSettingPayload,
    OrganizationChatNotificationEntry,
    TaskChatNotificationEntry,
} from 'app/layout/common/notifications/interface';
import { env } from 'envs/env';
import {
    catchError,
    map,
    Observable,
    of,
    ReplaySubject,
    Subscription,
    timeout,
} from 'rxjs';

const DEFAULT_NOTIFICATION_AVATAR = 'images/logo/default_logo.png';

/**
 * Which stream a preferences row governs. Each scope is stored separately on the
 * API, so muting project/organization group chats leaves task notifications alone.
 */
export type NotificationSettingScope = 'general' | 'project_chat' | 'organization_chat';

/**
 * The scope of a raw notification straight off the socket (`notification:new`),
 * which carries the entity's `*_id` columns rather than the mapped objects
 * `isProjectChatNotification` reads.
 */
export function scopeOfNotificationPayload(payload: any): NotificationSettingScope {
    const isChat = !!String(payload?.type ?? '').startsWith('chat_');
    if (isChat && !payload?.task_id && !!payload?.project_id) return 'project_chat';
    if (isChat && !payload?.task_id && !payload?.project_id && !!payload?.organization_id) return 'organization_chat';
    return 'general';
}

/**
 * A message in a project's group chat: the API stamps those notifications with
 * the project but no task (a task chat always carries its task), which is what
 * separates them from every other chat notification.
 */
export function isProjectChatNotification(notification: Notification): boolean {
    return !notification.task && !!notification.project && !!notification.type?.startsWith('chat_');
}

/**
 * A message in an organization's group chat: stamped with an organization but
 * no project and no task — the organization-chat counterpart of
 * `isProjectChatNotification`.
 */
export function isOrganizationChatNotification(notification: Notification): boolean {
    return !notification.task && !notification.project && !!notification.organization && !!notification.type?.startsWith('chat_');
}

/**
 * Any group-chat message (project or organization) — both have their own
 * header panel (`<group-chats>`), so the general notification bell excludes
 * them rather than listing them in both places.
 */
export function isGroupChatNotification(notification: Notification): boolean {
    return isProjectChatNotification(notification) || isOrganizationChatNotification(notification);
}

/** Absolute URL for a notification's avatar file, falling back to the app logo. */
export function notificationAvatarUrl(file?: NotificationAvatarRef | null): string {
    const uri = file?.uri ?? file?.url;
    if (!uri) return DEFAULT_NOTIFICATION_AVATAR;
    if (/^https?:\/\//i.test(uri)) return uri;

    let domain = file?.file_domain || env.FILE_BASE_URL || '';
    if (!domain || domain.includes('${')) domain = '';
    domain = domain.replace(/\/+$/, '');
    const path = String(uri).replace(/^\/+/, '');
    return domain ? `${domain}/${path}` : `/${path}`;
}

@Injectable({ providedIn: 'root' })
export class NotificationsService implements OnDestroy {
    private _notifications = new ReplaySubject<Notification[]>(1);
    private _unreadCount = new ReplaySubject<number>(1);
    private _liveSub?: Subscription;
    private _notificationsCache: Notification[] = [];
    private _sound?: HTMLAudioElement;
    private _audioUnlocked = false;
    /** Last known preferences per scope — kept so the chime can respect them. */
    private _settingCache = new Map<NotificationSettingScope, NotificationSettingData>();

    /**
     * Base path for the shared notification controller. `SharedModule` is mounted
     * under `path: 'shared'` (see api app.routes.ts), so `@Controller('notification')`
     * resolves to `/api/shared/notification` — matching the FCM endpoints.
     */
    private readonly _baseUrl = `${env.API_BASE_URL}/shared/notification`;

    /** Base path for the logged-in user's own organization-invitation actions. */
    private readonly _invitationUrl = `${env.API_BASE_URL}/user/invitation`;

    constructor(
        private _httpClient: HttpClient,
        private _taskSocket: TaskSocketService,
    ) {}

    get notifications$(): Observable<Notification[]> {
        return this._notifications.asObservable();
    }

    get unreadCount$(): Observable<number> {
        return this._unreadCount.asObservable();
    }

    /**
     * Sets the loaded notification list. `unreadCount`, when given, is the
     * server-reported total across *all* pages (`data.unread_count`) and is
     * what the bell badge and tab title should show — counting only the rows
     * loaded so far would shrink as pages are paginated in via infinite scroll.
     * Falls back to counting the given page when the caller has no server total.
     */
    setNotifications(value: Notification[], unreadCount?: number): void {
        this._notificationsCache = value;
        this._notifications.next(value);
        this._unreadCount.next(unreadCount ?? value.filter((n) => !n.read).length);
    }

    set notifications(value: Notification[]) {
        this.setNotifications(value);
    }

    // -------------------------------------------------------------------------
    // @ WebSocket (live updates)
    // -------------------------------------------------------------------------

    /**
     * Listen for `notification:new` on the shared `/realtime` socket — the same
     * channel the backend emits on (and that drives the FCM push). This fires
     * while the app tab is open regardless of whether FCM delivered the push in
     * the foreground or via the background service worker, so it's the reliable
     * place to both refresh the list and play the notification chime.
     */
    connect(): void {
        if (this._liveSub) return; // Avoid duplicate subscriptions
        this._primeAudioOnFirstGesture();
        // Populate the caches the chime checks — one per independently muted stream.
        this.getSetting().subscribe();
        this.getSetting('project_chat').subscribe();
        this._liveSub = this._taskSocket.notifications().subscribe((payload) => {
            console.debug('[notifications] realtime notification:new', payload);
            // A group chat message obeys the group chat's own mute switch.
            this._playSound(scopeOfNotificationPayload(payload));
            this.refresh();
        });
    }

    disconnect(): void {
        this._liveSub?.unsubscribe();
        this._liveSub = undefined;
    }

    /**
     * Play the notification chime. Reuses a single preloaded <audio> element and
     * swallows autoplay-policy rejections (browsers block playback until the user
     * has interacted with the page at least once).
     */
    private _playSound(scope: NotificationSettingScope = 'general'): void {
        if (!this._soundAllowed(scope)) return;
        try {
            const audio = this._ensureAudio();
            audio.muted = false;
            audio.currentTime = 0;
            void audio.play().catch((err) =>
                console.debug('[notifications] sound blocked', err),
            );
        } catch (err) {
            console.debug('[notifications] sound error', err);
        }
    }

    /**
     * The chime follows the settings dialog: off when the sound switch is off,
     * and silent while notifications themselves are off or snoozed. Unknown
     * settings (request failed, never loaded) fall back to playing.
     */
    private _soundAllowed(scope: NotificationSettingScope = 'general'): boolean {
        const setting = this._settingCache.get(scope);
        if (!setting) return true;
        if (!setting.sound || !setting.enabled) return false;
        return !(setting.muted_until && new Date(setting.muted_until).getTime() > Date.now());
    }

    /** Lazily create (once) the shared <audio> element for the chime. */
    private _ensureAudio(): HTMLAudioElement {
        if (!this._sound) {
            this._sound = new Audio('/sounds/notification.wav');
            this._sound.preload = 'auto';
        }
        return this._sound;
    }

    /**
     * Browsers block `audio.play()` until the page has had a genuine user
     * gesture (see the `NotAllowedError` autoplay policy). To make the chime
     * reliable, we "unlock" the audio element on the very first click/keypress
     * anywhere on the page: play it muted once (which the gesture permits) and
     * pause it. After that, later programmatic `play()` calls are allowed —
     * even when the notification arrives while the tab is in the background.
     */
    private _primeAudioOnFirstGesture(): void {
        if (this._audioUnlocked || typeof window === 'undefined') return;

        const unlock = () => {
            if (this._audioUnlocked) return;
            this._audioUnlocked = true;
            try {
                const audio = this._ensureAudio();
                audio.muted = true;
                audio
                    .play()
                    .then(() => {
                        audio.pause();
                        audio.currentTime = 0;
                        audio.muted = false;
                    })
                    .catch(() => {
                        audio.muted = false;
                    });
            } catch {
                // Non-fatal — worst case the first chime is silently blocked.
            }
            window.removeEventListener('pointerdown', unlock);
            window.removeEventListener('keydown', unlock);
        };

        window.addEventListener('pointerdown', unlock, { once: true });
        window.addEventListener('keydown', unlock, { once: true });
    }

    // -------------------------------------------------------------------------
    // @ API
    // -------------------------------------------------------------------------

    private _map(n: any): Notification {
        return {
            id: n.id,
            type: n.type,
            title: n.title,
            title_kh: n.title_kh,
            title_en: n.title_en,
            message: n.message,
            message_kh: n.message_kh,
            message_en: n.message_en,
            data: n.data ?? null,
            read: !n.is_unread,
            read_at: n.read_at ? new Date(n.read_at) : null,
            created_at: n.created_at ? new Date(n.created_at) : new Date(),
            organization: n.organization ?? null,
            project: n.project ?? null,
            task: n.task ?? null,
            last_message: n.last_message
                ? { ...n.last_message, created_at: new Date(n.last_message.created_at) }
                : null,
        };
    }

    /** Manually reload notifications (use after a socket event or manual refresh). */
    refresh(): void {
        this.getAll().subscribe();
    }

    /** GET /notification — returns { limit, offset, total, unread_count, results }. */
    getAll(limit = 30, offset = 0): Observable<Notification[]> {
        return this._httpClient
            .get<{ data: { results: any[]; unread_count: number; total: number } }>(this._baseUrl, {
                params: { limit: String(limit), offset: String(offset) },
            })
            .pipe(
                timeout(8000),
                map((res) => {
                    const results = res?.data?.results ?? [];
                    const notifications = results.map((n) => this._map(n));
                    if (offset === 0) this.setNotifications(notifications, res?.data?.unread_count);
                    return notifications;
                }),
                catchError((err) => {
                    console.warn('Error fetching notifications:', err?.message || err);
                    return of([]);
                }),
            );
    }

    /**
     * GET /notification for a page beyond the first, returning the raw total
     * alongside the mapped rows so the caller can tell whether more remain.
     * `unreadOnly` filters server-side (`unread_only=true`) so the "unread" tab
     * pages through just the unread rows instead of the "all" page cache — a
     * page of 30 "all" rows can easily contain fewer than the server's unread
     * total, which under-showed the tab until the user scrolled further.
     */
    getPage(limit: number, offset: number, unreadOnly = false): Observable<{ notifications: Notification[]; total: number; unreadCount: number }> {
        return this._httpClient
            .get<{ data: { results: any[]; total: number; unread_count: number } }>(this._baseUrl, {
                params: { limit: String(limit), offset: String(offset), ...(unreadOnly ? { unread_only: 'true' } : {}) },
            })
            .pipe(
                timeout(8000),
                map((res) => {
                    const unreadCount = res?.data?.unread_count;
                    // The badge/title must keep reflecting the server's total, even
                    // though this page's rows aren't pushed through `notifications$`.
                    if (unreadCount != null) this._unreadCount.next(unreadCount);
                    return {
                        notifications: (res?.data?.results ?? []).map((n) => this._map(n)),
                        total: res?.data?.total ?? 0,
                        unreadCount: unreadCount ?? 0,
                    };
                }),
                catchError((err) => {
                    console.warn('Error fetching notifications page:', err?.message || err);
                    return of({ notifications: [], total: 0, unreadCount: 0 });
                }),
            );
    }

    /**
     * GET /notification/chat — one row per project group chat, with unread count.
     * `archived` flips the list to just the rooms this viewer archived (default excludes them).
     */
    getChatList(archived = false): Observable<ChatNotificationEntry[]> {
        return this._httpClient
            .get<{ data: ChatNotificationEntry[] }>(`${this._baseUrl}/chat`, {
                params: { archived: String(archived) },
            })
            .pipe(
                timeout(8000),
                map((res) =>
                    (res?.data ?? []).map((entry) => ({
                        ...entry,
                        last_message: entry.last_message
                            ? { ...entry.last_message, created_at: new Date(entry.last_message.created_at) }
                            : null,
                        last_message_at: entry.last_message_at ? new Date(entry.last_message_at) : null,
                    })),
                ),
                catchError((err) => {
                    console.warn('Error fetching group chats:', err?.message || err);
                    return of([]);
                }),
            );
    }

    /**
     * GET /notification/organization-chat — one row per organization group chat, with unread count.
     * `archived` flips the list to just the rooms this viewer archived (default excludes them).
     */
    getOrganizationChatList(archived = false): Observable<OrganizationChatNotificationEntry[]> {
        return this._httpClient
            .get<{ data: OrganizationChatNotificationEntry[] }>(`${this._baseUrl}/organization-chat`, {
                params: { archived: String(archived) },
            })
            .pipe(
                timeout(8000),
                map((res) =>
                    (res?.data ?? []).map((entry) => ({
                        ...entry,
                        last_message: entry.last_message
                            ? { ...entry.last_message, created_at: new Date(entry.last_message.created_at) }
                            : null,
                        last_message_at: entry.last_message_at ? new Date(entry.last_message_at) : null,
                    })),
                ),
                catchError((err) => {
                    console.warn('Error fetching organization chats:', err?.message || err);
                    return of([]);
                }),
            );
    }

    /** GET /notification/task-chat — one page of task chat rooms, most recently active first, with unread count. */
    getTaskChatList(offset = 0, limit = 30): Observable<{ rows: TaskChatNotificationEntry[]; total: number }> {
        return this._httpClient
            .get<{ data: { rows: TaskChatNotificationEntry[]; total: number } }>(`${this._baseUrl}/task-chat`, {
                params: { offset: String(offset), limit: String(limit) },
            })
            .pipe(
                timeout(8000),
                map((res) => ({
                    rows: (res?.data?.rows ?? []).map((entry) => ({
                        ...entry,
                        last_message: entry.last_message
                            ? { ...entry.last_message, created_at: new Date(entry.last_message.created_at) }
                            : null,
                        last_message_at: entry.last_message_at ? new Date(entry.last_message_at) : null,
                    })),
                    total: res?.data?.total ?? 0,
                })),
                catchError((err) => {
                    console.warn('Error fetching task chats:', err?.message || err);
                    return of({ rows: [], total: 0 });
                }),
            );
    }

    /** PATCH /notification/:id/read — fires the request only, no cache/refresh side effects. */
    markRead(id: string): Observable<boolean> {
        return this._httpClient
            .patch<unknown>(`${this._baseUrl}/${id}/read`, {})
            .pipe(
                timeout(8000),
                map(() => true),
                catchError(() => of(false)),
            );
    }

    /**
     * PATCH /notification/read-many — one bulk request instead of one PATCH per
     * id. Used when a click resolves to many rows at once (e.g. a task's
     * stacked group with dozens of unread notifications) — firing `markRead`
     * per id hammered the server with N concurrent requests for a single click.
     */
    markReadMany(ids: string[]): Observable<boolean> {
        const uniqueIds = [...new Set(ids)];
        if (!uniqueIds.length) return of(true);
        return this._httpClient
            .patch<unknown>(`${this._baseUrl}/read-many`, { ids: uniqueIds })
            .pipe(
                timeout(8000),
                map(() => {
                    this.refreshUnreadCount();
                    return true;
                }),
                catchError(() => of(false)),
            );
    }

    /** GET /notification/unread-count — refreshes just the badge, without refetching the list. */
    refreshUnreadCount(): void {
        this._httpClient
            .get<{ data: { unread_count: number } }>(`${this._baseUrl}/unread-count`)
            .pipe(
                timeout(8000),
                catchError(() => of(null)),
            )
            .subscribe((res) => {
                if (res?.data?.unread_count != null) this._unreadCount.next(res.data.unread_count);
            });
    }

    /** PATCH /notification/read-all — resyncs page one from the server afterward. */
    markAllRead(): Observable<boolean> {
        return this._httpClient
            .patch<unknown>(`${this._baseUrl}/read-all`, {})
            .pipe(
                timeout(8000),
                map(() => {
                    this.refresh();
                    return true;
                }),
                catchError(() => of(false)),
            );
    }

    // -------------------------------------------------------------------------
    // @ Organization invitation (received by the current logged-in user)
    // -------------------------------------------------------------------------

    /** GET /user/invitation/:id — org header, inviter and project/role list. */
    getInvitation(id: string): Observable<InvitationDetail | null> {
        return this._httpClient
            .get<{ data: InvitationDetail }>(`${this._invitationUrl}/${id}`)
            .pipe(
                timeout(8000),
                map((res) => res?.data ?? null),
                catchError((err) => {
                    console.warn('Error fetching invitation:', err?.message || err);
                    return of(null);
                }),
            );
    }

    /** GET /user/invitation/:id/sent — read-only detail for the inviter (accepted/declined notifications). */
    getSentInvitation(id: string): Observable<InvitationDetail | null> {
        return this._httpClient
            .get<{ data: InvitationDetail }>(`${this._invitationUrl}/${id}/sent`)
            .pipe(
                timeout(8000),
                map((res) => res?.data ?? null),
                catchError((err) => {
                    console.warn('Error fetching sent invitation:', err?.message || err);
                    return of(null);
                }),
            );
    }

    /** POST /user/invitation/:id/accept */
    acceptInvitation(id: string): Observable<boolean> {
        return this._httpClient.post<unknown>(`${this._invitationUrl}/${id}/accept`, {}).pipe(
            timeout(8000),
            map(() => true),
            catchError((err) => {
                console.warn('Error accepting invitation:', err?.message || err);
                return of(false);
            }),
        );
    }

    /** POST /user/invitation/:id/decline */
    declineInvitation(id: string): Observable<boolean> {
        return this._httpClient.post<unknown>(`${this._invitationUrl}/${id}/decline`, {}).pipe(
            timeout(8000),
            map(() => true),
            catchError((err) => {
                console.warn('Error declining invitation:', err?.message || err);
                return of(false);
            }),
        );
    }

    // -------------------------------------------------------------------------
    // @ Settings
    // -------------------------------------------------------------------------

    /** GET /notification/setting — one row per scope; `null` when the request fails. */
    getSetting(scope: NotificationSettingScope = 'general'): Observable<NotificationSettingData | null> {
        return this._httpClient
            .get<{ data: NotificationSettingData }>(`${this._baseUrl}/setting`, {
                params: { scope },
            })
            .pipe(
                timeout(8000),
                map((res) => this._cacheSetting(scope, res?.data ?? null)),
                catchError((err) => {
                    console.warn('Error fetching notification setting:', err?.message || err);
                    return of(null);
                }),
            );
    }

    /** PATCH /notification/setting — returns the saved state, or `null` on failure. */
    updateSetting(
        payload: NotificationSettingPayload,
        scope: NotificationSettingScope = 'general',
    ): Observable<NotificationSettingData | null> {
        return this._httpClient
            .patch<{ data: NotificationSettingData }>(`${this._baseUrl}/setting`, { ...payload, scope })
            .pipe(
                timeout(8000),
                map((res) => this._cacheSetting(scope, res?.data ?? null)),
                catchError((err) => {
                    console.warn('Error saving notification setting:', err?.message || err);
                    return of(null);
                }),
            );
    }

    private _cacheSetting(
        scope: NotificationSettingScope,
        setting: NotificationSettingData | null,
    ): NotificationSettingData | null {
        if (setting) this._settingCache.set(scope, setting);
        else this._settingCache.delete(scope);
        return setting;
    }

    ngOnDestroy(): void {
        this.disconnect();
    }
}
