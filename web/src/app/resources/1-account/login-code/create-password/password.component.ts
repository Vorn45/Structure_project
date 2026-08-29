// ================================================================================>> Core Library
import { CommonModule }                                                                               from '@angular/common';
import { Component, OnInit, ViewChild, ViewEncapsulation, Inject }                                            from '@angular/core';
import { FormGroup, FormsModule, NgForm, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink }                                                                                     from '@angular/router';

// ================================================================================>> Third Party Library
// ===>> Material
import { MatButtonModule }                                                                            from '@angular/material/button';
import { MatFormFieldModule }                                                                         from '@angular/material/form-field';
import { MatIconModule }                                                                              from '@angular/material/icon';
import { MatInputModule }                                                                             from '@angular/material/input';
import { MatProgressSpinnerModule }                                                                   from '@angular/material/progress-spinner';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule }                                              from '@angular/material/dialog';
import { MatDialog }                                                                                    from '@angular/material/dialog';

// ===>> Transloco
import { TranslocoModule }                                                                            from '@ngneat/transloco';

// ================================================================================>> Custom Library
// ===>> Env
import { env }                                                                                        from 'envs/env';

// ===>> Helper Library
import { SnackbarService }                                                                            from 'helper/services/snack-bar/snack-bar.service';

// ===>> Shared
import { ErrorHandleService }                                                                         from 'app/shared/error-handle.service';

// ===>> Service
import { AuthService }                                                                                from 'app/core/auth/auth.service';

// ===>> Component
import { AuthOTPForResetPasswordComponent }                                                           from '../../auth/rest-password-otp';
import { LanguagesComponent }                                                                         from 'app/layout/common/languages/languages.component';
import { AuthOTPCodeComponent } from '../otp-code';
import { RandomPasswordGeneratorComponent } from '../random-password-generator';
import GlobalConstants from 'helper/shared/constants';

@Component({
    selector      : 'password-component',
    templateUrl   : './password.component.html',
    styleUrls     : ['./password.component.scss'],
    encapsulation : ViewEncapsulation.None,
    standalone    : true,
    imports       : [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatDialogModule,
        TranslocoModule,
        AuthOTPCodeComponent,
        RandomPasswordGeneratorComponent,
        LanguagesComponent,
        RouterLink
    ],
})
export class PasswordComponent implements OnInit {

    public form     !: UntypedFormGroup;
    public isSaving : boolean = false;
    @ViewChild('signInNgForm') signInNgForm!: NgForm;
    public username !: string;
    public otp      !: string;
    public otpToken !: string;
    public type     !: string;
    isLoading       : boolean = false;
    data            !: any;
    route_link      !: string;
    accessToken     !: string;

    constructor(
        private _authService        : AuthService,
        private _formBuilder        : UntypedFormBuilder,
        private _router             : Router,
        private _snackbarService    : SnackbarService,
        private _errorHandleService : ErrorHandleService,
        private route               : ActivatedRoute,
        private _matDialog          : MatDialog,
        public dialogRef            : MatDialogRef<PasswordComponent>,
        @Inject(MAT_DIALOG_DATA) public dialogData: any = {}
    ) {
        if (this.dialogData?.username || this.dialogData?.email) {
            this.username = this.dialogData.username || this.dialogData.email;
            this.otp      = this.dialogData.otp || '';
            this.otpToken = this.dialogData.otp_token || '';
            this.type     = this.dialogData.type || 'resetPassword';
            this.data     = this.dialogData.data || {};
        } else {
            const navigation = this._router.getCurrentNavigation();
            if (navigation?.extras.state) {
                this.username = navigation.extras.state['username'];
                this.otp      = navigation.extras.state['otp'] || '';
                this.otpToken = navigation.extras.state['otp_token'] || '';
                this.type     = navigation.extras.state['type'];
                this.data     = navigation.extras.state['data'];
            } else {
                this.username = history.state.username || localStorage.getItem('resetPasswordUsername') || localStorage.getItem('email') || '';
                this.otp      = history.state.otp || localStorage.getItem('resetPasswordOtp') || '';
                this.otpToken = history.state.otp_token || localStorage.getItem('resetPasswordOtpToken') || '';
                this.type     = history.state.type || 'resetPassword';
                this.data     = history.state.data || {};
            }
        }

        if (this.type === 'signUp') {
            this.route_link = '/auth/sign-up';
        } else {
            this.route_link = '/auth';
        }
    }

