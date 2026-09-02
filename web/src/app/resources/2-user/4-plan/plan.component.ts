import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { DialogConfigService } from 'app/shared/dialog-config.service';
import { AddPlanDialogComponent } from './add-plan-dialog.component';
import { ProjectPlanItem, UserPlanService } from './plan.service';

export interface AgilePlanSegment {
    iteration: 1 | 2 | 3;
    startWeek: number; // 14 to 40
    durationWeeks: number; // duration
    label?: string;
}

export interface AgilePlanTask {
    id: string;
    name: string;
    segments: AgilePlanSegment[];
}

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
        MatDialogModule,
    ],
    templateUrl: './plan.component.html',
})
export class UserPlanComponent implements OnInit {
    loading = signal<boolean>(false);
    plans = signal<ProjectPlanItem[]>([]);
    searchQuery = signal<string>('');
    statusFilter = signal<string>('all');
    viewMode = signal<'gantt' | 'cards'>('gantt');

    // Selected project for Agile Plan view
    selectedProjectName = signal<string>('ប្រព័ន្ធគ្រប់គ្រងការងារ WMS (Core Project)');

    // Timeline configuration (Weeks 14 to 40 = 27 weeks total)
    readonly startWeek = 14;
    readonly totalWeeks = 27;
    readonly weeks = Array.from({ length: 27 }, (_, i) => 14 + i);

    // Current Date & Week (Today)
    readonly currentYear = new Date().getFullYear();
    readonly currentWeek = this.calculateCurrentWeek();

    // Quarter definitions (Dynamic year: Q2 April-June, Q3 July-September)
    readonly quarters = [
        { name: `${new Date().getFullYear()} ត្រីមាសទី ២ (Q2)`, startWeek: 14, weeksCount: 13, bgClass: 'bg-[#2e1065] text-white' },
        { name: `${new Date().getFullYear()} ត្រីមាសទី ៣ (Q3)`, startWeek: 27, weeksCount: 14, bgClass: 'bg-[#ea580c] text-white' },
    ];

