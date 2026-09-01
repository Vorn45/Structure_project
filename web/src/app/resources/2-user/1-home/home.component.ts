import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterModule } from '@angular/router';
import { HomeOverviewData, UserHomeService } from './home.service';

@Component({
    selector: 'user-home',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatIconModule,
        MatButtonModule,
        MatTooltipModule,
        MatProgressSpinnerModule,
    ],
    templateUrl: './home.component.html',
})
export class UserHomeComponent implements OnInit {
    loading = signal<boolean>(true);
    overview = signal<HomeOverviewData | null>(null);

    constructor(
        private readonly _homeService: UserHomeService,
        private readonly _router: Router,
    ) {}

    ngOnInit(): void {
        this.loadOverview();
    }

    loadOverview(): void {
        this.loading.set(true);
        this._homeService.getOverview().subscribe({
            next: (res) => {
                this.overview.set(res.data);
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Failed to load user home overview', err);
                this.loading.set(false);
            },
        });
    }

    navigateToTasks(statusFilter?: string): void {
        this._router.navigate(['/member/tasks'], {
            queryParams: statusFilter ? { status: statusFilter } : {},
        });
    }

    navigateToProjects(): void {
        this._router.navigate(['/member/projects']);
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'completed':
            case 'done':
                return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40';
            case 'in_progress':
                return 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800/40';
            case 'in_review':
                return 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800/40';
            default:
                return 'bg-slate-50 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 border-slate-200 dark:border-slate-700';
        }
    }

    getPriorityClass(priority: string): string {
        switch (priority) {
            case 'urgent':
            case 'high':
                return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30';
            case 'medium':
                return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30';
            default:
                return 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800';
        }
    }
}
