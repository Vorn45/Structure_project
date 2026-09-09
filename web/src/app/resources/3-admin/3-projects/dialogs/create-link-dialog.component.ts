import { CommonModule } from '@angular/common';
import { Component, Inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SideDialogCloseButtonComponent } from 'app/shared/side-dialog-close-button/component';

export interface CreateLinkDialogData {
    taskCode?: string;
    projectName?: string;
}

@Component({
    selector: 'app-create-link-dialog',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        SideDialogCloseButtonComponent,
    ],
    template: `
        <div class="w-full h-full flex flex-col bg-white dark:bg-slate-900 font-kantumruy text-[16px] font-normal relative overflow-hidden"
            style="font-family: 'Kantumruy Pro', sans-serif;">

            <!-- Header -->
            <div mat-dialog-title
                class="w-full flex justify-center items-center min-h-14 max-h-14 h-14 border-b border-slate-200 dark:border-slate-800 m-0 !py-0 font-kantumruy bg-white dark:bg-slate-900 relative px-4 shrink-0">
                <span class="w-full text-center text-[20px] font-medium font-kantumruy text-slate-800 dark:text-slate-200">
                    បន្ថែមតំណភ្ជាប់ថ្មី
                </span>
            </div>

            <!-- Side Dialog Close Button -->
            <shared-side-dialog-close-button [isReturn]="false"></shared-side-dialog-close-button>

            <!-- Scrollable Content -->
            <mat-dialog-content class="w-full !m-0 !p-0 overflow-y-auto flex-1 bg-white dark:bg-slate-900 font-kantumruy text-[16px]">
                <div class="p-5 space-y-6 font-kantumruy">

                    <!-- Cover Banner -->
                    <div class="rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-[#0f284e] text-white p-5 shadow-sm relative overflow-hidden font-kantumruy">
                        <div class="absolute right-0 top-0 text-white/5 pointer-events-none -mr-6 -mt-6">
                            <mat-icon svgIcon="mdi:link-variant-plus" class="icon-size-40"></mat-icon>
                        </div>
                        <div class="relative z-10">
                            <span class="text-[13px] font-medium tracking-wider uppercase bg-white/20 px-3 py-1 rounded-full text-blue-100">
                                តំណភ្ជាប់ថ្មី (NEW LINK)
                            </span>
                            <h3 class="text-[20px] font-medium text-white mt-2.5 leading-tight">
                                បន្ថែមតំណភ្ជាប់ឯកសារ ឬប្រព័ន្ធ
                            </h3>
                            <p class="text-[14px] text-blue-200/90 mt-1.5 leading-normal">
                                ភ្ជាប់តំណ Figma, GitHub, ឯកសារ ឬគេហទំព័រខាងក្រៅសម្រាប់គម្រោង
                            </p>
                        </div>
                    </div>

                    <!-- Form Fields -->
                    <div class="space-y-5 text-[16px] font-kantumruy">

                        <!-- Link Title -->
                        <div>
                            <label class="block font-normal text-slate-800 dark:text-slate-200 mb-2 text-[16px]">
                                ចំណងជើងតំណភ្ជាប់ <span class="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                [ngModel]="linkTitle()"
                                (ngModelChange)="linkTitle.set($event)"
                                (keyup.enter)="submit()"
                                placeholder="ឧ. Figma Design System..."
                                class="w-full px-4 py-3 text-[16px] font-normal font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>

                        <!-- Link URL -->
                        <div>
                            <label class="block font-normal text-slate-800 dark:text-slate-200 mb-2 text-[16px]">
                                តំណភ្ជាប់ URL <span class="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                [ngModel]="linkUrl()"
                                (ngModelChange)="linkUrl.set($event)"
                                (keyup.enter)="submit()"
                                placeholder="https://figma.com/file/..."
                                class="w-full px-4 py-3 text-[16px] font-normal font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>

                        <!-- Type & Code Tag -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label class="block font-normal text-slate-800 dark:text-slate-200 mb-2 text-[16px]">
                                    ប្រភេទតំណ (Type)
                                </label>
                                <select
                                    [ngModel]="linkType()"
                                    (ngModelChange)="linkType.set($event)"
                                    class="w-full px-4 py-3 text-[16px] font-normal font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                >
                                    <option value="figma">🎨 Figma Design</option>
                                    <option value="github">🐙 GitHub Repository</option>
                                    <option value="doc">📄 Documentation</option>
                                    <option value="external">🌐 ផ្សេងៗ (External Link)</option>
                                </select>
                            </div>

                            <div>
                                <label class="block font-normal text-slate-800 dark:text-slate-200 mb-2 text-[16px]">
                                    កូដសម្គាល់ (Code Tag)
                                </label>
                                <input
                                    type="text"
                                    [ngModel]="linkTaskCode()"
                                    (ngModelChange)="linkTaskCode.set($event)"
                                    placeholder="#WMS-0001"
                                    class="w-full px-4 py-3 text-[16px] font-normal font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>
                        </div>

                    </div>

                </div>
            </mat-dialog-content>

            <!-- Bottom Sticky Action -->
            <div class="w-full flex items-center p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 font-kantumruy">
                <button
                    type="button"
                    (click)="submit()"
                    [disabled]="!linkTitle().trim()"
                    class="w-full h-11 px-4 rounded-xl font-medium font-kantumruy text-[16px] flex items-center justify-center gap-2 text-white bg-[#1c2b6b] hover:bg-[#152254] disabled:opacity-50 transition-all duration-200 active:scale-[0.98] cursor-pointer"
                >
                    <mat-icon svgIcon="mdi:plus" class="!w-5 !h-5 !text-white shrink-0"></mat-icon>
                    <span>រក្សាទុកតំណភ្ជាប់</span>
                </button>
            </div>

        </div>
    `,
})
export class CreateLinkDialogComponent {
    linkTitle = signal<string>('');
    linkUrl = signal<string>('');
    linkType = signal<'figma' | 'github' | 'doc' | 'external'>('figma');
    linkTaskCode = signal<string>('#WMS-CORE');

    constructor(
        private readonly _dialogRef: MatDialogRef<CreateLinkDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: CreateLinkDialogData,
    ) {
        if (data?.taskCode) {
            this.linkTaskCode.set(data.taskCode);
        }
    }

    submit(): void {
        const title = this.linkTitle().trim();
        let url = this.linkUrl().trim();
        if (!title) return;

        if (!url) {
            const type = this.linkType();
            if (type === 'figma') url = 'https://figma.com';
            else if (type === 'github') url = 'https://github.com';
            else if (type === 'doc') url = 'https://notion.so';
            else url = 'https://google.com';
        } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        this._dialogRef.close({
            title,
            url,
            type: this.linkType(),
            taskCode: this.linkTaskCode().trim() || '#WMS-CORE',
        });
    }

    cancel(): void {
        this._dialogRef.close(null);
    }
}
