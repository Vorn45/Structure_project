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
            import('./1-home/home.component').then((m) => m.UserHomeComponent),
    },
    {
        path: 'tasks',
        loadComponent: () =>
            import('./2-task/task.component').then((m) => m.UserTaskComponent),
    },
    {
        path: 'activity',
        loadComponent: () =>
            import('./3-activity/activity.component').then(
                (m) => m.UserActivityComponent
            ),
    },
    {
        path: 'projects',
        loadComponent: () =>
            import('./4-plan/plan.component').then((m) => m.UserPlanComponent),
    },
] as Routes;
