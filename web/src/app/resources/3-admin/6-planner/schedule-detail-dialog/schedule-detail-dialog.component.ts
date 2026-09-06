import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SideDialogCloseButtonComponent } from 'app/shared/side-dialog-close-button/component';
import { PlannerScheduleEvent } from '../planner.component';

export interface ScheduleDetailDialogData {
    schedule: PlannerScheduleEvent;
}

@Component({
    selector: 'app-schedule-detail-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        SideDialogCloseButtonComponent,
    ],
    template: `
        <div class="w-full h-full flex flex-col bg-white dark:bg-slate-900 font-kantumruy text-[16px] font-normal relative overflow-hidden" style="font-family: 'Kantumruy Pro', sans-serif !important;">
            
            <!-- ========================================================= -->
            <!-- 1. DIALOG HEADER (Standard Side Drawer Header)            -->
            <!-- ========================================================= -->
            <div mat-dialog-title
                class="w-full relative flex justify-center items-center min-h-14 max-h-14 h-14 border-b border-slate-200 dark:border-white/10 m-0 !py-0 font-kantumruy bg-white dark:bg-slate-900 shrink-0">
                <span class="w-full text-center text-xl sm:text-2xl font-medium font-kantumruy text-slate-800 dark:text-slate-200">
                    ព័ត៌មានលម្អិតកាលវិភាគ
                </span>
            </div>

            <!-- Standard Side Drawer Close Button -->
            <shared-side-dialog-close-button [isReturn]="false"></shared-side-dialog-close-button>

            <!-- ========================================================= -->
            <!-- 2. DIALOG CONTENT BODY                                    -->
            <!-- ========================================================= -->
            <mat-dialog-content class="flex-1 !m-0 p-6 overflow-y-auto bg-white dark:bg-slate-900 font-kantumruy text-[16px] space-y-6">
                
                <!-- Category Badge & Header Banner -->
                <div [class]="'p-5 rounded-2xl border transition-all ' + getBannerClass(schedule.category)">
                    <div class="flex items-center justify-between gap-3 mb-2.5">
                        <span [class]="'px-3 py-1 rounded-full text-[13.5px] font-medium flex items-center gap-1.5 ' + getCategoryPillClass(schedule.category)">
                            <mat-icon [svgIcon]="getCategoryIcon(schedule.category)" class="icon-size-4"></mat-icon>
                            <span>{{ getCategoryLabel(schedule.category) }}</span>
                        </span>

                        <span class="text-[14px] font-medium text-slate-600 dark:text-slate-300">
                            {{ schedule.type || 'កិច្ចប្រជុំទូទៅ' }}
                        </span>
                    </div>

                    <!-- Title -->
                    <h2 class="text-xl sm:text-2xl font-medium text-slate-900 dark:text-white leading-snug">
                        {{ schedule.title }}
                    </h2>
                </div>

                <!-- Info Grid -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    <!-- Date Range Card -->
                    <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70">
                        <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[14px] mb-1.5">
                            <mat-icon svgIcon="mdi:calendar-month-outline" class="icon-size-4.5 text-blue-600"></mat-icon>
                            <span>កាលបរិច្ឆេទ / ថ្ងៃអនុវត្ត</span>
                        </div>
                        <div class="text-[15.5px] font-medium text-slate-800 dark:text-slate-100">
                            {{ getFormattedDate() }}
                        </div>
                    </div>

                    <!-- Time Card -->
                    <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70">
                        <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[14px] mb-1.5">
                            <mat-icon svgIcon="mdi:clock-outline" class="icon-size-4.5 text-blue-600"></mat-icon>
                            <span>ពេលវេលា</span>
                        </div>
                        <div class="text-[15.5px] font-medium text-slate-800 dark:text-slate-100">
                            {{ schedule.time }}
                        </div>
                    </div>

                </div>

                <!-- Project / Plan Name (If any) -->
                @if (schedule.planName) {
                    <div class="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-800/50 flex items-start gap-3">
                        <mat-icon svgIcon="mdi:folder-outline" class="icon-size-5 text-blue-600 shrink-0 mt-0.5"></mat-icon>
                        <div>
                            <div class="text-[13.5px] text-blue-700 dark:text-blue-300 font-medium">
                                គម្រោង / ផែនការងារពាក់ព័ន្ធ
                            </div>
                            <div class="text-[15.5px] font-medium text-slate-800 dark:text-slate-100 mt-0.5">
                                {{ schedule.planName }}
                            </div>
                        </div>
                    </div>
                }

                <!-- Assigned Team Members Section -->
                <div>
                    <div class="flex items-center justify-between mb-3">
                        <label class="text-[15.5px] font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <mat-icon svgIcon="mdi:account-group-outline" class="icon-size-5 text-blue-600"></mat-icon>
                            <span>សមាជិកចូលរួម ({{ schedule.members?.length || 0 }} នាក់)</span>
                        </label>
                    </div>

                    @if (schedule.members && schedule.members.length > 0) {
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            @for (member of schedule.members; track $index) {
                                <div class="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center gap-3">
                                    <div [class]="'w-9 h-9 rounded-full ' + (member.bg || 'bg-slate-700 text-white') + ' flex items-center justify-center text-[12.5px] font-medium shrink-0 shadow-2xs'">
                                        {{ member.initials || member.name.slice(0, 2).toUpperCase() }}
                                    </div>
                                    <div class="min-w-0">
                                        <div class="text-[14.5px] font-medium text-slate-800 dark:text-slate-200 truncate">
                                            {{ member.name }}
                                        </div>
                                        <div class="text-[12.5px] text-slate-400 truncate mt-0.5">
                                            {{ member.role || 'សមាជិកក្រុមការងារ' }}
                                        </div>
                                    </div>
                                </div>
                            }
                        </div>
                    } @else {
                        <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-700 text-center text-slate-400 text-[14.5px]">
                            គ្មានសមាជិកចាត់តាំងបន្ថែម
                        </div>
                    }
                </div>

                <!-- Notes / Description Section -->
                <div>
                    <label class="block text-[15.5px] font-medium text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
                        <mat-icon svgIcon="mdi:text-box-outline" class="icon-size-5 text-blue-600"></mat-icon>
                        <span>កំណត់ចំណាំ ឬរបៀបវារៈ</span>
                    </label>
                    <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed min-h-[70px]">
                        {{ schedule.note || 'មិនមានកំណត់ចំណាំបន្ថែមសម្រាប់កាលវិភាគនេះទេ។' }}
                    </div>
                </div>

            </mat-dialog-content>

            <!-- ========================================================= -->
            <!-- 3. DIALOG ACTIONS FOOTER                                  -->
            <!-- ========================================================= -->
            <div class="p-4 px-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 shrink-0 font-kantumruy">
                
                <!-- Delete Button -->
                <button
                    type="button"
                    (click)="deleteSchedule()"
                    class="px-4 py-2.5 rounded-xl text-[14.5px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 transition-all flex items-center gap-1.5 cursor-pointer">
                    <mat-icon svgIcon="mdi:trash-can-outline" class="icon-size-4.5 text-rose-600 dark:text-rose-400"></mat-icon>
                    <span>លុបកាលវិភាគ</span>
                </button>

                <!-- Close Button -->
                <button
                    type="button"
                    (click)="close()"
                    class="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[15px] font-medium shadow-xs transition-all cursor-pointer">
                    យល់ព្រម / បិទ
                </button>
            </div>

        </div>
    `,
})
export class ScheduleDetailDialogComponent {
    schedule: PlannerScheduleEvent;

