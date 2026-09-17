// ================================================================================>> Main Library
import { Routes }                   from '@angular/router';

// ================================================================================>> Custom Library
// Component
import { AuthSignInComponent }      from './sign-in/component';
import { OverviewLoginComponent }   from './overviewlogin/component';
import { AuthLayoutComponent }      from './component';
import { AuthOTPComponent }         from './otp/component';
import { AuthOTPForResetPasswordComponent } from './rest-password-otp/component';

export default [
    { path: '', pathMatch: 'full', redirectTo: 'overview' },
    {
        path: '',
        component: AuthLayoutComponent,
        children: [
            {
                path: 'overview',
                component: OverviewLoginComponent
            },
            {
                path: 'sign-in',
                component: AuthSignInComponent
            },
            {
                path: 'forgot-password',
                loadComponent: () => import('./reset-password/component').then(m => m.ResetPasswordComponent)
            },
            {
                path: 'reset-password',
                loadComponent: () => import('./reset-password/component').then(m => m.ResetPasswordComponent)
            },
            {
                path: 'otp',
                component: AuthOTPForResetPasswordComponent
            },
            {
                path: 'qr-login',
                loadComponent: () => import('./qr-scan-confirm/component').then(m => m.QrScanConfirmComponent)
            },
            {
                path: 'accept-invite',
                loadComponent: () => import('./accept-invite/component').then(m => m.AcceptInviteComponent)
            }
        ]
    }
] as Routes;
