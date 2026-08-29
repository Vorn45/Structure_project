import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoModule } from '@ngneat/transloco';
import { startRegistration } from '@simplewebauthn/browser';

import { AuthService } from 'app/core/auth/auth.service';
import { SideDialogCloseButtonComponent } from 'app/shared/side-dialog-close-button/component';
import { HelperConfirmationService } from 'helper/services/confirmation/confirmation.service';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { profileRelativeTime } from '../../profile-display.util';
import { ProfileService } from '../../profile.service';
import { PasskeyCredentialSummary } from '../../profile.type';

@Component({
    standalone: true,
    imports: [
        CommonModule,
        MatIconModule,
        MatDialogModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
        TranslocoModule,
        SideDialogCloseButtonComponent,
    ],
    selector: 'passkey-profile-dialog',
    templateUrl: './template.html',
    styleUrls: ['./style.scss'],
})
export class PasskeyProfileDialogComponent implements OnInit {
    readonly passkeys = signal<PasskeyCredentialSummary[]>([]);
    readonly isLoading = signal(true);
    readonly isAdding = signal(false);
    readonly hasLoadError = signal(false);

    private readonly _authService = inject(AuthService);
    private readonly _profileService = inject(ProfileService);
    private readonly _confirmationService = inject(HelperConfirmationService);
    private readonly _snackbarService = inject(SnackbarService);

    ngOnInit(): void {
        this.loadPasskeys();
    }

    loadPasskeys(): void {
        this.isLoading.set(true);
        this.hasLoadError.set(false);

        this._profileService.listPasskeys().subscribe({
            next: (passkeys) => {
                this.passkeys.set(passkeys);
                this.isLoading.set(false);
            },
            error: () => {
                this.passkeys.set([]);
                this.isLoading.set(false);
                this.hasLoadError.set(true);
            },
        });
    }

    addPasskey(): void {
        if (this.isAdding()) return;
        this.isAdding.set(true);

        this._authService.getPasskeyRegistrationOptions().subscribe({
            next: ({ options, challenge_token }) => {
                startRegistration({ optionsJSON: options })
                    .then((credential) => {
                        this._authService.verifyPasskeyRegistration(credential, challenge_token).subscribe({
                            next: (created) => {
                                this.isAdding.set(false);
                                this.passkeys.update((list) => [created, ...list]);
                                this._snackbarService.openSnackBar('បានបន្ថែម Passkey ដោយជោគជ័យ', GlobalConstants.success);
                            },
                            error: () => {
                                this.isAdding.set(false);
                                this._snackbarService.openSnackBar(GlobalConstants.genericError, GlobalConstants.error);
                            },
                        });
                    })
                    .catch((error: Error) => {
                        this.isAdding.set(false);
                        if (error.name === 'NotAllowedError') return;
                        const message = error.name === 'InvalidStateError'
                            ? 'ឧបករណ៍នេះបានចុះឈ្មោះរួចហើយ'
                            : GlobalConstants.genericError;
                        this._snackbarService.openSnackBar(message, GlobalConstants.error);
                    });
            },
            error: () => {
                this.isAdding.set(false);
                this._snackbarService.openSnackBar(GlobalConstants.genericError, GlobalConstants.error);
            },
        });
    }

    removePasskey(item: PasskeyCredentialSummary): void {
        const confirmation = this._confirmationService.open({
            title: 'លុប Passkey',
            message: 'អ្នកនឹងមិនអាចប្រើ Passkey នេះដើម្បីចូលប្រព័ន្ធបានទៀតទេ',
            icon: {
                show: true,
                name: 'mdi:exclamation-thick',
                color: 'warning',
            },
            actions: {
                confirm: { show: true, label: 'លុប', color: 'warn' },
                cancel: { show: true, label: 'ទេ' },
            },
            dismissible: true,
        });

        confirmation.afterClosed().subscribe((result) => {
            if (result !== 'confirmed') return;

            this._profileService.removePasskey(item.id).subscribe({
                next: () => {
                    this.passkeys.update((list) => list.filter((p) => p.id !== item.id));
                    this._snackbarService.openSnackBar('បានលុប Passkey ដោយជោគជ័យ', GlobalConstants.success);
                },
                error: () => {
                    this._snackbarService.openSnackBar(GlobalConstants.genericError, GlobalConstants.error);
                },
            });
        });
    }

    lastUsedLabel(item: PasskeyCredentialSummary): string {
        return item.last_used_at ? profileRelativeTime(item.last_used_at) : 'មិនទាន់ប្រើ';
    }

    createdLabel(item: PasskeyCredentialSummary): string {
        return profileRelativeTime(item.created_at);
    }

    deviceIcon(item: PasskeyCredentialSummary): string {
        return item.device_type === 'multiDevice' ? 'mdi:cloud-sync-outline' : 'mdi:fingerprint';
    }
}
