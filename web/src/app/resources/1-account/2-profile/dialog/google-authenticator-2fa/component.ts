import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, Inject, QueryList, ViewChildren, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TranslocoModule } from '@ngneat/transloco';
import QRCode from 'qrcode';

import { env } from 'envs/env';
import GlobalConstants from 'helper/shared/constants';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import { SideDialogCloseButtonComponent } from 'app/shared/side-dialog-close-button/component';
import { DialogConfigService } from 'app/shared/dialog-config.service';
import { VerifyIdentityDialogComponent } from 'app/shared/verify-identity-dialog/component';

export interface GoogleAuthenticatorDialogData {
    enabled: boolean;
    email?: string | null;
    password?: string;
}

type AuthenticatorStep = 'overview' | 'setup';

@Component({
    standalone: true,
    selector: 'google-authenticator-2fa-dialog',
    templateUrl: './template.html',
    styleUrls: ['./style.scss'],
    imports: [
        CommonModule,
        MatButtonModule,
        MatDialogModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatSlideToggleModule,
        SideDialogCloseButtonComponent,
        TranslocoModule,
    ],
})
export class GoogleAuthenticatorTwoFactorDialogComponent {
    @ViewChildren('otpInput') private otpInputs!: QueryList<ElementRef<HTMLInputElement>>;

    readonly step = signal<AuthenticatorStep>('overview');
    readonly enabled = signal(false);
    readonly isLoading = signal(false);
    readonly qrCode = signal('');
    readonly otp = signal<string[]>(Array(6).fill(''));

    readonly email: string;
    private readonly password: string;
    private secret = '';

    constructor(
        @Inject(MAT_DIALOG_DATA) data: GoogleAuthenticatorDialogData,
        private readonly httpClient: HttpClient,
        private readonly dialogRef: MatDialogRef<GoogleAuthenticatorTwoFactorDialogComponent>,
        private readonly snackbar: SnackbarService,
        private readonly matDialog: MatDialog,
        private readonly dialogConfig: DialogConfigService,
    ) {
        this.enabled.set(data?.enabled ?? false);
        this.email = data?.email || localStorage.getItem('userEmail') || localStorage.getItem('email') || '';
        this.password = data?.password || '';
    }

    get canSubmit(): boolean {
        return this.otp().every((digit) => /^\d$/.test(digit));
    }

    handleToggle(event: MatSlideToggleChange): void {
        const requestedState = event.checked;
        event.source.checked = this.enabled();

        if (this.isLoading()) return;
        if (!requestedState) {
            this.disable();
            return;
        }

        this.startSetup();
    }

    startSetup(): void {
        this.isLoading.set(true);
        this.httpClient
            .get<any>(`${env.API_BASE_URL}/account/profile/2fa/authenticator/setup`)
            .subscribe({
                next: async (response) => {
                    const data = response?.data ?? response ?? {};
                    this.secret = data.secret || '';
                    const qrValue = data.qr_code || data.qrCode || data.qr_image || data.qr_uri || data.otpauth_url || data.uri || '';

                    try {
                        this.qrCode.set(await this.toQrImage(qrValue));
                        this.step.set('setup');
                        this.clearOtp();
                        setTimeout(() => this.focusOtp(0));
                    } catch {
                        this.showError('មិនអាចបង្កើត QR Code បានទេ សូមព្យាយាមម្តងទៀត');
                    } finally {
                        this.isLoading.set(false);
                    }
                },
                error: () => {
                    this.isLoading.set(false);
                    this.showError('មិនអាចរៀបចំ Google Authenticator បានទេ សូមព្យាយាមម្តងទៀត');
                },
            });
    }

