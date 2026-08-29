import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { DateAdapter, MAT_DATE_FORMATS, MAT_NATIVE_DATE_FORMATS } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { AuthService } from 'app/core/auth/auth.service';
import { UserService } from 'app/core/user/user.service';
import { ErrorHandleService } from 'app/shared/error-handle.service';
import { FormValidationErrorComponent } from 'app/shared/form-validation-error';
import { filterLatinName, LATIN_NAME_PATTERN } from 'app/shared/form-validators';
import { SideDialogCloseButtonComponent } from 'app/shared/side-dialog-close-button/component';
import { env } from 'envs/env';
import { KhmerDateAdapter } from 'helper/adapter/khmer-date-adapter';
import { HelperConfirmationService } from 'helper/services/confirmation/confirmation.service';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { ProfileService } from '../../profile.service';

@Component({
    selector    : 'update-form',
    standalone  : true,
    templateUrl : './template.html',
    styleUrl    : './style.scss',
    imports     : [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatIconModule,
        MatInputModule,
        MatDialogModule,
        MatFormFieldModule,
        MatProgressSpinnerModule,
        MatDatepickerModule,
        TranslocoModule,
        FormValidationErrorComponent,
        SideDialogCloseButtonComponent,
    ],
    providers   : [
        { provide: DateAdapter, useClass: KhmerDateAdapter },
        { provide: MAT_DATE_FORMATS, useValue: MAT_NATIVE_DATE_FORMATS },
    ],
})
export class UpdateProfileDialogComponent implements OnInit {
    public form!: UntypedFormGroup;
    public isLoading = false;
    public isAvatarUpdating = false;
    public src = '/images/placeholder/avatar.jpg';
    public today = new Date();

    private readonly _fileBaseUrl = env.FILE_BASE_URL;

    constructor(
        @Inject(MAT_DIALOG_DATA) public dialog_data   : any,
        private _dialogRef                            : MatDialogRef<UpdateProfileDialogComponent>,
        private _matDialog                            : MatDialog,
        private _formBuilder                          : UntypedFormBuilder,
        private _accountService                       : ProfileService,
        private _snackBarService                      : SnackbarService,
        private _errorHandleService                   : ErrorHandleService,
        private _userService                          : UserService,
        private _authService                          : AuthService,
        private _translocoService                     : TranslocoService,
        private _confirmationService                  : HelperConfirmationService,
    ) {}

    ngOnInit(): void {
        this.ngBuilderForm();
    }

    ngBuilderForm(): void {
        const user = this.dialog_data || {};

        this.form = this._formBuilder.group({
            avatar            : [this.avatarValue(user)],
            kh_name           : [user?.name_kh || user?.kh_name || user?.name?.name_kh || (typeof user?.name === 'string' ? user?.name : null), Validators.required],
            en_name           : [user?.name_en || user?.en_name || user?.name?.name_en || (typeof user?.name === 'string' ? user?.name : null), [Validators.required, Validators.pattern(LATIN_NAME_PATTERN)]],
            phone             : [user?.phone_number || user?.phone || null, Validators.required],
            email             : [user?.email || null, [Validators.required, Validators.email]],
            // telegram_username : [user?.telegram_username || null],
        });

        this.src = this.avatarUrl(user);
    }

    onEnInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        const value = filterLatinName(input.value);
        if (value === input.value) return;

