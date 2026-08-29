import {
    ChangeDetectorRef,
    Component,
    inject,
    OnDestroy,
    OnInit,
    ViewEncapsulation,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterOutlet } from '@angular/router';
import { readPreferredRoleId } from 'app/core/auth/resolvers/role.util';
import { NavigationService } from 'app/core/navigation/navigation.service';
import { UserService } from 'app/core/user/user.service';
import { Role, User } from 'app/core/user/user.types';
import { MobileBottomNavComponent } from 'app/layout/common/mobile-bottom-nav/component';
import { LayoutChromeService }                     from 'app/layout/common/layout-chrome.service';
import { UserComponent } from 'app/layout/common/user/user.component';
import { HelperLoadingBarComponent } from 'helper/components/loading-bar';
import { HelperNavigationComponent, HelperNavigationItem } from 'helper/components/navigation';
import { HelperMediaWatcherService } from 'helper/services/media-watcher';
import { Subject, takeUntil } from 'rxjs';
import { NotificationsComponent } from '../common/notifications/component';

@Component({
    selector: 'thin-layout',
    templateUrl: './thin.component.html',
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [
        HelperLoadingBarComponent,
        HelperNavigationComponent,
        NotificationsComponent,
        UserComponent,
        MatIconModule,
        MatTooltipModule,
        RouterOutlet,
        MobileBottomNavComponent,
    ],
})
export class ThinLayoutComponent implements OnInit, OnDestroy {
    isScreenSmall: boolean;
    navigations: HelperNavigationItem[];
    orgLogo: string | null = null;
    role: Role;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    get isSuperAdmin(): boolean {
        return ['superadmin', 'admin'].includes(this.role?.slug ?? '');
    }

    /** The logo star badge marks org admins only — not every non-super-admin role. */
    get isOrgAdmin(): boolean {
        return this.role?.slug === 'org_admin';
    }

    /**
     * Constructor
     */
    constructor(
        private _navigationService: NavigationService,
        private _userService: UserService,
        private _helperMediaWatcherService: HelperMediaWatcherService,
        private _changeDetectorRef: ChangeDetectorRef,
    ) {}

    /**
     * On init
     */
    /** Hides the header + bottom nav while scrolling down (mobile only). */
    readonly chrome = inject(LayoutChromeService);

    ngOnInit(): void {
        this.chrome.start();
        // Subscribe to navigation data
        this._navigationService.navigations$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((navigation: HelperNavigationItem[]) => {
                this.navigations = navigation;
                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Subscribe to user changes
        this._userService.user$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((user: User) => {
                const preferredRoleId = readPreferredRoleId();
                const role =
                    user?.roles?.find((r) => r.id === preferredRoleId) ??
                    user?.roles?.find((r) => r.id === user?.is_active) ??
                    user?.roles?.find((r) => r.is_default);
                this.role = role;

                const logo = role?.organization?.logo;
                this.orgLogo = logo?.uri
                    ? `${(logo.file_domain ?? '').replace(/\/+$/, '')}/${logo.uri.replace(/^\/+/, '')}`
                    : null;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Subscribe to media changes
        this._helperMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({ matchingAliases }) => {
                // Check if the screen is small
                this.isScreenSmall = !matchingAliases.includes('lg');
            });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}

