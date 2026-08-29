import { CommonModule } from '@angular/common';
import { Component, OnDestroy, ViewChild, ViewEncapsulation, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { AuthService } from 'app/core/auth/auth.service';
import { LocalPasscodeService } from 'app/core/local-passcode/local-passcode.service';
import { UserService } from 'app/core/user/user.service';
import { AuthOTPCodeComponent } from 'app/resources/1-account/login-code/otp-code';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';

@Component({
    selector: 'lock-screen',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: './style.scss',
    encapsulation: ViewEncapsulation.None,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatProgressSpinnerModule,
        TranslocoModule,
        AuthOTPCodeComponent,
    ],
})
export class LockScreenComponent implements OnDestroy {
    @ViewChild('otpComp') otpComp?: AuthOTPCodeComponent;

    readonly step = signal<'passcode' | 'otp' | 'reset'>('passcode');
    readonly hidePasscode = signal(true);
    readonly isVerifying = signal(false);
    readonly wrongPasscode = signal(false);
    readonly email = signal('');

    private _otpToken = '';
    private _resetToken = '';

    readonly form = new FormGroup({
        passcode: new FormControl('', [Validators.required]),
    });

    readonly resetForm = new FormGroup({
        newPasscode: new FormControl('', [Validators.required, Validators.minLength(1)]),
        confirmPasscode: new FormControl('', [Validators.required, Validators.minLength(1)]),
    });

    current_lang: string = localStorage.getItem('lang') || 'en';
    private readonly _langSub;

    constructor(
        private _router: Router,
        private _route: ActivatedRoute,
        private _passcodeService: LocalPasscodeService,
        private _userService: UserService,
        private _authService: AuthService,
        private _snackbar: SnackbarService,
        private _transloco: TranslocoService,
    ) {
        this.current_lang = this._transloco.getActiveLang();
        this._langSub = this._transloco.langChanges$.subscribe((lang) => (this.current_lang = lang));

        // Not actually locked (e.g. deep link, or already unlocked in another
        // tab) — bounce straight back instead of showing the screen.
        if (!this._passcodeService.isEnabled() || !this._passcodeService.locked()) {
            this._redirectAfterUnlock();
            return;
        }

        const user = this._userService.getUser();
        this.email.set(user?.email || user?.phone || '');
    }

    ngOnDestroy(): void {
        this._langSub?.unsubscribe();
    }

    async unlock(): Promise<void> {
        if (this.form.invalid || this.isVerifying()) {
            this.form.markAllAsTouched();
            return;
        }

        this.isVerifying.set(true);
        this.wrongPasscode.set(false);

        const passcode = this.form.controls.passcode.value || '';
        const ok = await this._passcodeService.verify(passcode);

        this.isVerifying.set(false);

        if (ok) {
            this._redirectAfterUnlock();
            return;
        }

        this.wrongPasscode.set(true);
        this.form.controls.passcode.reset();
    }

    signOutInstead(): void {
        this._authService.signOut().subscribe(() => {
            this._router.navigateByUrl('/auth/sign-in');
        });
    }

    async forgotPasscode(): Promise<void> {
        this.isVerifying.set(true);
        try {
            this._otpToken = await this._passcodeService.requestResetOtp();
            this.step.set('otp');
        } catch {
            this._snackbar.openSnackBar(
                this.current_lang === 'en' ? 'Failed to send OTP, please try again' : 'បញ្ជូន OTP មិនបានសម្រេច សូមព្យាយាមម្តងទៀត',
                GlobalConstants.error,
            );
        } finally {
            this.isVerifying.set(false);
        }
    }

    async onOtpSuccess(result: { otp: string }): Promise<void> {
        try {
            this._resetToken = await this._passcodeService.verifyResetOtp(result.otp, this._otpToken);
            this.step.set('reset');
        } catch {
            this._snackbar.openSnackBar(
                this.current_lang === 'en' ? 'Incorrect or expired code' : 'លេខកូដមិនត្រឹមត្រូវ ឬផុតកំណត់',
                GlobalConstants.error,
            );
        }
    }

    async confirmReset(): Promise<void> {
        if (this.resetForm.invalid || this.isVerifying()) {
            this.resetForm.markAllAsTouched();
            return;
        }

        const next = this.resetForm.controls.newPasscode.value || '';
        const confirm = this.resetForm.controls.confirmPasscode.value || '';
        if (next !== confirm) {
            this._snackbar.openSnackBar(
                this.current_lang === 'en' ? 'Passcodes do not match' : 'លេខសម្ងាត់មិនត្រូវគ្នា',
                GlobalConstants.error,
            );
            return;
        }

        this.isVerifying.set(true);
        try {
            await this._passcodeService.setPasscode(next, this._passcodeService.idleTimeoutMinutes(), {
                resetToken: this._resetToken,
            });
            this._snackbar.openSnackBar(
                this.current_lang === 'en' ? 'Passcode reset successfully' : 'បានកំណត់លេខសម្ងាត់ថ្មីដោយជោគជ័យ',
                GlobalConstants.success,
            );
            this._redirectAfterUnlock();
        } catch {
            this._snackbar.openSnackBar(
                this.current_lang === 'en' ? 'Reset session expired, please try again' : 'សម័យកំណត់ឡើងវិញផុតកំណត់ សូមព្យាយាមម្តងទៀត',
                GlobalConstants.error,
            );
            this.step.set('passcode');
        } finally {
            this.isVerifying.set(false);
        }
    }

    resetPasscodeDoNotMatch(): boolean {
        const a = this.resetForm.controls.newPasscode.value;
        const b = this.resetForm.controls.confirmPasscode.value;
        if (!a || !b) return false;
        return a !== b;
    }

    private _redirectAfterUnlock(): void {
        const redirect = this._route.snapshot.queryParamMap.get('redirect');
        this._router.navigateByUrl(redirect || '/redirect');
    }
}
