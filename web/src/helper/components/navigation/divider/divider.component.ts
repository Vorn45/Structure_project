import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { HelperNavigationService } from 'helper/components/navigation/navigation.service';
import { HelperNavigationItem } from 'helper/components/navigation/navigation.types';
import { HelperNavigationComponent } from 'helper/components/navigation/navigation.component';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'helper-navigation-divider-item',
    templateUrl: './divider.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [NgClass],
})
export class HelperNavigationDividerItemComponent
    implements OnInit, OnDestroy {
    private _changeDetectorRef = inject(ChangeDetectorRef);
    private _helperNavigationService = inject(HelperNavigationService);

    @Input() item: HelperNavigationItem;
    @Input() name: string;

    private __helperNavigationComponent: HelperNavigationComponent;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Get the parent navigation component
        this.__helperNavigationComponent =
            this._helperNavigationService.getComponent(this.name);

        // Subscribe to onRefreshed on the navigation component
        this.__helperNavigationComponent.onRefreshed
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(() => {
                // Mark for check
                this._changeDetectorRef.markForCheck();
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
