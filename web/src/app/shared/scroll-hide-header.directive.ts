import { Directive, ElementRef, EventEmitter, inject, Input, NgZone, OnDestroy, Output } from '@angular/core';

/**
 * Collapses a header while the user scrolls down through the host's content and brings
 * it back on the first upward scroll. Applied to the *scroll container*; the header
 * itself is whatever the emitted flag is bound to.
 *
 *   <div scrollHideHeader (headerHiddenChange)="isHeaderHidden = $event"> … </div>
 *
 * The header is expected to collapse (not just fade), so hiding it makes this viewport
 * taller — see `_animating` for why that needs handling.
 */
@Directive({
    selector: '[scrollHideHeader]',
    standalone: true,
})
export class ScrollHideHeaderDirective implements OnDestroy {
    private readonly _el: ElementRef<HTMLElement> = inject(ElementRef);
    private readonly _zone = inject(NgZone);

    /**
     * Scrolling fires this handler many times a second and it changes nothing until the
     * header actually flips — inside Angular's zone every one of those events would still
     * cost a full change-detection pass, which a long list feels as scroll lag. So listen
     * outside the zone and come back in only for the flip itself (see `_emit`).
     */
    constructor() {
        this._zone.runOutsideAngular(() =>
            this._el.nativeElement.addEventListener('scroll', this._onScroll, { passive: true }));
    }

    /** Emits `true` when the header should collapse, `false` when it should come back. */
    @Output() readonly headerHiddenChange = new EventEmitter<boolean>();

    /** Scroll jitter below this many pixels is ignored, so the header doesn't flicker. */
    @Input() hideThreshold = 12;
    /** Within this many pixels of the top the header always stays put — hiding it there looks twitchy. */
    @Input() revealOffset = 64;
    /** Must cover the header's own collapse transition. */
    @Input() animationMs = 260;
    /**
     * How close to the end of the list counts as "parked at the bottom", where upward movement
     * is read as overscroll rather than intent. See the reveal guard in `_onScroll`.
     */
    @Input() bottomRevealGuard = 32;

    private _hidden = false;
    private _lastScrollTop = 0;
    private _animating = false;
    private _timer?: ReturnType<typeof setTimeout>;

    private readonly _onScroll = (): void => {
        // Collapsing/expanding the header resizes this viewport, which nudges scrollTop on
        // its own when the content is parked at the bottom. Ignore those frames rather than
        // read them as the user changing direction and flip the header straight back.
        if (this._animating) return;

        const el = this._el.nativeElement;
        const top = el.scrollTop;
        const delta = top - this._lastScrollTop;
        if (Math.abs(delta) < this.hideThreshold) return;
        this._lastScrollTop = top;

        // Reaching the end of the list is not a scroll-up. Overscroll spring-back at the bottom,
        // and the viewport growing under the content as the header collapses while parked there,
        // both arrive here as upward deltas the user never made — which would pop the header
        // back open exactly when they scroll to the last item. Only downward movement counts
        // in that zone; scrolling properly back up leaves it and reveals as usual.
        if (delta < 0 && el.scrollHeight - el.clientHeight - top <= this.bottomRevealGuard) return;

        const hidden = delta > 0 && top > this.revealOffset;
        if (hidden === this._hidden) return;
        this._emit(hidden);

        this._animating = true;
        clearTimeout(this._timer);
        this._timer = setTimeout(() => {
            this._animating = false;
            this._lastScrollTop = el.scrollTop;
        }, this.animationMs);
    };

    /** Brings the header back — call when the content underneath it is about to change. */
    reset(): void {
        clearTimeout(this._timer);
        this._animating = false;
        this._lastScrollTop = this._el.nativeElement.scrollTop;
        this._emit(false);
    }

    private _emit(hidden: boolean): void {
        if (hidden === this._hidden) return;
        this._hidden = hidden;
        // The scroll listener runs outside the zone, so the flip has to be handed back in
        // for the bound header to actually re-render.
        this._zone.run(() => this.headerHiddenChange.emit(hidden));
    }

    ngOnDestroy(): void {
        clearTimeout(this._timer);
        this._el.nativeElement.removeEventListener('scroll', this._onScroll);
    }
}