    verify(): void {
        if (!this.canSubmit || this.isLoading()) return;

        this.isLoading.set(true);
        const code = this.otp().join('');
        this.httpClient
            .post<any>(`${env.API_BASE_URL}/account/profile/2fa/authenticator/enable`, {
                otp: code,
                secret: this.secret,
            })
            .subscribe({
                next: () => {
                    this.isLoading.set(false);
                    this.enabled.set(true);
                    this.snackbar.openSnackBar('បានបើក Google Authenticator ដោយជោគជ័យ', GlobalConstants.success);
                    this.dialogRef.close({ enabled: true });
                },
                error: () => {
                    this.isLoading.set(false);
                    this.showError('លេខកូដមិនត្រឹមត្រូវ ឬបានផុតកំណត់');
                },
            });
    }

    onOtpInput(index: number, event: Event): void {
        const value = (event.target as HTMLInputElement).value.replace(/\D/g, '');
        if (value.length > 1) {
            this.fillOtp(value, index);
            return;
        }

        const digits = [...this.otp()];
        digits[index] = value.slice(-1);
        this.otp.set(digits);
        if (digits[index] && index < 5) this.focusOtp(index + 1);
        if (this.canSubmit) this.verify();
    }

    onOtpKeyDown(index: number, event: KeyboardEvent): void {
        if (event.key === 'Backspace' && !this.otp()[index] && index > 0) {
            const digits = [...this.otp()];
            digits[index - 1] = '';
            this.otp.set(digits);
            this.focusOtp(index - 1);
            event.preventDefault();
        }
    }

    onOtpPaste(event: ClipboardEvent): void {
        event.preventDefault();
        this.fillOtp(event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6) || '', 0);
    }

    back(): void {
        if (this.step() === 'setup') {
            this.step.set('overview');
            this.clearOtp();
            return;
        }
        this.dialogRef.close({ enabled: this.enabled() });
    }

    private disable(): void {
        if (this.password) {
            this.disableWithPassword(this.password);
            return;
        }

        this.matDialog
            .open(
                VerifyIdentityDialogComponent,
                this.dialogConfig.getDialogConfig({ returnToSecurity: true, khmerOnly: true }),
            )
            .afterClosed()
            .subscribe((result?: { verified?: boolean; password?: string }) => {
                if (result?.verified && result.password) {
                    this.disableWithPassword(result.password);
                }
            });
    }

    private disableWithPassword(password: string): void {
        this.isLoading.set(true);
        this.httpClient
            .put<any>(`${env.API_BASE_URL}/account/profile/2fa/authenticator/disable`, {
                password,
            })
            .subscribe({
                next: () => {
                    this.isLoading.set(false);
                    this.enabled.set(false);
                    this.snackbar.openSnackBar('បានបិទ Google Authenticator ដោយជោគជ័យ', GlobalConstants.success);
                    this.dialogRef.close({ enabled: false });
                },
                error: () => {
                    this.isLoading.set(false);
                    this.showError('មិនអាចបិទ Google Authenticator បានទេ សូមព្យាយាមម្តងទៀត');
                },
            });
    }

    private async toQrImage(value: string): Promise<string> {
        if (!value) throw new Error('Missing QR value');
        if (value.startsWith('data:image') || value.startsWith('http://') || value.startsWith('https://')) return value;
        if (value.startsWith('otpauth://')) return QRCode.toDataURL(value, { width: 240, margin: 1 });
        return `data:image/png;base64,${value}`;
    }

    private fillOtp(value: string, startIndex: number): void {
        if (!value) return;
        const digits = [...this.otp()];
        [...value].forEach((digit, offset) => {
            if (startIndex + offset < digits.length) digits[startIndex + offset] = digit;
        });
        this.otp.set(digits);
        if (this.canSubmit) {
            this.otpInputs.last?.nativeElement.blur();
            this.verify();
        } else {
            this.focusOtp(digits.findIndex((digit) => !digit));
        }
    }

    private clearOtp(): void {
        this.otp.set(Array(6).fill(''));
    }

    private focusOtp(index: number): void {
        if (index >= 0) this.otpInputs?.get(index)?.nativeElement.focus();
    }

    private showError(message: string): void {
        this.snackbar.openSnackBar(message, GlobalConstants.error);
    }
}
