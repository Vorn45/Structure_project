import { CommonModule } from '@angular/common';
import { Component, Inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SideDialogCloseButtonComponent } from 'app/shared/side-dialog-close-button/component';
import { AgilePlanTask } from './plan.component';

export interface AddPlanDialogData {
    currentWeek: number;
    startWeek: number;
    totalWeeks: number;
    weeks: number[];
}

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
    template: `
        <div class="w-full h-full flex flex-col bg-white dark:bg-slate-900 font-kantumruy text-[16px] font-normal relative overflow-hidden"
            style="font-family: 'Kantumruy Pro', sans-serif;">
            
            <!-- Standard Header -->
            <div mat-dialog-title
                class="w-full flex justify-center items-center min-h-14 max-h-14 h-14 border-b border-slate-200 dark:border-slate-800 m-0 !py-0 font-kantumruy bg-white dark:bg-slate-900 relative px-4 shrink-0">
                <span class="w-full text-center text-[20px] font-medium font-kantumruy text-slate-800 dark:text-slate-200">
                    បង្កើតផែនការថ្មី
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
                            <mat-icon svgIcon="mdi:calendar-plus" class="icon-size-40"></mat-icon>
                        </div>
                        <div class="relative z-10">
                            <span class="text-[13px] font-medium tracking-wider uppercase bg-white/20 px-3 py-1 rounded-full text-blue-100">
                                ផែនការថ្មី (NEW AGILE PLAN)
                            </span>
                            <h3 class="text-[20px] font-medium text-white mt-2.5 leading-tight">
                                បង្កើត និង រៀបចំកាលវិភាគការងារ
                            </h3>
                            <p class="text-[14px] text-blue-200/90 mt-1.5 leading-normal">
                                កំណត់ដំណាក់កាលការងារ វដ្ត Iteration និងរយៈពេលសប្តាហ៍អនុវត្ត
                            </p>
                        </div>
                    </div>

                    <!-- Form Inputs -->
                    <div class="space-y-5 text-[16px] font-kantumruy">
                        
                        <!-- 1. Task Name -->
                        <div>
                            <label class="block font-normal text-slate-800 dark:text-slate-200 mb-2 text-[16px]">
                                ឈ្មោះដំណាក់កាលការងារ (Task Phase) <span class="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                [(ngModel)]="taskName"
                                placeholder="ឧ. បង្កើតប្រព័ន្ធសុវត្ថិភាព និងផ្ទៀងផ្ទាត់ទិន្នន័យ..."
                                class="w-full px-4 py-3 text-[16px] font-normal font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>

                        <!-- 2. Iteration Selector -->
                        <div>
                            <label class="block font-normal text-slate-800 dark:text-slate-200 mb-2 text-[16px]">
                                វដ្តអនុវត្តការងារ (Iteration)
                            </label>
                            <div class="grid grid-cols-3 gap-3">
                                <button type="button" (click)="iteration = 1"
                                    class="p-3 rounded-xl border font-kantumruy text-[15px] transition-all flex items-center justify-center gap-2 cursor-pointer"
                                    [ngClass]="iteration === 1
                                        ? 'border-[#f59e0b] bg-[#f59e0b]/10 text-[#d97706] ring-2 ring-[#f59e0b]/30'
                                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'">
                                    <span class="w-3 h-3 rounded-full bg-[#f59e0b]"></span>
                                    <span>Iteration #1</span>
                                </button>

                                <button type="button" (click)="iteration = 2"
                                    class="p-3 rounded-xl border font-kantumruy text-[15px] transition-all flex items-center justify-center gap-2 cursor-pointer"
                                    [ngClass]="iteration === 2
                                        ? 'border-[#f43f5e] bg-[#f43f5e]/10 text-[#e11d48] ring-2 ring-[#f43f5e]/30'
                                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'">
                                    <span class="w-3 h-3 rounded-full bg-[#f43f5e]"></span>
                                    <span>Iteration #2</span>
                                </button>

                                <button type="button" (click)="iteration = 3"
                                    class="p-3 rounded-xl border font-kantumruy text-[15px] transition-all flex items-center justify-center gap-2 cursor-pointer"
                                    [ngClass]="iteration === 3
                                        ? 'border-[#581c87] bg-[#581c87]/10 text-[#581c87] dark:text-purple-300 ring-2 ring-[#581c87]/30'
                                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'">
                                    <span class="w-3 h-3 rounded-full bg-[#581c87]"></span>
                                    <span>Iteration #3</span>
                                </button>
                            </div>
                        </div>

                        <!-- 3. Start Week & Duration in Weeks -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label class="block font-normal text-slate-800 dark:text-slate-200 mb-2 text-[16px]">
                                    សប្តាហ៍ចាប់ផ្តើម (Start Week)
                                </label>
                                <select [(ngModel)]="startWeek"
                                    class="w-full px-4 py-3 text-[16px] font-normal font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                                    <option *ngFor="let w of data.weeks" [value]="w">
                                        សប្តាហ៍ទី {{ w }} {{ w === data.currentWeek ? '(បច្ចុប្បន្ន / NOW)' : '' }}
                                    </option>
                                </select>
                            </div>

                            <div>
                                <label class="block font-normal text-slate-800 dark:text-slate-200 mb-2 text-[16px]">
                                    រយៈពេលសរុប (Duration)
                                </label>
                                <select [(ngModel)]="durationWeeks"
                                    class="w-full px-4 py-3 text-[16px] font-normal font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                                    <option [value]="1">១ សប្តាហ៍ (1 Week)</option>
                                    <option [value]="2">២ សប្តាហ៍ (2 Weeks)</option>
                                    <option [value]="3">៣ សប្តាហ៍ (3 Weeks - 3W)</option>
                                    <option [value]="4">៤ សប្តាហ៍ (4 Weeks - 4W)</option>
                                    <option [value]="5">៥ សប្តាហ៍ (5 Weeks - 5W)</option>
                                    <option [value]="6">៦ សប្តាហ៍ (6 Weeks - 6W)</option>
                                    <option [value]="7">៧ សប្តាហ៍ (7 Weeks - 7W)</option>
                                    <option [value]="8">៨ សប្តាហ៍ (8 Weeks - 8W)</option>
                                    <option [value]="9">៩ សប្តាហ៍ (9 Weeks - 9W)</option>
                                </select>
                            </div>
                        </div>

                        <!-- 4. Preview Bar -->
                        <div class="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <span class="text-[13px] font-medium text-slate-500 uppercase tracking-wider block mb-2.5">
                                ទិដ្ឋភាពជាក់ស្តែង (Roadmap Bar Preview)
                            </span>
                            <div class="flex items-center gap-3">
                                <div class="h-8 px-4 rounded-[3px] flex items-center justify-center font-bold text-xs text-white shadow-xs"
                                    [ngClass]="getPreviewColor()">
                                    <span>{{ durationWeeks > 1 ? durationWeeks + 'W' : '' }}</span>
                                </div>
                                <span class="text-[15px] font-normal text-slate-700 dark:text-slate-300">
                                    ចាប់ពីសប្តាហ៍ទី {{ startWeek }} ដល់ {{ +startWeek + +durationWeeks - 1 }} (សរុប {{ durationWeeks }} សប្តាហ៍)
                                </span>
                            </div>
                        </div>

                    </div>

                </div>

            </mat-dialog-content>

            <!-- Bottom Sticky Action -->
            <div class="w-full flex items-center p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 font-kantumruy">
                <button
                    type="button"
                    (click)="submit()"
                    [disabled]="!taskName.trim()"
                    class="w-full h-11 px-4 rounded-xl font-medium font-kantumruy text-[16px] flex items-center justify-center gap-2 text-white bg-[#1c2b6b] hover:bg-[#152254] disabled:opacity-50 transition-all duration-200 active:scale-[0.98] cursor-pointer"
                >
                    <mat-icon svgIcon="mdi:plus" class="!w-5 !h-5 !text-white shrink-0"></mat-icon>
                    <span>បង្កើតផែនការ</span>
                </button>
            </div>

        </div>
    `,
})
export class AddPlanDialogComponent {
    taskName = '';
    iteration: 1 | 2 | 3 = 1;
    startWeek = 14;
    durationWeeks = 3;

    constructor(
        private readonly _dialogRef: MatDialogRef<AddPlanDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public readonly data: AddPlanDialogData,
    ) {
        if (data?.currentWeek) {
            this.startWeek = data.currentWeek;
        }
    }

    getPreviewColor(): string {
        switch (this.iteration) {
            case 1:
                return 'bg-[#f59e0b]';
            case 2:
                return 'bg-[#f43f5e]';
            case 3:
                return 'bg-[#581c87]';
        }
    }

    cancel(): void {
        this._dialogRef.close(null);
    }

    submit(): void {
        if (!this.taskName.trim()) return;

        const duration = Number(this.durationWeeks) || 1;
        const start = Number(this.startWeek) || 14;
        const newTask: AgilePlanTask = {
            id: `task-${Date.now()}`,
            name: this.taskName.trim(),
            segments: [
                {
                    iteration: this.iteration,
                    startWeek: start,
                    durationWeeks: duration,
                    label: duration > 1 ? `${duration}W` : undefined,
                },
            ],
        };

        this._dialogRef.close(newTask);
    }
}
