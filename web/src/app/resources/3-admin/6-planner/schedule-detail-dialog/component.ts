import { CommonModule } from '@angular/common';
import { Component, Inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SideDialogCloseButtonComponent } from 'app/shared/side-dialog-close-button/component';
import { PlannerScheduleEvent } from '../component';


export * from './schedule-detail-dialog.types';
import { ScheduleDetailDialogData } from './schedule-detail-dialog.types';

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
    templateUrl: './template.html',
    styleUrl: './style.scss',
})
export class ScheduleDetailDialogComponent {
    schedule: PlannerScheduleEvent;
    confirmDelete = signal<boolean>(false);

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

    editSchedule(): void {
        this.dialogRef.close({ action: 'edit', schedule: this.schedule });
    }

    deleteSchedule(): void {
        if (!this.confirmDelete()) {
            this.confirmDelete.set(true);
            return;
        }
        this.dialogRef.close({ action: 'delete', id: this.schedule.id });
    }
}
