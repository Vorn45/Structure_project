// src/app/app.routes.ts

import { Injectable } from '@angular/core';
import { AuthGuard } from 'app/core/auth/guards/auth.guard';
import { NoAuthGuard } from 'app/core/auth/guards/noAuth.guard';
import { LocalPasscodeGuard } from 'app/core/local-passcode/local-passcode.guard';
import { LayoutComponent } from 'app/layout/layout.component';
import { initialDataResolver } from './app.resolver';
import { ActivatedRouteSnapshot, CanActivate, Route, Router, UrlTree } from '@angular/router';
import { AuthService } from './core/auth/auth.service';

@Injectable({ providedIn: 'root' })
export class RedirectGuard implements CanActivate {
    constructor(
        private router: Router,
        private authService: AuthService,
    ) {}

    canActivate(_route: ActivatedRouteSnapshot): UrlTree {
        const token = this.authService.accessToken;

        if (!token) {
            return this.router.parseUrl('/auth/sign-in');
        }

        const redirectUrl = this.authService.getRedirectUrl();
        return this.router.parseUrl(redirectUrl || '/member/home');
    }
}

export const appRoutes: Route[] = [
    { path: '', pathMatch: 'full', redirectTo: 'redirect' },
    {
        path: 'redirect',
        canActivate: [RedirectGuard],
        component: LayoutComponent,
    },
    {
        path: 'verify',
        component: LayoutComponent,
        data: { layout: 'empty' },
        children: [
            {
                path: 'member',
                loadComponent: () =>
                    import(
                        'app/resources/3-public/member-verify/member-verify.component'
                    ).then((m) => m.MemberVerifyComponent),
            },
        ],
    },
    {
        path: 'attendance',
        component: LayoutComponent,
        data: { layout: 'empty' },
        children: [
            {
                path: 'scan',
                loadComponent: () =>
                    import(
                        'app/resources/2-user/1-home/attendance-dialog/mobile-attendance-scan.component'
                    ).then((m) => m.MobileAttendanceScanComponent),
            },
        ],
    },
    {
        path: 'auth',
        canActivate: [NoAuthGuard],
        component: LayoutComponent,
        data: { layout: 'empty' },
        loadChildren: () => import('app/resources/1-account/auth/auth.routes'),
    },
    {
        path: 'lock',
        canActivate: [AuthGuard],
        component: LayoutComponent,
        data: { layout: 'empty' },
        loadChildren: () => import('app/resources/1-account/3-lock/lock.routes'),
    },
    {
        path: '',
        canActivate: [AuthGuard, LocalPasscodeGuard],
        canActivateChild: [LocalPasscodeGuard],
        component: LayoutComponent,
        resolve: { initialData: initialDataResolver },
        children: [
            {
                path: 'profile',
                loadChildren: () => import('app/resources/1-account/2-profile/route'),
            },
            {
                path: 'member',
                loadChildren: () => import('app/resources/2-user/user.routes'),
            },
            {
                path: 'admin',
                loadChildren: () => import('app/resources/3-admin/admin.routes'),
            },
            {
                path: 'org-admin',
                loadChildren: () => import('app/resources/3-admin/admin.routes'),
            },
            {
                path: 'super-admin',
                loadChildren: () => import('app/resources/3-admin/admin.routes'),
            },
            { path: '404-not-found', pathMatch: 'full', loadChildren: () => import('app/shared/error/not-found.routes') },
            { path: '**', redirectTo: '/redirect' },
        ],
    },
];
