import { CommonModule } from '@angular/common';
import { Component, Inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SideDialogCloseButtonComponent } from 'app/shared/side-dialog-close-button/component';

export interface CreateTaskDialogData {
    projectCode?: string;
    projectName?: string;
    members?: { id: number; name: string; role: string }[];
}

@Component({
    selector: 'app-create-task-dialog',
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

            <!-- Header -->
            <div mat-dialog-title
                class="w-full flex justify-center items-center min-h-14 max-h-14 h-14 border-b border-slate-200 dark:border-slate-800 m-0 !py-0 font-kantumruy bg-white dark:bg-slate-900 relative px-4 shrink-0">
                <span class="w-full text-center text-[20px] font-medium font-kantumruy text-slate-800 dark:text-slate-200">
                    បង្កើតការងារថ្មី
                </span>
            </div>

            <!-- Side Dialog Close Button -->
            <shared-side-dialog-close-button [isReturn]="false"></shared-side-dialog-close-button>

            <!-- Scrollable Content -->
            <mat-dialog-content class="w-full !m-0 !p-0 overflow-y-auto flex-1 bg-white dark:bg-slate-900 font-kantumruy text-[16px]">
                <div class="p-5 space-y-6 font-kantumruy">

                    <!-- Cover Banner -->
                    <div class="rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-[#0f284e] text-white p-5 shadow-sm relative overflow-hidden font-kantumruy">
                        <div class="absolute right-0 top-0 text-white/5 pointer-events-none -mr-6 -mt-6">
                            <mat-icon svgIcon="mdi:clipboard-plus-outline" class="icon-size-40"></mat-icon>
                        </div>
                        <div class="relative z-10">
                            <span class="text-[13px] font-medium tracking-wider uppercase bg-white/20 px-3 py-1 rounded-full text-blue-100">
                                ការងារថ្មី (NEW TASK)
                            </span>
                            <h3 class="text-[20px] font-medium text-white mt-2.5 leading-tight">
                                បង្កើត និងកំណត់ភារកិច្ចការងារ
                            </h3>
                            <p class="text-[14px] text-blue-200/90 mt-1.5 leading-normal">
                                កំណត់កម្រិតអាទិភាព ស្ថានភាព កាលបរិច្ឆេទ និងអ្នកទទួលខុសត្រូវអនុវត្ត
                            </p>
                        </div>
                    </div>

                    <!-- Form Inputs -->
                    <div class="space-y-5 text-[16px] font-kantumruy">

                        <!-- Task Title -->
                        <div>
                            <label class="block font-normal text-slate-800 dark:text-slate-200 mb-2 text-[16px]">
                                ចំណងជើងការងារ <span class="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                [ngModel]="taskTitle()"
                                (ngModelChange)="taskTitle.set($event)"
                                (keyup.enter)="submit()"
                                placeholder="ឧ. Org Admin | Structure | Department..."
                                class="w-full px-4 py-3 text-[16px] font-normal font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>

                        <!-- Priority & Status -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label class="block font-normal text-slate-800 dark:text-slate-200 mb-2 text-[16px]">
                                    កម្រិតអាទិភាព (Priority)
                                </label>
                                <select
                                    [ngModel]="taskPriority()"
                                    (ngModelChange)="taskPriority.set($event)"
                                    class="w-full px-4 py-3 text-[16px] font-normal font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                >
                                    <option value="urgent">🔴 បន្ទាន់ (Urgent)</option>
                                    <option value="high">🟠 ខ្ពស់ (High)</option>
                                    <option value="medium">🔵 មធ្យម (Medium)</option>
                                    <option value="low">⚪ ទាប (Low)</option>
                                </select>
                            </div>

                            <div>
                                <label class="block font-normal text-slate-800 dark:text-slate-200 mb-2 text-[16px]">
                                    ស្ថានភាព (Status)
                                </label>
                                <select
                                    [ngModel]="taskStatus()"
                                    (ngModelChange)="taskStatus.set($event)"
                                    class="w-full px-4 py-3 text-[16px] font-normal font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                >
                                    <option value="new">📋 ថ្មី (New)</option>
                                    <option value="in_progress">⏱️ កំពុងដំណើរការ (In Progress)</option>
                                    <option value="review">🔍 ស្នើសុំពិនិត្យ (Review)</option>
                                    <option value="confirmed">📋 បញ្ជាក់ (Confirmed)</option>
                                    <option value="done">✓ បញ្ចប់ (Done)</option>
                                </select>
                            </div>
                        </div>

                        <!-- Due Date & Assignee -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label class="block font-normal text-slate-800 dark:text-slate-200 mb-2 text-[16px]">
                                    កាលបរិច្ឆេទកំណត់ (Due Date)
                                </label>
                                <input
                                    type="text"
                                    [ngModel]="taskDueDate()"
                                    (ngModelChange)="taskDueDate.set($event)"
                                    placeholder="15/09/2026"
                                    class="w-full px-4 py-3 text-[16px] font-normal font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>

                            <div>
                                <label class="block font-normal text-slate-800 dark:text-slate-200 mb-2 text-[16px]">
                                    អ្នកទទួលខុសត្រូវ (Assignee)
                                </label>
                                <select
                                    [ngModel]="taskAssignee()"
                                    (ngModelChange)="taskAssignee.set($event)"
                                    class="w-full px-4 py-3 text-[16px] font-normal font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                >
                                    <option value="">-- ជ្រើសរើសសមាជិក --</option>
                                    <option *ngFor="let m of data?.members" [value]="m.name">
                                        {{ m.name }} ({{ m.role }})
                                    </option>
                                </select>
                            </div>
                        </div>

                        <!-- Description -->
                        <div>
                            <label class="block font-normal text-slate-800 dark:text-slate-200 mb-2 text-[16px]">
                                ការពិពណ៌នាការងារ
                            </label>
                            <textarea
                                rows="3"
                                [ngModel]="taskDescription()"
                                (ngModelChange)="taskDescription.set($event)"
                                placeholder="ព័ត៌មានលម្អិតអំពីការងារ និងគោលដៅអនុវត្ត..."
                                class="w-full p-3 text-[16px] font-normal font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
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
                    [disabled]="!taskTitle().trim()"
                    class="w-full h-11 px-4 rounded-xl font-medium font-kantumruy text-[16px] flex items-center justify-center gap-2 text-white bg-[#1c2b6b] hover:bg-[#152254] disabled:opacity-50 transition-all duration-200 active:scale-[0.98] cursor-pointer"
                >
                    <mat-icon svgIcon="mdi:plus" class="!w-5 !h-5 !text-white shrink-0"></mat-icon>
                    <span>បង្កើតការងារ</span>
                </button>
            </div>

        </div>
    `,
})
export class CreateTaskDialogComponent {
    taskTitle = signal<string>('');
    taskPriority = signal<string>('medium');
    taskStatus = signal<string>('new');
    taskDueDate = signal<string>('15/09/2026');
    taskAssignee = signal<string>('');
    taskDescription = signal<string>('');

    constructor(
        private readonly _dialogRef: MatDialogRef<CreateTaskDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: CreateTaskDialogData,
    ) {
        if (data?.members && data.members.length > 0) {
            this.taskAssignee.set(data.members[0].name);
        }
    }

    submit(): void {
        const title = this.taskTitle().trim();
        if (!title) return;
        this._dialogRef.close({
            title,
            priority: this.taskPriority(),
            status: this.taskStatus(),
            due_date: this.taskDueDate() || '15/09/2026',
            assignee: this.taskAssignee() || 'ចេង ច័ន្ទបញ្ញា',
            description: this.taskDescription().trim() || title,
        });
    }

    cancel(): void {
        this._dialogRef.close(null);
    }
}
