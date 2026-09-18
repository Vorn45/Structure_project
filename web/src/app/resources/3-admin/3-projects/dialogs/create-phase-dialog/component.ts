import { CommonModule } from '@angular/common';
import { Component, Inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SideDialogCloseButtonComponent } from 'app/shared/side-dialog-close-button/component';


export * from './create-phase-dialog.types';
import { CreatePhaseDialogData } from './create-phase-dialog.types';

@Component({
    selector: 'app-create-phase-dialog',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        SideDialogCloseButtonComponent,
    ],
    templateUrl: './template.html',
    styleUrl: './style.scss',
})
export class CreatePhaseDialogComponent {
    phaseTitle = signal<string>('');
    phaseQuarter = signal<string>('ត្រីមាសទី ៤ (Q4)');
    phaseStatus = signal<'planned' | 'in_progress' | 'completed'>('planned');
    phaseStartDate = signal<string>('01/10/2026');
    phaseEndDate = signal<string>('31/12/2026');

    constructor(
        private readonly _dialogRef: MatDialogRef<CreatePhaseDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: CreatePhaseDialogData,
    ) {
        const nextNum = (data?.currentPhasesCount || 3) + 1;
        this.phaseTitle.set(`ដំណាក់កាលទី ${nextNum}៖ `);
        this.phaseQuarter.set(`ត្រីមាសទី ${nextNum} (Q${nextNum})`);
    }

    submit(): void {
        const title = this.phaseTitle().trim();
        if (!title) return;
        this._dialogRef.close({
            title,
            quarter: this.phaseQuarter() || 'ត្រីមាស',
            status: this.phaseStatus(),
            startDate: this.phaseStartDate() || '01/10/2026',
            endDate: this.phaseEndDate() || '31/12/2026',
        });
    }

    cancel(): void {
        this._dialogRef.close(null);
    }
}
