import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AdminService, AdminSettingsData } from '../admin.service';

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
    ],
    templateUrl: './admin-settings.component.html',
    styles: [`
        :host {
            display: block;
            font-family: 'Kantumruy Pro', sans-serif !important;
            font-size: 16px;
        }
    `],
})
export class AdminSettingsComponent implements OnInit {
    private readonly _adminService = inject(AdminService);
    private readonly _fb = inject(FormBuilder);

    settings = signal<AdminSettingsData | null>(null);
    loading = signal<boolean>(true);
    saving = signal<boolean>(false);
    saveSuccess = signal<boolean>(false);

    settingsForm: FormGroup;
    newCategoryInput = signal<string>('');

    // Department modal
    showDeptModal = signal<boolean>(false);
    deptForm: FormGroup;

    constructor() {
        this.settingsForm = this._fb.group({
            organization_name_kh: ['', [Validators.required]],
            organization_name_en: ['', [Validators.required]],
            code: [{ value: '', disabled: true }],
            domain: [{ value: '', disabled: true }],
        });

        this.deptForm = this._fb.group({
            name_kh: ['', [Validators.required]],
            name_en: ['', [Validators.required]],
            head: ['', [Validators.required]],
            member_count: [1, [Validators.min(1)]],
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
                    this.settingsForm.patchValue({
                        organization_name_kh: res.data.organization_name_kh,
                        organization_name_en: res.data.organization_name_en,
                        code: res.data.code,
                        domain: res.data.domain,
                    });
                }
                this.loading.set(false);
            },
            error: () => this.loading.set(false),
        });
    }

    addCategory(): void {
        const val = this.newCategoryInput().trim();
        if (!val || !this.settings()) return;

        const currentCats = this.settings()!.work_categories || [];
        if (!currentCats.includes(val)) {
            const updated = [...currentCats, val];
            this.settings.update((s) => s ? { ...s, work_categories: updated } : null);
            this.newCategoryInput.set('');
        }
    }

    removeCategory(cat: string): void {
        if (!this.settings()) return;
        const updated = (this.settings()!.work_categories || []).filter((c) => c !== cat);
        this.settings.update((s) => s ? { ...s, work_categories: updated } : null);
    }

    openAddDeptModal(): void {
        this.deptForm.reset({ member_count: 1 });
        this.showDeptModal.set(true);
    }

    saveDepartment(): void {
        if (this.deptForm.invalid || !this.settings()) return;

        const formVal = this.deptForm.value;
        const newDept = {
            id: `dept-${Date.now()}`,
            name_kh: formVal.name_kh,
            name_en: formVal.name_en,
            head: formVal.head,
            member_count: formVal.member_count,
        };

        const updated = [...(this.settings()!.departments || []), newDept];
        this.settings.update((s) => s ? { ...s, departments: updated } : null);
        this.showDeptModal.set(false);
    }

    removeDepartment(id: string): void {
        if (!this.settings()) return;
        const updated = (this.settings()!.departments || []).filter((d) => d.id !== id);
        this.settings.update((s) => s ? { ...s, departments: updated } : null);
    }

    saveAllSettings(): void {
        if (this.settingsForm.invalid || !this.settings()) return;

        this.saving.set(true);
        const formVal = this.settingsForm.value;

        const payload: Partial<AdminSettingsData> = {
            organization_name_kh: formVal.organization_name_kh,
            organization_name_en: formVal.organization_name_en,
            departments: this.settings()!.departments,
            work_categories: this.settings()!.work_categories,
        };

        this._adminService.updateSettings(payload).subscribe({
            next: (res) => {
                this.settings.set(res.data);
                this.saving.set(false);
                this.saveSuccess.set(true);
                setTimeout(() => this.saveSuccess.set(false), 3000);
            },
            error: (err) => {
                console.error('Failed to save settings:', err);
                this.saving.set(false);
            },
        });
    }
}