    ngOnInit(): void {
        this.form = this._formBuilder.group({
            password: ['', [Validators.required]]
        });
    }

    signIn(): void {
        if (!this.form) return;
        this.isLoading = true;

        if (this.type === 'signUp') {
            // signUp branch unchanged
            const credentials = {
                finalToken: this.data.finalToken,
                group_id  : this.data.data.group_id,
                name      : this.data.data.name,
                password  : this.form.value.password,
                phone     : this.data.data.phone,
                school_id : this.data.data.school_id,
            };
            this._authService.signUpFinal(credentials).subscribe({
                next: (res: any) => {
                    this._authService.accessToken = res?.access_token;
                    this._authService.verified(res?.access_token);
                    localStorage.setItem('refreshToken', res?.refresh_token);
                    this._router.navigateByUrl('');
                    this.isLoading = false;
                    this._snackbarService.openSnackBar('ចូលប្រព័ន្ធបានដោយជោគជ័យ', GlobalConstants.success);
                },
                error: err => {
                    this.form.enable();
                    this.signInNgForm?.resetForm();
                    this._errorHandleService.handleHttpError(err);
                }
            });
        } else {
            // CHANGED: was updatePassword() → POST /account/auth/reset-to-new-password (wrong endpoint, missing otp)
            // NOW: resetPasswordWithOtp() → POST /auth/reset-password with all required fields
            if (!this.username || !this.otp) {
                this.isLoading = false;
                this._snackbarService.openSnackBar('Missing reset password context. Please verify OTP again.', GlobalConstants.error);
                return;
            }

            const credentials = {
                username        : this.username,
                otp             : this.otp,
                otp_token       : this.otpToken || '',
                new_password    : this.form.value.password,
                confirm_password: this.form.value.password,
            };
            this._authService.resetPasswordWithOtp(credentials).subscribe({
                next: () => {
                    this.isLoading = false;
                    this.dialogRef.close();
                    localStorage.removeItem('email');
                    localStorage.removeItem('resetPasswordUsername');
                    localStorage.removeItem('resetPasswordOtp');
                    localStorage.removeItem('resetPasswordOtpToken');
                    this._router.navigateByUrl('/auth');
                    this._snackbarService.openSnackBar('កំណត់ពាក្យសម្ងាត់ថ្មីបានដោយជោគជ័យ', GlobalConstants.success);
                },
                error: () => {
                    this.isLoading = false;
                    this.form.enable();
                    this._errorHandleService.handleAuthError();
                }
            });
        }
    }

    // password strength getters — unchanged
    get password()       { return this.form.get('password')?.value || ''; }
    get hasMinLength()   { return this.password.length >= 6; }
    get hasLowerCase()   { return /[a-z]/.test(this.password); }
    get hasUpperCase()   { return /[A-Z]/.test(this.password); }
    get hasSpecialChars(){ const m = this.password.match(/[#@!$*&]/g); return m !== null && m.length >= 2; }
    get matchedCount()   {
        let c = 0;
        if (this.hasMinLength)   c++;
        if (this.hasLowerCase)   c++;
        if (this.hasUpperCase)   c++;
        if (this.hasSpecialChars) c++;
        return c;
    }

    navigateBack(): void { this._router.navigateByUrl(this.route_link); }

    navigateToRandomPasswordGenerator(): void {
        const dialogRef = this._matDialog.open(RandomPasswordGeneratorComponent, {
            width: '26rem',
            panelClass: 'custom-password-dialog',
            disableClose: false,
            backdropClass: 'random-password-backdrop'
        });

        dialogRef.afterClosed().subscribe((result: string | undefined) => {
            if (result && this.form.get('password')) {
                this.form.get('password')?.setValue(result);
                this.signIn();
            }
        });
    }
}
