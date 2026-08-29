import { Routes } from '@angular/router';
import { ProfileDashboardComponent } from './dashboard/dashboard.component';
import { ProfileViewComponent } from './view/component';

export default [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
    },
    {
        path: 'dashboard',
        component: ProfileDashboardComponent,
    },
    {
        path: 'profile',
        component: ProfileViewComponent,
    },
] as Routes;