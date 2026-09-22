import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SideDialogCloseButtonComponent } from 'app/shared/side-dialog-close-button/component';
import {
    addDays,
    formatFullDate,
    isoWeekNumber,
    isoWeekStart,
    iterationColorClass,
    parseDateValue,
    startOfIsoWeek,
    toDateInputValue,
    toKhmerNumber,
} from 'app/shared/agile-timeline';

export * from './add-plan-dialog.types';
import { AddPlanProjectOption, AddPlanDialogData, AddPlanLinkOption, AgilePlanTask } from './add-plan-dialog.types';

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
    iteration = 1;
    /** YYYY-MM-DD */
    startDate = toDateInputValue(new Date());
    durationWeeks = 3;

    /** Visible window of the gantt, shown as a hint under the date field. */
    windowStart: string | null = null;
    windowEnd: string | null = null;

    readonly iterationOptions = [1, 2, 3, 4, 5, 6];

    /** Where this row's progress comes from. */
    linkMode: 'none' | 'phase' | 'tasks' = 'none';
    phaseOptions: AddPlanLinkOption[] = [];
    taskOptions: AddPlanLinkOption[] = [];
    selectedPhaseId = '';
    selectedTaskIds: string[] = [];

    projectList: AddPlanProjectOption[] = [];
    selectedProjectId = '';
    selectedProjectCode = '';
    selectedProjectName = '';

    constructor(
        private readonly _dialogRef: MatDialogRef<AddPlanDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public readonly data: AddPlanDialogData,
    ) {
        this.windowStart = data?.timelineStart ?? null;
        this.windowEnd = data?.timelineEnd ?? null;
        this.phaseOptions = data?.phaseOptions ?? [];
        this.taskOptions = data?.taskOptions ?? [];

        // Seed a sensible start: today, snapped to the start of its week.
        this.startDate = toDateInputValue(startOfIsoWeek(new Date()));

        if (data?.projects && data.projects.length > 0) {
            this.projectList = data.projects;
            const first = data.projects[0];
            this.selectedProjectId = String(first.id);
            this.selectedProjectCode = first.code;
            this.selectedProjectName = first.name;
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
            if (data.task.phase_id) {
                this.linkMode = 'phase';
                this.selectedPhaseId = String(data.task.phase_id);
            } else if (data.task.task_ids?.length) {
                this.linkMode = 'tasks';
                this.selectedTaskIds = data.task.task_ids.map(String);
            }
            const seg = data.task.segments?.[0];
            if (seg) {
                this.iteration = Number(seg.iteration) || 1;
                this.durationWeeks = Math.max(1, Number(seg.durationWeeks) || 1);
                // Prefer stored dates; fall back to the legacy week number so
                // plans created before the date migration stay editable.
                const stored = parseDateValue(seg.start_date);
                if (stored) {
                    this.startDate = toDateInputValue(stored);
                } else if (Number(seg.startWeek)) {
                    const year = (parseDateValue(data.timelineStart) ?? new Date()).getFullYear();
                    this.startDate = toDateInputValue(isoWeekStart(year, Number(seg.startWeek)));
                }
                const storedEnd = parseDateValue(seg.end_date);
                const storedStart = parseDateValue(this.startDate);
                if (storedEnd && storedStart && storedEnd >= storedStart) {
                    const days = Math.round((storedEnd.getTime() - storedStart.getTime()) / 86400000) + 1;
                    this.durationWeeks = Math.max(1, Math.ceil(days / 7));
                }
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

    get resolvedStart(): Date {
        return parseDateValue(this.startDate) ?? startOfIsoWeek(new Date());
    }

    get resolvedEnd(): Date {
        const weeks = Math.max(1, Number(this.durationWeeks) || 1);
        return addDays(this.resolvedStart, weeks * 7 - 1);
    }

    get startWeekNumber(): number {
        return isoWeekNumber(this.resolvedStart);
    }

    get endWeekNumber(): number {
        return isoWeekNumber(this.resolvedEnd);
    }

    get rangeLabel(): string {
        return `${formatFullDate(this.resolvedStart)} \u2192 ${formatFullDate(this.resolvedEnd)}`;
    }

    /** Warns when the plan would land outside the currently visible window. */
    get isOutsideWindow(): boolean {
        const winStart = parseDateValue(this.windowStart);
        const winEnd = parseDateValue(this.windowEnd);
        if (!winStart || !winEnd) return false;
        return this.resolvedEnd < winStart || this.resolvedStart > winEnd;
    }

    getPreviewColor(): string {
        return iterationColorClass(this.iteration);
    }

    getIterationColorFor(iteration: number): string {
        return iterationColorClass(iteration);
    }

    setLinkMode(mode: 'none' | 'phase' | 'tasks'): void {
        this.linkMode = mode;
        if (mode !== 'phase') this.selectedPhaseId = '';
        if (mode !== 'tasks') this.selectedTaskIds = [];
    }

    toggleTaskLink(id: string): void {
        const key = String(id);
        this.selectedTaskIds = this.selectedTaskIds.includes(key)
            ? this.selectedTaskIds.filter((t) => t !== key)
            : [...this.selectedTaskIds, key];
    }

    isTaskLinked(id: string): boolean {
        return this.selectedTaskIds.includes(String(id));
    }

    iterationLabel(iteration: number): string {
        return `\u179c\u178a\u17d2\u178f\u1791\u17b8 ${toKhmerNumber(iteration)}`;
    }

    cancel(): void {
        this._dialogRef.close(null);
    }

    submit(): void {
        if (!this.taskName.trim()) return;

        const duration = Math.max(1, Number(this.durationWeeks) || 1);
        const start = this.resolvedStart;
        const end = this.resolvedEnd;
        const iter = Math.max(1, Number(this.iteration) || 1);

        const newTask: AgilePlanTask = {
            id: this.existingTaskId || `task-${Date.now()}`,
            name: this.taskName.trim(),
            phase_id: this.linkMode === 'phase' && this.selectedPhaseId ? this.selectedPhaseId : null,
            task_ids: this.linkMode === 'tasks' && this.selectedTaskIds.length ? [...this.selectedTaskIds] : null,
            segments: [
                {
                    iteration: iter,
                    start_date: toDateInputValue(start),
                    end_date: toDateInputValue(end),
                    // Kept for older readers of this data.
                    startWeek: isoWeekNumber(start),
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
