import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SideDialogCloseButtonComponent } from 'app/shared/side-dialog-close-button/component';
import { AdminService, AdminUser } from '../../../admin.service';

export interface CreateMemberDialogData {
    projectName?: string;
    users?: AdminUser[];
    existingMemberIds?: (number | string)[];
    existingMemberNames?: string[];
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
        <div class="w-full h-full flex flex-col bg-white dark:bg-slate-900 font-kantumruy text-[16px] font-normal relative overflow-visible"
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
                <div class="p-5 space-y-5 font-kantumruy">



                    <!-- Mode Switcher Tabs -->
                    <div class="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                        <button type="button"
                            (click)="activeMode.set('select')"
                            class="flex-1 py-2 px-3 rounded-lg text-[14px] font-medium transition-all flex items-center justify-center gap-2 cursor-pointer"
                            [ngClass]="activeMode() === 'select' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-semibold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'">
                            <mat-icon svgIcon="mdi:account-group-outline" class="!w-4.5 !h-4.5"></mat-icon>
                            <span>ជ្រើសរើសពីបុគ្គលិក</span>
                            <span *ngIf="staffList().length > 0" class="px-1.5 py-0.2 rounded-full text-[11px] font-bold bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                                {{ staffList().length }}
                            </span>
                        </button>
                        <button type="button"
                            (click)="activeMode.set('manual')"
                            class="flex-1 py-2 px-3 rounded-lg text-[14px] font-medium transition-all flex items-center justify-center gap-2 cursor-pointer"
                            [ngClass]="activeMode() === 'manual' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-semibold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'">
                            <mat-icon svgIcon="mdi:pencil-outline" class="!w-4.5 !h-4.5"></mat-icon>
                            <span>បញ្ចូលដោយដៃ</span>
                        </button>
                    </div>

                    <!-- ========================================================= -->
                    <!-- OPTION A: SELECT FROM STAFF ("បុគ្គលិក")                   -->
                    <!-- ========================================================= -->
                    <div *ngIf="activeMode() === 'select'" class="space-y-4">

                        <!-- If staff NOT yet selected: show search + list -->
                        <div *ngIf="!selectedStaff()" class="space-y-3">
                            <label class="block font-normal text-slate-800 dark:text-slate-200 text-[15px]">
                                ជ្រើសរើសបុគ្គលិកក្នុងប្រព័ន្ធ <span class="text-red-500">*</span>
                            </label>

                            <!-- Live Search Input -->
                            <div class="relative">
                                <mat-icon svgIcon="mdi:magnify" class="absolute left-3.5 top-1/2 -translate-y-1/2 !w-5 !h-5 text-slate-400 dark:text-slate-500"></mat-icon>
                                <input
                                    type="text"
                                    [ngModel]="searchQuery()"
                                    (ngModelChange)="searchQuery.set($event)"
                                    placeholder="ស្វែងរកតាមឈ្មោះ អ៊ីមែល ឬតួនាទីបុគ្គលិក..."
                                    class="w-full pl-11 pr-9 py-2.5 text-[15px] font-normal font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                                <button *ngIf="searchQuery()" (click)="searchQuery.set('')" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
                                    <mat-icon svgIcon="mdi:close-circle" class="!w-4.5 !h-4.5"></mat-icon>
                                </button>
                            </div>

                            <!-- Staff List Scrollable -->
                            <div class="space-y-2 max-h-[440px] overflow-y-auto pr-1">
                                <div *ngIf="loadingStaff()" class="py-8 text-center text-slate-400 text-[14px]">
                                    កំពុងផ្ទុកទិន្នន័យបុគ្គលិក...
                                </div>

                                <div *ngIf="!loadingStaff() && filteredStaff().length === 0" class="py-8 text-center text-slate-400 dark:text-slate-500 text-[14px]">
                                    មិនមានបុគ្គលិកត្រូវនឹងការស្វែងរកឡើយ
                                </div>

