import { Routes } from '@angular/router';

export default [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'home',
    },
    {
        path: 'home',
        loadComponent: () =>
            import('./1-dashboard/component').then((m) => m.AdminDashboardComponent),
    },
    {
        path: 'dashboard',
        loadComponent: () =>
            import('./1-dashboard/component').then((m) => m.AdminDashboardComponent),
    },
    {
        path: 'planner',
        loadComponent: () =>
            import('./6-planner/component').then((m) => m.PlannerComponent),
    },
    {
        path: 'users',
        loadComponent: () =>
            import('./2-users/component').then((m) => m.UserManagementComponent),
    },
    {
        path: 'user',
        loadComponent: () =>
            import('./2-users/component').then((m) => m.UserManagementComponent),
    },
    {
        path: 'staff',
        loadComponent: () =>
            import('./2-users/component').then((m) => m.UserManagementComponent),
    },
    {
        path: 'clients',
        loadComponent: () =>
            import('./7-clients/component').then((m) => m.ClientManagementComponent),
    },
    {
        path: 'team',
        loadComponent: () =>
            import('./2-users/component').then((m) => m.UserManagementComponent),
    },
    {
        path: 'projects',
        loadComponent: () =>
            import('./3-projects/component').then((m) => m.ProjectManagementComponent),
    },
    {
        path: 'attendance',
        loadComponent: () =>
            import('./4-attendance/component').then((m) => m.AttendanceLeaveComponent),
    },
    {
        path: 'leaves',
        loadComponent: () =>
            import('./4-attendance/component').then((m) => m.AttendanceLeaveComponent),
    },
    {
        path: 'financials',
        pathMatch: 'full',
        redirectTo: 'settings',
    },
    {
        path: 'reports',
        pathMatch: 'full',
        redirectTo: 'dashboard',
    },
    {
        path: 'admin',
        loadComponent: () =>
            import('./5-settings/component').then((m) => m.AdminSettingsComponent),
    },
    {
        path: 'organization',
        loadComponent: () =>
            import('./5-settings/component').then((m) => m.AdminSettingsComponent),
    },
    {
        path: 'settings',
        loadComponent: () =>
            import('./5-settings/component').then((m) => m.AdminSettingsComponent),
    },
] as Routes;
