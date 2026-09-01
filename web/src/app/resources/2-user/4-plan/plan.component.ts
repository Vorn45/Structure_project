import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { ProjectPlanItem, UserPlanService } from './plan.service';

@Component({
    selector: 'user-plan',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatIconModule,
        MatButtonModule,
        MatTooltipModule,
        MatProgressSpinnerModule,
    ],
    templateUrl: './plan.component.html',
})
export class UserPlanComponent implements OnInit {
    loading = signal<boolean>(true);
    plans = signal<ProjectPlanItem[]>([]);
    searchQuery = signal<string>('');
    statusFilter = signal<string>('all');

    constructor(
        private readonly _planService: UserPlanService,
        private readonly _router: Router,
    ) {}

    ngOnInit(): void {
        this.loadPlans();
    }

    loadPlans(): void {
        this.loading.set(true);
        this._planService
            .getPlans({
                search: this.searchQuery() || undefined,
                status: this.statusFilter() !== 'all' ? this.statusFilter() : undefined,
            })
            .subscribe({
                next: (res) => {
                    this.plans.set(res.data.results);
                    this.loading.set(false);
                },
                error: (err) => {
                    console.error('Failed to load plans', err);
                    this.loading.set(false);
                },
            });
    }

    onSearchChange(): void {
        this.loadPlans();
    }

    filterByStatus(status: string): void {
        this.statusFilter.set(status);
        this.loadPlans();
    }

    viewProjectTasks(projectId: string): void {
        this._router.navigate(['/member/tasks'], {
            queryParams: { project_id: projectId },
        });
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'active':
                return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40';
            case 'completed':
                return 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800/40';
            case 'on_hold':
                return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800/40';
            default:
                return 'bg-slate-50 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 border-slate-200 dark:border-slate-700';
        }
    }
}
