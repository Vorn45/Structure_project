import { CommonModule }                              from '@angular/common';
import { Component, inject }                         from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef }  from '@angular/material/bottom-sheet';
import { MatIconModule }                             from '@angular/material/icon';
import { Router }                                    from '@angular/router';
import { TranslocoModule }                           from '@ngneat/transloco';
import { HelperNavigationItem }                      from 'helper/components/navigation';

/** Lists a nav item's children in a sheet that slides up from the bottom —
 *  used by the mobile bottom nav for items like "Report" that have sub-links
 *  instead of a direct one. */
@Component({
    selector    : 'mobile-bottom-nav-sheet',
    standalone  : true,
    imports     : [CommonModule, MatIconModule, TranslocoModule],
    template: `
        <div class="py-1">
            <div *ngFor="let child of children" (click)="go(child)"
                class="flex items-center gap-3 px-5 py-3.5 cursor-pointer active:bg-slate-100 dark:active:bg-white/5">
                <mat-icon *ngIf="child.icon" [svgIcon]="child.icon" class="icon-size-6 text-slate-500"></mat-icon>
                <span class="text-base text-slate-900 dark:text-slate-100">{{ child.title | transloco }}</span>
            </div>
        </div>
    `,
})
export class MobileBottomNavSheetComponent {
    private _sheetRef = inject(MatBottomSheetRef<MobileBottomNavSheetComponent>);
    private _router = inject(Router);

    readonly children: HelperNavigationItem[] =
        inject<{ children: HelperNavigationItem[] }>(MAT_BOTTOM_SHEET_DATA).children;

    go(child: HelperNavigationItem): void {
        this._sheetRef.dismiss();

        if (child.link) {
            this._router.navigate([child.link], {
                queryParams: child.queryParams ?? undefined,
            });
        }
    }
}
