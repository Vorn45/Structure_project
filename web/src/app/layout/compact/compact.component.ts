import { CommonModule }                               from '@angular/common';
import {
    ChangeDetectorRef,
    Component,
    inject,
    OnDestroy,
    OnInit,
    ViewEncapsulation,
}                                                     from '@angular/core';
import { MatButtonModule }                            from '@angular/material/button';
import { MatIconModule }                              from '@angular/material/icon';
import { MatTooltipModule }                           from '@angular/material/tooltip';
import { RouterOutlet }                               from '@angular/router';
import { TranslocoModule, TranslocoService }          from '@ngneat/transloco';
import { readPreferredRoleId }                        from 'app/core/auth/resolvers/role.util';
import { NavigationService }                          from 'app/core/navigation/navigation.service';
import { ProfileOrganizationsResponse, UserService }  from 'app/core/user/user.service';
import { Role, User }                                 from 'app/core/user/user.types';
import { MobileBottomNavComponent }                   from 'app/layout/common/mobile-bottom-nav/component';
import { LayoutChromeService }                     from 'app/layout/common/layout-chrome.service';
import { UserComponent }                              from 'app/layout/common/user/user.component';
import { env }                                        from 'envs/env';
import { HelperLoadingBarComponent }                  from 'helper/components/loading-bar';
import {
    HelperNavigationComponent,
    HelperNavigationItem,
    HelperNavigationService,
}                                                     from 'helper/components/navigation';
import { RoleEnum }                                   from 'helper/enums/role.enum';
import { HelperMediaWatcherService }                  from 'helper/services/media-watcher';
import { Subject, takeUntil }                         from 'rxjs';
import { NotificationsComponent }                     from '../common/notifications/component';

@Component({
    selector: 'compact-layout',
    templateUrl: './compact.component.html',
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [
        CommonModule,
        HelperLoadingBarComponent,
        HelperNavigationComponent,
        NotificationsComponent,
        UserComponent,
        MatIconModule,
        MatButtonModule,
        MatTooltipModule,
        RouterOutlet,
        MobileBottomNavComponent,
        TranslocoModule,
    ],
})
export class CompactLayoutComponent implements OnInit, OnDestroy {
    public appVersion       : string = env.APP_VERSION;
    public isScreenSmall    : boolean;
    public navigations      : HelperNavigationItem[];
    public user             : User;
    public role             : Role;

    public orgLogo          : string | null = null;
    public screenWidth      = window.innerWidth;
    private _unsubscribeAll : Subject<any> = new Subject<any>();
    public translatedRole   : RoleEnum;

    /** Header label resolved from the /account/profile/organizations API (all roles). */
    public headerRoleLabel  = '';
    public current_lang     : string;
    private _headerLabelNames: { name_en?: string; name_kh?: string; fallback: string } | null = null;

    get headerRoleIcon(): string | null {
        return this.role?.slug === 'org_admin' ? 'mdi:star' : null;
    }

    get isSuperAdmin(): boolean {
        return ['superadmin', 'admin'].includes(this.role?.slug ?? '');
    }

    /** The logo star badge marks org admins only — not every non-super-admin role. */
    get isOrgAdmin(): boolean {
        return this.role?.slug === 'org_admin';
    }

    /** Personal workspace pages build their own header row, so this bar
     *  would just duplicate it. */
    get isPersonalWorkspace(): boolean {
        return this.role?.slug === 'personal_workspace';
    }

    /**
     * Constructor
     */
    constructor(
        private _navigationService            : NavigationService,
        private _userService                  : UserService,
        private _helperMediaWatcherService    : HelperMediaWatcherService,
        private _helperNavigationService      : HelperNavigationService,
        private _changeDetectorRef            : ChangeDetectorRef,
        private _translocoService             : TranslocoService,
    ) {}

    /**
     * On init
     */
    /** Hides the header + bottom nav while scrolling down (mobile only). */
    readonly chrome = inject(LayoutChromeService);

    ngOnInit(): void {
        this.chrome.start();
        this.current_lang = this._translocoService.getActiveLang();
        this._translocoService.langChanges$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((lang) => {
                this.current_lang = lang;
                this._applyHeaderLabel();
                this._changeDetectorRef.markForCheck();
            });

        // Subscribe to navigation data
        window.addEventListener('resize', () => {
            this.screenWidth = window.innerWidth;
        });
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
                this.user = user;
                const preferredRoleId = readPreferredRoleId();
                this.role =
                    user?.roles?.find(
                        (role) => role.id === preferredRoleId,
                    ) ??
                    user?.roles?.find(
                        (role) => role.id === user?.is_active,
                    ) ??
                    user?.roles?.find((role) => role.is_default);

                const logo = this.role?.organization?.logo;
                this.orgLogo = logo?.uri
                    ? `${(logo.file_domain ?? '').replace(/\/+$/, '')}/${logo.uri.replace(/^\/+/, '')}`
                    : null;

                this._loadHeaderLabel();

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

   
    private _loadHeaderLabel(): void {
        const activeRole = this.role;
        if (activeRole && ['superadmin', 'admin'].includes(activeRole.slug ?? '')) {
            this._headerLabelNames = {
                name_en: activeRole.name_en,
                name_kh: activeRole.name_kh,
                fallback: 'អភិបាលប្រព័ន្ធ',
            };
            this._applyHeaderLabel();
            this._changeDetectorRef.markForCheck();
            return;
        }

        this._userService
            .getOrganizations()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (res: ProfileOrganizationsResponse) => {
                    const options = res?.data ?? [];
                    if (!options.length) {
                        return;
                    }

                    const activeOrganization =
                        options.find(
                            (item) => item.role?.id === activeRole?.id,
                        ) ??
                        options.find(
                            (item) =>
                                item.role?.slug === activeRole?.slug &&
                                item.is_default,
                        ) ??
                        options.find(
                            (item) =>
                                item.role?.slug === 'org_admin' &&
                                item.is_default,
                        );

                    if (!activeOrganization) {
                        return;
                    }

                    this._headerLabelNames = {
                        name_en:
                            activeOrganization.name_en ??
                            activeOrganization.name?.name_en,
                        name_kh:
                            activeOrganization.name_kh ??
                            activeOrganization.name?.name_kh,
                        fallback: '',
                    };
                    this._applyHeaderLabel();

                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                },
                error: () => {},
            });
    }

    /** Re-picks headerRoleLabel from the cached names for the active language. */
    private _applyHeaderLabel(): void {
        if (!this._headerLabelNames) {
            return;
        }
        const { name_en, name_kh, fallback } = this._headerLabelNames;
        this.headerRoleLabel =
            (this.current_lang === 'en'
                ? name_en ?? name_kh
                : name_kh ?? name_en) ?? fallback;
    }

    /**
     * Toggle navigation
     *
     * @param name
     */
    toggleNavigation(name: string): void {
        // Get the navigation
        const navigation =
            this._helperNavigationService.getComponent<HelperNavigationComponent>(
                name,
            );

        if (navigation) {
            // Toggle the opened status
            navigation.toggle();
        }
    }
}

