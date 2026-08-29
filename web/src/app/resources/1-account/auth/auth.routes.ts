// ================================================================================>> Main Library
import { Routes }                   from '@angular/router';

// ================================================================================>> Custom Library
// Component
import { AuthSignInComponent }      from './sign-in/sign-in.component';
import { OverviewLoginComponent }   from './overviewlogin/component';
import { AuthLayoutComponent }      from './component';
import { AuthOTPComponent }         from './otp';
import { AuthOTPForResetPasswordComponent } from './rest-password-otp/index';

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
                path: 'otp',
                component: AuthOTPForResetPasswordComponent
            }
        ]
    }
] as Routes;
