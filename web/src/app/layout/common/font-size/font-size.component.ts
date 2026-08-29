import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FontSize, HelperConfig, HelperConfigService } from 'helper/services/config';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'font-size',
    templateUrl: './font-size.component.html',
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [CommonModule, MatButtonModule, MatTooltipModule],
})
export class FontSizeComponent implements OnInit, OnDestroy {

    fontSize: FontSize = 'medium';

    readonly options: { value: FontSize; glyph: string; size: string; pixels: string; label_en: string; label_km: string }[] = [
        { value: 'small',  glyph: 'A', size: 'text-xs',   pixels: '13px', label_en: 'Small',  label_km: 'តូច' },
        { value: 'medium', glyph: 'A', size: 'text-base', pixels: '16px', label_en: 'Medium', label_km: 'មធ្យម' },
        { value: 'large',  glyph: 'A', size: 'text-xl',   pixels: '20px', label_en: 'Large',  label_km: 'ធំ' },
        { value: 'super-big', glyph: 'A', size: 'text-2xl', pixels: '24px', label_en: 'Super big', label_km: 'ធំខ្លាំង' },
    ];

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(private _helperConfigService: HelperConfigService) { }

    ngOnInit(): void {
        // Keep the switch in sync with the applied font size
        this._helperConfigService.config$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((config: HelperConfig) => {
                this.fontSize = config.fontSize;
            });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    setFontSize(fontSize: FontSize): void {
        localStorage.setItem('font-size', fontSize);
        this._helperConfigService.config = { fontSize };
    }
}
