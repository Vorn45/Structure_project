import { DialogRef }                                                          from '@angular/cdk/dialog';
import { CommonModule, NgIf }                                                   from '@angular/common';
import { HttpClient }                                                         from '@angular/common/http';
import { Component, DestroyRef, Inject, inject, OnDestroy, OnInit, signal }   from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule }                                   from '@angular/material/dialog';
import { MatIconModule }                                                      from '@angular/material/icon';
import { MatButtonModule }                                                    from '@angular/material/button';
import { Router }                                                             from '@angular/router';
import { TranslocoModule }                                                    from '@ngneat/transloco';
import { AuthService }                                                        from 'app/core/auth/auth.service';
import { UserService }                                                        from 'app/core/user/user.service';
import { SkeletonQrCodeComponent }                                            from 'app/shared/skeleton/auth/qr_code/skeleton.component';
import { env }                                                                from 'envs/env';
import { SnackbarService }                                                    from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants                                                        from 'helper/shared/constants';
import QRCode                                                                 from 'qrcode';
import { finalize, Subscription, interval, switchMap, takeWhile }             from 'rxjs';
import { io, Socket }                                                         from 'socket.io-client';

interface QRDialogData {
    with_token?: boolean;
}

@Component({
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatIconModule,
        MatButtonModule,
        SkeletonQrCodeComponent,
        NgIf,
        TranslocoModule
    ],
    selector: 'qrdialog-component',
    templateUrl: 'template.html',
    styleUrl: './style.scss',
})
export class QRDialogComponent implements OnDestroy, OnInit {
    // Signals
    readonly qrCode                       = signal<string>('');
    readonly isLoading                    = signal<boolean>(true);
    readonly isExpired                    = signal<boolean>(false);
    readonly session_id                   = signal<string>('');
    readonly displayTime                  = signal<string>('01:00');
    readonly currentToken                 = signal<string>('');

    // Constants
    private readonly COUNTDOWN_DURATION   = 60; // seconds

    // Private properties
    private socket?: Socket;
    private intervalId?: ReturnType<typeof setInterval>;
    private pollSubscription?: Subscription;
    private countdown = this.COUNTDOWN_DURATION;

    private readonly _url: string = env.API_BASE_URL;
    user: any;
    private readonly _userService = inject(UserService);

    constructor(
        @Inject(MAT_DIALOG_DATA) private readonly data: QRDialogData,
        private readonly httpClient: HttpClient,
        private readonly authService: AuthService,
        private readonly snackbarService: SnackbarService,
        private readonly dialogRef: DialogRef<QRDialogComponent>,
        private readonly router: Router,
    ) { }

    // ============ Lifecycle ============
    ngOnInit(): void {
        this.user = this._userService.getUser();
        this._userService.user$.subscribe(item => {
            this.user = item;
        });

        this.generateQr();
    }

    ngOnDestroy(): void {
        this.cleanup();
    }

    // ============ QR Generation ============
    generateQr(): void {
        this.cleanup();
        this.isLoading.set(true);
        this.isExpired.set(false);
        this.countdown = this.COUNTDOWN_DURATION;
        this.updateDisplayTime(this.countdown);

        if (this.authService.accessToken) {
            // Logged-in user generating QR for mobile app pairing / scan login
            this.httpClient.get<any>(`${this._url}/account/profile/qr-login`)
                .pipe(finalize(() => this.isLoading.set(false)))
                .subscribe({
                    next: async (res) => {
                        const qrToken = res?.data?.qr_token;
                        if (qrToken) {
                            this.currentToken.set(qrToken);
                            try {
                                const qrPayload = `${window.location.origin}/auth/qr-login?token=${qrToken}`;
                                const qrImg = await QRCode.toDataURL(qrPayload, {
                                    width: 220,
                                    margin: 1,
                                    color: { dark: '#0f172a', light: '#ffffff' },
                                });
                                this.qrCode.set(qrImg);
                                this.startCountdown();
                                this.startPollingStatus(qrToken);
                            } catch (err) {
                                console.error('Error generating QR image:', err);
                                this.snackbarService.openSnackBar('Failed to render QR Code', GlobalConstants.error);
                            }
                        } else {
                            this.snackbarService.openSnackBar('Failed to generate QR session', GlobalConstants.error);
                        }
                    },
                    error: (err) => {
                        console.error('Error requesting QR login session:', err);
                        this.snackbarService.openSnackBar('Error creating QR session', GlobalConstants.error);
                    }
                });
        } else {
            // Unauthenticated - initialize socket
            this.initializeSocket();
        }
    }

