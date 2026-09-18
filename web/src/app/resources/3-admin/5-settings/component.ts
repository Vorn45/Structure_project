import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

import { SideDialogCloseButtonComponent } from 'app/shared/side-dialog-close-button/component';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import { AdminService, AdminSettingsData } from '../admin.service';

export interface DepartmentItem {
    id: string;
    name_kh: string;
    name_en: string;
    head: string;
    member_count: number;
}

@Component({
    selector: 'app-admin-settings',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatIconModule,
        MatButtonModule,
        MatTooltipModule,
        SideDialogCloseButtonComponent,
    ],
    templateUrl: './template.html',
    styleUrl: './style.scss',
    styles: [`
        :host {
            display: block;
            font-family: 'Kantumruy Pro', sans-serif !important;
            font-size: 16px;
        }
        :host *, :host ::ng-deep * {
            font-family: 'Kantumruy Pro', sans-serif !important;
        }
        input, select, textarea, button, label, span, p, div, table, th, td, h1, h2, h3 {
            font-family: 'Kantumruy Pro', sans-serif !important;
        }
    `],
})
export class AdminSettingsComponent implements OnInit {
    private readonly _adminService = inject(AdminService);
    private readonly _snackbar = inject(SnackbarService);
    private readonly _fb = inject(FormBuilder);

    settings = signal<AdminSettingsData | null>(null);
    orgLogo = signal<string | null>(null);
    loading = signal<boolean>(true);
    saving = signal<boolean>(false);
    saveSuccess = signal<boolean>(false);

    settingsForm!: FormGroup;
    newCategoryInput = signal<string>('');

    // Department modal (Add / Edit)
    showDeptModal = signal<boolean>(false);
    isEditingDept = signal<boolean>(false);
    editingDeptId = signal<string | null>(null);
    deptForm!: FormGroup;

    // Delete Department Modal
    deleteDeptModalOpen = signal<boolean>(false);
    deptToDelete = signal<DepartmentItem | null>(null);

    // Active sub-tab in settings
    activeSubTab = signal<'general' | 'departments' | 'categories' | 'preferences'>('general');

    // Category suggestions
    readonly suggestedCategories = [
        'អភិវឌ្ឍន៍បច្ចេកវិទ្យា',
        'រចនាផលិតផល UI/UX',
        'ហេដ្ឋារចនាសម្ព័ន្ធ Cloud',
        'សន្តិសុខព័ត៌មាន (Cybersecurity)',
        'គ្រប់គ្រងគម្រោង (PMO)',
        'ទីផ្សារឌីជីថល (Marketing)',
        'ធនធានមនុស្ស (HR)',
        'គណនេយ្យ និងហិរញ្ញវត្ថុ',
    ];

    constructor() {
        this.initForms();
    }

    private initForms(): void {
        this.settingsForm = this._fb.group({
            organization_name_kh: ['', [Validators.required]],
            organization_name_en: ['', [Validators.required]],
            code: [{ value: '', disabled: true }],
            domain: [{ value: '', disabled: true }],
            contact_email: ['support@digitech.com.kh', [Validators.email]],
            contact_phone: ['010 843 612'],
            address: ['អគារពាណិជ្ជកម្មកោះពេជ្រ រាជធានីភ្នំពេញ កម្ពុជា'],
            currency: ['USD ($)'],
            timezone: ['Asia/Phnom_Penh (GMT+7)'],
            primary_color: ['#2563eb'],
            allow_mobile_checkin: [true],
            auto_notify_telegram: [true],
        });

        this.deptForm = this._fb.group({
            name_kh: ['', [Validators.required]],
            name_en: ['', [Validators.required]],
            head: ['', [Validators.required]],
            member_count: [1, [Validators.required, Validators.min(1)]],
        });
    }

    ngOnInit(): void {
        this.loadSettings();
    }

    loadSettings(): void {
        this.loading.set(true);
        this._adminService.getSettings().subscribe({
            next: (res) => {
                if (res.data) {
                    this.settings.set(res.data);
                    this.orgLogo.set(res.data.logo || null);
                    this.settingsForm.patchValue({
                        organization_name_kh: res.data.organization_name_kh || '',
                        organization_name_en: res.data.organization_name_en || '',
                        code: res.data.code || 'DIGITECH-HQ',
                        domain: res.data.domain || 'pms.digitech.com.kh',
                        contact_email: res.data.contact_email || 'support@digitech.com.kh',
                        contact_phone: res.data.contact_phone || '010 843 612',
                        address: res.data.address || 'អគារពាណិជ្ជកម្មកោះពេជ្រ រាជធានីភ្នំពេញ កម្ពុជា',
                        currency: res.data.currency || 'USD ($)',
                        timezone: res.data.timezone || 'Asia/Phnom_Penh (GMT+7)',
                        primary_color: res.data.primary_color || '#2563eb',
                        allow_mobile_checkin: res.data.preferences?.allow_mobile_checkin ?? true,
                        auto_notify_telegram: res.data.preferences?.auto_notify_telegram ?? true,
                    });
                }
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Failed to load settings:', err);
                this.loading.set(false);
            },
        });
    }

