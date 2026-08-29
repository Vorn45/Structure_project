// ================================================================================>> Core Library
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Inject, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

// ================================================================================>> Third Party Library
// Material
import { HttpErrorResponse } from '@angular/common/http';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { catchError, Subject, takeUntil, throwError } from 'rxjs';
import { PasswordService } from './password.service';
import { TranslocoModule } from '@ngneat/transloco';

export interface PasswordReq {
    password: string;
    confirm_password: string;
}

@Component({
    selector: 'update-password-component',
    templateUrl: './template.html',
    styleUrls: ['./style.scss'],
    standalone: true,
    imports: [
        RouterModule,
        FormsModule,
        ReactiveFormsModule,
        CommonModule,
        MatIconModule,
        MatTooltipModule,
        MatProgressSpinnerModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatOptionModule,
        MatAutocompleteModule,
        MatDatepickerModule,
        MatButtonModule,
        MatMenuModule,
        MatDividerModule,
        MatRadioModule,
        MatDialogModule,
        TranslocoModule,
    ]
})
export class UpdatePasswordComponent implements OnInit, OnDestroy {
    private _unsubscribeAll   = new Subject<void>();
    responseData              = new EventEmitter<any>();
    form                      : FormGroup;
    saving                    = false;
    id                        : number;
    constructor(
        @Inject(MAT_DIALOG_DATA) public cv_id   : any,
        private readonly dialogRef              : MatDialogRef<UpdatePasswordComponent>,
        private readonly formBuilder            : FormBuilder,
        private readonly snackBarService        : SnackbarService,
        private readonly _service               : PasswordService
    ) { }

    ngOnInit(): void {
        this.id = this.cv_id.cv_id;
        this.initializeForm();
    }

    private initializeForm(): void {
        this.form = this.formBuilder.group(
            {
                newPassword: [null, [Validators.required, Validators.minLength(6)]],
                confirmPassword: [null, [Validators.required, Validators.minLength(6)]],
            },
            { validators: this.passwordMatchValidator }
        );
    }

    submit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.saving = true;
        const { newPassword, confirmPassword } = this.form.value;
        const requestBody: PasswordReq = { password: newPassword, confirm_password: confirmPassword };

        if (!this.id) {
            this.snackBarService.openSnackBar('Missing CV ID', GlobalConstants.error);
            this.saving = false;
            return;
        }

        this._service.updatePassword(this.id, requestBody)
            .pipe(
                takeUntil(this._unsubscribeAll),
                catchError((err: HttpErrorResponse) => {
                    const errorMessage = err.error?.errors?.map(e => e.message).join(', ') || err.error?.message || GlobalConstants.genericError;
                    this.snackBarService.openSnackBar(errorMessage, GlobalConstants.error);
                    this.form.setErrors({ apiError: errorMessage });
                    return throwError(() => new Error(errorMessage));
                })
            )
            .subscribe({
                next: response => {
                    this.form.enable();
                    this.dialogRef.close();
                    this.snackBarService.openSnackBar(response.message, GlobalConstants.success);
                },
                error: () => this.saving = false,
                complete: () => this.saving = false
            });
    }


    togglePasswordVisibility(input: HTMLInputElement): void {
        input.type = input.type === 'password' ? 'text' : 'password';
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    closeDialog(): void {
        this.dialogRef.close();
    }

    private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
        const newPassword = control.get('newPassword')?.value;
        const confirmPassword = control.get('confirmPassword')?.value;
        return newPassword === confirmPassword ? null : { passwordMismatch: true };
    }
}