                                <div *ngFor="let s of filteredStaff()"
                                    (click)="selectStaff(s)"
                                    class="p-3 rounded-xl border border-slate-200/80 dark:border-slate-750 bg-white dark:bg-slate-800/60 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/40 dark:hover:bg-blue-950/30 transition-all flex items-center justify-between gap-3 cursor-pointer group shadow-2xs">
                                    <div class="flex items-center gap-3 min-w-0 flex-1">
                                        <!-- Avatar / Initials -->
                                        <div class="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-semibold text-[15px] flex items-center justify-center shrink-0 border border-blue-200/60 dark:border-blue-800/60 overflow-hidden shadow-2xs">
                                            <img *ngIf="s.avatar" [src]="s.avatar" class="w-full h-full object-cover" />
                                            <span *ngIf="!s.avatar">{{ getInitial(s) }}</span>
                                        </div>
                                        <!-- Info -->
                                        <div class="min-w-0 flex-1">
                                            <div class="flex items-center gap-2">
                                                <span class="text-[14.5px] font-medium text-slate-900 dark:text-white truncate">{{ s.name_kh }}</span>
                                                <span *ngIf="s.name_en" class="text-[12.5px] text-slate-400 truncate font-normal">({{ s.name_en }})</span>
                                                <span *ngIf="isAlreadyMember(s)" class="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-750 dark:text-slate-300 shrink-0">
                                                    បានចូលរួមរួច
                                                </span>
                                            </div>
                                            <div class="text-[12.5px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                                                <span>{{ s.position || s.role || 'បុគ្គលិក' }}</span>
                                                <span *ngIf="s.department" class="text-slate-300 dark:text-slate-600">•</span>
                                                <span *ngIf="s.department" class="truncate">{{ s.department }}</span>
                                            </div>
                                            <div *ngIf="s.email" class="text-[11.5px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                                                {{ s.email }}
                                            </div>
                                        </div>
                                    </div>
                                    <div class="shrink-0">
                                        <span class="text-xs text-blue-600 dark:text-blue-400 font-medium px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            ជ្រើសរើស
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- If staff IS selected: show selected card & project role/email inputs -->
                        <div *ngIf="selectedStaff()" class="space-y-4">
                            <!-- Selected Staff Card -->
                            <div class="p-4 rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/30 space-y-3">
                                <div class="flex items-center justify-between">
                                    <span class="text-[12px] font-semibold tracking-wider text-blue-700 dark:text-blue-300 uppercase flex items-center gap-1.5">
                                        <mat-icon svgIcon="mdi:check-circle" class="!w-4 !h-4 text-blue-600"></mat-icon>
                                        <span>បុគ្គលិកដែលបានជ្រើសរើស</span>
                                    </span>
                                    <button type="button" (click)="clearSelectedStaff()"
                                        class="text-[12.5px] text-rose-600 dark:text-rose-400 hover:text-rose-700 font-medium flex items-center gap-1 cursor-pointer">
                                        <mat-icon svgIcon="mdi:refresh" class="!w-3.5 !h-3.5"></mat-icon>
                                        <span>ជ្រើសរើសឡើងវិញ</span>
                                    </button>
                                </div>

