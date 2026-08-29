// src/app/app.resolver.ts

import { inject }               from "@angular/core";
import { Router, UrlTree }      from "@angular/router";
import { NavigationService }    from "app/core/navigation/navigation.service";
import { UserService }          from "app/core/user/user.service";
import { UserPayload }          from 'helper/interfaces/payload.interface';
import jwt_decode               from 'jwt-decode';
import { AuthService }          from "./core/auth/auth.service";
import { toRoleArray }          from "./core/auth/resolvers/role.util";

export const initialDataResolver = (): UrlTree | void => {
    const router = inject(Router);
    const token = inject(AuthService).accessToken;

    if (!token) {
        localStorage.clear();
        return router.parseUrl('');
    }

    const navigationService = inject(NavigationService);

    try {
        const tokenPayload: UserPayload = jwt_decode(token);

    
        const preferredRoleId = localStorage.getItem('preferredRoleId');
        const activeRoleId = preferredRoleId ? parseInt(preferredRoleId) : tokenPayload.user.is_active;

        const updatedUser = {
            ...tokenPayload.user,
            kh_name: (tokenPayload.user as any).kh_name ?? (tokenPayload.user as any).name_kh,
            en_name: (tokenPayload.user as any).en_name ?? (tokenPayload.user as any).name_en,
            is_active: activeRoleId,
            roles: toRoleArray(tokenPayload.user.roles).map((r: any) => ({
                ...r,
                name: r.name_en ?? r.name_kh ?? r.slug ?? '',
                is_default: r.id === activeRoleId
            }))
        };

        inject(UserService).user = updatedUser;

        const role = updatedUser.roles.find(r => r.id === activeRoleId) ?? updatedUser.roles[0];

        if (!role) {
            localStorage.clear();
            return router.parseUrl('');
        }

        navigationService.navigations = role;

    } catch (error) {
        localStorage.clear();
        return router.parseUrl('');
    }
};