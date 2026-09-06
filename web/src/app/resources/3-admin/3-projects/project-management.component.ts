import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { AdminService, AdminProject, AdminUser } from '../admin.service';

export interface AgilePlanSegment {
    iteration: 1 | 2 | 3;
    startWeek: number;
    durationWeeks: number;
    label?: string;
}

export interface AgilePlanTask {
    id: string;
    name: string;
    segments: AgilePlanSegment[];
}

const DEFAULT_AGILE_TASKS: AgilePlanTask[] = [
    { id: '1', name: 'UI/UX Design System', segments: [{ iteration: 1, startWeek: 14, durationWeeks: 4, label: 'Sprint 1' }] },
    { id: '2', name: 'Database & API Architecture', segments: [{ iteration: 2, startWeek: 18, durationWeeks: 6, label: 'Sprint 2' }] },
    { id: '3', name: 'Frontend State & Signals Integration', segments: [{ iteration: 3, startWeek: 24, durationWeeks: 5, label: 'Sprint 3' }] },
    { id: '4', name: 'Security & QA Deployment', segments: [{ iteration: 1, startWeek: 29, durationWeeks: 4, label: 'Release' }] },
];

@Component({
    selector: 'app-project-management',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatIconModule,
        MatTooltipModule,
        MatMenuModule,
    ],
    templateUrl: './project-management.component.html',
    styles: [`
        :host {
            display: block;
            font-family: 'Kantumruy Pro', sans-serif !important;
            font-size: 16px;
        }
    `],
})
export class ProjectManagementComponent implements OnInit {
    private readonly _adminService = inject(AdminService);
    private readonly _fb = inject(FormBuilder);

    projects = signal<AdminProject[]>([]);
    users = signal<AdminUser[]>([]);
    loading = signal<boolean>(true);

    searchQuery = signal<string>('');
    statusFilter = signal<string>('all');

    // Selected Project for Scenario B
    selectedProject = signal<AdminProject | null>(null);
    projectNavTab = signal<'general' | 'plan' | 'tasks' | 'phases' | 'team' | 'meetings' | 'links'>('general');
    taskViewMode = signal<'list' | 'board'>('list');
    taskSearchQuery = signal<string>('');

    // Drawer & Modal States
    isDrawerOpen = signal<boolean>(false);
    isEditing = signal<boolean>(false);
    projectForm: FormGroup;
    saving = signal<boolean>(false);

    // Budget modal
    showBudgetModal = signal<boolean>(false);
    budgetProject = signal<AdminProject | null>(null);
    budgetForm: FormGroup;

    // Lead assignment modal
    showLeadModal = signal<boolean>(false);
    leadProject = signal<AdminProject | null>(null);
    selectedLeadId = signal<number | null>(null);

    // Delete modal
    deleteTarget = signal<AdminProject | null>(null);
    showDeleteModal = signal<boolean>(false);

    // Agile tasks
    agileTasks = signal<AgilePlanTask[]>(DEFAULT_AGILE_TASKS);

    projectCounts = computed(() => {
        const list = this.projects();
        return {
            all: list.length,
            active: list.filter((p) => p.status === 'active').length,
            completed: list.filter((p) => p.status === 'completed').length,
            planning: list.filter((p) => p.status === 'planning').length,
            on_hold: list.filter((p) => p.status === 'on_hold').length,
        };
    });

    filteredProjects = computed(() => {
        let list = this.projects();
        const search = this.searchQuery().toLowerCase().trim();
        const status = this.statusFilter();

        if (search) {
            list = list.filter(
                (p) =>
                    p.name.toLowerCase().includes(search) ||
                    p.code.toLowerCase().includes(search) ||
                    p.description.toLowerCase().includes(search),
            );
        }

        if (status !== 'all') {
            list = list.filter((p) => p.status === status);
        }

        return list;
    });

    filteredProjectTasks = computed(() => {
        const proj = this.selectedProject();
        if (!proj || !proj.tasks) return [];
        const q = this.taskSearchQuery().toLowerCase().trim();
        if (!q) return proj.tasks;
        return proj.tasks.filter((t: any) =>
            t.title?.toLowerCase().includes(q) ||
            t.code?.toLowerCase().includes(q) ||
            t.description?.toLowerCase().includes(q),
        );
    });

    constructor() {
        this.projectForm = this._fb.group({
            name: ['', [Validators.required]],
            code: ['', [Validators.required]],
            description: [''],
            status: ['active', [Validators.required]],
            progress: [0, [Validators.min(0), Validators.max(100)]],
            start_date: [new Date().toISOString().slice(0, 10)],
            end_date: [new Date(Date.now() + 86400000 * 45).toISOString().slice(0, 10)],
            budget: [5000],
        });

        this.budgetForm = this._fb.group({
            budget: [0, [Validators.required, Validators.min(0)]],
            spent: [0, [Validators.min(0)]],
        });
    }

    ngOnInit(): void {
        this.loadData();
    }

    loadData(): void {
        this.loading.set(true);
        this._adminService.getProjects().subscribe({
            next: (res) => {
                if (res.data && res.data.results) {
                    this.projects.set(res.data.results);
                }
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Failed to load projects:', err);
                this.loading.set(false);
            },
        });

        this._adminService.getUsers().subscribe({
            next: (res) => {
                if (res.data && res.data.results) {
                    this.users.set(res.data.results);
                }
            },
        });
    }

    selectProject(project: AdminProject): void {
        this.selectedProject.set(project);
        this.projectNavTab.set('general');
    }

    clearSelectedProject(): void {
        this.selectedProject.set(null);
    }

    filterByStatus(status: string): void {
        this.statusFilter.set(status);
    }

