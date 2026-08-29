import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, take } from 'rxjs';

/** `/redirect` is a synchronous, guard-only hop (`RedirectGuard` just decodes
 *  the cached JWT) that immediately triggers a second navigation to the
 *  user's real landing route — it never has content of its own, so its
 *  `NavigationEnd` isn't "the page is ready" yet. */
const TRANSIENT_ROUTE_PREFIXES = ['/redirect'];

@Injectable({ providedIn: 'root' })
export class HelperSplashScreenService {
    private _document = inject(DOCUMENT);
    private _router = inject(Router);

    /**
     * Keep the splash up for at least this long, measured from navigation start.
     *
     * Between bootstrap and the NavigationEnd this waits for, most steps are
     * synchronous — RedirectGuard and initialDataResolver just decode the
     * cached JWT, no HTTP — but LocalPasscodeGuard does await a real
     * server round-trip to check passcode-lock status before allowing the
     * authenticated route tree through. On a cache miss (chunk load) or a
     * slow passcode check that takes hundreds of milliseconds and the splash
     * is clearly visible; on a warm/fast case it resolves in a few ms,
     * hide() lands in the same frame as the first paint, and the splash
     * never renders at all. That is why it appeared only sometimes. A floor
     * makes both boots look the same.
     */
    private static readonly MIN_VISIBLE_MS = 600;

    /** Generic app logo shown when the target role has no organization branding. */
    private static readonly DEFAULT_LOGO = '/images/logo/plan_logo.png';

    /**
     * Constructor
     */
    constructor() {
        // Hide on the first NavigationEnd that has actually settled on real
        // content, but not before the splash has had time to be seen. Skips
        // over `/redirect`'s own NavigationEnd — that hop has no content of
        // its own and immediately kicks off a second navigation (through
        // LocalPasscodeGuard's async check) to the real landing route, so
        // hiding on it would expose whatever was behind the splash while
        // that second navigation is still resolving.
        this._router.events
            .pipe(
                filter((event) => event instanceof NavigationEnd),
                filter((event) => !TRANSIENT_ROUTE_PREFIXES.some((p) => (event as NavigationEnd).urlAfterRedirects.startsWith(p))),
                take(1)
            )
            .subscribe(() => {
                // performance.now() is milliseconds since navigation start, so
                // this measures from when the browser began loading the page
                // rather than from whenever this service happened to be built.
                const remaining =
                    HelperSplashScreenService.MIN_VISIBLE_MS - performance.now();

                if (remaining <= 0) {
                    this.hide();
                    return;
                }

                setTimeout(() => this.hide(), remaining);
            });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Show the splash screen
     */
    show(): void {
        this._document.body.classList.remove('helper-splash-screen-hidden');
    }

    /**
     * Hide the splash screen
     */
    hide(): void {
        this._document.body.classList.add('helper-splash-screen-hidden');
    }

    /**
     * Swap the splash logo ahead of a reload (e.g. role switch) instead of waiting for
     * index.html's bootstrap script to re-derive it from the JWT on the next load. The
     * caller usually already has this URL warm in the browser's image cache (it was just
     * rendered in a list row), so setting it here paints instantly instead of showing the
     * previous org's logo — or a blank image — until the fresh page finishes loading it.
     */
    setLogo(url?: string | null): void {
        const img = this._document.getElementById('app-splash-logo') as HTMLImageElement | null;
        if (img) img.src = url || HelperSplashScreenService.DEFAULT_LOGO;
    }
}
