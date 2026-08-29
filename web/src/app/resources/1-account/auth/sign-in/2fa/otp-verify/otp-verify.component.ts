import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslocoModule } from '@ngneat/transloco';
import { LanguagesComponent } from 'app/layout/common/languages/languages.component';

@Component({
    selector: 'app-otp-verify',
    templateUrl: './otp-verify.component.html',
    styleUrl: './otp-verify.component.scss',
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        TranslocoModule,
        LanguagesComponent
    ]
})
export class OtpVerifyComponent implements OnInit, OnDestroy {
    @Input() selectedChannel: 'email' | 'phone' | 'authenticator' = 'email';
    @Input() displayDestination: string = '';
    @Input() isOtpLoading: boolean = false;
    @Input() remainingTime: number = 60;
    @Input() resendDisabled: boolean = true;
    @Input() reSendOtp: boolean = false;
    @Input() otpFailed: boolean = false;

    @Output() submitOtp = new EventEmitter<string>();
    @Output() resendOtp = new EventEmitter<void>();
    @Output() changeChannel = new EventEmitter<void>();
    @Output() backStep = new EventEmitter<void>();
    @Output() openAbout = new EventEmitter<void>();
    @Output() openContact = new EventEmitter<void>();

    @ViewChild('otpInput1') otpInput1!: ElementRef<HTMLInputElement>;
    @ViewChild('otpInput2') otpInput2!: ElementRef<HTMLInputElement>;
    @ViewChild('otpInput3') otpInput3!: ElementRef<HTMLInputElement>;
    @ViewChild('otpInput4') otpInput4!: ElementRef<HTMLInputElement>;
    @ViewChild('otpInput5') otpInput5!: ElementRef<HTMLInputElement>;
    @ViewChild('otpInput6') otpInput6!: ElementRef<HTMLInputElement>;

    public numStr1: string = '';
    public numStr2: string = '';
    public numStr3: string = '';
    public numStr4: string = '';
    public numStr5: string = '';
    public numStr6: string = '';
    public canSubmit: boolean = false;
    public otpCode: string = '';

    ngOnInit(): void {
        setTimeout(() => {
            this.focusInput(1);
        }, 150);
    }

    ngOnDestroy(): void {}

    clearAllInputs(): void {
        this.numStr1 = '';
        this.numStr2 = '';
        this.numStr3 = '';
        this.numStr4 = '';
        this.numStr5 = '';
        this.numStr6 = '';
        this.canSubmit = false;
        this.otpCode = '';
    }

    checkOtpValid(): boolean {
        this.otpCode = (this.numStr1 + this.numStr2 + this.numStr3 + this.numStr4 + this.numStr5 + this.numStr6).trim();
        this.canSubmit = this.otpCode.length === 6 && !this.otpFailed;
        return this.canSubmit;
    }

    getOtpDigit(position: number): string {
        switch (position) {
            case 1: return this.numStr1;
            case 2: return this.numStr2;
            case 3: return this.numStr3;
            case 4: return this.numStr4;
            case 5: return this.numStr5;
            case 6: return this.numStr6;
            default: return '';
        }
    }

    setOtpDigit(position: number, value: string): void {
        const digit = value ? value.slice(-1) : '';
        switch (position) {
            case 1: this.numStr1 = digit; break;
            case 2: this.numStr2 = digit; break;
            case 3: this.numStr3 = digit; break;
            case 4: this.numStr4 = digit; break;
            case 5: this.numStr5 = digit; break;
            case 6: this.numStr6 = digit; break;
        }
    }

    focusInput(position: number): void {
        switch (position) {
            case 1: this.otpInput1?.nativeElement?.focus(); break;
            case 2: this.otpInput2?.nativeElement?.focus(); break;
            case 3: this.otpInput3?.nativeElement?.focus(); break;
            case 4: this.otpInput4?.nativeElement?.focus(); break;
            case 5: this.otpInput5?.nativeElement?.focus(); break;
            case 6: this.otpInput6?.nativeElement?.focus(); break;
        }
    }

    onOtpInput(position: number, event: Event): void {
        if (this.otpFailed) return;
        const input = event.target as HTMLInputElement;
        const value = input.value.replace(/\D/g, '');

        if (!value) {
            this.setOtpDigit(position, '');
            this.checkOtpValid();
            return;
        }

        if (value.length > 1) {
            this.fillOtpDigits(value, position);
            return;
        }

        this.setOtpDigit(position, value);
        const isValid = this.checkOtpValid();

        if (position < 6) {
            this.focusInput(position + 1);
        } else if (isValid) {
            this.otpInput6?.nativeElement?.blur();
        }
    }

    onKeyDown(position: number, event: KeyboardEvent): void {
        if (event.key === 'Backspace') {
            const currentVal = this.getOtpDigit(position);
            if (!currentVal && position > 1) {
                this.setOtpDigit(position - 1, '');
                this.focusInput(position - 1);
                this.checkOtpValid();
                event.preventDefault();
            }
        }
    }

    private fillOtpDigits(digits: string, startPosition: number = 1): void {
        const otpDigits = [this.numStr1, this.numStr2, this.numStr3, this.numStr4, this.numStr5, this.numStr6];
        for (let index = startPosition - 1, digitIndex = 0; index < otpDigits.length && digitIndex < digits.length; index++, digitIndex++) {
            otpDigits[index] = digits.charAt(digitIndex);
        }
        [this.numStr1, this.numStr2, this.numStr3, this.numStr4, this.numStr5, this.numStr6] = otpDigits;
        const isValid = this.checkOtpValid();
        if (isValid) {
            this.otpInput6?.nativeElement?.blur();
        } else {
            const nextEmpty = otpDigits.findIndex(d => !d) + 1;
            if (nextEmpty > 0) this.focusInput(nextEmpty);
        }
    }

    @HostListener('document:keyup', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent): void {
        if (event.key === 'Enter') {
            if (this.checkOtpValid()) {
                this.otpInput6?.nativeElement?.blur();
                this.onVerify();
            }
            event.preventDefault();
        }
    }

    onOtpPaste(event: ClipboardEvent): void {
        if (this.otpFailed) return;
        event.preventDefault();
        event.stopPropagation();
        const pastedData = event.clipboardData?.getData('text') ?? '';
        const digits = pastedData.replace(/\D/g, '').slice(0, 6);
        if (digits.length > 0) {
            this.fillOtpDigits(digits);
        }
    }

    onVerify(): void {
        if (this.isOtpLoading) return;
        const code = (this.numStr1 + this.numStr2 + this.numStr3 + this.numStr4 + this.numStr5 + this.numStr6).trim();
        if (code.length === 6) {
            this.submitOtp.emit(code);
        }
    }

    onResend(): void {
        if (this.resendDisabled || this.isOtpLoading) return;
        this.clearAllInputs();
        this.resendOtp.emit();
    }

    onChangeMethod(): void {
        this.changeChannel.emit();
    }

    onChangeChannel(): void {
        this.changeChannel.emit();
    }

    onBack(): void {
        this.backStep.emit();
    }
}
