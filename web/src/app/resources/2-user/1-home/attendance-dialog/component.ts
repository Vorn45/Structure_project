import { CommonModule } from '@angular/common';
import { Component, Inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DialogConfigService } from 'app/shared/dialog-config.service';
import { SideDialogCloseButtonComponent } from 'app/shared/side-dialog-close-button/component';
import { UserHomeService } from '../home.service';
import { TakeAttendanceDialogComponent } from './take-attendance-dialog/component';


export * from './attendance-dialog.types';
import { AttendanceDialogData, AttendanceHistoryRow } from './attendance-dialog.types';

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
    templateUrl: './template.html',
    styleUrl: './style.scss',
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

    private _onStorageEvent = (event: StorageEvent) => {
        if (event.key === 'latest_attendance_checkin') {
            this._loadAttendance();
        }
    };

    ngOnInit(): void {
        if (typeof window !== 'undefined') {
            window.addEventListener('storage', this._onStorageEvent);
        }
    }

    ngOnDestroy(): void {
        if (typeof window !== 'undefined') {
            window.removeEventListener('storage', this._onStorageEvent);
        }
    }

    displayCheckInTime(): string {
        return this._formatTimeKh(this.attendance()?.checkInTime) || '--:--';
    }

    displayCheckOutTime(): string {
        return this._formatTimeKh(this.attendance()?.checkOutTime) || '--:--';
    }

    fullPresentDays(): number {
        const total = this.stats()?.present_days ?? 22;
        const late = this.stats()?.late_days ?? 1;
        return Math.max(0, total - late);
    }

    private _formatTimeKh(timeStr?: string | null): string {
        if (!timeStr) return '';
        if (timeStr.includes('ព្រឹក') || timeStr.includes('រសៀល') || timeStr.includes('ល្ងាច')) {
            return timeStr;
        }
        const match = timeStr.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
        if (!match) return timeStr;
        const hour = parseInt(match[1], 10);
        const min = match[2];
        const period = (match[3] || '').toUpperCase();
        
        let khPeriod = 'ព្រឹក';
        if (period === 'PM') {
            if (hour >= 12 && hour < 17) {
                khPeriod = 'រសៀល';
            } else {
                khPeriod = 'ល្ងាច';
            }
        } else if (period === 'AM' && hour === 12) {
            khPeriod = 'យប់';
        }
        const padHour = String(hour).padStart(2, '0');
        return `${padHour}:${min} ${khPeriod}`;
    }

    private _getCheckInData(serverData: any): any {
        let localData: any = null;
        try {
            const raw = localStorage.getItem('latest_attendance_checkin');
            if (raw) localData = JSON.parse(raw);
        } catch (_) {}

        if (serverData?.checkedIn) {
            return serverData;
        }
        if (localData?.checkedIn) {
            return {
                ...(serverData || {}),
                checkedIn: true,
                checkInTime: localData.checkInTime,
                checkOutTime: localData.checkOutTime,
                todayHours: localData.todayHours || 'កំពុងដំណើរការ',
                stats: {
                    ...(serverData?.stats || {}),
                    present_days: Math.max(serverData?.stats?.present_days ?? 22, 23),
                    attendance_rate: 99.0,
                },
            };
        }
        return serverData;
    }

    private _loadAttendance(): void {
        this._homeService.getAttendance().subscribe({
            next: (res) => {
                const effective = this._getCheckInData(res?.data);
                if (effective) {
                    this.attendance.set(effective);
                    if (effective.stats) {
                        this.stats.set(effective.stats);
                    }
                    this._buildHistory(effective);
                }
            },
            error: () => {
                const effective = this._getCheckInData(null);
                this._buildHistory(effective);
            },
        });
    }

    private _buildHistory(data: any): void {
        const isCheckedIn = !!data?.checkedIn || !!data?.checkInTime;
        const inTime = isCheckedIn ? this._formatTimeKh(data.checkInTime) : '--:--';
        const outTime = data?.checkOutTime ? this._formatTimeKh(data.checkOutTime) : (isCheckedIn ? 'កំពុងបំពេញការងារ' : '--:--');
        const todayHours = isCheckedIn ? (data?.todayHours || 'កំពុងដំណើរការ') : '--:--';
        const status = isCheckedIn ? 'ទាន់ពេល' : 'មិនទាន់កត់ត្រា';

        const rows: AttendanceHistoryRow[] = [
            {
                date: `${this.todayShortKhmer} (ថ្ងៃនេះ)`,
                check_in: inTime,
                check_out: outTime,
                hours: todayHours,
                status: status,
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
