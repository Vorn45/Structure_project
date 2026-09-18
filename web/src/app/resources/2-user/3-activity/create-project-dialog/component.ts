import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SideDialogCloseButtonComponent } from 'app/shared/side-dialog-close-button/component';
import { ProjectPlanOption } from '../select-project-plan-dialog/component';


@Component({
    selector: 'app-create-project-dialog',
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
export class CreateProjectDialogComponent {
    projectCode = '';
    projectName = '';
    description = '';

    constructor(
        private readonly _dialogRef: MatDialogRef<CreateProjectDialogComponent>,
    ) {}

    cancel(): void {
        this._dialogRef.close(null);
    }

    submit(): void {
        if (!this.projectName.trim() || !this.projectCode.trim()) return;

        const newProject: ProjectPlanOption = {
            id: `proj-${Date.now()}`,
            code: this.projectCode.trim().toUpperCase(),
            name: this.projectName.trim(),
            description: this.description.trim() || 'ផែនការអនុវត្តគម្រោង និងកាលវិភាគ Agile',
            tasksCount: 0,
        };

        this._dialogRef.close(newProject);
    }
}
