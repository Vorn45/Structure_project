import { Component, inject, OnInit, ViewChild } from '@angular/core';
import {
    FormsModule,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import { env } from 'envs/env';
// import { TranslatePipe } from 'helper/pipes/translate.pipe';
import { Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { QRDialogComponent } from 'app/shared/qr/component';
@Component({
    standalone: true,
    imports: [
        FormsModule,
        MatButtonModule,
        MatIconModule,
        MatCheckboxModule,
        MatProgressSpinnerModule,
        RouterLink,
    ],
    selector: 'overview-login',
    templateUrl: 'template.html'
})

export class OverviewLoginComponent implements OnInit {

    constructor(
        private _router             : Router,
    ) {}
    // siteKey: string = env.RecaptchaSiteKey;
    phone: string = '';
    private matdialog = inject(MatDialog);

    private _unsubscribeAll: Subject<{ phone: number }> = new Subject<{ phone: number }>();

    ngOnInit() {

    }

    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    openQrDialog(){
        this.matdialog.open(QRDialogComponent, {
            autoFocus: false,
            width: '100dvw',
            maxWidth: '600px',
            enterAnimationDuration: '0s',
            data: {
                with_token: false,
            }
        });
    }
    navigateToVerifyEmail(): void {
        this._router.navigate(['/auth/verify-code-email'], { state: { type: 'signUp' } });
    }
}
