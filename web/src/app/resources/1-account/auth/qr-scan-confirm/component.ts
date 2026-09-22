import { CommonModule }                                                 from '@angular/common';
import { HttpClient }                                                   from '@angular/common/http';
import { Component, OnInit, inject, signal }                            from '@angular/core';
import { ActivatedRoute, Router, RouterLink }                           from '@angular/router';
import { MatIconModule }                                                from '@angular/material/icon';
import { MatButtonModule }                                              from '@angular/material/button';
import { AuthService }                                                  from 'app/core/auth/auth.service';
import { UserService }                                                  from 'app/core/user/user.service';
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
    private readonly router = inject(Router);
    private readonly http = inject(HttpClient);
    private readonly authService = inject(AuthService);
    private readonly userService = inject(UserService);

    readonly isLoading = signal<boolean>(true);
    readonly isSuccess = signal<boolean>(false);
    readonly errorMessage = signal<string>('');
    readonly userName = signal<string>('');

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

                    if (res?.token) {
                        this.authService.applySession(res);
                        const user = res?.data?.user;
                        if (user) {
                            this.userService.user = user;
                            const displayName = user.name_kh || user.name_en || user.name || user.email || 'អ្នកប្រើប្រាស់';
                            this.userName.set(displayName);
                            this.authService.username = { username: user.email || user.phone || displayName };
                        }

                        // Automatically redirect to home / dashboard after brief success display
                        setTimeout(() => {
                            const redirectUrl = this.authService.getRedirectUrl() || '/member/home';
                            this.router.navigateByUrl(redirectUrl);
                        }, 1200);
                    }
                },
                error: (err) => {
                    this.isLoading.set(false);
                    this.isSuccess.set(false);
                    const msg = err?.error?.message || err?.error?.response_msg;
                    this.errorMessage.set(msg || 'QR Code នេះផុតសុពលភាព ឬត្រូវបានប្រើប្រាស់រួចហើយ។');
                }
            });
    }

    goToHome(): void {
        const redirectUrl = this.authService.getRedirectUrl() || '/member/home';
        this.router.navigateByUrl(redirectUrl);
    }
}

