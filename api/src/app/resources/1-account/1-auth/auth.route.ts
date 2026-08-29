// ===========================================================================>> Core Library
import { Routes } from '@nestjs/core';

// ===========================================================================>> Custom Library
// > Local
import { loginRoutes }          from './1-login/login.route';
import { ForgetPasswordModule } from './2-forgot-password/forget-password.module';
import { SignUpModule }         from './3-signup/signup.module';

// ======================================= >> Code Starts Here << ========================== //
export const authRoutes: Routes = [
    { path: '', children: loginRoutes },
    { path: '', module: ForgetPasswordModule },
    { path: '', module: SignUpModule },
];
