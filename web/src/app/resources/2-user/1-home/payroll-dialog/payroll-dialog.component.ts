import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SideDialogCloseButtonComponent } from 'app/shared/side-dialog-close-button/component';

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
        SideDialogCloseButtonComponent,
    ],
    template: `
        <div class="w-full h-full flex flex-col bg-white dark:bg-slate-900 font-kantumruy text-[16px] font-normal relative overflow-hidden" style="font-family: 'Kantumruy Pro', sans-serif;">
            
            <!-- Header -->
            <div mat-dialog-title
                class="w-full flex justify-center items-center min-h-14 max-h-14 h-14 border-b border-slate-200 dark:border-slate-800 m-0 !py-0 font-kantumruy bg-white dark:bg-slate-900 relative px-4 shrink-0">
                <span class="w-full text-center text-[20px] font-medium font-kantumruy text-slate-800 dark:text-slate-200">
                    ប័ណ្ណបើកប្រាក់បៀវត្ស (Payslip)
                </span>
            </div>

            <!-- Standard Side Drawer Close Button -->
            <shared-side-dialog-close-button [isReturn]="false"></shared-side-dialog-close-button>

            <!-- Scrollable Body -->
            <mat-dialog-content class="w-full !m-0 !p-0 overflow-y-auto flex-1 bg-white dark:bg-slate-900 font-kantumruy text-[16px]">
                <div class="p-5 space-y-6 font-kantumruy">

                    <!-- 1. Net Salary Highlight Banner -->
                    <div class="rounded-2xl bg-gradient-to-br from-[#0c2340] via-[#163a69] to-[#1e4d8a] text-white p-5 shadow-sm relative overflow-hidden font-kantumruy">
                        <div class="absolute right-0 top-0 text-white/5 pointer-events-none -mr-6 -mt-6">
                            <mat-icon svgIcon="mdi:bank-outline" class="icon-size-40"></mat-icon>
                        </div>

                        <div class="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <span class="text-[13px] font-medium tracking-wider text-blue-200 uppercase bg-blue-500/20 border border-blue-400/30 px-3 py-1 rounded-full">
                                    ប្រាក់បៀវត្សសុទ្ធទទួលបាន (Net Salary)
                                </span>
                                <div class="mt-3">
                                    <h3 class="text-[32px] sm:text-[36px] font-semibold tracking-tight text-white leading-none">
                                        $1,250.00
                                    </h3>
                                    <p class="text-[13px] text-blue-200/90 mt-1.5">
                                        ប្រហែល ៥,១២៥,០០០ រៀល (អត្រាប្តូរប្រាក់ ៤,១០០)
                                    </p>
                                </div>
                            </div>

                            <div class="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/20 text-center self-start sm:self-center">
                                <span class="text-[11px] text-blue-200 uppercase block">កាលបរិច្ឆេទបើក</span>
                                <span class="text-[14px] font-medium text-white">២៥ សីហា ២០២៦</span>
                            </div>
                        </div>
                    </div>

                    <!-- 2. Employee Info Brief -->
                    <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 grid grid-cols-2 gap-3 text-[14px]">
                        <div>
                            <span class="text-slate-400 block text-[12px]">ឈ្មោះបុគ្គលិក</span>
                            <span class="font-medium text-slate-800 dark:text-white">{{ data?.user?.kh_name || 'ចេង ច័ន្ទបញ្ញា' }}</span>
                        </div>
                        <div>
                            <span class="text-slate-400 block text-[12px]">អត្តលេខ / គណនី</span>
                            <span class="font-medium text-slate-800 dark:text-white">EMP-2026-0089</span>
                        </div>
                        <div>
                            <span class="text-slate-400 block text-[12px]">ផ្នែក / តួនាទី</span>
                            <span class="font-medium text-slate-800 dark:text-white">IT Development</span>
                        </div>
                        <div>
                            <span class="text-slate-400 block text-[12px]">ធនាគារទូទាត់</span>
                            <span class="font-medium text-slate-800 dark:text-white">ABA Bank (••• 8892)</span>
                        </div>
                    </div>

                    <!-- 3. Breakdown Cards -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <!-- Earnings -->
                        <div class="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 bg-white dark:bg-slate-800/60">
                            <div class="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                                <mat-icon svgIcon="mdi:plus-circle-outline" class="icon-size-4.5"></mat-icon>
                                <span class="text-[15px] font-medium">ប្រាក់ចំណូលសរុប (Earnings)</span>
                            </div>
                            <div class="space-y-2 text-[14px]">
                                <div class="flex justify-between">
                                    <span class="text-slate-500">ប្រាក់ខែមូលដ្ឋាន (Basic)</span>
                                    <span class="font-medium text-slate-900 dark:text-white">$1,100.00</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-slate-500">ប្រាក់លើកទឹកចិត្ត (Incentive)</span>
                                    <span class="font-medium text-slate-900 dark:text-white">$100.00</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-slate-500">ប្រាក់ឧបត្ថម្ភ (Allowance)</span>
                                    <span class="font-medium text-slate-900 dark:text-white">$100.00</span>
                                </div>
                                <div class="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between font-medium text-emerald-600 dark:text-emerald-400 mt-auto">
                                    <span>ចំណូលសរុប</span>
                                    <span>$1,300.00</span>
                                </div>
                            </div>
                        </div>

                        <!-- Deductions -->
                        <div class="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 bg-white dark:bg-slate-800/60">
                            <div class="flex items-center gap-2 text-rose-600 dark:text-rose-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                                <mat-icon svgIcon="mdi:minus-circle-outline" class="icon-size-4.5"></mat-icon>
                                <span class="text-[15px] font-medium">ការកាត់កងសរុប (Deductions)</span>
                            </div>
                            <div class="space-y-2 text-[14px]">
                                <div class="flex justify-between">
                                    <span class="text-slate-500">ពន្ធលើប្រាក់បៀវត្ស (Tax)</span>
                                    <span class="font-medium text-slate-900 dark:text-white">-$30.00</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-slate-500">វិភាគទាន ប.ស.ស (NSSF)</span>
                                    <span class="font-medium text-slate-900 dark:text-white">-$20.00</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-slate-500">ការកាត់កងផ្សេងៗ</span>
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
            </mat-dialog-content>

            <!-- Bottom Sticky Action -->
            <div class="w-full flex items-center p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 font-kantumruy">
                <button
                    type="button"
                    (click)="close()"
                    class="w-full h-11 px-4 rounded-xl font-medium font-kantumruy text-[16px] flex items-center justify-center gap-2 text-white bg-[#1c2b6b] hover:bg-[#152254] transition-all duration-200 active:scale-[0.98] cursor-pointer"
                >
                    <mat-icon svgIcon="mdi:download" class="!w-5 !h-5 !text-white shrink-0"></mat-icon>
                    <span>ទាញយកប័ណ្ណបៀវត្ស (PDF)</span>
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
