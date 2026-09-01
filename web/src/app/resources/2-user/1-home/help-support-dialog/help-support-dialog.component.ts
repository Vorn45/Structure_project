import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SideDialogCloseButtonComponent } from 'app/shared/side-dialog-close-button/component';

@Component({
    selector: 'app-help-support-dialog',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        MatDividerModule,
        SideDialogCloseButtonComponent,
    ],
    template: `
        <div class="w-full h-full flex flex-col bg-white dark:bg-slate-900 font-kantumruy text-[16px] font-normal relative overflow-hidden" style="font-family: 'Kantumruy Pro', sans-serif;">
            
            <!-- Header -->
            <div mat-dialog-title
                class="w-full flex justify-center items-center min-h-14 max-h-14 h-14 border-b border-slate-200 dark:border-slate-800 m-0 !py-0 font-kantumruy bg-white dark:bg-slate-900 relative px-4 shrink-0">
                <span class="w-full text-center text-[20px] font-medium font-kantumruy text-slate-800 dark:text-slate-200">
                    មជ្ឈមណ្ឌលជំនួយ ឬ រាយការណ៍បញ្ហា
                </span>
            </div>

            <!-- Standard Side Drawer Close Button -->
            <shared-side-dialog-close-button [isReturn]="false"></shared-side-dialog-close-button>

            <!-- Scrollable Body -->
            <mat-dialog-content class="w-full !m-0 !p-0 overflow-y-auto flex-1 bg-white dark:bg-slate-900 font-kantumruy text-[16px]">
                
                <!-- Success Message -->
                <div *ngIf="submitted()" class="m-5 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center justify-between text-[15px] font-kantumruy">
                    <div class="flex items-center gap-2.5">
                        <mat-icon svgIcon="mdi:check-circle" class="icon-size-5 text-emerald-600 dark:text-emerald-400"></mat-icon>
                        <span>សំណើរបស់អ្នកត្រូវបានបញ្ជូនដោយជោគជ័យ! ក្រុមការងារនឹងឆ្លើយតបឆាប់ៗ។</span>
                    </div>
                </div>

                <div class="p-5 space-y-6 font-kantumruy">
                    
                    <!-- Cover Banner -->
                    <div class="rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-slate-900 text-white p-5 shadow-sm relative overflow-hidden font-kantumruy">
                        <div class="absolute right-0 top-0 text-white/5 pointer-events-none -mr-6 -mt-6">
                            <mat-icon svgIcon="mdi:help-circle-outline" class="icon-size-40"></mat-icon>
                        </div>
                        <div class="relative z-10">
                            <span class="text-[13px] font-medium tracking-wider uppercase bg-white/20 px-3 py-1 rounded-full text-amber-100">
                                ផ្នែកបម្រើអតិថិជន និង ជំនួយបច្ចេកទេស
                            </span>
                            <h3 class="text-[20px] font-medium text-white mt-2.5 leading-tight">
                                តើអ្នកត្រូវការជំនួយលើផ្នែកអ្វីដែរ?
                            </h3>
                            <p class="text-[14px] text-amber-100/90 mt-1.5 leading-normal">
                                យើងខ្ញុំរីករាយក្នុងការជួយដោះស្រាយរាល់ចម្ងល់ ឬ បញ្ហាបច្ចេកទេសក្នុងប្រព័ន្ធ
                            </p>
                        </div>
                    </div>

                    <!-- Fast Contact Channels -->
                    <div class="grid grid-cols-2 gap-3 font-kantumruy">
                        <a href="https://t.me/wmssupport" target="_blank"
                            class="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 hover:border-blue-400 transition-all flex items-center gap-3">
                            <div class="w-9 h-9 rounded-lg bg-blue-500 text-white flex items-center justify-center shrink-0">
                                <mat-icon svgIcon="mdi:send" class="icon-size-5"></mat-icon>
                            </div>
                            <div class="min-w-0">
                                <p class="text-[15px] font-medium text-slate-800 dark:text-white truncate">Telegram ជំនួយ</p>
                                <p class="text-[12px] text-slate-500 dark:text-slate-400">&#64;wmssupport</p>
                            </div>
                        </a>

                        <div class="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center gap-3">
                            <div class="w-9 h-9 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0">
                                <mat-icon svgIcon="mdi:phone" class="icon-size-5"></mat-icon>
                            </div>
                            <div class="min-w-0">
                                <p class="text-[15px] font-medium text-slate-800 dark:text-white truncate">ទូរស័ព្ទបន្ទាន់</p>
                                <p class="text-[12px] text-slate-500 dark:text-slate-400">087 600 064</p>
                            </div>
                        </div>
                    </div>

                    <!-- Report Issue Form -->
                    <div class="space-y-4 text-[16px] font-kantumruy">
                        <h4 class="text-[16px] font-medium text-slate-800 dark:text-white">
                            ផ្ញើសំណើ ឬ រាយការណ៍បញ្ហាបច្ចេកទេស
                        </h4>

                        <!-- Subject -->
                        <div>
                            <label class="block font-normal text-slate-800 dark:text-slate-200 mb-1.5 text-[16px]">
                                ប្រធានបទ <span class="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                [(ngModel)]="issueTitle"
                                placeholder="ឧ. បញ្ហាមិនអាចកត់ត្រាវត្តមានតាម QR Code..."
                                class="w-full px-4 py-2.5 text-[15px] font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                            />
                        </div>

                        <!-- Category -->
                        <div>
                            <label class="block font-normal text-slate-800 dark:text-slate-200 mb-1.5 text-[16px]">
                                ប្រភេទបញ្ហា
                            </label>
                            <select
                                [(ngModel)]="category"
                                class="w-full px-3.5 py-2.5 text-[15px] font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                            >
                                <option value="attendance">បញ្ហាវត្តមាន និង ម៉ោងធ្វើការ</option>
                                <option value="payroll">បញ្ហាប័ណ្ណបៀវត្ស</option>
                                <option value="project">បញ្ហាគ្រប់គ្រងគម្រោង</option>
                                <option value="account">បញ្ហាគណនី និង ការចូលប្រើប្រាស់</option>
                                <option value="other">ផ្សេងៗ</option>
                            </select>
                        </div>

                        <!-- Message -->
                        <div>
                            <label class="block font-normal text-slate-800 dark:text-slate-200 mb-1.5 text-[16px]">
                                ព័ត៌មានលម្អិតនៃបញ្ហា
                            </label>
                            <textarea
                                rows="3"
                                [(ngModel)]="message"
                                placeholder="រៀបរាប់អំពីបញ្ហាដែលអ្នកបានជួបប្រទះ..."
                                class="w-full p-3 text-[15px] font-normal font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                            ></textarea>
                        </div>

                    </div>

                </div>

            </mat-dialog-content>

            <!-- Bottom Sticky Action -->
            <div class="w-full flex items-center p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 font-kantumruy">
                <button
                    type="button"
                    (click)="submitHelp()"
                    [disabled]="!issueTitle.trim()"
                    class="w-full h-11 px-4 rounded-xl font-medium font-kantumruy text-[16px] flex items-center justify-center gap-2 text-white bg-[#1c2b6b] hover:bg-[#152254] disabled:opacity-50 transition-all duration-200 active:scale-[0.98] cursor-pointer"
                >
                    <mat-icon svgIcon="mdi:send" class="!w-5 !h-5 !text-white shrink-0"></mat-icon>
                    <span>ផ្ញើសំណើជំនួយ</span>
                </button>
            </div>

        </div>
    `,
})
export class HelpSupportDialogComponent implements OnInit {
    issueTitle: string = '';
    category: string = 'attendance';
    message: string = '';
    submitted = signal<boolean>(false);

    constructor(
        public dialogRef: MatDialogRef<HelpSupportDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
    ) {}

    ngOnInit(): void {}

    submitHelp(): void {
        if (!this.issueTitle.trim()) return;
        this.submitted.set(true);
        setTimeout(() => {
            this.dialogRef.close();
        }, 2000);
    }
}
