import { CommonModule } from '@angular/common';
import { Component, Inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SideDialogCloseButtonComponent } from 'app/shared/side-dialog-close-button/component';

export interface CreatePhaseDialogData {
    currentPhasesCount?: number;
    projectName?: string;
}

@Component({
    selector: 'app-create-phase-dialog',
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
                    បង្កើតដំណាក់កាលថ្មី
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
                            <mat-icon svgIcon="mdi:timeline-plus-outline" class="icon-size-40"></mat-icon>
                        </div>
                        <div class="relative z-10">
                            <span class="text-[13px] font-medium tracking-wider uppercase bg-white/20 px-3 py-1 rounded-full text-blue-100">
                                ដំណាក់កាលថ្មី (NEW PHASE)
                            </span>
                            <h3 class="text-[20px] font-medium text-white mt-2.5 leading-tight">
                                កំណត់វដ្ត និងដំណាក់កាលគម្រោង
                            </h3>
                            <p class="text-[14px] text-blue-200/90 mt-1.5 leading-normal">
                                បែងចែកកាលវិភាគការងារតាមត្រីមាស និងរយៈពេលអនុវត្តគម្រោង
                            </p>
                        </div>
                    </div>

                    <!-- Form Inputs -->
                    <div class="space-y-5 text-[16px] font-kantumruy">

                        <!-- Phase Title -->
                        <div>
                            <label class="block font-normal text-slate-800 dark:text-slate-200 mb-2 text-[16px]">
                                ឈ្មោះដំណាក់កាល <span class="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                [ngModel]="phaseTitle()"
                                (ngModelChange)="phaseTitle.set($event)"
                                (keyup.enter)="submit()"
                                placeholder="ឧ. ដំណាក់កាលទី ៤៖ ការដាក់ឱ្យប្រើប្រាស់ (Deployment)..."
                                class="w-full px-4 py-3 text-[16px] font-normal font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>

                        <!-- Quarter & Status -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label class="block font-normal text-slate-800 dark:text-slate-200 mb-2 text-[16px]">
                                    ត្រីមាស / វដ្ត
                                </label>
                                <input
                                    type="text"
                                    [ngModel]="phaseQuarter()"
                                    (ngModelChange)="phaseQuarter.set($event)"
                                    placeholder="ឧ. ត្រីមាសទី ៤ (Q4)"
                                    class="w-full px-4 py-3 text-[16px] font-normal font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>

                            <div>
                                <label class="block font-normal text-slate-800 dark:text-slate-200 mb-2 text-[16px]">
                                    ស្ថានភាព (Status)
                                </label>
                                <select
                                    [ngModel]="phaseStatus()"
                                    (ngModelChange)="phaseStatus.set($event)"
                                    class="w-full px-4 py-3 text-[16px] font-normal font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                >
                                    <option value="planned">⚪ គ្រោងទុក (Planned)</option>
                                    <option value="in_progress">🔵 កំពុងដំណើរការ (In Progress)</option>
                                    <option value="completed">🟢 បានបញ្ចប់ (Completed)</option>
                                </select>
                            </div>
                        </div>

                        <!-- Start & End Date -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label class="block font-normal text-slate-800 dark:text-slate-200 mb-2 text-[16px]">
                                    ថ្ងៃចាប់ផ្តើម
                                </label>
                                <input
                                    type="text"
                                    [ngModel]="phaseStartDate()"
                                    (ngModelChange)="phaseStartDate.set($event)"
                                    placeholder="01/10/2026"
                                    class="w-full px-4 py-3 text-[16px] font-normal font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>

                            <div>
                                <label class="block font-normal text-slate-800 dark:text-slate-200 mb-2 text-[16px]">
                                    ថ្ងៃបញ្ចប់
                                </label>
                                <input
                                    type="text"
                                    [ngModel]="phaseEndDate()"
                                    (ngModelChange)="phaseEndDate.set($event)"
                                    placeholder="31/12/2026"
                                    class="w-full px-4 py-3 text-[16px] font-normal font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
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
                    [disabled]="!phaseTitle().trim()"
                    class="w-full h-11 px-4 rounded-xl font-medium font-kantumruy text-[16px] flex items-center justify-center gap-2 text-white bg-[#1c2b6b] hover:bg-[#152254] disabled:opacity-50 transition-all duration-200 active:scale-[0.98] cursor-pointer"
                >
                    <mat-icon svgIcon="mdi:plus" class="!w-5 !h-5 !text-white shrink-0"></mat-icon>
                    <span>បង្កើតដំណាក់កាល</span>
                </button>
            </div>

        </div>
    `,
})
export class CreatePhaseDialogComponent {
    phaseTitle = signal<string>('');
    phaseQuarter = signal<string>('ត្រីមាសទី ៤ (Q4)');
    phaseStatus = signal<'planned' | 'in_progress' | 'completed'>('planned');
    phaseStartDate = signal<string>('01/10/2026');
    phaseEndDate = signal<string>('31/12/2026');

    constructor(
        private readonly _dialogRef: MatDialogRef<CreatePhaseDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: CreatePhaseDialogData,
    ) {
        const nextNum = (data?.currentPhasesCount || 3) + 1;
        this.phaseTitle.set(`ដំណាក់កាលទី ${nextNum}៖ `);
        this.phaseQuarter.set(`ត្រីមាសទី ${nextNum} (Q${nextNum})`);
    }

    submit(): void {
        const title = this.phaseTitle().trim();
        if (!title) return;
        this._dialogRef.close({
            title,
            quarter: this.phaseQuarter() || 'ត្រីមាស',
            status: this.phaseStatus(),
            startDate: this.phaseStartDate() || '01/10/2026',
            endDate: this.phaseEndDate() || '31/12/2026',
        });
    }

    cancel(): void {
        this._dialogRef.close(null);
    }
}
