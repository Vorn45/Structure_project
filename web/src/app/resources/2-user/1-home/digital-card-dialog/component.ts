import { CommonModule } from '@angular/common';
import { Component, Inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

export * from './digital-card-dialog.types';
import { DigitalCardDialogData } from './digital-card-dialog.types';

@Component({
    selector: 'app-digital-card-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
    ],
    templateUrl: './template.html',
    styleUrl: './style.scss',
})
export class DigitalCardDialogComponent {
    activeTab = signal<'front' | 'back'>('front');

    constructor(
        public dialogRef: MatDialogRef<DigitalCardDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DigitalCardDialogData,
    ) {}

    close(): void {
        this.dialogRef.close();
    }
}
