// ================================================================================>> Core Library
import { CommonModule, DatePipe, HashLocationStrategy, LocationStrategy, NgIf } from '@angular/common';
import { NgModule } from '@angular/core';

// ================================================================================>> Third Party Library
// ===>> Material
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogConfig, MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import { NgxFileDropModule } from 'ngx-file-drop';

// ================================================================================>> Custom Library
// ===>> Helper Library
import { HelperAlertComponent } from 'helper/components/alert';

// ===>> Helper
import { CustomDatePipe } from 'helper/pipes/custom-date.pipe';
import { AutoDateDifferenceFromNowPipe } from 'helper/pipes/date-difference.pipe';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterLink, RouterModule } from '@angular/router';
import { KhmerDatePipe } from 'helper/pipes/khmer-date.pipe';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatBadgeModule } from '@angular/material/badge';
import { MatInputModule } from '@angular/material/input';
import { NoDataComponent } from 'app/shared/no-data/no_data.compoent';
import { ClipboardModule } from '@angular/cdk/clipboard';

import { trigger, transition, style, animate, animateChild, query, stagger } from '@angular/animations';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatRadioModule } from '@angular/material/radio';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslocoModule } from '@ngneat/transloco';
import { HelperCardComponent } from 'helper/components/card';
import { MatPaginatorModule } from '@angular/material/paginator';
import { CapitalizePipe } from 'helper/pipes/capitalize.pipe';
import { UiSwitchModule } from 'ngx-ui-switch';
import { TimeAgoPipe } from 'app/shared/time-ago.pipe';

@NgModule({
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatTableModule,
        MatCheckboxModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        MatFormFieldModule,
        MatDialogModule,
        MatTooltipModule,
        NgxFileDropModule,
        HelperAlertComponent,
        CustomDatePipe,
        AutoDateDifferenceFromNowPipe,
        RouterModule,
        ReactiveFormsModule,
        KhmerDatePipe,
        MatTooltip,
        FormsModule,
        MatBadgeModule,
        MatInputModule,
        ScrollingModule,
        NoDataComponent,
        ClipboardModule,
        MatOptionModule,
        MatAutocompleteModule,
        MatDatepickerModule,
        MatDividerModule,
        MatExpansionModule,
        MatRadioModule,
        MatTabsModule,
        DragDropModule,
        TranslocoModule,
        NgIf,
        RouterLink,
        HelperCardComponent,
        MatPaginatorModule,
        CapitalizePipe,
        UiSwitchModule,
        MatNativeDateModule,
        TimeAgoPipe,
    ],
    providers: [
        { provide: LocationStrategy, useClass: HashLocationStrategy },
        { provide: DatePipe, useClass: KhmerDatePipe },
        { provide: MAT_DIALOG_DATA, useValue: {} }
    ],
    exports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatTableModule,
        MatCheckboxModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        MatFormFieldModule,
        MatDialogModule,
        MatTooltipModule,
        NgxFileDropModule,
        HelperAlertComponent,
        CustomDatePipe,
        AutoDateDifferenceFromNowPipe,
        RouterModule,
        ReactiveFormsModule,
        KhmerDatePipe,
        MatTooltip,
        FormsModule,
        MatBadgeModule,
        MatInputModule,
        ScrollingModule,
        NoDataComponent,
        ClipboardModule,
        MatOptionModule,
        MatAutocompleteModule,
        MatDatepickerModule,
        MatDividerModule,
        MatExpansionModule,
        MatRadioModule,
        MatTabsModule,
        DragDropModule,
        TranslocoModule,
        NgIf,
        RouterLink,
        HelperCardComponent,
        MatPaginatorModule,
        CapitalizePipe,
        UiSwitchModule,
        MatNativeDateModule,
        TimeAgoPipe,
    ]
})
export class ShareModule {
    getDialogConfig(data: any = null): MatDialogConfig {
        const dialogConfig = new MatDialogConfig();
        dialogConfig.autoFocus = false;
        dialogConfig.position = { right: '0px' };
        dialogConfig.height = '200dvh';
        dialogConfig.width = '200dvw';
        dialogConfig.maxWidth = '650px';
        dialogConfig.panelClass = 'side-dialog-v2';
        dialogConfig.disableClose = false;
        dialogConfig.enterAnimationDuration = '0ms';
        dialogConfig.exitAnimationDuration = '0ms';

        if (data) {
            dialogConfig.data = data;
        }

        return dialogConfig;
    }
}

export const slideInOut = trigger('slideInOut', [
    transition(':enter', [
        style({ height: 0, opacity: 0 }),
        animate('200ms ease-out', style({ height: '*', opacity: 1 }))
    ]),
    transition(':leave', [
        animate('200ms ease-in', style({ height: 0, opacity: 0 }))
    ])
]);

export const fadeInWidth = trigger('fadeInWidth', [
    transition(':enter', [
        style({ opacity: 0, width: '0px' }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, width: '*' }))
    ]),
    transition(':leave', [
        animate('200ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 0, width: '0px' }))
    ])
]);

export const itemsAnimation = trigger('itemsAnimation', [
    transition('* => *', [
        query('@itemAnimation', stagger(50, animateChild()), { optional: true })
    ])
]);

export const itemAnimation = trigger('itemAnimation', [
    transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate(
            '250ms 100ms cubic-bezier(0.4, 0, 0.2, 1)',
            style({ opacity: 1, transform: 'translateY(0)' })
        )
    ]),
    transition(':leave', [
        animate(
            '200ms cubic-bezier(0.4, 0, 0.2, 1)',
            style({ opacity: 0, transform: 'translateY(-5px)' })
        )
    ])
]);
