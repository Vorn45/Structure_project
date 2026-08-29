    import { CommonModule, NgStyle } from '@angular/common';
    import { Component, inject, signal } from '@angular/core';
    import { HttpClient } from '@angular/common/http';
    import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
    import { MatIconModule } from '@angular/material/icon';
    import { MatButtonModule } from '@angular/material/button';
    import { ChangePasswordProfileComponent } from '../change-password/component';
    import { TranslocoModule } from '@ngneat/transloco';
    import { User } from 'app/core/user/user.types';
    import { UserService } from 'app/core/user/user.service';
    import { DialogConfigService } from 'app/shared/dialog-config.service';
    import { SideDialogCloseButtonComponent } from 'app/shared/side-dialog-close-button/component';
    import { DeviceProfileDialogComponent } from '../device/component';
    import { LoginHistoryProfileDialogComponent } from '../login-history/component';
    import { PasskeyProfileDialogComponent } from '../passkey/component';
    import { TelegramTwoFactorDialogComponent } from '../telegram-2fa/component';
    import { LocalPasscodeProfileComponent } from '../local-passcode/component';
    import { VerifyIdentityDialogComponent } from 'app/shared/verify-identity-dialog/component';
    import { GoogleAuthenticatorTwoFactorDialogComponent } from '../google-authenticator-2fa/component';
    import { LocalPasscodeService } from 'app/core/local-passcode/local-passcode.service';
    import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
    import GlobalConstants from 'helper/shared/constants';
    import { env } from 'envs/env';
    import { catchError, finalize, forkJoin, of } from 'rxjs';
    import {
        profileDateValue,
        profileRelativeTime,
    } from '../../profile-display.util';
    import { ProfileService } from '../../profile.service';
    import { ProfileDevice, ProfileSession } from '../../profile.type';

    type TwoFactorChannel = 'phone' | 'telegram' | 'email' | 'authenticator';

    interface TwoFactorSetting {
        phone: boolean;
        telegram: boolean;
        email: boolean;
        authenticator: boolean;
        security_email?: string | null;
        security_phone?: string | null;
    }

    @Component({
        standalone: true,
        imports: [
            CommonModule,
            MatIconModule,
            MatDialogModule,
            NgStyle,
            MatButtonModule,
            TranslocoModule,
            SideDialogCloseButtonComponent,
        ],
        selector: 'profile-security',
        templateUrl: './template.html',
        styleUrls: ['./style.scss'],
    })
    export class ProfileSecurityComponent {
        drawSecurityStatus = signal({
            color: '',
            status: '',
            description: '',
            style: '',
        });

        matDialog = inject(MatDialog);
        dialogConfigService = inject(DialogConfigService);
        private _dialogRef = inject(MatDialogRef, { optional: true });
        private _httpClient = inject(HttpClient);
        private _profileService = inject(ProfileService);
        private _snackbarService = inject(SnackbarService);
        private _localPasscodeService = inject(LocalPasscodeService);
        public user: Partial<User> & { telegram_activated?: boolean } = {};

        // 2FA setting — all channels off by default until loaded from the API
        twoFactor = signal<TwoFactorSetting>({
            phone: false,
            telegram: false,
            email: false,
            authenticator: false,
            security_email: null,
            security_phone: null,
        });
        readonly isLoading = signal(true);
        readonly passwordSubLabel = signal('បានកំណត់ថ្មីៗ');
        readonly isPasswordOld = signal(false);
        readonly passkeyCount = signal(0);
        readonly deviceCountLabel = signal('—');
        readonly latestLoginSummary = signal('មិនមានប្រវត្តិចូល');
        readonly telegramLinked = signal(false);
        readonly telegramUsername = signal<string | null>(null);
        twoFactorLoading = signal<TwoFactorChannel | null>(null);

        private readonly _twoFactorUrl = `${env.API_BASE_URL}/account/profile/2fa`;

        constructor() {
            inject(UserService).user$.subscribe((user) => {
                const base: Partial<User> = user ?? {};
                const storedEmail = localStorage.getItem('2fa_email') || localStorage.getItem('userEmail') || localStorage.getItem('email');
                const storedPhone = localStorage.getItem('2fa_phone');
                this.user = {
                    ...base,
                    ...(!base?.email && storedEmail ? { email: storedEmail } : {}),
                    ...(!base?.phone && storedPhone ? { phone: storedPhone } : {}),
                };
            });

            this._loadSecurityData();
        }

        /** Load all values displayed by the security overview. */
        private _loadSecurityData(): void {
            forkJoin({
                twoFactor: this._httpClient
                    .get<{ data: TwoFactorSetting }>(this._twoFactorUrl)
                    .pipe(catchError(() => of(null))),
                devices: this._profileService
                    .getDevices()
                    .pipe(catchError(() => of(null))),
                history: this._profileService
                    .getLoginHistory()
                    .pipe(catchError(() => of(null))),
                telegram: this._profileService
                    .getTelegramStatus()
                    .pipe(catchError(() => of(null))),
                passwordLastChange: this._profileService
                    .getPasswordLastChange()
                    .pipe(catchError(() => of(null))),
                passkeys: this._profileService
                    .listPasskeys()
                    .pipe(catchError(() => of([]))),
            })
                .pipe(finalize(() => this.isLoading.set(false)))
                .subscribe(({ twoFactor, devices, history, telegram, passwordLastChange, passkeys }) => {
                    const changedDate = passwordLastChange?.changedAt || passwordLastChange?.last_password_changed_at;
                    const daysSince = passwordLastChange?.daysSinceChange ?? passwordLastChange?.days_since_password_changed;

                    if (changedDate) {
                        const time = profileRelativeTime(changedDate);
                        this.passwordSubLabel.set(time === 'ឥឡូវនេះ' ? 'បានផ្លាស់ប្តូរ ថ្មីៗនេះ' : `បានផ្លាស់ប្តូរ ${time}`);
                        const ts = new Date(changedDate).getTime();
                        const days = !Number.isNaN(ts) ? Math.floor((Date.now() - ts) / (1000 * 60 * 60 * 24)) : 0;
                        this.isPasswordOld.set(days > 60);
                    } else if (daysSince !== null && daysSince !== undefined) {
                        if (daysSince === 0) {
                            this.passwordSubLabel.set('បានផ្លាស់ប្តូរ ថ្មីៗនេះ');
                        } else if (daysSince < 30) {
                            this.passwordSubLabel.set(`បានផ្លាស់ប្តូរ ${daysSince} ថ្ងៃមុន`);
                        } else {
                            const months = Math.floor(daysSince / 30);
                            this.passwordSubLabel.set(`បានផ្លាស់ប្តូរ ${months} ខែមុន`);
                        }
                        this.isPasswordOld.set(daysSince > 60);
                    } else {
                        this.passwordSubLabel.set('បានកំណត់ថ្មីៗ');
                        this.isPasswordOld.set(false);
                    }

                    if (Array.isArray(passkeys)) {
                        this.passkeyCount.set(passkeys.length);
                    }

                    if (twoFactor) {
                        this._applySetting(twoFactor.data);
                    } else {
                        this._refreshSecurityStatus();
                    }

                    if (devices) {
                        this.deviceCountLabel.set(`${devices.length} ឧបករណ៍`);
                    }

                    this.latestLoginSummary.set(
                        this._buildLatestLoginSummary(
                            history?.sessions ?? [],
                            devices ?? [],
                        ),
                    );

                    this.telegramLinked.set(telegram?.telegram_linked ?? false);
                    this.telegramUsername.set(telegram?.telegram_username ?? null);
                });
        }

        /** Toggle a 2FA channel on/off. */
        toggleTwoFactor(channel: TwoFactorChannel): void {
            if (this.twoFactorLoading()) return;

            const enabled = !this.twoFactor()[channel];
            this.twoFactorLoading.set(channel);

            this._httpClient
                .put<{ data: TwoFactorSetting }>(
                    `${this._twoFactorUrl}/${channel}`,
                    { enabled },
                )
                .subscribe({
                    next: (res) => {
                        this.twoFactorLoading.set(null);
                        this._applySetting(res?.data);
                        this._snackbarService.openSnackBar(
                            enabled
                                ? 'បានបើកសុវត្ថិភាព 2FA ដោយជោគជ័យ'
                                : 'បានបិទសុវត្ថិភាព 2FA ដោយជោគជ័យ',
                            GlobalConstants.success,
                        );
                    },
                    error: (err) => {
                        this.twoFactorLoading.set(null);
                        this._snackbarService.openSnackBar(
                            err?.error?.message || GlobalConstants.genericError,
                            GlobalConstants.error,
                        );
                    },
                });
        }

        private _applySetting(setting?: Partial<TwoFactorSetting> | any): void {
            this.twoFactor.set({
                phone: setting?.phone ?? false,
                telegram: setting?.telegram ?? false,
                email: setting?.email ?? false,
                authenticator: setting?.authenticator ?? setting?.google_authenticator ?? false,
                security_email: setting?.security_email ?? null,
                security_phone: setting?.security_phone ?? null,
            });
            this._refreshSecurityStatus();
        }

        /** Redraw the banner ring from the real security state. */
        private _refreshSecurityStatus(): void {
            const setting = this.twoFactor();
            const hasPasskey = this.passkeyCount() > 0;
            const hasLocalPasscode = this.isLocalPasscodeEnabled();

            const security = {
                password: true, // account always has a password
                passkey: hasPasskey,
                phone: setting.phone,
                telegram: setting.telegram,
                email: setting.email,
                authenticator: setting.authenticator,
                localPasscode: hasLocalPasscode,
            };

            const { color, style } = this._resolveStyle(security);
            const active = Object.values(security).filter(Boolean).length;

            let status = '';
            let description = '';

            if (active >= 4) {
                status = 'គណនីរបស់អ្នកមានសុវត្ថិភាពខ្លាំង!';
                description = 'អ្នកបានបើកស្រទាប់សុវត្ថិភាពគ្រប់គ្រាន់សម្រាប់ការពារគណនី';
            } else if (active >= 2) {
                status = 'គណនីរបស់អ្នកមានសុវត្ថិភាពមធ្យម';
                description = !hasPasskey
                    ? 'សូមបង្កើត Passkey ឬបើក 2FA បន្ថែមទៀតដើម្បីសុវត្ថិភាពកាន់តែខ្ពស់'
                    : 'បើកស្រទាប់សុវត្ថិភាព (2FA) បន្ថែមដើម្បីការពារគណនីរបស់អ្នកកាន់តែប្រសើរ';
            } else {
                status = 'គណនីរបស់អ្នកមិនទាន់មានសុវត្ថិភាពខ្ពស់!';
                description = 'សូមបង្កើត Passkey ឬបើកស្រទាប់សុវត្ថិភាព (2FA) ដើម្បីការពារគណនីរបស់អ្នក';
            }

            this.drawSecurityStatus.set({
                color,
                style,
                status,
                description,
            });
        }

        private _buildLatestLoginSummary(
            sessions: ProfileSession[],
            devices: ProfileDevice[],
        ): string {
            const latestSession = [...sessions]
                .filter((session) => profileDateValue(this._sessionTimestamp(session)) > 0)
                .sort(
                    (first, second) =>
                        profileDateValue(this._sessionTimestamp(second)) -
                        profileDateValue(this._sessionTimestamp(first)),
                )[0];

            if (latestSession) {
                const matchingDevice = devices.find(
                    (device) => device.device_id === latestSession.device_id,
                );
                return this._formatLoginSummary(
                    this._sessionTimestamp(latestSession),
                    latestSession.os ||
                    latestSession.platform ||
                    latestSession.device_name ||
                    matchingDevice?.os ||
                    matchingDevice?.platform ||
                    matchingDevice?.device,
                    this._location(latestSession, matchingDevice),
                );
            }

            const latestDevice = [...devices]
                .filter((device) => profileDateValue(this._deviceTimestamp(device)) > 0)
                .sort(
                    (first, second) =>
                        profileDateValue(this._deviceTimestamp(second)) -
                        profileDateValue(this._deviceTimestamp(first)),
                )[0];

            if (!latestDevice) {
                return 'មិនមានប្រវត្តិចូល';
            }

            return this._formatLoginSummary(
                this._deviceTimestamp(latestDevice),
                latestDevice.os ||
                latestDevice.platform ||
                latestDevice.device ||
                latestDevice.name,
                this._location(latestDevice),
            );
        }

        private _formatLoginSummary(
            timestamp: string | number | null,
            device: string | null | undefined,
            location: string,
        ): string {
            const details = [device, location].filter(Boolean).join(', ');
            const time = profileRelativeTime(timestamp);
            return details ? `${time} (${details})` : time;
        }

        private _sessionTimestamp(session: ProfileSession): string | number | null {
            return session.last_activity_at ?? session.created_at ?? null;
        }

        private _deviceTimestamp(device: ProfileDevice): string | number | null {
            return device.last_time_access ??
                device.last_activity_at ??
                device.last_activity ??
                device.last_active_at ??
                device.last_active ??
                device.last_used_at ??
                device.logged_in_at ??
                device.date_log_in ??
                device.updated_at ??
                device.created_at ??
                null;
        }

        private _location(value: {
            city?: string | null;
            country?: string | null;
            country_code?: string | null;
            region?: string | null;
        }, fallback?: ProfileDevice): string {
            const city = value.city || fallback?.city || value.region || fallback?.region;
            const countryCode = value.country_code || fallback?.country_code;
            const country = value.country || fallback?.country ||
                (countryCode?.toUpperCase() === 'KH' ? 'Cambodia' : countryCode);

            return [city, country].filter(Boolean).join(', ') ||
                value.region ||
                '';
        }

        openPasswordDialog(): void {
            this.matDialog
                .open(
                    ChangePasswordProfileComponent,
                    this.dialogConfigService.getDialogConfig({ returnToSecurity: true }),
                )
                .afterClosed()
                .subscribe(() => {
                    this._loadSecurityData();
                });
        }

        openDeviceDialog(): void {
            this.matDialog.open(
                DeviceProfileDialogComponent,
                this.dialogConfigService.getDialogConfig(null),
            );
        }

        openLoginHistoryDialog(): void {
            this.matDialog.open(
                LoginHistoryProfileDialogComponent,
                this.dialogConfigService.getDialogConfig(null),
            );
        }

        openPasskeyDialog(): void {
            this.matDialog.open(
                PasskeyProfileDialogComponent,
                this.dialogConfigService.getDialogConfig(null),
            );
        }

        openTelegramDialog(): void {
            this.matDialog
                .open(
                    TelegramTwoFactorDialogComponent,
                    this.dialogConfigService.getDialogConfig({
                        enabled: this.twoFactor().telegram,
                        linked: this.telegramLinked(),
                        telegramUsername: this.telegramUsername(),
                    }),
                )
                .afterClosed()
                .subscribe(() => {
                    this._loadSecurityData();
                });
        }

        openVerifyIdentityDialog(channel: TwoFactorChannel): void {
            const isEnabled = this.twoFactor()[channel];
            const currentSetting = this.twoFactor();
            this.matDialog
                .open(
                    VerifyIdentityDialogComponent,
                    this.dialogConfigService.getDialogConfig({
                        channel,
                        isAlreadyEnabled: isEnabled,
                        returnToSecurity: true,
                        security_email: currentSetting.security_email,
                        security_phone: currentSetting.security_phone,
                        destination: channel === 'email'
                            ? (currentSetting.security_email || this.user.email)
                            : (currentSetting.security_phone || this.user.phone),
                    }),
                )
                .afterClosed()
                .subscribe(() => {
                    this._loadSecurityData();
                });
        }

        openGoogleAuthenticatorDialog(): void {
            if (this.twoFactor().authenticator) {
                this._openGoogleAuthenticatorDialog();
                return;
            }

            this.matDialog
                .open(
                    VerifyIdentityDialogComponent,
                    this.dialogConfigService.getDialogConfig({ returnToSecurity: true, khmerOnly: true }),
                )
                .afterClosed()
                .subscribe((result?: { verified?: boolean; password?: string }) => {
                    if (!result?.verified) return;
                    this._openGoogleAuthenticatorDialog(result.password);
                });
        }

        private _openGoogleAuthenticatorDialog(password?: string): void {
            this.matDialog
                .open(
                    GoogleAuthenticatorTwoFactorDialogComponent,
                    this.dialogConfigService.getDialogConfig({
                        enabled: this.twoFactor().authenticator,
                        email: this.user.email,
                        password,
                    }),
                )
                .afterClosed()
                .subscribe(() => this._loadSecurityData());
        }

        isLocalPasscodeEnabled(): boolean {
            return this._localPasscodeService.isEnabled();
        }

        openLocalPasscodeDialog(): void {
            this.matDialog.open(
                LocalPasscodeProfileComponent,
                this.dialogConfigService.getDialogConfig(null),
            );
    }

        maskedPhone(): string {
            const phone = this.twoFactor().security_phone || this.user.phone;
            if (!phone) return '';
            const d = phone.replace(/\D/g, '');
            return d.length >= 8 ? `${d.slice(0, 3)} *** **${d.slice(-2)}` : phone;
        }

        maskedEmail(): string {
            const email = this.twoFactor().security_email || this.user.email;
            if (!email || !email.includes('@')) return '';
            const [name, domain] = email.split('@');
            if (name.length <= 2) return `${name[0]}*@${domain}`;
            return `${name[0]}${'*'.repeat(Math.max(3, name.length - 2))}${name[name.length - 1]}@${domain}`;
        }

        private _resolveStyle(security: Record<string, boolean>): { color: string; style: string } {
        const values = Object.values(security);
        const total = values.length;
        const active = values.filter(Boolean).length;

        const color = active === total ? '#22c55e'
            : active >= 2 ? '#f59e0b'
                : '#ef4444';

        const degrees = (active / total) * 360;
        const style = `conic-gradient(${color} 0deg ${degrees}deg, #e2e8f0 ${degrees}deg 360deg)`;

        return { color, style };
    }
}
