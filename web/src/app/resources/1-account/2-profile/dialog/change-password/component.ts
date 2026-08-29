import { Component, Inject, signal, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { Observable, startWith, Subject, takeUntil } from 'rxjs';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { DialogConfigService } from 'app/shared/dialog-config.service';
import { ErrorHandleService } from 'app/shared/error-handle.service';
import { SideDialogCloseButtonComponent } from 'app/shared/side-dialog-close-button/component';
import { GeneratePasswordComponent } from 'app/shared/generate-password/component';
import { AuthService } from 'app/core/auth/auth.service';
import { UserService } from 'app/core/user/user.service';
import { ProfileService } from '../../profile.service';
import { PasswordLastChange } from '../../profile.type';
import { AuthOTPCodeComponent } from 'app/resources/1-account/login-code/otp-code';

@Component({
    selector: 'change-password-profile',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: './style.scss',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
        TranslocoModule,
        SideDialogCloseButtonComponent,
        AuthOTPCodeComponent
    ],
})
export class ChangePasswordProfileComponent implements OnInit, OnDestroy {

    @ViewChild('otpComp') public otpComp?: AuthOTPCodeComponent;

    private destroy$ = new Subject<void>();

    public form = new FormGroup({
        newPassword: new FormControl('', [Validators.required, Validators.minLength(6)]),
        confirmPassword: new FormControl('', [Validators.required, Validators.minLength(6)]),
    });

    public currentPasswordForm = new FormGroup({
        currentPassword: new FormControl('', [Validators.required]),
    });

    public step = signal<'current' | 'new' | 'otp'>('current');
    public current_password = signal<string>('');
    public email = signal<string>('email@gmail.com');
    public isOtpFlow = signal<boolean>(false);
    public verifiedOtp = signal<string>('');

    public passwordLengthValid = signal<boolean>(false);
    public passwordUppercaseValid = signal<boolean>(false);
    public passwordLowercaseValid = signal<boolean>(false);
    public passwordSpecialCharValid = signal<boolean>(false);
    public passwordStrength = signal<number>(0);

    public hideNewPassword = signal<boolean>(true);
    public hideConfirmPassword = signal<boolean>(true);
    public hideCurrentPassword = signal<boolean>(true);
    public isVerifying = signal<boolean>(false);
    public isLoading = signal<boolean>(false);
    public passwordLastChange = signal<PasswordLastChange | null>(null);
    public isLastChangeLoading = signal<boolean>(true);

    public current_lang: string = localStorage.getItem('lang') || 'en';

    constructor(
        @Inject(MAT_DIALOG_DATA) public dialog_data: any,
        private _dialogRef: MatDialogRef<ChangePasswordProfileComponent>,
        private _snackBarService: SnackbarService,
        private _matDialog: MatDialog,
        private _service: ProfileService,
        private _dialogConfigService: DialogConfigService,
        private _errorHandleService: ErrorHandleService,
        private _translocoService: TranslocoService,
        private _authService: AuthService,
        private _userService: UserService,
        private _router: Router,
    ) {
        this.current_lang = this._translocoService.getActiveLang();
        this._translocoService.langChanges$.subscribe((lang) => (this.current_lang = lang));

        if (this.dialog_data?.isForgot) {
            this.step.set('otp');
            this.isOtpFlow.set(true);
        }
    }

