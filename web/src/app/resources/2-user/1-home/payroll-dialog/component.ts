import { CommonModule } from '@angular/common';
import { Component, Inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SideDialogCloseButtonComponent } from 'app/shared/side-dialog-close-button/component';
import { UserHomeService } from '../home.service';

export * from './payroll-dialog.types';
import { PayrollDialogData } from './payroll-dialog.types';

@Component({
    selector: 'app-payroll-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        SideDialogCloseButtonComponent,
    ],
    templateUrl: './template.html',
    styleUrl: './style.scss',
})
export class PayrollDialogComponent {
    payroll = signal<any>(null);

    constructor(
        public dialogRef: MatDialogRef<PayrollDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: PayrollDialogData,
        private readonly _homeService: UserHomeService,
    ) {
        this._homeService.getPayroll().subscribe({
            next: (res) => {
                if (res?.data) {
                    this.payroll.set(res.data);
                }
            },
            error: (err) => console.error('Failed to load payroll', err),
        });
    }

    close(): void {
        this.dialogRef.close();
    }
}
