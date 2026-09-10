import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AdminService, AdminUser } from '../admin.service';

@Component({
    selector: 'app-user-management',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatIconModule,
        MatButtonModule,
        MatTooltipModule,
    ],
    templateUrl: './user-management.component.html',
    styles: [`
        :host {
            display: block;
            font-family: 'Kantumruy Pro', sans-serif !important;
            font-size: 16px;
        }
    `],
})
export class UserManagementComponent implements OnInit {
    private readonly _adminService = inject(AdminService);
    private readonly _fb = inject(FormBuilder);

    users = signal<AdminUser[]>([]);
    loading = signal<boolean>(true);
    searchQuery = signal<string>('');
    selectedRole = signal<string>('all');
    selectedDepartment = signal<string>('all');
    selectedStatus = signal<string>('all');

    // Drawer state
    isDrawerOpen = signal<boolean>(false);
    isEditing = signal<boolean>(false);
    selectedUser = signal<AdminUser | null>(null);
    userForm: FormGroup;
    saving = signal<boolean>(false);

    // Delete confirmation
    deleteTarget = signal<AdminUser | null>(null);
    showDeleteModal = signal<boolean>(false);

    // Derived dynamically from loaded users — no hardcoded lists
    readonly roles = computed(() =>
        ['all', ...new Set(this.users().map((u) => u.role).filter(Boolean))],
    );

    readonly departments = computed(() =>
        ['all', ...new Set(this.users().map((u) => u.department).filter(Boolean))],
    );

    filteredUsers = computed(() => {
        let list = this.users();
        const search = this.searchQuery().toLowerCase().trim();
        const role = this.selectedRole();
        const dept = this.selectedDepartment();
        const status = this.selectedStatus();

        if (search) {
            list = list.filter(
                (u) =>
                    u.name_kh.toLowerCase().includes(search) ||
                    u.name_en.toLowerCase().includes(search) ||
                    u.email.toLowerCase().includes(search) ||
                    u.phone.includes(search) ||
                    u.position.toLowerCase().includes(search),
            );
        }

        if (role !== 'all') {
            list = list.filter((u) => u.role.toLowerCase() === role.toLowerCase());
        }

        if (dept !== 'all') {
            list = list.filter((u) => u.department === dept);
        }

        if (status !== 'all') {
            const activeVal = status === 'active' ? 1 : 0;
            list = list.filter((u) => u.is_active === activeVal);
        }

        return list;
    });

    constructor() {
        this.userForm = this._fb.group({
            name_kh: ['', [Validators.required]],
            name_en: ['', [Validators.required]],
            email: ['', [Validators.required, Validators.email]],
            phone: ['', [Validators.required]],
            role: ['', [Validators.required]],
            department: ['', [Validators.required]],
            position: ['', [Validators.required]],
            is_active: [1],
        });
    }

    ngOnInit(): void {
        this.loadUsers();
    }

    loadUsers(): void {
        this.loading.set(true);
        this._adminService.getUsers().subscribe({
            next: (res) => {
                if (res.data && res.data.results) {
                    this.users.set(res.data.results);
                }
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Failed to load users:', err);
                this.loading.set(false);
            },
        });
    }

    openCreateDrawer(): void {
        this.isEditing.set(false);
        this.selectedUser.set(null);
        this.userForm.reset({
            role: 'Member',
            department: 'ព័ត៌មានវិទ្យា (IT)',
            is_active: 1,
        });
        this.isDrawerOpen.set(true);
    }

    openEditDrawer(user: AdminUser): void {
        this.isEditing.set(true);
        this.selectedUser.set(user);
        this.userForm.patchValue({
            name_kh: user.name_kh,
            name_en: user.name_en,
            email: user.email,
            phone: user.phone,
            role: user.role,
            department: user.department,
            position: user.position,
            is_active: user.is_active,
        });
        this.isDrawerOpen.set(true);
    }

    closeDrawer(): void {
        this.isDrawerOpen.set(false);
        this.selectedUser.set(null);
    }

    submitUserForm(): void {
        if (this.userForm.invalid) {
            this.userForm.markAllAsTouched();
            return;
        }

        this.saving.set(true);
        const formVal = this.userForm.value;

        if (this.isEditing() && this.selectedUser()) {
            this._adminService.updateUser(this.selectedUser()!.id, formVal).subscribe({
                next: (res) => {
                    this.users.update((list) =>
                        list.map((u) => (u.id === res.data.id ? res.data : u)),
                    );
                    this.saving.set(false);
                    this.closeDrawer();
                },
                error: (err) => {
                    console.error('Failed to update user:', err);
                    this.saving.set(false);
                },
            });
        } else {
            this._adminService.createUser(formVal).subscribe({
                next: (res) => {
                    this.users.update((list) => [res.data, ...list]);
                    this.saving.set(false);
                    this.closeDrawer();
                },
                error: (err) => {
                    console.error('Failed to create user:', err);
                    this.saving.set(false);
                },
            });
        }
    }

    toggleStatus(user: AdminUser): void {
        this._adminService.toggleUserStatus(user.id).subscribe({
            next: (res) => {
                this.users.update((list) =>
                    list.map((u) => (u.id === res.data.id ? res.data : u)),
                );
            },
            error: (err) => console.error('Failed to toggle status:', err),
        });
    }

    confirmDelete(user: AdminUser): void {
        this.deleteTarget.set(user);
        this.showDeleteModal.set(true);
    }

    deleteUser(): void {
        const target = this.deleteTarget();
        if (!target) return;

        this._adminService.deleteUser(target.id).subscribe({
            next: () => {
                this.users.update((list) => list.filter((u) => u.id !== target.id));
                this.showDeleteModal.set(false);
                this.deleteTarget.set(null);
            },
            error: (err) => console.error('Failed to delete user:', err),
        });
    }

    getRoleBadgeClass(role: string): string {
        switch (role.toLowerCase()) {
            case 'super admin':
            case 'superadmin':
                return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-200 dark:border-purple-700';
            case 'admin':
                return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800';
            case 'manager':
                return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
            case 'team lead':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
            default:
                return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
        }
    }
}
