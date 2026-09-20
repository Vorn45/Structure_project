import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';

import { SideDialogCloseButtonComponent } from 'app/shared/side-dialog-close-button/component';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import { resolveFileUrl } from 'helper/shared/file-url';
import { downloadBlob } from 'helper/shared/file-download';
import { AdminService, AdminAttendanceData, AdminLeaveRequest, AdminUser } from '../admin.service';

export interface StaffLeaveSummary {
    userId: number;
    userName: string;
    department: string;
    avatar?: string | null;
    totalRequests: number;
    approvedDays: number;
    pendingDays: number;
    annualDays: number;
    sickDays: number;
    specialDays: number;
}

@Component({
    selector: 'app-attendance-leave',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatIconModule,
        MatButtonModule,
        MatTooltipModule,
        MatMenuModule,
        SideDialogCloseButtonComponent,
    ],
    templateUrl: './template.html',
    styleUrl: './style.scss',
})
export class AttendanceLeaveComponent implements OnInit {
    private readonly _adminService = inject(AdminService);
    private readonly _snackbar = inject(SnackbarService);
    private readonly _fb = inject(FormBuilder);

    // Main data signals
    attendance = signal<AdminAttendanceData | null>(null);
    leaves = signal<AdminLeaveRequest[]>([]);
    users = signal<AdminUser[]>([]);
    loading = signal<boolean>(true);

    // Active navigation tab
    activeTab = signal<'leaves' | 'attendance' | 'summary'>('leaves');

    // Filters & search
    searchQuery = signal<string>('');
    statusFilter = signal<string>('all');
    departmentFilter = signal<string>('all');
    leaveTypeFilter = signal<string>('all');
    selectedDate = signal<string>(new Date().toISOString().split('T')[0]);

    // Action comment modal (Approve / Reject)
    actionModalOpen = signal<boolean>(false);
    targetLeave = signal<AdminLeaveRequest | null>(null);
    actionType = signal<'approved' | 'rejected'>('approved');
    comment = signal<string>('');
    actionLoading = signal<boolean>(false);

    // Create Leave Drawer
    createDrawerOpen = signal<boolean>(false);
    createLeaveForm!: FormGroup;
    createLoading = signal<boolean>(false);

    // Manual Attendance Modal
    manualLogDrawerOpen = signal<boolean>(false);
    manualLogForm!: FormGroup;
    manualLogLoading = signal<boolean>(false);

    // Delete Confirmation Modal
    deleteModalOpen = signal<boolean>(false);
    leaveToDelete = signal<AdminLeaveRequest | null>(null);
    deleteLoading = signal<boolean>(false);

    // Preset action comment choices
    readonly approvedPresets = [
        'បានអនុម័តតាមសំណើ',
        'អនុញ្ញាត សូមសម្រាកព្យាបាលឱ្យឆាប់ជាសះស្បើយ',
        'អនុញ្ញាតតាមការស្នើសុំ ត្រូវផ្ទេរភារកិច្ចបន្ទាន់ឱ្យសហការី',
    ];

    readonly rejectedPresets = [
        'មិនអាចអនុញ្ញាតបានដោយសារបន្ទុកការងារច្រើន និងគម្រោងបន្ទាន់',
        'សូមភ្ជាប់មកជាមួយលិខិតបញ្ជាក់សុខភាពពីមន្ទីរពេទ្យ',
        'ចំនួនថ្ងៃឈប់សម្រាកប្រចាំឆ្នាំលើសកម្រិតកំណត់',
    ];

    // Computed: Unique list of departments from users and logs
    departments = computed(() => {
        const set = new Set<string>();
        for (const u of this.users()) {
            if (u.department) set.add(u.department.trim());
        }
        for (const l of this.leaves()) {
            if (l.department) set.add(l.department.trim());
        }
        for (const log of this.attendance()?.logs || []) {
            if (log.department) set.add(log.department.trim());
        }
        return Array.from(set).filter(Boolean).sort();
    });

    // Computed: Filtered leaves list
    filteredLeaves = computed(() => {
        let items = this.leaves();
        const q = this.searchQuery().trim().toLowerCase();
        const status = this.statusFilter();
        const dept = this.departmentFilter();
        const type = this.leaveTypeFilter();

        if (q) {
            items = items.filter(
                (l) =>
                    (l.user_name && l.user_name.toLowerCase().includes(q)) ||
                    (l.department && l.department.toLowerCase().includes(q)) ||
                    (l.reason && l.reason.toLowerCase().includes(q)),
            );
        }

        if (status !== 'all') {
            items = items.filter((l) => l.status === status);
        }

        if (dept !== 'all') {
            items = items.filter((l) => l.department === dept);
        }

        if (type !== 'all') {
            items = items.filter((l) => l.leave_type === type);
        }

        return items;
    });

