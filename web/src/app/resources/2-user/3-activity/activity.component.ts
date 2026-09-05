import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { UserService } from 'app/core/user/user.service';
import { DialogConfigService } from 'app/shared/dialog-config.service';
import { UserPlanService } from '../4-plan/plan.service';
import { ActivityItem, UserActivityService } from './activity.service';
import { AddPlanDialogComponent } from './add-plan-dialog.component';
import { CreateProjectDialogComponent } from './create-project-dialog.component';
import { ProjectPlanOption, SelectProjectPlanDialogComponent } from './select-project-plan-dialog.component';

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

const PMS_TASKS: AgilePlanTask[] = [
    { id: 'task-1', name: 'ការប្រមូលតម្រូវការ PMS', segments: [{ iteration: 1, startWeek: 14, durationWeeks: 1 }, { iteration: 2, startWeek: 15, durationWeeks: 1 }, { iteration: 3, startWeek: 16, durationWeeks: 3, label: '3W' }] },
    { id: 'task-2', name: 'ដំណាក់កាលរចនាប្លង់ Architecture', segments: [{ iteration: 1, startWeek: 15, durationWeeks: 1 }, { iteration: 3, startWeek: 16, durationWeeks: 5, label: '5W' }] },
    { id: 'task-3', name: 'ការអភិវឌ្ឍគំរូសាកល្បង Prototype', segments: [{ iteration: 1, startWeek: 16, durationWeeks: 1 }, { iteration: 3, startWeek: 17, durationWeeks: 8, label: '8W' }] },
    { id: 'task-4', name: 'ការប្រមូលមតិកែលម្អ Stakeholders', segments: [{ iteration: 1, startWeek: 20, durationWeeks: 1 }, { iteration: 2, startWeek: 21, durationWeeks: 1 }, { iteration: 3, startWeek: 22, durationWeeks: 6, label: '6W' }] },
    { id: 'task-5', name: 'ការរចនាស្ថាបត្យកម្មប្រព័ន្ធ', segments: [{ iteration: 1, startWeek: 22, durationWeeks: 1 }, { iteration: 2, startWeek: 23, durationWeeks: 1 }, { iteration: 3, startWeek: 24, durationWeeks: 7, label: '7W' }] },
    { id: 'task-6', name: 'ការអភិវឌ្ឍប្រព័ន្ធ Backend NestJS', segments: [{ iteration: 1, startWeek: 23, durationWeeks: 2 }, { iteration: 2, startWeek: 25, durationWeeks: 1 }, { iteration: 3, startWeek: 26, durationWeeks: 8, label: '8W' }] },
    { id: 'task-7', name: 'ការអភិវឌ្ឍផ្ទៃប្រព័ន្ធ Angular Frontend', segments: [{ iteration: 1, startWeek: 25, durationWeeks: 2 }, { iteration: 2, startWeek: 27, durationWeeks: 2 }, { iteration: 3, startWeek: 29, durationWeeks: 7, label: '7W' }] },
    { id: 'task-8', name: 'ការធ្វើតេស្តសមាហរណកម្ម Integration', segments: [{ iteration: 1, startWeek: 26, durationWeeks: 1 }, { iteration: 2, startWeek: 27, durationWeeks: 2 }, { iteration: 3, startWeek: 29, durationWeeks: 6, label: '6W' }] },
    { id: 'task-9', name: 'ការធ្វើតេស្តទទួលយក (UAT)', segments: [{ iteration: 1, startWeek: 27, durationWeeks: 1 }, { iteration: 2, startWeek: 28, durationWeeks: 2 }, { iteration: 3, startWeek: 30, durationWeeks: 9, label: '9W' }] },
    { id: 'task-10', name: 'ការកែសម្រួល & ដោះស្រាយបញ្ហា', segments: [{ iteration: 1, startWeek: 28, durationWeeks: 2 }, { iteration: 2, startWeek: 30, durationWeeks: 1 }, { iteration: 3, startWeek: 31, durationWeeks: 8, label: '8W' }] },
    { id: 'task-11', name: 'ការបង្កើនល្បឿន & សមត្ថភាព Performance', segments: [{ iteration: 3, startWeek: 32, durationWeeks: 4, label: '4W' }] },
    { id: 'task-12', name: 'ការវាយតម្លៃសុវត្ថិភាព Security Audit', segments: [{ iteration: 1, startWeek: 30, durationWeeks: 1 }, { iteration: 2, startWeek: 31, durationWeeks: 2, label: '5W' }, { iteration: 3, startWeek: 33, durationWeeks: 5, label: '5W' }] },
    { id: 'task-13', name: 'ការរៀបចំឯកសារបច្ចេកទេស Documentation', segments: [{ iteration: 1, startWeek: 31, durationWeeks: 1 }, { iteration: 2, startWeek: 32, durationWeeks: 2 }, { iteration: 3, startWeek: 34, durationWeeks: 5, label: '5W' }] },
    { id: 'task-14', name: 'ការបណ្តុះបណ្តាល & ណែនាំ Training', segments: [{ iteration: 1, startWeek: 31, durationWeeks: 1 }, { iteration: 2, startWeek: 32, durationWeeks: 3, label: '4W' }, { iteration: 3, startWeek: 35, durationWeeks: 3, label: '3W' }] },
    { id: 'task-15', name: 'ការពិនិត្យ & អនុម័តចុងក្រោយ Final Signoff', segments: [{ iteration: 1, startWeek: 32, durationWeeks: 2, label: '3W' }, { iteration: 2, startWeek: 34, durationWeeks: 2, label: '4W' }, { iteration: 3, startWeek: 36, durationWeeks: 4, label: '4W' }] },
    { id: 'task-16', name: 'ការត្រៀមដាក់ឱ្យដំណើរការ Staging Release', segments: [{ iteration: 2, startWeek: 33, durationWeeks: 3, label: '4W' }, { iteration: 3, startWeek: 36, durationWeeks: 5, label: '5W' }] },
    { id: 'task-17', name: 'ការដាក់ឱ្យប្រើប្រាស់ផ្លូវការ Production Launch', segments: [{ iteration: 1, startWeek: 33, durationWeeks: 1 }, { iteration: 2, startWeek: 34, durationWeeks: 2, label: '4W' }, { iteration: 3, startWeek: 36, durationWeeks: 4, label: '4W' }] },
    { id: 'task-18', name: 'ការគាំទ្របច្ចេកទេស Maintenance & Support', segments: [{ iteration: 1, startWeek: 33, durationWeeks: 1 }, { iteration: 2, startWeek: 34, durationWeeks: 2, label: '4W' }, { iteration: 3, startWeek: 36, durationWeeks: 4, label: '4W' }] },
    { id: 'task-19', name: 'ការបិទបញ្ចប់ & ប្រគល់គម្រោង Project Handover', segments: [{ iteration: 1, startWeek: 34, durationWeeks: 1 }, { iteration: 2, startWeek: 35, durationWeeks: 2, label: '3W' }, { iteration: 3, startWeek: 37, durationWeeks: 3, label: '3W' }] },
];

