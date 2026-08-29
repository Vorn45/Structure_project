// ...existing imports...
import { CommonModule }                                     from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, QueryList, ViewChildren, ViewEncapsulation } from '@angular/core';
import { ReactiveFormsModule, FormsModule }                 from '@angular/forms';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Router, RouterLink }                               from '@angular/router';
import { MatDialog, MatDialogModule }                       from '@angular/material/dialog';
import { MatButtonModule }                                  from '@angular/material/button';
import { MatFormFieldModule }                               from '@angular/material/form-field';
import { MatInputModule }                                   from '@angular/material/input';
import { MatIconModule }                                    from '@angular/material/icon';
import { MatProgressSpinnerModule }                         from '@angular/material/progress-spinner';
import { TranslocoModule }                                  from '@ngneat/transloco';
import { env }                                              from 'envs/env';
import { ErrorHandleService }                               from 'app/shared/error-handle.service';
import { AuthService }                                      from 'app/core/auth/auth.service';
import { SnackbarService }                                  from 'helper/services/snack-bar/snack-bar.service';
import { LanguagesComponent }                               from 'app/layout/common/languages/languages.component';
import GlobalConstants                                     from 'helper/shared/constants';
import { AboutDialogComponent }                             from '../about-dialog/about.component';
import { AuthContactDialogComponent }                       from '../contact-dialog/contact.component';
import { GeneratePasswordComponent }                        from 'app/shared/generate-password/component';
import { DialogConfigService }                              from 'app/shared/dialog-config.service';

/** The whole flow runs inside the one card — no dialogs are opened. */
type ResetStep = 'email' | 'otp' | 'password';

@Component({
    selector      : 'app-reset-password',
    templateUrl   : './reset-password.component.html',
    styleUrls     : ['./reset-password.component.scss'],
    encapsulation : ViewEncapsulation.None,
    standalone    : true,
    imports     : [
        CommonModule, MatButtonModule, MatFormFieldModule, MatInputModule,
        MatIconModule, MatProgressSpinnerModule, TranslocoModule,
        ReactiveFormsModule, FormsModule, RouterLink, MatDialogModule, LanguagesComponent
    ]
})
export class ResetPasswordComponent implements OnInit, OnDestroy {

    // The three OTP boxes are addressed by index for focus juggling.
    @ViewChildren('otpBox') otpBoxes!: QueryList<ElementRef<HTMLInputElement>>;

    public resetPasswordForm!: UntypedFormGroup;
    public isLoading    = false;
    public appVersion   : string = env.APP_VERSION;

    public step         : ResetStep = 'email';

    // ===>> OTP step
    public username     = '';
    public otpToken     = '';
    public digits       : string[] = ['', '', '', '', '', ''];
    public remainingTime = 0;
    public otpExpired    = false;
    public otpError      = false;
    private _countdown   : any;

    private static readonly OTP_SECONDS = 60;

    constructor(
        private _formBuilder        : UntypedFormBuilder,
        private _authService        : AuthService,
        private _router             : Router,
        private _errorHandleService : ErrorHandleService,
        private _snackbarService    : SnackbarService,
        private _matDialog          : MatDialog,
        private _dialogConfigService: DialogConfigService
    ) {}

    ngOnInit(): void {
        // The password step validates through the four strength rules below, so
        // the control itself only carries the baseline requirements.
        this.resetPasswordForm = this._formBuilder.group({
            phoneOrEmail: ['', [this.phoneOrEmailValidator.bind(this)]],
            newPassword : ['', [Validators.required, Validators.minLength(6)]]
        });
    }

    ngOnDestroy(): void {
        this.stopCountdown();
    }

    /**
     * Contact details for people who cannot get in. Opens as a right-hand
     * drawer, the same shape the app uses for its other side panels.
     */
    openContactDialog(): void {
        this._matDialog.open(
            AuthContactDialogComponent,
            this._dialogConfigService.getDialogConfig(null),
        );
    }

    openAboutDialog(): void {
        this._matDialog.open(AboutDialogComponent, {
            autoFocus: false,
            position: { right: '0px' },
            height: '100dvh',
            width: '100dvw',
            maxWidth: '520px',
            panelClass: 'custom-mat-dialog-as-mat-drawer',
            enterAnimationDuration: '0s',
        });
    }