    constructor(
        public dialogRef: MatDialogRef<ScheduleDetailDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: ScheduleDetailDialogData,
    ) {
        this.schedule = data.schedule;
    }

    getCategoryLabel(category: string): string {
        switch (category) {
            case 'work':
                return 'ការងារ';
            case 'myself':
                return 'ផ្ទាល់ខ្លួន';
            case 'breaks':
                return 'ការសម្រាក';
            default:
                return 'ទូទៅ';
        }
    }

    getCategoryIcon(category: string): string {
        switch (category) {
            case 'work':
                return 'mdi:briefcase-outline';
            case 'myself':
                return 'mdi:account-outline';
            case 'breaks':
                return 'mdi:coffee-outline';
            default:
                return 'mdi:calendar-check';
        }
    }

    getCategoryPillClass(category: string): string {
        switch (category) {
            case 'work':
                return 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300';
            case 'myself':
                return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300';
            case 'breaks':
                return 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300';
            default:
                return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
        }
    }

    getBannerClass(category: string): string {
        switch (category) {
            case 'work':
                return 'bg-[#fff5ee] dark:bg-amber-950/30 border-[#f97316]/30';
            case 'myself':
                return 'bg-[#eff3ff] dark:bg-indigo-950/30 border-[#6366f1]/30';
            case 'breaks':
                return 'bg-[#fff1f2] dark:bg-rose-950/30 border-[#f43f5e]/30';
            default:
                return 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700';
        }
    }

    getFormattedDate(): string {
        if ((this.schedule as any).date) {
            return this.formatKhmerDate((this.schedule as any).date);
        }
        const khmerDays = ['ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍', 'អាទិត្យ'];
        const start = this.schedule.startDayIndex !== undefined ? this.schedule.startDayIndex : (this.schedule.dayIndex !== undefined ? this.schedule.dayIndex : 0);
        const end = this.schedule.endDayIndex !== undefined ? this.schedule.endDayIndex : start;

        const startName = khmerDays[start] || `ថ្ងៃទី ${start + 1}`;
        if (start === end) {
            return `ថ្ងៃ ${startName}`;
        }
        const endName = khmerDays[end] || `ថ្ងៃទី ${end + 1}`;
        return `ថ្ងៃ ${startName} ដល់ ថ្ងៃ ${endName}`;
    }

    private formatKhmerDate(dateStr: string): string {
        const parts = dateStr.split('-');
        if (parts.length < 3) return dateStr;
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        const khmerDays = ['អាទិត្យ', 'ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'];
        const khmerMonths = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
        const dayName = khmerDays[d.getDay()] || '';
        const dayNum = String(d.getDate()).padStart(2, '0');
        const monthName = khmerMonths[d.getMonth()] || '';
        const yearNum = d.getFullYear();
        return `${dayName} ទី ${dayNum} ${monthName} ${yearNum}`;
    }

    close(): void {
        this.dialogRef.close();
    }

    deleteSchedule(): void {
        this.dialogRef.close({ action: 'delete', id: this.schedule.id });
    }
}
