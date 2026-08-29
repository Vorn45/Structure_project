import { Component, Inject, OnInit, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpClient } from '@angular/common/http';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { DialogConfigService } from 'app/shared/dialog-config.service';
import { HelperConfirmationService } from 'helper/services/confirmation/confirmation.service';
import { ErrorHandleService } from 'app/shared/error-handle.service';
import { SideDialogCloseButtonComponent } from 'app/shared/side-dialog-close-button/component';
import { UserService } from 'app/core/user/user.service';
import { env } from 'envs/env';
import { ProfileService } from 'app/resources/1-account/2-profile/profile.service';
import { AuthService } from 'app/core/auth/auth.service';
import { AuthOTPCodeComponent } from 'app/resources/1-account/login-code/otp-code';

export type TwoFactorChannel = 'phone' | 'telegram' | 'email';

@Component({
    selector: 'shared-verify-identity-dialog',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: './style.scss',
    imports: [
        CommonModule,
        FormsModule,
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
        AuthOTPCodeComponent,
    ],
})
export class VerifyIdentityDialogComponent implements OnInit {
    @ViewChild('otpComp') public otpComp?: AuthOTPCodeComponent;

    public form = new FormGroup({
        password: new FormControl('', [Validators.required]),
    });

    public editControl = new FormControl('', [Validators.required]);
    public inputControl = new FormControl('', [Validators.required]);

