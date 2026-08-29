import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, ViewEncapsulation, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HelperConfigService, Scheme } from 'helper/services/config';
import { HelperMediaWatcherService } from 'helper/services/media-watcher';
import { Subject, combineLatest, takeUntil } from 'rxjs';

@Component({
    selector: 'scheme',
    templateUrl: './scheme.component.html',
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule],
})
export class SchemeComponent implements OnInit, OnDestroy {

    /**
     * Rendering variant:
     *  - 'icon'      : single icon button that toggles light/dark (default)
     *  - 'segmented' : Light / System / Dark segmented switch
     */
    @Input() variant: 'icon' | 'segmented' = 'icon';

    isDark: boolean = localStorage.getItem('scheme') === 'dark';
    scheme: Scheme = 'light';

    readonly options: { value: Scheme; icon: string; label_en: string; label_km: string }[] = [
        { value: 'light', icon: 'heroicons_solid:sun',              label_en: 'Light',  label_km: 'ភ្លឺ' },
        { value: 'auto',  icon: 'heroicons_solid:computer-desktop', label_en: 'System', label_km: 'ប្រព័ន្ធ' },
        { value: 'dark',  icon: 'heroicons_solid:moon',             label_en: 'Dark',   label_km: 'ងងឹត' },
    ];

    private readonly _helperConfigService = inject(HelperConfigService);
    private readonly _helperMediaWatcherService = inject(HelperMediaWatcherService);
    private readonly _unsubscribeAll = new Subject<void>();

    ngOnInit(): void {
        // Keep the controls in sync with the resolved scheme. In `auto`, the
        // applied body class follows the OS and can change without a config event.
        combineLatest([
            this._helperConfigService.config$,
            this._helperMediaWatcherService.onMediaQueryChange$([
                '(prefers-color-scheme: dark)',
                '(prefers-color-scheme: light)',
            ]),
        ])
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(([config, media]) => {
                this.scheme = config.scheme;
                this.isDark = config.scheme === 'dark'
                    || (
                        config.scheme === 'auto'
                        && media.breakpoints['(prefers-color-scheme: dark)']
                    );
            });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    setScheme(scheme: Scheme): void {
        localStorage.setItem('scheme', scheme);
        this._helperConfigService.config = { scheme };
    }
}