const WMS_TASKS: AgilePlanTask[] = [
    { id: 'wms-1', name: 'ការកំណត់តម្រូវការវត្តមាន និងមុខងារបុគ្គលិក', segments: [{ iteration: 1, startWeek: 14, durationWeeks: 2 }, { iteration: 2, startWeek: 16, durationWeeks: 2 }, { iteration: 3, startWeek: 18, durationWeeks: 4, label: '4W' }] },
    { id: 'wms-2', name: 'ការរចនាទម្រង់ស្កេនមុខ និង Geofencing', segments: [{ iteration: 1, startWeek: 16, durationWeeks: 2 }, { iteration: 3, startWeek: 18, durationWeeks: 6, label: '6W' }] },
    { id: 'wms-3', name: 'ការអភិវឌ្ឍប្រព័ន្ធ API វត្តមានប្រចាំថ្ងៃ', segments: [{ iteration: 1, startWeek: 18, durationWeeks: 3 }, { iteration: 2, startWeek: 21, durationWeeks: 2 }, { iteration: 3, startWeek: 23, durationWeeks: 7, label: '7W' }] },
    { id: 'wms-4', name: 'ការភ្ជាប់ប្រព័ន្ធគ្រប់គ្រងច្បាប់ និង OT', segments: [{ iteration: 1, startWeek: 22, durationWeeks: 2 }, { iteration: 3, startWeek: 24, durationWeeks: 5, label: '5W' }] },
    { id: 'wms-5', name: 'ការបង្កើតរបាយការណ៍វត្តមាន និង Export Excel', segments: [{ iteration: 2, startWeek: 25, durationWeeks: 3 }, { iteration: 3, startWeek: 28, durationWeeks: 6, label: '6W' }] },
    { id: 'wms-6', name: 'ការធ្វើតេស្តសាកល្បងលើ Mobile App', segments: [{ iteration: 1, startWeek: 28, durationWeeks: 2 }, { iteration: 2, startWeek: 30, durationWeeks: 2 }, { iteration: 3, startWeek: 32, durationWeeks: 5, label: '5W' }] },
    { id: 'wms-7', name: 'ការបណ្តុះបណ្តាលបុគ្គលិក និងដាក់ដំណើរការ', segments: [{ iteration: 1, startWeek: 33, durationWeeks: 2 }, { iteration: 3, startWeek: 35, durationWeeks: 4, label: '4W' }] },
];

