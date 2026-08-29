import { DOCUMENT } from '@angular/common';
import {
    Component,
    Inject,
    OnDestroy,
    OnInit,
    Renderer2,
    RendererStyleFlags2,
    ViewEncapsulation,
} from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { HelperConfig, HelperConfigService } from 'helper/services/config';
import { HelperMediaWatcherService } from 'helper/services/media-watcher';
import { HelperPlatformService } from 'helper/services/platform';
import { APP_VERSION } from 'helper/version';
import { Subject, combineLatest, filter, map, takeUntil } from 'rxjs';
import { readPreferredRoleId } from 'app/core/auth/resolvers/role.util';
import { UserService } from 'app/core/user/user.service';
import { User } from 'app/core/user/user.types';
import { EmptyLayoutComponent } from './empty/empty.component';
import { ClassyLayoutComponent } from './classy/classy.component';
import { CompactLayoutComponent } from './compact/compact.component';
import { ThinLayoutComponent } from './thin/thin.component';
import { ThinHeaderLayoutComponent } from './thin-header/thin-header.component';
import { buildPrimaryThemeVars } from './organization-theme.util';

@Component({
    selector: 'layout',
    templateUrl: './layout.component.html',
    styleUrls: ['./layout.component.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [
        EmptyLayoutComponent,
        ClassyLayoutComponent,
        CompactLayoutComponent,
        ThinLayoutComponent,
        ThinHeaderLayoutComponent,
    ],
})
export class LayoutComponent implements OnInit, OnDestroy {
    config: HelperConfig;
    layout: string;
    scheme: 'dark' | 'light';
    theme: string;
    fontSize: string = 'medium';
    customColor: string | null = null;
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    private _appliedOrgThemeVars: string[] = [];
    private _orgPrimaryColor: string | null = null;

    private readonly _fontSizeMap: { [key: string]: string } = {
        small: '13px',
        medium: '16px',
        large: '20px',
        'super-big': '24px',
    };

    constructor(
        private _activatedRoute: ActivatedRoute,
        @Inject(DOCUMENT) private _document: any,
        private _renderer2: Renderer2,
        private _router: Router,
        private _helperConfigService: HelperConfigService,
        private _helperMediaWatcherService: HelperMediaWatcherService,
        private _helperPlatformService: HelperPlatformService,
        private _userService: UserService,
    ) {}

    ngOnInit(): void {
        this._helperConfigService.config$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((config: HelperConfig) => {
                this.config = config;
                this._updateLayout();
                this._updateScheme();
                this._updateTheme();
                this._updateFontSize();
            });

        this._helperMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({ matchingAliases }) => {
                if (matchingAliases.includes('md')) {
                    this._updateLayout();
                }
            });

        this._router.events
            .pipe(
                filter((event) => event instanceof NavigationEnd),
                takeUntil(this._unsubscribeAll),
            )
            .subscribe(() => {
                this._updateLayout();
            });

        this._renderer2.setAttribute(
            this._document.querySelector('[ng-version]'),
            'app-version',
            APP_VERSION,
        );

        this._renderer2.addClass(
            this._document.body,
            this._helperPlatformService.isMac ? 'is-mac' : 'is-windows',
        );

        this._userService.user$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((user: User) => {
                const preferredRoleId = readPreferredRoleId();
                const role =
                    user?.roles?.find((r) => r.id === preferredRoleId) ??
                    user?.roles?.find((r) => r.id === user?.is_active) ??
                    user?.roles?.find((r) => r.is_default);

                const nextPrimary = role?.organization?.primary_color ?? null;
                if (nextPrimary !== this._orgPrimaryColor) {
                    this._orgPrimaryColor = nextPrimary;
                    this._updateTheme();
                }
            });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    private _updateLayout(): void {
        let route = this._activatedRoute;
        while (route.firstChild) {
            route = route.firstChild;
        }

        this.layout = this.config.layout;

        const paths = route.pathFromRoot;
        paths.forEach((path) => {
            if (path.routeConfig && path.routeConfig.data && path.routeConfig.data.layout) {
                this.layout = path.routeConfig.data.layout;
            }
        });
    }

    private _updateScheme(): void {
        this._document.body.classList.remove('light', 'dark');
        this._document.body.classList.add(this.config.scheme);
    }

    private _updateTheme(): void {
        this._document.body.classList.forEach((className: string) => {
            if (className.startsWith('theme-')) {
                this._document.body.classList.remove(className, className.split('-')[1]);
            }
        });

        this._clearAppliedOrgTheme();

        const customColor = this.config.customColor;
        if (this.config.theme === 'theme-custom' && customColor) {
            this._applyCustomPrimaryColor(customColor);
            return;
        }

        if (this.config.theme === 'theme-default' && this._orgPrimaryColor) {
            this._applyCustomPrimaryColor(this._orgPrimaryColor);
            return;
        }

        this._document.body.classList.add(this.config.theme);
    }

    private _clearAppliedOrgTheme(): void {
        const root = this._document.documentElement;
        if (this._appliedOrgThemeVars.length > 0) {
            this._appliedOrgThemeVars.forEach((varName) => {
                this._renderer2.removeStyle(root, varName, RendererStyleFlags2.DashCase);
            });
            this._appliedOrgThemeVars = [];
        }
    }

    private _applyCustomPrimaryColor(color: string): void {
        const root = this._document.documentElement;
        const vars = buildPrimaryThemeVars(color);
        Object.entries(vars).forEach(([varName, value]) => {
            this._renderer2.setStyle(root, varName, value, RendererStyleFlags2.DashCase);
            this._appliedOrgThemeVars.push(varName);
        });
    }

    private _updateFontSize(): void {
        const sizePx = this._fontSizeMap[this.config.fontSize] ?? this._fontSizeMap['medium'];
        this._renderer2.setStyle(this._document.documentElement, 'font-size', sizePx);
    }
}
