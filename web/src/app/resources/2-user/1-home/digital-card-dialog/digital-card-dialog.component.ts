import { CommonModule } from '@angular/common';
import { Component, Inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface DigitalCardDialogData {
    user: any;
    avatarUrl: string;
}

@Component({
    selector: 'app-digital-card-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
    ],
    template: `
        <div class="relative bg-slate-900 text-white rounded-2xl overflow-hidden p-6 sm:p-8 max-w-lg w-full font-normal shadow-2xl border border-slate-700">
            <!-- Close Button -->
            <button
                mat-icon-button
                (click)="close()"
                class="!absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer z-30"
            >
                <mat-icon svgIcon="mdi:close" class="icon-size-6"></mat-icon>
            </button>

            <!-- Dialog Header -->
            <div class="text-center mb-6">
                <span class="text-xs font-normal tracking-widest text-blue-400 uppercase bg-blue-950/60 border border-blue-800/60 px-3 py-1 rounded-full">
                    កាតសមាជិកផ្លូវការ
                </span>
                <h2 class="text-xl sm:text-2xl font-medium text-white mt-2.5">
                    កាតសម្គាល់សមាជិកឌីជីថល
                </h2>
                <p class="text-xs text-slate-400 mt-0.5">WMS Digital Membership Identity Card</p>
            </div>

            <!-- Tab Switcher (Front / Back) -->
            <div class="flex items-center justify-center gap-2 mb-6">
                <button
                    type="button"
                    (click)="activeTab.set('front')"
                    class="px-4 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border"
                    [ngClass]="activeTab() === 'front' ? 'bg-blue-600 border-blue-500 text-white shadow-md' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'"
                >
                    ផ្នែកខាងមុខ (Front)
                </button>
                <button
                    type="button"
                    (click)="activeTab.set('back')"
                    class="px-4 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border"
                    [ngClass]="activeTab() === 'back' ? 'bg-blue-600 border-blue-500 text-white shadow-md' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'"
                >
                    ផ្នែកខាងក្រោយ (Back)
                </button>
            </div>

            <!-- CARD PREVIEW CONTAINER -->
            <div class="relative w-full aspect-[1.65/1] rounded-2xl overflow-hidden shadow-2xl border transition-all duration-300">

                <!-- FRONT SIDE VIEW (Executive Dark Navy) -->
                <div *ngIf="activeTab() === 'front'" class="w-full h-full bg-gradient-to-br from-[#07152b] via-[#0d2247] to-[#122c59] p-6 flex flex-col justify-between relative border border-blue-900/60">
                    <!-- Background Watermark -->
                    <div class="absolute -right-8 -bottom-8 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
                    <div class="absolute right-6 top-6 text-blue-400/15">
                        <mat-icon svgIcon="mdi:hexagon-multiple-outline" class="icon-size-20"></mat-icon>
                    </div>
            
                    <!-- Top Row: Chip & Official Badge -->
                    <div class="flex items-center justify-between relative z-10">
                        <div class="flex items-center gap-2.5">
                            <div class="w-11 h-8.5 rounded-md bg-amber-400/90 border border-amber-300 shadow-sm flex items-center justify-center">
                                <div class="w-7 h-5.5 border border-amber-600/60 rounded-xs grid grid-cols-2 gap-0.5 p-0.5">
                                    <div class="border-r border-amber-600/60"></div>
                                    <div></div>
                                </div>
                            </div>
                            <mat-icon svgIcon="mdi:contactless-payment" class="icon-size-6 text-blue-300"></mat-icon>
                        </div>
                        <span class="text-xs px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 uppercase tracking-wider font-mono">
                            #PMS-2026
                        </span>
                    </div>

                    <!-- Center: Branding -->
                    <div class="text-center my-auto relative z-10">
                        <div class="w-12 h-12 mx-auto rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center mb-2 shadow-inner">
                            <mat-icon svgIcon="mdi:cube-scan" class="icon-size-7 text-blue-300"></mat-icon>
                        </div>
                        <h3 class="text-xl font-medium tracking-widest text-white uppercase">WMS | SYSTEM</h3>
                        <p class="text-xs text-blue-300/80 tracking-wider mt-0.5">DIGITAL MEMBERSHIP IDENTITY</p>
                    </div>

                    <!-- Bottom Pill Bar -->
                    <div class="relative z-10 flex items-center justify-center">
                        <div class="inline-flex items-center gap-2 bg-blue-600/40 border border-blue-400/30 rounded-full px-6 py-1.5 text-xs text-blue-100 shadow-sm">
                            <mat-icon svgIcon="mdi:web" class="icon-size-4 text-blue-300"></mat-icon>
                            <span class="tracking-wide">wms-system.gov.kh</span>
                        </div>
                    </div>
                </div>

                <!-- BACK SIDE VIEW (Two-Tone Curved Arc with QR & Details) -->
                <div *ngIf="activeTab() === 'back'" class="w-full h-full bg-gradient-to-r from-blue-700 to-blue-600 text-white flex flex-col sm:flex-row relative border border-blue-500/40">
                    <!-- Left White Curved Arc Section -->
                    <div class="bg-white text-slate-800 p-5 sm:w-5/12 flex flex-col items-center justify-center text-center sm:[clip-path:ellipse(115%_100%_at_0%_50%)] z-10">
                        <div class="w-16 h-16 rounded-full border-2 border-blue-600 p-0.5 bg-white shadow-sm overflow-hidden mb-2">
                            <img [src]="data.avatarUrl" alt="Avatar" class="w-full h-full object-cover rounded-full" />
                        </div>
                        <div class="text-[15px] font-medium text-slate-900 leading-tight">
                            {{ data.user?.kh_name || data.user?.name_kh || data.user?.en_name || data.user?.name_en || 'សមាជិក' }}
                        </div>
                        <div *ngIf="data.user?.en_name || data.user?.name_en" class="text-[11px] text-slate-500 uppercase tracking-wider mt-0.5">
                            {{ data.user?.en_name || data.user?.name_en }}
                        </div>
                        <div class="mt-2.5 p-1 bg-slate-100 rounded-lg border border-slate-200 inline-flex items-center justify-center">
                            <mat-icon svgIcon="mdi:qrcode-scan" class="icon-size-6 text-slate-700"></mat-icon>
                        </div>
                    </div>

                    <!-- Right Blue Information Section -->
                    <div class="p-5 sm:w-7/12 flex flex-col justify-between space-y-2.5 text-white sm:pl-2 z-10">
                        <div class="border-b border-white/20 pb-2 flex items-center justify-between">
                            <div>
                                <h3 class="text-base font-normal text-white uppercase tracking-wide">
                                    {{ data.user?.kh_name || data.user?.name_kh || data.user?.en_name || data.user?.name_en || 'សមាជិក' }}
                                </h3>
                                <p class="text-xs text-blue-200">{{ data.user?.role_name || 'សមាជិកប្រព័ន្ធ (Core Member)' }}</p>
                            </div>
                            <span class="text-[11px] px-2 py-0.5 rounded bg-white/20 text-white font-mono">
                                #ID-{{ data.user?.id || '2026' }}
                            </span>
                        </div>

                        <div class="space-y-1.5 text-xs text-blue-100 font-normal">
                            <div *ngIf="data.user?.organization_name" class="flex items-center gap-2">
                                <mat-icon svgIcon="mdi:domain" class="icon-size-4 text-amber-300"></mat-icon>
                                <span class="truncate">{{ data.user?.organization_name }}</span>
                            </div>
                            <div *ngIf="data.user?.email" class="flex items-center gap-2">
                                <mat-icon svgIcon="mdi:email" class="icon-size-4 text-amber-300"></mat-icon>
                                <span class="truncate">{{ data.user?.email }}</span>
                            </div>
                            <div *ngIf="data.user?.phone" class="flex items-center gap-2">
                                <mat-icon svgIcon="mdi:phone" class="icon-size-4 text-amber-300"></mat-icon>
                                <span>{{ data.user?.phone }}</span>
                            </div>
                        </div>

                        <div class="pt-1.5 border-t border-white/20 flex items-center justify-between text-[11px] text-blue-200">
                            <span class="flex items-center gap-1">
                                <mat-icon svgIcon="mdi:shield-check" class="icon-size-3.5 text-emerald-300"></mat-icon>
                                <span>សុពលភាព៖ សកម្ម</span>
                            </span>
                            <span>WMS SYSTEM</span>
                        </div>
                    </div>
                </div>

            </div>

            <!-- Actions Footer -->
            <div class="flex items-center justify-between mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400">
                <span class="flex items-center gap-1.5 text-emerald-400">
                    <mat-icon svgIcon="mdi:check-decagram" class="icon-size-4"></mat-icon>
                    <span>គណនីបានផ្ទៀងផ្ទាត់ជោគជ័យ</span>
                </span>
                <button
                    mat-flat-button
                    color="primary"
                    (click)="close()"
                    class="rounded-lg text-xs font-normal"
                >
                    បិទផ្ទាំង
                </button>
            </div>
        </div>
    `,
})
export class DigitalCardDialogComponent {
    activeTab = signal<'front' | 'back'>('front');

    constructor(
        public dialogRef: MatDialogRef<DigitalCardDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DigitalCardDialogData,
    ) {}

    close(): void {
        this.dialogRef.close();
    }
}
