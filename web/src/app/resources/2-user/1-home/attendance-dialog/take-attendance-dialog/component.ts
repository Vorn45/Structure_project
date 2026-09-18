import { CommonModule } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, ViewEncapsulation, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserService } from 'app/core/user/user.service';
import { UserHomeService } from '../../home.service';
import QRCode from 'qrcode';
import { Subscription, interval, switchMap } from 'rxjs';


export * from './take-attendance-dialog.types';
import { TakeAttendanceDialogData, AttendanceLogItem } from './take-attendance-dialog.types';

@Component({
    selector: 'app-take-attendance-dialog',
    standalone: true,
    encapsulation: ViewEncapsulation.None,
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
    ],
    templateUrl: './template.html',
    styleUrl: './style.scss',
})
export class TakeAttendanceDialogComponent implements OnInit, OnDestroy {
    private readonly _userService = inject(UserService, { optional: true });

    projectName = 'WMS Digitech';
    department = 'ផ្នែកអភិវឌ្ឍន៍ប្រព័ន្ធ';
    shift = 'វេនពេញម៉ោង';
    todayFormattedDate = '';
    todayDay = '';
    workHours = '08:00 ព្រឹក - 05:00 ល្ងាច';
    locationName = 'ការិយាល័យកណ្តាល';
    currentSessionToken = '';

    readonly qrCodeUrl = signal<string>('');
    readonly mobileScanUrl = signal<string>('');
    readonly isExpired = signal<boolean>(false);
    readonly timeLeft = signal<number>(30);
    readonly isMarking = signal<boolean>(false);

    readonly logs = signal<AttendanceLogItem[]>([
        {
            id: '1',
            name: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត',
            time: '07:55 AM',
            location: '11.5564° N, 104.9282° E (Phnom Penh HQ)',
            device: 'iPhone 15 Pro',
            status: 'on_time',
        },
        {
            id: '2',
            name: 'ពុំ ប្រុសមុន្នី',
            time: '07:58 AM',
            location: '11.5568° N, 104.9285° E (Phnom Penh HQ)',
            device: 'Samsung Galaxy S24',
            status: 'on_time',
        },
        {
            id: '3',
            name: 'ថា វីនណឺរ',
            time: '08:02 AM',
            location: '11.5570° N, 104.9290° E (Phnom Penh HQ)',
            device: 'Xiaomi 14',
            status: 'on_time',
        },
    ]);

    private timerInterval?: any;

    constructor(
        public dialogRef: MatDialogRef<TakeAttendanceDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: TakeAttendanceDialogData,
        private readonly _homeService: UserHomeService,
    ) {
        if (data?.project) this.projectName = data.project;
        else if (data?.subject) this.projectName = data.subject.replace(/\s*\(DBMS\)/gi, '');

        if (data?.department) this.department = data.department;
        else if (data?.batch) this.department = data.batch;

        if (data?.shift) this.shift = data.shift;
        else if (data?.semester) this.shift = 'វេនពេញម៉ោង';

        if (data?.work_hours) this.workHours = data.work_hours;
        else if (data?.slot) this.workHours = data.slot;

        if (data?.location) this.locationName = data.location;

        const now = new Date();
        const khmerMonths = [
            'មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា',
            'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'
        ];
        const dayNum = now.getDate();
        const monthName = khmerMonths[now.getMonth()];
        const yearNum = now.getFullYear();

        this.todayFormattedDate = `${dayNum} ${monthName} ${yearNum} (${String(dayNum).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${yearNum})`;

        const dayKhmer = ['ថ្ងៃអាទិត្យ', 'ថ្ងៃចន្ទ', 'ថ្ងៃអង្គារ', 'ថ្ងៃពុធ', 'ថ្ងៃព្រហស្បតិ៍', 'ថ្ងៃសុក្រ', 'ថ្ងៃសៅរ៍'];
        const dayIdx = now.getDay();
        this.todayDay = `${dayKhmer[dayIdx]}`;
    }

