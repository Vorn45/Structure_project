import { CommonModule, DOCUMENT }                    from '@angular/common';
import {
    Component,
    Inject,
    Input,
    OnDestroy,
    OnInit,
    Renderer2,
    RendererStyleFlags2,
    ViewEncapsulation,
}                                                     from '@angular/core';
import { MatBottomSheet, MatBottomSheetModule }      from '@angular/material/bottom-sheet';
import { MatRippleModule }                           from '@angular/material/core';
import { MatIconModule }                             from '@angular/material/icon';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoModule }                           from '@ngneat/transloco';
import {
    HelperNavigationComponent,
    HelperNavigationItem,
    HelperNavigationService,
}                                                     from 'helper/components/navigation';
import { HelperConfig, HelperConfigService }         from 'helper/services/config';
import { Subject, filter, takeUntil }                from 'rxjs';
import { MobileBottomNavSheetComponent }             from 'app/layout/common/mobile-bottom-nav/sheet.component';

const MOBILE_TAB_LIMIT = 5;
/** Matches the 48px (3rem) / 60px (3.75rem) heights used for no-label / label states. */
const BAR_HEIGHT_COLLAPSED = '48px';
const BAR_HEIGHT_EXPANDED = '3.75rem';

/** Fixed bottom tab bar shown on small screens, shared by layouts that would
 *  otherwise each duplicate this mobile-nav treatment. */
@Component({
    selector        : 'mobile-bottom-nav',
    templateUrl     : './template.html',
    encapsulation   : ViewEncapsulation.None,
    standalone      : true,
    imports         : [
        CommonModule,
        MatIconModule,
        MatRippleModule,
        MatBottomSheetModule,
        RouterLink,
        RouterLinkActive,
        TranslocoModule,
    ],
})
export class MobileBottomNavComponent implements OnInit, OnDestroy {
    @Input() navigations    : HelperNavigationItem[];
    @Input() navigationName = 'mainNavigation';
    /** Whether a "More" tab that opens the drawer is offered at all. Set to
     *  false when the layout already has its own header hamburger button for
     *  the same drawer — the tab would just be a redundant control. */
    @Input() showMore       = true;
    /** Force the "More" tab even with room to spare — set this when the
     *  drawer is the only way to reach content (e.g. chat/notifications/user
     *  in the `thin` layout live only in the drawer footer, not a header). */
    @Input() forceMore      = false;
    /** Slides the bar out of view while the user scrolls down (see LayoutChromeService). */
    @Input() hidden         = false;

    /** Off by default — user-configurable via the Settings dialog. */
    showLabels = false;

    /** Kept in sync with the router so aside items (no direct link of their
     *  own) can still show an active state based on their children's links. */
    currentUrl = '';

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _helperNavigationService: HelperNavigationService,
        private _helperConfigService    : HelperConfigService,
        private _router                 : Router,
        private _bottomSheet            : MatBottomSheet,
        private _renderer2              : Renderer2,
        @Inject(DOCUMENT) private _document: Document,
    ) {}

    ngOnInit(): void {
        this.currentUrl = this._router.url;

        this._helperConfigService.config$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((config: HelperConfig) => {
                this.showLabels = config.bottomNavLabels;
                // Content panels reserve bottom padding via this var (see
                // compact/thin-header/thin templates) so it stays in sync
                // with the bar's own height without each layout knowing why.
                this._renderer2.setStyle(
                    this._document.body,
                    '--mobile-bottom-nav-height',
                    this.showLabels ? BAR_HEIGHT_EXPANDED : BAR_HEIGHT_COLLAPSED,
                    RendererStyleFlags2.DashCase,
                );
            });

        this._router.events
            .pipe(
                filter((event) => event instanceof NavigationEnd),
                takeUntil(this._unsubscribeAll),
            )
            .subscribe(() => {
                this.currentUrl = this._router.url;
            });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
        this._renderer2.removeStyle(this._document.body, '--mobile-bottom-nav-height', RendererStyleFlags2.DashCase);
    }

    private get tabItems(): HelperNavigationItem[] {
        return (this.navigations ?? []).filter((item) => {
            if (item.hidden?.(item)) return false;
            if (item.type === 'basic') return !!item.link;
            if (item.type === 'aside') return !!item.children?.length;
            return false;
        });
    }

    /** Top-level items shown as mobile tabs — either a direct link or, for
     *  items like "Report" that only have sub-links, a tap target that opens
     *  those in a bottom sheet. Up to 5 by default. */
    get bottomNavItems(): HelperNavigationItem[] {
        return this.tabItems.slice(0, MOBILE_TAB_LIMIT);
    }

    /** Whether the side drawer holds content beyond the mobile tab bar. */
    get hasMoreNavItems(): boolean {
        if (!this.showMore) return false;

        return this.forceMore
            || this.tabItems.length > MOBILE_TAB_LIMIT
            || (this.navigations ?? []).some((item) => item.type !== 'basic' && item.type !== 'aside');
    }

    /** Active state for a tab whose item has no link of its own — true when
     *  the current route matches one of its children. */
    isChildActive(item: HelperNavigationItem): boolean {
        return !!item.children?.some((child) => child.link && this.currentUrl.startsWith(child.link));
    }

    openChildren(item: HelperNavigationItem): void {
        this._bottomSheet.open(MobileBottomNavSheetComponent, {
            data: { children: item.children ?? [] },
            panelClass: 'mobile-bottom-nav-sheet-panel',
        });
    }

    toggleNavigation(): void {
        const navigation =
            this._helperNavigationService.getComponent<HelperNavigationComponent>(
                this.navigationName,
            );

        if (navigation) {
            navigation.toggle();
        }
    }
}
