// src/app/core/auth/guards/auth.guard.ts

import { inject }                                     from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router }  from '@angular/router';
import { of }                                         from 'rxjs';
import { AuthService }                                from 'app/core/auth/auth.service';
import { UserPayload }                                from 'helper/interfaces/payload.interface';
import jwt_decode                                     from 'jwt-decode';

export const AuthGuard: CanActivateFn | CanActivateChildFn = () => {

    const router: Router = inject(Router);
    const authService = inject(AuthService);
    const token = authService?.accessToken;
    if (token) {
        try {
            const tokenPayload: UserPayload = jwt_decode(token);
            if (tokenPayload) {
                return of(true);
            }
        } catch {
            // Invalid token — deny access
        }
    }
    return of(router.parseUrl('/auth'));
};