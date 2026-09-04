import { CommonModule } from '@angular/common';
import { Component, Inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SideDialogCloseButtonComponent } from 'app/shared/side-dialog-close-button/component';
import { UserHomeService } from '../home.service';

export interface AttendanceDialogData {
    user?: any;
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
        <div class="w-full h-full flex flex-col bg-white dark:bg-slate-900 font-kantumruy text-[16px] font-normal relative overflow-hidden" style="font-family: 'Kantumruy Pro', sans-serif;">
            
            <!-- Header -->
            <div mat-dialog-title
                class="w-full flex justify-center items-center min-h-14 max-h-14 h-14 border-b border-slate-200 dark:border-slate-800 m-0 !py-0 font-kantumruy bg-white dark:bg-slate-900 relative px-4 shrink-0">
                <span class="w-full text-center text-[20px] font-medium font-kantumruy text-slate-800 dark:text-slate-200">
                    សម្រង់វត្តមាន និង ម៉ោងធ្វើការ
                </span>
            </div>

            <!-- Standard Side Drawer Close Button -->
            <shared-side-dialog-close-button [isReturn]="false"></shared-side-dialog-close-button>

            <!-- Scrollable Body -->
            <mat-dialog-content class="w-full !m-0 !p-0 overflow-y-auto flex-1 bg-white dark:bg-slate-900 font-kantumruy text-[16px]">
                <div class="p-5 space-y-6 font-kantumruy">

                    <!-- 1. Check-In / Check-Out Hero Banner -->
                    <div class="rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 text-white p-5 shadow-sm relative overflow-hidden font-kantumruy">
                        <div class="absolute right-0 top-0 text-white/5 pointer-events-none -mr-6 -mt-6">
                            <mat-icon svgIcon="mdi:fingerprint" class="icon-size-40"></mat-icon>
                        </div>

                        <div class="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <span class="text-[13px] font-medium tracking-wider uppercase bg-white/20 px-3 py-1 rounded-full text-emerald-100">
                                    វត្តមានថ្ងៃនេះ • {{ todayDate }}
                                </span>
                                <div class="mt-3 flex items-baseline gap-6">
                                    <div>
                                        <p class="text-[12px] text-emerald-200">ម៉ោងចូល</p>
                                        <p class="text-[22px] font-semibold text-white mt-0.5">០៧:៥៥ ព្រឹក</p>
                                    </div>
                                    <div class="h-8 w-px bg-white/20"></div>
                                    <div>
                                        <p class="text-[12px] text-emerald-200">ម៉ោងចេញ</p>
                                        <p class="text-[22px] font-semibold text-white mt-0.5">១៧:០៥ ល្ងាច</p>
                                    </div>
                                </div>
                            </div>

                            <div class="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/20 self-start sm:self-center">
                                <mat-icon svgIcon="mdi:check-circle" class="icon-size-5 text-emerald-300"></mat-icon>
                                <span class="text-[14px] font-medium text-white">វត្តមានទាន់ពេល</span>
                            </div>
                        </div>
                    </div>

                    <!-- 2. Monthly Summary Stat Cards -->
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 shadow-2xs">
                            <p class="text-[13px] text-slate-500 dark:text-slate-400 font-medium">ថ្ងៃធ្វើការសរុប</p>
                            <p class="text-[22px] font-medium text-slate-900 dark:text-white mt-1">២២ <span class="text-[13px] font-normal text-slate-400">ថ្ងៃ</span></p>
                        </div>
                        <div class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 shadow-2xs">
                            <p class="text-[13px] text-emerald-600 dark:text-emerald-400 font-medium">វត្តមានពេញលេញ</p>
                            <p class="text-[22px] font-medium text-emerald-600 dark:text-emerald-400 mt-1">២១ <span class="text-[13px] font-normal text-emerald-500/70">ថ្ងៃ</span></p>
                        </div>
                        <div class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 shadow-2xs">
                            <p class="text-[13px] text-amber-600 dark:text-amber-400 font-medium">យឺត/ចេញមុន</p>
                            <p class="text-[22px] font-medium text-amber-600 dark:text-amber-400 mt-1">១ <span class="text-[13px] font-normal text-amber-500/70">លើក</span></p>
                        </div>
                        <div class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 shadow-2xs">
                            <p class="text-[13px] text-blue-600 dark:text-blue-400 font-medium">អត្រាវត្តមាន</p>
                            <p class="text-[22px] font-medium text-blue-600 dark:text-blue-400 mt-1">៩៨.៥%</p>
                        </div>
                    </div>

