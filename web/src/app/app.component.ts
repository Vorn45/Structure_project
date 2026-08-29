import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
    Event as RouterEvent,
    NavigationCancel,
    NavigationEnd,
    NavigationError,
    NavigationStart,
    Router,
    RouterOutlet,
} from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { NotificationBadgeService } from 'app/core/notification/badge.service';
import { HelperLoadingService } from 'helper/services/loading';

const CHUNK_LOAD_FAILURE = /failed to fetch dynamically imported module|error loading dynamically imported module|loading chunk \S+ failed|importing a module script failed/i;
const RELOAD_GUARD_KEY = 'pms.chunkReloadAt';

@Component({
    selector: 'app-root',
    template: `<router-outlet />`,
    standalone: true,
    imports: [RouterOutlet],
})
export class AppComponent {
    constructor() {
        inject(NotificationBadgeService).init();

        const router = inject(Router);
        const dialog = inject(MatDialog);
        const loading = inject(HelperLoadingService);

        router.events
            .pipe(takeUntilDestroyed())
            .subscribe((event: RouterEvent) => {
                if (event instanceof NavigationStart) {
                    dialog.closeAll();
                    loading.show();
                    return;
                }

                if (event instanceof NavigationEnd || event instanceof NavigationCancel) {
                    loading.hide();
                    return;
                }

                if (event instanceof NavigationError) {
                    loading.hide();
                    this._recoverFromStaleBuild(event);
                }
            });
    }

    private _recoverFromStaleBuild(event: NavigationError): void {
        const message = String((event.error as Error)?.message ?? event.error ?? '');
        if (!CHUNK_LOAD_FAILURE.test(message)) {
            return;
        }

        try {
            const last = Number(sessionStorage.getItem(RELOAD_GUARD_KEY) ?? 0);
            if (Date.now() - last < 60_000) {
                return;
            }
            sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
        } catch {}

        location.reload();
    }
}
