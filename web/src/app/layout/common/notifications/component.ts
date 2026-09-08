import { Overlay, OverlayRef }              from '@angular/cdk/overlay';
import { ComponentPortal, TemplatePortal }  from '@angular/cdk/portal';
import { CommonModule, NgClass }            from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    Injector,
    Input,
    OnDestroy,
    OnInit,
    TemplateRef,
    ViewChild,
    ViewContainerRef,
    ViewEncapsulation,
}                                           from '@angular/core';

import { MatButton, MatButtonModule }       from '@angular/material/button';
import {
    MAT_DIALOG_DATA,
    MatDialog,
    MatDialogRef,
}                                           from '@angular/material/dialog';
import { MatIconModule }                    from '@angular/material/icon';
import { MatMenuModule }                    from '@angular/material/menu';
import { MatTooltipModule }                 from '@angular/material/tooltip';
import { TranslocoModule }                  from '@ngneat/transloco';
import { Notification }                     from 'app/layout/common/notifications/interface';
import {
    NotificationsService,
    isGroupChatNotification,
    notificationAvatarUrl,
}                                           from 'app/layout/common/notifications/service';
import { NotificationSettingsComponent }    from 'app/layout/common/notifications/settings/component';
import { InvitationDetailDialogComponent }  from 'app/layout/common/notifications/invitation-detail/component';
import { DialogConfigService }              from 'app/shared/dialog-config.service';
import { Router }                           from '@angular/router';
import { env }                              from 'envs/env';
import { Subject, takeUntil }               from 'rxjs';

function priorityMeta(_name?: string): { icon: string; color: string } {
    return { icon: 'heroicons_outline:flag', color: 'text-slate-500' };
}

type NotificationTab = 'all' | 'unread';

/**
 * Wording override for `last_message.field_name`s where the API's `content`
 * is a generic "updated" rather than saying what changed. Matches the label
 * the task chat timeline uses for the same field (see SYSTEM_FIELD_LABEL in
 * `2-tasks/view/chat.service.ts`).
 */
const FIELD_LABEL_OVERRIDE: Record<string, string> = {
    rating: 'បានវាយតម្លៃការងារនេះ',
};

/** A set of notifications that all belong to the same task, collapsed into one row. */
export interface NotificationGroup {
    key: string;
    latest: Notification;
    items: Notification[];
    count: number;
    unreadCount: number;
}

@Component({
    selector        : 'notifications',
    templateUrl     : './template.html',
    styleUrls       : ['./style.scss'],
    encapsulation   : ViewEncapsulation.None,
    changeDetection : ChangeDetectionStrategy.OnPush,
    exportAs        : 'notifications',
    standalone      : true,
    imports         : [MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule, NgClass, CommonModule, TranslocoModule],
})
export class NotificationsComponent implements OnInit, OnDestroy {
    @Input() badgeClass = 'bg-blue-800';
    @Input() panelHeightClass = 'sm:h-[95dvh] sm:max-h-[95dvh]';
    @Input() panelOffsetX = 52;
    @Input() panelOffsetY = 0;

    @ViewChild('notificationsOrigin') private _notificationsOrigin: MatButton;
    @ViewChild('notificationsPanel') private _notificationsPanel: TemplateRef<any>;
    @ViewChild('notificationsList') private _notificationsList?: ElementRef<HTMLElement>;

    public notifications: Notification[] = [];
    public activeTab: NotificationTab = 'all';
    public isLoadingMore = false;
    public hasMore = true;
    /**
     * Server-reported total unread count (`data.unread_count`), not derived from
     * `notifications` — that array only holds whichever pages have been loaded
     * so far, and would under/over-count once infinite scroll pages more in.
     */
    public unreadCount = 0;

    /**
     * The "unread" tab's own list, paged independently via `unread_only=true`
     * rather than filtered out of `notifications` — a page of 30 "all" rows can
     * hold fewer unread rows than the server's unread total, which under-showed
     * the tab (e.g. badge says 10, list shows 4) until the user scrolled the
     * "all" stream far enough to page the rest in.
     */
    public unreadNotifications: Notification[] = [];
    public isLoadingMoreUnread = false;
    public hasMoreUnread = true;
    /** Set as soon as the first unread fetch is *triggered* — guards against
     *  re-triggering it (used by `setTab`/`openPanel`/the realtime handler). */
    private _unreadLoaded = false;
    /** Set once the first unread fetch has actually *resolved* — separate from
     *  `_unreadLoaded` so the skeleton keeps showing for the request's duration. */
    private _unreadFirstPageResolved = false;
    private _unreadFetchedCount = 0;
    /** Set once `notifications$` has emitted at least once — distinguishes "still
     *  loading the first page" from "loaded and genuinely empty" for the "all" tab. */
    private _allLoaded = false;

