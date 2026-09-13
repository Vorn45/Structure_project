import { CommonModule } from '@angular/common';
import { Component, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'app-profile-dashboard',
    templateUrl: './template.html',
    styleUrl: './style.scss',
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [CommonModule],
})
export class ProfileDashboardComponent {}
