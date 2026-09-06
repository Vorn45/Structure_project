import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AdminService, AdminStats } from '../admin.service';

const INITIAL_STATS: AdminStats = {
    kpi: {
        total_projects: 3,
        active_projects: 2,
        completed_projects: 0,
        planning_projects: 1,
        total_tasks: 25,
        completed_tasks: 10,
        task_completion_rate: 40,
        active_users: 5,
        total_users: 5,
        pending_leaves: 1,
    },
    projects_summary: [
        {
            id: '1',
            code: 'PMS-V2',
            name: 'ប្រព័ន្ធគ្រប់គ្រងគម្រោងបច្ចេកវិទ្យា (PMS)',
            status: 'active',
            progress: 85,
            total_tasks: 8,
            completed_tasks: 2,
            lead: 'ចេង ច័ន្ទបញ្ញា',
        },
        {
            id: '2',
            code: 'WMS-HR',
            name: 'ប្រព័ន្ធគ្រប់គ្រងវត្តមាន និងបុគ្គលិក (WMS)',
            status: 'active',
            progress: 60,
            total_tasks: 12,
            completed_tasks: 7,
            lead: 'លី ម៉េងហួរ',
        },
        {
            id: '3',
            code: 'E-GOV',
            name: 'ប្រព័ន្ធច្រកចេញចូលតែមួយ (E-Gov Portal)',
            status: 'planning',
            progress: 25,
            total_tasks: 5,
            completed_tasks: 1,
            lead: 'សុខ សុភា',
        },
    ],
    department_stats: [
        { name: 'ព័ត៌មានវិទ្យា (IT)', name_en: 'Information Technology', members: 14, progress: 85 },
        { name: 'គ្រប់គ្រងគម្រោង (PMO)', name_en: 'Project Management Office', members: 6, progress: 75 },
        { name: 'រចនា និងបទពិសោធន៍ (UI/UX)', name_en: 'Product Design', members: 5, progress: 90 },
        { name: 'ហេដ្ឋារចនាសម្ព័ន្ធ (DevOps)', name_en: 'DevOps & Security', members: 4, progress: 70 },
    ],
    recent_activity: [
        { id: 'act-1', text: 'បានបង្កើតគម្រោងថ្មី PMS-V2 ជោគជ័យ', user: 'សុខ សុភា', time: '១០ នាទីមុន' },
        { id: 'act-2', text: 'បានអនុម័តច្បាប់ឈប់សម្រាករបស់ រ័ត្ន វិចិត្រ', user: 'Admin', time: '១ ម៉ោងមុន' },
        { id: 'act-3', text: 'បានបញ្ចប់ Task #PMS-104 នៅក្នុងប្រព័ន្ធ WMS', user: 'ចេង ច័ន្ទបញ្ញា', time: '៣ ម៉ោងមុន' },
    ],
};

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        MatIconModule,
        MatTooltipModule,
    ],
    templateUrl: './admin-dashboard.component.html',
    styles: [`
        :host {
            display: block;
            font-family: 'Kantumruy Pro', sans-serif !important;
            font-size: 16px;
        }
    `],
})
export class AdminDashboardComponent implements OnInit {
    private readonly _adminService = inject(AdminService);
    private readonly _router = inject(Router);

    stats = signal<AdminStats>(INITIAL_STATS);
    loading = signal<boolean>(false);

    ngOnInit(): void {
        this.loadStats();
    }

    loadStats(): void {
        this.loading.set(true);
        this._adminService.getStats().subscribe({
            next: (res) => {
                if (res && res.data) {
                    this.stats.set(res.data);
                }
                this.loading.set(false);
            },
            error: (err) => {
                console.warn('Using initial dashboard state due to network/api:', err);
                this.loading.set(false);
            },
        });
    }

    navigateTo(path: string): void {
        this._router.navigate([path]);
    }

    getStatusBadge(status: string): { label: string; class: string } {
        switch (status) {
            case 'active':
                return {
                    label: 'កំពុងដំណើរការ',
                    class: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
                };
            case 'completed':
                return {
                    label: 'បានបញ្ចប់',
                    class: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
                };
            case 'on_hold':
                return {
                    label: 'ផ្អាកបណ្តោះអាសន្ន',
                    class: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
                };
            default:
                return {
                    label: 'កំពុងរៀបចំ',
                    class: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
                };
        }
    }
}