    /** Fixed row count for the loading skeleton — arbitrary, just enough to fill the panel. */
    readonly skeletonRows = [0, 1, 2, 3, 4, 5];

    private readonly _pageSize = 30;
    /** Count of raw (unfiltered) rows fetched so far — the API's offset cursor. */
    private _fetchedCount = 0;
    private _overlayRef: OverlayRef;
    private _chatOverlayRef?: OverlayRef;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _notificationsService: NotificationsService,
        private _overlay: Overlay,
        private _viewContainerRef: ViewContainerRef,
        private _injector: Injector,
        private _dialog: MatDialog,
        private _dialogConfig: DialogConfigService,
        private _router: Router,
    ) {}

    get filteredNotifications(): Notification[] {
        return this.activeTab === 'unread' ? this.unreadNotifications : this.notifications;
    }

    /** True only while the active tab's first page hasn't arrived yet — drives the
     *  row skeleton so it shows instead of the real list or the "no notifications"
     *  empty state, which would otherwise flash in ahead of the real data. */
    get isInitialLoading(): boolean {
        return this.activeTab === 'unread' ? !this._unreadFirstPageResolved : !this._allLoaded;
    }

    /** Badge label, capped so a large backlog doesn't blow out the bell's layout. */
    get unreadCountLabel(): string {
        return this.unreadCount > 99 ? '99+' : String(this.unreadCount);
    }

    /**
     * The visible list, with notifications for the same task collapsed into a
     * single row. Each group keeps its newest notification for display and a
     * count so repeats on one task "stack" (shows 2, 3, …) instead of listing
     * a separate row each time. Project group-chat messages stack per project
     * the same way (they have no task); anything else stays on its own row.
     */
    get filteredNotificationGroups(): NotificationGroup[] {
        const map = new Map<string, NotificationGroup>();
        const order: string[] = [];
        for (const n of this.filteredNotifications) {
            const key = n.task?.id || n.id;
            let group = map.get(key);
            if (!group) {
                group = { key, latest: n, items: [], count: 0, unreadCount: 0 };
                map.set(key, group);
                order.push(key);
            }
            group.items.push(n);
            group.count++;
            if (!n.read) group.unreadCount++;
            if (new Date(n.created_at).getTime() > new Date(group.latest.created_at).getTime()) {
                group.latest = n;
            }
        }
        return order.map((k) => map.get(k)!);
    }

    ngOnInit(): void {
        this._notificationsService.notifications$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((data: Notification[]) => {
                // Project/organization group chats have their own header panel
                // (`<group-chats>`), so they're left out here rather than listed
                // in both places.
                this.notifications = (data || []).filter((n) => !isGroupChatNotification(n));
                this._allLoaded = true;
                // This stream always carries the first page (a fresh load or a
                // live-update refresh), so any older pages appended by scrolling
                // are no longer valid — start over from page one.
                this._fetchedCount = (data || []).length;
                this.hasMore = this._fetchedCount >= this._pageSize;
                // A fresh "all" page (initial load or a realtime nudge) means the
                // unread tab's own cached page is stale too — drop it so the next
                // time it's shown (or already showing) it reloads from the server.
                this.unreadNotifications = [];
                this._unreadFetchedCount = 0;
                this.hasMoreUnread = true;
                this._unreadLoaded = false;
                this._unreadFirstPageResolved = false;
                this._changeDetectorRef.detectChanges();
                this._fillListIfShort();
                if (this.activeTab === 'unread') this._loadUnreadFirstPage();
            });

        this._notificationsService.unreadCount$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((count) => {
                this.unreadCount = count;
                this._changeDetectorRef.markForCheck();
            });

        // Initial fetch (the panel was previously empty until a socket event
        // arrived — and SOCKET_URL is often unset), then subscribe to live updates.
        this._notificationsService.refresh();
        this._notificationsService.connect();
    }

    /**
     * Bound to (scroll) on the list container rather than an IntersectionObserver
     * on a sentinel — that sentinel lives inside a CDK TemplatePortal, where
     * @ViewChild's query timing and the observer's own callback (both running
     * outside Angular's normal event flow) were unreliable about ever firing a
     * render, leaving loaded pages invisible until an unrelated click forced one.
     * A native (scroll) binding goes through zone.js like any other DOM event.
     */
    onListScroll(event: Event): void {
        const el = event.target as HTMLElement;
        if (el.scrollHeight - el.scrollTop - el.clientHeight < 120) {
            if (this.activeTab === 'unread') this.loadMoreUnread();
            else this.loadMore();
        }
    }

    /**
     * A (scroll) handler never fires if the loaded rows don't overflow the
     * panel yet (e.g. a first page that collapses into one or two grouped
     * rows) — nothing for the user to scroll. Proactively top up in that case
     * so `hasMore` pages keep loading until they either fill the viewport or
     * run out, without waiting on a gesture that can't happen.
     */
    private _fillListIfShort(): void {
        const hasMore = this.activeTab === 'unread' ? this.hasMoreUnread : this.hasMore;
        const isLoadingMore = this.activeTab === 'unread' ? this.isLoadingMoreUnread : this.isLoadingMore;
        if (!hasMore || isLoadingMore) return;
        setTimeout(() => {
            const el = this._notificationsList?.nativeElement;
            if (!el || el.scrollHeight > el.clientHeight) return;
            if (this.activeTab === 'unread') this.loadMoreUnread();
            else this.loadMore();
        });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
        this._notificationsService.disconnect();
        this._overlayRef?.dispose();
        this._chatOverlayRef?.dispose();
    }

    // -------------------------------------------------------------------------
    // @ Panel
    // -------------------------------------------------------------------------

    openPanel(): void {
        if (!this._notificationsPanel || !this._notificationsOrigin) return;
        if (this._overlayRef) {
            this._overlayRef.dispose();
            this._overlayRef = null;
        }
        this._createOverlay();
        this._overlayRef.attach(new TemplatePortal(this._notificationsPanel, this._viewContainerRef));
        this._notificationsService.refresh();
        this._changeDetectorRef.detectChanges();
        if (this.activeTab === 'unread') {
            if (!this._unreadLoaded) this._loadUnreadFirstPage();
        } else {
            this._fillListIfShort();
        }
    }

    closePanel(): void {
        this._overlayRef?.detach();
    }

    // -------------------------------------------------------------------------
    // @ Actions
    // -------------------------------------------------------------------------

    setTab(tab: NotificationTab): void {
        this.activeTab = tab;
        this._changeDetectorRef.markForCheck();
        if (tab === 'unread' && !this._unreadLoaded) this._loadUnreadFirstPage();
        else this._fillListIfShort();
    }

    markAllAsRead(): void {
        this.unreadCount = 0;
        this.notifications = this.notifications.map((n) => ({ ...n, read: true, read_at: new Date() }));
        this.unreadNotifications = [];
        this._changeDetectorRef.markForCheck();
        this._notificationsService.markAllRead().subscribe();
    }

    /** Plays the Apple iPhone chime immediately for testing/preview */
    playTestSound(): void {
        this._notificationsService.playIphoneChime();
    }

    /** Triggers a live test notification from backend to simulate receiving a new task */
    triggerTestNotification(): void {
        this._notificationsService.triggerTestNotification().subscribe(() => {
            this._notificationsService.refresh();
        });
    }

    /** Fetch the next "all" page and append it below what's already loaded. */
    loadMore(): void {
        if (this.isLoadingMore || !this.hasMore) return;
        this.isLoadingMore = true;
        this._changeDetectorRef.detectChanges();
        this._notificationsService
            .getPage(this._pageSize, this._fetchedCount)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({ notifications, total }) => {
                this.isLoadingMore = false;
                const page = notifications.filter((n) => !isGroupChatNotification(n));
                this.notifications = [...this.notifications, ...page];
                this._fetchedCount += notifications.length;
                this.hasMore = this._fetchedCount < total && notifications.length > 0;
                this._changeDetectorRef.detectChanges();
                this._fillListIfShort();
            });
    }

    /** First page of the unread tab, filtered server-side (`unread_only=true`). */
    private _loadUnreadFirstPage(): void {
        this._unreadLoaded = true;
        this.isLoadingMoreUnread = true;
        this._changeDetectorRef.detectChanges();
        this._notificationsService
            .getPage(this._pageSize, 0, true)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({ notifications, total }) => {
                this.isLoadingMoreUnread = false;
                this._unreadFirstPageResolved = true;
                const page = notifications.filter((n) => !isGroupChatNotification(n));
                this.unreadNotifications = page;
                this._unreadFetchedCount = notifications.length;
                this.hasMoreUnread = this._unreadFetchedCount < total && notifications.length > 0;
                this._changeDetectorRef.detectChanges();
                this._fillListIfShort();
            });
    }

    /** Fetch the next unread page and append it below what's already loaded. */
    loadMoreUnread(): void {
        if (this.isLoadingMoreUnread || !this.hasMoreUnread) return;
        this.isLoadingMoreUnread = true;
        this._changeDetectorRef.detectChanges();
        this._notificationsService
            .getPage(this._pageSize, this._unreadFetchedCount, true)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({ notifications, total }) => {
                this.isLoadingMoreUnread = false;
                const page = notifications.filter((n) => !isGroupChatNotification(n));
                this.unreadNotifications = [...this.unreadNotifications, ...page];
                this._unreadFetchedCount += notifications.length;
                this.hasMoreUnread = this._unreadFetchedCount < total && notifications.length > 0;
                this._changeDetectorRef.detectChanges();
                this._fillListIfShort();
            });
    }

    /** Open the notification settings side dialog (closes the panel first). */
    openSettings(): void {
        this.closePanel();
        this._dialog.open(NotificationSettingsComponent, this._dialogConfig.getDialogConfig());
    }

    /** View all notifications - navigates to tasks / activity page */
    viewAllNotifications(): void {
        this.closePanel();
        const currentUrl = this._router.url;
        const isAdmin =
            currentUrl.startsWith('/admin') ||
            currentUrl.startsWith('/org-admin') ||
            currentUrl.startsWith('/super-admin');

        if (isAdmin) {
            this._router.navigate(['/admin/planner']);
        } else {
            this._router.navigate(['/member/tasks']);
        }
    }

    /**
     * Messenger-style 3-pane view, same as the group-chats bell's own "ពេញអេក្រង់"
     * entry — opened on the Task tab since that's what this bell is about.
     * `disableClose` so ESC doesn't fall through to Material's default (close the
     * whole dialog) — the component's own ESC handler decides what to do instead.
     */
    openFullScreen(): void {
        this.closePanel();
    }

    /** Mark the group read and navigate to the related task / page. */
    onGroupClick(group: NotificationGroup): void {
        const unreadIds = new Set(group.items.filter((n) => !n.read).map((n) => n.id));
        if (!group.latest.read) {
            unreadIds.add(group.latest.id);
        }

        if (unreadIds.size) {
            this.notifications = this.notifications.map((n) =>
                unreadIds.has(n.id) ? { ...n, read: true, read_at: new Date() } : n,
            );
            this.unreadNotifications = this.unreadNotifications.filter((n) => !unreadIds.has(n.id));
            group.unreadCount = 0;
            group.latest.read = true;
            this.unreadCount = Math.max(0, this.unreadCount - unreadIds.size);
            this._notificationsService.decrementUnreadCount(unreadIds.size);
            this._changeDetectorRef.markForCheck();
            this._notificationsService.markReadMany([...unreadIds]).subscribe();
        }

        const invitationId = group.latest.data?.['invitation_id'];
        const isInvitee = group.latest.type === 'organization_invitation_received';
        const isInviter =
            group.latest.type === 'organization_invitation_accepted'
            || group.latest.type === 'organization_invitation_declined';
        if ((isInvitee || isInviter) && invitationId) {
            this._dialog.open(
                InvitationDetailDialogComponent,
                this._dialogConfig.getCenterDialogConfig(
                    { invitationId, viewAsInviter: isInviter },
                    '480px',
                ),
            );
            return;
        }

        this.closePanel();

        const notif = group.latest;
        const currentUrl = this._router.url;
        const isAdmin =
            currentUrl.startsWith('/admin') ||
            currentUrl.startsWith('/org-admin') ||
            currentUrl.startsWith('/super-admin');

        const type = (notif.type || '').toLowerCase();
        const title = (notif.title || notif.title_kh || notif.title_en || '').toLowerCase();

        const taskId = notif.task?.id || notif.data?.task_id || notif.data?.['task_id'];
        const taskCode = notif.task?.task_code || notif.data?.task_code;

        if (type.includes('attendance') || title.includes('វត្តមាន')) {
            this._router.navigate([isAdmin ? '/admin/dashboard' : '/member/home']);
        } else if (type.includes('account') || type.includes('setting')) {
            this._router.navigate(['/profile']);
        } else if (type.includes('feature') || title.includes('ប្រកាស')) {
            this._router.navigate([isAdmin ? '/admin/projects' : '/member/projects']);
        } else {
            // Task assigned, task comments, error alerts
            this._router.navigate([isAdmin ? '/admin/planner' : '/member/tasks'], {
                queryParams: {
                    ...(taskId ? { taskId: String(taskId) } : {}),
                    ...(taskCode ? { taskCode: String(taskCode) } : {}),
                },
            });
        }
    }

    // -------------------------------------------------------------------------
    // @ Display helpers
    // -------------------------------------------------------------------------

    projectLabel(notification: Notification): string {
        return (
            notification.project?.short_name_kh ||
            notification.project?.short_name_en ||
            'PMS'
        );
    }

    titleText(notification: Notification): string {
        return notification.title_kh || notification.title || notification.title_en || '';
    }

    /** The task's name (falls back to its code, then the notification title). */
    /** The notification's title in Khmer */
    taskTitle(notification: Notification): string {
        return (
            notification.title_kh ||
            notification.title ||
            notification.task?.title ||
            notification.task?.task_code ||
            notification.title_en ||
            'ការជូនដំណឹង'
        );
    }

    messageText(notification: Notification): string {
        return notification.message_kh || notification.message || notification.message_en || '';
    }

    lastMessagePrefix(notification: Notification): string {
        if (notification.message_kh) return notification.message_kh;
        if (notification.message) return notification.message;
        const last = notification.last_message;
        if (!last) return this.messageText(notification);

        const senderName = last.sender?.name_kh || last.sender?.name_en || '';
        const content = (last.field_name && FIELD_LABEL_OVERRIDE[last.field_name]) || last.content || '';
        return senderName ? `${senderName}: ${content}`.trim() : content;
    }

    lastMessageValueText(notification: Notification): string {
        const last = notification.last_message;
        if (last?.value?.users?.length) {
            return last.value.users
                .map((user) => user.name_kh || user.name_en || '')
                .filter(Boolean)
                .join(', ');
        }
        if (last?.value?.text) return last.value.text;
        return last?.value?.name_kh || last?.value?.name_en || '';
    }

    hasLastMessageValue(notification: Notification): boolean {
        return !!this.lastMessageValueText(notification);
    }

    /** Numeric rating from the notification preview value, when this is a rating update. */
    lastMessageRating(notification: Notification): number | null {
        const last = notification.last_message;
        if (last?.field_name !== 'rating') return null;

        const value = Number.parseInt(String(last.value?.text ?? '').split('/')[0], 10);
        return Number.isFinite(value) && value >= 0 && value <= 5 ? value : null;
    }

    /**
     * Icon for the resolved status/priority/type value. Prefers the lookup's
     * uploaded icon (same file the chat timeline shows); when none was
     * uploaded, falls back to the same hardcoded mdi icon the priority badge
     * itself uses (task.service.ts `priorityMeta`) so the two stay visually
     * consistent. Status/type currently have no equivalent hardcoded fallback,
     * so they simply show no icon when unresolved.
     */
    lastMessageValueIcon(notification: Notification): { img: string | null; icon: string | null; color: string } {
        const last = notification.last_message;

        if (last?.value?.users?.length) {
            return { img: null, icon: null, color: 'text-slate-500' };
        }

        // Rating has no uploaded/lookup icon of its own — same star used by
        // the task chat timeline (chat.service.ts, field === 'rating').
        if (last?.field_name === 'rating') {
            return { img: null, icon: 'mdi:star', color: 'text-amber-400' };
        }

        const uploadedIcon = last?.value?.icon;
        const domain = uploadedIcon?.file_domain || env.FILE_BASE_URL || '';
        const img = uploadedIcon?.uri
            ? (/^https?:\/\//i.test(uploadedIcon.uri) ? uploadedIcon.uri : `${domain.replace(/\/+$/, '')}/${String(uploadedIcon.uri).replace(/^\/+/, '')}`)
            : null;

        if (last?.field_name === 'priority_id') {
            const meta = priorityMeta(last?.value?.name_en);
            return { img, icon: img ? null : meta.icon, color: meta.color };
        }
        return { img, icon: null, color: 'text-slate-500' };
    }

    notificationAvatar(notification: Notification): string {
        return notificationAvatarUrl(notification.task?.avatar ?? notification.project?.avatar);
    }

    onNotificationAvatarError(event: Event): void {
        (event.target as HTMLImageElement).src = 'images/logo/default_logo.png';
    }

    /** Relative time in Khmer e.g. "ទើបតែឥឡូវនេះ", "1 នាទីមុន", "1 ម៉ោងមុន", "ម្សិលមិញ" */
    formatRelativeTime(date: Date | string): string {
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        const now = Date.now();
        const diffSec = Math.floor((now - d.getTime()) / 1000);

        if (diffSec < 45) return 'ទើបតែឥឡូវនេះ';
        const diffMin = Math.floor(diffSec / 60);
        if (diffMin < 60) return `${diffMin} នាទីមុន`;
        const diffHr = Math.floor(diffMin / 60);
        if (diffHr < 24) return `${diffHr} ម៉ោងមុន`;
        const diffDays = Math.floor(diffHr / 24);
        if (diffDays === 1) return 'ម្សិលមិញ';
        if (diffDays < 7) return `${diffDays} ថ្ងៃមុន`;
        return d.toLocaleDateString('km-KH', { month: 'short', day: 'numeric' });
    }

    /** Visual icon + badge background matching reference layout */
    getNotificationIconMeta(notification: Notification): { icon: string; bgClass: string; textClass: string } {
        const type = (notification.type || '').toLowerCase();
        const title = (notification.title || notification.title_en || notification.title_kh || '').toLowerCase();

        if (type.includes('fail') || type.includes('error') || type.includes('bug') || title.includes('fail') || title.includes('បញ្ហា')) {
            return {
                icon: 'mdi:alert-circle-outline',
                bgClass: 'bg-rose-50 dark:bg-rose-950/60 border border-rose-100 dark:border-rose-900/40',
                textClass: 'text-rose-500 dark:text-rose-400',
            };
        }

        if (type.includes('update') || type.includes('setting') || type.includes('account') || title.includes('update') || title.includes('កែប្រែ')) {
            return {
                icon: 'mdi:cog-outline',
                bgClass: 'bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-900/40',
                textClass: 'text-amber-500 dark:text-amber-400',
            };
        }

        if (type.includes('feature') || type.includes('announce') || type.includes('system') || title.includes('feature') || title.includes('វត្តមាន') || title.includes('ប្រកាស')) {
            return {
                icon: 'mdi:bullhorn-outline',
                bgClass: 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/40',
                textClass: 'text-emerald-500 dark:text-emerald-400',
            };
        }

        // Default / Task Assigned
        return {
            icon: 'mdi:bell-outline',
            bgClass: 'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/40',
            textClass: 'text-indigo-600 dark:text-indigo-400',
        };
    }

    /** 24-hour HH:mm, e.g. "16:30". */
    formatTime(date: Date | string): string {
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        const h = d.getHours().toString().padStart(2, '0');
        const m = d.getMinutes().toString().padStart(2, '0');
        return `${h}:${m}`;
    }

    trackByFn(index: number, item: Notification): any {
        return item.id || index;
    }

    private _createOverlay(): void {
        const isMobile = window.innerWidth < 640;
        const positionStrategy = isMobile
            ? this._overlay
                .position()
                .global()
                .top('0')
                .left('0')
                .bottom('0')
                .right('0')
            : this._overlay
                .position()
                .flexibleConnectedTo(this._notificationsOrigin._elementRef.nativeElement)
                .withLockedPosition(true)
                .withPush(true)
                .withPositions([
                    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetX: 0, offsetY: this.panelOffsetY },
                    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetX: 0, offsetY: this.panelOffsetY },
                    { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetX: 0, offsetY: this.panelOffsetY },
                    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetX: 0, offsetY: this.panelOffsetY },
                ]);

        this._overlayRef = this._overlay.create({
            hasBackdrop: true,
            backdropClass: 'helper-backdrop-on-mobile',
            scrollStrategy: this._overlay.scrollStrategies.block(),
            positionStrategy,
        });
        this._overlayRef.backdropClick().subscribe(() => this._overlayRef?.detach());
    }
}
