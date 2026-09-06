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
            import('./1-dashboard/admin-dashboard.component').then((m) => m.AdminDashboardComponent),
    },
    {
        path: 'dashboard',
        loadComponent: () =>
            import('./1-dashboard/admin-dashboard.component').then((m) => m.AdminDashboardComponent),
    },
    {
        path: 'users',
        loadComponent: () =>
            import('./2-users/user-management.component').then((m) => m.UserManagementComponent),
    },
    {
        path: 'user',
        loadComponent: () =>
            import('./2-users/user-management.component').then((m) => m.UserManagementComponent),
    },
    {
        path: 'team',
        loadComponent: () =>
            import('./2-users/user-management.component').then((m) => m.UserManagementComponent),
    },
    {
        path: 'projects',
        loadComponent: () =>
            import('./3-projects/project-management.component').then((m) => m.ProjectManagementComponent),
    },
    {
        path: 'attendance',
        loadComponent: () =>
            import('./4-attendance/attendance-leave.component').then((m) => m.AttendanceLeaveComponent),
    },
    {
        path: 'leaves',
        loadComponent: () =>
            import('./4-attendance/attendance-leave.component').then((m) => m.AttendanceLeaveComponent),
    },
    {
        path: 'organization',
        loadComponent: () =>
            import('./5-settings/admin-settings.component').then((m) => m.AdminSettingsComponent),
    },
    {
        path: 'settings',
        loadComponent: () =>
            import('./5-settings/admin-settings.component').then((m) => m.AdminSettingsComponent),
    },
] as Routes;
