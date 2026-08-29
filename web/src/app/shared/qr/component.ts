import { DialogRef }                                                          from '@angular/cdk/dialog';
import { NgIf }                                                               from '@angular/common';
import { HttpClient }                                                         from '@angular/common/http';
import { Component, DestroyRef, Inject, inject, OnDestroy, OnInit, signal }   from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule }                                   from '@angular/material/dialog';
import { MatIconModule }                                                      from '@angular/material/icon';
import { Router }                                                             from '@angular/router';
import { TranslocoModule }                                                    from '@ngneat/transloco';
import { AuthService }                                                        from 'app/core/auth/auth.service';
import { UserService }                                                        from 'app/core/user/user.service';
import { SkeletonQrCodeComponent }                                            from 'app/shared/skeleton/auth/qr_code/skeleton.component';
import { env }                                                                from 'envs/env';
import { SnackbarService }                                                    from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants                                                        from 'helper/shared/constants';
import { finalize, tap }                                                      from 'rxjs';
import { io, Socket }                                                         from 'socket.io-client';

interface QRDialogData {
    with_token: boolean;
}

interface AuthResponse {
    user: { email: string };
    access_token: string;
    refresh_token: string;
    message: string;
}

@Component({
    standalone: true,
    imports: [
        MatDialogModule,
        MatIconModule,
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
    readonly session_id                   = signal<string>('');
    readonly displayTime                  = signal<string>('01:00');

    // Constants
    private readonly COUNTDOWN_DURATION   = 60; // seconds
    private readonly QR_SOCKET_NAMESPACE  = '/qr';
    private readonly AUTHENTICATED_EVENT  = 'authenticated';
    private readonly QR_GENERATED_EVENT   = 'qr_generated';
    private readonly QR_SCANNED_EVENT     = 'qr_scanned';

    // Private properties
    private socket?: Socket;
    private intervalId?: ReturnType<typeof setInterval>;
    private countdown = this.COUNTDOWN_DURATION;
    private readonly destroyRef = inject(DestroyRef);

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
        
        this.user = this._userService.getUser()
        this._userService.user$.subscribe(item => {
            this.user = item;
        })
        this.startCountdown();
        if (this.data.with_token) {
            // If with_token is true, validate token and request QR code directly
            this.validateAndRequestQrWithToken();
        } else {
            // Otherwise, initialize socket for session-based QR code
            this.initializeSocket();
        }

        
    }


    ngOnDestroy(): void {
        this.cleanup();
    }
    private validateAndRequestQrWithToken(): void {
        const accessToken = this.authService.accessToken;
        if (!accessToken) {
            this.snackbarService.openSnackBar(
                'No valid token found. Please log in again.',
                GlobalConstants.error
            );
            this.isLoading.set(false);
            this.closeDialog();
            return;
        }
        this.requestQr();
    }

    // ============ Socket Management ============
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
            this.snackbarService.openSnackBar(
                'Failed to initialize connection',
                GlobalConstants.error
            );
            this.isLoading.set(false);
        }
    }

    private setupSocketEvents(): void {
        if (!this.socket) return;

        // Connection established
        this.socket.on('connect', () => {
            console.log('WebSocket connected, ID:', this.socket?.id);
            if (this.socket?.id) {
                this.session_id.set(this.socket.id);
                // Request QR code after socket is connected
                this.requestQr('auth');
            }
        });

        // Connection error
        this.socket.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error);
            this.snackbarService.openSnackBar(
                'Connection failed. Please try again.',
                GlobalConstants.error
            );
            this.isLoading.set(false);
        });

        // Handle QR code generated event (if your backend sends this)
        this.socket.on(this.QR_GENERATED_EVENT, (data: any) => {
            console.log('QR code generated:', data);
        });

        // Handle QR code scanned event
        this.socket.on(this.QR_SCANNED_EVENT, (data: any) => {
            console.log('QR code scanned:', data);
            this.snackbarService.openSnackBar(
                'QR code scanned! Authenticating...',
                GlobalConstants.success
            );
        });

        // Handle authentication result - SINGLE handler
        this.socket.on(this.AUTHENTICATED_EVENT, (data: any) => {
            console.log('Authentication successful:', data);
            this.handleAuthentication(data);
        });

        // Handle disconnection
        this.socket.on('disconnect', (reason) => {
            console.log('WebSocket disconnected:', reason);
            if (reason === 'io server disconnect') {
                // The server has forcefully disconnected the socket
                this.socket?.connect();
            }
        });

        // Handle any socket errors
        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
            this.snackbarService.openSnackBar(
                'Connection error occurred',
                GlobalConstants.error
            );
        });
    }

    private _hasOrgId = !!localStorage.getItem('org');
    private _hasCurrentRole = !!localStorage.getItem('currentRole');
    private _user_id: number = inject(UserService).user?.id;
    // Removed duplicate declaration of _userService to fix modifier mismatch error
    // ============ Authentication ============
    private handleAuthentication(data: any): void {
        try {
            // Save user info
            this.authService.username = { username: data?.data?.user?.email };

            // Save tokens
            this.authService.accessToken = data?.data?.access_token;
            this.authService.verified(data?.data?.access_token);
            if (data?.data?.refresh_token) {
                this.authService.refreshToken = data.data.refresh_token;
            }

            const userRoles = data?.data?.user.roles || [];

            const rolesNames: string[] = userRoles.map((r: any) => r.role.name_en);
            const departments = userRoles.map(r => r.department);
            let selectedOrg = null;

            if (!this._hasOrgId || this._user_id !== data?.data.user.id) {
                this._userService.org = departments[0] as any;
            }
            if (rolesNames.length > 0) {
                localStorage.setItem('roles', JSON.stringify(rolesNames));

                if (!this._hasCurrentRole || this._user_id !== data?.data.user.id) {
                    localStorage.setItem('currentRole', rolesNames[0]);
                }

                if (selectedOrg) {

                    localStorage.setItem('org', JSON.stringify(selectedOrg));
                    this._userService.org = selectedOrg;

                }
            }
            // Show success
            this.snackbarService.openSnackBar(
                data?.message || 'Authentication successful',
                GlobalConstants.success
            );

            // Cleanup and navigate
            this.cleanup();
            this.dialogRef.close();
            this.router.navigateByUrl('');
        } catch (error) {
            console.error('Authentication handling error:', error);
            this.snackbarService.openSnackBar(
                'Authentication failed',
                GlobalConstants.error
            );
        }
    }

    // ============ QR Code Request ============
    // private requestQr(): void {
    //     // Wait for socket to be connected and have session ID
    //     if (!this.data.with_token && !this.session_id()) {
    //         console.warn('Session ID not available yet, retrying...');
    //         setTimeout(() => this.requestQr(), 100);
    //         return;
    //     }

    //     const params = this.data.with_token
    //         ? 'with_token=true'
    //         : `session_id=${this.session_id()}`;

    //     console.log('Requesting QR code with params:', params);

    //     this.httpClient
    //         .get(`${env.API_BASE_URL}/account/auth/qrcode?${params}`, {
    //             responseType: 'blob',
    //         })
    //         .pipe(
    //             take(1),
    //             catchError((error: HttpErrorResponse) => {
    //                 console.error('Error fetching QR code:', error);
    //                 this.snackbarService.openSnackBar(
    //                     'Failed to load QR code',
    //                     GlobalConstants.error
    //                 );
    //                 return of(null);
    //             }),
    //             finalize(() => this.isLoading.set(false)),
    //             takeUntilDestroyed(this.destroyRef)
    //         )
    //         .subscribe({
    //             next: (blob: Blob | null) => {
    //                 if (blob) {
    //                     this.convertBlobToBase64(blob);
    //                 } else {
    //                     this.snackbarService.openSnackBar(
    //                         'No QR code received from server',
    //                         GlobalConstants.error
    //                     );
    //                 }
    //             },
    //         });
    // }
    requestQr(role?: string) {

        if(role !== 'auth'){
            role = 'profile'
        }
        const params = this.data.with_token
            ? `with_token=true`
            : `session_id=${this.session_id()}`;

            this.httpClient.get(`${this._url}/account/${role}/qrcode?${params}`, {
                responseType: 'blob',
            })
            .pipe(
                tap(() => this.isLoading.set(true)),
                finalize(() => this.isLoading.set(false))
            )
            .subscribe({
                next: (blob: Blob) => {
                    const reader = new FileReader();
                    reader.onload = () => this.qrCode.set(reader.result as string);
                    reader.readAsDataURL(blob);
                },
                error: (error) => console.error('Error fetching QR code:', error)
            });
    }



    // Remove the duplicate onQrResult method since we're handling it directly in socket events

    private convertBlobToBase64(blob: Blob): void {
        const reader = new FileReader();
        reader.onload = () => {
            this.qrCode.set(reader.result as string);
            console.log('QR code loaded successfully');
        };
        reader.onerror = () => {
            console.error('Failed to read QR code blob');
            this.snackbarService.openSnackBar(
                'Failed to display QR code',
                GlobalConstants.error
            );
        };
        reader.readAsDataURL(blob);
    }

    // ============ Countdown Timer ============
    private startCountdown(): void {
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
        const minutes = Math.floor(seconds / 60)
            .toString()
            .padStart(2, '0');
        const secs = (seconds % 60)
            .toString()
            .padStart(2, '0');
        this.displayTime.set(`${minutes}:${secs}`);
    }

    private handleTimeout(): void {
        this.cleanup();
        this.snackbarService.openSnackBar(
            'QR code expired. Please try again.',
            GlobalConstants.error
        );
        this.closeDialog();
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

        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.socket = undefined;
        }
    }

    // ============ Debug Method ============
    // Add this method to check socket status in template if needed
    getSocketStatus(): string {
        return this.socket?.connected ? 'connected' : 'disconnected';
    }
}
