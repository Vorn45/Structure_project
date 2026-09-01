import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface VerifiedMemberData {
    id: string | number;
    code: string;
    name_kh: string;
    name_en: string;
    gender: string;
    nationality: string;
    dob: string;
    pob: string;
    phone: string;
    email: string;
    organization_kh: string;
    organization_en: string;
    role_title: string;
    status: string;
    valid_until: string;
    avatar_url: string;
}

@Component({
    selector: 'app-member-verify',
    standalone: true,
    imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule],
    styles: [`
        :host {
            display: flex;
            width: 100%;
            min-height: 100vh;
            justify-content: center;
            align-items: flex-start;
            background-color: #f1f5f9;
        }
    `],
    template: `
        <div class="w-full min-h-screen bg-slate-100 flex justify-center py-0 sm:py-8 font-['Kantumruy_Pro',sans-serif]">
            <div class="w-full max-w-md bg-white shadow-xl overflow-hidden flex flex-col sm:rounded-2xl border border-slate-200/90">
                
                <!-- 1. OFFICIAL BLUE HEADER (Exact match with screenshot) -->
                <div class="bg-[#0b5c9e] text-white px-4 py-3 flex items-center justify-between shadow-md">
                    <!-- Left Emblem Logo -->
                    <div class="flex items-center gap-3">
                        <div class="w-11 h-11 rounded-full bg-white p-1 shadow-xs shrink-0 flex items-center justify-center overflow-hidden border border-white/20">
                            <img src="images/logo/nextask-logo.png" alt="Logo" class="w-full h-full object-contain"
                                (error)="onLogoError($event)" />
                        </div>
                        <div class="flex flex-col">
                            <h1 class="text-[14px] font-medium leading-tight tracking-wide text-white">
                                {{ member()?.organization_kh || 'ប្រព័ន្ធគ្រប់គ្រងការងារស្នូល' }}
                            </h1>
                            <span class="text-[10px] text-blue-100/90 font-normal tracking-wide mt-0.5">
                                {{ member()?.organization_en || 'CORE WORK MANAGEMENT SYSTEM' }}
                            </span>
                        </div>
                    </div>

                    <!-- Right Cambodia Flag -->
                    <div class="shrink-0 flex items-center">
                        <img src="images/flags/KH.svg" alt="Cambodia Flag" class="w-8 h-5.5 rounded-xs shadow-xs object-cover border border-white/40" />
                    </div>
                </div>

                <!-- 2. DOCUMENT TITLE & CODE -->
                <div class="text-center pt-6 pb-3 px-6">
                    <h2 class="text-[19px] sm:text-[21px] font-bold text-slate-900 leading-snug">
                        វិញ្ញាបនបត្រ
                    </h2>
                    <p class="text-[14px] font-medium text-slate-700 mt-0.5">
                        ប័ណ្ណសម្គាល់សមាជិកផ្លូវការ
                    </p>
                    <div class="inline-block mt-2.5 px-3 py-1 bg-slate-100/80 rounded-md border border-slate-200 text-[13px] font-mono font-medium text-slate-800 tracking-wider">
                        {{ member()?.code || 'CCN-087600064' }}
                    </div>
                </div>

                <!-- 3. DASHED DIVIDER -->
                <div class="border-t border-dashed border-slate-200 mx-6 mb-5"></div>

                <!-- 4. CENTER PORTRAIT PHOTO -->
                <div class="flex justify-center mb-6 px-6">
                    <div class="w-38 h-48 rounded-lg overflow-hidden border-2 border-slate-200 shadow-md bg-slate-50 relative p-1">
                        <img [src]="member()?.avatar_url || '/images/placeholder/panha-portrait.jpg'" 
                            alt="Member Portrait Photo" 
                            class="w-full h-full object-cover rounded-md"
                            (error)="onAvatarError($event)" />
                    </div>
                </div>

                <!-- 5. PERSONAL INFORMATION SECTION HEADER -->
                <div class="px-6 pb-3">
                    <h3 class="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
                        <span>ព័ត៌មានផ្ទាល់ខ្លួន</span>
                    </h3>
                </div>

                <!-- 6. INFORMATION ROWS (Exact styling matching screenshot) -->
                <div class="px-6 pb-6 space-y-4 text-[13.5px]">
                    
                    <!-- ឈ្មោះជាភាសាខ្មែរ -->
                    <div class="flex items-start gap-3.5">
                        <div class="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-500 mt-0.5">
                            <mat-icon svgIcon="heroicons_outline:user" class="icon-size-4.5"></mat-icon>
                        </div>
                        <div class="flex-1">
                            <div class="text-[11px] text-slate-400 font-normal leading-tight">ឈ្មោះជាភាសាខ្មែរ</div>
                            <div class="text-[14px] font-semibold text-slate-900 mt-0.5">{{ member()?.name_kh }}</div>
                        </div>
                    </div>

                    <!-- ឈ្មោះជាអក្សរឡាតាំង -->
                    <div class="flex items-start gap-3.5">
                        <div class="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-500 mt-0.5">
                            <mat-icon svgIcon="heroicons_outline:user" class="icon-size-4.5"></mat-icon>
                        </div>
                        <div class="flex-1">
                            <div class="text-[11px] text-slate-400 font-normal leading-tight">ឈ្មោះជាអក្សរឡាតាំង</div>
                            <div class="text-[14px] font-semibold text-slate-900 uppercase mt-0.5">{{ member()?.name_en }}</div>
                        </div>
                    </div>

                    <!-- ភេទ -->
                    <div class="flex items-start gap-3.5">
                        <div class="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-500 mt-0.5">
                            <mat-icon svgIcon="mdi:gender-male-female" class="icon-size-4.5"></mat-icon>
                        </div>
                        <div class="flex-1">
                            <div class="text-[11px] text-slate-400 font-normal leading-tight">ភេទ</div>
                            <div class="text-[14px] font-medium text-slate-900 mt-0.5">{{ member()?.gender }}</div>
                        </div>
                    </div>

                    <!-- សញ្ជាតិ -->
                    <div class="flex items-start gap-3.5">
                        <div class="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-500 mt-0.5">
                            <mat-icon svgIcon="heroicons_outline:flag" class="icon-size-4.5"></mat-icon>
                        </div>
                        <div class="flex-1">
                            <div class="text-[11px] text-slate-400 font-normal leading-tight">សញ្ជាតិ</div>
                            <div class="text-[14px] font-medium text-slate-900 mt-0.5">{{ member()?.nationality }}</div>
                        </div>
                    </div>

                    <!-- ថ្ងៃខែឆ្នាំកំណើត -->
                    <div class="flex items-start gap-3.5">
                        <div class="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-500 mt-0.5">
                            <mat-icon svgIcon="mdi:cake-variant-outline" class="icon-size-4.5"></mat-icon>
                        </div>
                        <div class="flex-1">
                            <div class="text-[11px] text-slate-400 font-normal leading-tight">ថ្ងៃខែឆ្នាំកំណើត</div>
                            <div class="text-[14px] font-medium text-slate-900 mt-0.5">{{ member()?.dob }}</div>
                        </div>
                    </div>

                    <!-- ទីកន្លែងកំណើត -->
                    <div class="flex items-start gap-3.5">
                        <div class="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-500 mt-0.5">
                            <mat-icon svgIcon="heroicons_outline:map-pin" class="icon-size-4.5"></mat-icon>
                        </div>
                        <div class="flex-1">
                            <div class="text-[11px] text-slate-400 font-normal leading-tight">ទីកន្លែងកំណើត</div>
                            <div class="text-[14px] font-medium text-slate-900 mt-0.5">{{ member()?.pob }}</div>
                        </div>
                    </div>

                    <!-- លេខទូរស័ព្ទ -->
                    <div class="flex items-start gap-3.5">
                        <div class="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-500 mt-0.5">
                            <mat-icon svgIcon="heroicons_outline:phone" class="icon-size-4.5"></mat-icon>
                        </div>
                        <div class="flex-1">
                            <div class="text-[11px] text-slate-400 font-normal leading-tight">លេខទូរស័ព្ទ</div>
                            <div class="text-[14px] font-medium text-slate-900 mt-0.5">{{ member()?.phone }}</div>
                        </div>
                    </div>

                    <!-- អ៊ីមែល -->
                    <div class="flex items-start gap-3.5">
                        <div class="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-500 mt-0.5">
                            <mat-icon svgIcon="heroicons_outline:envelope" class="icon-size-4.5"></mat-icon>
                        </div>
                        <div class="flex-1">
                            <div class="text-[11px] text-slate-400 font-normal leading-tight">អ៊ីមែល</div>
                            <div class="text-[14px] font-medium text-slate-900 mt-0.5">{{ member()?.email }}</div>
                        </div>
                    </div>

                    <!-- ស្ថានភាពសុពលភាព (Verification Stamp) -->
                    <div class="mt-6 pt-4 border-t border-slate-200">
                        <div class="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                            <div class="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                                <mat-icon svgIcon="mdi:check-decagram" class="icon-size-5"></mat-icon>
                            </div>
                            <div>
                                <div class="text-[13px] font-semibold text-emerald-800">
                                    {{ member()?.status || 'សុពលភាពសកម្ម (Active Verified)' }}
                                </div>
                                <div class="text-[11px] text-emerald-700">
                                    សុពលភាពរហូតដល់៖ {{ member()?.valid_until || '៣១ ធ្នូ ២០២៧' }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 7. FOOTER BRANDING -->
                <div class="mt-auto bg-slate-50 border-t border-slate-200 px-6 py-4 text-center text-xs text-slate-400">
                    <p>© 2026 NextTask WMS. រក្សាសិទ្ធិគ្រប់យ៉ាង។</p>
                    <p class="text-[11px] text-slate-400 mt-0.5">ប្រព័ន្ធផ្ទៀងផ្ទាត់អត្តសញ្ញាណប័ណ្ណសមាជិកឌីជីថលផ្លូវការ</p>
                </div>

            </div>
        </div>
    `,
})
export class MemberVerifyComponent implements OnInit {
    member = signal<VerifiedMemberData | null>(null);

