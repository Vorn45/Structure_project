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
            <mat-dialog-content class="w-full !m-0 !p-0 overflow-y-auto flex-1 bg-white dark:bg-slate-900 font-kantumruy text-[15px]">
                <div class="p-5 space-y-5 font-kantumruy">

                    <!-- Form Inputs -->
                    <div class="space-y-4 font-kantumruy">
                        <div>
                            <label class="block font-medium text-slate-800 dark:text-slate-200 mb-1.5 text-[15px]">
                                ឈ្មោះគម្រោង (Project Name) <span class="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                [(ngModel)]="projectName"
                                (keyup.enter)="submit()"
                                placeholder="ឧ. ប្រព័ន្ធគ្រប់គ្រងការងារថ្មី (New Project Workflow)..."
                                class="w-full px-3.5 py-2.5 text-[15px] font-normal font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                        </div>

                        <div>
                            <label class="block font-medium text-slate-700 dark:text-slate-300 mb-1.5 text-[13.5px]">
                                កូដគម្រោង (Project Code) <span class="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                [(ngModel)]="projectCode"
                                placeholder="ឧ. PMS-V3, APP-2026..."
                                class="w-full px-3.5 py-2 text-[14px] font-kantumruy font-mono uppercase font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                        </div>

                        <div>
                            <label class="block font-medium text-slate-800 dark:text-slate-200 mb-1.5 text-[14px]">
                                ការពិពណ៌នា (Description)
                            </label>
                            <textarea
                                rows="3"
                                [(ngModel)]="description"
                                placeholder="ពិពណ៌នាខ្លីៗអំពីគោលដៅគម្រោង..."
                                class="w-full p-3 text-[14px] font-normal font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none transition-all"
                            ></textarea>
                        </div>
                    </div>

                </div>
            </mat-dialog-content>

            <!-- Bottom Sticky Action Bar -->
            <div class="w-full flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 font-kantumruy gap-2.5">
                <button
                    type="button"
                    (click)="cancel()"
                    class="h-10 px-4 rounded-xl font-medium font-kantumruy text-[14px] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                    បោះបង់
                </button>

                <button
                    type="button"
                    (click)="submit()"
                    [disabled]="!projectName.trim() || !projectCode.trim()"
                    class="h-10 px-5 rounded-xl font-medium font-kantumruy text-[14px] text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
                >
                    <mat-icon svgIcon="mdi:plus" class="!w-4 !h-4 text-white shrink-0"></mat-icon>
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
