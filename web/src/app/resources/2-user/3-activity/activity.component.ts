import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivityItem, UserActivityService } from './activity.service';

@Component({
    selector: 'user-activity',
    standalone: true,
    imports: [
        CommonModule,
        MatIconModule,
        MatButtonModule,
        MatTooltipModule,
        MatProgressSpinnerModule,
    ],
    templateUrl: './activity.component.html',
})
export class UserActivityComponent implements OnInit {
    loading = signal<boolean>(true);
    activities = signal<ActivityItem[]>([]);
    selectedType = signal<string>('all');

    constructor(private readonly _activityService: UserActivityService) {}

    ngOnInit(): void {
        this.loadActivities();
    }

    loadActivities(): void {
        this.loading.set(true);
        this._activityService
            .getActivities({
                type: this.selectedType() !== 'all' ? this.selectedType() : undefined,
            })
            .subscribe({
                next: (res) => {
                    this.activities.set(res.data.results);
                    this.loading.set(false);
                },
                error: (err) => {
                    console.error('Failed to load activities', err);
                    this.loading.set(false);
                },
            });
    }

    filterByType(type: string): void {
        this.selectedType.set(type);
        this.loadActivities();
    }

    getIconClass(type: string): string {
        switch (type) {
            case 'task':
                return 'bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400';
            case 'project':
                return 'bg-purple-100 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400';
            case 'security':
                return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400';
            default:
                return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
        }
    }
}
