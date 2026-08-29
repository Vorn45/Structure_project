import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { LocalPasscodeService } from 'app/core/local-passcode/local-passcode.service';

/** Runs inside the authenticated route tree, alongside `AuthGuard` — blocks
 *  navigation while the local passcode lock is active and sends the user to
 *  the lock screen instead.
 *
 *  On a fresh page load (hard refresh, deep link), this guard runs *before*
 *  the route's `resolve` block populates `UserService.user`, so `locked()`
 *  can still be at its unpopulated `false` default here — reading it
 *  directly would let a locked session through on a race. Awaiting a fresh
 *  `refreshStatus(true)` first (the locking variant — it's this guard's job
 *  to actually catch and block an enabled-but-unproven session, not just
 *  refresh cached values) makes the guard's decision always reflect the
 *  server's current answer instead of a stale/default local one.
 *
 *  Once a session has been proven this tab (passcode verified, or the
 *  server said none is enabled), this guard runs on *every* route change
 *  (`canActivateChild` fires per nested segment) — re-hitting the server
 *  each time would be wasteful and, being async, would keep the router
 *  waiting on a network round-trip before it can activate anywhere,
 *  including right after a successful unlock. `hasProvenThisSession()`
 *  lets it skip straight to the synchronous decision once settled. */
export const LocalPasscodeGuard: CanActivateFn | CanActivateChildFn = async (_route, state) => {
    const router: Router = inject(Router);
    const passcodeService = inject(LocalPasscodeService);

    if (passcodeService.locked()) {
        return router.createUrlTree(['/lock'], { queryParams: { redirect: state.url } });
    }

    if (!passcodeService.hasProvenThisSession()) {
        await passcodeService.refreshStatus(true);

        if (passcodeService.locked()) {
            return router.createUrlTree(['/lock'], { queryParams: { redirect: state.url } });
        }
    }

    return true;
};