const EGOV_TASKS: AgilePlanTask[] = [
    { id: 'egov-1', name: 'ការសិក្សាលំហូរឯកសាររដ្ឋបាលឌីជីថល', segments: [{ iteration: 1, startWeek: 14, durationWeeks: 3 }, { iteration: 3, startWeek: 17, durationWeeks: 5, label: '5W' }] },
    { id: 'egov-2', name: 'ការរៀបចំច្រកចេញចូលតែមួយ One Window Service', segments: [{ iteration: 1, startWeek: 17, durationWeeks: 2 }, { iteration: 2, startWeek: 19, durationWeeks: 2 }, { iteration: 3, startWeek: 21, durationWeeks: 8, label: '8W' }] },
    { id: 'egov-3', name: 'ការតភ្ជាប់ទិន្នន័យអន្តរក្រសួង Data Exchange', segments: [{ iteration: 2, startWeek: 23, durationWeeks: 4 }, { iteration: 3, startWeek: 27, durationWeeks: 7, label: '7W' }] },
    { id: 'egov-4', name: 'ការផ្ទៀងផ្ទាត់អត្តសញ្ញាណ និង CamDigiKey', segments: [{ iteration: 1, startWeek: 26, durationWeeks: 3 }, { iteration: 3, startWeek: 29, durationWeeks: 6, label: '6W' }] },
    { id: 'egov-5', name: 'ការធ្វើតេស្តសុវត្ថិភាពទិន្នន័យសាធារណៈ UAT', segments: [{ iteration: 2, startWeek: 32, durationWeeks: 3 }, { iteration: 3, startWeek: 35, durationWeeks: 5, label: '5W' }] },
];

@Component({
    selector: 'user-activity',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatIconModule,
        MatButtonModule,
        MatTooltipModule,
        MatMenuModule,
        MatProgressSpinnerModule,
        MatDialogModule,
    ],
    templateUrl: './activity.component.html',
})
export class UserActivityComponent implements OnInit {
    // Agile Project Management Plan State
    loading = signal<boolean>(false);

