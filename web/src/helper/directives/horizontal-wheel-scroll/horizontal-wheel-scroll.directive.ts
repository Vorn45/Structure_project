import {
    Directive,
    ElementRef,
    inject,
    OnDestroy,
    OnInit,
} from '@angular/core';

/**
 * Lets a mouse wheel scroll a horizontally-scrolling container using its
 * vertical `deltaY` (a plain mouse wheel has no horizontal axis). A
 * touchpad's native two-finger swipe already scrolls the container directly
 * via `deltaX`, so this only needs to handle the `deltaY` case.
 *
 * Registered as a genuine non-passive listener via `addEventListener`
 * (bypassing Angular's `(wheel)` binding, which zone.js registers as
 * passive by default) — a passive listener's `preventDefault()` call is
 * silently ignored by the browser, which is why a template `(wheel)`
 * binding alone cannot stop the page's own vertical scroll from consuming
 * the event first.
 */
@Directive({
    selector: '[helperHorizontalWheelScroll]',
    standalone: true,
})
export class HelperHorizontalWheelScrollDirective implements OnInit, OnDestroy {
    private readonly _elementRef = inject(ElementRef<HTMLElement>);

    private readonly _onWheel = (event: WheelEvent): void => {
        if (event.deltaY === 0) return;
        const el = this._elementRef.nativeElement;
        if (el.scrollWidth <= el.clientWidth) return;
        event.preventDefault();
        el.scrollLeft += event.deltaY;
    };

    ngOnInit(): void {
        this._elementRef.nativeElement.addEventListener('wheel', this._onWheel, { passive: false });
    }

    ngOnDestroy(): void {
        this._elementRef.nativeElement.removeEventListener('wheel', this._onWheel);
    }
}
