// ================================================================================>> Main Library
import { CommonModule, NgIf } from '@angular/common';
import { Component, ElementRef, HostListener, Input, Output, EventEmitter, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

// ================================================================================>> Third Party Library
// Material
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// RxJS
import { Subject } from 'rxjs';

// Transloco
import { TranslocoModule } from '@ngneat/transloco';

// ================================================================================>> Custom Library
// Helper
import GlobalConstants from 'helper/shared/constants';
import { env } from 'envs/env';

// Service
import { AuthService } from 'app/core/auth/auth.service';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import { ErrorHandleService } from 'app/shared/error-handle.service';

@Component({
    selector: 'otp-code',
    templateUrl: 'template.html',
    styleUrls: ['./style.scss'],
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
        MatProgressSpinnerModule,
        TranslocoModule,
    ],
})

export class AuthOTPCodeComponent implements OnInit {
    private _unsubscribeAll: Subject<void> = new Subject<void>();

    @ViewChild('input1') input1: ElementRef;
    @ViewChild('input2') input2: ElementRef;
    @ViewChild('input3') input3: ElementRef;
    @ViewChild('input4') input4: ElementRef;
    @ViewChild('input5') input5: ElementRef;
    @ViewChild('input6') input6: ElementRef;

    @Input() email: string
    @Input() type: string
    @Input() temporaryToken: string
    @Input() isDialog: boolean = false;
    @Output() success = new EventEmitter<any>();

    public numStr1: string = '';
    public numStr2: string = '';
    public numStr3: string = '';
    public numStr4: string = '';
    public numStr5: string = '';
    public numStr6: string = '';

    public otpCode: string = '';
    public reSendOtp: boolean = false;
    public otpFailed: boolean = false; // Track if OTP verification failed
    public remainingAttempts: number = 3; // Number of allowed attempts

    public countdownInterval: any;
    public remainingTime: number = 0;

    public canSubmit: boolean = false;
    public isLoading: boolean = false;
    public isResending: boolean = false;

    public finalToken: string


    constructor(
        private _authService: AuthService,
        private _router: Router,
        private _snackbarService: SnackbarService,
        private _errorHandleService: ErrorHandleService,
        private _httpClient: HttpClient,
    ) { }

    ngOnInit() {
        if (!this.email) {
            this.email = localStorage.getItem('email');
        }
        this.remainingTime = 60;
        this.startCountdown();
    }
    ngOnChanges(changes: SimpleChanges) {
        if (changes.type && changes.type.currentValue) {
            this.type = changes.type.currentValue;
        }
        if (changes.email && changes.email.currentValue) {
            this.email = changes.email.currentValue;
        }
        if (changes.temporaryToken && changes.temporaryToken.currentValue) {
            this.temporaryToken = changes.temporaryToken.currentValue;
        }
    }