    // Computed: Filtered attendance logs
    filteredLogs = computed(() => {
        let logs = this.attendance()?.logs || [];
        const q = this.searchQuery().trim().toLowerCase();
        const status = this.statusFilter();
        const dept = this.departmentFilter();

        if (q) {
            logs = logs.filter(
                (l) =>
                    (l.user_name && l.user_name.toLowerCase().includes(q)) ||
                    (l.user_en && l.user_en.toLowerCase().includes(q)) ||
                    (l.department && l.department.toLowerCase().includes(q)) ||
                    (l.location && l.location.toLowerCase().includes(q)),
            );
        }

        if (status !== 'all') {
            logs = logs.filter((l) => l.status === status);
        }

        if (dept !== 'all') {
            logs = logs.filter((l) => l.department === dept);
        }

        return logs;
    });

    // Computed: Quick Statistics
    totalStaff = computed(() => this.attendance()?.total_staff || this.users().length || 6);
    presentToday = computed(() => this.attendance()?.present_today || (this.attendance()?.logs || []).length || 0);
    lateToday = computed(() => this.attendance()?.late_today || (this.attendance()?.logs || []).filter((l) => l.status === 'late').length || 0);
    onLeaveToday = computed(() => this.attendance()?.on_leave || 0);

    attendanceRate = computed(() => {
        const total = this.totalStaff();
        if (!total) return 0;
        const rate = Math.round((this.presentToday() / total) * 100);
        return Math.min(100, Math.max(0, rate));
    });

    pendingLeavesCount = computed(() => this.leaves().filter((l) => l.status === 'pending').length);
    approvedLeavesCount = computed(() => this.leaves().filter((l) => l.status === 'approved').length);
    rejectedLeavesCount = computed(() => this.leaves().filter((l) => l.status === 'rejected').length);

    // Computed: Staff Leave Summary Balances
    staffSummaryList = computed(() => {
        const map = new Map<string, StaffLeaveSummary>();

        // Pre-populate with all active users
        for (const u of this.users()) {
            map.set(String(u.id), {
                userId: u.id,
                userName: u.name_kh || u.name_en,
                department: u.department || 'ព័ត៌មានវិទ្យា (IT)',
                avatar: u.avatar || null,
                totalRequests: 0,
                approvedDays: 0,
                pendingDays: 0,
                annualDays: 0,
                sickDays: 0,
                specialDays: 0,
            });
        }

        // Aggregate from leaves
        for (const l of this.leaves()) {
            const key = String(l.user_id);
            let item = map.get(key);
            if (!item) {
                item = {
                    userId: l.user_id,
                    userName: l.user_name,
                    department: l.department || 'ព័ត៌មានវិទ្យា (IT)',
                    avatar: null,
                    totalRequests: 0,
                    approvedDays: 0,
                    pendingDays: 0,
                    annualDays: 0,
                    sickDays: 0,
                    specialDays: 0,
                };
                map.set(key, item);
            }

            item.totalRequests++;
            const days = l.duration_days || 1;
            if (l.status === 'approved') {
                item.approvedDays += days;
                if (l.leave_type === 'annual') item.annualDays += days;
                else if (l.leave_type === 'sick') item.sickDays += days;
                else item.specialDays += days;
            } else if (l.status === 'pending') {
                item.pendingDays += days;
            }
        }

        return Array.from(map.values()).sort((a, b) => b.approvedDays - a.approvedDays);
    });

    ngOnInit(): void {
        this.initForms();
        this.loadData();
    }

