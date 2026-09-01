import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

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
    ],
    template: `
        <div class="relative bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-2xl overflow-hidden max-w-2xl w-full font-normal shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
            
            <!-- Dialog Header -->
            <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <mat-icon svgIcon="mdi:calendar-check" class="icon-size-6"></mat-icon>
                    </div>
                    <div>
                        <h2 class="text-lg sm:text-xl font-normal text-slate-900 dark:text-white leading-tight">
                            សម្រង់វត្តមាន និង ម៉ោងធ្វើការ
                        </h2>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            កំណត់ត្រាវត្តមានប្រចាំខែ សីហា ២០២៦
                        </p>
                    </div>
                </div>

                <button
                    mat-icon-button
                    (click)="close()"
                    class="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                >
                    <mat-icon svgIcon="mdi:close" class="icon-size-5"></mat-icon>
                </button>
            </div>

            <!-- Dialog Content (Scrollable) -->
            <div class="p-6 overflow-y-auto space-y-6 flex-1">

                <!-- 1. Check-In / Check-Out Hero Banner -->
                <div class="rounded-xl bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 text-white p-5 shadow-sm relative overflow-hidden">
                    <div class="absolute right-0 top-0 text-white/5 pointer-events-none -mr-6 -mt-6">
                        <mat-icon svgIcon="mdi:fingerprint" class="icon-size-36"></mat-icon>
                    </div>

                    <div class="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <span class="text-xs font-medium tracking-wider uppercase bg-white/20 px-2.5 py-0.5 rounded-full text-emerald-100">
                                វត្តមានថ្ងៃនេះ • {{ todayDate }}
                            </span>
                            <div class="flex items-center gap-4 mt-2.5">
                                <div>
                                    <p class="text-xs text-emerald-200">ម៉ោងចូល</p>
                                    <p class="text-lg font-medium text-white">០៧:៥៥ ព្រឹក</p>
                                </div>
                                <div class="h-8 w-px bg-white/20"></div>
                                <div>
                                    <p class="text-xs text-emerald-200">ម៉ោងចេញ</p>
                                    <p class="text-lg font-medium text-white">១៧:០៥ ល្ងាច</p>
                                </div>
                            </div>
                        </div>

                        <div class="flex items-center gap-2">
                            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-emerald-700 text-xs font-medium shadow-xs">
                                <mat-icon svgIcon="mdi:check-circle" class="icon-size-4 text-emerald-600"></mat-icon>
                                <span>វត្តមានទាន់ពេល</span>
                            </span>
                        </div>
                    </div>
                </div>

                <!-- 2. Monthly Summary KPI Cards -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                        <p class="text-xs text-slate-500 dark:text-slate-400">ថ្ងៃធ្វើការសរុប</p>
                        <p class="text-2xl font-normal text-slate-900 dark:text-white mt-1">២២ <span class="text-xs text-slate-400">ថ្ងៃ</span></p>
                    </div>
                    <div class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-emerald-50/40 dark:bg-emerald-950/20">
                        <p class="text-xs text-emerald-600 dark:text-emerald-400">វត្តមានពេញលេញ</p>
                        <p class="text-2xl font-normal text-emerald-600 dark:text-emerald-400 mt-1">២១ <span class="text-xs text-emerald-400">ថ្ងៃ</span></p>
                    </div>
                    <div class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-amber-50/40 dark:bg-amber-950/20">
                        <p class="text-xs text-amber-600 dark:text-amber-400">យឺត/ចេញមុន</p>
                        <p class="text-2xl font-normal text-amber-600 dark:text-amber-400 mt-1">១ <span class="text-xs text-amber-400">លើក</span></p>
                    </div>
                    <div class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-blue-50/40 dark:bg-blue-950/20">
                        <p class="text-xs text-blue-600 dark:text-blue-400">អត្រាវត្តមាន</p>
                        <p class="text-2xl font-normal text-blue-600 dark:text-blue-400 mt-1">៩៨.៥%</p>
                    </div>
                </div>

                <!-- 3. Timesheet Records Table -->
                <div class="space-y-2.5">
                    <div class="flex items-center justify-between">
                        <h3 class="text-sm font-normal text-slate-900 dark:text-white">កំណត់ត្រាវត្តមានចុងក្រោយ</h3>
                        <span class="text-xs text-slate-500">សរុប ៥ ថ្ងៃចុងក្រោយ</span>
                    </div>

                    <div class="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                        <table class="w-full text-left text-xs">
                            <thead class="bg-slate-50 dark:bg-slate-800/80 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th class="px-4 py-2.5 font-normal">កាលបរិច្ឆេទ</th>
                                    <th class="px-4 py-2.5 font-normal">ម៉ោងចូល</th>
                                    <th class="px-4 py-2.5 font-normal">ម៉ោងចេញ</th>
                                    <th class="px-4 py-2.5 font-normal">ម៉ោងសរុប</th>
                                    <th class="px-4 py-2.5 font-normal text-right">ស្ថានភាព</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                                <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
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
                                <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
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
                                <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                    <td class="px-4 py-3 font-medium text-slate-900 dark:text-white">៣០ សីហា ២០២៦</td>
                                    <td class="px-4 py-3 text-slate-700 dark:text-slate-300">០៨:០៨ ព្រឹក</td>
                                    <td class="px-4 py-3 text-slate-700 dark:text-slate-300">១៧:១៥ ល្ងាច</td>
                                    <td class="px-4 py-3 text-slate-700 dark:text-slate-300">៨ ម៉ោង ០៧ នាទី</td>
                                    <td class="px-4 py-3 text-right">
                                        <span class="px-2 py-0.5 rounded text-[11px] bg-amber-50 dark:bg-amber-950/40 text-amber-600 border border-amber-200 dark:border-amber-800/40">
                                            យឺត ៨ នាទី
                                        </span>
                                    </td>
                                </tr>
                                <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                    <td class="px-4 py-3 font-medium text-slate-900 dark:text-white">២៩ សីហា ២០២៦</td>
                                    <td class="px-4 py-3 text-slate-700 dark:text-slate-300">០៧:៤៨ ព្រឹក</td>
                                    <td class="px-4 py-3 text-slate-700 dark:text-slate-300">១៧:០០ ល្ងាច</td>
                                    <td class="px-4 py-3 text-slate-700 dark:text-slate-300">៨ ម៉ោង ១២ នាទី</td>
                                    <td class="px-4 py-3 text-right">
                                        <span class="px-2 py-0.5 rounded text-[11px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200 dark:border-emerald-800/40">
                                            ទាន់ពេល
                                        </span>
                                    </td>
                                </tr>
                                <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                    <td class="px-4 py-3 font-medium text-slate-900 dark:text-white">២៨ សីហា ២០២៦</td>
                                    <td class="px-4 py-3 text-slate-700 dark:text-slate-300">០៧:៥២ ព្រឹក</td>
                                    <td class="px-4 py-3 text-slate-700 dark:text-slate-300">១៧:០២ ល្ងាច</td>
                                    <td class="px-4 py-3 text-slate-700 dark:text-slate-300">៨ ម៉ោង ១០ នាទី</td>
                                    <td class="px-4 py-3 text-right">
                                        <span class="px-2 py-0.5 rounded text-[11px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200 dark:border-emerald-800/40">
                                            ទាន់ពេល
                                        </span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            <!-- Dialog Footer -->
            <div class="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40 text-xs">
                <span class="text-slate-500 dark:text-slate-400">ប្រព័ន្ធគ្រប់គ្រងវត្តមានស្វ័យប្រវត្ត WMS</span>
                <button
                    mat-flat-button
                    color="primary"
                    (click)="close()"
                    class="rounded-lg text-xs"
                >
                    បិទផ្ទាំង
                </button>
            </div>

        </div>
    `,
})
export class AttendanceDialogComponent {
    todayDate = new Intl.DateTimeFormat('km-KH', { dateStyle: 'full' }).format(new Date());

    constructor(
        public dialogRef: MatDialogRef<AttendanceDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: AttendanceDialogData,
    ) {}

    close(): void {
        this.dialogRef.close();
    }
}
