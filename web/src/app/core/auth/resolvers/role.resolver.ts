

import { inject } from "@angular/core";
import { Router, UrlTree } from "@angular/router";
import { UserPayload } from 'helper/interfaces/payload.interface';
import jwt_decode from 'jwt-decode';
import { AuthService } from "../auth.service";
import { getRoleDefaultUrl, resolveActiveRole } from "./role.util";

// Re-export so existing imports (e.g. app.routes) keep working.
export { getRoleDefaultUrl } from "./role.util";

export const roleResolver = (allowedRoles: string[]) => {
    return (): UrlTree | string[] => {
        const router = inject(Router);
        const token = inject(AuthService).accessToken;

        try {
            const tokenPayload: UserPayload = jwt_decode(token);
            const role = resolveActiveRole(tokenPayload);

            if (!role) {
                return router.parseUrl('/auth/sign-in');
            }

            const isValidRole = allowedRoles.includes(role.slug ?? '');

            if (!isValidRole) {
                return router.parseUrl(getRoleDefaultUrl(role.slug));
            }

            return allowedRoles;
        } catch {
            return router.parseUrl('/auth/sign-in');
        }
    };
};