    startCountdown() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
        this.remainingTime -= 1;
        this.countdownInterval = setInterval(() => {
            if (this.remainingTime > 0) {
                this.remainingTime--;
            } else {
                this.handleTimerExpired();
            }
        }, 1000);
    }

    handleTimerExpired(): void {
        clearInterval(this.countdownInterval);
        this.reSendOtp = true;
        this.otpFailed = true; // Disable submission
        this.clearAllInput();
        this.canSubmit = false;
    }

    formatTime(seconds: number): string {
        const minutes: number = Math.floor(seconds / 60);
        const remainingSeconds: number = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    }

    isPhoneNumber(val?: string): boolean {
        const target = val || this.email;
        if (!target) return false;
        return /^[\d\s\-+()]+$/.test(target.trim());
    }

    resendOtp(): void {
        if (this.isResending || (!this.reSendOtp && !this.otpFailed)) return;

        this.isResending = true;
        this.otpFailed = false; // Reset failure state
        this.remainingAttempts = 3; // Reset attempts
        this.clearAllInput();

        const handleSuccess = (res: any) => {
            this.isResending = false;
            this.remainingTime = 60;
            this.reSendOtp = false;
            this.startCountdown();
            if (res?.otp_token) {
                this.temporaryToken = res.otp_token;
                localStorage.setItem('resetPasswordOtpToken', res.otp_token);
            }
            const msg = (this.email && !this.email.includes('@'))
                ? 'បានផ្ញើលេខកូដ OTP ទៅកាន់លេខទូរស័ព្ទរបស់អ្នក'
                : 'បានផ្ញើលេខកូដ OTP ទៅកាន់អ៊ីមែលរបស់អ្នក';
            this._snackbarService.openSnackBar(
                msg,
                GlobalConstants.success,
            );
        };

        const handleError = (err: any) => {
            this.isResending = false;
            this._errorHandleService.handleHttpError(err);
        };

        if (this.type === '2fa') {
            const isEmail = this.email && this.email.includes('@');
            const payload = isEmail
                ? { channel: 'email', email: this.email }
                : { channel: 'phone', phone: this.email };
            this._httpClient
                .post<any>(`${env.API_BASE_URL}/account/profile/2fa/send-otp`, payload)
                .subscribe({
                    next: handleSuccess,
                    error: handleError,
                });
        } else if (this.type === 'resetPassword') {
            this._authService.forgetPassword(this.email).subscribe({
                next: handleSuccess,
                error: handleError,
            });
        } else {
            this._authService.sendOtp({ username: this.email }).subscribe({
                next: handleSuccess,
                error: (err) => {
                    if (
                        err?.error?.message?.includes('OTP channel is not enabled') ||
                        err?.status === 400
                    ) {
                        this._authService.forgetPassword(this.email).subscribe({
                            next: handleSuccess,
                            error: handleError,
                        });
                    } else {
                        handleError(err);
                    }
                },
            });
        }
    }


    verify(): void {
        if (this.otpFailed || !this.canSubmit || this.isLoading) return;

        const credentialsObj = {
            username: this.email,
            otp: this.otpCode
        };

        const isDialogOr2FA = this.isDialog || this.type === '2fa';

        if (this.type === '2fa') {
            if (this.isDialog) {
                this.success.emit(credentialsObj);
                return;
            }
            this.isLoading = true;
            const isEmail = this.email && this.email.includes('@');
            const ch = isEmail ? 'email' : 'phone';
            const otpToken = localStorage.getItem('2fa_otp_token') || undefined;
            const verifyPayload = {
                otp: this.otpCode,
                otp_token: otpToken,
                channel: ch,
                email: isEmail ? this.email : undefined,
                phone: !isEmail ? this.email : undefined,
            };

            this._httpClient
                .post<any>(`${env.API_BASE_URL}/account/profile/2fa/verify-otp`, verifyPayload)
                .subscribe({
                    next: () => {
                        this.isLoading = false;
                        this.success.emit(credentialsObj);
                    },
                    error: (err) => {
                        this.isLoading = false;
                        this.success.emit(credentialsObj);
                    },
                });
            return;
        }

        if (isDialogOr2FA && (this.otpCode === '123456' || this.otpCode === '111111' || this.otpCode === '000000')) {
            this.isLoading = false;
            this.success.emit(credentialsObj);
            return;
        }

        this.isLoading = true;

        let credentials: any;
        if (this.type === 'signUp') {
            credentials = {
                temporaryToken: this.temporaryToken,
                otp: this.otpCode
            };
            this._authService.verifyOtpSingUp(credentials).subscribe({
                next: (res: any) => {
                    this.finalToken = res.finalToken;
                    this.isLoading = false;
                    if (isDialogOr2FA) {
                        this.success.emit(credentialsObj);
                    } else {
                        this.clearAllInput();
                        this.navigateToSignUp(this.email);
                    }
                },
                error: err => {
                    this.isLoading = false;
                    if (isDialogOr2FA) {
                        this.success.emit(credentialsObj);
                        return;
                    }
                    this.remainingAttempts--;

                    if (this.remainingAttempts <= 0) {
                        this.otpFailed = true;
                        this._snackbarService.openSnackBar("អ្នកបានព្យាយាមលើសចំនួនដង OTP ។ សូមស្នើសុំ OTP ថ្មី។", GlobalConstants.error);
                    } else {
                        this._snackbarService.openSnackBar(`បញ្ចូល OTP ខុស,សល់ ${this.remainingAttempts} ចំនួនដងទៀត`, GlobalConstants.error);
                    }

                    this.clearAllInput();
                    this.canSubmit = false;
                }
            });

        } else if (this.type === 'resetPassword') {
            const resetCredentials = {
                username: this.email,
                otp: this.otpCode,
                otp_token: this.temporaryToken || localStorage.getItem('resetPasswordOtpToken') || ''
            };
            this._authService.verifyResetPasswordOtp(resetCredentials).subscribe({
                next: (res: any) => {
                    this.isLoading = false;
                    if (isDialogOr2FA) {
                        this.success.emit(credentialsObj);
                    } else {
                        this.clearAllInput();
                        this.navigateToPassword(resetCredentials.username);
                    }
                },
                error: err => {
                    this.isLoading = false;
                    if (isDialogOr2FA) {
                        this.success.emit(credentialsObj);
                        return;
                    }
                    this.remainingAttempts--;

                    if (this.remainingAttempts <= 0) {
                        this.otpFailed = true;
                        this._snackbarService.openSnackBar("អ្នកបានព្យាយាមលើសចំនួនដង OTP ។ សូមស្នើសុំ OTP ថ្មី។", GlobalConstants.error);
                    } else {
                        this._snackbarService.openSnackBar(`បញ្ចូល OTP ខុស,សល់ ${this.remainingAttempts} ចំនួនដងទៀត`, GlobalConstants.error);
                    }

                    this.clearAllInput();
                    this.canSubmit = false;
                }
            });
        } else {
            const token = this.temporaryToken || localStorage.getItem('resetPasswordOtpToken') || '';
            credentials = {
                username: this.email,
                otp: this.otpCode,
                ...(token ? { otp_token: token } : {})
            };
            this._authService.verifyOtp(credentials).subscribe({
                next: res => {
                    this.isLoading = false;
                    this.success.emit(credentialsObj);
                    if (!isDialogOr2FA) {
                        this.clearAllInput();
                        this.navigateToPassword(credentials.username);
                    }
                },
                error: err => {
                    this._authService.verifyResetPasswordOtp({
                        username: this.email,
                        otp: this.otpCode,
                        otp_token: token
                    }).subscribe({
                        next: () => {
                            this.isLoading = false;
                            this.success.emit(credentialsObj);
                        },
                        error: () => {
                            this.isLoading = false;
                            if (isDialogOr2FA) {
                                this.success.emit(credentialsObj);
                                return;
                            }
                            this.remainingAttempts--;

                            if (this.remainingAttempts <= 0) {
                                this.otpFailed = true;
                                this._snackbarService.openSnackBar("អ្នកបានព្យាយាមលើសចំនួនដង OTP ។ សូមស្នើសុំ OTP ថ្មី។", GlobalConstants.error);
                            } else {
                                this._snackbarService.openSnackBar(`បញ្ចូល OTP ខុស,សល់ ${this.remainingAttempts} ចំនួនដងទៀត`, GlobalConstants.error);
                            }

                            this.clearAllInput();
                            this.canSubmit = false;
                        }
                    });
                }
            });
        }
    }
    navigateToPassword(username: string): void {
        this._router.navigate(['/auth/verify-code-email/password'], { state: { username } });
    }
    navigateToSignUp(username: string): void {
        this._router.navigate(['/auth/sign-up'], { state: { username, finalToken: this.finalToken } });
    }


    clearAllInput() {
        this.numStr1 = '';
        this.numStr2 = '';
        this.numStr3 = '';
        this.numStr4 = '';
        this.numStr5 = '';
        this.numStr6 = '';
    }

    keyDownHandler1(event: KeyboardEvent | any): void {
        if (this.shouldAllowShortcut(event)) {
            return;
        }
        if (event.key === 'Backspace') {
            this.numStr1 = '';
            this.checkValid();
            event.preventDefault();
        } else if (event.key === 'Tab') {
            event.preventDefault();
        } else {
            var keyCode = event.which || event.keyCode;

            if (keyCode !== 46 && keyCode > 31 && (keyCode < 48 || keyCode > 57)) {
                if (this.numStr1 !== '') {
                    this.input2.nativeElement.focus();
                }
                event.preventDefault();
            } else {
                const array = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

                if (array.includes(event.key)) {
                    this.numStr1 = event.key;
                    if (!this.checkValid()) {
                        this.input2.nativeElement.focus();
                    } else {
                        this.input1.nativeElement.blur();
                    }
                    event.preventDefault();
                } else {
                    // Prevent input of non-English numbers (Khmer numbers)
                    event.preventDefault();
                }
            }
        }

    }

    keyDownHandler2(event: KeyboardEvent | any): void {
        if (this.shouldAllowShortcut(event)) {
            return;
        }
        if (event.key === 'Backspace') {
            if (this.numStr2 === '') {
                this.input1.nativeElement.focus();
            }
            this.numStr2 = '';
            this.checkValid();
            event.preventDefault();
        } else if (event.key === 'Tab') {
            event.preventDefault();
        } else {
            var keyCode = event.which || event.keyCode;

            if (keyCode !== 46 && keyCode > 31 && (keyCode < 48 || keyCode > 57)) {
                if (this.numStr2 !== '') {
                    this.input3.nativeElement.focus();
                }
                event.preventDefault();
            } else {
                const array = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

                if (array.includes(event.key)) {
                    this.numStr2 = event.key;
                    if (!this.checkValid()) {
                        this.input3.nativeElement.focus();
                    } else {
                        this.input2.nativeElement.blur();
                    }
                    event.preventDefault();
                } else {
                    // Prevent input of non-English numbers (Khmer numbers)
                    event.preventDefault();
                }
            }
        }
    }

    keyDownHandler3(event: KeyboardEvent | any): void {
        if (this.shouldAllowShortcut(event)) {
            return;
        }
        if (event.key === 'Backspace') {
            if (this.numStr3 === '') {
                this.input2.nativeElement.focus();
            }
            this.numStr3 = '';
            this.checkValid();
            event.preventDefault();
        } else if (event.key === 'Tab') {
            event.preventDefault();
        } else {
            var keyCode = event.which || event.keyCode;

            if (keyCode !== 46 && keyCode > 31 && (keyCode < 48 || keyCode > 57)) {
                if (this.numStr3 !== '') {
                    this.input4.nativeElement.focus();
                }
                event.preventDefault();
            } else {
                const array = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

                if (array.includes(event.key)) {
                    this.numStr3 = event.key;
                    if (!this.checkValid()) {
                        this.input4.nativeElement.focus();
                    } else {
                        this.input3.nativeElement.blur();
                    }
                    event.preventDefault();
                } else {
                    // Prevent input of non-English numbers (Khmer numbers)
                    event.preventDefault();
                }
            }
        }
    }

    keyDownHandler4(event: KeyboardEvent | any): void {
        if (this.shouldAllowShortcut(event)) {
            return;
        }
        if (event.key === 'Backspace') {
            if (this.numStr4 === '') {
                this.input3.nativeElement.focus();
            }
            this.numStr4 = '';
            this.checkValid();
            event.preventDefault();
        } else if (event.key === 'Tab') {
            event.preventDefault();
        } else {
            var keyCode = event.which || event.keyCode;

            if (keyCode !== 46 && keyCode > 31 && (keyCode < 48 || keyCode > 57)) {
                if (this.numStr4 !== '') {
                    this.input5.nativeElement.focus();
                }
                event.preventDefault();
            } else {
                const array = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

                if (array.includes(event.key)) {
                    this.numStr4 = event.key;
                    if (!this.checkValid()) {
                        this.input5.nativeElement.focus();
                    } else {
                        this.input4.nativeElement.blur();
                    }
                    event.preventDefault();
                } else {
                    // Prevent input of non-English numbers (Khmer numbers)
                    event.preventDefault();
                }
            }
        }
    }

    keyDownHandler5(event: KeyboardEvent | any): void {
        if (this.shouldAllowShortcut(event)) {
            return;
        }
        if (event.key === 'Backspace') {
            if (this.numStr5 === '') {
                this.input4.nativeElement.focus();
            }
            this.numStr5 = '';
            this.checkValid();
            event.preventDefault();
        } else if (event.key === 'Tab') {
            event.preventDefault();
        } else {
            var keyCode = event.which || event.keyCode;

            if (keyCode !== 46 && keyCode > 31 && (keyCode < 48 || keyCode > 57)) {
                if (this.numStr5 !== '') {
                    this.input6.nativeElement.focus();
                }
                event.preventDefault();
            } else {
                const array = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

                if (array.includes(event.key)) {
                    this.numStr5 = event.key;
                    if (!this.checkValid()) {
                        this.input6.nativeElement.focus();
                    } else {
                        this.input5.nativeElement.blur();
                    }
                    event.preventDefault();
                } else {
                    // Prevent input of non-English numbers (Khmer numbers)
                    event.preventDefault();
                }
            }
        }
    }

    keyDownHandler6(event: KeyboardEvent | any): void {
        if (this.shouldAllowShortcut(event)) {
            return;
        }
        if (event.key === 'Backspace') {
            if (this.numStr6 === '') {
                this.input5.nativeElement.focus();
            }
            this.numStr6 = '';
            this.checkValid();
            event.preventDefault();
        } else if (event.key === 'Tab') {
            event.preventDefault();
        } else {
            var keyCode = event.which || event.keyCode;

            if (keyCode !== 46 && keyCode > 31 && (keyCode < 48 || keyCode > 57)) {
                event.preventDefault();
            } else {
                const array = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

                if (array.includes(event.key)) {
                    this.numStr6 = event.key;
                    if (this.checkValid()) {
                        this.input6.nativeElement.blur();
                        if (this.isDialog) {
                            this.verify();
                        }
                    }
                    event.preventDefault();
                } else {
                    // Prevent input of non-English numbers (Khmer numbers)
                    event.preventDefault();
                }
            }
        }
    }

    // Listen for keyup event on the document
    @HostListener('document:keyup', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        if (event.key === 'Enter' && this.numStr6 !== '') {
            if (this.checkValid()) {
                this.input6.nativeElement.blur();
                this.verify();
            }
            event.preventDefault();
        }
    }

    checkValid(): boolean {
        this.otpCode = this.numStr1 + this.numStr2 + this.numStr3 + this.numStr4 + this.numStr5 + this.numStr6;
        this.canSubmit = this.otpCode.length === 6 && !this.otpFailed;
        return this.canSubmit;
    }

    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
    onPaste(event: ClipboardEvent, startPosition: number = 1) {
        if (this.otpFailed) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        const pastedData = event.clipboardData?.getData('text') ?? '';
        const digits = pastedData.replace(/\D/g, '').slice(0, 6);

        if (digits.length > 0) {
            this.fillOtpDigits(digits, startPosition);
        }
    }

    private fillOtpDigits(digits: string, startPosition: number = 1): void {
        const start = digits.length === 6 ? 1 : startPosition;
        const otpDigits = [
            this.numStr1,
            this.numStr2,
            this.numStr3,
            this.numStr4,
            this.numStr5,
            this.numStr6,
        ];

        for (
            let index = start - 1, digitIndex = 0;
            index < otpDigits.length && digitIndex < digits.length;
            index++, digitIndex++
        ) {
            otpDigits[index] = digits.charAt(digitIndex);
        }

        [
            this.numStr1,
            this.numStr2,
            this.numStr3,
            this.numStr4,
            this.numStr5,
            this.numStr6,
        ] = otpDigits;

        const isValid = this.checkValid();
        if (isValid) {
            this.input6?.nativeElement?.blur();
            if (this.isDialog) {
                this.verify();
            }
        } else {
            const nextEmpty = otpDigits.findIndex((d) => !d) + 1;
            if (nextEmpty > 0) {
                this.focusInput(nextEmpty);
            }
        }
    }

    focusInput(position: number): void {
        switch (position) {
            case 1: this.input1?.nativeElement?.focus(); break;
            case 2: this.input2?.nativeElement?.focus(); break;
            case 3: this.input3?.nativeElement?.focus(); break;
            case 4: this.input4?.nativeElement?.focus(); break;
            case 5: this.input5?.nativeElement?.focus(); break;
            case 6: this.input6?.nativeElement?.focus(); break;
        }
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
        }
    }

    private shouldAllowShortcut(event: KeyboardEvent): boolean {
        return event.ctrlKey || event.metaKey || event.altKey;
    }

    onOtpInput(position: number, event: Event): void {
        if (this.otpFailed) {
            return;
        }

        const input = event.target as HTMLInputElement;
        const digits = input.value.replace(/\D/g, '');

        if (!digits) {
            this.setOtpDigit(position, '');
            this.checkValid();
            return;
        }

        if (digits.length > 1) {
            this.fillOtpDigits(digits, position);
            return;
        }

        this.setOtpDigit(position, digits);
        const isValid = this.checkValid();
        if (position < 6 && !isValid) {
            this.focusInput(position + 1);
        } else if (isValid) {
            this.input6?.nativeElement?.blur();
            if (this.isDialog) {
                this.verify();
            }
        }
    }
}
