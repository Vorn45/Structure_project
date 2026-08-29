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
}
