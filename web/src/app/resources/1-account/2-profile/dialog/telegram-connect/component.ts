import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslocoModule } from '@ngneat/transloco';

import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { ProfileService } from '../../profile.service';

const POLL_INTERVAL_MS = 3000;

export interface TelegramConnectDialogResult {
    linked?: boolean;
}

type TelegramConnectStep = 'conditions' | 'instructions';

@Component({
    standalone: true,
    selector: 'telegram-connect-dialog',
    templateUrl: './template.html',
    styleUrls: ['./style.scss'],
    imports: [
        MatDialogModule,
        MatIconModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        TranslocoModule,
    ],
})
export class TelegramConnectDialogComponent implements OnInit, OnDestroy {
    readonly step = signal<TelegramConnectStep>('conditions');
    readonly isLoading = signal(false);
    readonly isPolling = signal(false);

    private readonly _profileService = inject(ProfileService);
    private readonly _snackbarService = inject(SnackbarService);
    private readonly _dialogRef = inject(MatDialogRef<TelegramConnectDialogComponent, TelegramConnectDialogResult>);
    private _pollHandle?: ReturnType<typeof setInterval>;
    private _onFocus?: () => void;
    private _awaitingLink = false;

    ngOnInit(): void {
        this._onFocus = () => {
            if (this._awaitingLink) this._checkStatusOnce(true);
        };
        window.addEventListener('focus', this._onFocus);
    }

    ngOnDestroy(): void {
        this._stopPolling();
        if (this._onFocus) window.removeEventListener('focus', this._onFocus);
    }

    illustrationSrc(): string {
        return this.step() === 'conditions'
            ? 'images/Notify-pana.png'
            : 'images/Completed steps-pana.png';
    }

    goToInstructions(): void {
        this.step.set('instructions');
    }

    goBackToConditions(): void {
        this.step.set('conditions');
    }

    startConnect(): void {
        if (this.isLoading() || this.isPolling()) return;

        this.isLoading.set(true);
        this._profileService.generateTelegramLink().subscribe({
            next: ({ link }) => {
                this.isLoading.set(false);
                this._awaitingLink = true;
                window.open(link, '_blank', 'noopener,noreferrer');
                this._startPolling();
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

    private _startPolling(): void {
        this._stopPolling();
        this.isPolling.set(true);
        this._pollHandle = setInterval(() => this._checkStatusOnce(false), POLL_INTERVAL_MS);
    }

    private _stopPolling(): void {
        if (this._pollHandle) {
            clearInterval(this._pollHandle);
            this._pollHandle = undefined;
        }
        this.isPolling.set(false);
    }

    private _checkStatusOnce(fromFocus: boolean): void {
        this._profileService.getTelegramStatus().subscribe({
            next: (status) => {
                if (!status.telegram_linked) return;

                this._awaitingLink = false;
                this._stopPolling();
                this._snackbarService.openSnackBar('បានភ្ជាប់ Telegram ដោយជោគជ័យ', GlobalConstants.success);
                this._dialogRef.close({ linked: true });
            },
            error: () => {
                // Transient network errors shouldn't stop the poll loop; a
                // focus-triggered check failing silently is also fine — the
                // interval keeps trying.
                void fromFocus;
            },
        });
    }
}