    // Current Project selection
    projectOptions = signal<ProjectPlanOption[]>([
        { id: '1', code: 'PMS-V2', name: 'ប្រព័ន្ធគ្រប់គ្រងគម្រោងបច្ចេកវិទ្យា (PMS)', description: 'ប្រព័ន្ធគ្រប់គ្រងគម្រោងបច្ចេកវិទ្យា ការងារ ដំណាក់កាល និងកាលវិភាគការងាររបស់បុគ្គលិក', tasksCount: PMS_TASKS.length },
        { id: '2', code: 'WMS-HR', name: 'ប្រព័ន្ធគ្រប់គ្រងវត្តមាន និងបុគ្គលិក (WMS)', description: 'ប្រព័ន្ធកត់ត្រាវត្តមាន ស្កេនមុខ និងគ្រប់គ្រងច្បាប់ឈប់សម្រាក', tasksCount: WMS_TASKS.length },
        { id: '3', code: 'E-GOV', name: 'ប្រព័ន្ធច្រកចេញចូលតែមួយ (E-Gov Portal)', description: 'ប្រព័ន្ធផ្តល់សេវាសាធារណៈ និងឯកសាររដ្ឋបាលឌីជីថល', tasksCount: EGOV_TASKS.length },
    ]);
    currentProject = signal<ProjectPlanOption>(this.projectOptions()[0]);

    // Tasks mapped by Project ID
    projectTasksMap = signal<{ [projectId: string]: AgilePlanTask[] }>({
        '1': PMS_TASKS,
        '2': WMS_TASKS,
        '3': EGOV_TASKS,
    });

    // Dynamic current tasks based on active project
    currentTasks = computed(() => {
        const cur = this.currentProject();
        if (!cur) return [];
        const pId = String(cur.id);
        const map = this.projectTasksMap();
        return map[pId] || map[cur.id] || [];
    });

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

    recentActivities = signal<ActivityItem[]>([]);

    constructor(
        private readonly _router: Router,
        private readonly _matDialog: MatDialog,
        private readonly _dialogConfigService: DialogConfigService,
        private readonly _planService: UserPlanService,
        private readonly _activityService: UserActivityService,
        private readonly _userService: UserService,
    ) {}

    ngOnInit(): void {
        this.loadRoadmapFromApi();
        this.loadActivities();
    }

    loadRoadmapFromApi(): void {
        this._activityService.getRoadmap().subscribe({
            next: (res) => {
                if (res?.data) {
                    const rawProjects = res.data.projects || (res.data as any).projects || [];
                    const rawTasksMap = res.data.tasksMap || (res.data as any).tasks_map || {};
                    const rawSelectedId = res.data.selectedProjectId || (res.data as any).selected_project_id;

                    // Normalize all tasks and segments in tasksMap
                    const normalizedMap: { [pId: string]: AgilePlanTask[] } = {};
                    for (const [pId, tasks] of Object.entries(rawTasksMap)) {
                        if (Array.isArray(tasks)) {
                            normalizedMap[String(pId)] = tasks.map((t: any) => ({
                                id: String(t.id),
                                name: t.name,
                                segments: Array.isArray(t.segments)
                                    ? t.segments.map((s: any) => ({
                                          iteration: Number(s.iteration) as 1 | 2 | 3,
                                          startWeek: Number(s.startWeek !== undefined ? s.startWeek : s.start_week) || 14,
                                          durationWeeks: Number(s.durationWeeks !== undefined ? s.durationWeeks : s.duration_weeks) || 1,
                                          label: s.label,
                                      }))
                                    : [],
                            }));
                        }
                    }

                    if (rawProjects && rawProjects.length > 0) {
                        const normalizedProjects: ProjectPlanOption[] = rawProjects.map((p: any) => ({
                            id: String(p.id),
                            code: p.code,
                            name: p.name,
                            description: p.description,
                            tasksCount: p.tasksCount !== undefined ? p.tasksCount : (p.tasks_count !== undefined ? p.tasks_count : (normalizedMap[String(p.id)]?.length || 0)),
                        }));
                        this.projectOptions.set(normalizedProjects);

                        const match = rawSelectedId ? normalizedProjects.find((p) => String(p.id) === String(rawSelectedId)) : null;
                        this.currentProject.set(match || normalizedProjects[0]);
                    }

                    this.projectTasksMap.set(normalizedMap);
                }
            },
            error: () => {
                // Fallback to plan service if roadmap endpoint fails
                this.loadProjectsFromApi();
            },
        });
    }

