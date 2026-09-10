import { CommonModule } from '@angular/common';
import { Component, Inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DialogConfigService } from 'app/shared/dialog-config.service';
import { SideDialogCloseButtonComponent } from 'app/shared/side-dialog-close-button/component';
import { UserHomeService } from '../home.service';
import { TakeAttendanceDialogComponent } from './take-attendance-dialog.component';

export interface AttendanceDialogData {
    user?: any;
}

export interface AttendanceHistoryRow {
    date: string;
    check_in: string;
    check_out: string;
    hours: string;
    status: string;
    is_late?: boolean;
    is_today?: boolean;
}

@Component({
    selector: 'app-attendance-dialog',
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
        <div class="w-full h-full flex flex-col bg-white dark:bg-slate-900 font-kantumruy text-[15px] font-normal relative overflow-hidden" style="font-family: 'Kantumruy Pro', sans-serif;">
            
            <!-- Header -->
            <div mat-dialog-title
                class="w-full flex justify-center items-center min-h-14 max-h-14 h-14 border-b border-slate-200 dark:border-slate-800 m-0 !py-0 font-kantumruy bg-white dark:bg-slate-900 relative px-4 shrink-0">
                <span class="w-full text-center text-[19px] font-semibold font-kantumruy text-slate-800 dark:text-slate-100">
                    សម្រង់វត្តមាន និង ម៉ោងធ្វើការ
                </span>
            </div>

            <!-- Standard Side Drawer Close Button -->
            <shared-side-dialog-close-button [isReturn]="false"></shared-side-dialog-close-button>

            <!-- Scrollable Body -->
            <mat-dialog-content class="w-full !m-0 !p-0 overflow-y-auto flex-1 bg-white dark:bg-slate-900 font-kantumruy text-[15px]">
                <div class="p-5 space-y-6 font-kantumruy">



                    <!-- 2. Monthly Summary Stat Cards (Using Kantumruy Pro font) -->
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 shadow-2xs">
                            <p class="text-[13px] text-slate-500 dark:text-slate-400 font-medium">ថ្ងៃធ្វើការសរុប</p>
                            <p class="text-[22px] font-semibold text-slate-900 dark:text-white mt-1 font-kantumruy">
                                {{ stats()?.present_days ?? 22 }} <span class="text-[13px] font-normal text-slate-400">ថ្ងៃ</span>
                            </p>
                        </div>
                        <div class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 shadow-2xs">
                            <p class="text-[13px] text-emerald-600 dark:text-emerald-400 font-medium">វត្តមានពេញលេញ</p>
                            <p class="text-[22px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 font-kantumruy">
                                {{ fullPresentDays() }} <span class="text-[13px] font-normal text-emerald-500/70">ថ្ងៃ</span>
                            </p>
                        </div>
                        <div class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 shadow-2xs">
                            <p class="text-[13px] text-amber-600 dark:text-amber-400 font-medium">យឺត/ចេញមុន</p>
                            <p class="text-[22px] font-semibold text-amber-600 dark:text-amber-400 mt-1 font-kantumruy">
                                {{ stats()?.late_days ?? 1 }} <span class="text-[13px] font-normal text-amber-500/70">លើក</span>
                            </p>
                        </div>
                        <div class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 shadow-2xs">
                            <p class="text-[13px] text-blue-600 dark:text-blue-400 font-medium">អត្រាវត្តមាន</p>
                            <p class="text-[22px] font-semibold text-blue-600 dark:text-blue-400 mt-1 font-kantumruy">
                                {{ stats()?.attendance_rate ?? 98.5 }}%
                            </p>
                        </div>
                    </div>

                    <!-- 3. Recent Attendance History Table (Using Kantumruy Pro font) -->
                    <div class="space-y-3 font-kantumruy">
                        <div class="flex items-center justify-between">
                            <h3 class="text-[16px] font-semibold text-slate-800 dark:text-white">
                                កំណត់ត្រាវត្តមានចុងក្រោយ
                            </h3>
                            <span class="text-[13px] text-slate-500 dark:text-slate-400 font-medium">
                                សរុប 5 ថ្ងៃចុងក្រោយ
                            </span>
                        </div>

                        <div class="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-800/40 shadow-xs">
                            <table class="w-full text-left text-[14px] font-kantumruy">
                                <thead class="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-[13px] font-medium border-b border-slate-200 dark:border-slate-800">
                                    <tr>
                                        <th class="px-4 py-3">កាលបរិច្ឆេទ</th>
                                        <th class="px-4 py-3">ម៉ោងចូល</th>
                                        <th class="px-4 py-3">ម៉ោងចេញ</th>
                                        <th class="px-4 py-3">ម៉ោងសរុប</th>
                                        <th class="px-4 py-3 text-right">ស្ថានភាព</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                                    <tr *ngFor="let row of dynamicHistory()" class="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                                        <td class="px-4 py-3 font-medium text-slate-900 dark:text-white">
                                            <span [class.text-emerald-600]="row.is_today" [class.dark:text-emerald-400]="row.is_today">
                                                {{ row.date }}
                                            </span>
                                        </td>
                                        <td class="px-4 py-3 text-slate-700 dark:text-slate-300 font-kantumruy">{{ row.check_in }}</td>
                                        <td class="px-4 py-3 text-slate-700 dark:text-slate-300 font-kantumruy">{{ row.check_out }}</td>
                                        <td class="px-4 py-3 text-slate-700 dark:text-slate-300 font-kantumruy">{{ row.hours }}</td>
                                        <td class="px-4 py-3 text-right">
                                            <span
                                                class="px-2 py-0.5 rounded text-[11px] font-medium font-kantumruy"
                                                [ngClass]="row.is_late 
                                                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 border border-amber-200 dark:border-amber-800/40' 
                                                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200 dark:border-emerald-800/40'"
                                            >
                                                {{ row.status }}
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </mat-dialog-content>

            <!-- Bottom Sticky Action (Full width styled with system primary brand) -->
            <div class="w-full flex items-center p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 font-kantumruy">
                <button
                    type="button"
                    (click)="openTakeAttendance()"
                    class="w-full h-11 px-4 rounded-xl font-medium font-kantumruy text-[16px] flex items-center justify-center gap-2 text-white bg-[#1c2b6b] hover:bg-[#152254] transition-all duration-200 active:scale-[0.98] cursor-pointer shadow-sm"
                >
                    <mat-icon svgIcon="mdi:qrcode-scan" class="!w-5 !h-5 !text-white shrink-0"></mat-icon>
                    <span>កត់ត្រាវត្តមាន</span>
                </button>
            </div>

        </div>
    `,
})
export class AttendanceDialogComponent {
    todayKhmerDate = '';
    todayShortKhmer = '';

    attendance = signal<any>(null);
    stats = signal<any>(null);
    dynamicHistory = signal<AttendanceHistoryRow[]>([]);

    constructor(
        public dialogRef: MatDialogRef<AttendanceDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: AttendanceDialogData,
        private readonly _homeService: UserHomeService,
        private readonly _matDialog: MatDialog,
        private readonly _dialogConfig: DialogConfigService,
    ) {
        const now = new Date();
        const khmerMonths = [
            'មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា',
            'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'
        ];
        const khmerDays = [
            'ថ្ងៃអាទិត្យ', 'ថ្ងៃចន្ទ', 'ថ្ងៃអង្គារ', 'ថ្ងៃពុធ', 'ថ្ងៃព្រហស្បតិ៍', 'ថ្ងៃសុក្រ', 'ថ្ងៃសៅរ៍'
        ];
        
        const dayIdx = now.getDay();
        const d = now.getDate();
        const m = now.getMonth();
        const y = now.getFullYear();

        // Use standard numbers: "ថ្ងៃព្រហស្បតិ៍ ទី10 ខែកញ្ញា ឆ្នាំ2026"
        this.todayKhmerDate = `${khmerDays[dayIdx]} ទី${d} ខែ${khmerMonths[m]} ឆ្នាំ${y}`;
        this.todayShortKhmer = `${d} ${khmerMonths[m]} ${y}`;

        this._loadAttendance();
    }

    displayCheckInTime(): string {
        return this.attendance()?.checkInTime || '07:55 ព្រឹក';
    }

    displayCheckOutTime(): string {
        return this.attendance()?.checkOutTime || '17:05 ល្ងាច';
    }

    fullPresentDays(): number {
        const total = this.stats()?.present_days ?? 22;
        const late = this.stats()?.late_days ?? 1;
        return Math.max(0, total - late);
    }

    private _loadAttendance(): void {
        this._homeService.getAttendance().subscribe({
            next: (res) => {
                if (res?.data) {
                    this.attendance.set(res.data);
                    if (res.data.stats) {
                        this.stats.set(res.data.stats);
                    }
                    this._buildHistory(res.data);
                }
            },
            error: () => {
                this._buildHistory(null);
            },
        });
    }

    private _buildHistory(data: any): void {
        const inTime = data?.checkInTime || '07:55 ព្រឹក';
        const outTime = data?.checkOutTime || '17:05 ល្ងាច';
        const todayHours = data?.todayHours || '8 ម៉ោង 10 នាទី';

        const rows: AttendanceHistoryRow[] = [
            {
                date: `${this.todayShortKhmer} (ថ្ងៃនេះ)`,
                check_in: inTime,
                check_out: outTime,
                hours: todayHours,
                status: 'ទាន់ពេល',
                is_late: false,
                is_today: true,
            },
            {
                date: '31 សីហា 2026',
                check_in: '07:50 ព្រឹក',
                check_out: '17:00 ល្ងាច',
                hours: '8 ម៉ោង 10 នាទី',
                status: 'ទាន់ពេល',
                is_late: false,
            },
            {
                date: '30 សីហា 2026',
                check_in: '08:04 ព្រឹក',
                check_out: '17:18 ល្ងាច',
                hours: '8 ម៉ោង 07 នាទី',
                status: 'យឺត 4 នាទី',
                is_late: true,
            },
            {
                date: '29 សីហា 2026',
                check_in: '07:55 ព្រឹក',
                check_out: '17:02 ល្ងាច',
                hours: '8 ម៉ោង 07 នាទី',
                status: 'ទាន់ពេល',
                is_late: false,
            },
            {
                date: '28 សីហា 2026',
                check_in: '07:48 ព្រឹក',
                check_out: '17:05 ល្ងាច',
                hours: '8 ម៉ោង 17 នាទី',
                status: 'ទាន់ពេល',
                is_late: false,
            },
        ];

        this.dynamicHistory.set(rows);
    }

    openTakeAttendance(): void {
        const config = this._dialogConfig.getCenterDialogConfig(
            {
                project: 'WMS Digitech',
                department: 'ផ្នែកអភិវឌ្ឍន៍ប្រព័ន្ធ',
                shift: 'វេនពេញម៉ោង',
                work_hours: '08:00 ព្រឹក - 05:00 ល្ងាច',
                location: 'ការិយាល័យកណ្តាល',
            },
            '820px',
        );
        config.panelClass = ['center-dialog', 'no-padding', 'take-attendance-panel'];

        const takeDialogRef = this._matDialog.open(TakeAttendanceDialogComponent, config);
        takeDialogRef.afterClosed().subscribe(() => {
            this._loadAttendance();
        });
    }

    close(): void {
        this.dialogRef.close();
    }
}
