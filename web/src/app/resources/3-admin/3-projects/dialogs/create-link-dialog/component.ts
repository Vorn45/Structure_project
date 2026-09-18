import { CommonModule } from '@angular/common';
import { Component, Inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SideDialogCloseButtonComponent } from 'app/shared/side-dialog-close-button/component';


export * from './create-link-dialog.types';
import { CreateLinkDialogData } from './create-link-dialog.types';

@Component({
    selector: 'app-create-link-dialog',
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
export class CreateLinkDialogComponent {
    linkTitle = signal<string>('');
    linkUrl = signal<string>('');
    linkType = signal<'figma' | 'github' | 'doc' | 'external'>('figma');
    linkTaskCode = signal<string>('#WMS-CORE');

    constructor(
        private readonly _dialogRef: MatDialogRef<CreateLinkDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: CreateLinkDialogData,
    ) {
        if (data?.taskCode) {
            this.linkTaskCode.set(data.taskCode);
        }
    }

    submit(): void {
        const title = this.linkTitle().trim();
        let url = this.linkUrl().trim();
        if (!title) return;

        if (!url) {
            const type = this.linkType();
            if (type === 'figma') url = 'https://figma.com';
            else if (type === 'github') url = 'https://github.com';
            else if (type === 'doc') url = 'https://notion.so';
            else url = 'https://google.com';
        } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        this._dialogRef.close({
            title,
            url,
            type: this.linkType(),
            taskCode: this.linkTaskCode().trim() || '#WMS-CORE',
        });
    }

    cancel(): void {
        this._dialogRef.close(null);
    }
}