    private initForms(): void {
        const todayStr = new Date().toISOString().split('T')[0];

        this.createLeaveForm = this._fb.group({
            user_id: [null, Validators.required],
            user_name: ['', Validators.required],
            department: ['ព័ត៌មានវិទ្យា (IT)', Validators.required],
            leave_type: ['annual', Validators.required],
            start_date: [todayStr, Validators.required],
            end_date: [todayStr, Validators.required],
            duration_days: [1, [Validators.required, Validators.min(0.5)]],
            reason: ['', [Validators.required, Validators.minLength(3)]],
            status: ['pending', Validators.required],
            reviewer_comment: [''],
        });

        this.manualLogForm = this._fb.group({
            user_name: ['', Validators.required],
            user_en: [''],
            user_id: [null],
            department: ['ព័ត៌មានវិទ្យា (IT)', Validators.required],
            check_in: ['08:00 AM', Validators.required],
            check_out: [''],
            status: ['on_time', Validators.required],
            date: [todayStr, Validators.required],
            location: ['ការិយាល័យកណ្តាល (Phnom Penh HQ)'],
        });
    }

    loadData(): void {
        this.loading.set(true);

        this._adminService.getAttendance(this.selectedDate()).subscribe({
            next: (res) => {
                if (res.data) this.attendance.set(res.data);
            },
            error: (err) => console.error('Failed to load attendance:', err),
        });

        this._adminService.getLeaves().subscribe({
            next: (res) => {
                if (res.data) this.leaves.set(res.data);
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Failed to load leaves:', err);
                this.loading.set(false);
            },
        });

        this._adminService.getUsers().subscribe({
            next: (res) => {
                if (res.data?.results) this.users.set(res.data.results);
            },
            error: (err) => console.error('Failed to load users for attendance:', err),
        });
    }

    // Action Modal: Approve / Reject
    openActionModal(leave: AdminLeaveRequest, type: 'approved' | 'rejected'): void {
        this.targetLeave.set(leave);
        this.actionType.set(type);
        this.comment.set(
            type === 'approved'
                ? 'បានអនុម័តតាមសំណើ'
                : 'មិនអាចអនុញ្ញាតបានដោយសារបន្ទុកការងារច្រើន និងគម្រោងបន្ទាន់',
        );
        this.actionModalOpen.set(true);
    }

    setPresetComment(preset: string): void {
        this.comment.set(preset);
    }

    submitLeaveAction(): void {
        const leave = this.targetLeave();
        if (!leave) return;

        this.actionLoading.set(true);
        const action = this.actionType();
        const comment = this.comment().trim();

        this._adminService.actionLeave(leave.id, action, comment).subscribe({
            next: (res) => {
                this.leaves.update((list) =>
                    list.map((l) => (l.id === res.data.id ? res.data : l)),
                );
                this.actionLoading.set(false);
                this.actionModalOpen.set(false);
                this.targetLeave.set(null);

                const label = action === 'approved' ? 'អនុម័ត' : 'បដិសេធ';
                this._snackbar.success(`បាន${label}សំណើរសុំច្បាប់របស់ ${leave.user_name} ដោយជោគជ័យ`);
            },
            error: (err) => {
                this.actionLoading.set(false);
                console.error('Failed to action leave:', err);
                this._snackbar.error('បរាជ័យក្នុងការអនុវត្តសកម្មភាពលើសំណើរសុំច្បាប់');
            },
        });
    }

    // Create Leave Request
    openCreateDrawer(): void {
        const todayStr = new Date().toISOString().split('T')[0];
        this.createLeaveForm.reset({
            user_id: null,
            user_name: '',
            department: 'ព័ត៌មានវិទ្យា (IT)',
            leave_type: 'annual',
            start_date: todayStr,
            end_date: todayStr,
            duration_days: 1,
            reason: '',
            status: 'pending',
            reviewer_comment: '',
        });
        this.createDrawerOpen.set(true);
    }

    closeCreateDrawer(): void {
        this.createDrawerOpen.set(false);
    }

    onEmployeeSelect(event: Event): void {
        const select = event.target as HTMLSelectElement;
        const selectedId = Number(select.value);
        const user = this.users().find((u) => u.id === selectedId);
        if (user) {
            this.createLeaveForm.patchValue({
                user_id: user.id,
                user_name: user.name_kh || user.name_en,
                department: user.department || 'ព័ត៌មានវិទ្យា (IT)',
            });
        }
    }

    calculateDuration(): void {
        const start = this.createLeaveForm.get('start_date')?.value;
        const end = this.createLeaveForm.get('end_date')?.value;
        if (start && end) {
            const s = new Date(start);
            const e = new Date(end);
            if (e >= s) {
                const diff = Math.abs(e.getTime() - s.getTime());
                const days = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
                this.createLeaveForm.patchValue({ duration_days: days });
            }
        }
    }