    onLogoSelected(event: Event): void {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                this._snackbar.error('ទំហំរូបភាពមិនត្រូវលើសពី 2MB ឡើយ');
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                this.orgLogo.set(e.target?.result as string);
                this._snackbar.success('បានជ្រើសរើសរូបសញ្ញាថ្មី សូមចុចរក្សាទុកការកំណត់');
            };
            reader.readAsDataURL(file);
        }
    }

    removeLogo(): void {
        this.orgLogo.set(null);
        this._snackbar.info('បានលុបរូបសញ្ញា សូមចុចរក្សាទុកការកំណត់');
    }

    // Work categories methods
    addCategory(name?: string): void {
        const val = (name || this.newCategoryInput()).trim();
        if (!val || !this.settings()) return;

        const currentCats = this.settings()!.work_categories || [];
        if (!currentCats.includes(val)) {
            const updated = [...currentCats, val];
            this.settings.update((s) => s ? { ...s, work_categories: updated } : null);
            this.newCategoryInput.set('');
            this._snackbar.success(`បានបន្ថែមស្លាក "${val}"`);
        } else {
            this._snackbar.warning(`ស្លាក "${val}" មានរួចហើយ`);
        }
    }

    removeCategory(cat: string): void {
        if (!this.settings()) return;
        const updated = (this.settings()!.work_categories || []).filter((c) => c !== cat);
        this.settings.update((s) => s ? { ...s, work_categories: updated } : null);
        this._snackbar.info(`បានដកចេញស្លាក "${cat}"`);
    }

    // Department modal methods (Add & Edit)
    openAddDeptModal(): void {
        this.isEditingDept.set(false);
        this.editingDeptId.set(null);
        this.deptForm.reset({
            name_kh: '',
            name_en: '',
            head: '',
            member_count: 1,
        });
        this.showDeptModal.set(true);
    }

    openEditDeptModal(dept: DepartmentItem): void {
        this.isEditingDept.set(true);
        this.editingDeptId.set(dept.id);
        this.deptForm.patchValue({
            name_kh: dept.name_kh,
            name_en: dept.name_en,
            head: dept.head,
            member_count: dept.member_count,
        });
        this.showDeptModal.set(true);
    }

    saveDepartment(): void {
        if (this.deptForm.invalid || !this.settings()) {
            this.deptForm.markAllAsTouched();
            return;
        }

        const formVal = this.deptForm.value;
        const currentDepts = this.settings()!.departments || [];

        if (this.isEditingDept() && this.editingDeptId()) {
            const id = this.editingDeptId()!;
            const updated = currentDepts.map((d) =>
                d.id === id
                    ? {
                          ...d,
                          name_kh: formVal.name_kh,
                          name_en: formVal.name_en,
                          head: formVal.head,
                          member_count: formVal.member_count,
                      }
                    : d,
            );
            this.settings.update((s) => s ? { ...s, departments: updated } : null);
            this._snackbar.success(`បានកែប្រែនាយកដ្ឋាន "${formVal.name_kh}"`);
        } else {
            const newDept: DepartmentItem = {
                id: `dept-${Date.now()}`,
                name_kh: formVal.name_kh,
                name_en: formVal.name_en,
                head: formVal.head,
                member_count: formVal.member_count,
            };
            const updated = [...currentDepts, newDept];
            this.settings.update((s) => s ? { ...s, departments: updated } : null);
            this._snackbar.success(`បានបន្ថែមនាយកដ្ឋាន "${newDept.name_kh}"`);
        }

        this.showDeptModal.set(false);
    }

    confirmDeleteDepartment(dept: DepartmentItem): void {
        this.deptToDelete.set(dept);
        this.deleteDeptModalOpen.set(true);
    }

    submitDeleteDepartment(): void {
        const dept = this.deptToDelete();
        if (!dept || !this.settings()) return;

        const updated = (this.settings()!.departments || []).filter((d) => d.id !== dept.id);
        this.settings.update((s) => s ? { ...s, departments: updated } : null);
        this.deleteDeptModalOpen.set(false);
        this.deptToDelete.set(null);
        this._snackbar.success(`បានលុបនាយកដ្ឋាន "${dept.name_kh}"`);
    }

    // Save All Settings
    saveAllSettings(): void {
        if (this.settingsForm.invalid || !this.settings()) {
            this.settingsForm.markAllAsTouched();
            this._snackbar.error('សូមបំពេញព័ត៌មានចាំបាច់ឱ្យបានគ្រប់គ្រាន់');
            return;
        }

        this.saving.set(true);
        const formVal = this.settingsForm.getRawValue();

        const payload: Partial<AdminSettingsData> = {
            organization_name_kh: formVal.organization_name_kh,
            organization_name_en: formVal.organization_name_en,
            code: formVal.code,
            domain: formVal.domain,
            departments: this.settings()!.departments,
            work_categories: this.settings()!.work_categories,
            logo: this.orgLogo(),
            contact_email: formVal.contact_email,
            contact_phone: formVal.contact_phone,
            address: formVal.address,
            currency: formVal.currency,
            timezone: formVal.timezone,
            primary_color: formVal.primary_color,
            preferences: {
                allow_mobile_checkin: formVal.allow_mobile_checkin,
                auto_notify_telegram: formVal.auto_notify_telegram,
            },
        };

        this._adminService.updateSettings(payload).subscribe({
            next: (res) => {
                this.settings.set(res.data);
                this.saving.set(false);
                this.saveSuccess.set(true);
                setTimeout(() => this.saveSuccess.set(false), 3000);
                this._snackbar.success('បានរក្សាទុកការកំណត់អង្គភាពដោយជោគជ័យ');
            },
            error: (err) => {
                console.error('Failed to save settings:', err);
                this.saving.set(false);
                this._snackbar.error('បរាជ័យក្នុងការរក្សាទុកការកំណត់');
            },
        });
    }
}