                    <!-- 3. Recent Attendance History Table -->
                    <div class="space-y-3 font-kantumruy">
                        <div class="flex items-center justify-between">
                            <h3 class="text-[16px] font-medium text-slate-800 dark:text-white">
                                កំណត់ត្រាវត្តមានចុងក្រោយ
                            </h3>
                            <span class="text-[13px] text-slate-500 dark:text-slate-400">
                                សរុប ៥ ថ្ងៃចុងក្រោយ
                            </span>
                        </div>

                        <div class="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                            <table class="w-full text-left text-[14px]">
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
                                    <tr class="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                                        <td class="px-4 py-3 font-medium text-slate-900 dark:text-white">០១ កញ្ញា ២០២៦ (ថ្ងៃនេះ)</td>
                                        <td class="px-4 py-3 text-slate-700 dark:text-slate-300">០៧:៥៥ ព្រឹក</td>
                                        <td class="px-4 py-3 text-slate-700 dark:text-slate-300">១៧:០៥ ល្ងាច</td>
                                        <td class="px-4 py-3 text-slate-700 dark:text-slate-300">៨ ម៉ោង ១០ នាទី</td>
                                        <td class="px-4 py-3 text-right">
                                            <span class="px-2 py-0.5 rounded text-[11px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200 dark:border-emerald-800/40">
                                                ទាន់ពេល
                                            </span>
                                        </td>
                                    </tr>
                                    <tr class="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                                        <td class="px-4 py-3 font-medium text-slate-900 dark:text-white">៣១ សីហា ២០២៦</td>
                                        <td class="px-4 py-3 text-slate-700 dark:text-slate-300">០៧:៥០ ព្រឹក</td>
                                        <td class="px-4 py-3 text-slate-700 dark:text-slate-300">១៧:០០ ល្ងាច</td>
                                        <td class="px-4 py-3 text-slate-700 dark:text-slate-300">៨ ម៉ោង ១០ នាទី</td>
                                        <td class="px-4 py-3 text-right">
                                            <span class="px-2 py-0.5 rounded text-[11px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200 dark:border-emerald-800/40">
                                                ទាន់ពេល
                                            </span>
                                        </td>
                                    </tr>
                                    <tr class="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                                        <td class="px-4 py-3 font-medium text-slate-900 dark:text-white">៣០ សីហា ២០២៦</td>
                                        <td class="px-4 py-3 text-slate-700 dark:text-slate-300">០៨:០៤ ព្រឹក</td>
                                        <td class="px-4 py-3 text-slate-700 dark:text-slate-300">១៧:១៨ ល្ងាច</td>
                                        <td class="px-4 py-3 text-slate-700 dark:text-slate-300">៨ ម៉ោង ០៧ នាទី</td>
                                        <td class="px-4 py-3 text-right">
                                            <span class="px-2 py-0.5 rounded text-[11px] bg-amber-50 dark:bg-amber-950/40 text-amber-600 border border-amber-200 dark:border-amber-800/40">
                                                យឺត ៤ នាទី
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </mat-dialog-content>

            <!-- Bottom Sticky Action -->
            <div class="w-full flex items-center p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 font-kantumruy">
                <button
                    type="button"
                    (click)="close()"
                    class="w-full h-11 px-4 rounded-xl font-medium font-kantumruy text-[16px] flex items-center justify-center gap-2 text-white bg-[#1c2b6b] hover:bg-[#152254] transition-all duration-200 active:scale-[0.98] cursor-pointer"
                >
                    <mat-icon svgIcon="mdi:calendar-check" class="!w-5 !h-5 !text-white shrink-0"></mat-icon>
                    <span>មើលរបាយការណ៍វត្តមានពេញលេញ</span>
                </button>
            </div>

        </div>
    `,
})
export class AttendanceDialogComponent {
    todayDate = new Intl.DateTimeFormat('km-KH', { dateStyle: 'full' }).format(new Date());
    attendance = signal<any>(null);

    constructor(
        public dialogRef: MatDialogRef<AttendanceDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: AttendanceDialogData,
        private readonly _homeService: UserHomeService,
    ) {
        this._homeService.getAttendance().subscribe({
            next: (res) => {
                if (res?.data) {
                    this.attendance.set(res.data);
                }
            },
            error: (err) => console.error('Failed to load live attendance', err),
        });
    }

    close(): void {
        this.dialogRef.close();
    }
}