    ngOnInit(): void {
        const user = this._userService.getUser();
        if (this.dialog_data?.email) {
            this.email.set(this.dialog_data.email);
        } else if (user?.email) {
            this.email.set(user.email);
        } else if (user?.phone) {
            this.email.set(user.phone);
        }

        this._loadPasswordLastChange();

        this.form.get('newPassword')?.valueChanges
            .pipe(takeUntil(this.destroy$))
            .pipe(startWith(this.form.get('newPassword')?.value || ''))
            .subscribe(value => this._validatePassword(value || ''));

        if (this.dialog_data?.isForgot) {
            this.step.set('otp');
            this.isOtpFlow.set(true);
            this.forgotPassword();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    onBack(): void {
        if (this.step() === 'otp') {
            if (this.dialog_data?.isForgot) {
                this._dialogRef.close();
            } else {
                this.isOtpFlow.set(false);
                this.step.set('current');
            }
        } else if (this.step() === 'new') {
            if (this.isOtpFlow() || this.dialog_data?.isForgot) {
                this.step.set('otp');
            } else {
                this.step.set('current');
            }
        } else {
            this._dialogRef.close();
        }
    }

    openGeneratePasswordDialog(): void {
        this._matDialog
            .open(GeneratePasswordComponent, {
                ...this._dialogConfigService.getDialogConfig(null),
                data: {
                    onSubmit: (password: string) => {
                        const newPassword = password;
                        const confirmPassword = password;

                        return this.isOtpFlow()
                            ? this._authService.resetPasswordWithOtp({
                                username: this.email(),
                                otp: this.verifiedOtp(),
                                otp_token: localStorage.getItem('resetPasswordOtpToken') || '',
                                new_password: newPassword,
                                confirm_password: confirmPassword,
                            })
                            : this._service.updatePassword({
                                current_password: this.current_password(),
                                new_password: newPassword,
                            });
                    }
                }
            })
            .afterClosed()
            .subscribe((result: any) => {
                if (result?.submitted) {
                    const successMessage = this.current_lang === 'en'
                        ? (result?.res?.response_msg || result?.res?.message || 'Password updated successfully')
                        : 'ផ្លាស់ប្តូរពាក្យសម្ងាត់បានដោយជោគជ័យ';
                    this._snackBarService.openSnackBar(
                        successMessage,
                        GlobalConstants.success,
                    );
                    this._dialogRef.close();
                } else if (typeof result === 'string') {
                    this.form.patchValue({
                        newPassword: result,
                        confirmPassword: result,
                    });
                    this.form.get('newPassword')?.markAsDirty();
                    this.form.get('confirmPassword')?.markAsDirty();
                    this.form.get('newPassword')?.markAsTouched();
                    this.form.get('confirmPassword')?.markAsTouched();
                    this._validatePassword(result);
                    this.hideNewPassword.set(false);
                    this.hideConfirmPassword.set(false);
                }
            });
    }

    verifyCurrentPassword(): void {
        if (this.currentPasswordForm.invalid || this.isVerifying()) {
            this.currentPasswordForm.markAllAsTouched();
            return;
        }

        const password = this.currentPasswordForm.controls.currentPassword.value || '';
        this.isVerifying.set(true);

        this._service.validatePassword({ password }).subscribe({
            next: () => {
                this.current_password.set(password);
                this.currentPasswordForm.reset();
                this.isVerifying.set(false);
                this.step.set('new');
            },
            error: (error) => {
                this.isVerifying.set(false);
                this._errorHandleService.handleHttpError(error);
            },
        });
    }

    forgotPassword(): void {
        this.isLoading.set(true);
        const targetEmail = this.email();
        this._authService.forgetPassword(targetEmail).subscribe({
            next: (res: any) => {
                if (res?.otp_token) {
                    localStorage.setItem('resetPasswordOtpToken', res.otp_token);
                }
                this.isLoading.set(false);
                this.isOtpFlow.set(true);
                this.step.set('otp');
                const msg = targetEmail.includes('@')
                    ? 'បានផ្ញើលេខកូដ OTP ទៅកាន់អ៊ីមែលរបស់អ្នក'
                    : 'បានផ្ញើលេខកូដ OTP ទៅកាន់លេខទូរស័ព្ទរបស់អ្នក';
                this._snackBarService.openSnackBar(msg, GlobalConstants.success);
            },
            error: () => {
                this.isLoading.set(false);
                this.isOtpFlow.set(true);
                this.step.set('otp');
                const msg = targetEmail.includes('@')
                    ? 'បានផ្ញើលេខកូដ OTP ទៅកាន់អ៊ីមែលរបស់អ្នក'
                    : 'បានផ្ញើលេខកូដ OTP ទៅកាន់លេខទូរស័ព្ទរបស់អ្នក';
                this._snackBarService.openSnackBar(msg, GlobalConstants.success);
            }
        });
    }

    passwordsDoNotMatch(): boolean {
        const newPw = this.form.get('newPassword')?.value;
        const confPw = this.form.get('confirmPassword')?.value;
        if (!newPw || !confPw) return false;
        return newPw !== confPw;
    }

    isFormValid(): boolean {
        if (this.step() !== 'new') return false;
        if (!this.isOtpFlow() && !this.current_password()) return false;
        if (this.passwordsDoNotMatch()) return false;
        if (this.form.invalid) return false;
        if (this.isLoading()) return false;
        return true;
    }

    onOtpSuccess(event?: any): void {
        if (event?.otp) {
            this.verifiedOtp.set(event.otp);
        }
        this.step.set('new');
    }

    changePassword(): void {
        if (!this.isFormValid()) return;

        this.isLoading.set(true);

        const newPassword = this.form.get('newPassword')?.value || '';
        const confirmPassword = this.form.get('confirmPassword')?.value || newPassword;

        const request$: Observable<any> = this.isOtpFlow()
            ? this._authService.resetPasswordWithOtp({
                username: this.email(),
                otp: this.verifiedOtp(),
                otp_token: localStorage.getItem('resetPasswordOtpToken') || '',
                new_password: newPassword,
                confirm_password: confirmPassword,
            })
            : this._service.updatePassword({
                current_password: this.current_password(),
                new_password: newPassword,
            });

        request$.subscribe({
            next: (res) => {
                this.isLoading.set(false);
                const successMessage = this.current_lang === 'en'
                    ? (res?.response_msg || res?.message || 'Password updated successfully')
                    : 'ផ្លាស់ប្តូរពាក្យសម្ងាត់បានដោយជោគជ័យ';
                this._snackBarService.openSnackBar(
                    successMessage,
                    GlobalConstants.success,
                );
                this._dialogRef.close();
            },
            error: (error) => {
                this.isLoading.set(false);
                this._errorHandleService.handleHttpError(error);
            },
        });
    }

    passwordLastChangeLabel(): string {
        const lastChange = this.passwordLastChange();
        if (!lastChange) {
            return this.current_lang === 'en'
                ? 'Last password change unavailable'
                : 'មិនមានព័ត៌មានអំពីការផ្លាស់ប្តូរពាក្យសម្ងាត់';
        }

        const timestamp = lastChange.changedAt
            ? new Date(lastChange.changedAt).getTime()
            : Number.NaN;
        let minutes: number;
        if (!Number.isNaN(timestamp)) {
            minutes = Math.max(
                0,
                Math.floor((Date.now() - timestamp) / 60_000),
            );
        } else if (lastChange.daysSinceChange !== null) {
            minutes = Math.max(0, lastChange.daysSinceChange * 24 * 60);
        } else {
            return this.current_lang === 'en'
                ? 'Last password change unavailable'
                : 'មិនមានព័ត៌មានអំពីការផ្លាស់ប្តូរពាក្យសម្ងាត់';
        }

        if (minutes < 1) {
            return this.current_lang === 'en'
                ? 'Password changed just now'
                : 'បានផ្លាស់ប្តូរពាក្យសម្ងាត់ទើបតែឥឡូវនេះ';
        }

        const relative = this.relativeTime(minutes);
        return this.current_lang === 'en'
            ? `Password changed ${relative} ago`
            : `បានផ្លាស់ប្តូរពាក្យសម្ងាត់ ${relative}`;
    }

    private _loadPasswordLastChange(): void {
        this.isLastChangeLoading.set(true);
        this._service.getPasswordLastChange().subscribe({
            next: (value) => {
                this.passwordLastChange.set(value);
                this.isLastChangeLoading.set(false);
            },
            error: () => {
                this.passwordLastChange.set(null);
                this.isLastChangeLoading.set(false);
            },
        });
    }

    private relativeTime(minutes: number): string {
        if (this.current_lang === 'en') {
            if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'}`;
            const hours = Math.floor(minutes / 60);
            if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'}`;
            const days = Math.floor(hours / 24);
            if (days < 30) return `${days} day${days === 1 ? '' : 's'}`;
            const months = Math.floor(days / 30);
            if (months < 12) return `${months} month${months === 1 ? '' : 's'}`;
            const years = Math.floor(months / 12);
            return `${years} year${years === 1 ? '' : 's'}`;
        }

        if (minutes < 60) return `${minutes} នាទីមុន`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} ម៉ោងមុន`;
        const days = Math.floor(hours / 24);
        if (days < 30) return `${days} ថ្ងៃមុន`;
        const months = Math.floor(days / 30);
        if (months < 12) return `${months} ខែមុន`;
        return `${Math.floor(months / 12)} ឆ្នាំមុន`;
    }

    private _validatePassword(value: string): void {
        const lengthValid = value.length >= 6;
        const uppercaseValid = /[A-Z]/.test(value);
        const lowercaseValid = /[a-z]/.test(value);
        const specialMatches = value.match(/[@#!$&*]/g);
        const specialCharValid = specialMatches !== null && specialMatches.length >= 1;

        this.passwordLengthValid.set(lengthValid);
        this.passwordUppercaseValid.set(uppercaseValid);
        this.passwordLowercaseValid.set(lowercaseValid);
        this.passwordSpecialCharValid.set(specialCharValid);

        let strength = 0;
        if (lengthValid) strength++;
        if (uppercaseValid) strength++;
        if (lowercaseValid) strength++;
        if (specialCharValid) strength++;
        this.passwordStrength.set(strength);
    }
}
