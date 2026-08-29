import { Routes } from '@angular/router';
import { Error404Component } from 'app/shared/error/not-found.component';

export default [
    {
        path: '',
        component: Error404Component,
    },
] as Routes;