    private startPollingStatus(qrToken: string): void {
        this.pollSubscription?.unsubscribe();
        this.pollSubscription = interval(2000).pipe(
            switchMap(() => this.httpClient.get<any>(`${this._url}/account/profile/qr-login/status?qr_token=${qrToken}`)),
            takeWhile(res => res?.data?.status === 'pending', true)
        ).subscribe({
            next: (res) => {
                const status = res?.data?.status;
                if (status === 'used') {
                    this.cleanup();
                    this.snackbarService.openSnackBar('បានស្កេនចូលដោយជោគជ័យ!', GlobalConstants.success);
                    this.dialogRef.close();
                } else if (status === 'expired') {
                    this.handleTimeout();
                }
            },
            error: (err) => {
                console.error('Polling QR status error:', err);
            }
        });
    }

    // ============ Socket Management (For Auth Page) ============
    private initializeSocket(): void {
        try {
            const socketUrl = env.SOCKET_URL || '';
            this.socket = io(`${socketUrl}/qr`, {
                transports: ['websocket'],
                reconnection: true,
                reconnectionAttempts: 3,
                reconnectionDelay: 1000,
                timeout: 10000,
            });

            this.setupSocketEvents();
        } catch (error) {
            console.error('Failed to initialize socket:', error);
            this.isLoading.set(false);
        }
    }

    private setupSocketEvents(): void {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            if (this.socket?.id) {
                this.session_id.set(this.socket.id);
                this.generateSocketQr(this.socket.id);
            }
        });

        this.socket.on('connect_error', () => {
            this.isLoading.set(false);
        });

        this.socket.on('qr_scanned', () => {
            this.snackbarService.openSnackBar('QR code scanned! Authenticating...', GlobalConstants.success);
        });

        this.socket.on('authenticated', (data: any) => {
            this.handleAuthentication(data);
        });
    }

    private async generateSocketQr(sessionId: string): Promise<void> {
        try {
            const qrPayload = `${window.location.origin}/auth/qr-login?session_id=${sessionId}`;
            const qrImg = await QRCode.toDataURL(qrPayload, {
                width: 220,
                margin: 1,
                color: { dark: '#0f172a', light: '#ffffff' },
            });
            this.qrCode.set(qrImg);
            this.isLoading.set(false);
            this.startCountdown();
        } catch (err) {
            this.isLoading.set(false);
        }
    }

    private handleAuthentication(data: any): void {
        try {
            this.authService.username = { username: data?.data?.user?.email };
            this.authService.accessToken = data?.data?.access_token;
            this.authService.verified(data?.data?.access_token);
            if (data?.data?.refresh_token) {
                this.authService.refreshToken = data.data.refresh_token;
            }

            this.snackbarService.openSnackBar(
                data?.message || 'Authentication successful',
                GlobalConstants.success
            );

            this.cleanup();
            this.dialogRef.close();
            this.router.navigateByUrl(this.authService.getRedirectUrl());
        } catch (error) {
            console.error('Authentication handling error:', error);
            this.snackbarService.openSnackBar('Authentication failed', GlobalConstants.error);
        }
    }

    // ============ Countdown Timer ============
    private startCountdown(): void {
        if (this.intervalId) clearInterval(this.intervalId);
        this.updateDisplayTime(this.countdown);
        this.intervalId = setInterval(() => {
            this.countdown--;
            this.updateDisplayTime(this.countdown);

            if (this.countdown <= 0) {
                this.handleTimeout();
            }
        }, 1000);
    }

    private updateDisplayTime(seconds: number): void {
        const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        this.displayTime.set(`${minutes}:${secs}`);
    }

    private handleTimeout(): void {
        this.cleanup();
        this.isExpired.set(true);
    }

    // ============ Dialog Control ============
    closeDialog(): void {
        this.cleanup();
        this.dialogRef.close();
    }

    // ============ Cleanup ============
    private cleanup(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
        }

        if (this.pollSubscription) {
            this.pollSubscription.unsubscribe();
            this.pollSubscription = undefined;
        }

        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.socket = undefined;
        }
    }
}
