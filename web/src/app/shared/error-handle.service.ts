// ================================================================================>> Core Library
import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslocoService } from '@ngneat/transloco';

// ================================================================================>> Custom Library
// Helper
import GlobalConstants from 'helper/shared/constants';

// Service
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';

@Injectable({
    providedIn: 'root'
})

export class ErrorHandleService {

    private _transloco = inject(TranslocoService);

    constructor(
        private _snackbarService: SnackbarService
    ) { }

    handleHttpError(err: HttpErrorResponse): void {
        // Default error message
        let message = GlobalConstants.genericError;

        if (err?.error) {
            // Handle field-specific or validation errors
            if (err.error.errors && err.error.errors.length > 0) {
                message = err.error.errors.map((obj) => this._readMessage(obj.message) ?? '').join(', ');
            } else {
                message = this._readMessage(err.error.message) ?? message;
            }
        }

        // Show snackbar with the error message
        this._snackbarService.openSnackBar(message, GlobalConstants.error);
    }

   
    handleAuthError(message: string = GlobalConstants.invalidCredentials): void {
        this._snackbarService.openSnackBar(message, GlobalConstants.error);
    }


    handleError(message: string): void {
        this._snackbarService.openSnackBar(message, GlobalConstants.error);
    }

    /** The API sends errors as `{ name_en, name_kh }`, so printing the raw value
     *  renders "[object Object]". Pick the side matching the active language. */
    private _readMessage(message: any): string | null {
        if (typeof message === 'string') return message;
        if (message && typeof message === 'object') {
            const isEn = this._transloco.getActiveLang() === 'en';
            return (isEn
                ? (message.name_en ?? message.name_kh)
                : (message.name_kh ?? message.name_en)) ?? null;
        }
        return null;
    }
}
