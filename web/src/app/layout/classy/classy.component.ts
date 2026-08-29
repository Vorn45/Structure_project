    import { CommonModule } from '@angular/common';
    import {
        ChangeDetectorRef,
        Component,
        OnDestroy,
        OnInit,
        ViewEncapsulation,
    } from '@angular/core';
    import { MatButtonModule } from '@angular/material/button';
    import { MatIconModule } from '@angular/material/icon';
    import { RouterOutlet } from '@angular/router';
    import { TranslocoModule } from '@ngneat/transloco';
    import { readPreferredRoleId } from 'app/core/auth/resolvers/role.util';
    import { NavigationService } from 'app/core/navigation/navigation.service';
    import { UserService } from 'app/core/user/user.service';
    import { Role, User } from 'app/core/user/user.types';
    import { LanguagesComponent } from 'app/layout/common/languages/languages.component';
    import { SchemeComponent } from 'app/layout/common/scheme/scheme.component';
    import { UserComponent } from 'app/layout/common/user/user.component';
    import { env } from 'envs/env';
    import { HelperFullscreenComponent } from 'helper/components/fullscreen';
    import { HelperLoadingBarComponent } from 'helper/components/loading-bar';
    import {
        HelperNavigationComponent,
        HelperNavigationItem,
        HelperNavigationService,
    } from 'helper/components/navigation';
    import { RoleEnum } from 'helper/enums/role.enum';
    import { HelperMediaWatcherService } from 'helper/services/media-watcher';
    import { Subject, takeUntil } from 'rxjs';
        import { NotificationsComponent } from '../common/notifications/component';

    @Component({
        selector: 'classy-layout',
        templateUrl: './classy.component.html',
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
            LanguagesComponent,
            HelperFullscreenComponent,
            RouterOutlet,
            TranslocoModule,
            SchemeComponent,
        ],
    })
    export class ClassyLayoutComponent implements OnInit, OnDestroy {
        appVersion: string = env.APP_VERSION;
        isScreenSmall: boolean;
        navigations: HelperNavigationItem[];
        user: User;
        role: Role;
        screenWidth = window.innerWidth;
        private _unsubscribeAll: Subject<any> = new Subject<any>();

        translatedRole: RoleEnum;

        /** Personal workspace pages build their own header row, so this bar
         *  would just duplicate it. */
        get isPersonalWorkspace(): boolean {
            return this.role?.slug === 'personal_workspace';
        }

        /**
         * Constructor
         */
        constructor(
            private _navigationService: NavigationService,
            private _userService: UserService,
            private _helperMediaWatcherService: HelperMediaWatcherService,
            private _helperNavigationService: HelperNavigationService,
            private _changeDetectorRef: ChangeDetectorRef,
        ) {}

        /**
         * On init
         */
        ngOnInit(): void {
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
                        user?.roles?.find((role) => role.id === preferredRoleId) ??
                        user?.roles?.find((role) => role.id === user?.is_active) ??
                        user?.roles?.find((role) => role.is_default);

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

