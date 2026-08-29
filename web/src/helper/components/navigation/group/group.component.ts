import { BooleanInput } from '@angular/cdk/coercion';
import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit, forwardRef, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { HelperNavigationService } from 'helper/components/navigation/navigation.service';
import { HelperNavigationItem } from 'helper/components/navigation/navigation.types';
import { HelperNavigationBasicItemComponent } from 'helper/components/navigation/basic/basic.component';
import { HelperNavigationCollapsableItemComponent } from 'helper/components/navigation/collapsable/collapsable.component';
import { HelperNavigationDividerItemComponent } from 'helper/components/navigation/divider/divider.component';
import { HelperNavigationComponent } from 'helper/components/navigation/navigation.component';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'helper-navigation-group-item',
    templateUrl: './group.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        NgClass,
        MatIconModule,
        HelperNavigationBasicItemComponent,
        HelperNavigationCollapsableItemComponent,
        HelperNavigationDividerItemComponent,
        forwardRef(() => HelperNavigationGroupItemComponent)
    ],
})
export class HelperNavigationGroupItemComponent
    implements OnInit, OnDestroy {
    /* eslint-disable @typescript-eslint/naming-convention */
    static ngAcceptInputType_autoCollapse: BooleanInput;
    /* eslint-enable @typescript-eslint/naming-convention */

    private _changeDetectorRef = inject(ChangeDetectorRef);
    private _helperNavigationService = inject(HelperNavigationService);

    @Input() autoCollapse: boolean;
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

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any {
        return item.id || index;
    }
}
