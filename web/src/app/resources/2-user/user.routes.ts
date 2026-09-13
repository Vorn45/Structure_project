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
            import('./1-home/component').then((m) => m.UserHomeComponent),
    },
    {
        path: 'tasks',
        loadComponent: () =>
            import('./2-task/component').then((m) => m.UserTaskComponent),
    },
    {
        path: 'planner',
        loadComponent: () =>
            import('../3-admin/6-planner/component').then((m) => m.PlannerComponent),
    },
    {
        path: 'activity',
        loadComponent: () =>
            import('./3-activity/component').then((m) => m.UserActivityComponent),
    },
    {
        path: 'projects',
        loadComponent: () =>
            import('./4-plan/component').then((m) => m.UserPlanComponent),
    },
    {
        path: 'report',
        loadComponent: () =>
            import('./5-report/component').then((m) => m.UserReportComponent),
    },
] as Routes;
