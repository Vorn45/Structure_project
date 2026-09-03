import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SideDialogCloseButtonComponent } from 'app/shared/side-dialog-close-button/component';
import { ProjectPlanOption } from './select-project-plan-dialog.component';

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
    template: `
        <div class="w-full h-full flex flex-col bg-white dark:bg-slate-900 font-kantumruy text-[16px] font-normal relative overflow-hidden"
            style="font-family: 'Kantumruy Pro', sans-serif;">
            
            <!-- Standard Header -->
            <div mat-dialog-title
                class="w-full flex justify-center items-center min-h-14 max-h-14 h-14 border-b border-slate-200 dark:border-slate-800 m-0 !py-0 font-kantumruy bg-white dark:bg-slate-900 relative px-4 shrink-0">
                <span class="w-full text-center text-[19px] font-medium font-kantumruy text-slate-800 dark:text-slate-200">
                    បង្កើតគម្រោងថ្មី
                </span>
            </div>

            <!-- Standard Side Drawer Close Button -->
            <shared-side-dialog-close-button [isReturn]="false"></shared-side-dialog-close-button>

            <!-- Scrollable Content -->
            <mat-dialog-content class="w-full !m-0 !p-0 overflow-y-auto flex-1 bg-white dark:bg-slate-900 font-kantumruy text-[16px]">
                <div class="p-5 space-y-6 font-kantumruy">

                    <!-- Cover Banner -->
                    <div class="rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-[#0f284e] text-white p-5 shadow-sm relative overflow-hidden font-kantumruy">
                        <div class="absolute right-0 top-0 text-white/5 pointer-events-none -mr-6 -mt-6">
                            <mat-icon svgIcon="mdi:folder-plus-outline" class="icon-size-40"></mat-icon>
                        </div>
                        <div class="relative z-10">
                            <span class="text-[12.5px] font-medium tracking-wider uppercase bg-white/20 px-3 py-0.5 rounded-full text-blue-100">
                                គម្រោងថ្មី (NEW PROJECT ROADMAP)
                            </span>
                            <h3 class="text-[19px] font-medium text-white mt-2 leading-tight">
                                បង្កើតកាលវិភាគគម្រោងថ្មី
                            </h3>
                            <p class="text-[13.5px] text-blue-200/90 mt-1 leading-normal">
                                បញ្ចូលឈ្មោះគម្រោង ដើម្បីចាប់ផ្តើមរៀបចំផែនការអនុវត្ត និងកាលវិភាគ Agile Gantt
                            </p>
                        </div>
                    </div>

                    <!-- Form Inputs -->
                    <div class="space-y-4 text-[16px] font-kantumruy">
                        <div>
                            <label class="block font-normal text-slate-800 dark:text-slate-200 mb-2 text-[15px]">
                                កូដគម្រោង (Project Code) <span class="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                [(ngModel)]="projectCode"
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
                                [(ngModel)]="projectName"
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
                                [(ngModel)]="description"
                                placeholder="ពិពណ៌នាខ្លីៗអំពីគោលដៅគម្រោង..."
                                class="w-full px-4 py-3 text-[15px] font-normal font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                            ></textarea>
                        </div>
                    </div>

                </div>
            </mat-dialog-content>

            <!-- Bottom Sticky Action -->
            <div class="w-full flex items-center p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 font-kantumruy">
                <button
                    type="button"
                    (click)="submit()"
                    [disabled]="!projectName.trim() || !projectCode.trim()"
                    class="w-full h-11 px-4 rounded-xl font-medium font-kantumruy text-[15.5px] flex items-center justify-center gap-2 text-white bg-[#1c2b6b] hover:bg-[#152254] disabled:opacity-50 transition-all duration-200 active:scale-[0.98] cursor-pointer"
                >
                    <mat-icon svgIcon="mdi:plus" class="!w-5 !h-5 !text-white shrink-0"></mat-icon>
                    <span>បង្កើតគម្រោង</span>
                </button>
            </div>

        </div>
    `,
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
