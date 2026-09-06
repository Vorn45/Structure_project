import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AdminService, AdminAttendanceData, AdminLeaveRequest } from '../admin.service';

@Component({
    selector: 'app-attendance-leave',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatIconModule,
        MatButtonModule,
        MatTooltipModule,
    ],
    templateUrl: './attendance-leave.component.html',
    styles: [`
        :host {
            display: block;
            font-family: 'Kantumruy Pro', sans-serif !important;
            font-size: 16px;
        }
    `],
})
export class AttendanceLeaveComponent implements OnInit {
    private readonly _adminService = inject(AdminService);

    attendance = signal<AdminAttendanceData | null>(null);
    leaves = signal<AdminLeaveRequest[]>([]);
    loading = signal<boolean>(true);

    activeTab = signal<'attendance' | 'leaves'>('leaves');

    // Action comment modal
    actionModalOpen = signal<boolean>(false);
    targetLeave = signal<AdminLeaveRequest | null>(null);
    actionType = signal<'approved' | 'rejected'>('approved');
    comment = signal<string>('');

    ngOnInit(): void {
        this.loadData();
    }

    loadData(): void {
        this.loading.set(true);
        this._adminService.getAttendance().subscribe({
            next: (res) => {
                if (res.data) this.attendance.set(res.data);
            },
        });

        this._adminService.getLeaves().subscribe({
            next: (res) => {
                if (res.data) this.leaves.set(res.data);
                this.loading.set(false);
            },
            error: () => this.loading.set(false),
        });
    }

    openActionModal(leave: AdminLeaveRequest, type: 'approved' | 'rejected'): void {
        this.targetLeave.set(leave);
        this.actionType.set(type);
        this.comment.set(type === 'approved' ? 'បានអនុម័តតាមសំណើ' : 'មិនអាចអនុញ្ញាតបានដោយសារបន្ទុកការងារច្រើន');
        this.actionModalOpen.set(true);
    }

    submitLeaveAction(): void {
        const leave = this.targetLeave();
        if (!leave) return;

        this._adminService.actionLeave(leave.id, this.actionType(), this.comment()).subscribe({
            next: (res) => {
                this.leaves.update((list) =>
                    list.map((l) => (l.id === res.data.id ? res.data : l)),
                );
                this.actionModalOpen.set(false);
                this.targetLeave.set(null);
            },
            error: (err) => console.error('Failed to action leave:', err),
        });
    }

    getLeaveTypeLabel(type: string): string {
        switch (type) {
            case 'annual': return 'ច្បាប់ប្រចាំឆ្នាំ';
            case 'sick': return 'ច្បាប់ឈឺ / ព្យាបាល';
            case 'special': return 'ច្បាប់ពិសេស';
            case 'maternity': return 'ច្បាប់លំហែមាតុភាព';
            default: return type;
        }
    }

    getLeaveStatusClass(status: string): string {
        switch (status) {
            case 'approved':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
            case 'rejected':
                return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800';
            default:
                return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
        }
    }

    getLeaveStatusLabel(status: string): string {
        switch (status) {
            case 'approved': return 'បានអនុម័ត';
            case 'rejected': return 'បានបដិសេធ';
            default: return 'កំពុងរង់ចាំការសម្រេច';
        }
    }
}
