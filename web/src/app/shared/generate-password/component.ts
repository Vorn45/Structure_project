import { NgIf } from '@angular/common';
import { Component, inject, signal, Inject, Optional } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSliderModule } from '@angular/material/slider';
import { SideDialogCloseButtonComponent } from "app/shared/side-dialog-close-button/component";
import { TranslocoModule } from '@ngneat/transloco';

/**
 * The symbols the app's password rules accept — the reset-password and
 * change-password checks look for two of exactly these, so generating from a
 * wider set (it used to include ( ) and %) produced passwords those screens
 * then rejected.
 */
const SYMBOLS = '@#!$&*';

@Component({
    standalone: true,
    imports: [
        MatIconModule,
        MatDialogModule,
        MatButtonModule,
        FormsModule,
        NgIf,
        MatCheckboxModule,
        MatSliderModule,
        MatProgressSpinnerModule,
        SideDialogCloseButtonComponent,
        TranslocoModule
    ],
    selector: 'generate-password',
    templateUrl: './template.html',
    styleUrls: ['./style.scss']
})

export class GeneratePasswordComponent {
    password = signal<string>('');
    isPasswordCopied = signal<boolean>(false);
    isLoading = signal<boolean>(false);

    upper = signal<boolean>(true);
    lower = signal<boolean>(true);
    number = signal<boolean>(true);
    symbol = signal<boolean>(true);
    length = signal<number>(10);

    constructor(
        @Optional() @Inject(MAT_DIALOG_DATA) public dialogData: any,
        @Optional() public dialogRef: MatDialogRef<GeneratePasswordComponent>,
    ) {
        this.generatePassword(); // Generate a default password on initialization
    }

    private getCharset(options: { upper?: boolean; lower?: boolean; number?: boolean; symbol?: boolean }) {
        let charset = '';
        if (options.upper) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (options.lower) charset += 'abcdefghijklmnopqrstuvwxyz';
        if (options.number) charset += '0123456789';
        if (options.symbol) charset += SYMBOLS;
        return charset;
    }
    sliderChange(event: Event) {
        const val = parseInt((event.target as HTMLInputElement).value) || 6;
        this.length.set(Math.max(6, val));
        this.generatePassword();
    }
    //thank you chatgpt for the code
    generatePassword() {
        const options = {
            upper: this.upper(),
            lower: this.lower(),
            number: this.number(),
            symbol: this.symbol()
        };
        const charset = this.getCharset(options);
        if (!charset) {
            this.password.set('');
            this.isPasswordCopied.set(false);
            return;
        }

        // Ensure at least one character from each selected type is included —
        // two symbols, because that is what the password rules ask for.
        const requiredChars: string[] = [];
        if (options.upper) requiredChars.push(this.getRandomChar('ABCDEFGHIJKLMNOPQRSTUVWXYZ'));
        if (options.lower) requiredChars.push(this.getRandomChar('abcdefghijklmnopqrstuvwxyz'));
        if (options.number) requiredChars.push(this.getRandomChar('0123456789'));
        if (options.symbol) {
            requiredChars.push(this.getRandomChar(SYMBOLS));
            requiredChars.push(this.getRandomChar(SYMBOLS));
        }

        let result = requiredChars;
        const length = this.length();
        if (result.length > length) {
            result = result.slice(0, length);
        }

        for (let i = requiredChars.length; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * charset.length);
            result.push(charset[randomIndex]);
        }
        // Shuffle result to avoid predictable positions for required characters
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        this.password.set(result.join(''));
        this.isPasswordCopied.set(false);
    }

    private getRandomChar(charset: string): string {
        const index = Math.floor(Math.random() * charset.length);
        return charset[index];
    }

    copyPassword() {
        this.isPasswordCopied.set(true);
        const password = this.password();
        if (navigator.clipboard) {
            navigator.clipboard.writeText(password);
        } else {
            const textarea = document.createElement('textarea');
            textarea.value = password;
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
            } catch (e) {
                // Fallback: prompt user to copy manually
                window.prompt('Copy to clipboard: Ctrl+C, Enter', password);
            }
            document.body.removeChild(textarea);
        }
    }

    onUsePassword(): void {
        if (this.isLoading() || !this.password()) return;

        this.copyPassword();

        if (this.dialogData?.onSubmit && typeof this.dialogData.onSubmit === 'function') {
            this.isLoading.set(true);
            const result = this.dialogData.onSubmit(this.password());

            if (result && typeof result.subscribe === 'function') {
                result.subscribe({
                    next: (res: any) => {
                        this.isLoading.set(false);
                        this.dialogRef?.close({ submitted: true, password: this.password(), res });
                    },
                    error: (err: any) => {
                        this.isLoading.set(false);
                    }
                });
            } else {
                this.isLoading.set(false);
                this.dialogRef?.close({ submitted: true, password: this.password() });
            }
        } else {
            this.dialogRef?.close(this.password());
        }
    }
}