    loadProjectsFromApi(): void {
        this._planService.getPlans().subscribe({
            next: (res) => {
                if (res?.data?.results?.length) {
                    const apiProjects: ProjectPlanOption[] = res.data.results.map((p) => ({
                        id: String(p.id),
                        code: p.code,
                        name: p.name,
                        description: p.description,
                        tasksCount: p.total_tasks || 0,
                    }));

                    this.projectOptions.set(apiProjects);
                    if (!this.currentProject() && apiProjects.length > 0) {
                        this.currentProject.set(apiProjects[0]);
                    }
                }
            },
            error: () => {},
        });
    }

    loadActivities(): void {
        this._activityService.getActivities().subscribe({
            next: (res) => {
                if (res?.data?.results) {
                    this.recentActivities.set(res.data.results);
                }
            },
            error: () => {},
        });
    }

    selectProject(p: ProjectPlanOption): void {
        this.currentProject.set(p);
        this._activityService.selectRoadmapProject(p.id).subscribe({
            next: () => {},
            error: () => {},
        });
    }

    openCreateNewProjectDialog(): void {
        const dialogConfig = this._dialogConfigService.getDialogConfig({});
        const dialogRef = this._matDialog.open(CreateProjectDialogComponent, dialogConfig);

        dialogRef.afterClosed().subscribe((newProject?: ProjectPlanOption) => {
            if (newProject) {
                const pId = String(newProject.id);
                const starterTask: AgilePlanTask = {
                    id: `task-${Date.now()}`,
                    name: `ដំណាក់កាលទី ១ នៃ ${newProject.name}`,
                    segments: [{ iteration: 1, startWeek: this.currentWeek, durationWeeks: 3, label: '3W' }],
                };
                const projectWithCount: ProjectPlanOption = {
                    ...newProject,
                    id: pId,
                    tasksCount: 1,
                };

                this.projectOptions.update((list) => [projectWithCount, ...list.filter((p) => String(p.id) !== pId)]);
                this.projectTasksMap.update((map) => ({
                    ...map,
                    [pId]: [starterTask],
                }));
                this.currentProject.set(projectWithCount);

                // Persist new plan to backend Roadmap API
                this._activityService
                    .createRoadmapProject({
                        id: pId,
                        code: newProject.code,
                        name: newProject.name,
                        description: newProject.description,
                    })
                    .subscribe({
                        next: () => {},
                        error: () => {},
                    });
            }
        });
    }

    openSelectProjectPlanDialog(tab: 'existing' | 'create' = 'existing'): void {
        const currentP = this.currentProject() || this.projectOptions()[0];
        const dialogConfig = this._dialogConfigService.getDialogConfig({
            projects: this.projectOptions(),
            selectedProjectId: currentP?.id ? String(currentP.id) : '1',
            activeTab: tab,
        });

        const dialogRef = this._matDialog.open(SelectProjectPlanDialogComponent, dialogConfig);

        dialogRef.afterClosed().subscribe((selected?: ProjectPlanOption) => {
            if (selected) {
                const pId = String(selected.id);
                // If it's a new project option not yet in the list, add it
                if (!this.projectOptions().some((p) => String(p.id) === pId)) {
                    const starterTask: AgilePlanTask = {
                        id: `task-${Date.now()}`,
                        name: `ដំណាក់កាលទី ១ នៃ ${selected.name}`,
                        segments: [{ iteration: 1, startWeek: this.currentWeek, durationWeeks: 3, label: '3W' }],
                    };
                    const projectWithCount: ProjectPlanOption = {
                        ...selected,
                        id: pId,
                        tasksCount: 1,
                    };
                    this.projectOptions.update((list) => [projectWithCount, ...list]);
                    this.projectTasksMap.update((map) => ({
                        ...map,
                        [pId]: [starterTask],
                    }));
                    this.currentProject.set(projectWithCount);

                    // Persist to backend Roadmap API
                    this._activityService
                        .createRoadmapProject({
                            id: pId,
                            code: selected.code,
                            name: selected.name,
                            description: selected.description,
                        })
                        .subscribe({
                            next: () => {},
                            error: () => {},
                        });
                } else {
                    const existing = this.projectOptions().find((p) => String(p.id) === pId);
                    this.currentProject.set(existing || selected);
                }

                this._activityService.selectRoadmapProject(pId).subscribe({
                    next: () => {},
                    error: () => {},
                });
            }
        });
    }

