import { NgIf }                                                                 from '@angular/common';
import { Component, Inject, OnDestroy, signal }                                 from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule }                                                      from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef }                       from '@angular/material/dialog';
import { MatIconModule }                                                        from '@angular/material/icon';
import { MatFormFieldModule }                                                   from '@angular/material/form-field';
import { MatInputModule }                                                       from '@angular/material/input';
import { MatProgressSpinnerModule }                                             from '@angular/material/progress-spinner';
import { MatTooltipModule }                                                     from '@angular/material/tooltip';
import { TranslocoModule, TranslocoService }                                    from '@ngneat/transloco';
import { Observable, Subscription }                                             from 'rxjs';
import { helperAnimations }                                                     from 'helper/animations';
import { ErrorHandleService }                                                   from 'app/shared/error-handle.service';
import { SideDialogCloseButtonComponent }                                       from 'app/shared/side-dialog-close-button/component';

export interface ChangePasswordDialogData {
    id: number;
    kh_name?: string;
    /** Caller supplies the actual API call — this dialog only collects the new password. */
    changePassword?: (newPassword: string) => Observable<any>;
}

@Component({
    selector    : 'confirm-password-profile',
    standalone  : true,
    templateUrl : 'template.html',
    styleUrl    : 'style.scss',
    animations  : helperAnimations,
    imports: [
        MatIconModule,
        MatDialogModule,
        FormsModule,
        NgIf,
        MatButtonModule,
        TranslocoModule,
        MatTooltipModule,
        MatFormFieldModule,
        ReactiveFormsModule,
        MatInputModule,
        MatProgressSpinnerModule,
        SideDialogCloseButtonComponent,
    ],
})
export class ChangePasswordComponent implements OnDestroy {

    public form = new FormGroup({
        newPassword: new FormControl('', [Validators.required, Validators.minLength(6)]),
    });

    public hidePassword = signal<boolean>(true);
    public isLoading    = signal<boolean>(false);

    public current_lang : string;
    private readonly _langSub: Subscription;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: ChangePasswordDialogData,
        private _dialogRef  : MatDialogRef<ChangePasswordComponent>,
        private _errorHandle: ErrorHandleService,
        private _transloco  : TranslocoService,
    ) {
        this.current_lang = this._transloco.getActiveLang();
        this._langSub = this._transloco.langChanges$.subscribe((lang) => (this.current_lang = lang));
    }

    ngOnDestroy(): void {
        this._langSub?.unsubscribe();
    }

    submit(): void {
        if (this.form.invalid || this.isLoading() || !this.data?.changePassword) {
            return;
        }

        const newPassword = this.form.get('newPassword')?.value || '';
        this.isLoading.set(true);
        this.data.changePassword(newPassword).subscribe({
            next: () => {
                this.isLoading.set(false);
                this._dialogRef.close(true);
            },
            error: (error) => {
                this.isLoading.set(false);
                this._errorHandle.handleHttpError(error);
            },
        });
    }

    close(): void {
        this._dialogRef.close();
    }
}
