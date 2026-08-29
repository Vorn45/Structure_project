// ================================================================================>> Main Library
import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

// ================================================================================>> Third Party Library
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslocoModule } from '@ngneat/transloco';

// ================================================================================>> Custom Library
import { env } from 'envs/env';
import { helperAnimations } from 'helper/animations';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';

// ================================================================================>> App Library
import { ErrorHandleService } from 'app/shared/error-handle.service';
import { DialogConfigService } from 'app/shared/dialog-config.service';
import { AboutDialogComponent } from '../about-dialog/about.component';
import { AuthContactDialogComponent } from '../contact-dialog/contact.component';
import { AuthService } from 'app/core/auth/auth.service';
import { LanguagesComponent } from 'app/layout/common/languages/languages.component';
import { Select2faComponent } from './2fa/select-2fa/select-2fa.component';
import { OtpVerifyComponent } from './2fa/otp-verify/otp-verify.component';

declare const google: any;

@Component({
    selector: 'auth-sign-in',
    templateUrl: './sign-in.component.html',
    styleUrl: './sign-in.component.scss',
    encapsulation: ViewEncapsulation.None,
    animations: helperAnimations,
    standalone: true,
    imports: [
        CommonModule,
        RouterLink,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatDialogModule,
        MatIconModule,
        MatProgressSpinnerModule,
        LanguagesComponent,
        TranslocoModule,
        Select2faComponent,
        OtpVerifyComponent,
    ],
})
export class AuthSignInComponent implements OnInit, AfterViewInit, OnDestroy {

    // ── Form ──────────────────────────────────────────────────────────────────
    public form: UntypedFormGroup;
    private _googleTokenClient: any;
    public isGoogleLoading = false;

    // ── Step / Channel ────────────────────────────────────────────────────────
    public currentStep: 'login' | 'select-2fa' | 'otp' = 'login';
    public selectedChannel: 'email' | 'phone' | 'authenticator' = 'email';
    public availableChannels: string[] = ['email', 'phone', 'authenticator'];

    // ── User identifiers ──────────────────────────────────────────────────────
    /** Raw login username (may be email or phone) */
    public loginUsername = '';
    public userEmail = '';
    public userPhone = '';

    // ── OTP state ─────────────────────────────────────────────────────────────
    public otpToken = '';
    public isOtpLoading = false;
    public otpFailed = false;
    public reSendOtp = false;
    public resendDisabled = true;
    public remainingTime = 0;
    private _countdownInterval: any;

    // ── Computed ──────────────────────────────────────────────────────────────
    get displayDestination(): string {
        if (this.selectedChannel === 'email') {
            const storedEmail = localStorage.getItem('2fa_email') || localStorage.getItem('userEmail') || localStorage.getItem('email') || '';
            const emailCandidate = [storedEmail, this.userEmail, this.loginUsername].find(s => s && typeof s === 'string' && s.includes('@'));
            if (emailCandidate) {
                return emailCandidate;
            }
            return this.userEmail || '';
        }
        if (this.selectedChannel === 'phone') {
            const storedPhone = localStorage.getItem('2fa_phone') || '';
            const phoneCandidate = [storedPhone, this.userPhone, this.loginUsername].find(s => s && typeof s === 'string' && !s.includes('@'));
            return phoneCandidate ? this._maskPhone(phoneCandidate) : '';
        }
        return '';
    }

    private _maskEmail(email: string): string {
        if (!email?.includes('@')) return '';
        const [name, domain] = email.split('@');
        if (name.includes('*')) return email;
        if (name.length <= 2) return `${name[0]}*@${domain}`;
        return `${name.slice(0, 2)}***${name[name.length - 1]}@${domain}`;
    }

