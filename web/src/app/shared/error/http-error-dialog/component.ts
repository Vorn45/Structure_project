import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoModule } from '@ngneat/transloco';
import { NoDataComponent } from 'app/shared/no-data/component';


export * from './http-error-dialog.types';
import { HttpErrorDialogData } from './http-error-dialog.types';

@Component({
    selector: 'http-error-dialog',
    standalone: true,
    imports: [
        MatButtonModule,
        MatDialogModule,
        MatIconModule,
        MatTooltipModule,
        NoDataComponent,
        TranslocoModule,
    ],
    templateUrl: './template.html',
    styleUrl: './style.scss',
})
export class HttpErrorDialogComponent {
    readonly data = inject<HttpErrorDialogData | null>(MAT_DIALOG_DATA, { optional: true });
}