        input.value = value;
        this.form.get('en_name')?.setValue(value);
    }

    submit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const user = this.dialog_data || {};
        const values = this.form.value;
        const previousEmail = user?.email || null;
        const emailChanged = !!values.email && values.email !== previousEmail;

        if (emailChanged) {
            const confirmation = this._confirmationService.open({
                title: 'ប្តូរអ៊ីមែល',
                message: 'អ្នកកំពុងប្តូរអ៊ីមែលចូលប្រព័ន្ធ។ លើកក្រោយអ្នកនឹងត្រូវប្រើអ៊ីមែលថ្មីនេះដើម្បីចូលប្រព័ន្ធ។ តើអ្នកចង់បន្តទេ?',
                icon: {
                    show: true,
                    name: 'mdi:email-alert-outline',
                    color: 'warning',
                },
                actions: {
                    confirm: { show: true, label: 'បន្ត', color: 'primary' },
                    cancel: { show: true, label: 'ទេ' },
                },
                dismissible: true,
            });

            confirmation.afterClosed().subscribe((result) => {
                if (result === 'confirmed') {
                    this._submitProfile(user, values);
                }
            });
            return;
        }

        this._submitProfile(user, values);
    }

    private _submitProfile(user: any, values: any): void {
        this.isLoading = true;

        const payload: any = {
            name_kh: values.kh_name,
            name_en: values.en_name,
            phone_number: values.phone,
            email: values.email,
        };

        if (user.sex_id) {
            payload.sex_id = user.sex_id;
        }

        const scannedAvatar = typeof values.avatar === 'string' && values.avatar.startsWith('data:image/')
            ? values.avatar
            : null;

        this.form.disable();

        this._accountService.profile(payload).subscribe({
            next: (res: any) => {
                this.storeTokens(res);

                if (!scannedAvatar) {
                    this.completeSubmit(res, payload);
                    return;
                }

                // The scan has only prepared the image until this point.
                // Upload it through the same file endpoint as the dedicated
                // avatar dialog, after the user explicitly submits the form.
                this._accountService.updateAvatar(this.dataUrlToFile(scannedAvatar)).subscribe({
                    next: (avatarResponse: any) =>
                        this.completeSubmit(avatarResponse, payload, res?.data),
                    error: (err) => this.handleSubmitError(err),
                });
            },
            error: (err) => this.handleSubmitError(err),
        });
    }

    selectAvatarFile(): void {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e: any) => {
            const file = e.target.files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = () => {
                    this.isAvatarUpdating = true;
                    this.src = reader.result as string;
                    this.form.get('avatar')?.setValue(reader.result);
                    this.form.get('avatar')?.markAsDirty();
                    
                    const image = new Image();
                    image.onload = () => (this.isAvatarUpdating = false);
                    image.onerror = () => (this.isAvatarUpdating = false);
                    image.src = reader.result as string;
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    }

    private completeSubmit(response: any, payload: any, profileData: any = {}): void {
        this.storeTokens(response);

        if (payload?.email) {
            // Clear cached 2FA/sign-in email so it can't override the freshly saved account email.
            localStorage.removeItem('2fa_email');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('email');
        }

        const currentUser = this._userService.user;
        const mergedData = {
            ...currentUser,
            ...profileData,
            ...(response?.data || {}),
            ...payload,
        };
        const normalizedUser = this.normalizeUser(mergedData);

        if (normalizedUser) {
            this._userService.user = normalizedUser;
        }

        this.isLoading = false;
        this._snackBarService.openSnackBar(
            this._translocoService.translate('update_success'),
            GlobalConstants.success,
        );
        this._dialogRef.close(normalizedUser);
    }

    private handleSubmitError(error: any): void {
        try {
            this._errorHandleService.handleHttpError(error);
        } catch {
            this._snackBarService.openSnackBar(
                this._translocoService.translate('update_error'),
                GlobalConstants.error,
            );
        } finally {
            this.form.enable();
            this.isLoading = false;
        }
    }

    private storeTokens(response: any): void {
        if (response?.token) {
            this._authService.accessToken = response.token;
        }
        if (response?.refresh_token) {
            this._authService.refreshToken = response.refresh_token;
        }
    }

    private _formatDate(value: Date): string {
        return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
    }

    private dataUrlToFile(dataUrl: string): File {
        const [header, encodedData] = dataUrl.split(',');
        const contentType = header?.match(/data:(.*?);base64/)?.[1] || 'image/png';
        const binary = atob(encodedData || '');
        const bytes = new Uint8Array(binary.length);

        for (let index = 0; index < binary.length; index++) {
            bytes[index] = binary.charCodeAt(index);
        }

        return new File([bytes], `avatar.${contentType.split('/')[1] || 'png'}`, {
            type: contentType,
        });
    }

    private normalizeUser(data: any): any {
        if (!data) return null;

        return {
            ...data,
            kh_name: data.name_kh || data.kh_name || data.name?.name_kh || (typeof data.name === 'string' ? data.name : null),
            en_name: data.name_en || data.en_name || data.name?.name_en || (typeof data.name === 'string' ? data.name : null),
            date_of_birth: data.date_of_birth || data.dob || null,
            phone: data.phone_number || data.phone || null,
            roles: data.roles || (data.role ? [data.role] : []),
        };
    }

    private avatarValue(user: any): string | null {
        if (typeof user?.avatar === 'string') {
            return user.avatar;
        }

        return user?.avatar?.uri || null;
    }

    private avatarUrl(user: any): string {
        const avatar = this.avatarValue(user);

        if (!avatar) {
            return '/images/placeholder/avatar.jpg';
        }

        if (avatar.startsWith('data:image/') || avatar.startsWith('http')) {
            return avatar;
        }

        const fileDomain = user?.avatar?.file_domain || this._fileBaseUrl || '';
        return `${fileDomain}${avatar.startsWith('/') ? avatar : `/${avatar}`}`;
    }
}