    /**
     * Back arrow: one step back through the flow, out to sign-in from the top.
     */
    goBack(): void {
        if (this.step === 'password') {
            this.step = 'otp';
            return;
        }

        if (this.step === 'otp') {
            this.stopCountdown();
            this.step = 'email';
            return;
        }

        this._router.navigate(['/auth/sign-in']);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Step 1 — email
    // -----------------------------------------------------------------------------------------------------

    showOtp(event?: Event): void {
        event?.preventDefault();
        const phoneOrEmailCtrl = this.resetPasswordForm.get('phoneOrEmail');
        if (phoneOrEmailCtrl?.invalid) {
            phoneOrEmailCtrl.markAsTouched();
            return;
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const digitsOnly = (phoneOrEmailCtrl?.value || '').replace(/\D/g, '');
        const payloadValue = emailRegex.test(phoneOrEmailCtrl?.value) ? phoneOrEmailCtrl?.value : digitsOnly;

        this.isLoading = true;

        this._authService.forgetPassword(payloadValue).subscribe({
            // The code step is never skipped: the backend issues a challenge
            // for every reset, including accounts with no OTP channel enabled.
            next : (response: any) => {
                this.goToOtpStep(payloadValue, response?.otp_token || '');
                const msg = payloadValue.includes('@')
                    ? 'បានផ្ញើលេខកូដ OTP ទៅកាន់អ៊ីមែលរបស់អ្នក'
                    : 'បានផ្ញើលេខកូដ OTP ទៅកាន់លេខទូរស័ព្ទរបស់អ្នក';
                this._snackbarService.openSnackBar(msg, GlobalConstants.success);
            },
            error: (err) => {
                this.isLoading = false;
                this._errorHandleService.handleAuthError(
                    GlobalConstants.authError(err?.error?.message, GlobalConstants.otpSendFailed)
                );
            }
        });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Step 2 — OTP
    // -----------------------------------------------------------------------------------------------------

    private goToOtpStep(username: string, otpToken: string): void {
        this.isLoading = false;
        this.username  = username;
        this.otpToken  = otpToken;

        localStorage.setItem('email', username);
        localStorage.setItem('resetPasswordOtpToken', otpToken);

        this.clearDigits();
        this.otpError = false;
        this.step     = 'otp';
        this.startCountdown();

        // The boxes only exist once the OTP step has rendered.
        setTimeout(() => this.otpBoxes?.first?.nativeElement.focus());
    }

    // The boxes hold duplicate values (''), so track by position or ngFor will
    // shuffle the inputs — and the focus with them — as digits are typed.
    trackByIndex(index: number): number {
        return index;
    }

    get otpCode(): string {
        return this.digits.join('');
    }

    get canVerify(): boolean {
        return this.otpCode.length === 6 && !this.otpExpired && !this.isLoading;
    }

    onDigitInput(index: number, event: Event): void {
        const input = event.target as HTMLInputElement;
        const digit = (input.value || '').replace(/\D/g, '').slice(-1);

        this.digits[index] = digit;
        input.value        = digit;
        this.otpError      = false;

        if (digit) {
            this.focusBox(index + 1);
        }
    }

    onDigitKeydown(index: number, event: KeyboardEvent): void {
        if (event.key === 'Backspace' && !this.digits[index]) {
            this.focusBox(index - 1);
            return;
        }

        if (event.key === 'Enter' && this.canVerify) {
            event.preventDefault();
            this.verifyOtp();
        }
    }

    onDigitPaste(event: ClipboardEvent): void {
        event.preventDefault();

        const pasted = (event.clipboardData?.getData('text') ?? '').replace(/\D/g, '').slice(0, 6);
        if (!pasted) {
            return;
        }

        this.digits   = [0, 1, 2, 3, 4, 5].map(i => pasted[i] ?? '');
        this.otpError = false;
        this.focusBox(Math.min(pasted.length, 5));
    }

    /**
     * The code is only actually checked server-side when the password is
     * submitted (the backend verifies+resets in one call) — this step just
     * collects the 6 digits and moves on.
     */
    verifyOtp(): void {
        if (!this.canVerify) {
            return;
        }
        this.isLoading = true;

        this._authService.verifyResetPasswordOtp({
            username : this.username,
            otp      : this.otpCode,
            otp_token: this.otpToken
        }).subscribe({
            next: () => {
                this.isLoading = false;

                localStorage.setItem('resetPasswordUsername', this.username);
                localStorage.setItem('resetPasswordOtp', this.otpCode);

                this.stopCountdown();
                this.resetPasswordForm.get('newPassword')?.reset('');
                this.step = 'password';
            },
            error: () => {
                this.isLoading = false;
                this.otpError = true;
                this.clearDigits();
                this.focusBox(0);
            }
        });
    }

    resendOtp(): void {
        if (this.remainingTime > 0) {
            return;
        }

        this.clearDigits();
        this.otpError = false;
        this.startCountdown();
        this.focusBox(0);

        this._authService.forgetPassword(this.username).subscribe({
            next : (response: any) => {
                this.otpToken = response?.otp_token || this.otpToken;
                const msg = this.username.includes('@')
                    ? 'បានផ្ញើលេខកូដ OTP ទៅកាន់អ៊ីមែលរបស់អ្នក'
                    : 'បានផ្ញើលេខកូដ OTP ទៅកាន់លេខទូរស័ព្ទរបស់អ្នក';
                this._snackbarService.openSnackBar(msg, GlobalConstants.success);
            },
            error: (err) => this._errorHandleService.handleAuthError(
                GlobalConstants.authError(err?.error?.message, GlobalConstants.otpSendFailed)
            )
        });
    }

    formatTime(seconds: number): string {
        const minutes = Math.floor(seconds / 60);
        const rest    = seconds % 60;
        return `${minutes}:${rest < 10 ? '0' : ''}${rest}`;
    }

    private startCountdown(): void {
        this.stopCountdown();
        this.remainingTime = ResetPasswordComponent.OTP_SECONDS;
        this.otpExpired    = false;

        this._countdown = setInterval(() => {
            this.remainingTime--;

            if (this.remainingTime <= 0) {
                this.stopCountdown();
                this.otpExpired = true;
            }
        }, 1000);
    }

    private stopCountdown(): void {
        if (this._countdown) {
            clearInterval(this._countdown);
            this._countdown = null;
        }
    }

    private clearDigits(): void {
        this.digits = ['', '', '', '', '', ''];
    }

    private focusBox(index: number): void {
        const box = this.otpBoxes?.get(index);
        box?.nativeElement.focus();
        box?.nativeElement.select();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Step 3 — new password
    // -----------------------------------------------------------------------------------------------------

    get password(): string {
        return this.resetPasswordForm?.get('newPassword')?.value || '';
    }

    get hasMinLength()    { return this.password.length >= 6; }
    get hasLowerCase()    { return /[a-z]/.test(this.password); }
    get hasUpperCase()    { return /[A-Z]/.test(this.password); }
    get hasSpecialChars() { const m = this.password.match(/[@#!$&*]/g); return m !== null && m.length >= 1; }

    get matchedCount(): number {
        return [this.hasMinLength, this.hasLowerCase, this.hasUpperCase, this.hasSpecialChars]
            .filter(Boolean).length;
    }

    /**
     * Segment `position` (1-3) of the strength meter: filled progressively, and
     * everything turns green only once all four rules pass.
     */
    meterClass(position: number): string {
        if (this.matchedCount >= 4) {
            return 'is-strong';
        }

        if (this.matchedCount < position) {
            return '';
        }

        return position === 1 ? 'is-weak' : 'is-medium';
    }

    /**
     * Hands the job to the shared generator dialog — the same one the
     * create-password screen opens — and drops its result into the field.
     */
    generatePassword(field: HTMLInputElement): void {
        const dialogRef = this._matDialog.open(
            GeneratePasswordComponent,
            this._dialogConfigService.getDialogConfig(null),
        );

        dialogRef.afterClosed().subscribe((password: string | undefined) => {
            if (!password) return;

            this.resetPasswordForm.get('newPassword')?.setValue(password);
            field.type = 'text';
        });
    }

    savePassword(event?: Event): void {
        event?.preventDefault();

        if (this.matchedCount < 4) {
            this.resetPasswordForm.get('newPassword')?.markAsTouched();
            return;
        }

        this.isLoading = true;

        this._authService.resetPasswordWithOtp({
            username        : this.username,
            otp             : this.otpCode,
            otp_token       : this.otpToken,
            new_password    : this.password,
            confirm_password: this.password
        }).subscribe({
            next: () => {
                this.isLoading = false;
                localStorage.removeItem('email');
                localStorage.removeItem('resetPasswordUsername');
                localStorage.removeItem('resetPasswordOtp');
                localStorage.removeItem('resetPasswordOtpToken');
                this._snackbarService.openSnackBar('កំណត់ពាក្យសម្ងាត់ថ្មីបានដោយជោគជ័យ', GlobalConstants.success);
                this._router.navigate(['/auth/sign-in']);
            },
            error: (err) => {
                this.isLoading = false;
                const message: string = err?.error?.message || '';
                this._errorHandleService.handleAuthError(
                    GlobalConstants.authError(message, GlobalConstants.genericError),
                );

                
                if (/otp/i.test(message)) {
                    this.otpError = true;
                    this.clearDigits();
                    this.step = 'otp';
                    setTimeout(() => this.focusBox(0));
                }
            }
        });
    }

    // CHANGED: was phoneRegex.test(this.phoneOrEmail) — failed if user typed spaces e.g. "087 600 063"
    // NOW: strips non-digits first, then tests, so spaces/dashes are ignored
    phoneOrEmailValidator(control: import('@angular/forms').AbstractControl): import('@angular/forms').ValidationErrors | null {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const phoneRegex = /^\d{9,}$/;
        const digitsOnly = (control.value || '').replace(/\D/g, '');
        const isValid = emailRegex.test(control.value) || phoneRegex.test(digitsOnly);
        return isValid ? null : { invalidInput: true };
    }
}
