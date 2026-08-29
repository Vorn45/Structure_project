import { CommonModule } from '@angular/common';
import { Component, OnDestroy, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { LocalPasscodeService, PasscodeIdleTimeout } from 'app/core/local-passcode/local-passcode.service';
import { SideDialogCloseButtonComponent } from 'app/shared/side-dialog-close-button/component';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';

type Step = 'overview' | 'verify' | 'set' | 'confirm' | 'disable';
type PendingAction = 'change-passcode' | 'enter-overview' | { idleTimeoutMinutes: PasscodeIdleTimeout };

@Component({
    selector: 'local-passcode-profile',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: './style.scss',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        TranslocoModule,
        SideDialogCloseButtonComponent,
    ],
})
export class LocalPasscodeProfileComponent implements OnDestroy {
    readonly step = signal<Step>('overview');
    readonly isEnabled = signal(false);
    readonly isSaving = signal(false);
    readonly hideSet = signal(true);
    readonly hideConfirm = signal(true);
    readonly hideDisable = signal(true);

    readonly idleOptions: { value: PasscodeIdleTimeout; labelKh: string; labelEn: string }[] = [
        { value: 1, labelKh: '១ នាទី', labelEn: '1 minute' },
        { value: 5, labelKh: '៥ នាទី', labelEn: '5 minutes' },
        { value: 60, labelKh: '១ ម៉ោង', labelEn: '1 hour' },
        { value: 300, labelKh: '៥ ម៉ោង', labelEn: '5 hours' },
    ];
    readonly selectedIdleTimeout = signal<PasscodeIdleTimeout>(5);
    readonly hideVerify = signal(true);

    private _pendingPasscode = '';
    /** What to do once `verifyForm` below succeeds — set before switching to
     *  the `verify` step, consumed and cleared once that step resolves. */
    private _pendingAction: PendingAction | null = null;

    readonly setForm = new FormGroup({
        passcode: new FormControl('', [Validators.required, Validators.minLength(1)]),
    });

    readonly confirmForm = new FormGroup({
        passcode: new FormControl('', [Validators.required, Validators.minLength(1)]),
    });

    readonly disableForm = new FormGroup({
        passcode: new FormControl('', [Validators.required]),
    });

    readonly verifyForm = new FormGroup({
        passcode: new FormControl('', [Validators.required]),
    });

    current_lang: string = localStorage.getItem('lang') || 'en';
    private readonly _langSub;

    constructor(
        private _dialogRef: MatDialogRef<LocalPasscodeProfileComponent>,
        private _passcodeService: LocalPasscodeService,
        private _snackbar: SnackbarService,
        private _transloco: TranslocoService,
    ) {
        this.current_lang = this._transloco.getActiveLang();
        this._langSub = this._transloco.langChanges$.subscribe((lang) => (this.current_lang = lang));

        this.isEnabled.set(this._passcodeService.isEnabled());
        this.selectedIdleTimeout.set(this._passcodeService.idleTimeoutMinutes());

        // Opening these settings at all — not just changing/disabling —
        // requires re-proving the current passcode first when one is
        // already set, same as Telegram: seeing "Change passcode" /
        // "Auto-Lock" / "Disable" is itself gated, not just acting on them.
        if (this._passcodeService.isEnabled()) {
            this._pendingAction = 'enter-overview';
            this.step.set('verify');
        }

        void this._passcodeService.refreshStatus(false).then(() => {
            this.isEnabled.set(this._passcodeService.isEnabled());
            this.selectedIdleTimeout.set(this._passcodeService.idleTimeoutMinutes());
        });
    }

    ngOnDestroy(): void {
        this._langSub?.unsubscribe();
    }

    onBack(): void {
        if (this.step() === 'confirm') {
            this.confirmForm.reset();
            this.step.set('set');
        } else if (this.step() === 'verify' && this._pendingAction === 'enter-overview') {
            // The entry gate itself — backing out of it means leaving the
            // dialog entirely, there's no "overview" to fall back to since
            // the overview was never actually shown.
            this._pendingAction = null;
            this._dialogRef.close(this.isEnabled());
        } else if (this.step() === 'set' || this.step() === 'disable' || this.step() === 'verify') {
            this._pendingAction = null;
            this.step.set('overview');
        } else {
            this._dialogRef.close(this.isEnabled());
        }
    }

    /** "Change passcode" — Telegram re-verifies the current passcode before
     *  letting the user set a new one, rather than jumping straight to the
     *  set-new-passcode screen. First-time setup (nothing to verify against
     *  yet) skips straight there instead. */
    startSetup(): void {
        this.setForm.reset();
        if (this.isEnabled()) {
            this._pendingAction = 'change-passcode';
            this.verifyForm.reset();
            this.step.set('verify');
            return;
        }
        this.step.set('set');
    }

