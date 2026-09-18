import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { AuthService } from 'app/core/auth/auth.service';
import { resolveActiveRole } from 'app/core/auth/resolvers/role.util';
import jwt_decode from 'jwt-decode';

export const AdminGuard: CanActivateFn | CanActivateChildFn = () => {
    const router = inject(Router);
    const authService = inject(AuthService);
    const token = authService?.accessToken;

    if (token) {
        try {
            const tokenPayload: any = jwt_decode(token);
            const activeRole = resolveActiveRole(tokenPayload);
            const slug = (activeRole?.slug || '').toLowerCase().trim();

            if (['superadmin', 'super_admin', 'admin', 'org_admin', 'orgadmin'].includes(slug)) {
                return true;
            }
        } catch {
            // Invalid token
        }
    }

    return router.parseUrl('/member/home');
};
