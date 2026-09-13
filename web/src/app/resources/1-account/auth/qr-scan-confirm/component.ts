import { CommonModule }                                                 from '@angular/common';
import { HttpClient }                                                   from '@angular/common/http';
import { Component, OnInit, inject, signal }                            from '@angular/core';
import { ActivatedRoute, RouterLink }                                   from '@angular/router';
import { MatIconModule }                                                from '@angular/material/icon';
import { MatButtonModule }                                              from '@angular/material/button';
import { env }                                                          from 'envs/env';

@Component({
    selector: 'auth-qr-scan-confirm',
    standalone: true,
    imports: [CommonModule, MatIconModule, MatButtonModule, RouterLink],
    templateUrl: './template.html',
    styleUrl: './style.scss',
})
export class QrScanConfirmComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly http = inject(HttpClient);

    readonly isLoading = signal<boolean>(true);
    readonly isSuccess = signal<boolean>(false);
    readonly errorMessage = signal<string>('');

    ngOnInit(): void {
        const token = this.route.snapshot.queryParams['token'] || this.route.snapshot.queryParams['qr_token'];
        if (!token) {
            this.isLoading.set(false);
            this.isSuccess.set(false);
            this.errorMessage.set('មិនមានទិន្នន័យ QR Code ត្រឹមត្រូវទេ។');
            return;
        }

        this.confirmLogin(token);
    }

    private confirmLogin(token: string): void {
        this.http.post<any>(`${env.API_BASE_URL}/account/profile/qr-login/scan`, { qr_token: token })
            .subscribe({
                next: (res) => {
                    this.isLoading.set(false);
                    this.isSuccess.set(true);
                },
                error: (err) => {
                    this.isLoading.set(false);
                    this.isSuccess.set(false);
                    const msg = err?.error?.message || err?.error?.response_msg;
                    this.errorMessage.set(msg || 'QR Code នេះផុតសុពលភាព ឬត្រូវបានប្រើប្រាស់រួចហើយ។');
                }
            });
    }
}
