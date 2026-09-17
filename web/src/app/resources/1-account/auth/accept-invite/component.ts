import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from 'app/core/auth/auth.service';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import { AdminService } from 'app/resources/3-admin/admin.service';

export function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirm = control.get('confirm_password')?.value;
    if (password && confirm && password !== confirm) {
        return { passwordMismatch: true };
    }
    return null;
}

@Component({
    selector: 'app-accept-invite',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        RouterLink,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
    ],
    templateUrl: './template.html',
    styleUrl: './style.scss',
})
export class AcceptInviteComponent implements OnInit {
    private readonly _route = inject(ActivatedRoute);
    private readonly _router = inject(Router);
    private readonly _fb = inject(FormBuilder);
    private readonly _adminService = inject(AdminService);
    private readonly _authService = inject(AuthService);
    private readonly _snackbar = inject(SnackbarService, { optional: true });

    token = signal<string>('');
    verifying = signal<boolean>(true);
    verifyError = signal<string | null>(null);
    invitation = signal<any>(null);
    submitting = signal<boolean>(false);
    showPassword = signal<boolean>(false);
    showConfirmPassword = signal<boolean>(false);

    togglePassword(): void {
        this.showPassword.update((v) => !v);
    }

    toggleConfirmPassword(): void {
        this.showConfirmPassword.update((v) => !v);
    }

    form!: FormGroup;

    ngOnInit(): void {
        this.form = this._fb.group(
            {
                email: [{ value: '', disabled: true }],
                name_kh: ['', [Validators.required]],
                name_en: ['', [Validators.required]],
                phone: ['', [Validators.required]],
                password: ['', [Validators.required, Validators.minLength(6)]],
                confirm_password: ['', [Validators.required]],
            },
            { validators: passwordsMatchValidator },
        );

        const token = this._route.snapshot.queryParamMap.get('token');
        if (!token) {
            this.verifyError.set('មិនមាន Token ការអញ្ជើញឡើយ (Invitation token missing)');
            this.verifying.set(false);
            return;
        }

        this.token.set(token);
        this.verifyToken(token);
    }

    verifyToken(token: string): void {
        this.verifying.set(true);
        this.verifyError.set(null);

        this._adminService.verifyInviteToken(token).subscribe({
            next: (res) => {
                this.invitation.set(res.data);
                this.form.patchValue({
                    email: res.data.email,
                    name_kh: res.data.name || '',
                    name_en: res.data.name || '',
                });
                this.verifying.set(false);
            },
            error: (err) => {
                console.error('Failed to verify invite token:', err);
                const msg =
                    err.error?.message ||
                    'តំណភ្ជាប់ការអញ្ជើញមិនត្រឹមត្រូវ ឬបានផុតកំណត់ហើយ។ សូមទាក់ទងរដ្ឋបាលដើម្បីទទួលបានការអញ្ជើញសារជាថ្មី។';
                this.verifyError.set(msg);
                this.verifying.set(false);
            },
        });
    }

    submit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.submitting.set(true);
        const formVal = this.form.getRawValue();

        const payload = {
            token: this.token(),
            password: formVal.password.trim(),
            name_kh: formVal.name_kh.trim(),
            name_en: formVal.name_en.trim(),
            phone: formVal.phone.trim(),
        };

        this._adminService.acceptInvite(payload).subscribe({
            next: (res) => {
                this._snackbar?.success('សូមស្វាគមន៍! ការបង្កើតគណនីបានជោគជ័យ');

                if (res.data && res.data.token) {
                    this._authService.applySession(res.data);
                }

                // Redirect user based on assigned role
                const role = (this.invitation()?.role || '').toLowerCase();
                setTimeout(() => {
                    if (role.includes('admin') || role.includes('super')) {
                        this._router.navigateByUrl('/admin/dashboard');
                    } else {
                        this._router.navigateByUrl('/user/home');
                    }
                }, 800);
            },
            error: (err) => {
                this.submitting.set(false);
                const msg = err.error?.message || err.message || 'បរាជ័យក្នុងការទទួលការអញ្ជើញ';
                this._snackbar?.error(msg);
            },
        });
    }

    getRoleBadgeClass(role: string): string {
        switch (role?.toLowerCase()?.trim()) {
            case 'super admin':
            case 'superadmin':
                return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300';
            case 'admin':
                return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300';
            case 'manager':
                return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300';
            case 'team lead':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300';
            default:
                return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300';
        }
    }
}
