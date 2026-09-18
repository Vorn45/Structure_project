import { CommonModule } from '@angular/common';
import { Component, Inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SideDialogCloseButtonComponent } from 'app/shared/side-dialog-close-button/component';


export * from './select-project-plan-dialog.types';
import { ProjectPlanOption, SelectProjectPlanDialogData } from './select-project-plan-dialog.types';

@Component({
    selector: 'app-select-project-plan-dialog',
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
export class SelectProjectPlanDialogComponent {
    projects: ProjectPlanOption[] = [];
    selectedId = '1';
    selectedProject: ProjectPlanOption | null = null;
    searchQuery = '';

    activeTab = signal<'existing' | 'create'>('existing');
    newProjectCode = '';
    newProjectName = '';
    newDescription = '';

    constructor(
        private readonly _dialogRef: MatDialogRef<SelectProjectPlanDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public readonly data: SelectProjectPlanDialogData,
    ) {
        this.projects = data?.projects || [];
        if (data?.activeTab) {
            this.activeTab.set(data.activeTab);
        }
        if (data?.selectedProjectId) {
            this.selectedId = data.selectedProjectId;
            this.selectedProject = this.projects.find((p) => p.id === data.selectedProjectId) || null;
        } else if (this.projects.length > 0) {
            this.selectedId = this.projects[0].id;
            this.selectedProject = this.projects[0];
        }
    }

    get filteredProjects(): ProjectPlanOption[] {
        const q = this.searchQuery.toLowerCase().trim();
        if (!q) return this.projects;
        return this.projects.filter(
            (p) => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q),
        );
    }

    confirmSelection(): void {
        if (this.selectedProject) {
            this._dialogRef.close(this.selectedProject);
        } else if (this.projects.length > 0) {
            this._dialogRef.close(this.projects[0]);
        }
    }

    submitNewProject(): void {
        if (!this.newProjectName.trim() || !this.newProjectCode.trim()) return;

        const newProject: ProjectPlanOption = {
            id: `proj-${Date.now()}`,
            code: this.newProjectCode.trim().toUpperCase(),
            name: this.newProjectName.trim(),
            description: this.newDescription.trim() || 'ផែនការអនុវត្តគម្រោង និងកាលវិភាគ Agile',
            tasksCount: 0,
        };

        this._dialogRef.close(newProject);
    }
}
