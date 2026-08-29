import { NgTemplateOutlet } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewEncapsulation,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { AvailableLangs, TranslocoService } from '@ngneat/transloco';
import {
    HelperNavigationComponent,
    HelperNavigationService,
} from 'helper/components/navigation';
import { take } from 'rxjs';

@Component({
    selector: 'languages',
    templateUrl: './languages.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    exportAs: 'languages',
    standalone: true,
    imports: [MatButtonModule, MatMenuModule, NgTemplateOutlet],
})
export class LanguagesComponent implements OnInit, OnDestroy {
    availableLangs: AvailableLangs;
    activeLang: string;
    flagCodes: any;

    @ViewChild(MatMenuTrigger) private _menuTrigger: MatMenuTrigger;

    /** Open the language menu programmatically (used when embedded in a row) */
    openMenu(): void {
        this._menuTrigger?.openMenu();
    }

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _helperNavigationService: HelperNavigationService,
        private _translocoService: TranslocoService
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Get the available languages from transloco
        this.availableLangs = this._translocoService.getAvailableLangs();

        // Subscribe to language changes
        this._translocoService.langChanges$.subscribe((activeLang) => {
            // Get the active lang
            this.activeLang = activeLang;

            // Update the navigation
            this._updateNavigation(activeLang);
        });

        // Set the country iso codes for languages for flags
        this.flagCodes = {
            kh: 'kh',
            en: 'us',
        };
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {}

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Set the active lang
     *
     * @param lang
     */
    setActiveLang(lang: string): void {
        // Persist the choice so it survives a reload
        localStorage.setItem('lang', lang);

        // Set the active lang
        this._translocoService.setActiveLang(lang);
    }

    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any {
        return item.id || index;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Update the navigation
     *
     * @param lang
     * @private
     */
    private _updateNavigation(lang: string): void {
        // Get the navigation component
        const navComponent = this._helperNavigationService.getComponent<HelperNavigationComponent>('mainNavigation');

        // Return if the navigation component does not exist
        if (!navComponent) {
            return;
        }

        // Get the flat navigation data
        const navigations = navComponent.navigations;

        // List of navigation items and their corresponding translation keys
        const navigationItems = [
            { id: 'home',                                           translationKey: 'Navigation.Home' },
            { id: 'operation',                                      translationKey: 'Navigation.Operation' },
            { id: 'invoice',                                        translationKey: 'Navigation.Invoice' },
            { id: 'price',                                          translationKey: 'Navigation.Price' },
            { id: 'price.indicator',                                translationKey: 'Navigation.Price.Indicator' },
            { id: 'price.setting',                                  translationKey: 'Navigation.Price.Setting' },
            { id: 'price.english',                                  translationKey: 'Navigation.Price.English' },
            { id: 'user',                                           translationKey: 'Navigation.User' },
            { id: 'bank',                                           translationKey: 'Navigation.Bank' },
            { id: 'system',                                         translationKey: 'Navigation.System' },
            { id: 'setting',                                        translationKey: 'Navigation.Setting' },
            { id: 'customer',                                       translationKey: 'Navigation.Customer' },
            { id: 'organization',                                   translationKey: 'Navigation.Organization' },
        ];

        // Iterate over each item and update its title
        navigationItems.forEach(item => {
            const navItem = this._helperNavigationService.getItem(item.id, navigations);
            if (navItem) {
                this._translocoService
                    .selectTranslate(item.translationKey)
                    .pipe(take(1))
                    .subscribe((translation) => {
                        // Set the title
                        navItem.title = translation;

                        // Refresh the navigation component
                        navComponent.refresh();
                    });
            }
        });
    }
}
