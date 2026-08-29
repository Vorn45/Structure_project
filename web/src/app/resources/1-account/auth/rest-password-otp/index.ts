// ================================================================================>> Main Library
import { CommonModule, NgIf } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, HostListener, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// ================================================================================>> Third Party Library
// Material
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { Inject } from '@angular/core';

// RxJS
import { Subject } from 'rxjs';

// Transloco
import { TranslocoModule } from '@ngneat/transloco';

// ================================================================================>> Custom Library
// Helper
import GlobalConstants from 'helper/shared/constants';

// Service
import { AuthService } from 'app/core/auth/auth.service';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import { ErrorHandleService } from 'app/shared/error-handle.service';
import { RouterModule } from '@angular/router';
import { LanguagesComponent } from 'app/layout/common/languages/languages.component';
import { AboutDialogComponent } from '../about-dialog/about.component';

@Component({
    selector: 'otp',
    templateUrl: 'template.html',
    styleUrls: ['./style.scss'],
    // The card styles reach into Material internals and are scoped through
    // <body>.dark, both of which the emulated shim would break.
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [
        FormsModule,
        CommonModule,
        NgIf,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatCheckboxModule,
        MatDialogModule,
        MatProgressSpinnerModule,
        TranslocoModule,
        RouterModule,
        LanguagesComponent
    ],
})

export class AuthOTPForResetPasswordComponent implements OnInit {
    private _unsubscribeAll: Subject<void> = new Subject<void>();

    @ViewChild('input1') input1!: ElementRef;
    @ViewChild('input2') input2!: ElementRef;
    @ViewChild('input3') input3!: ElementRef;
    @ViewChild('input4') input4!: ElementRef;
    @ViewChild('input5') input5!: ElementRef;
    @ViewChild('input6') input6!: ElementRef;

    public numStr1: string = '';
    public numStr2: string = '';
    public numStr3: string = '';
    public numStr4: string = '';
    public numStr5: string = '';
    public numStr6: string = '';

    public otpCode: string = '';
    public reSendOtp: boolean = false;

    public countdownInterval: any;
    public remainingTime: number = 0;

    public email: string = '';

    public canSubmit: boolean = false;
    public isLoading: boolean = false;
    public otpFailed: boolean = false;

    constructor(
        private _authService: AuthService,
        private _router: Router,
        private _snackbarService: SnackbarService,
        private _errorHandleService: ErrorHandleService,
        public dialogRef: MatDialogRef<AuthOTPForResetPasswordComponent>,
        private _matDialog: MatDialog,
        @Inject(MAT_DIALOG_DATA) public data: { email: string }
    ) { }

    openAboutDialog(): void {
        this._matDialog.open(AboutDialogComponent, {
            autoFocus: false,
            position: { right: '0px' },
            height: '100dvh',
            width: '100dvw',
            maxWidth: '520px',
            panelClass: 'custom-mat-dialog-as-mat-drawer',
            enterAnimationDuration: '0s',
        });
    }

    ngOnInit() {
        this.email = this.data.email || localStorage.getItem('email') || '';
        this.remainingTime = 60;
        this.startCountdown();
    }

