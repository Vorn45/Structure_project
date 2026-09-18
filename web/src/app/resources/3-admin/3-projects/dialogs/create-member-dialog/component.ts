import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SideDialogCloseButtonComponent } from 'app/shared/side-dialog-close-button/component';
import { AdminService, AdminUser } from '../../../admin.service';


export * from './create-member-dialog.types';
import { CreateMemberDialogData } from './create-member-dialog.types';

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
    templateUrl: './template.html',
    styleUrl: './style.scss',
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
