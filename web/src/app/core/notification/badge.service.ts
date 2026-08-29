import { DOCUMENT }                from '@angular/common';
import { Injectable, inject }     from '@angular/core';
import { NotificationsService }   from 'app/layout/common/notifications/service';

const DEFAULT_FAVICON = 'images/logo/plan_logo.png';
const BADGE_COLOR = '#ef4444';
const CANVAS_SIZE = 64;

/**
 * Mirrors the unread notification count onto the browser tab: a red badge drawn
 * over the favicon (the one `index.html` declares as `#app-favicon`, which may
 * already have been swapped for the organization's logo) and a `(12)` prefix on
 * the document title.
 */
@Injectable({ providedIn: 'root' })
export class NotificationBadgeService {
    private _document = inject(DOCUMENT);
    private _notificationsService = inject(NotificationsService);

    /** The favicon as it was before we started drawing badges over it. */
    private _baseHref?: string;
    private _baseTitle?: string;
    private _baseImage?: HTMLImageElement;
    private _lastCount = -1;

    /** Subscribe to the unread count and keep the tab in sync. Call once. */
    init(): void {
        this._notificationsService.unreadCount$.subscribe((count) => {
            if (count === this._lastCount) return;
            this._lastCount = count;
            this._applyTitle(count);
            void this._applyFavicon(count);
        });
    }

    // -------------------------------------------------------------------------
    // @ Title
    // -------------------------------------------------------------------------

    private _applyTitle(count: number): void {
        if (this._baseTitle === undefined) {
            this._baseTitle = this._document.title.replace(/^\(\d+\+?\)\s*/, '');
        }
        this._document.title = count > 0
            ? `(${this._label(count)}) ${this._baseTitle}`
            : this._baseTitle;
    }

    // -------------------------------------------------------------------------
    // @ Favicon
    // -------------------------------------------------------------------------

    private async _applyFavicon(count: number): Promise<void> {
        const link = this._faviconLink();
        if (!link) return;

        if (this._baseHref === undefined) this._baseHref = link.href;

        if (count <= 0) {
            link.href = this._baseHref;
            return;
        }

        try {
            const image = await this._baseFaviconImage();
            const canvas = this._document.createElement('canvas');
            canvas.width = canvas.height = CANVAS_SIZE;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            ctx.drawImage(image, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
            this._drawBadge(ctx);
            link.href = canvas.toDataURL('image/png');
        } catch {
            // Cross-origin logo (tainted canvas) or a broken image — leave the
            // plain favicon in place; the title still carries the count.
        }
    }

    /** Plain red dot, top-right of the icon. */
    private _drawBadge(ctx: CanvasRenderingContext2D): void {
        const radius = CANVAS_SIZE * 0.22;
        const cx = CANVAS_SIZE - radius;
        const cy = radius;

        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = BADGE_COLOR;
        ctx.fill();
        ctx.lineWidth = CANVAS_SIZE * 0.05;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
    }

    /**
     * The unbadged favicon, loaded once. Falls back to the bundled app logo when
     * the organization's remote logo can't be loaded for canvas use.
     */
    private async _baseFaviconImage(): Promise<HTMLImageElement> {
        if (this._baseImage) return this._baseImage;
        try {
            this._baseImage = await this._loadImage(this._baseHref || DEFAULT_FAVICON);
        } catch {
            this._baseImage = await this._loadImage(DEFAULT_FAVICON);
        }
        return this._baseImage;
    }

    private _loadImage(src: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.crossOrigin = 'anonymous';
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = src;
        });
    }

    private _faviconLink(): HTMLLinkElement | null {
        return (
            this._document.getElementById('app-favicon') as HTMLLinkElement | null
        ) ?? this._document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
    }

    private _label(count: number): string {
        return count > 99 ? '99+' : String(count);
    }
}