    submitCreateLeave(): void {
        if (this.createLeaveForm.invalid) {
            this.createLeaveForm.markAllAsTouched();
            this._snackbar.error('សូមបំពេញព័ត៌មានសំណើរសុំច្បាប់ឱ្យបានគ្រប់ជ្រុងជ្រោយ');
            return;
        }

        this.createLoading.set(true);
        const payload = this.createLeaveForm.value;

        this._adminService.createLeave(payload).subscribe({
            next: (res) => {
                this.leaves.update((list) => [res.data, ...list]);
                this.createLoading.set(false);
                this.closeCreateDrawer();
                this._snackbar.success('បានបង្កើតសំណើរសុំច្បាប់ឈប់សម្រាកថ្មីដោយជោគជ័យ');
            },
            error: (err) => {
                this.createLoading.set(false);
                console.error('Failed to create leave:', err);
                this._snackbar.error('បរាជ័យក្នុងការបង្កើតសំណើរសុំច្បាប់');
            },
        });
    }

    // Manual Attendance Log
    openManualLogDrawer(): void {
        const todayStr = new Date().toISOString().split('T')[0];
        this.manualLogForm.reset({
            user_name: '',
            user_en: '',
            user_id: null,
            department: 'ព័ត៌មានវិទ្យា (IT)',
            check_in: '08:00 AM',
            check_out: '',
            status: 'on_time',
            date: todayStr,
            location: 'ការិយាល័យកណ្តាល (Phnom Penh HQ)',
        });
        this.manualLogDrawerOpen.set(true);
    }

    closeManualLogDrawer(): void {
        this.manualLogDrawerOpen.set(false);
    }

    onManualLogEmployeeSelect(event: Event): void {
        const select = event.target as HTMLSelectElement;
        const selectedId = Number(select.value);
        const user = this.users().find((u) => u.id === selectedId);
        if (user) {
            this.manualLogForm.patchValue({
                user_id: user.id,
                user_name: user.name_kh || user.name_en,
                user_en: user.name_en || user.name_kh,
                department: user.department || 'ព័ត៌មានវិទ្យា (IT)',
            });
        }
    }

    submitManualLog(): void {
        if (this.manualLogForm.invalid) {
            this.manualLogForm.markAllAsTouched();
            this._snackbar.error('សូមបំពេញព័ត៌មានវត្តមានឱ្យបានត្រឹមត្រូវ');
            return;
        }

        this.manualLogLoading.set(true);
        const payload = this.manualLogForm.value;

        this._adminService.recordAttendanceLog(payload).subscribe({
            next: () => {
                this.manualLogLoading.set(false);
                this.closeManualLogDrawer();
                this.loadData();
                this._snackbar.success('បានកត់ត្រាវត្តមានបុគ្គលិកដោយជោគជ័យ');
            },
            error: (err) => {
                this.manualLogLoading.set(false);
                console.error('Failed to record log:', err);
                this._snackbar.error('បរាជ័យក្នុងការកត់ត្រាវត្តមាន');
            },
        });
    }

    // Delete Leave Request
    confirmDeleteLeave(leave: AdminLeaveRequest): void {
        this.leaveToDelete.set(leave);
        this.deleteModalOpen.set(true);
    }

    submitDeleteLeave(): void {
        const leave = this.leaveToDelete();
        if (!leave) return;

        this.deleteLoading.set(true);
        this._adminService.deleteLeave(leave.id).subscribe({
            next: () => {
                this.leaves.update((list) => list.filter((l) => l.id !== leave.id));
                this.deleteLoading.set(false);
                this.deleteModalOpen.set(false);
                this.leaveToDelete.set(null);
                this._snackbar.success('បានលុបសំណើរសុំច្បាប់ដោយជោគជ័យ');
            },
            error: (err) => {
                this.deleteLoading.set(false);
                console.error('Failed to delete leave:', err);
                this._snackbar.error('បរាជ័យក្នុងការលុបសំណើរសុំច្បាប់');
            },
        });
    }