                                <div class="flex items-center gap-3.5 bg-white dark:bg-slate-900 p-3 rounded-xl border border-blue-100 dark:border-blue-900/60 shadow-2xs">
                                    <div class="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-semibold text-[17px] flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800 overflow-hidden">
                                        <img *ngIf="selectedStaff()?.avatar" [src]="selectedStaff()?.avatar" class="w-full h-full object-cover" />
                                        <span *ngIf="!selectedStaff()?.avatar">{{ getInitial(selectedStaff()) }}</span>
                                    </div>
                                    <div class="min-w-0 flex-1">
                                        <h4 class="text-[15.5px] font-medium text-slate-900 dark:text-white truncate">
                                            {{ selectedStaff()?.name_kh }}
                                            <span *ngIf="selectedStaff()?.name_en" class="text-[13px] text-slate-400 font-normal">({{ selectedStaff()?.name_en }})</span>
                                        </h4>
                                        <p class="text-[13px] text-slate-500 dark:text-slate-400 truncate">
                                            {{ selectedStaff()?.position || selectedStaff()?.role }}
                                            <span *ngIf="selectedStaff()?.department"> • {{ selectedStaff()?.department }}</span>
                                        </p>
                                        <p *ngIf="selectedStaff()?.email" class="text-[12px] text-slate-400 truncate">
                                            {{ selectedStaff()?.email }}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <!-- Role in Project -->
                            <div>
                                <label class="block font-normal text-slate-800 dark:text-slate-200 mb-2 text-[15px]">
                                    តួនាទីក្នុងគម្រោង (Project Role) <span class="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    [ngModel]="memberRole()"
                                    (ngModelChange)="memberRole.set($event)"
                                    (keyup.enter)="submit()"
                                    placeholder="ឧ. Lead Developer, Frontend Engineer..."
                                    class="w-full px-4 py-3 text-[15px] font-normal font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>

                            <!-- Email -->
                            <div>
                                <label class="block font-normal text-slate-800 dark:text-slate-200 mb-2 text-[15px]">
                                    អ៊ីមែល (Email)
                                </label>
                                <input
                                    type="email"
                                    [ngModel]="memberEmail()"
                                    (ngModelChange)="memberEmail.set($event)"
                                    (keyup.enter)="submit()"
                                    placeholder="member@example.com"
                                    class="w-full px-4 py-3 text-[15px] font-normal font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>
                        </div>

                    </div>

                    <!-- ========================================================= -->
                    <!-- OPTION B: MANUAL INPUT                                    -->
                    <!-- ========================================================= -->
                    <div *ngIf="activeMode() === 'manual'" class="space-y-4">
                        <!-- Member Name -->
                        <div>
                            <label class="block font-normal text-slate-800 dark:text-slate-200 mb-2 text-[15px]">
                                ឈ្មោះសមាជិក <span class="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                [ngModel]="memberName()"
                                (ngModelChange)="memberName.set($event)"
                                (keyup.enter)="submit()"
                                placeholder="ឧ. ឡេង សុខឆាយ..."
                                class="w-full px-4 py-3 text-[15px] font-normal font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>

                        <!-- Role -->
                        <div>
                            <label class="block font-normal text-slate-800 dark:text-slate-200 mb-2 text-[15px]">
                                តួនាទី (Role) <span class="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                [ngModel]="memberRole()"
                                (ngModelChange)="memberRole.set($event)"
                                (keyup.enter)="submit()"
                                placeholder="ឧ. Frontend Lead, UI Designer..."
                                class="w-full px-4 py-3 text-[15px] font-normal font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>

                        <!-- Email -->
                        <div>
                            <label class="block font-normal text-slate-800 dark:text-slate-200 mb-2 text-[15px]">
                                អ៊ីមែល (Email)
                            </label>
                            <input
                                type="email"
                                [ngModel]="memberEmail()"
                                (ngModelChange)="memberEmail.set($event)"
                                (keyup.enter)="submit()"
                                placeholder="member@example.com"
                                class="w-full px-4 py-3 text-[15px] font-normal font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
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
export class CreateMemberDialogComponent implements OnInit {
    private readonly _adminService = inject(AdminService);
    private readonly _dialogRef = inject(MatDialogRef<CreateMemberDialogComponent>);
    readonly data: CreateMemberDialogData = inject(MAT_DIALOG_DATA, { optional: true }) || {};

    activeMode = signal<'select' | 'manual'>('select');
    staffList = signal<AdminUser[]>([]);
    loadingStaff = signal<boolean>(false);
    searchQuery = signal<string>('');

    selectedStaff = signal<AdminUser | null>(null);