    startDisable(): void {
        this.disableForm.reset();
        this.step.set('disable');
    }

    goToConfirm(): void {
        if (this.setForm.invalid) {
            this.setForm.markAllAsTouched();
            return;
        }
        this._pendingPasscode = this.setForm.controls.passcode.value || '';
        this.confirmForm.reset();
        this.step.set('confirm');
    }

    async confirmAndSave(): Promise<void> {
        if (this.confirmForm.invalid || this.isSaving()) {
            this.confirmForm.markAllAsTouched();
            return;
        }

        const confirmValue = this.confirmForm.controls.passcode.value || '';
        if (confirmValue !== this._pendingPasscode) {
            this._snackbar.openSnackBar(
                this.current_lang === 'en' ? 'Passcodes do not match' : 'លេខសម្ងាត់មិនត្រូវគ្នា',
                GlobalConstants.error,
            );
            return;
        }

        this.isSaving.set(true);
        try {
            await this._passcodeService.setPasscode(this._pendingPasscode, this.selectedIdleTimeout());
            this._pendingPasscode = '';
            this.isEnabled.set(true);

            this._snackbar.openSnackBar(
                this.current_lang === 'en' ? 'Local passcode enabled' : 'បានបើកលេខសម្ងាត់មូលដ្ឋានដោយជោគជ័យ',
                GlobalConstants.success,
            );
            this.step.set('overview');
        } catch {
            this._snackbar.openSnackBar(
                this.current_lang === 'en' ? 'Failed to enable passcode, please try again' : 'បើកលេខសម្ងាត់មិនបានសម្រេច សូមព្យាយាមម្តងទៀត',
                GlobalConstants.error,
            );
        } finally {
            this.isSaving.set(false);
        }
    }

    async confirmDisable(): Promise<void> {
        if (this.disableForm.invalid || this.isSaving()) {
            this.disableForm.markAllAsTouched();
            return;
        }

        this.isSaving.set(true);
        try {
            await this._passcodeService.disable(this.disableForm.controls.passcode.value || '');
            this.isEnabled.set(false);
            this._snackbar.openSnackBar(
                this.current_lang === 'en' ? 'Local passcode disabled' : 'បានបិទលេខសម្ងាត់មូលដ្ឋាន',
                GlobalConstants.success,
            );
            this.step.set('overview');
        } catch {
            this._snackbar.openSnackBar(
                this.current_lang === 'en' ? 'Incorrect passcode' : 'លេខសម្ងាត់មិនត្រឹមត្រូវ',
                GlobalConstants.error,
            );
        } finally {
            this.isSaving.set(false);
        }
    }

    /** Requires re-entering the current passcode before the new auto-lock
     *  timeout takes effect, same as changing the passcode itself. The
     *  dropdown's displayed value is left untouched until that verification
     *  succeeds, so a cancelled/failed verify doesn't show a value that was
     *  never actually saved. */
    onIdleTimeoutChange(value: PasscodeIdleTimeout): void {
        if (!this.isEnabled()) {
            this.selectedIdleTimeout.set(value);
            return;
        }
        this._pendingAction = { idleTimeoutMinutes: value };
        this.verifyForm.reset();
        this.step.set('verify');
    }

    async confirmVerify(): Promise<void> {
        if (this.verifyForm.invalid || this.isSaving()) {
            this.verifyForm.markAllAsTouched();
            return;
        }

        this.isSaving.set(true);
        try {
            const ok = await this._passcodeService.verify(this.verifyForm.controls.passcode.value || '');
            if (!ok) {
                this._snackbar.openSnackBar(
                    this.current_lang === 'en' ? 'Incorrect passcode' : 'លេខសម្ងាត់មិនត្រឹមត្រូវ',
                    GlobalConstants.error,
                );
                this.verifyForm.controls.passcode.reset();
                return;
            }

            const action = this._pendingAction;
            this._pendingAction = null;

            if (action === 'change-passcode') {
                this.setForm.reset();
                this.step.set('set');
            } else if (action === 'enter-overview') {
                this.step.set('overview');
            } else if (action) {
                await this._passcodeService.setIdleTimeout(action.idleTimeoutMinutes);
                this.selectedIdleTimeout.set(action.idleTimeoutMinutes);
                this.step.set('overview');
            }
        } finally {
            this.isSaving.set(false);
        }
    }

    passcodesDoNotMatch(): boolean {
        const a = this.setForm.controls.passcode.value;
        const b = this.confirmForm.controls.passcode.value;
        if (!a || !b) return false;
        return this.step() === 'confirm' && a !== b;
    }
}