    // Export to CSV
    exportToCsv(): void {
        let csvContent = '';
        const today = new Date().toISOString().split('T')[0];

        if (this.activeTab() === 'leaves') {
            const rows = [
                ['ឈ្មោះបុគ្គលិក', 'នាយកដ្ឋាន', 'ប្រភេទច្បាប់', 'ចាប់ពីថ្ងៃ', 'ដល់ថ្ងៃ', 'ចំនួនថ្ងៃ', 'មូលហេតុ', 'ស្ថានភាព', 'មតិអ្នកសម្រេច'],
            ];
            for (const l of this.filteredLeaves()) {
                rows.push([
                    l.user_name || '',
                    l.department || '',
                    this.getLeaveTypeLabel(l.leave_type),
                    l.start_date || '',
                    l.end_date || '',
                    String(l.duration_days || 1),
                    `"${(l.reason || '').replace(/"/g, '""')}"`,
                    this.getLeaveStatusLabel(l.status),
                    `"${(l.reviewer_comment || '').replace(/"/g, '""')}"`,
                ]);
            }
            csvContent = rows.map((e) => e.join(',')).join('\n');
            this.downloadFile(csvContent, `leaves_report_${today}.csv`);
        } else if (this.activeTab() === 'attendance') {
            const rows = [
                ['ឈ្មោះបុគ្គលិក (ខ្មែរ)', 'ឈ្មោះបុគ្គលិក (អង់គ្លេស)', 'នាយកដ្ឋាន', 'ម៉ោងចូល', 'ម៉ោងចេញ', 'ស្ថានភាព', 'ទីតាំងស្កេន', 'កាលបរិច្ឆេទ'],
            ];
            for (const log of this.filteredLogs()) {
                rows.push([
                    log.user_name || '',
                    log.user_en || '',
                    log.department || '',
                    log.check_in || '',
                    log.check_out || '---',
                    log.status === 'on_time' ? 'ទាន់ពេលវេលា' : 'មកយឺត',
                    `"${(log.location || '').replace(/"/g, '""')}"`,
                    log.date || today,
                ]);
            }
            csvContent = rows.map((e) => e.join(',')).join('\n');
            this.downloadFile(csvContent, `attendance_logs_${today}.csv`);
        } else {
            const rows = [
                ['ឈ្មោះបុគ្គលិក', 'នាយកដ្ឋាន', 'សំណើសរុប', 'ចំនួនថ្ងៃអនុម័ត', 'ចំនួនថ្ងៃរង់ចាំ', 'ច្បាប់ប្រចាំឆ្នាំ', 'ច្បាប់ឈឺ', 'ច្បាប់ពិសេស'],
            ];
            for (const s of this.staffSummaryList()) {
                rows.push([
                    s.userName || '',
                    s.department || '',
                    String(s.totalRequests),
                    String(s.approvedDays),
                    String(s.pendingDays),
                    String(s.annualDays),
                    String(s.sickDays),
                    String(s.specialDays),
                ]);
            }
            csvContent = rows.map((e) => e.join(',')).join('\n');
            this.downloadFile(csvContent, `staff_leave_balances_${today}.csv`);
        }
    }

    private downloadFile(content: string, fileName: string): void {
        const bom = '\uFEFF'; // UTF-8 BOM for Khmer fonts in Microsoft Excel
        const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
        downloadBlob(blob, fileName);
        this._snackbar.success(`បានទាញយកឯកសារ "${fileName}" ដោយជោគជ័យ`);
    }

    printReport(): void {
        window.print();
    }

    // Helper formatting methods
    getLeaveTypeLabel(type: string): string {
        switch (type) {
            case 'annual': return 'ច្បាប់ប្រចាំឆ្នាំ (Annual)';
            case 'sick': return 'ច្បាប់ឈឺ / ព្យាបាល (Sick)';
            case 'special': return 'ច្បាប់ពិសេស (Special)';
            case 'maternity': return 'ច្បាប់លំហែមាតុភាព (Maternity)';
            default: return type;
        }
    }

    getLeaveTypeBadge(type: string): string {
        switch (type) {
            case 'annual':
                return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
            case 'sick':
                return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
            case 'special':
                return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800';
            case 'maternity':
                return 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800';
            default:
                return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
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

    resolveAvatar(avatar?: string | null): string | null {
        return resolveFileUrl(avatar);
    }

    getUserInitials(name?: string | null): string {
        if (!name) return 'BK';
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }

    getAvatarBg(name?: string | null): string {
        if (!name) return 'bg-blue-600';
        const colors = [
            'bg-blue-600',
            'bg-emerald-600',
            'bg-purple-600',
            'bg-amber-600',
            'bg-rose-600',
            'bg-indigo-600',
            'bg-teal-600',
            'bg-cyan-600',
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    }
}

