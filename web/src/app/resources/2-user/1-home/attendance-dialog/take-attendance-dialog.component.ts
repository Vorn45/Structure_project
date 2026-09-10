import { CommonModule } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, ViewEncapsulation, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserService } from 'app/core/user/user.service';
import { UserHomeService } from '../home.service';
import QRCode from 'qrcode';
import { Subscription, interval, switchMap } from 'rxjs';

export interface TakeAttendanceDialogData {
    project?: string;
    department?: string;
    shift?: string;
    work_hours?: string;
    location?: string;
    subject?: string;
    batch?: string;
    semester?: string;
    slot?: string;
    user?: any;
}

export interface AttendanceLogItem {
    id: string;
    name: string;
    time: string;
    location: string;
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    device?: string;
    status: 'on_time' | 'late';
    avatar?: string | null;
}

@Component({
    selector: 'app-take-attendance-dialog',
    standalone: true,
    encapsulation: ViewEncapsulation.None,
    styles: [`
        .take-attendance-panel .mat-mdc-dialog-surface.mdc-dialog__surface,
        .center-dialog.no-padding .mat-mdc-dialog-surface.mdc-dialog__surface {
            padding: 0 !important;
            border-radius: 1.5rem !important;
            overflow: hidden !important;
            background: transparent !important;
            box-shadow: none !important;
        }
    `],
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
    ],
    template: `
        <div class="w-full flex flex-col bg-white dark:bg-slate-900 rounded-3xl font-kantumruy text-[15px] overflow-hidden shadow-2xl border border-slate-200/80 dark:border-slate-800" style="font-family: 'Kantumruy Pro', sans-serif;">
            
            <!-- Header -->
            <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/60">
                <div class="flex items-center gap-2.5">
                    <mat-icon svgIcon="mdi:qrcode-scan" class="icon-size-6 text-[#1c2b6b] dark:text-blue-400 shrink-0"></mat-icon>
                    <h2 class="text-[18px] font-bold text-slate-800 dark:text-slate-100 m-0 leading-tight">
                        កត់ត្រាវត្តមានការងារ
                    </h2>
                </div>
                
                <button
                    type="button"
                    (click)="close()"
                    class="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                    aria-label="Close"
                >
                    <mat-icon svgIcon="heroicons_outline:x-mark" class="icon-size-5"></mat-icon>
                </button>
            </div>

            <!-- Scrollable Content -->
            <div class="p-6 overflow-y-auto max-h-[calc(88vh-130px)] space-y-5">
                


                <div class="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                    
                    <!-- Left Column: Details Table aligned with WMS System -->
                    <div class="md:col-span-7 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900/60 shadow-xs">
                        <table class="w-full text-left text-[14px]">
                            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                                <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td class="px-4 py-3.5 font-medium text-slate-500 dark:text-slate-400 w-2/5 flex items-center gap-2">
                                        <mat-icon svgIcon="mdi:office-building-outline" class="icon-size-4 text-slate-400"></mat-icon>
                                        <span>គម្រោង</span>
                                    </td>
                                    <td class="px-4 py-3.5 font-semibold text-slate-800 dark:text-slate-100">
                                        {{ projectName }}
                                    </td>
                                </tr>

                                <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td class="px-4 py-3.5 font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                        <mat-icon svgIcon="mdi:account-group-outline" class="icon-size-4 text-slate-400"></mat-icon>
                                        <span>ផ្នែក</span>
                                    </td>
                                    <td class="px-4 py-3.5 font-medium text-slate-700 dark:text-slate-200">
                                        {{ department }}
                                    </td>
                                </tr>

                                <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td class="px-4 py-3.5 font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                        <mat-icon svgIcon="mdi:calendar-sync-outline" class="icon-size-4 text-slate-400"></mat-icon>
                                        <span>វេនការងារ</span>
                                    </td>
                                    <td class="px-4 py-3.5 font-medium text-slate-700 dark:text-slate-200">
                                        {{ shift }}
                                    </td>
                                </tr>

                                <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td class="px-4 py-3.5 font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                        <mat-icon svgIcon="mdi:calendar-month-outline" class="icon-size-4 text-slate-400"></mat-icon>
                                        <span>កាលបរិច្ឆេទ</span>
                                    </td>
                                    <td class="px-4 py-3.5 font-medium text-slate-700 dark:text-slate-200 font-kantumruy">
                                        {{ todayFormattedDate }}
                                    </td>
                                </tr>

                                <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td class="px-4 py-3.5 font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                        <mat-icon svgIcon="mdi:calendar-today-outline" class="icon-size-4 text-slate-400"></mat-icon>
                                        <span>ថ្ងៃធ្វើការ</span>
                                    </td>
                                    <td class="px-4 py-3.5 font-medium text-slate-700 dark:text-slate-200">
                                        {{ todayDay }}
                                    </td>
                                </tr>

                                <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td class="px-4 py-3.5 font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                        <mat-icon svgIcon="mdi:clock-time-four-outline" class="icon-size-4 text-slate-400"></mat-icon>
                                        <span>ម៉ោងធ្វើការ</span>
                                    </td>
                                    <td class="px-4 py-3.5 font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                        <span class="font-kantumruy text-[13.5px]">{{ workHours }}</span>
                                        <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                                            សកម្ម
                                        </span>
                                    </td>
                                </tr>

                                <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td class="px-4 py-3.5 font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                        <mat-icon svgIcon="mdi:map-marker-radius-outline" class="icon-size-4 text-emerald-500"></mat-icon>
                                        <span>ទីតាំងបំពេញការងារ</span>
                                    </td>
                                    <td class="px-4 py-3.5 font-medium text-slate-700 dark:text-slate-200 text-[13px] flex items-center gap-1.5">
                                        <span class="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                                        <span>{{ locationName }}</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Right Column: Clean, Crisp QR Code Container -->
                    <div class="md:col-span-5 flex flex-col items-center text-center p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                        <h4 class="text-[15px] font-bold text-slate-800 dark:text-slate-100">
                            QR Code វត្តមាន
                        </h4>
                        <p class="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                            (បុគ្គលិក ឬសមាជិកស្កេន QR Code ដើម្បីកត់ត្រាវត្តមាន)
                        </p>

                        <!-- QR Code Frame -->
                        <div class="relative mt-3 p-3 bg-white rounded-2xl border border-slate-200/90 shadow-md flex items-center justify-center min-w-[210px] min-h-[210px]">
                            <img
                                *ngIf="qrCodeUrl(); else qrLoading"
                                [src]="qrCodeUrl()"
                                alt="Attendance QR Code"
                                class="w-[195px] h-[195px] object-contain rounded-xl select-none"
                            />
                            
                            <ng-template #qrLoading>
                                <div class="w-[195px] h-[195px] flex flex-col items-center justify-center gap-2 text-slate-400">
                                    <mat-icon svgIcon="heroicons_outline:arrow-path" class="icon-size-6 animate-spin text-emerald-600"></mat-icon>
                                    <span class="text-xs">កំពុងបង្កើត QR Code...</span>
                                </div>
                            </ng-template>

                            <!-- Expired Overlay -->
                            <div
                                *ngIf="isExpired()"
                                class="absolute inset-0 bg-white/95 rounded-2xl flex flex-col items-center justify-center gap-2 backdrop-blur-[2px]"
                            >
                                <mat-icon svgIcon="heroicons_outline:clock" class="icon-size-8 text-amber-500"></mat-icon>
                                <span class="text-xs font-semibold text-slate-800">QR Code ផុតកំណត់</span>
                                <button
                                    type="button"
                                    (click)="generateQrCode()"
                                    class="mt-1 px-3.5 py-1.5 rounded-xl text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                                >
                                    <mat-icon svgIcon="heroicons_outline:arrow-path" class="icon-size-4 !text-white"></mat-icon>
                                    <span>បង្កើតឡើងវិញ</span>
                                </button>
                            </div>
                        </div>

                        <!-- Countdown & Refresh controls -->
                        <div class="mt-3 flex items-center justify-between w-full px-2 text-[12px]">
                            <div class="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                                <mat-icon svgIcon="heroicons_outline:clock" class="icon-size-4 text-emerald-600"></mat-icon>
                                <span>ផុតកំណត់ក្នុង៖ <strong class="text-emerald-600 dark:text-emerald-400 font-kantumruy">{{ timeLeft() }}s</strong></span>
                            </div>

                            <button
                                type="button"
                                (click)="generateQrCode()"
                                class="text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 transition-colors cursor-pointer text-[12px] font-medium"
                                matTooltip="ធ្វើបច្ចុប្បន្នភាព QR Code"
                            >
                                <mat-icon svgIcon="heroicons_outline:arrow-path" class="icon-size-4"></mat-icon>
                                <span>ផ្លាស់ប្តូរថ្មី</span>
                            </button>
                        </div>


                    </div>

                </div>



            </div>

        </div>
    `,
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

    ngOnInit(): void {
        this.generateQrCode();
    }

    ngOnDestroy(): void {
        this.stopTimer();
    }

    async generateQrCode(): Promise<void> {
        this.stopTimer();
        this.isExpired.set(false);
        this.timeLeft.set(30);

        try {
            this.currentSessionToken = Math.random().toString(36).substring(2, 10);
            
            // Clean, compact scan URL so the QR code generates big and crisp
            const scanUrl = `${window.location.origin}/attendance/scan?token=${this.currentSessionToken}`;
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
