import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslocoModule } from '@ngneat/transloco';
import { LanguagesComponent } from 'app/layout/common/languages/languages.component';

@Component({
    selector: 'app-select-2fa',
    templateUrl: './select-2fa.component.html',
    styleUrl: './select-2fa.component.scss',
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        TranslocoModule,
        LanguagesComponent
    ]
})
export class Select2faComponent {
    @Input() availableChannels: string[] = ['email', 'phone', 'authenticator'];
    @Input() isOtpLoading: boolean = false;
    @Input() userEmail: string = '';
    @Input() userPhone: string = '';

    @Output() channelSelected = new EventEmitter<'email' | 'phone' | 'authenticator'>();
    @Output() backToLogin = new EventEmitter<void>();
    @Output() openAbout = new EventEmitter<void>();
    @Output() openContact = new EventEmitter<void>();

    selectChannel(channel: 'email' | 'phone' | 'authenticator'): void {
        if (this.isOtpLoading) return;
        this.channelSelected.emit(channel);
    }

    onBack(): void {
        this.backToLogin.emit();
    }
}
