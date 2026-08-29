import { CommonModule }                    from '@angular/common';
import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatCheckboxModule }               from '@angular/material/checkbox';
import { HelperConfig, HelperConfigService } from 'helper/services/config';
import { Subject, takeUntil }              from 'rxjs';

@Component({
    selector: 'bottom-nav-labels',
    templateUrl: './template.html',
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [CommonModule, MatCheckboxModule],
})
export class BottomNavLabelsComponent implements OnInit, OnDestroy {

    enabled: boolean = false;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(private _helperConfigService: HelperConfigService) { }

    ngOnInit(): void {
        // Keep the checkbox in sync with the applied config
        this._helperConfigService.config$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((config: HelperConfig) => {
                this.enabled = config.bottomNavLabels;
            });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    toggle(): void {
        const bottomNavLabels = !this.enabled;
        localStorage.setItem('bottom-nav-labels', String(bottomNavLabels));
        this._helperConfigService.config = { bottomNavLabels };
    }
}
