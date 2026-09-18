import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { SideDialogCloseButtonComponent } from 'app/shared/side-dialog-close-button/component';
import { UserService } from 'app/core/user/user.service';
import { resolveFileUrl } from 'helper/shared/file-url';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import { AdminService, AdminUser, AdminUserInvitation, InviteUserPayload } from '../admin.service';

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
    templateUrl: './template.html',
    styleUrl: './style.scss',
})
export class UserManagementComponent implements OnInit {
    private readonly _adminService = inject(AdminService);
    private readonly _userService = inject(UserService, { optional: true });
    private readonly _fb = inject(FormBuilder);
    private readonly _snackbar = inject(SnackbarService, { optional: true });

    // Active sub-view ('users' = Staff list, 'invitations' = Gmail invitations list)
    activeView = signal<'users' | 'invitations'>('users');

    currentUser = signal<any>(null);
    users = signal<AdminUser[]>([]);
    loading = signal<boolean>(true);
    searchQuery = signal<string>('');
    selectedRole = signal<string>('all');
    selectedDepartment = signal<string>('all');
    selectedStatus = signal<string>('all');
    sortBy = signal<'name_asc' | 'name_desc' | 'default'>('default');
    isFilterOpen = signal<boolean>(false);

    // Gmail Invitations state
    invitations = signal<AdminUserInvitation[]>([]);
    loadingInvitations = signal<boolean>(false);
    isInviteModalOpen = signal<boolean>(false);
    inviting = signal<boolean>(false);
    inviteForm: FormGroup;
    inviteSearchQuery = signal<string>('');
    inviteStatusFilter = signal<string>('all');
    resendingId = signal<string | null>(null);
    revokingId = signal<string | null>(null);
    copiedInviteId = signal<string | null>(null);

    pendingInvitationsCount = computed(() =>
        this.invitations().filter((i) => i.status === 'pending').length
    );

    filteredInvitations = computed(() => {
        let list = this.invitations();
        const search = this.inviteSearchQuery().toLowerCase().trim();
        const status = this.inviteStatusFilter();

        if (search) {
            list = list.filter(
                (i) =>
                    i.email.toLowerCase().includes(search) ||
                    (i.name && i.name.toLowerCase().includes(search)) ||
                    (i.role && i.role.toLowerCase().includes(search)) ||
                    (i.department && i.department.toLowerCase().includes(search)),
            );
        }

        if (status !== 'all') {
            list = list.filter((i) => i.status === status);
        }

        return list;
    });

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
            password: ['', [Validators.minLength(6)]],
            role: ['', [Validators.required]],
            department: ['', [Validators.required]],
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

