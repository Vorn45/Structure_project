import { CommonModule }                                                 from '@angular/common';
import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit }         from '@angular/core';
import { MatButtonModule }                                              from '@angular/material/button';
import { MatDividerModule }                                             from '@angular/material/divider';
import { MatIconModule }                                                from '@angular/material/icon';
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

@Component({
    selector: 'user',
    templateUrl: './user.component.html',
    standalone: true,
    imports: [
        MatButtonModule,
        CommonModule,
        MatIconModule,
        MatDividerModule,
        TranslocoModule
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
        private _dialogConfigService      : DialogConfigService
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

    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}
