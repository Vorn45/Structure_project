import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { SideDialogCloseButtonComponent } from 'app/shared/side-dialog-close-button/component';
import { AdminService, AdminClient } from '../admin.service';

@Component({
    selector: 'app-client-management',
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
    templateUrl: './client-management.component.html',
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
export class ClientManagementComponent implements OnInit {
    private readonly _adminService = inject(AdminService);
    private readonly _fb = inject(FormBuilder);

    clients = signal<AdminClient[]>([]);
    loading = signal<boolean>(true);
    searchQuery = signal<string>('');
    selectedStatus = signal<string>('all');
    selectedIndustry = signal<string>('all');
    sortBy = signal<'name_asc' | 'name_desc' | 'default'>('default');
    isFilterOpen = signal<boolean>(false);

    // Drawer state
    isDrawerOpen = signal<boolean>(false);
    isEditing = signal<boolean>(false);
    selectedClient = signal<AdminClient | null>(null);
    clientForm: FormGroup;
    saving = signal<boolean>(false);

    // Delete confirmation
    deleteTarget = signal<AdminClient | null>(null);
    showDeleteModal = signal<boolean>(false);

    readonly statusList = [
        { key: 'active', label: 'សកម្ម', color: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' },
        { key: 'contracted', label: 'មានកិច្ចសន្យា', color: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800' },
        { key: 'lead', label: 'សក្ដានុពល', color: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800' },
        { key: 'inactive', label: 'អសកម្ម', color: 'text-slate-600 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' },
    ];

    readonly industries = computed(() =>
        ['all', ...new Set(this.clients().map((c) => c.industry).filter(Boolean))],
    );

    hasActiveFilters = computed(() => {
        return (
            this.selectedStatus() !== 'all' ||
            this.selectedIndustry() !== 'all' ||
            this.sortBy() !== 'default'
        );
    });

    filteredClients = computed(() => {
        let list = this.clients();
        const search = this.searchQuery().toLowerCase().trim();
        const status = this.selectedStatus();
        const industry = this.selectedIndustry();
        const sort = this.sortBy();

        if (search) {
            list = list.filter(
                (c) =>
                    c.company_name?.toLowerCase().includes(search) ||
                    c.name_kh?.toLowerCase().includes(search) ||
                    c.name_en?.toLowerCase().includes(search) ||
                    c.email?.toLowerCase().includes(search) ||
                    c.phone?.includes(search) ||
                    c.contact_person?.toLowerCase().includes(search) ||
                    c.industry?.toLowerCase().includes(search),
            );
        }

        if (status !== 'all') {
            list = list.filter((c) => c.status === status);
        }

        if (industry !== 'all') {
            list = list.filter((c) => c.industry?.toLowerCase().includes(industry.toLowerCase()));
        }

        if (sort === 'name_asc') {
            list = [...list].sort((a, b) => (a.company_name || a.name_kh).localeCompare(b.company_name || b.name_kh, 'km'));
        } else if (sort === 'name_desc') {
            list = [...list].sort((a, b) => (b.company_name || b.name_kh).localeCompare(a.company_name || a.name_kh, 'km'));
        }

        return list;
    });

    constructor() {
        this.clientForm = this._fb.group({
            company_name: ['', [Validators.required]],
            name_kh: [''],
            name_en: [''],
            industry: ['ធនាគារ និងហិរញ្ញវត្ថុ (Banking & Finance)', [Validators.required]],
            contact_person: ['', [Validators.required]],
            contact_phone: [''],
            contact_email: [''],
            phone: [''],
            email: [''],
            website: [''],
            address: [''],
            status: ['active', [Validators.required]],
            projects_count: [0, [Validators.min(0)]],
            logo: [''],
            note: [''],
        });
    }

    ngOnInit(): void {
        this.loadClients();
    }

    loadClients(): void {
        this.loading.set(true);
        this._adminService.getClients().subscribe({
            next: (res) => {
                if (res.data && res.data.results) {
                    this.clients.set(res.data.results);
                }
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Failed to load clients:', err);
                this.loading.set(false);
            },
        });
    }

    toggleFilterBar(): void {
        this.isFilterOpen.update((v) => !v);
    }

    resetFilters(): void {
        this.selectedStatus.set('all');
        this.selectedIndustry.set('all');
        this.sortBy.set('default');
    }

    setSort(sort: 'name_asc' | 'name_desc' | 'default'): void {
        this.sortBy.set(sort);
    }

    openCreateDrawer(): void {
        this.isEditing.set(false);
        this.selectedClient.set(null);
        this.clientForm.reset({
            company_name: '',
            name_kh: '',
            name_en: '',
            industry: 'ធនាគារ និងហិរញ្ញវត្ថុ (Banking & Finance)',
            contact_person: '',
            contact_phone: '',
            contact_email: '',
            phone: '',
            email: '',
            website: '',
            address: '',
            status: 'active',
            projects_count: 0,
            logo: '',
            note: '',
        });
        this.isDrawerOpen.set(true);
    }

    openEditDrawer(client: AdminClient): void {
        this.isEditing.set(true);
        this.selectedClient.set(client);
        this.clientForm.patchValue({
            company_name: client.company_name,
            name_kh: client.name_kh,
            name_en: client.name_en,
            industry: client.industry,
            contact_person: client.contact_person,
            contact_phone: client.contact_phone || client.phone,
            contact_email: client.contact_email || client.email,
            phone: client.phone,
            email: client.email,
            website: client.website,
            address: client.address,
            status: client.status,
            projects_count: client.projects_count,
            logo: client.logo || '',
            note: client.note || '',
        });
        this.isDrawerOpen.set(true);
    }

    closeDrawer(): void {
        this.isDrawerOpen.set(false);
        this.selectedClient.set(null);
    }

    onLogoSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const file = input.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                this.clientForm.patchValue({ logo: e.target?.result as string });
            };
            reader.readAsDataURL(file);
        }
    }

    removeLogo(): void {
        this.clientForm.patchValue({ logo: '' });
    }

    submitClientForm(): void {
        if (this.clientForm.invalid) {
            this.clientForm.markAllAsTouched();
            return;
        }

        this.saving.set(true);
        const formVal = { ...this.clientForm.value };
        if (formVal.email) formVal.email = formVal.email.trim();
        if (formVal.phone) formVal.phone = formVal.phone.trim();
        if (!formVal.name_kh) formVal.name_kh = formVal.company_name;
        if (!formVal.name_en) formVal.name_en = formVal.company_name;

        if (this.isEditing() && this.selectedClient()) {
            const currentId = this.selectedClient()!.id;
            this._adminService.updateClient(currentId, formVal).subscribe({
                next: (res) => {
                    this.clients.update((list) =>
                        list.map((c) => (c.id === res.data.id ? res.data : c)),
                    );
                    this.saving.set(false);
                    this.closeDrawer();
                },
                error: (err) => {
                    console.warn('Backend updateClient error, updating locally:', err);
                    this.clients.update((list) =>
                        list.map((c) => (c.id === currentId ? { ...c, ...formVal } : c)),
                    );
                    this.saving.set(false);
                    this.closeDrawer();
                },
            });
        } else {
            this._adminService.createClient(formVal).subscribe({
                next: (res) => {
                    this.clients.update((list) => [res.data, ...list]);
                    this.saving.set(false);
                    this.closeDrawer();
                },
                error: (err) => {
                    console.warn('Backend createClient error, creating locally:', err);
                    const newClient: AdminClient = {
                        id: Date.now(),
                        company_name: formVal.company_name,
                        name_kh: formVal.name_kh,
                        name_en: formVal.name_en,
                        industry: formVal.industry,
                        contact_person: formVal.contact_person,
                        contact_phone: formVal.contact_phone,
                        contact_email: formVal.contact_email,
                        phone: formVal.phone,
                        email: formVal.email,
                        website: formVal.website,
                        address: formVal.address,
                        status: formVal.status || 'active',
                        projects_count: formVal.projects_count || 0,
                        logo: formVal.logo || '',
                        note: formVal.note || '',
                        created_at: new Date().toISOString(),
                    };
                    this.clients.update((list) => [newClient, ...list]);
                    this.saving.set(false);
                    this.closeDrawer();
                },
            });
        }
    }

    toggleStatus(client: AdminClient): void {
        const nextStatus = client.status === 'active' ? 'inactive' : 'active';
        this.clients.update((list) =>
            list.map((c) => (c.id === client.id ? { ...c, status: nextStatus } : c)),
        );
        this._adminService.toggleClientStatus(client.id).subscribe({
            next: (res) => {
                if (res?.data) {
                    this.clients.update((list) =>
                        list.map((c) => (c.id === res.data.id ? res.data : c)),
                    );
                }
            },
            error: (err) => {
                console.warn('Backend toggleClientStatus error, kept local status update:', err);
            },
        });
    }

    confirmDelete(client: AdminClient): void {
        this.deleteTarget.set(client);
        this.showDeleteModal.set(true);
    }

    deleteClient(): void {
        const target = this.deleteTarget();
        if (!target) return;

        this.clients.update((list) => list.filter((c) => c.id !== target.id));
        this.showDeleteModal.set(false);
        this.deleteTarget.set(null);

        this._adminService.deleteClient(target.id).subscribe({
            next: () => {},
            error: (err) => console.warn('Backend deleteClient error, deleted locally:', err),
        });
    }

    getStatusKhmer(status: string): string {
        switch (status?.toLowerCase()) {
            case 'active':
                return 'សកម្ម';
            case 'contracted':
                return 'មានកិច្ចសន្យា';
            case 'lead':
                return 'សក្ដានុពល';
            case 'inactive':
                return 'អសកម្ម';
            default:
                return status || 'សកម្ម';
        }
    }

    getStatusBadgeClass(status: string): string {
        switch (status?.toLowerCase()) {
            case 'active':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
            case 'contracted':
                return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
            case 'lead':
                return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
            case 'inactive':
                return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
            default:
                return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
        }
    }

    getIndustryBadgeClass(industry: string): string {
        const ind = (industry || '').toLowerCase();
        if (ind.includes('bank') || ind.includes('ធនាគារ') || ind.includes('fintech')) {
            return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800';
        }
        if (ind.includes('retail') || ind.includes('ពាណិជ្ជកម្ម') || ind.includes('estate')) {
            return 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800';
        }
        if (ind.includes('gov') || ind.includes('សាធារណៈ') || ind.includes('util')) {
            return 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800';
        }
        if (ind.includes('f&b') || ind.includes('ផលិតកម្ម') || ind.includes('beverage')) {
            return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
        }
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }

    getClientInitials(client: AdminClient): string {
        const name = client.company_name || client.name_en || client.name_kh || 'CL';
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    }
}