        this.inviteForm = this._fb.group({
            email: ['', [Validators.required, Validators.email]],
            name: [''],
            role: ['Member', [Validators.required]],
            department: ['ព័ត៌មានវិទ្យា (IT)', [Validators.required]],
            position: ['Staff', [Validators.required]],
            note: [''],
        });
    }

    hasCustomAvatar(): boolean {
        const val = this.userForm.get('avatar')?.value;
        if (!val || typeof val !== 'string') return false;
        const trimmed = val.trim();
        return trimmed.length > 0 && !trimmed.includes('placeholder/avatar.jpg');
    }

    onAvatarSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const file = input.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                this.userForm.patchValue({ avatar: e.target?.result as string });
                input.value = '';
            };
            reader.readAsDataURL(file);
        }
    }

    removeAvatar(): void {
        this.userForm.patchValue({ avatar: '' });
    }

    getUserAvatar(user: AdminUser | null | undefined): string | null {
        if (!user || (user as any)._avatarFailed) {
            return null;
        }

        // 1. Direct user uploaded avatar
        if (user.avatar && typeof user.avatar === 'string' && user.avatar.trim() && !user.avatar.includes('placeholder') && !user.avatar.includes('portrait')) {
            const resolved = resolveFileUrl(user.avatar);
            if (resolved && !resolved.includes('placeholder') && !resolved.includes('portrait')) {
                return resolved;
            }
        }

        // 2. Fallback: match currently logged in user if this row is strictly the current user with genuine uploaded avatar
        const cur = this.currentUser();
        if (cur && cur.avatar) {
            const curId = cur.id ? Number(cur.id) : null;
            const userId = user.id ? Number(user.id) : null;
            const curPhone = (cur.phone || '').replace(/\D/g, '');
            const userPhone = (user.phone || '').replace(/\D/g, '');
            const isMatch = Boolean(
                (curId && userId && curId === userId) ||
                (!curId && !userId && curPhone && userPhone && curPhone === userPhone)
            );
            if (isMatch) {
                const curAvatar = resolveFileUrl(cur.avatar);
                if (curAvatar && !curAvatar.includes('placeholder') && !curAvatar.includes('portrait')) {
                    return curAvatar;
                }
            }
        }

        // 3. If account has not yet uploaded profile, return null to show stylish initials badge
        return null;
    }

    onAvatarError(event: Event, user: AdminUser): void {
        if (user) {
            (user as any)._avatarFailed = true;
            this.users.update((list) => [...list]);
        }
    }

    toggleArchiveView(): void {
        if (this.selectedStatus() === 'inactive') {
            this.selectedStatus.set('all');
        } else {
            this.selectedStatus.set('inactive');
        }
    }

    getDrawerAvatarUrl(): string {
        const val = this.userForm.get('avatar')?.value;
        if (!val) return '/images/placeholder/avatar.jpg';
        return resolveFileUrl(val) || '/images/placeholder/avatar.jpg';
    }

    onDrawerAvatarError(event: Event): void {
        const target = event.target as HTMLImageElement;
        if (target && !target.src.includes('placeholder')) {
            target.src = '/images/placeholder/avatar.jpg';
        }
    }

    ngOnInit(): void {
        this.currentUser.set(this._userService?.getUser() || null);
        this._userService?.user$?.subscribe((u) => {
            if (u) this.currentUser.set(u);
        });
        this.loadUsers();
        this.loadInvitations();
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

    readonly departmentList = [
        'ព័ត៌មានវិទ្យា (IT)',
        'គ្រប់គ្រងគម្រោង (PMO)',
        'រចនា និងបទពិសោធន៍ (UI/UX)',
        'ទីផ្សារ និងទំនាក់ទំនង (Marketing)',
        'គណនេយ្យ និងហិរញ្ញវត្ថុ (Finance)',
        'ធនធានមនុស្ស (HR)',
    ];

    openCreateDrawer(): void {
        this.isEditing.set(false);
        this.selectedUser.set(null);
        this.showPassword.set(false);
        this.userForm.reset({
            name_kh: '',
            name_en: '',
            email: '',
            phone: '',
            password: '',
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

        if (formVal.avatar && (typeof formVal.avatar !== 'string' || formVal.avatar.includes('placeholder'))) {
            formVal.avatar = null;
        }

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
                    this._snackbar?.success('បានកែប្រែព័ត៌មានអ្នកប្រើប្រាស់ដោយជោគជ័យ');
                },
                error: (err) => {
                    console.error('Failed to update user on server:', err);
                    this.saving.set(false);
                    this._snackbar?.error(err?.error?.message || 'បរាជ័យក្នុងការកែប្រែព័ត៌មានអ្នកប្រើប្រាស់');
                },
            });
        } else {
            if (formVal.password) {
                formVal.password = formVal.password.trim();
            } else {
                delete formVal.password;
            }

            if (!formVal.avatar || !formVal.avatar.trim() || formVal.avatar.includes('placeholder')) {
                formVal.avatar = null;
            }

            this._adminService.createUser(formVal).subscribe({
                next: (res) => {
                    this.users.update((list) => [res.data, ...list]);
                    this.saving.set(false);
                    this.closeDrawer();
                    this._snackbar?.success('បានបង្កើតគណនីអ្នកប្រើប្រាស់ថ្មីដោយជោគជ័យ');
                },
                error: (err) => {
                    console.error('Failed to create user on server:', err);
                    this.saving.set(false);
                    this._snackbar?.error(err?.error?.message || 'បរាជ័យក្នុងការបង្កើតគណនីអ្នកប្រើប្រាស់');
                },
            });
        }
    }

    toggleStatus(user: AdminUser): void {
        const prevActive = user.is_active;
        const nextActive = user.is_active === 1 ? 0 : 1;
        // Optimistic update
        this.users.update((list) =>
            list.map((u) => (u.id === user.id ? { ...u, is_active: nextActive } : u)),
        );

        this._adminService.toggleUserStatus(user.id).subscribe({
            next: (res) => {
                if (res.data) {
                    this.users.update((list) =>
                        list.map((u) => (u.id === res.data.id ? res.data : u)),
                    );
                }
                this._snackbar?.success(`បានផ្លាស់ប្តូរស្ថានភាពទៅជា ${nextActive === 1 ? 'សកម្ម' : 'អសកម្ម'}`);
            },
            error: (err) => {
                console.error('Failed to toggle status on server:', err);
                this.users.update((list) =>
                    list.map((u) => (u.id === user.id ? { ...u, is_active: prevActive } : u)),
                );
                this._snackbar?.error('បរាជ័យក្នុងការផ្លាស់ប្តូរស្ថានភាព');
            },
        });
    }

    confirmDelete(user: AdminUser): void {
        this.deleteTarget.set(user);
        this.showDeleteModal.set(true);
    }

    deleteUser(): void {
        const target = this.deleteTarget();
        if (!target) return;

        const previousList = this.users();
        this.users.update((list) => list.filter((u) => u.id !== target.id));
        this.showDeleteModal.set(false);
        this.deleteTarget.set(null);

        this._adminService.deleteUser(target.id).subscribe({
            next: () => {
                this._snackbar?.success('បានលុបគណនីអ្នកប្រើប្រាស់ដោយជោគជ័យ');
            },
            error: (err) => {
                console.error('Failed to delete user:', err);
                this.users.set(previousList);
                this._snackbar?.error(err?.error?.message || 'បរាជ័យក្នុងការលុបគណនីអ្នកប្រើប្រាស់');
            },
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

    // ==========================================
    // INVITATION ACTIONS & HELPERS
    // ==========================================
    setActiveView(view: 'users' | 'invitations'): void {
        this.activeView.set(view);
        if (view === 'invitations' && this.invitations().length === 0) {
            this.loadInvitations();
        }
    }

    openInviteModal(): void {
        this.inviteForm.reset({
            email: '',
            name: '',
            role: 'Member',
            department: 'ព័ត៌មានវិទ្យា (IT)',
            position: 'Staff',
            note: '',
        });
        this.isInviteModalOpen.set(true);
    }

    closeInviteModal(): void {
        this.isInviteModalOpen.set(false);
    }

    submitInvite(): void {
        if (this.inviteForm.invalid) {
            this.inviteForm.markAllAsTouched();
            return;
        }

        this.inviting.set(true);
        const formVal = this.inviteForm.value;
        const payload: InviteUserPayload = {
            email: (formVal.email || '').trim().toLowerCase(),
            name: (formVal.name || '').trim() || undefined,
            role: formVal.role || 'Member',
            department: formVal.department || undefined,
            position: (formVal.position || '').trim() || undefined,
            note: (formVal.note || '').trim() || undefined,
        };

        this._adminService.inviteUser(payload).subscribe({
            next: (res: any) => {
                this.inviting.set(false);
                if (res?.data && res.data.email_sent === false) {
                    this._snackbar?.warning(res.message || 'បានរក្សាទុកការអញ្ជើញ ប៉ុន្តែការផ្ញើអ៊ីមែលមិនបានជោគជ័យ។ សូមចម្លងតំណភ្ជាប់ផ្ញើដោយផ្ទាល់!');
                } else {
                    this._snackbar?.success(`បានផ្ញើការអញ្ជើញទៅកាន់ ${payload.email} ដោយជោគជ័យ!`);
                }
                this.closeInviteModal();
                this.loadInvitations();
                this.activeView.set('invitations');
            },
            error: (err) => {
                this.inviting.set(false);
                const msg = err.error?.message || err.message || 'បរាជ័យក្នុងការផ្ញើការអញ្ជើញ';
                this._snackbar?.error(msg);
            },
        });
    }

    loadInvitations(): void {
        this.loadingInvitations.set(true);
        this._adminService.getInvitations().subscribe({
            next: (res) => {
                if (res.data) {
                    this.invitations.set(res.data);
                }
                this.loadingInvitations.set(false);
            },
            error: (err) => {
                console.error('Failed to load invitations:', err);
                this.loadingInvitations.set(false);
            },
        });
    }

    resendInvite(inv: AdminUserInvitation): void {
        this.resendingId.set(inv.id);
        this._adminService.resendInvitation(inv.id).subscribe({
            next: () => {
                this.resendingId.set(null);
                this._snackbar?.success(`បានផ្ញើការអញ្ជើញសារជាថ្មីទៅកាន់ ${inv.email} ដោយជោគជ័យ!`);
                this.loadInvitations();
            },
            error: (err) => {
                this.resendingId.set(null);
                const msg = err.error?.message || err.message || 'បរាជ័យក្នុងការផ្ញើឡើងវិញ';
                this._snackbar?.error(msg);
            },
        });
    }

    revokeInvite(inv: AdminUserInvitation): void {
        if (!confirm(`តើអ្នកពិតជាចង់លុបចោលការអញ្ជើញសម្រាប់ ${inv.email} មែនទេ?`)) {
            return;
        }

        this.revokingId.set(inv.id);
        this._adminService.revokeInvitation(inv.id).subscribe({
            next: () => {
                this.revokingId.set(null);
                this._snackbar?.success('បានលុបចោលការអញ្ជើញដោយជោគជ័យ');
                this.invitations.update((list) => list.filter((i) => i.id !== inv.id));
            },
            error: (err) => {
                this.revokingId.set(null);
                const msg = err.error?.message || err.message || 'បរាជ័យក្នុងការលុបចោលការអញ្ជើញ';
                this._snackbar?.error(msg);
            },
        });
    }

    copyInviteLink(inv: AdminUserInvitation): void {
        const link = inv.invite_link || `${window.location.origin}/#/auth/accept-invite?token=${inv.token || inv.id}`;
        navigator.clipboard.writeText(link).then(() => {
            this.copiedInviteId.set(inv.id);
            this._snackbar?.success('បានចម្លងតំណភ្ជាប់អញ្ជើញរួចរាល់!');
            setTimeout(() => this.copiedInviteId.set(null), 3000);
        }).catch(() => {
            this._snackbar?.error('មិនអាចចម្លងតំណភ្ជាប់បានទេ');
        });
    }

    getInvitationStatusBadgeClass(status: string): string {
        switch (status) {
            case 'accepted':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800';
            case 'pending':
                return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800';
            case 'expired':
                return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
            case 'revoked':
                return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800';
            default:
                return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
        }
    }

    getInvitationStatusLabel(status: string): string {
        switch (status) {
            case 'accepted':
                return 'បានទទួល (Accepted)';
            case 'pending':
                return 'រង់ចាំទទួល (Pending)';
            case 'expired':
                return 'ផុតកំណត់ (Expired)';
            case 'revoked':
                return 'បានលុបចោល (Revoked)';
            default:
                return status;
        }
    }
}