    openAddPlanDialog(): void {
        const currentP = this.currentProject() || this.projectOptions()[0];
        const currentPId = currentP?.id ? String(currentP.id) : '1';
        const dialogConfig = this._dialogConfigService.getDialogConfig({
            currentWeek: this.currentWeek,
            startWeek: this.startWeek,
            totalWeeks: this.totalWeeks,
            weeks: this.weeks,
            projects: this.projectOptions(),
            selectedProjectId: currentPId,
            selectedProjectName: currentP?.name || '',
        });

        const dialogRef = this._matDialog.open(AddPlanDialogComponent, dialogConfig);

        dialogRef.afterClosed().subscribe((result: any) => {
            if (result) {
                const newTask: AgilePlanTask = result.task || result;
                const pId = String(result.projectId || currentPId);

                // If user selected a different project in the dialog, switch to it
                const targetProject = this.projectOptions().find((p) => String(p.id) === pId);
                if (targetProject && String(targetProject.id) !== String(this.currentProject()?.id)) {
                    this.currentProject.set(targetProject);
                }

                let updatedLength = 1;
                this.projectTasksMap.update((map) => {
                    const currentList = map[pId] || [];
                    const nextList = [newTask, ...currentList.filter((t) => t.id !== newTask.id)];
                    updatedLength = nextList.length;
                    return {
                        ...map,
                        [pId]: nextList,
                    };
                });

                // Update project task count
                this.projectOptions.update((list) =>
                    list.map((p) =>
                        String(p.id) === pId
                            ? { ...p, tasksCount: updatedLength }
                            : p
                    )
                );

                // Persist to backend API
                this._activityService
                    .createRoadmapTask({
                        id: newTask.id,
                        project_id: pId,
                        name: newTask.name,
                        segments: newTask.segments,
                    })
                    .subscribe({
                        next: () => {},
                        error: () => {},
                    });
            }
        });
    }

    deleteAgileTask(taskId: string, event: MouseEvent): void {
        event.stopPropagation();
        const pId = String(this.currentProject()?.id || '1');
        let remainingLength = 0;

        this.projectTasksMap.update((map) => {
            const currentList = map[pId] || [];
            const nextList = currentList.filter((t) => t.id !== taskId);
            remainingLength = nextList.length;
            return {
                ...map,
                [pId]: nextList,
            };
        });

        this.projectOptions.update((list) =>
            list.map((p) =>
                String(p.id) === pId
                    ? { ...p, tasksCount: remainingLength }
                    : p
            )
        );

        // Delete from backend API
        this._activityService.deleteRoadmapTask(taskId, pId).subscribe({
            next: () => {},
            error: () => {},
        });
    }

    navigateHome(): void {
        this._router.navigate(['/member/home']);
    }

    navigateToProjects(): void {
        this._router.navigate(['/member/projects']);
    }

    getSegmentLeftPercent(startWeek: number): number {
        return Math.max(0, ((startWeek - this.startWeek) / this.totalWeeks) * 100);
    }

    getSegmentWidthPercent(durationWeeks: number): number {
        return (durationWeeks / this.totalWeeks) * 100;
    }

    getIterationColor(iteration: 1 | 2 | 3): string {
        switch (iteration) {
            case 1:
                return 'bg-[#f59e0b]'; // Orange
            case 2:
                return 'bg-[#f43f5e]'; // Pink/Red
            case 3:
                return 'bg-[#581c87]'; // Deep Purple
            default:
                return 'bg-blue-600';
        }
    }
}