    constructor(private readonly _route: ActivatedRoute) {}

    ngOnInit(): void {
        this._route.queryParams.subscribe((params) => {
            const phone = params['phone'] || params['code'] || '087600064';
            const nameKh = params['name_kh'] || 'ចេង ច័ន្ទបញ្ញា';
            const nameEn = params['name_en'] || 'CHENG CHANPANHA';
            const email = params['email'] || 'Chanpanhacheng@gmail.com';
            const gender = params['gender'] || 'ប្រុស';

            this.member.set({
                id: params['id'] || '2',
                code: `CCN-${phone}`,
                name_kh: nameKh,
                name_en: nameEn,
                gender: gender,
                nationality: 'ខ្មែរ',
                dob: '០៦ មករា ១៩៩៦',
                pob: 'រាជធានីភ្នំពេញ',
                phone: phone,
                email: email,
                organization_kh: 'ប្រព័ន្ធគ្រប់គ្រងការងារស្នូល',
                organization_en: 'CORE WORK MANAGEMENT SYSTEM',
                role_title: 'សមាជិកប្រព័ន្ធ (Core Member)',
                status: 'សុពលភាពសកម្ម (Active Verified)',
                valid_until: '៣១ ធ្នូ ២០២៧',
                avatar_url: '/images/placeholder/panha-portrait.jpg',
            });
        });
    }

    onAvatarError(event: Event): void {
        const img = event.target as HTMLImageElement;
        img.src = '/images/placeholder/avatar.jpg';
    }

    onLogoError(event: Event): void {
        const img = event.target as HTMLImageElement;
        img.src = 'https://ui-avatars.com/api/?name=WMS&background=0b5c9e&color=fff';
    }
}
