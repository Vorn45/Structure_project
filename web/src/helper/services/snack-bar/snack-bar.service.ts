import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({providedIn: 'root'})
export class SnackbarService {

    constructor(private snackbar: MatSnackBar) { }

    openSnackBar(message: string, action: string, isMessage?: boolean): void {
        const config = new MatSnackBarConfig();
        config.duration = 3000;
        if(isMessage){
            config.horizontalPosition = 'center';
        }else{
            config.horizontalPosition = 'right';
        }

        config.verticalPosition = 'bottom';
        if (action === 'error') {
            config.panelClass = ['red-snackbar'];
        } else {
            config.panelClass = ['green-snackbar'];
        }

        this.snackbar.open(message, '', config);
    }

    success(message: string, duration = 3000): void {
        this.snackbar.open(message, 'បិទ', {
            duration,
            horizontalPosition: 'right',
            verticalPosition: 'bottom',
            panelClass: ['toast-success'],
        });
    }

    error(message: string, duration = 4000): void {
        this.snackbar.open(message, 'បិទ', {
            duration,
            horizontalPosition: 'right',
            verticalPosition: 'bottom',
            panelClass: ['toast-error'],
        });
    }

    info(message: string, duration = 3000): void {
        this.snackbar.open(message, 'បិទ', {
            duration,
            horizontalPosition: 'right',
            verticalPosition: 'bottom',
            panelClass: ['toast-info'],
        });
    }

    warning(message: string, duration = 3500): void {
        this.snackbar.open(message, 'បិទ', {
            duration,
            horizontalPosition: 'right',
            verticalPosition: 'bottom',
            panelClass: ['toast-warning'],
        });
    }
}
