import { DOCUMENT } from '@angular/common';
import { Injectable, NgZone, OnDestroy, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject, filter, takeUntil } from 'rxjs';

/**
 * Hides the app header and the mobile bottom nav while the user scrolls down, and brings them
 * back on the way up — the same gesture the in-page toolbars already use
 * (see `ScrollHideHeaderDirective`), but for the layout chrome that sits outside the router
 * outlet and so cannot be reached by a directive on the page.
 *
 * Pages scroll their own container rather than the document, and there are many such containers
 * across the app, so this listens on the capture phase (scroll does not bubble, but it does
 * capture) instead of asking every page to wire something up.
 *
 * Mobile only: the nav is `lg:hidden` and the header has room to spare on desktop, so the
 * listener no-ops at lg: and up.
 */
@Injectable({ providedIn: 'root' })
export class LayoutChromeService implements OnDestroy {
    private readonly _doc    = inject(DOCUMENT);
    private readonly _zone   = inject(NgZone);
    private readonly _router = inject(Router);

    /** True while the chrome should be tucked away. */
    readonly hidden = signal(false);

    /** Scroll jitter below this many pixels is ignored, so the chrome doesn't flicker. */
    private readonly _hideThreshold = 12;
    /** Near the top the chrome always stays put — hiding it there looks twitchy. */
    private readonly _revealOffset = 64;
    /**
     * Upward movement within this distance of the end of a list is overscroll, not intent —
     * same guard as `ScrollHideHeaderDirective`, and needed here for the same reason.
     */
    private readonly _bottomRevealGuard = 32;
    /** Must cover the chrome's own collapse transition. */
    private readonly _animationMs = 260;
    /** Ignore short scrollers (filter chip rows, menu lists) — only page-sized ones count. */
    private readonly _minScrollRange = 120;

    private readonly _tops = new WeakMap<Element, number>();
    private readonly _unsubscribeAll = new Subject<void>();
    private _mediaQuery?: MediaQueryList;
    private _animating = false;
    private _timer?: ReturnType<typeof setTimeout>;
    private _started = false;

    /** Called by the layout shells; safe to call more than once. */
    start(): void {
        if (this._started) return;
        this._started = true;

        this._mediaQuery = this._doc.defaultView?.matchMedia('(max-width: 1279.98px)');

        // Scrolling fires this many times a second and usually changes nothing, so stay out of
        // the zone and step back in only for an actual flip (see `_set`).
        this._zone.runOutsideAngular(() =>
            this._doc.addEventListener('scroll', this._onScroll, true));

        // A new page starts at the top with its own chrome expectations — never inherit the
        // previous route's collapsed state.
        this._router.events
            .pipe(filter(e => e instanceof NavigationEnd), takeUntil(this._unsubscribeAll))
            .subscribe(() => this.reset());
    }

    /** Brings the chrome back — call when the content underneath it is about to change. */
    reset(): void {
        clearTimeout(this._timer);
        this._animating = false;
        this._set(false);
    }

    private readonly _onScroll = (event: Event): void => {
        if (this._mediaQuery && !this._mediaQuery.matches) return;

        // Resizing the chrome nudges every scroller's scrollTop on its own; ignore those frames
        // rather than read them as the user changing direction.
        if (this._animating) return;

        const el = event.target as Element | Document | null;
        if (!el || !(el instanceof HTMLElement)) return;

        // Menus, dialogs and the like scroll independently of the page — they must not move the
        // app's own chrome.
        if (el.closest('.cdk-overlay-container')) return;

        const range = el.scrollHeight - el.clientHeight;
        if (range < this._minScrollRange) return;

        const top  = el.scrollTop;
        const last = this._tops.get(el) ?? 0;
        const delta = top - last;
        if (Math.abs(delta) < this._hideThreshold) return;
        this._tops.set(el, top);

        // Reaching the end of a list is not a scroll-up — see the matching guard in
        // `ScrollHideHeaderDirective` for why this is needed.
        if (delta < 0 && range - top <= this._bottomRevealGuard) return;

        const hidden = delta > 0 && top > this._revealOffset;
        if (hidden === this.hidden()) return;
        this._set(hidden);

        this._animating = true;
        clearTimeout(this._timer);
        this._timer = setTimeout(() => {
            this._animating = false;
            this._tops.set(el, el.scrollTop);
        }, this._animationMs);
    };

    private _set(hidden: boolean): void {
        if (hidden === this.hidden()) return;
        // The scroll listener runs outside the zone, so the flip has to be handed back in for
        // the layout to re-render.
        this._zone.run(() => this.hidden.set(hidden));
    }

    ngOnDestroy(): void {
        clearTimeout(this._timer);
        this._doc.removeEventListener('scroll', this._onScroll, true);
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }
}
