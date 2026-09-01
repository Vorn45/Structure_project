import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface PayrollDialogData {
    user?: any;
}

@Component({
    selector: 'app-payroll-dialog',
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
                    <div class="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <mat-icon svgIcon="mdi:cash-multiple" class="icon-size-6"></mat-icon>
                    </div>
                    <div>
                        <h2 class="text-lg sm:text-xl font-normal text-slate-900 dark:text-white leading-tight">
                            ប័ណ្ណបើកប្រាក់បៀវត្ស (Payslip)
                        </h2>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            ប្រចាំខែ សីហា ឆ្នាំ ២០២៦
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

                <!-- 1. Net Salary Highlight Banner -->
                <div class="rounded-xl bg-gradient-to-br from-[#0c2340] via-[#163a69] to-[#1e4d8a] text-white p-6 shadow-md relative overflow-hidden">
                    <div class="absolute right-0 top-0 text-white/5 pointer-events-none -mr-6 -mt-6">
                        <mat-icon svgIcon="mdi:bank-outline" class="icon-size-40"></mat-icon>
                    </div>

                    <div class="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <span class="text-xs font-normal tracking-wider text-blue-200 uppercase bg-blue-500/20 border border-blue-400/30 px-3 py-1 rounded-full">
                                ប្រាក់បៀវត្សសុទ្ធទទួលបាន (Net Salary)
                            </span>
                            <div class="mt-3">
                                <h3 class="text-3xl sm:text-4xl font-normal tracking-tight text-white">
                                    $1,250.00
                                </h3>
                                <p class="text-xs text-blue-200/90 mt-1">
                                    ប្រហែល ៥,១២៥,០០០ រៀល (អត្រាប្តូរប្រាក់ ៤,១០០)
                                </p>
                            </div>
                        </div>

                        <div class="sm:text-right">
                            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-medium">
                                <mat-icon svgIcon="mdi:check-decagram" class="icon-size-4 text-emerald-400"></mat-icon>
                                <span>បានបើកប្រាក់បៀវត្ស</span>
                            </span>
                            <p class="text-[11px] text-blue-200/80 mt-1.5">កាលបរិច្ឆេទបើក៖ ៣១ សីហា ២០២៦</p>
                        </div>
                    </div>
                </div>

                <!-- 2. Member Info Summary -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs">
                    <div>
                        <span class="text-slate-400">ឈ្មោះសមាជិក</span>
                        <p class="font-medium text-slate-900 dark:text-white text-sm mt-0.5">
                            {{ data?.user?.kh_name || data?.user?.name_kh || 'ចេង ច័ន្ទបញ្ញា' }}
                        </p>
                    </div>
                    <div>
                        <span class="text-slate-400">អត្តលេខមន្ត្រី</span>
                        <p class="font-medium text-slate-900 dark:text-white text-sm mt-0.5">#PMS-2026</p>
                    </div>
                    <div>
                        <span class="text-slate-400">មុខតំណែង</span>
                        <p class="font-medium text-slate-900 dark:text-white text-sm mt-0.5">មន្ត្រីប្រតិបត្តិប្រព័ន្ធ</p>
                    </div>
                    <div>
                        <span class="text-slate-400">គណនីធនាគារ</span>
                        <p class="font-medium text-slate-900 dark:text-white text-sm mt-0.5">ABA (*** 0064)</p>
                    </div>
                </div>

                <!-- 3. Earnings & Deductions Breakdown -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    <!-- Earnings (ប្រាក់ចំណូល) -->
                    <div class="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 bg-white dark:bg-slate-900">
                        <div class="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                            <mat-icon svgIcon="mdi:plus-circle-outline" class="icon-size-4"></mat-icon>
                            <span class="text-sm font-medium">ប្រាក់ចំណូលសរុប (Earnings)</span>
                        </div>
                        <div class="space-y-2 text-xs">
                            <div class="flex justify-between">
                                <span class="text-slate-500">ប្រាក់បៀវត្សគោល (Basic)</span>
                                <span class="font-medium text-slate-900 dark:text-white">$1,000.00</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-slate-500">ប្រាក់ឧបត្ថម្ភមុខតំណែង (Allowance)</span>
                                <span class="font-medium text-slate-900 dark:text-white">$150.00</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-slate-500">ប្រាក់លើកទឹកចិត្ត (Performance Bonus)</span>
                                <span class="font-medium text-slate-900 dark:text-white">$100.00</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-slate-500">ប្រាក់ម៉ោងបន្ថែម (Overtime)</span>
                                <span class="font-medium text-slate-900 dark:text-white">$50.00</span>
                            </div>
                            <div class="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between font-medium text-emerald-600 dark:text-emerald-400">
                                <span>ចំណូលសរុប</span>
                                <span>+$1,300.00</span>
                            </div>
                        </div>
                    </div>

                    <!-- Deductions (ការកាត់កង) -->
                    <div class="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 bg-white dark:bg-slate-900">
                        <div class="flex items-center gap-2 text-rose-600 dark:text-rose-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                            <mat-icon svgIcon="mdi:minus-circle-outline" class="icon-size-4"></mat-icon>
                            <span class="text-sm font-medium">ការកាត់កងសរុប (Deductions)</span>
                        </div>
                        <div class="space-y-2 text-xs">
                            <div class="flex justify-between">
                                <span class="text-slate-500">ពន្ធលើប្រាក់បៀវត្ស (Salary Tax)</span>
                                <span class="font-medium text-slate-900 dark:text-white">-$30.00</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-slate-500">វិភាគទាន ប.ស.ស (NSSF)</span>
                                <span class="font-medium text-slate-900 dark:text-white">-$20.00</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-slate-500">ការកាត់កងផ្សេងៗ (Other)</span>
                                <span class="font-medium text-slate-900 dark:text-white">$0.00</span>
                            </div>
                            <div class="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between font-medium text-rose-600 dark:text-rose-400 mt-auto">
                                <span>កាត់កងសរុប</span>
                                <span>-$50.00</span>
                            </div>
                        </div>
                    </div>

                </div>

            </div>

            <!-- Dialog Footer -->
            <div class="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40 text-xs">
                <span class="text-slate-500 dark:text-slate-400">ប្រព័ន្ធគ្រប់គ្រងប្រាក់បៀវត្សស្វ័យប្រវត្ត WMS</span>
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
export class PayrollDialogComponent {
    constructor(
        public dialogRef: MatDialogRef<PayrollDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: PayrollDialogData,
    ) {}

    close(): void {
        this.dialogRef.close();
    }
}
