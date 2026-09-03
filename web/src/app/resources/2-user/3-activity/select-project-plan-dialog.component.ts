import { CommonModule } from '@angular/common';
import { Component, Inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SideDialogCloseButtonComponent } from 'app/shared/side-dialog-close-button/component';

export interface ProjectPlanOption {
    id: string;
    code: string;
    name: string;
    description?: string;
    tasksCount?: number;
    progress?: number;
}

export interface SelectProjectPlanDialogData {
    projects: ProjectPlanOption[];
    selectedProjectId?: string;
    activeTab?: 'existing' | 'create';
}

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
    template: `
        <div class="w-full h-full flex flex-col bg-white dark:bg-slate-900 font-kantumruy text-[16px] font-normal relative overflow-hidden"
            style="font-family: 'Kantumruy Pro', sans-serif;">
            
            <!-- Standard Header -->
            <div mat-dialog-title
                class="w-full flex justify-center items-center min-h-14 max-h-14 h-14 border-b border-slate-200 dark:border-slate-800 m-0 !py-0 font-kantumruy bg-white dark:bg-slate-900 relative px-4 shrink-0">
                <span class="w-full text-center text-[19px] font-medium font-kantumruy text-slate-800 dark:text-slate-200">
                    ផែនការគម្រោង
                </span>
            </div>

            <!-- Standard Side Drawer Close Button -->
            <shared-side-dialog-close-button [isReturn]="false"></shared-side-dialog-close-button>

            <!-- Scrollable Content -->
            <mat-dialog-content class="w-full !m-0 !p-0 overflow-y-auto flex-1 bg-white dark:bg-slate-900 font-kantumruy text-[16px]">
                <div class="p-5 space-y-5 font-kantumruy">

                    <!-- Cover Banner -->
                    <div class="rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-[#0f284e] text-white p-5 shadow-sm relative overflow-hidden font-kantumruy">
                        <div class="absolute right-0 top-0 text-white/5 pointer-events-none -mr-6 -mt-6">
                            <mat-icon svgIcon="mdi:calendar-multiselect" class="icon-size-40"></mat-icon>
                        </div>
                        <div class="relative z-10">
                            <span class="text-[12.5px] font-medium tracking-wider uppercase bg-white/20 px-3 py-0.5 rounded-full text-blue-100">
                                ផែនការគម្រោង (PROJECT ROADMAP)
                            </span>
                            <h3 class="text-[19px] font-medium text-white mt-2 leading-tight">
                                {{ activeTab() === 'existing' ? 'ជ្រើសរើសគម្រោងដើម្បីមើលផែនការ' : 'បង្កើតគម្រោង និងកាលវិភាគថ្មី' }}
                            </h3>
                            <p class="text-[13.5px] text-blue-200/90 mt-1 leading-normal">
                                គ្រប់គ្រងកាលវិភាគការងារ (Agile Gantt Timeline) នៃគម្រោងនីមួយៗ
                            </p>
                        </div>
                    </div>

                    <!-- Two Tabs: គម្រោងមានស្រាប់ & បង្កើតថ្មី -->
                    <div class="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 gap-1">
                        <button type="button" (click)="activeTab.set('existing')"
                            class="py-2.5 px-3 rounded-lg font-medium text-[14.5px] flex items-center justify-center gap-2 transition-all cursor-pointer"
                            [ngClass]="activeTab() === 'existing'
                                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs font-semibold'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'">
                            <mat-icon svgIcon="mdi:folder-multiple-outline" class="icon-size-4.5"></mat-icon>
                            <span>គម្រោងមានស្រាប់</span>
                        </button>

                        <button type="button" (click)="activeTab.set('create')"
                            class="py-2.5 px-3 rounded-lg font-medium text-[14.5px] flex items-center justify-center gap-2 transition-all cursor-pointer"
                            [ngClass]="activeTab() === 'create'
                                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs font-semibold'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'">
                            <mat-icon svgIcon="mdi:plus-circle-outline" class="icon-size-4.5"></mat-icon>
                            <span>បង្កើតថ្មី</span>
                        </button>
                    </div>

                    <!-- ========================================== -->
                    <!-- TAB 1: EXISTING PROJECTS (គម្រោងមានស្រាប់)    -->
                    <!-- ========================================== -->
                    <div *ngIf="activeTab() === 'existing'" class="space-y-4">
                        <!-- Search existing -->
                        <div class="relative flex items-center">
                            <mat-icon svgIcon="mdi:magnify" class="icon-size-4.5 absolute left-3 text-slate-400 pointer-events-none"></mat-icon>
                            <input type="text" placeholder="ស្វែងរកគម្រោង..." [(ngModel)]="searchQuery"
                                class="w-full pl-9 pr-3 py-2 text-[14px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-800 dark:text-white placeholder-slate-400 font-kantumruy" />
                        </div>

                        <!-- Projects List -->
                        <div class="space-y-2.5">
                            <div *ngFor="let p of filteredProjects"
                                (click)="selectedProject = p; selectedId = p.id"
                                class="p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 group"
                                [ngClass]="selectedId === p.id
                                    ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800'">
                                
                                <div class="flex items-center gap-3 min-w-0">
                                    <mat-icon svgIcon="mdi:calendar-text-outline" class="icon-size-6 shrink-0"
                                        [ngClass]="selectedId === p.id ? 'text-indigo-600' : 'text-slate-400 dark:text-slate-500 group-hover:text-indigo-500'"></mat-icon>
                                    <div class="min-w-0">
                                        <div class="flex items-center gap-2">
                                            <span class="text-xs font-semibold px-2 py-0.2 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">{{ p.code }}</span>
                                            <span class="font-medium text-[15px] text-slate-900 dark:text-white truncate">{{ p.name }}</span>
                                        </div>
                                        <p class="text-xs text-slate-400 mt-0.5 truncate">{{ p.description || 'ផែនការអនុវត្តគម្រោង និងកាលវិភាគ Agile' }}</p>
                                    </div>
                                </div>

                                <div class="shrink-0 flex items-center gap-2">
                                    <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                        {{ p.tasksCount || 19 }} ផែនការ
                                    </span>
                                    <mat-icon *ngIf="selectedId === p.id" svgIcon="mdi:check-circle" class="icon-size-5 text-indigo-600"></mat-icon>
                                </div>
                            </div>

                            <div *ngIf="filteredProjects.length === 0" class="p-6 text-center text-slate-400 text-sm">
                                មិនមានគម្រោងត្រូវគ្នានឹងការស្វែងរកទេ
                            </div>
                        </div>
                    </div>

                    <!-- ========================================== -->
                    <!-- TAB 2: CREATE NEW (បង្កើតថ្មី)                 -->
                    <!-- ========================================== -->
                    <div *ngIf="activeTab() === 'create'" class="space-y-4">
                        <div>
                            <label class="block font-normal text-slate-800 dark:text-slate-200 mb-2 text-[15px]">
                                កូដគម្រោង (Project Code) <span class="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                [(ngModel)]="newProjectCode"
                                placeholder="ឧ. PMS-V3, APP-2026..."
                                class="w-full px-4 py-3 text-[15px] font-normal font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>

                        <div>
                            <label class="block font-normal text-slate-800 dark:text-slate-200 mb-2 text-[15px]">
                                ឈ្មោះគម្រោង (Project Name) <span class="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                [(ngModel)]="newProjectName"
                                placeholder="ឧ. ប្រព័ន្ធគ្រប់គ្រងការងារថ្មី (New Project Workflow)..."
                                class="w-full px-4 py-3 text-[15px] font-normal font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>

                        <div>
                            <label class="block font-normal text-slate-800 dark:text-slate-200 mb-2 text-[15px]">
                                ការពិពណ៌នា (Description)
                            </label>
                            <textarea
                                rows="3"
                                [(ngModel)]="newDescription"
                                placeholder="ពិពណ៌នាខ្លីៗអំពីគោលដៅគម្រោង..."
                                class="w-full px-4 py-3 text-[15px] font-normal font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                            ></textarea>
                        </div>
                    </div>

                </div>
            </mat-dialog-content>

            <!-- Bottom Action -->
            <div class="w-full flex items-center p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 font-kantumruy">
                <button
                    *ngIf="activeTab() === 'existing'"
                    type="button"
                    (click)="confirmSelection()"
                    class="w-full h-11 px-4 rounded-xl font-medium font-kantumruy text-[15.5px] flex items-center justify-center gap-2 text-white bg-[#1c2b6b] hover:bg-[#152254] transition-all duration-200 active:scale-[0.98] cursor-pointer"
                >
                    <mat-icon svgIcon="mdi:calendar-check" class="!w-5 !h-5 !text-white shrink-0"></mat-icon>
                    <span>បើកផែនការគម្រោងនេះ</span>
                </button>

                <button
                    *ngIf="activeTab() === 'create'"
                    type="button"
                    (click)="submitNewProject()"
                    [disabled]="!newProjectName.trim() || !newProjectCode.trim()"
                    class="w-full h-11 px-4 rounded-xl font-medium font-kantumruy text-[15.5px] flex items-center justify-center gap-2 text-white bg-[#1c2b6b] hover:bg-[#152254] disabled:opacity-50 transition-all duration-200 active:scale-[0.98] cursor-pointer"
                >
                    <mat-icon svgIcon="mdi:plus" class="!w-5 !h-5 !text-white shrink-0"></mat-icon>
                    <span>បង្កើត និងបើកផែនការគម្រោង</span>
                </button>
            </div>

        </div>
    `,
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
