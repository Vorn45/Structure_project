import { inject, Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { HelperConfirmationConfig } from 'helper/services/confirmation/confirmation.types';
import { HelperConfirmationDialogComponent } from 'helper/services/confirmation/dialog/dialog.component';
import { merge } from 'lodash-es';

@Injectable({ providedIn: 'root' })
export class HelperConfirmationService {
    openDialog(dialogConfig: HelperConfirmationConfig) {
        throw new Error('Method not implemented.');
    }
    private _matDialog: MatDialog = inject(MatDialog);

    private _defaultConfig: HelperConfirmationConfig = {
        title: 'បញ្ជាក់សកម្មភាព',
        message: 'តើលោកអ្នកពិតជាបានត្រួតពិនិត្យសំណើនេះបានសព្វគ្រប់ហើយមែនទេ?',
        icon: {
            show: true,
            name: 'heroicons_outline:exclamation-triangle',
            color: 'warn',
        },
        actions: {
            confirm: {
                show: true,
                label: 'យល់ព្រម',
                color: 'warn',
            },
            cancel: {
                show: true,
                label: 'បោះបង់',
            },
        },
        dismissible: false,
    };

    private _defaultDeleteConfig: HelperConfirmationConfig = {
        title: 'បញ្ជាក់ការលុប',
        message: 'តើអ្នកប្រាកដថាអ្នកពិតជាចង់លុបមែនទេ?',
        icon: {
            show: true,
            name: 'heroicons_outline:exclamation-triangle',
            color: 'warn',
        },
        actions: {
            confirm: {
                show: true,
                label: 'លុប',
                color: 'warn',
            },
            cancel: {
                show: true,
                label: 'បោះបង់',
            },
        },
        dismissible: false,
    };

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------


    /**
     * Opens the confirmation dialog with the provided configuration or defaults.
     * @param config - Optional user configuration or a string keyword.
     * @returns MatDialogRef - Reference to the opened dialog.
     */

    open( config: HelperConfirmationConfig | 'delete' = {} ): MatDialogRef<HelperConfirmationDialogComponent> {

        // Determine which configuration to use
        const finalConfig =
            config === 'delete' ? this._defaultDeleteConfig : merge({}, this._defaultConfig, config);

        // Open the dialog
        return this._matDialog.open(HelperConfirmationDialogComponent, {
            autoFocus: false,
            disableClose: !finalConfig.dismissible,
            data: finalConfig,
            panelClass: [
                'helper-confirmation-dialog-panel',
                ...(finalConfig.variant === 'compact'
                    ? ['helper-confirmation-dialog-panel--compact']
                    : []),
            ],
        });
    }
}