    openCreateDrawer(): void {
        this.isEditing.set(false);
        this.projectForm.reset({
            name: '',
            code: `PMS-${Math.floor(100 + Math.random() * 900)}`,
            description: '',
            status: 'active',
            progress: 0,
            start_date: new Date().toISOString().slice(0, 10),
            end_date: new Date(Date.now() + 86400000 * 45).toISOString().slice(0, 10),
            budget: 5000,
        });
        this.isDrawerOpen.set(true);
    }

    openEditDrawer(project: AdminProject): void {
        this.isEditing.set(true);
        this.projectForm.patchValue({
            name: project.name,
            code: project.code,
            description: project.description,
            status: project.status,
            progress: project.progress,
            start_date: project.start_date ? project.start_date.slice(0, 10) : '',
            end_date: project.end_date ? project.end_date.slice(0, 10) : '',
            budget: project.budget || 0,
        });
        this.isDrawerOpen.set(true);
    }

    closeDrawer(): void {
        this.isDrawerOpen.set(false);
    }

    submitProjectForm(): void {
        if (this.projectForm.invalid) {
            this.projectForm.markAllAsTouched();
            return;
        }

        this.saving.set(true);
        const formVal = this.projectForm.value;

        if (this.isEditing() && this.selectedProject()) {
            this._adminService.updateProject(this.selectedProject()!.id, formVal).subscribe({
                next: (res) => {
                    this.projects.update((list) =>
                        list.map((p) => (p.id === res.data.id ? res.data : p)),
                    );
                    if (this.selectedProject()?.id === res.data.id) {
                        this.selectedProject.set(res.data);
                    }
                    this.saving.set(false);
                    this.closeDrawer();
                },
                error: (err) => {
                    console.error('Failed to update project:', err);
                    this.saving.set(false);
                },
            });
        } else {
            this._adminService.createProject(formVal).subscribe({
                next: (res) => {
                    this.projects.update((list) => [res.data, ...list]);
                    this.saving.set(false);
                    this.closeDrawer();
                },
                error: (err) => {
                    console.error('Failed to create project:', err);
                    this.saving.set(false);
                },
            });
        }
    }

    openBudgetModal(project: AdminProject, event?: Event): void {
        if (event) event.stopPropagation();
        this.budgetProject.set(project);
        this.budgetForm.patchValue({
            budget: project.budget || 5000,
            spent: project.spent || 0,
        });
        this.showBudgetModal.set(true);
    }

    saveBudget(): void {
        const project = this.budgetProject();
        if (!project || this.budgetForm.invalid) return;

        const val = this.budgetForm.value;
        this._adminService.updateProjectBudget(project.id, val.budget, val.spent).subscribe({
            next: (res) => {
                this.projects.update((list) =>
                    list.map((p) => (p.id === res.data.id ? { ...p, budget: val.budget, spent: val.spent } : p)),
                );
                if (this.selectedProject()?.id === res.data.id) {
                    this.selectedProject.update((p) => p ? { ...p, budget: val.budget, spent: val.spent } : null);
                }
                this.showBudgetModal.set(false);
                this.budgetProject.set(null);
            },
            error: (err) => console.error('Failed to update budget:', err),
        });
    }

    openLeadModal(project: AdminProject, event?: Event): void {
        if (event) event.stopPropagation();
        this.leadProject.set(project);
        const currentLead = project.members?.[0];
        this.selectedLeadId.set(currentLead ? currentLead.id : (this.users()[0]?.id || 1));
        this.showLeadModal.set(true);
    }

    saveLead(): void {
        const project = this.leadProject();
        const leadId = this.selectedLeadId();
        if (!project || !leadId) return;

        const leadUser = this.users().find((u) => u.id === Number(leadId));
        const leadName = leadUser ? leadUser.name_kh : 'Project Lead';

        this._adminService.updateProjectLead(project.id, Number(leadId), leadName).subscribe({
            next: (res) => {
                this.projects.update((list) =>
                    list.map((p) => (p.id === res.data.id ? res.data : p)),
                );
                if (this.selectedProject()?.id === res.data.id) {
                    this.selectedProject.set(res.data);
                }
                this.showLeadModal.set(false);
                this.leadProject.set(null);
            },
            error: (err) => console.error('Failed to update lead:', err),
        });
    }

    confirmDelete(project: AdminProject, event?: Event): void {
        if (event) event.stopPropagation();
        this.deleteTarget.set(project);
        this.showDeleteModal.set(true);
    }

    deleteProject(): void {
        const target = this.deleteTarget();
        if (!target) return;

        this._adminService.deleteProject(target.id).subscribe({
            next: () => {
                this.projects.update((list) => list.filter((p) => p.id !== target.id));
                if (this.selectedProject()?.id === target.id) {
                    this.clearSelectedProject();
                }
                this.showDeleteModal.set(false);
                this.deleteTarget.set(null);
            },
            error: (err) => console.error('Failed to delete project:', err),
        });
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'active':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
            case 'completed':
                return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800';
            case 'on_hold':
                return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
            case 'planning':
                return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
            default:
                return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
        }
    }

    getStatusIcon(status: string): string {
        switch (status) {
            case 'active': return 'mdi:progress-clock';
            case 'completed': return 'mdi:check-circle-outline';
            case 'on_hold': return 'mdi:pause-circle-outline';
            case 'planning': return 'mdi:calendar-outline';
            default: return 'mdi:circle-outline';
        }
    }

    getStatusLabel(status: string): string {
        switch (status) {
            case 'active': return 'កំពុងដំណើរការ';
            case 'completed': return 'បានបញ្ចប់';
            case 'on_hold': return 'ផ្អាក';
            case 'planning': return 'រៀបចំផែនការ';
            default: return status;
        }
    }
}