    memberName = signal<string>('');
    memberRole = signal<string>('');
    memberEmail = signal<string>('');
    memberAvatar = signal<string | null>(null);

    existingIds = computed(() => new Set((this.data?.existingMemberIds || []).map(String)));
    existingNames = computed(() => new Set((this.data?.existingMemberNames || []).map((n) => n.toLowerCase().trim())));

    filteredStaff = computed(() => {
        const query = this.searchQuery().toLowerCase().trim();
        const list = this.staffList();
        if (!query) return list;
        return list.filter((u) => {
            const kh = (u.name_kh || '').toLowerCase();
            const en = (u.name_en || '').toLowerCase();
            const email = (u.email || '').toLowerCase();
            const role = (u.role || '').toLowerCase();
            const pos = (u.position || '').toLowerCase();
            const dept = (u.department || '').toLowerCase();
            return (
                kh.includes(query) ||
                en.includes(query) ||
                email.includes(query) ||
                role.includes(query) ||
                pos.includes(query) ||
                dept.includes(query)
            );
        });
    });

    ngOnInit(): void {
        if (this.data?.users && this.data.users.length > 0) {
            this.staffList.set(this.data.users);
        } else {
            this.loadStaff();
        }
    }

    loadStaff(): void {
        this.loadingStaff.set(true);
        this._adminService.getUsers().subscribe({
            next: (res) => {
                if (res.data && res.data.results) {
                    this.staffList.set(res.data.results);
                }
                this.loadingStaff.set(false);
            },
            error: (err) => {
                console.error('Failed to load staff list:', err);
                this.loadingStaff.set(false);
            },
        });
    }

    isAlreadyMember(u: AdminUser): boolean {
        if (this.existingIds().has(String(u.id))) return true;
        if (u.name_kh && this.existingNames().has(u.name_kh.toLowerCase().trim())) return true;
        if (u.name_en && this.existingNames().has(u.name_en.toLowerCase().trim())) return true;
        return false;
    }

    selectStaff(u: AdminUser): void {
        this.selectedStaff.set(u);
        this.memberName.set(u.name_kh || u.name_en || '');
        this.memberRole.set(u.position || u.role || 'សមាជិកក្រុម');
        this.memberEmail.set(u.email || '');
        this.memberAvatar.set(u.avatar || null);
    }

    clearSelectedStaff(): void {
        this.selectedStaff.set(null);
        this.memberName.set('');
        this.memberRole.set('');
        this.memberEmail.set('');
        this.memberAvatar.set(null);
    }

    getInitial(staff?: AdminUser | null, nameFallback?: string): string {
        if (staff?.name_en) {
            const parts = staff.name_en.trim().split(/\s+/);
            if (parts.length >= 2) {
                return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
            }
            return staff.name_en.slice(0, 2).toUpperCase();
        }
        const name = nameFallback || staff?.name_kh || '';
        if (!name) return 'M';
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    }

    submit(): void {
        const name = this.memberName().trim();
        if (!name) return;
        let staff = this.selectedStaff();
        if (!staff && this.data.users && this.data.users.length > 0) {
            staff = this.data.users.find(
                (u) =>
                    (this.memberEmail() && u.email?.toLowerCase().trim() === this.memberEmail().toLowerCase().trim()) ||
                    u.name_kh?.trim() === name ||
                    (u.name_en && u.name_en.toLowerCase().trim() === name.toLowerCase())
            ) || null;
        }
        this._dialogRef.close({
            id: staff?.id || Date.now(),
            name,
            role: this.memberRole().trim() || staff?.position || staff?.role || 'សមាជិកក្រុម',
            email: this.memberEmail().trim() || staff?.email || '',
            avatar: this.memberAvatar() || staff?.avatar || undefined,
            initial: this.getInitial(staff, name),
            department: staff?.department,
            user_id: staff?.id,
            phone: staff?.phone || undefined,
        });
    }

    cancel(): void {
        this._dialogRef.close(null);
    }
}