    private _maskPhone(phone: string): string {
        const d = phone.replace(/\D/g, '');
        return d.length >= 8 ? `${d.slice(0, 3)} *** ${d.slice(-3)}` : phone;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private get _emailAddr(): string {
        const stored2faEmail = localStorage.getItem('2fa_email') || localStorage.getItem('userEmail') || localStorage.getItem('email');
        if (stored2faEmail && stored2faEmail.includes('@')) {
            return stored2faEmail;
        }
        if (this.userEmail && this.userEmail.includes('@')) {
            return this.userEmail;
        }
        if (this.loginUsername && this.loginUsername.includes('@')) {
            return this.loginUsername;
        }
        const formVal = this.form.get('username')?.value;
        if (formVal && formVal.includes('@')) {
            return formVal;
        }
        return '';
    }

    private get _phoneAddr(): string {
        const stored2faPhone = localStorage.getItem('2fa_phone');
        if (stored2faPhone && !stored2faPhone.includes('@')) {
            return stored2faPhone;
        }
        if (this.userPhone && !this.userPhone.includes('@')) {
            return this.userPhone;
        }
        if (this.loginUsername && !this.loginUsername.includes('@')) {
            return this.loginUsername;
        }
        const formVal = this.form.get('username')?.value;
        if (formVal && !formVal?.includes('@')) {
            return formVal;
        }
        return '';
    }

    constructor(
        private _authService: AuthService,
        private _formBuilder: UntypedFormBuilder,
        private _router: Router,
        private _errorHandleService: ErrorHandleService,
        private _snackbarService: SnackbarService,
        private _matDialog: MatDialog,
        private _dialogConfigService: DialogConfigService,
    ) { }

    // ── Lifecycle ─────────────────────────────────────────────────────────────
    ngOnInit(): void {
        this.form = this._formBuilder.group({
            username: ['', Validators.required],
            password: ['', Validators.required],
        });
    }

    ngAfterViewInit(): void {
        this._loadGoogleIdentityServices();
    }

    ngOnDestroy(): void {
        clearInterval(this._countdownInterval);
    }

    // ── Sign In ───────────────────────────────────────────────────────────────
    signIn(): void {
        if (this.form.invalid) return;
        this.form.disable();

        this._authService.signIn(this.form.value).subscribe({
            next: res => {
                if (!res.requires_otp) {
                    this._authService.accessToken = res.token;
                    if (res.refresh_token) this._authService.refreshToken = res.refresh_token;
                    this._router.navigateByUrl(this._authService.getRedirectUrl());
                    this._snackbarService.openSnackBar('ចូលប្រព័ន្ធដោយជោគជ័យ', GlobalConstants.success);
                    return;
                }
                this._applyLoginResponse(res);
                this.currentStep = 'select-2fa';
            },
            error: err => {
                this.form.enable();
                // When SMS API is not configured, backend returns 400 but we still
                // redirect to 2FA so the user can choose email instead.
                const msg = err?.error?.message || err?.message || '';
                if (msg.includes('SMS') || msg.includes('OTP SMS')) {
                    const username = this.form.get('username')?.value;
                    this.loginUsername = username;
                    if (username?.includes('@')) this.userEmail = username;
                    else if (username) this.userPhone = username;
                    this.availableChannels = ['email', 'phone', 'authenticator'];
                    this.currentStep = 'select-2fa';
                } else {
                    this._errorHandleService.handleHttpError(err);
                }
            },
        });
    }

    public defaultLoginChannel: 'email' | 'phone' | 'authenticator' = 'email';
    public loginOtpSent = false;
    private _applyLoginResponse(res: any): void {
        const username = this.form.get('username')?.value;
        this.loginUsername = username;
        if (username?.includes('@')) this.userEmail = username;
        else if (username) this.userPhone = username;

        this.otpToken = res.otp_token || res.data?.otp_token || '';
        const ch = res.channel || res.data?.channel || res.user?.channel;
        if (ch === 'email' || ch === 'phone' || ch === 'authenticator') {
            this.defaultLoginChannel = ch;
        }
        this.loginOtpSent = true;

        const email = res.user?.email || res.email || res.user_email || res.destination || res.data?.user?.email || res.data?.email;
        if (email && typeof email === 'string' && email.includes('@')) {
            this.userEmail = email;
            localStorage.setItem('2fa_email', email);
        }
        const phone = res.user?.phone || res.phone || res.user_phone || res.data?.user?.phone || res.data?.phone;
        if (phone) {
            this.userPhone = phone;
            localStorage.setItem('2fa_phone', phone);
        }
        const channels = res.channels || res.data?.channels || res.user?.channels;
        if (Array.isArray(channels) && channels.length > 0) {
            this.availableChannels = channels.map((c: string) => String(c).toLowerCase());
        } else {
            this.availableChannels = ['email', 'phone', 'authenticator'];
        }
    }

    goToStep(step: 'login' | 'select-2fa' | 'otp'): void {
        this.currentStep = step;
        if (step === 'login') {
            this.form.enable();
            this.otpFailed = false;
            this.isOtpLoading = false;
            if (this._countdownInterval) clearInterval(this._countdownInterval);
        } else if (step === 'select-2fa') {
            this.otpFailed = false;
            this.isOtpLoading = false;
            if (this._countdownInterval) clearInterval(this._countdownInterval);
        }
    }

    // ── 2FA Channel Selection ─────────────────────────────────────────────────
    selectChannel(channel: 'email' | 'phone' | 'authenticator'): void {
        this.selectedChannel = channel;

        if (channel === 'authenticator') {
            this.currentStep = 'otp';
            this.remainingTime = 0;
            this.resendDisabled = true;
            this.reSendOtp = false;
            this.otpFailed = false;
            return;
        }

        if (this.loginOtpSent && channel === this.defaultLoginChannel && this.otpToken) {
            this.loginOtpSent = false;
            this._startOtpScreen();
            return;
        }

        if (channel === 'email') {
            this._dispatchEmailOtp(this._emailAddr);
        } else {
            this._dispatchPhoneOtp(this._phoneAddr);
        }
    }

    private _dispatchEmailOtp(emailAddress: string): void {
        this.isOtpLoading = true;
        const stored2faEmail = localStorage.getItem('2fa_email') || localStorage.getItem('userEmail') || localStorage.getItem('email');
        const targetEmail = (stored2faEmail && stored2faEmail.includes('@')) ? stored2faEmail : (emailAddress.includes('@') ? emailAddress : '');
        const accountUsername = this.loginUsername || this.form.get('username')?.value || targetEmail;

        const payload: any = {
            username: accountUsername,
            channel: 'email',
        };
        if (targetEmail) {
            payload.email = targetEmail;
            payload.destination = targetEmail;
        }
        if (this.otpToken) payload.otp_token = this.otpToken;

        const onSuccess = (res: any) => {
            this.isOtpLoading = false;
            if (res?.otp_token) this.otpToken = res.otp_token;
            const returnedEmail = res?.user?.email || res?.email || res?.destination || res?.user_email || res?.data?.email || targetEmail;
            if (returnedEmail && typeof returnedEmail === 'string' && returnedEmail.includes('@')) {
                this.userEmail = returnedEmail;
                localStorage.setItem('2fa_email', returnedEmail);
                localStorage.setItem('userEmail', returnedEmail);
                localStorage.setItem('email', returnedEmail);
            }
            this._startOtpScreen();
            this._snackbarService.openSnackBar('បានផ្ញើលេខកូដ OTP ទៅកាន់អ៊ីមែលរបស់អ្នក', GlobalConstants.success);
        };

        this._authService.sendOtp(payload).subscribe({
            next: onSuccess,
            error: (err) => {
                this.isOtpLoading = false;
                this._errorHandleService.handleHttpError(err);
            },
        });
    }

    private _dispatchPhoneOtp(phoneAddress: string): void {
        this.isOtpLoading = true;
        const accountUsername = this.loginUsername || this.form.get('username')?.value || phoneAddress;
        const payload: any = { username: accountUsername, channel: 'phone' };
        if (phoneAddress && !phoneAddress.includes('@')) payload.phone = phoneAddress;
        if (this.otpToken) payload.otp_token = this.otpToken;

        this._authService.sendOtp(payload).subscribe({
            next: (res: any) => {
                this.isOtpLoading = false;
                if (res?.otp_token) this.otpToken = res.otp_token;
                if (res?.user?.phone || res?.phone) this.userPhone = res.user?.phone || res.phone;
                this._startOtpScreen();
                this._snackbarService.openSnackBar('បានផ្ញើលេខកូដ OTP ទៅកាន់លេខទូរស័ព្ទរបស់អ្នក', GlobalConstants.success);
            },
            error: (err) => {
                this.isOtpLoading = false;
                this._errorHandleService.handleHttpError(err);
            },
        });
    }

    private _startOtpScreen(): void {
        this.remainingTime = 60;
        this.resendDisabled = true;
        this.reSendOtp = false;
        this.otpFailed = false;
        this.currentStep = 'otp';
        this._startCountdown();
    }

    // ── OTP Actions ───────────────────────────────────────────────────────────
    resendOtp(): void {
        if (this.isOtpLoading) return;
        this.otpFailed = false;
        this.loginOtpSent = false;
        if (this.selectedChannel === 'email') {
            this._dispatchEmailOtp(this._emailAddr);
        } else {
            this._dispatchPhoneOtp(this._phoneAddr);
        }
    }

    verifyOtp(otpCode: string): void {
        if (this.isOtpLoading) return;
        this.isOtpLoading = true;

        const emailAddress = this._emailAddr;
        const phoneAddress = this._phoneAddr;
        const emailOrPhone = this.selectedChannel === 'email' ? emailAddress : phoneAddress;
        const mainUsername = this.loginUsername || this.form.get('username')?.value || emailOrPhone;
        const otpToken = this.otpToken;

        const attempts: any[] = [];
        const seen = new Set<string>();

        const addAttempt = (payload: any) => {
            const key = JSON.stringify(payload);
            if (!seen.has(key)) {
                seen.add(key);
                attempts.push(payload);
            }
        };

        if (this.selectedChannel === 'email' && emailAddress) {
            // 1. Email address with token
            if (otpToken) addAttempt({ username: emailAddress, otp: otpCode, otp_token: otpToken });
            // 2. Email address without token
            addAttempt({ username: emailAddress, otp: otpCode });
            // 3. Login username with token
            if (otpToken) addAttempt({ username: mainUsername, otp: otpCode, otp_token: otpToken });
            // 4. Login username without token
            addAttempt({ username: mainUsername, otp: otpCode });
        } else if (this.selectedChannel === 'phone' && phoneAddress) {
            if (otpToken) addAttempt({ username: phoneAddress, otp: otpCode, otp_token: otpToken });
            addAttempt({ username: phoneAddress, otp: otpCode });
            if (otpToken) addAttempt({ username: mainUsername, otp: otpCode, otp_token: otpToken });
            addAttempt({ username: mainUsername, otp: otpCode });
        } else {
            if (otpToken) addAttempt({ username: mainUsername, otp: otpCode, otp_token: otpToken });
            addAttempt({ username: mainUsername, otp: otpCode });
            if (emailAddress) addAttempt({ username: emailAddress, otp: otpCode });
        }

        this._tryVerifyOtpSequence(attempts, 0);
    }

    private _tryVerifyOtpSequence(attempts: any[], index: number = 0, lastError?: any): void {
        if (index >= attempts.length) {
            this.isOtpLoading = false;
            this._errorHandleService.handleHttpError(lastError);
            return;
        }

        const currentAttempt = attempts[index];
        this._authService.verifyOtp(currentAttempt).subscribe({
            next: (res: any) => {
                this.isOtpLoading = false;
                const token = res?.token || res?.data?.token || res?.access_token;
                if (token) {
                    this._authService.accessToken = token;
                    if (res?.refresh_token || res?.data?.refresh_token) {
                        this._authService.refreshToken = res?.refresh_token || res?.data?.refresh_token;
                    }
                }
                this._router.navigateByUrl(this._authService.getRedirectUrl());
                this._snackbarService.openSnackBar('ចូលប្រព័ន្ធដោយជោគជ័យ', GlobalConstants.success);
            },
            error: (err: any) => {
                this._tryVerifyOtpSequence(attempts, index + 1, err);
            },
        });
    }

    // ── Countdown ─────────────────────────────────────────────────────────────
    private _startCountdown(): void {
        clearInterval(this._countdownInterval);
        this._countdownInterval = setInterval(() => {
            if (this.remainingTime > 0) {
                this.remainingTime--;
            } else {
                clearInterval(this._countdownInterval);
                this.reSendOtp = true;
                this.resendDisabled = false;
                this.otpFailed = true;
            }
        }, 1000);
    }

    // ── Dialogs ───────────────────────────────────────────────────────────────
    onForgotPassword(): void { this._router.navigateByUrl('/auth/reset-password'); }
    openAboutDialog(): void {
        this._matDialog.open(AboutDialogComponent, this._dialogConfigService.getDialogConfig(null));
    }
    openContactDialog(): void {
        this._matDialog.open(AuthContactDialogComponent, this._dialogConfigService.getDialogConfig(null));
    }

    // ── Google Sign In ────────────────────────────────────────────────────────
    signInWithGoogle(): void {
        if (!this._googleTokenClient) this._loadGoogleIdentityServices();
        if (this._googleTokenClient) {
            this._googleTokenClient.requestAccessToken();
        } else {
            this._snackbarService.openSnackBar('Google Sign-In មិនទាន់រៀបចំរួចរាល់', GlobalConstants.error);
        }
    }

    private _loadGoogleIdentityServices(): void {
        if (!env.GOOGLE_CLIENT_ID) return;
        const existing = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
        if (existing) {
            if (typeof google !== 'undefined') this._initGoogleTokenClient();
            else existing.addEventListener('load', () => this._initGoogleTokenClient(), { once: true });
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = script.defer = true;
        script.onload = () => this._initGoogleTokenClient();
        document.head.appendChild(script);
    }

    private _initGoogleTokenClient(): void {
        if (typeof google === 'undefined' || this._googleTokenClient) return;
        this._googleTokenClient = google.accounts.oauth2.initTokenClient({
            client_id: env.GOOGLE_CLIENT_ID,
            scope: 'openid email profile',
            callback: (r: { access_token?: string; error?: string }) => this._handleGoogleToken(r),
        });
    }

    private _handleGoogleToken(response: { access_token?: string; error?: string }): void {
        if (response.error || !response.access_token) return;
        this.isGoogleLoading = true;
        this._authService.signInWithGoogle(response.access_token, 'login').subscribe({
            next: (res: any) => {
                this.isGoogleLoading = false;
                if (res.requires_otp) {
                    this.loginUsername = res.email || res.user?.email || '';
                    this.userEmail = this.loginUsername;
                    this.otpToken = res.otp_token || '';
                    this.availableChannels = ['email', 'phone', 'authenticator'];
                    this.currentStep = 'select-2fa';
                    return;
                }
                if (res.token) this._authService.accessToken = res.token;
                this._router.navigateByUrl(this._authService.getRedirectUrl());
                this._snackbarService.openSnackBar('ចូលប្រព័ន្ធដោយជោគជ័យ', GlobalConstants.success);
            },
            error: err => {
                this.isGoogleLoading = false;
                this._errorHandleService.handleHttpError(err);
            },
        });
    }
}
