import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SideDialogCloseButtonComponent } from 'app/shared/side-dialog-close-button/component';


@Component({
    selector: 'app-help-support-dialog',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        MatDividerModule,
        SideDialogCloseButtonComponent,
    ],
    templateUrl: './template.html',
    styleUrl: './style.scss',
})
export class HelpSupportDialogComponent implements OnInit {
    issueTitle: string = '';
    category: string = 'attendance';
    message: string = '';
    submitted = signal<boolean>(false);

    constructor(
        public dialogRef: MatDialogRef<HelpSupportDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
    ) {}

    ngOnInit(): void {}

    submitHelp(): void {
        if (!this.issueTitle.trim()) return;
        this.submitted.set(true);
        setTimeout(() => {
            this.dialogRef.close();
        }, 2000);
    }
}
