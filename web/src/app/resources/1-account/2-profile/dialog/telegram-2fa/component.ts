import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoModule } from '@ngneat/transloco';

import { env } from 'envs/env';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { DialogConfigService } from 'app/shared/dialog-config.service';
import { SideDialogCloseButtonComponent } from 'app/shared/side-dialog-close-button/component';
import { ProfileService } from '../../profile.service';
import { TelegramConnectDialogComponent, TelegramConnectDialogResult } from '../telegram-connect/component';

export interface TelegramTwoFactorDialogData {
    enabled: boolean;
    linked: boolean;
    telegramUsername?: string | null;
}

@Component({
    standalone: true,
    selector: 'telegram-2fa-dialog',
    templateUrl: './template.html',
    styleUrls: ['./style.scss'],
    imports: [
        MatDialogModule,
        MatIconModule,
        MatButtonModule,
        MatSlideToggleModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
        TranslocoModule,
        SideDialogCloseButtonComponent,
    ],
})
export class TelegramTwoFactorDialogComponent implements OnInit {
    public isLoading = signal(false);
    public enabled = signal(false);
    public linked = signal(false);
    public telegramUsername = signal<string | null>(null);

    private readonly _twoFactorUrl = `${env.API_BASE_URL}/account/profile/2fa`;
    private readonly _profileService = inject(ProfileService);
    private readonly _httpClient = inject(HttpClient);
    private readonly _matDialog = inject(MatDialog);
    private readonly _dialogConfigService = inject(DialogConfigService);
    private readonly _snackbarService = inject(SnackbarService);

    constructor(@Inject(MAT_DIALOG_DATA) public data: TelegramTwoFactorDialogData) {
        this.enabled.set(data?.enabled ?? false);
        this.linked.set(data?.linked ?? false);
        this.telegramUsername.set(data?.telegramUsername ?? null);
    }

    ngOnInit(): void {
        this._refreshLinkStatus();
    }

    handleToggle(event: MatSlideToggleChange): void {
        const wantEnabled = event.checked;
        event.source.checked = this.enabled();

        if (this.isLoading()) return;

        if (!wantEnabled) {
            this._setTwoFactor(false);
            return;
        }

        if (this.linked()) {
            this._setTwoFactor(true);
            return;
        }

        this.openConnectDialog();
    }

    openConnectDialog(): void {
        this._matDialog
            .open(
                TelegramConnectDialogComponent,
                this._dialogConfigService.getCenterDialogConfig(null, '760px'),
            )
            .afterClosed()
            .subscribe((result?: TelegramConnectDialogResult) => {
                this._refreshLinkStatus();
                if (result?.linked) {
                    this._setTwoFactor(true);
                }
            });
    }

    private _setTwoFactor(enabled: boolean): void {
        this.isLoading.set(true);
        this._httpClient.put<{ data: unknown }>(`${this._twoFactorUrl}/telegram`, { enabled }).subscribe({
            next: () => {
                this.isLoading.set(false);
                this.enabled.set(enabled);
                this._snackbarService.openSnackBar(
                    enabled ? 'បានបើកសុវត្ថិភាព 2FA ដោយជោគជ័យ' : 'បានបិទសុវត្ថិភាព 2FA ដោយជោគជ័យ',
                    GlobalConstants.success,
                );
            },
            error: (err) => {
                this.isLoading.set(false);
                this._snackbarService.openSnackBar(
                    err?.error?.message || GlobalConstants.genericError,
                    GlobalConstants.error,
                );
            },
        });
    }

    private _refreshLinkStatus(): void {
        this._profileService.getTelegramStatus().subscribe({
            next: (status) => {
                this.linked.set(status.telegram_linked);
                this.telegramUsername.set(status.telegram_username);
            },
        });
    }
}
