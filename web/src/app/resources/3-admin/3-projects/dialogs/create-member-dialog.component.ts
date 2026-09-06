import { CommonModule } from '@angular/common';
import { Component, Inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SideDialogCloseButtonComponent } from 'app/shared/side-dialog-close-button/component';

export interface CreateMemberDialogData {
    projectName?: string;
}

@Component({
    selector: 'app-create-member-dialog',
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
                    បន្ថែមសមាជិកថ្មី
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
                            <mat-icon svgIcon="mdi:account-plus-outline" class="icon-size-40"></mat-icon>
                        </div>
                        <div class="relative z-10">
                            <span class="text-[13px] font-medium tracking-wider uppercase bg-white/20 px-3 py-1 rounded-full text-blue-100">
                                សមាជិកថ្មី (NEW MEMBER)
                            </span>
                            <h3 class="text-[20px] font-medium text-white mt-2.5 leading-tight">
                                បន្ថែមសមាជិកក្នុងក្រុមការងារ
                            </h3>
                            <p class="text-[14px] text-blue-200/90 mt-1.5 leading-normal">
                                កំណត់តួនាទី ភារកិច្ច និងព័ត៌មានទំនាក់ទំនងរបស់សមាជិកក្នុងគម្រោង
                            </p>
                        </div>
                    </div>

                    <!-- Form Inputs -->
                    <div class="space-y-5 text-[16px] font-kantumruy">

                        <!-- Member Name -->
                        <div>
                            <label class="block font-normal text-slate-800 dark:text-slate-200 mb-2 text-[16px]">
                                ឈ្មោះសមាជិក <span class="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                [ngModel]="memberName()"
                                (ngModelChange)="memberName.set($event)"
                                (keyup.enter)="submit()"
                                placeholder="ឧ. ឡេង សុខជាយ..."
                                class="w-full px-4 py-3 text-[16px] font-normal font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>

                        <!-- Role -->
                        <div>
                            <label class="block font-normal text-slate-800 dark:text-slate-200 mb-2 text-[16px]">
                                តួនាទី (Role) <span class="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                [ngModel]="memberRole()"
                                (ngModelChange)="memberRole.set($event)"
                                (keyup.enter)="submit()"
                                placeholder="ឧ. Frontend Lead, UI Designer..."
                                class="w-full px-4 py-3 text-[16px] font-normal font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>

                        <!-- Email -->
                        <div>
                            <label class="block font-normal text-slate-800 dark:text-slate-200 mb-2 text-[16px]">
                                អ៊ីមែល (Email)
                            </label>
                            <input
                                type="email"
                                [ngModel]="memberEmail()"
                                (ngModelChange)="memberEmail.set($event)"
                                (keyup.enter)="submit()"
                                placeholder="member@wfm.gov.kh"
                                class="w-full px-4 py-3 text-[16px] font-normal font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>

                    </div>

                </div>
            </mat-dialog-content>

            <!-- Bottom Sticky Action -->
            <div class="w-full flex items-center p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 font-kantumruy">
                <button
                    type="button"
                    (click)="submit()"
                    [disabled]="!memberName().trim()"
                    class="w-full h-11 px-4 rounded-xl font-medium font-kantumruy text-[16px] flex items-center justify-center gap-2 text-white bg-[#1c2b6b] hover:bg-[#152254] disabled:opacity-50 transition-all duration-200 active:scale-[0.98] cursor-pointer"
                >
                    <mat-icon svgIcon="mdi:plus" class="!w-5 !h-5 !text-white shrink-0"></mat-icon>
                    <span>បន្ថែមសមាជិក</span>
                </button>
            </div>

        </div>
    `,
})
export class CreateMemberDialogComponent {
    memberName = signal<string>('');
    memberRole = signal<string>('Frontend Developer');
    memberEmail = signal<string>('');

    constructor(
        private readonly _dialogRef: MatDialogRef<CreateMemberDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: CreateMemberDialogData,
    ) {}

    submit(): void {
        const name = this.memberName().trim();
        if (!name) return;
        this._dialogRef.close({
            name,
            role: this.memberRole().trim() || 'Frontend Developer',
            email: this.memberEmail().trim() || `${name.toLowerCase().replace(/\s+/g, '')}@wfm.gov.kh`,
        });
    }

    cancel(): void {
        this._dialogRef.close(null);
    }
}
