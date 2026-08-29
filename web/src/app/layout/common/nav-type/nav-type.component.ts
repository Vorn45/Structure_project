import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HelperConfig, HelperConfigService } from 'helper/services/config';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'nav-type',
    templateUrl: './nav-type.component.html',
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule],
})
export class NavTypeComponent implements OnInit, OnDestroy {

    layout: string = 'compact';

    readonly options: { value: string; icon: string; label_en: string; label_km: string }[] = [
        { value: 'compact',     icon: 'mdi:view-compact',            label_en: 'Compact',      label_km: 'តូច' },
        // Classic ('classy') hidden for now.
        { value: 'thin',        icon: 'mdi:dock-left',                label_en: 'Thin',         label_km: 'ស្តើង' },
        { value: 'thin-header', icon: 'mdi:page-layout-header-footer', label_en: 'Thin (Header)', label_km: 'ស្តើង (ក្បាល)' },
    ];

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(private _helperConfigService: HelperConfigService) { }

    ngOnInit(): void {
        // Keep the switch in sync with the applied layout
        this._helperConfigService.config$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((config: HelperConfig) => {
                this.layout = config.layout;
            });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    setLayout(layout: string): void {
        localStorage.setItem('layout', layout);
        this._helperConfigService.config = { layout };
    }
}
