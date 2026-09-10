import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { SideDialogCloseButtonComponent } from 'app/shared/side-dialog-close-button/component';
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
        MatMenuModule,
        SideDialogCloseButtonComponent,
    ],
    templateUrl: './user-management.component.html',
    styles: [`
        :host {
            display: block;
            font-family: 'Kantumruy Pro', sans-serif !important;
        }
        :host *, :host ::ng-deep * {
            font-family: 'Kantumruy Pro', sans-serif !important;
        }
        input, select, textarea, button, label, span, p, div, table, th, td, h1, h2, h3 {
            font-family: 'Kantumruy Pro', sans-serif !important;
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
    sortBy = signal<'name_asc' | 'name_desc' | 'default'>('default');
    isFilterOpen = signal<boolean>(false);

    toggleFilterBar(): void {
        this.isFilterOpen.update((v) => !v);
    }

    hasActiveFilters = computed(() => {
        return this.selectedRole() !== 'all' || this.selectedDepartment() !== 'all' || this.selectedStatus() !== 'all' || this.sortBy() !== 'default';
    });

    resetFilters(): void {
        this.selectedRole.set('all');
        this.selectedDepartment.set('all');
        this.selectedStatus.set('all');
        this.sortBy.set('default');
    }

    setSort(sort: 'name_asc' | 'name_desc' | 'default'): void {
        this.sortBy.set(sort);
    }

    toggleSort(): void {
        if (this.sortBy() === 'default') this.sortBy.set('name_asc');
        else if (this.sortBy() === 'name_asc') this.sortBy.set('name_desc');
        else this.sortBy.set('default');
    }

    // Drawer state
    isDrawerOpen = signal<boolean>(false);
    isEditing = signal<boolean>(false);
    selectedUser = signal<AdminUser | null>(null);
    userForm: FormGroup;
    saving = signal<boolean>(false);
    showPassword = signal<boolean>(false);

    togglePasswordVisibility(): void {
        this.showPassword.update((v) => !v);
    }

    // Delete confirmation
    deleteTarget = signal<AdminUser | null>(null);
    showDeleteModal = signal<boolean>(false);

    readonly roles = ['Super Admin', 'Admin', 'Manager', 'Team Lead', 'Member'];
    readonly departments = [
        'ព័ត៌មានវិទ្យា (IT)',
        'គ្រប់គ្រងគម្រោង (PMO)',
        'រចនា និងបទពិសោធន៍ (UI/UX)',
        'ហេដ្ឋារចនាសម្ព័ន្ធ (DevOps)',
        'ធនធានមនុស្ស និងរដ្ឋបាល (HR & Admin)',
    ];

    filteredUsers = computed(() => {
        let list = this.users();
        const search = this.searchQuery().toLowerCase().trim();
        const role = this.selectedRole();
        const dept = this.selectedDepartment();
        const status = this.selectedStatus();
        const sort = this.sortBy();

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

        if (sort === 'name_asc') {
            list = [...list].sort((a, b) => a.name_kh.localeCompare(b.name_kh, 'km'));
        } else if (sort === 'name_desc') {
            list = [...list].sort((a, b) => b.name_kh.localeCompare(a.name_kh, 'km'));
        }

        return list;
    });

    constructor() {
        this.userForm = this._fb.group({
            name_kh: ['', [Validators.required]],
            name_en: ['', [Validators.required]],
            email: ['', [Validators.required, Validators.email]],
            phone: ['', [Validators.required]],
            password: ['wms@1234', [Validators.minLength(6)]],
            role: ['Member', [Validators.required]],
            department: ['ព័ត៌មានវិទ្យា (IT)', [Validators.required]],
            position: ['', [Validators.required]],
            is_active: [1],
            avatar: [''],
            gender: ['male'],
            date_of_birth: [''],
            telegram_username: [''],
            address: [''],
            join_date: [new Date().toISOString().split('T')[0]],
            note: [''],
        });
    }

    onAvatarSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const file = input.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                this.userForm.patchValue({ avatar: e.target?.result as string });
            };
            reader.readAsDataURL(file);
        }
    }

    removeAvatar(): void {
        this.userForm.patchValue({ avatar: '' });
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
        this.showPassword.set(false);
        this.userForm.reset({
            name_kh: '',
            name_en: '',
            email: '',
            phone: '',
            password: 'wms@1234',
            role: 'Member',
            department: 'ព័ត៌មានវិទ្យា (IT)',
            position: '',
            is_active: 1,
            avatar: '',
            gender: 'male',
            date_of_birth: '',
            telegram_username: '',
            address: '',
            join_date: new Date().toISOString().split('T')[0],
            note: '',
        });
        this.isDrawerOpen.set(true);
    }

    openEditDrawer(user: AdminUser): void {
        this.isEditing.set(true);
        this.selectedUser.set(user);
        this.showPassword.set(false);
        this.userForm.patchValue({
            name_kh: user.name_kh,
            name_en: user.name_en,
            email: user.email,
            phone: user.phone,
            password: '',
            role: user.role,
            department: user.department,
            position: user.position,
            is_active: user.is_active,
            avatar: user.avatar || '',
            gender: user.gender || 'male',
            date_of_birth: user.date_of_birth || '',
            telegram_username: user.telegram_username || '',
            address: user.address || '',
            join_date: user.join_date || (user.created_at ? user.created_at.split('T')[0] : ''),
            note: user.note || '',
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
        const formVal = { ...this.userForm.value };
        if (formVal.email) formVal.email = formVal.email.trim();
        if (formVal.phone) formVal.phone = formVal.phone.trim();

        if (this.isEditing() && this.selectedUser()) {
            if (!formVal.password || !formVal.password.trim()) {
                delete formVal.password;
            } else {
                formVal.password = formVal.password.trim();
            }

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
            if (!formVal.password || !formVal.password.trim()) {
                formVal.password = 'wms@1234';
            } else {
                formVal.password = formVal.password.trim();
            }

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

    readonly roleList = [
        { key: 'Super Admin', label: 'អភិបាលជាន់ខ្ពស់' },
        { key: 'Admin', label: 'អភិបាល' },
        { key: 'Manager', label: 'អ្នកចាត់ការ' },
        { key: 'Team Lead', label: 'ប្រធានក្រុម' },
        { key: 'Member', label: 'សមាជិក' },
    ];

    getRoleKhmer(role: string): string {
        switch (role?.toLowerCase()?.trim()) {
            case 'super admin':
            case 'superadmin':
                return 'អភិបាលជាន់ខ្ពស់';
            case 'admin':
                return 'អភិបាល';
            case 'manager':
                return 'អ្នកចាត់ការ';
            case 'team lead':
                return 'ប្រធានក្រុម';
            case 'member':
                return 'សមាជិក';
            default:
                return role || 'សមាជិក';
        }
    }

    getRoleBadgeClass(role: string): string {
        switch (role?.toLowerCase()?.trim()) {
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