    private _onStorageEvent = (event: StorageEvent) => {
        if (event.key === 'latest_attendance_checkin' && event.newValue) {
            try {
                const item = JSON.parse(event.newValue);
                const newLog: AttendanceLogItem = {
                    id: String(Date.now()),
                    name: item.attendee_name || 'អ្នកប្រើប្រាស់ទូរស័ព្ទ',
                    time: item.checkInTime || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                    location: item.location || 'Phnom Penh HQ',
                    latitude: item.latitude,
                    longitude: item.longitude,
                    accuracy: item.accuracy,
                    device: item.device || 'Phone Scanner',
                    status: 'on_time',
                };
                this.logs.set([newLog, ...this.logs()]);
            } catch (_) {}
        }
    };

    ngOnInit(): void {
        this.generateQrCode();
        if (typeof window !== 'undefined') {
            window.addEventListener('storage', this._onStorageEvent);
        }
    }

    ngOnDestroy(): void {
        this.stopTimer();
        if (typeof window !== 'undefined') {
            window.removeEventListener('storage', this._onStorageEvent);
        }
    }

    async generateQrCode(): Promise<void> {
        this.stopTimer();
        this.isExpired.set(false);
        this.timeLeft.set(30);

        try {
            this.currentSessionToken = Math.random().toString(36).substring(2, 10);
            
            // Format with hash routing /#/attendance/scan for Angular withHashLocation()
            const base = window.location.href.split('#')[0].replace(/\/+$/, '');
            const scanUrl = `${base}/#/attendance/scan?token=${this.currentSessionToken}`;
            this.mobileScanUrl.set(scanUrl);

            const url = await QRCode.toDataURL(scanUrl, {
                width: 240,
                margin: 1,
                color: {
                    dark: '#0f172a',
                    light: '#ffffff',
                },
            });

            this.qrCodeUrl.set(url);
            this.startTimer();
            this.refreshAttendanceLogs();
        } catch (err) {
            console.error('Error generating attendance QR code:', err);
        }
    }

    refreshAttendanceLogs(): void {
        this._homeService.getAttendance().subscribe({
            next: (res) => {
                if (res?.data?.realtime_logs && Array.isArray(res.data.realtime_logs)) {
                    this.logs.set(res.data.realtime_logs);
                }
            },
            error: () => {},
        });
    }

    private startTimer(): void {
        this.timerInterval = setInterval(() => {
            const curr = this.timeLeft();
            if (curr <= 1) {
                // Automatically renew QR code every 30s
                this.generateQrCode();
            } else {
                this.timeLeft.set(curr - 1);
            }
        }, 1000);
    }

    private stopTimer(): void {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    markInstantAttendance(): void {
        this.isMarking.set(true);

        // Fetch real browser/device GPS coordinates
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    const acc = pos.coords.accuracy || 10;
                    const locationStr = `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E (Phnom Penh HQ, ±${acc.toFixed(0)}m)`;
                    this.executeCheckIn(locationStr, 'Device Browser (GPS)', lat, lng);
                },
                () => {
                    this.executeCheckIn('11.5564° N, 104.9282° E (Phnom Penh HQ)', 'Web Terminal');
                },
                { enableHighAccuracy: true, timeout: 5000 }
            );
        } else {
            this.executeCheckIn('11.5564° N, 104.9282° E (Phnom Penh HQ)', 'Web Terminal');
        }
    }

    private executeCheckIn(locationStr: string, device: string, lat?: number, lng?: number): void {
        let currentUserName = 'ពិសិដ្ឋ បញ្ញាវ័ន្ត (You)';
        try {
            const u = this._userService?.user;
            if (u) currentUserName = u.kh_name || u.en_name || u.name || currentUserName;
        } catch (_) {}

        this._homeService.checkIn({ location: locationStr }).subscribe({
            next: (res) => {
                this.isMarking.set(false);
                if (res?.data?.realtime_logs) {
                    this.logs.set(res.data.realtime_logs);
                } else {
                    const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                    this.logs.set([
                        {
                            id: String(Date.now()),
                            name: currentUserName,
                            time: nowTime,
                            location: locationStr,
                            latitude: lat,
                            longitude: lng,
                            device,
                            status: 'on_time',
                        },
                        ...this.logs(),
                    ]);
                }
            },
            error: () => {
                this.isMarking.set(false);
                const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                this.logs.set([
                    {
                        id: String(Date.now()),
                        name: currentUserName,
                        time: nowTime,
                        location: locationStr,
                        latitude: lat,
                        longitude: lng,
                        device,
                        status: 'on_time',
                    },
                    ...this.logs(),
                ]);
            },
        });
    }

    close(): void {
        this.dialogRef.close();
    }
}