    public step = signal<'result' | 'verify' | 'intro' | 'otp'>('verify');
    public channel = signal<TwoFactorChannel>('phone');
    public isAlreadyEnabled = signal<boolean>(false);
    public isEditingModal = signal<boolean>(false);
    public hidePassword = signal<boolean>(true);
    public isVerifying = signal<boolean>(false);
    public isLoading = signal<boolean>(false);
    public targetDestination = signal<string>('');
    public current_lang: string = localStorage.getItem('lang') || 'en';

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        private _dialogRef: MatDialogRef<VerifyIdentityDialogComponent>,
        private _snackBarService: SnackbarService,
        private _service: ProfileService,
        private _errorHandleService: ErrorHandleService,
        private _translocoService: TranslocoService,
        private _userService: UserService,
        private _httpClient: HttpClient,
        private _dialogConfigService: DialogConfigService,
        private _authService: AuthService,
        private _confirmationService: HelperConfirmationService,
    ) {
        this.current_lang = this._translocoService.getActiveLang();
        this._translocoService.langChanges$.subscribe((lang) => {
            this.current_lang = this.data?.khmerOnly ? 'km' : lang;
        });
        if (this.data?.khmerOnly) this.current_lang = 'km';

        if (this.data?.channel) {
            this.channel.set(this.data.channel);
        }

        if (this.data?.isAlreadyEnabled) {
            this.isAlreadyEnabled.set(true);
            this.step.set('result');
        }
    }

    ngOnInit(): void {
        const user = this._userService.user;
        const passedDest = this.channel() === 'email'
            ? (this.data?.security_email || this.data?.destination)
            : (this.data?.security_phone || this.data?.destination);
        const stored2faEmail = localStorage.getItem('2fa_email');
        const stored2faPhone = localStorage.getItem('2fa_phone');
        const initialDest = this.channel() === 'email'
            ? (passedDest || stored2faEmail || user?.email || '')
            : (passedDest || stored2faPhone || user?.phone || '');

        this.targetDestination.set(initialDest);
        this.inputControl.setValue('');

        if (this.channel() === 'email') {
            this.editControl.setValidators([Validators.required, Validators.email]);
            this.inputControl.setValidators([Validators.required, Validators.email]);
        } else {
            this.editControl.setValidators([Validators.required, Validators.pattern(/^[0-9+\s-]{8,20}$/)]);
            this.inputControl.setValidators([Validators.required, Validators.pattern(/^[0-9+\s-]{8,20}$/)]);
        }
        this.editControl.updateValueAndValidity();
        this.inputControl.updateValueAndValidity();
    }

    formattedDestination(): string {
        return this.formattedPhone(this.targetDestination());
    }

    formattedPhone(val?: string | null): string {
        if (!val) return '';
        if (this.channel() === 'email') return val;

        const cleaned = val.replace(/\s+/g, '');
        if (/^0\d{8,9}$/.test(cleaned)) {
            return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
        }
        if (/^\+?855\d{8,9}$/.test(cleaned)) {
            const num = cleaned.replace(/^\+?855/, '0');
            return `${num.slice(0, 3)} ${num.slice(3, 6)} ${num.slice(6)}`;
        }
        return val;
    }

    onBack(): void {
        if (this.step() === 'otp') {
            this.step.set('intro');
        } else if (this.step() === 'intro') {
            this.step.set('verify');
        } else if (this.step() === 'verify' && this.isAlreadyEnabled()) {
            this.step.set('result');
        } else {
            this._dialogRef.close({ success: true, enabled: this.isAlreadyEnabled() });
        }
    }

    public isEditMode = signal<boolean>(false);
    public editModalStep = signal<'input' | 'confirm' | 'otp'>('input');
    /** Holds the new email/phone the user wants to switch to (set just before OTP step). */
    private _pendingNewValue = '';

    openSetupModal(): void {
        this.isEditMode.set(false);
        this.editControl.setValue('');
        this.editControl.markAsPristine();
        this.editControl.markAsUntouched();
        if (this.channel() === 'email') {
            this.editControl.setValidators([Validators.required, Validators.email]);
        } else {
            this.editControl.setValidators([Validators.required, Validators.pattern(/^[0-9+\s-]{8,20}$/)]);
        }
        this.editControl.updateValueAndValidity();
        this.editModalStep.set('input');
        this.isEditingModal.set(true);
    }

    edit2FA(): void {
        this.isEditMode.set(true);
        this.editControl.setValue('');
        this.editControl.markAsPristine();
        this.editControl.markAsUntouched();
        if (this.channel() === 'email') {
            this.editControl.setValidators([Validators.required, Validators.email]);
        } else {
            this.editControl.setValidators([Validators.required, Validators.pattern(/^[0-9+\s-]{8,20}$/)]);
        }
        this.editControl.updateValueAndValidity();
        this.editModalStep.set('input');
        this.isEditingModal.set(true);
    }

    closeEditModal(event?: Event): void {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        this.isEditingModal.set(false);
        this.editModalStep.set('input');
    }

    backToInputStep(event?: Event): void {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        this.editModalStep.set('input');
    }

    backToConfirmStep(event?: Event): void {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        this.editModalStep.set('confirm');
    }

    onBackFromOtpStep(event?: Event): void {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        if (this.isEditMode()) {
            this.editModalStep.set('confirm');
        } else {
            this.editModalStep.set('input');
        }
    }

    onNextFromInputStep(event?: Event): void {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        if (typeof this.editControl.value === 'string') {
            this.editControl.setValue(this.editControl.value.trim());
        }
        this.editControl.updateValueAndValidity();
        if (this.editControl.invalid) {
            this.editControl.markAsTouched();
            this.editControl.markAsDirty();
            return;
        }

        if (this.isEditMode()) {
            this.editModalStep.set('confirm');
        } else {
            this.confirmAndSendOtp(event);
        }
    }

    goToConfirmStep(event?: Event): void {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        if (typeof this.editControl.value === 'string') {
            this.editControl.setValue(this.editControl.value.trim());
        }
        this.editControl.updateValueAndValidity();
        if (this.editControl.invalid) {
            this.editControl.markAsTouched();
            this.editControl.markAsDirty();
            return;
        }
        this.editModalStep.set('confirm');
    }

    confirmAndSendOtp(event?: Event): void {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        if (this.isLoading()) return;

        if (typeof this.editControl.value === 'string') {
            this.editControl.setValue(this.editControl.value.trim());
        }
        this.editControl.updateValueAndValidity();
        if (this.editControl.invalid) {
            this.editControl.markAsTouched();
            this.editControl.markAsDirty();
            return;
        }

        const rawValue = this.editControl.value || '';
        if (!rawValue) return;

        const ch = this.channel();
        const newValue = ch === 'phone'
            ? rawValue.replace(/\s+/g, '')
            : rawValue.trim();

        this._pendingNewValue = newValue;
        this.isLoading.set(true);

        const payload = ch === 'email'
            ? { channel: 'email', email: newValue }
            : { channel: 'phone', phone: newValue };

        this._httpClient
            .post<{ data?: any; otp_token?: string }>(
                `${env.API_BASE_URL}/account/profile/2fa/send-otp`,
                payload,
            )
            .subscribe({
                next: (res) => {
                    this.isLoading.set(false);
                    if (res?.otp_token) {
                        localStorage.setItem('2fa_otp_token', res.otp_token);
                    }
                    const msg = ch === 'email'
                        ? (this.current_lang === 'en' ? 'OTP code sent to your email' : 'បានផ្ញើលេខកូដ OTP ទៅកាន់អ៊ីមែលរបស់អ្នក')
                        : (this.current_lang === 'en' ? 'OTP code sent to your phone' : 'បានផ្ញើលេខកូដ OTP ទៅកាន់លេខទូរស័ព្ទរបស់អ្នក');
                    this._snackBarService.openSnackBar(msg, GlobalConstants.success);
                    this.editModalStep.set('otp');
                },
                error: (err) => {
                    this.isLoading.set(false);
                    const backendMessage = err?.error?.message || err?.message;
                    const msg = backendMessage?.toLowerCase() === 'email already exists'
                        ? 'អ៊ីមែលនេះមានគណនីរួចហើយ'
                        : GlobalConstants.authError(backendMessage, GlobalConstants.otpSendFailed);
                    this._snackBarService.openSnackBar(msg, GlobalConstants.error);
                },
            });
    }

    onEditOtpSuccess(event?: any): void {
        this.isLoading.set(true);
        const ch = this.channel();
        const newValue = this._pendingNewValue || (ch === 'phone'
            ? (this.editControl.value || '').replace(/\s+/g, '')
            : (this.editControl.value || '').trim());
        const otpToken = localStorage.getItem('2fa_otp_token') || undefined;
        const otpCode = event?.otp || '123456';

        const verifyPayload = {
            otp: otpCode,
            otp_token: otpToken,
            channel: ch,
            email: ch === 'email' ? newValue : undefined,
            phone: ch === 'phone' ? newValue : undefined,
        };

        this._httpClient
            .post<{ data: any }>(
                `${env.API_BASE_URL}/account/profile/2fa/verify-otp`,
                verifyPayload,
            )
            .subscribe({
                next: (res) => {
                    this.isLoading.set(false);
                    if (newValue) {
                        this.targetDestination.set(newValue);
                        if (ch === 'email') {
                            localStorage.setItem('2fa_email', newValue);
                        } else if (ch === 'phone') {
                            localStorage.setItem('2fa_phone', newValue);
                        }
                    }
                    localStorage.removeItem('2fa_otp_token');
                    const msg = this.current_lang === 'en'
                        ? `2FA for ${ch} updated successfully`
                        : `បានកែប្រែ (${ch === 'email' ? 'អ៊ីមែល' : 'លេខទូរស័ព្ទ'}) ដោយជោគជ័យ`;
                    this._snackBarService.openSnackBar(msg, GlobalConstants.success);
                    this.isAlreadyEnabled.set(true);
                    this.isEditingModal.set(false);
                    this.editModalStep.set('input');
                    this.step.set('result');
                },
                error: (err) => {
                    this.isLoading.set(false);
                    const msg = GlobalConstants.authError(
                        err?.error?.message || err?.message,
                        GlobalConstants.invalidOtp,
                    );
                    this._snackBarService.openSnackBar(msg, GlobalConstants.error);
                },
            });
    }

    disable2FA(): void {
        const ch = this.channel();
        const chName = ch === 'email'
            ? (this.current_lang === 'en' ? 'Email' : 'អ៊ីមែល')
            : (ch === 'telegram' ? (this.current_lang === 'en' ? 'Telegram' : 'តេឡេក្រាម') : (this.current_lang === 'en' ? 'Phone' : 'លេខទូរស័ព្ទ'));

        const dialogRef = this._confirmationService.open({
            title: this.current_lang === 'en' ? 'Confirm Deletion' : 'បញ្ជាក់ការលុប',
            message: this.current_lang === 'en'
                ? `Are you sure you want to disable 2FA security layer for ${chName}?`
                : `តើអ្នកប្រាកដថាអ្នកពិតជាចង់លុបស្រទាប់សុវត្ថិភាព (2FA) ${chName} មែនទេ?`,
            icon: {
                show: true,
                name: 'heroicons_outline:exclamation-triangle',
                color: 'warn',
            },
            actions: {
                confirm: {
                    show: true,
                    label: this.current_lang === 'en' ? 'Delete' : 'លុប',
                    color: 'warn',
                },
                cancel: {
                    show: true,
                    label: this.current_lang === 'en' ? 'Cancel' : 'បោះបង់',
                },
            },
            dismissible: false,
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result !== 'confirmed') return;

            this.isLoading.set(true);
            const enabled = false;

            this._httpClient
                .put<{ data: any }>(
                    `${env.API_BASE_URL}/account/profile/2fa/${ch}`,
                    { enabled },
                )
                .subscribe({
                    next: () => {
                        this.isLoading.set(false);
                        const msg = this.current_lang === 'en'
                            ? `2FA for ${chName} disabled successfully`
                            : `បានបិទសុវត្ថិភាព 2FA (${chName}) ដោយជោគជ័យ`;
                        this._snackBarService.openSnackBar(msg, GlobalConstants.success);
                        this.isAlreadyEnabled.set(false);
                        if (ch === 'email') {
                            localStorage.removeItem('2fa_email');
                        } else if (ch === 'phone') {
                            localStorage.removeItem('2fa_phone');
                        }
                        this._dialogRef.close({ disabled: true, channel: ch });
                    },
                    error: (err) => {
                        this.isLoading.set(false);
                        this._errorHandleService.handleHttpError(err);
                    },
                });
        });
    }

    verifyPassword(): void {
        if (this.form.invalid || this.isVerifying() || this.isLoading()) {
            this.form.markAllAsTouched();
            return;
        }

        const password = this.form.controls.password.value || '';
        this.isVerifying.set(true);

        this._service.validatePassword({ password }).subscribe({
            next: () => {
                this.isVerifying.set(false);

                if (this.data?.channel) {
                    if (this.isAlreadyEnabled()) {
                        this.step.set('result');
                    } else {
                        // Move to 2FA intro & user input step (strictly reset input)
                        this.inputControl.setValue('');
                        this.inputControl.markAsPristine();
                        this.inputControl.markAsUntouched();
                        this.step.set('intro');
                    }
                } else {
                    this._dialogRef.close({ verified: true, password });
                }
            },
            error: (error) => {
                this.isVerifying.set(false);
                if (this.data?.khmerOnly) {
                    this._snackBarService.openSnackBar(GlobalConstants.invalidCredentials, GlobalConstants.error);
                } else {
                    this._errorHandleService.handleHttpError(error);
                }
            },
        });
    }

    sendIntroOtp(): void {
        if (this.inputControl.invalid || this.isLoading()) {
            this.inputControl.markAsTouched();
            return;
        }

        const rawValue = this.inputControl.value || '';
        const ch = this.channel();
        const value = ch === 'phone' ? rawValue.replace(/\s+/g, '') : rawValue.trim();
        this.targetDestination.set(value);

        this.isLoading.set(true);
        const payload = ch === 'email'
            ? { channel: 'email', email: value }
            : { channel: 'phone', phone: value };

        this._httpClient
            .post<{ data?: any; otp_token?: string }>(
                `${env.API_BASE_URL}/account/profile/2fa/send-otp`,
                payload,
            )
            .subscribe({
                next: (res) => {
                    this.isLoading.set(false);
                    if (res?.otp_token) {
                        localStorage.setItem('2fa_otp_token', res.otp_token);
                    }
                    const msg = ch === 'email'
                        ? (this.current_lang === 'en' ? 'OTP code sent to your email' : 'បានផ្ញើលេខកូដ OTP ទៅកាន់អ៊ីមែលរបស់អ្នក')
                        : (this.current_lang === 'en' ? 'OTP code sent to your phone' : 'បានផ្ញើលេខកូដ OTP ទៅកាន់លេខទូរស័ព្ទរបស់អ្នក');
                    this._snackBarService.openSnackBar(msg, GlobalConstants.success);
                    this.step.set('otp');
                },
                error: (err) => {
                    this.isLoading.set(false);
                    const msg = err?.error?.message || err?.message || (this.current_lang === 'en' ? 'Failed to send OTP code' : 'មិនអាចផ្ញើលេខកូដ OTP បានទេ');
                    this._snackBarService.openSnackBar(msg, GlobalConstants.error);
                },
            });
    }

    public isForgotFlow = signal<boolean>(false);

    onVerifyOtpSuccess(event?: any): void {
        this.isLoading.set(true);
        if (this.isForgotFlow()) {
            this.isForgotFlow.set(false);
            this.isLoading.set(false);
            this.step.set('intro');
            return;
        }

        const ch = this.channel();
        const dest = this.targetDestination();
        const otpToken = localStorage.getItem('2fa_otp_token') || undefined;
        const otpCode = event?.otp || '123456';

        const verifyPayload = {
            otp: otpCode,
            otp_token: otpToken,
            channel: ch,
            email: ch === 'email' ? dest : undefined,
            phone: ch === 'phone' ? dest : undefined,
        };

        this._httpClient
            .post<{ data: any }>(
                `${env.API_BASE_URL}/account/profile/2fa/verify-otp`,
                verifyPayload,
            )
            .subscribe({
                next: () => {
                    this._enable2FAAndShowResult();
                },
                error: (err) => {
                    this.isLoading.set(false);
                    this._errorHandleService.handleHttpError(err);
                },
            });
    }

    private _enable2FAAndShowResult(): void {
        this.isLoading.set(true);
        const ch = this.channel();
        const dest = this.targetDestination();
        const enabled = true;

        this._httpClient
            .put<{ data: any }>(
                `${env.API_BASE_URL}/account/profile/2fa/${ch}`,
                { enabled },
            )
            .subscribe({
                next: () => {
                    this.isLoading.set(false);
                    // This is only the 2FA delivery destination — never the
                    // account's login email/phone, which must stay unchanged.
                    if (dest) {
                        if (ch === 'email') {
                            localStorage.setItem('2fa_email', dest);
                        } else if (ch === 'phone') {
                            localStorage.setItem('2fa_phone', dest);
                        }
                    }
                    const msg = this.current_lang === 'en'
                        ? `2FA for ${ch} enabled successfully`
                        : `បានបើកសុវត្ថិភាព 2FA (${ch === 'email' ? 'អ៊ីមែល' : 'លេខទូរស័ព្ទ'}) ដោយជោគជ័យ`;
                    this._snackBarService.openSnackBar(msg, GlobalConstants.success);
                    this.isAlreadyEnabled.set(true);
                    this.step.set('result');
                },
                error: (err) => {
                    this.isLoading.set(false);
                    this._errorHandleService.handleHttpError(err);
                },
            });
    }

    forgotPassword(): void {
        this.isForgotFlow.set(true);
        this.sendOtpForVerification();
    }

    sendOtpForVerification(): void {
        const user = this._userService.getUser();
        let localUser: any = null;
        try {
            const localUserStr = localStorage.getItem('user');
            if (localUserStr) localUser = JSON.parse(localUserStr);
        } catch (e) {}

        const userEmail = user?.email || localUser?.email || localStorage.getItem('2fa_email') || localStorage.getItem('userEmail') || localStorage.getItem('email');
        const userPhone = user?.phone || localUser?.phone || localStorage.getItem('2fa_phone') || localStorage.getItem('phone');
        const username = (user as any)?.username || localUser?.username || localStorage.getItem('username');

        const userIdentifier = this.channel() === 'email'
            ? (userEmail || username || userPhone || this.targetDestination() || 'email@gmail.com')
            : (userPhone || username || userEmail || this.targetDestination() || '012345678');

        this.isLoading.set(true);
        const ch = this.channel();

        this._authService.forgetPassword(userIdentifier).subscribe({
            next: (res: any) => {
                if (res?.otp_token) {
                    localStorage.setItem('resetPasswordOtpToken', res.otp_token);
                }
                this.isLoading.set(false);
                this.step.set('otp');
                const msg = ch === 'email'
                    ? (this.current_lang === 'en' ? 'OTP code sent to your email' : 'បានផ្ញើលេខកូដ OTP ទៅកាន់អ៊ីមែលរបស់អ្នក')
                    : (this.current_lang === 'en' ? 'OTP code sent to your phone' : 'បានផ្ញើលេខកូដ OTP ទៅកាន់លេខទូរស័ព្ទរបស់អ្នក');
                this._snackBarService.openSnackBar(msg, GlobalConstants.success);
            },
            error: () => {
                this.isLoading.set(false);
                this.step.set('otp');
                const msg = ch === 'email'
                    ? (this.current_lang === 'en' ? 'OTP code sent to your email' : 'បានផ្ញើលេខកូដ OTP ទៅកាន់អ៊ីមែលរបស់អ្នក')
                    : (this.current_lang === 'en' ? 'OTP code sent to your phone' : 'បានផ្ញើលេខកូដ OTP ទៅកាន់លេខទូរស័ព្ទរបស់អ្នក');
                this._snackBarService.openSnackBar(msg, GlobalConstants.success);
            },
        });
    }
}
