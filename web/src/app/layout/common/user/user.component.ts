import { CommonModule }                                                 from '@angular/common';
import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit }         from '@angular/core';
import { MatButtonModule }                                              from '@angular/material/button';
import { MatDividerModule }                                             from '@angular/material/divider';
import { MatIconModule }                                                from '@angular/material/icon';
import { MatMenuModule }                                                from '@angular/material/menu';
import { Router, RouterLink }                                           from '@angular/router';
import { AuthService }                                                  from 'app/core/auth/auth.service';
import { UserService }                                                  from 'app/core/user/user.service';
import { User }                                                         from 'app/core/user/user.types';
import { env }                                                          from 'envs/env';
import { resolveFileUrl }                                               from 'helper/shared/file-url';
import { Subject, takeUntil }                                           from 'rxjs';
import { TranslocoModule }                                              from '@ngneat/transloco';
import { MatDialog }                                                    from '@angular/material/dialog';
import { ProfileViewComponent }                                         from 'app/resources/1-account/2-profile/view/component';
import { DialogConfigService }                                          from 'app/shared/dialog-config.service';
import { SwitchRoleComponent }                                          from './switch-role/switch-role.component';
import { QRDialogComponent }                                            from 'app/shared/qr/component';
import { HelperConfirmationService }                                    from 'helper/services/confirmation';

@Component({
    selector: 'user',
    templateUrl: './user.component.html',
    standalone: true,
    imports: [
        MatButtonModule,
        CommonModule,
        MatIconModule,
        MatDividerModule,
        MatMenuModule,
        TranslocoModule,
    ],
    styles: [
        `
            ::ng-deep .user-dropdown-menu.mat-mdc-menu-panel {
                border-radius: 10px !important;
                border: 1px solid rgba(226, 232, 240, 0.9) !important;
                padding: 4px !important;
            }
            ::ng-deep .dark .user-dropdown-menu.mat-mdc-menu-panel {
                border-color: rgba(51, 65, 85, 0.9) !important;
                background-color: #0f172a !important;
            }
            ::ng-deep .user-dropdown-menu .mat-mdc-menu-item {
                border-radius: 6px !important;
                height: 40px !important;
                min-height: 40px !important;
            }
        `,
    ],
})
export class UserComponent implements OnInit, OnDestroy {

    /** Direction the menu opens relative to the trigger button. */
    @Input() menuYPosition     : 'above' | 'below'  = 'below';
    @Input() menuXPosition     : 'before' | 'after' = 'before';

    public user               : User  = {} as User;
    public src                : string = '/images/placeholder/avatar.jpg';
    public FILE_URL           = env.FILE_BASE_URL;
    private _unsubscribeAll   : Subject<any> = new Subject<any>();

    constructor(
        private _changeDetectorRef        : ChangeDetectorRef,
        private _authService              : AuthService,
        private _userService              : UserService,
        private _router                   : Router,
        private _matDialog                : MatDialog,
        private _dialogConfigService      : DialogConfigService,
        private _confirmationService      : HelperConfirmationService,
    ) { }

    ngOnInit(): void {
        // Subscribe to user changes
        this._userService.user$.pipe(takeUntil(this._unsubscribeAll)).subscribe((user: User) => {
            const base = user ?? {} as User;
            const storedEmail = localStorage.getItem('2fa_email') || localStorage.getItem('userEmail') || localStorage.getItem('email');
            const storedPhone = localStorage.getItem('2fa_phone');
            this.user = {
                ...base,
                ...(!base?.email && storedEmail ? { email: storedEmail } : {}),
                ...(!base?.phone && storedPhone ? { phone: storedPhone } : {}),
            };

            const avatar = this.user?.avatar;
            const avatarUri = typeof avatar === 'string' ? avatar : avatar?.uri;
            const avatarDomain = (typeof avatar !== 'string' ? avatar?.file_domain : null) ?? '';

            if (!avatarUri) {
                this.src = '/images/placeholder/avatar.jpg';
            } else if (avatarUri.startsWith('data:image/')) {
                this.src = avatarUri;
            } else {
                this.src = resolveFileUrl(
                    avatarUri.startsWith('http') ? avatarUri : { uri: avatarUri, file_domain: avatarDomain },
                ) ?? avatarUri;
            }

            this._changeDetectorRef.markForCheck();
        });
    }

    viewUserDialog(type: string): void {
        const dialogConfig = this._dialogConfigService.getDialogConfig({
            data      : this.user,
            roles     : this.user?.roles ?? [],
            type      : type
        });
        const dialogRef = this._matDialog.open(ProfileViewComponent, dialogConfig);

        dialogRef.afterClosed().subscribe(result => {
        });
    }

    openSwitchRoleDialog(): void {
        const dialogConfig = this._dialogConfigService.getDialogConfig({
            data: this.user,
            roles: this.user?.roles ?? [],
        });
        this._matDialog.open(SwitchRoleComponent, dialogConfig);
    }

    openQrDialog(): void {
        this._matDialog.open(QRDialogComponent, {
            autoFocus: false,
            width: '100dvw',
            maxWidth: '600px',
            enterAnimationDuration: '0s',
            data: { with_token: true },
        });
    }

    signOut(): void {
        const confirmation = this._confirmationService.open({
            title: 'បញ្ជាក់ការចាកចេញ',
            message: 'តើអ្នកប្រាកដថាចង់ចាកចេញពីប្រព័ន្ធមែនទេ?',
            icon: { show: true, name: 'heroicons_outline:arrow-right-on-rectangle', color: 'warn' },
            actions: {
                confirm: { show: true, label: 'ចាកចេញ', color: 'warn' },
                cancel: { show: true, label: 'បោះបង់' },
            },
            dismissible: true,
        });

        confirmation.afterClosed().subscribe((result) => {
            if (result === 'confirmed') {
                this._authService.signOut();
                this._router.navigateByUrl('/auth/sign-in');
            }
        });
    }

    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}