    calculateCurrentWeek(): number {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const pastDaysOfYear = (now.getTime() - startOfYear.getTime()) / 86400000;
        return Math.min(40, Math.max(14, Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7)));
    }

    // Month definitions in Khmer
    readonly months = [
        { name: 'មេសា', startWeek: 14, weeksCount: 5, bgClass: 'bg-[#f43f5e] text-white' },
        { name: 'ឧសភា', startWeek: 19, weeksCount: 4, bgClass: 'bg-[#0d9488] text-white' },
        { name: 'មិថុនា', startWeek: 23, weeksCount: 4, bgClass: 'bg-[#7c3aed] text-white' },
        { name: 'កក្កដា', startWeek: 27, weeksCount: 5, bgClass: 'bg-[#eab308] text-slate-900' },
        { name: 'សីហា', startWeek: 32, weeksCount: 4, bgClass: 'bg-[#0284c7] text-white' },
        { name: 'កញ្ញា', startWeek: 36, weeksCount: 5, bgClass: 'bg-[#0369a1] text-white' },
    ];

    // 19 Agile Project Management Tasks in Khmer
    agileTasks = signal<AgilePlanTask[]>([
        {
            id: 'task-1',
            name: 'ការប្រមូលតម្រូវការ',
            segments: [
                { iteration: 1, startWeek: 14, durationWeeks: 1 },
                { iteration: 2, startWeek: 15, durationWeeks: 1 },
                { iteration: 3, startWeek: 16, durationWeeks: 3, label: '3W' },
            ],
        },
        {
            id: 'task-2',
            name: 'ដំណាក់កាលរចនាប្លង់',
            segments: [
                { iteration: 1, startWeek: 15, durationWeeks: 1 },
                { iteration: 3, startWeek: 16, durationWeeks: 5, label: '5W' },
            ],
        },
        {
            id: 'task-3',
            name: 'ការអភិវឌ្ឍគំរូសាកល្បង',
            segments: [
                { iteration: 1, startWeek: 16, durationWeeks: 1 },
                { iteration: 3, startWeek: 17, durationWeeks: 8, label: '8W' },
            ],
        },
        {
            id: 'task-4',
            name: 'ការប្រមូលមតិកែលម្អ',
            segments: [
                { iteration: 1, startWeek: 20, durationWeeks: 1 },
                { iteration: 2, startWeek: 21, durationWeeks: 1 },
                { iteration: 3, startWeek: 22, durationWeeks: 6, label: '6W' },
            ],
        },
        {
            id: 'task-5',
            name: 'ការរចនាស្ថាបត្យកម្មប្រព័ន្ធ',
            segments: [
                { iteration: 1, startWeek: 22, durationWeeks: 1 },
                { iteration: 2, startWeek: 23, durationWeeks: 1 },
                { iteration: 3, startWeek: 24, durationWeeks: 7, label: '7W' },
            ],
        },
        {
            id: 'task-6',
            name: 'ការអភិវឌ្ឍប្រព័ន្ធ Backend',
            segments: [
                { iteration: 1, startWeek: 23, durationWeeks: 2 },
                { iteration: 2, startWeek: 25, durationWeeks: 1 },
                { iteration: 3, startWeek: 26, durationWeeks: 8, label: '8W' },
            ],
        },
        {
            id: 'task-7',
            name: 'ការអភិវឌ្ឍផ្ទៃប្រព័ន្ធ Frontend',
            segments: [
                { iteration: 1, startWeek: 25, durationWeeks: 2 },
                { iteration: 2, startWeek: 27, durationWeeks: 2 },
                { iteration: 3, startWeek: 29, durationWeeks: 7, label: '7W' },
            ],
        },
        {
            id: 'task-8',
            name: 'ការធ្វើតេស្តសមាហរណកម្ម',
            segments: [
                { iteration: 1, startWeek: 26, durationWeeks: 1 },
                { iteration: 2, startWeek: 27, durationWeeks: 2 },
                { iteration: 3, startWeek: 29, durationWeeks: 6, label: '6W' },
            ],
        },
        {
            id: 'task-9',
            name: 'ការធ្វើតេស្តទទួលយក (UAT)',
            segments: [
                { iteration: 1, startWeek: 27, durationWeeks: 1 },
                { iteration: 2, startWeek: 28, durationWeeks: 2 },
                { iteration: 3, startWeek: 30, durationWeeks: 9, label: '9W' },
            ],
        },
        {
            id: 'task-10',
            name: 'ការកែសម្រួល & ដោះស្រាយបញ្ហា',
            segments: [
                { iteration: 1, startWeek: 28, durationWeeks: 2 },
                { iteration: 2, startWeek: 30, durationWeeks: 1 },
                { iteration: 3, startWeek: 31, durationWeeks: 8, label: '8W' },
            ],
        },
        {
            id: 'task-11',
            name: 'ការបង្កើនល្បឿន & សមត្ថភាព',
            segments: [
                { iteration: 3, startWeek: 32, durationWeeks: 4, label: '4W' },
            ],
        },
        {
            id: 'task-12',
            name: 'ការវាយតម្លៃសុវត្ថិភាព',
            segments: [
                { iteration: 1, startWeek: 30, durationWeeks: 1 },
                { iteration: 2, startWeek: 31, durationWeeks: 2, label: '5W' },
                { iteration: 3, startWeek: 33, durationWeeks: 5, label: '5W' },
            ],
        },
        {
            id: 'task-13',
            name: 'ការរៀបចំឯកសារបច្ចេកទេស',
            segments: [
                { iteration: 1, startWeek: 31, durationWeeks: 1 },
                { iteration: 2, startWeek: 32, durationWeeks: 2 },
                { iteration: 3, startWeek: 34, durationWeeks: 5, label: '5W' },
            ],
        },
        {
            id: 'task-14',
            name: 'ការបណ្តុះបណ្តាល & ណែនាំ',
            segments: [
                { iteration: 1, startWeek: 31, durationWeeks: 1 },
                { iteration: 2, startWeek: 32, durationWeeks: 3, label: '4W' },
                { iteration: 3, startWeek: 35, durationWeeks: 3, label: '3W' },
            ],
        },
        {
            id: 'task-15',
            name: 'ការពិនិត្យ & អនុម័តចុងក្រោយ',
            segments: [
                { iteration: 1, startWeek: 32, durationWeeks: 2, label: '3W' },
                { iteration: 2, startWeek: 34, durationWeeks: 2, label: '4W' },
                { iteration: 3, startWeek: 36, durationWeeks: 4, label: '4W' },
            ],
        },
        {
            id: 'task-16',
            name: 'ការត្រៀមដាក់ឱ្យដំណើរការ',
            segments: [
                { iteration: 2, startWeek: 33, durationWeeks: 3, label: '4W' },
                { iteration: 3, startWeek: 36, durationWeeks: 5, label: '5W' },
            ],
        },
        {
            id: 'task-17',
            name: 'ការដាក់ឱ្យប្រើប្រាស់ផ្លូវការ',
            segments: [
                { iteration: 1, startWeek: 33, durationWeeks: 1 },
                { iteration: 2, startWeek: 34, durationWeeks: 2, label: '4W' },
                { iteration: 3, startWeek: 36, durationWeeks: 4, label: '4W' },
            ],
        },
        {
            id: 'task-18',
            name: 'ការគាំទ្របច្ចេកទេស',
            segments: [
                { iteration: 1, startWeek: 33, durationWeeks: 1 },
                { iteration: 2, startWeek: 34, durationWeeks: 2, label: '4W' },
                { iteration: 3, startWeek: 36, durationWeeks: 4, label: '4W' },
            ],
        },
        {
            id: 'task-19',
            name: 'ការបិទបញ្ចប់ & ប្រគល់គម្រោង',
            segments: [
                { iteration: 1, startWeek: 34, durationWeeks: 1 },
                { iteration: 2, startWeek: 35, durationWeeks: 2, label: '3W' },
                { iteration: 3, startWeek: 37, durationWeeks: 3, label: '3W' },
            ],
        },
    ]);

    constructor(
        private readonly _planService: UserPlanService,
        private readonly _router: Router,
        private readonly _matDialog: MatDialog,
        private readonly _dialogConfigService: DialogConfigService,
    ) {}

    openAddPlanDialog(): void {
        const dialogConfig = this._dialogConfigService.getDialogConfig({
            currentWeek: this.currentWeek,
            startWeek: this.startWeek,
            totalWeeks: this.totalWeeks,
            weeks: this.weeks,
        });

        const dialogRef = this._matDialog.open(AddPlanDialogComponent, dialogConfig);

        dialogRef.afterClosed().subscribe((newTask: AgilePlanTask | null) => {
            if (newTask) {
                // Add new plan to the top of the roadmap
                this.agileTasks.update((tasks) => [newTask, ...tasks]);
            }
        });
    }

    deleteAgileTask(taskId: string, event: MouseEvent): void {
        event.stopPropagation();
        this.agileTasks.update((tasks) => tasks.filter((t) => t.id !== taskId));
    }

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
                    this.plans.set(res.data?.results || []);
                    this.loading.set(false);
                },
                error: () => {
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

    navigateHome(): void {
        this._router.navigate(['/member/home']);
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

    /** Helper methods to calculate Gantt grid positioning */
    getSegmentLeftPercent(startWeek: number): number {
        const colIndex = Math.max(0, startWeek - this.startWeek);
        return (colIndex / this.totalWeeks) * 100;
    }

    getSegmentWidthPercent(durationWeeks: number): number {
        return (durationWeeks / this.totalWeeks) * 100;
    }

    getIterationColor(iteration: 1 | 2 | 3): string {
        switch (iteration) {
            case 1:
                return 'bg-[#f59e0b] text-white'; // Amber/Orange
            case 2:
                return 'bg-[#f43f5e] text-white'; // Pink/Rose
            case 3:
                return 'bg-[#581c87] text-white'; // Deep Purple
            default:
                return 'bg-indigo-600 text-white';
        }
    }
}
