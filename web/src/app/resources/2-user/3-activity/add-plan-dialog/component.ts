import { CommonModule } from '@angular/common';
import { Component, Inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SideDialogCloseButtonComponent } from 'app/shared/side-dialog-close-button/component';

export * from './add-plan-dialog.types';
import { AddPlanProjectOption, AddPlanDialogData, DEFAULT_PROJECT_OPTIONS, AgilePlanTask } from './add-plan-dialog.types';

@Component({
    selector: 'app-add-plan-dialog',
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
export class AddPlanDialogComponent {
    isEditing = false;
    existingTaskId: string | null = null;
    taskName = '';
    iteration: 1 | 2 | 3 = 1;
    startWeek = 14;
    durationWeeks = 3;
    currentWeekNum = 36;
    weeksList: number[] = Array.from({ length: 27 }, (_, i) => 14 + i);

    projectList: AddPlanProjectOption[] = DEFAULT_PROJECT_OPTIONS;
    selectedProjectId = '4';
    selectedProjectCode = 'BMS-DIGI';
    selectedProjectName = 'BMS Digitech';

    constructor(
        private readonly _dialogRef: MatDialogRef<AddPlanDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public readonly data: AddPlanDialogData,
    ) {
        if (data?.currentWeek) {
            this.currentWeekNum = data.currentWeek;
            this.startWeek = data.currentWeek;
        }
        if (data?.weeks && Array.isArray(data.weeks) && data.weeks.length > 0) {
            this.weeksList = data.weeks;
        }
        if (data?.projects && data.projects.length > 0) {
            this.projectList = data.projects;
        }
        if (data?.selectedProjectId) {
            this.selectedProjectId = String(data.selectedProjectId);
            const found = this.projectList.find((p) => String(p.id) === String(data.selectedProjectId));
            if (found) {
                this.selectedProjectCode = found.code;
                this.selectedProjectName = found.name;
            } else if (data?.selectedProjectName) {
                this.selectedProjectName = data.selectedProjectName;
            }
        }
        if (data?.isEditing && data?.task) {
            this.isEditing = true;
            this.existingTaskId = data.task.id;
            this.taskName = data.task.name;
            if (data.task.segments && data.task.segments.length > 0) {
                const seg = data.task.segments[0];
                this.iteration = seg.iteration;
                this.startWeek = seg.startWeek;
                this.durationWeeks = seg.durationWeeks;
            }
        }
    }

    onProjectChange(projectId: string): void {
        const found = this.projectList.find((p) => String(p.id) === String(projectId));
        if (found) {
            this.selectedProjectCode = found.code;
            this.selectedProjectName = found.name;
        }
    }

    getPreviewColor(): string {
        switch (Number(this.iteration)) {
            case 1:
                return 'bg-[#f59e0b]';
            case 2:
                return 'bg-[#f43f5e]';
            case 3:
                return 'bg-[#581c87]';
            default:
                return 'bg-[#f59e0b]';
        }
    }

    cancel(): void {
        this._dialogRef.close(null);
    }

    submit(): void {
        if (!this.taskName.trim()) return;

        const duration = Number(this.durationWeeks) || 1;
        const start = Number(this.startWeek) || 14;
        const iter = (Number(this.iteration) || 1) as 1 | 2 | 3;
        const newTask: AgilePlanTask = {
            id: this.existingTaskId || `task-${Date.now()}`,
            name: this.taskName.trim(),
            segments: [
                {
                    iteration: iter,
                    startWeek: start,
                    durationWeeks: duration,
                    label: duration > 1 ? `${duration}W` : undefined,
                },
            ],
        };

        this._dialogRef.close({
            task: newTask,
            projectId: this.selectedProjectId,
            isEditing: this.isEditing,
        });
    }
}
