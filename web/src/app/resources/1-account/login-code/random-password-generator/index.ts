import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslocoModule } from '@ngneat/transloco';
import { RouterModule } from '@angular/router';
import { LanguagesComponent } from 'app/layout/common/languages/languages.component';

@Component({
    selector: 'random-password-generator',
    templateUrl: './template.html',
    styleUrls: ['./style.scss'],
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatCheckboxModule,
        MatProgressSpinnerModule,
        TranslocoModule,
        RouterModule,
        LanguagesComponent
    ],
})
export class RandomPasswordGeneratorComponent {
    public generatedPassword: string = '';
    private _passwordLength: number = 6;
    public includeUppercase: boolean = true;
    public includeLowercase: boolean = true;
    public includeNumbers: boolean = true;
    public includeSymbols: boolean = true;
    public isLoading: boolean = false;
    private generationTimer: ReturnType<typeof setTimeout> | null = null;

    public get passwordLength(): number {
        return this._passwordLength;
    }

    public set passwordLength(value: number) {
        this._passwordLength = this.clampPasswordLength(value);
    }

    constructor(
        public dialogRef: MatDialogRef<RandomPasswordGeneratorComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any = {}
    ) {
        this.generatedPassword = this.buildPassword();
    }

    onLengthChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        const parsedValue = Number.parseInt(input.value, 10);
        this.passwordLength = parsedValue;
        input.value = String(this.passwordLength);
    }

    // async generateAndUsePassword(): Promise<void> {
    //     const password = this.buildPassword();
    //     this.generatedPassword = password;
    //     await this.copyPassword(password);
    //     this.usePassword(password);
    // }

    generateAndUsePassword(): void {
        if (!this.generatedPassword) {
            this.generatedPassword = this.buildPassword();
        }
        this.copyPassword();
        this.usePassword();
    }

    generatePassword(): void {
        this.generatedPassword = this.buildPassword();
    }

    usePassword(password: string = this.generatedPassword): void {
        this.dialogRef.close(password);
    }

    async copyPassword(password: string = this.generatedPassword): Promise<void> {
        if (!password) {
            return;
        }

        if (navigator.clipboard) {
            try {
                await navigator.clipboard.writeText(password);
                return;
            } catch {
            }
        }

        const textArea = document.createElement('textarea');
        textArea.value = password;
        textArea.setAttribute('readonly', '');
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    }

    private clampPasswordLength(value: number): number {
        return Math.min(18, Math.max(6, Number.isNaN(value) ? 6 : value));
    }

    private buildPassword(): string {
        let chars = '';
        if (this.includeUppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (this.includeLowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
        if (this.includeNumbers) chars += '0123456789';
        if (this.includeSymbols) chars += '@#!$&*';

        if (!chars) {
            chars = 'abcdefghijklmnopqrstuvwxyz';
        }

        const length = this.clampPasswordLength(this.passwordLength || 10);
        return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    }

    closeDialog(): void {
        this.dialogRef.close();
    }
}