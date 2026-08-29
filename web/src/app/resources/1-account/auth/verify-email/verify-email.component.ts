// ================================================================================>> Core Library
import { CommonModule }                                                                               from '@angular/common';
import { Component, OnInit, ViewChild, ViewEncapsulation }                                            from '@angular/core';
import { FormsModule, NgForm, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Router }                                                                                     from '@angular/router';

// ================================================================================>> Third Party Library
// ===>> Material
import { MatButtonModule }                                                                            from '@angular/material/button';
import { MatFormFieldModule }                                                                         from '@angular/material/form-field';
import { MatIconModule }                                                                              from '@angular/material/icon';
import { MatInputModule }                                                                             from '@angular/material/input';
import { MatProgressSpinnerModule }                                                                   from '@angular/material/progress-spinner';

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
import { AuthOTPForResetPasswordComponent }                                                           from '../rest-password-otp';
import { LanguagesComponent }                                                                         from 'app/layout/common/languages/languages.component';

@Component({
    selector      : 'verify-email',
    templateUrl   : './verify-email.component.html',
    styleUrls     : ['./verify-email.component.scss'],
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
        TranslocoModule,
        AuthOTPForResetPasswordComponent,
        LanguagesComponent,
    ],
})
export class VerifyEmailComponent implements OnInit {

    @ViewChild('emailFormNgForm') emailFormNgForm: NgForm;

    public emailForm  : UntypedFormGroup;
    public isOTP      : boolean = false;
    public appVersion : string = env.APP_VERSION;

    constructor(
        private _authService        : AuthService,
        private _formBuilder        : UntypedFormBuilder,
        private _router             : Router,
        private _snackbarService    : SnackbarService,
        private _errorHandleService : ErrorHandleService
    ) {}

    ngOnInit(): void {
        this.emailForm = this._formBuilder.group({
            email: ['', [Validators.required, Validators.pattern("^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$")]]
        });
    }

    /**
     * Trigger OTP request
     */
    sendOtp(): void {

        if (this.emailForm.invalid) {
            return;
        }

        this.emailForm.disable();

        this._authService.forgetPassword(this.emailForm.value.email).subscribe({
            next: () => {
                this._snackbarService.openSnackBar('បានផ្ញើលេខកូដ OTP ទៅកាន់អ៊ីមែលរបស់អ្នក', 'success');
                localStorage.setItem('email', this.emailForm.value.email);
                this.isOTP = true;
            },
            error: (err) => {

                this._errorHandleService.handleHttpError(err);

                this.emailForm.enable();
                this.emailFormNgForm.resetForm();

            },
        });
    }

    /**
     * Navigate back to the email input form
     */
    navigateBack(): void {
        this.isOTP = false;
        this.emailForm.enable();
        this.emailFormNgForm?.resetForm();
    }

    /**
     * Navigate back to the sign-in page
     */
    navigateToSignIn(): void {
        this._router.navigateByUrl('/auth/sign-in');
    }
}