    startCountdown() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
        this.countdownInterval = setInterval(() => {
            if (this.remainingTime > 0) {
                this.remainingTime--;
            } else {
                clearInterval(this.countdownInterval);
                this.reSendOtp = true;
                this.numStr1 = this.numStr2 = this.numStr3 = this.numStr4 = this.numStr5 = this.numStr6 = '';
                this.canSubmit = false;
                this.otpFailed = true;
            }
        }, 1000);
    }

    formatTime(seconds: number): string {
        const minutes: number = Math.floor(seconds / 60);
        const remainingSeconds: number = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    }

    onPaste(event: ClipboardEvent): void {
        event.preventDefault();
        event.stopPropagation();

        const pastedData = event.clipboardData?.getData('text') ?? '';
        const digits = pastedData.replace(/\D/g, '').slice(0, 6);
        if (!digits) {
            return;
        }

        const otpDigits = digits.split('');
        this.numStr1 = otpDigits[0] ?? '';
        this.numStr2 = otpDigits[1] ?? '';
        this.numStr3 = otpDigits[2] ?? '';
        this.numStr4 = otpDigits[3] ?? '';
        this.numStr5 = otpDigits[4] ?? '';
        this.numStr6 = otpDigits[5] ?? '';
        this.checkValid();
    }

    onOtpInput(position: number, event: Event): void {
        const input = event.target as HTMLInputElement;
        const digit = (input.value || '').replace(/\D/g, '').slice(-1);

        this.setOtpDigit(position, digit);
        input.value = digit;

        this.checkValid();

        if (digit) {
            const nextInput = this.getInputByPosition(position + 1);
            nextInput?.nativeElement.focus();
        }
    }

    keyDownHandler1(event: KeyboardEvent): void {
        this.handleKeyDown(event, this.input1, this.input2);
    }

    keyDownHandler2(event: KeyboardEvent): void {
        this.handleKeyDown(event, this.input2, this.input3);
    }

    keyDownHandler3(event: KeyboardEvent): void {
        this.handleKeyDown(event, this.input3, this.input4);
    }

    keyDownHandler4(event: KeyboardEvent): void {
        this.handleKeyDown(event, this.input4, this.input5);
    }

    keyDownHandler5(event: KeyboardEvent): void {
        this.handleKeyDown(event, this.input5, this.input6);
    }

    keyDownHandler6(event: KeyboardEvent): void {
        this.handleKeyDown(event, this.input6, null);
    }

    onOtpKeydown(event: KeyboardEvent): void {
        if (event.key === 'Enter' && this.checkValid() && !this.isLoading && !this.otpFailed) {
            event.preventDefault();
            this.verify();
        }
    }

    private handleKeyDown(event: KeyboardEvent, currentInput: ElementRef, nextInput: ElementRef | null): void {
        const input = currentInput.nativeElement;
        if (event.key === 'Backspace' && input.value === '') {
            const previousInput = this.getPreviousInput(currentInput);
            if (previousInput) {
                previousInput.nativeElement.focus();
            }
        } else if (nextInput && input.value.length === input.maxLength) {
            nextInput.nativeElement.focus();
        }
    }

    private getPreviousInput(currentInput: ElementRef): ElementRef | null {
        switch (currentInput) {
            case this.input2: return this.input1;
            case this.input3: return this.input2;
            case this.input4: return this.input3;
            case this.input5: return this.input4;
            case this.input6: return this.input5;
            default: return null;
        }
    }

    resendOtp(): void {
        this.isLoading = true;

        const credentials = {
            username: this.email,
        };

        this.otpFailed = false;
        this.reSendOtp = false;
        this.remainingTime = 60;
        this.clearAllInput();
        this.checkValid();
        this.startCountdown();
        this.isLoading = false;
    }

    verify(): void {
        if (this.otpFailed || !this.canSubmit || this.isLoading) {
            return;
        }

        this.checkValid();

        // This dialog only collects the six digits — whether they are correct
        // is decided by the server when the caller submits them. It used to
        // accept a hard-coded code here and reject everything else, which let
        // a known code through and blocked the real emailed one.
        this.isLoading = false;
        this.otpFailed = false;
        this.dialogRef.close({ verified: true, otp: this.otpCode });
    }

    checkValid(): boolean {
        this.otpCode = `${this.numStr1}${this.numStr2}${this.numStr3}${this.numStr4}${this.numStr5}${this.numStr6}`;
        this.canSubmit = this.otpCode.length === 6 && !this.otpFailed;
        return this.canSubmit;
    }

    private clearAllInput(): void {
        this.numStr1 = '';
        this.numStr2 = '';
        this.numStr3 = '';
        this.numStr4 = '';
        this.numStr5 = '';
        this.numStr6 = '';
    }

    private setOtpDigit(position: number, value: string): void {
        switch (position) {
            case 1:
                this.numStr1 = value;
                break;
            case 2:
                this.numStr2 = value;
                break;
            case 3:
                this.numStr3 = value;
                break;
            case 4:
                this.numStr4 = value;
                break;
            case 5:
                this.numStr5 = value;
                break;
            case 6:
                this.numStr6 = value;
                break;
            default:
                break;
        }
    }

    private getInputByPosition(position: number): ElementRef | null {
        switch (position) {
            case 1:
                return this.input1;
            case 2:
                return this.input2;
            case 3:
                return this.input3;
            case 4:
                return this.input4;
            case 5:
                return this.input5;
            case 6:
                return this.input6;
            default:
                return null;
        }
    }

    closeDialog(): void {
        this.dialogRef.close();
    }
}
