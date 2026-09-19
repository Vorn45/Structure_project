import { CommonModule } from '@angular/common';
import { Component, computed, ElementRef, effect, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { catchError, finalize, forkJoin, merge, of, Subject, takeUntil } from 'rxjs';
import { TaskSocketService } from 'app/core/realtime/task-socket.service';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import * as echarts from 'echarts';
import { UserService } from 'app/core/user/user.service';
import { DialogConfigService } from 'app/shared/dialog-config.service';
import { CreateProjectDialogComponent } from '../1-home/create-project-dialog/component';
import { CreateMeetingDialogComponent } from '../1-home/create-meeting-dialog/component';
import { AddPlanDialogComponent } from '../3-activity/add-plan-dialog/component';
import { CreateTaskDialogComponent } from 'app/resources/3-admin/3-projects/dialogs/create-task-dialog/component';
import { CreatePhaseDialogComponent } from 'app/resources/3-admin/3-projects/dialogs/create-phase-dialog/component';
import { CreateMemberDialogComponent } from 'app/resources/3-admin/3-projects/dialogs/create-member-dialog/component';
import { CreateLinkDialogComponent } from 'app/resources/3-admin/3-projects/dialogs/create-link-dialog/component';
import { ProjectPlanItem, UserPlanService } from './plan.service';
import { TaskItem, UserTaskService } from '../2-task/task.service';
import { TaskDrawerComponent } from '../2-task/task-drawer/component';
import { FilePreviewModalComponent } from '../2-task/file-preview-modal/component';
import {
    TaskItem as DrawerTaskItem,
    TaskMember as DrawerTaskMember,
    TaskChatMessage,
    TaskAttachment,
    TaskStatus,
    TaskPriority,
    TaskType,
} from '../2-task/models/task.types';
import { ProfileViewComponent } from 'app/resources/1-account/2-profile/view/component';
import { readPreferredRoleId } from 'app/core/auth/resolvers/role.util';
import { resolveFileUrl } from 'helper/shared/file-url';

export * from './plan.types';
import {
    AgilePlanSegment,
    AgilePlanTask,
    TaskMember,
    TaskLink,
    TaskDocument,
    ProjectSubtaskItem,
    ProjectMeetingItem,
    ProjectActivityItem,
    ProjectPhaseItem,
    IndividualTaskItem,
    TaskChatMessageItem,
    ExtendedProjectItem,
    DEFAULT_AGILE_TASKS,
    BMS_PROJECT_LOGO,
    WMS_PROJECT_LOGO,
    DEFAULT_PROJECT_LOGO,
    getProjectFallbackLogo,
} from './plan.types';

@Component({
    selector: 'user-plan',
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
        TaskDrawerComponent,
        FilePreviewModalComponent,
    ],
    templateUrl: './template.html',
    styleUrl: './style.scss',
})
export class UserPlanComponent implements OnInit, OnDestroy {
    @ViewChild('taskDistributionChartRef') taskDistributionChartRef?: ElementRef<HTMLDivElement>;
    @ViewChild('taskTrendChartRef') taskTrendChartRef?: ElementRef<HTMLDivElement>;
    private _generalCharts: echarts.ECharts[] = [];
    private _resizeListener?: () => void;

    loading = signal<boolean>(false);
    currentUser = signal<any>(null);
    isTasksLoading = signal<boolean>(false);
    plans = signal<ExtendedProjectItem[]>([]);
    searchQuery = signal<string>('');
    statusFilter = signal<string>('all');
    teamMembers = signal<any[]>([]);

    // Currently selected project
    selectedProject = signal<ExtendedProjectItem | null>(null);

    // Sidebar navigation inside selected project (Matching Screenshot Concept)
    projectNavTab = signal<'general' | 'tasks' | 'plan' | 'phases' | 'team' | 'meetings' | 'links'>('tasks');

    // View Style for tasks: 'list' (exact match with screenshot) or 'board'
    taskViewStyle = signal<'list' | 'board'>('list');

    // Unified Task Drawer State (matching /member/tasks Image 1)
    selectedTaskDrawerItem = signal<DrawerTaskItem | null>(null);
    showTaskDrawer = signal<boolean>(false);
    taskDrawerDialogMode = signal<'details' | 'chat'>('details');
    taskDrawerChatMessages = signal<TaskChatMessage[]>([]);
    allTaskFiles = signal<TaskAttachment[]>([]);
    selectedPreviewImage = signal<string | null>(null);
    selectedPreviewFile = signal<TaskAttachment | null>(null);

    getCurrentUserAvatar(): string {
        const u = this._userService.getUser();
        return resolveFileUrl(u?.avatar) || '/images/placeholder/avatar.jpg';
    }

    getProjectLogo(plan: any): string {
        if (!plan) return DEFAULT_PROJECT_LOGO;
        const code = (plan.code || '').toUpperCase();
        const name = (plan.name || '').toUpperCase();
        const id = String(plan.id || '').toLowerCase();

        // 1. Signature project overrides (BMS & WMS)
        if (code.includes('BMS') || name.includes('BMS') || id.includes('bms')) {
            const raw = plan.logo || plan.image;
            if (raw && typeof raw === 'string' && (raw.startsWith('data:') || raw.startsWith('blob:') || raw.includes('/uploads/'))) {
                return resolveFileUrl(raw) || BMS_PROJECT_LOGO;
            }
            return BMS_PROJECT_LOGO;
        }

        if (code.includes('WMS') || name.includes('WMS') || id.includes('wms')) {
            const raw = plan.logo || plan.image;
            if (raw && typeof raw === 'string' && (raw.startsWith('data:') || raw.startsWith('blob:') || raw.includes('/uploads/'))) {
                return resolveFileUrl(raw) || WMS_PROJECT_LOGO;
            }
            return WMS_PROJECT_LOGO;
        }

        const raw = plan.logo || plan.image;
        if (raw && typeof raw === 'string' && !raw.includes('placeholder') && !raw.includes('/images/logo/logo.png') && !raw.includes('/images/logo/wfm_logo.png')) {
            const resolved = resolveFileUrl(raw);
            if (resolved) return resolved;
        }
        return getProjectFallbackLogo(plan.code, plan.name);
    }

    onProjectLogoError(event: Event, plan: any): void {
        const target = event.target as HTMLImageElement;
        const fallback = getProjectFallbackLogo(plan?.code, plan?.name);
        if (target && target.src !== fallback) {
            target.src = fallback;
        } else if (plan) {
            plan._logoFailed = true;
        }
    }

    getAssigneeAvatar(member: any): string | null {
        if (!member || member._avatarFailed) return null;
        const cur = this.currentUser() || this._userService.getUser();
        const curPhone = (cur?.phone || '').replace(/\D/g, '');
        const targetEmail = (member.email || '').toLowerCase().trim();
        const targetPhone = ((member.phone || '') as string).replace(/\D/g, '');



        const curId = cur?.id ? Number(cur.id) : null;
        const memberId = member?.id ? Number(member.id) : null;
        const isCurrentUser = Boolean(
            (curId && memberId && curId === memberId) ||
            (!curId && !memberId && curPhone && targetPhone && curPhone === targetPhone)
        );

        if (isCurrentUser && cur?.avatar) {
            const curAvatar = resolveFileUrl(cur.avatar);
            if (curAvatar && !curAvatar.includes('placeholder') && !curAvatar.includes('portrait')) {
                return curAvatar;
            }
        }

        if (member.avatar) {
            const resolved = resolveFileUrl(member.avatar);
            if (resolved && !resolved.includes('placeholder') && !resolved.includes('portrait')) {
                return resolved;
            }
        }

        const team = this.teamMembers();
        if (team && team.length > 0) {
            const found = team.find((m: any) => {
                const mId = m.id ? Number(m.id) : null;
                const mPhone = ((m.phone || '') as string).replace(/\D/g, '');
                return (memberId && mId && memberId === mId) ||
                       (targetPhone && mPhone && targetPhone === mPhone);
            });
            if (found?.avatar) {
                const resolved = resolveFileUrl(found.avatar);
                if (resolved && !resolved.includes('placeholder') && !resolved.includes('portrait')) {
                    return resolved;
                }
            }
        }

        return null;
    }

    getReporterAvatar(reporter: any): string | null {
        return this.getAssigneeAvatar(reporter);
    }

    onMemberAvatarError(event: Event, member?: any): void {
        const target = event.target as HTMLImageElement;
        if (target) {
            target.style.display = 'none';
        }
        if (member) {
            member._avatarFailed = true;
        }
    }

    teamMembersForDrawer = computed<DrawerTaskMember[]>(() => {
        const proj = this.selectedProject();
        if (!proj || !proj.members) return [];
        return proj.members.map((m) => ({
            id: m.id,
            name: m.name,
            avatar: m.avatar,
            role: m.role,
            initial: m.initial,
            colorClass: m.bgClass,
        }));
    });

    // Timeline configuration (Weeks 14 to 40 = 27 weeks total)
    readonly DEFAULT_AGILE_TASKS = DEFAULT_AGILE_TASKS;
    readonly startWeek = 14;
    readonly totalWeeks = 27;
    readonly weeks = Array.from({ length: 27 }, (_, i) => 14 + i);
    readonly currentYear = new Date().getFullYear();
    readonly currentWeek = this.calculateCurrentWeek();

    readonly quarters = [
        { name: `${new Date().getFullYear()} ត្រីមាសទី ២ (Q2)`, startWeek: 14, weeksCount: 13, bgClass: 'bg-[#2e1065] text-white' },
        { name: `${new Date().getFullYear()} ត្រីមាសទី ៣ (Q3)`, startWeek: 27, weeksCount: 14, bgClass: 'bg-[#ea580c] text-white' },
    ];

    readonly months = [
        { name: 'មេសា', startWeek: 14, weeksCount: 5, bgClass: 'bg-[#f43f5e] text-white' },
        { name: 'ឧសភា', startWeek: 19, weeksCount: 4, bgClass: 'bg-[#0d9488] text-white' },
        { name: 'មិថុនា', startWeek: 23, weeksCount: 4, bgClass: 'bg-[#7c3aed] text-white' },
        { name: 'កក្កដា', startWeek: 27, weeksCount: 5, bgClass: 'bg-[#eab308] text-slate-900' },
        { name: 'សីហា', startWeek: 32, weeksCount: 4, bgClass: 'bg-[#0284c7] text-white' },
        { name: 'កញ្ញា', startWeek: 36, weeksCount: 5, bgClass: 'bg-[#0369a1] text-white' },
    ];

    private readonly _unsubscribeAll = new Subject<any>();

    constructor(
        private readonly _planService: UserPlanService,
        private readonly _router: Router,
        private readonly _matDialog: MatDialog,
        private readonly _dialogConfigService: DialogConfigService,
        private readonly _userService: UserService,
        private readonly _taskSocket: TaskSocketService,
        private readonly _taskService: UserTaskService,
    ) {
        effect(() => {
            const project = this.selectedProject();
            const tab = this.projectNavTab();
            if (project && tab === 'general') {
                setTimeout(() => this.initGeneralCharts(), 80);
            }
        });
    }

    canCreatePlan(): boolean {
        const u: any = this.currentUser() || this._userService.getUser();
        if (!u) return false;

        const preferredRoleId = readPreferredRoleId();
        const roles = Array.isArray(u.roles) ? u.roles : [];

        let activeRole: any = null;
        if (preferredRoleId) {
            activeRole = roles.find((r: any) => Number(r.id) === preferredRoleId);
        }
        if (!activeRole) {
            activeRole = roles.find((r: any) => r.is_default);
        }
        if (!activeRole && (u.is_active || u.active_role_id)) {
            const activeId = Number(u.is_active || u.active_role_id);
            activeRole = roles.find((r: any) => Number(r.id) === activeId);
        }
        if (!activeRole && roles.length > 0) {
            activeRole = roles[0];
        }

        if (!activeRole) return false;

        const slug = (activeRole.slug || '').toLowerCase().trim();
        const nameEn = (activeRole.name_en || activeRole.name || '').toLowerCase().trim();
        const nameKh = (activeRole.name_kh || '').trim();

        // If acting as regular user, member, or personal workspace, creation is forbidden
        if (slug === 'user' || slug === 'member' || slug === 'personal_workspace' || nameKh === 'អ្នកប្រើប្រាស់') {
            return false;
        }

        const isAdminSlug =
            slug === 'superadmin' ||
            slug === 'super-admin' ||
            slug === 'admin' ||
            slug === 'org_admin' ||
            slug === 'org-admin' ||
            slug === 'owner' ||
            slug === 'org_owner';

        const isAdminName =
            nameEn.includes('admin') ||
            nameEn.includes('owner') ||
            nameEn.includes('super') ||
            nameKh === 'អភិបាលប្រព័ន្ធ' ||
            nameKh === 'រដ្ឋបាល';

        return isAdminSlug || isAdminName;
    }

    canManageMembers(): boolean {
        return this.canCreatePlan();
    }

    openCreateProjectModal(): void {
        if (!this.canCreatePlan()) return;
        const allMembersMap = new Map<string, any>();
        for (const p of this.plans()) {
            for (const m of p.members || []) {
                if (m.name && !allMembersMap.has(m.name)) {
                    allMembersMap.set(m.name, m);
                }
            }
        }
        const existingMembers = Array.from(allMembersMap.values());
        const dialogConfig = this._dialogConfigService.getDialogConfig({
            user: this._userService.getUser(),
            members: existingMembers.length ? existingMembers : undefined,
            existingProjects: this.plans().map((p) => ({ id: p.id, code: p.code })),
            onProjectCreated: () => this.loadPlans(),
        });
        const dialogRef = this._matDialog.open(CreateProjectDialogComponent, dialogConfig);
        dialogRef.afterClosed().subscribe((result) => {
            if (result?.created) {
                const created = result.project;
                if (created) {
                    const projCode = created.code || `WFM-${Math.floor(100 + Math.random() * 900)}`;
                    const projName = created.name || result.name || 'គម្រោងថ្មី';
                    const projMembers = (result.assignees || result.members || []).map((a: any, idx: number) => ({
                        id: Number(a.id) || idx + 1,
                        name: a.name,
                        role: a.role || 'Member',
                        initial: a.name ? a.name.charAt(0) : 'M',
                        bgClass: 'bg-blue-600',
                    }));

                    const leadObj = result.lead || (result.reporter ? { id: 1, name: result.reporter, role: 'Leader' } : (projMembers[0] || { id: 1, name: 'Project Lead', role: 'Leader' }));

                    const newProj: ExtendedProjectItem = {
                        id: String(created.id || `proj-${Date.now()}`),
                        code: projCode,
                        name: projName,
                        description: created.description || '',
                        status: created.status || result.status || 'active',
                        priority: created.priority || result.priority || 'high',
                        category: created.category || result.category || 'Development',
                        budget_allocated: Number(created.budget_allocated || created.budget || result.budget || 0),
                        budget_spent: 0,
                        total_tasks: (created.tasks && created.tasks.length) || 0,
                        completed_tasks: 0,
                        progress: 0,
                        start_date: created.start_date || new Date().toISOString(),
                        end_date: created.end_date || new Date(Date.now() + 86400000 * 30).toISOString(),
                        team_lead: created.team_lead || { id: Number(leadObj.id) || 1, name: leadObj.name, role: leadObj.role || 'Leader' },
                        members: projMembers.length ? projMembers : (created.members || []),
                        logo: created.logo || result.logo || created.image || result.image || '/images/logo/logo.png',
                        image: created.image || result.image || created.logo || result.logo || '/images/logo/logo.png',
                        tasks: created.tasks || [],
                        phases: created.phases || [],
                        meetings: created.meetings || [],
                        agileTasks: created.agileTasks || [],
                        links: created.links || [],
                    };
                    this.plans.set([newProj, ...this.plans()]);
                    this.selectedProject.set(newProj);
                    this.saveProjectChanges(newProj);
                    setTimeout(() => this.loadPlans(), 250);
                }
            }
        });
    }

    // Project Editing & Deletion
    showDeletePlanModal = signal<boolean>(false);
    planToDelete = signal<ProjectPlanItem | null>(null);
    isDeletingPlan = signal<boolean>(false);

    openEditProjectModal(plan: ProjectPlanItem, event?: Event): void {
        if (!this.canCreatePlan()) return;

        const allMembersMap = new Map<string, any>();
        for (const p of this.plans()) {
            for (const m of p.members || []) {
                if (m.name && !allMembersMap.has(m.name)) {
                    allMembersMap.set(m.name, m);
                }
            }
        }
        const existingMembers = Array.from(allMembersMap.values());
        const dialogConfig = this._dialogConfigService.getDialogConfig({
            user: this._userService.getUser(),
            members: existingMembers.length ? existingMembers : undefined,
            existingProjects: this.plans().map((p) => ({ id: p.id, code: p.code })),
            project: plan,
            isEditing: true,
        });

        const dialogRef = this._matDialog.open(CreateProjectDialogComponent, dialogConfig);
        dialogRef.afterClosed().subscribe((result) => {
            if (result?.edited) {
                const updatedPayload = result.project || {};
                this._planService.updatePlan(plan.id, updatedPayload).subscribe({
                    next: () => {
                        this.loadPlans();
                    },
                    error: () => {
                        const updated: ExtendedProjectItem = {
                            ...(this.selectedProject()?.id === plan.id ? this.selectedProject()! : (plan as any)),
                            name: updatedPayload.name || plan.name,
                            description: updatedPayload.description ?? plan.description,
                            status: updatedPayload.status || plan.status,
                            priority: updatedPayload.priority || (plan as any).priority,
                            budget_allocated: updatedPayload.budget_allocated || (plan as any).budget_allocated,
                            members: updatedPayload.members || plan.members,
                            team_lead: updatedPayload.team_lead || (plan as any).team_lead,
                            logo: updatedPayload.logo !== undefined ? updatedPayload.logo : ((plan as any).logo || '/images/logo/logo.png'),
                            image: updatedPayload.image !== undefined ? updatedPayload.image : ((plan as any).image || '/images/logo/logo.png'),
                        };
                        this.plans.update((list) => list.map((p) => (p.id === plan.id ? updated : p)));
                        if (this.selectedProject()?.id === plan.id) {
                            this.selectedProject.set(updated);
                        }
                    },
                });
            }
        });
    }

    confirmDeletePlan(plan: ProjectPlanItem, event?: Event): void {
        this.planToDelete.set(plan);
        this.showDeletePlanModal.set(true);
    }

    cancelDeletePlan(): void {
        this.showDeletePlanModal.set(false);
        this.planToDelete.set(null);
    }

    deletePlan(): void {
        const target = this.planToDelete();
        if (!target) return;

        this.isDeletingPlan.set(true);
        this._planService.deletePlan(target.id).subscribe({
            next: () => {
                this.isDeletingPlan.set(false);
                this.showDeletePlanModal.set(false);
                if (this.selectedProject()?.id === target.id) {
                    this.clearSelectedProject();
                }
                this.plans.update((list) => list.filter((p) => p.id !== target.id));
                this.planToDelete.set(null);
                this.loadPlans();
            },
            error: (err) => {
                console.error('Failed to delete project on backend', err);
                this.isDeletingPlan.set(false);
                this.showDeletePlanModal.set(false);
                if (this.selectedProject()?.id === target.id) {
                    this.clearSelectedProject();
                }
                this.plans.update((list) => list.filter((p) => p.id !== target.id));
                this.planToDelete.set(null);
            },
        });
    }

    // Agile Plan Tasks CRUD
    openAddPlanDialog(proj?: ProjectPlanItem): void {
        const targetProject = proj || this.selectedProject();
        const dialogConfig = this._dialogConfigService.getDialogConfig({
            currentWeek: this.currentWeek,
            startWeek: this.startWeek,
            totalWeeks: this.totalWeeks,
            weeks: this.weeks,
            projects: this.plans().map((p) => ({ id: p.id, code: p.code, name: p.name })),
            selectedProjectId: targetProject?.id,
            selectedProjectName: targetProject?.name,
        });

        const dialogRef = this._matDialog.open(AddPlanDialogComponent, dialogConfig);
        dialogRef.afterClosed().subscribe((result) => {
            if (result?.task) {
                const pId = result.projectId || targetProject?.id;
                if (pId) {
                    this._planService.createAgileTask(pId, result.task).subscribe({
                        next: () => this.loadPlans(),
                        error: () => {
                            if (this.selectedProject()) {
                                const updated = { ...this.selectedProject()! };
                                updated.agileTasks = [...(updated.agileTasks || []), result.task];
                                this.selectedProject.set(updated);
                                this.saveProjectChanges(updated);
                            }
                        },
                    });
                }
            }
        });
    }

    openEditAgileTaskDialog(proj: ProjectPlanItem, task: AgilePlanTask, event?: Event): void {
        if (event) event.stopPropagation();
        const dialogConfig = this._dialogConfigService.getDialogConfig({
            currentWeek: this.currentWeek,
            startWeek: this.startWeek,
            totalWeeks: this.totalWeeks,
            weeks: this.weeks,
            projects: this.plans().map((p) => ({ id: p.id, code: p.code, name: p.name })),
            selectedProjectId: proj?.id,
            selectedProjectName: proj?.name,
            task: task,
            isEditing: true,
        });

        const dialogRef = this._matDialog.open(AddPlanDialogComponent, dialogConfig);
        dialogRef.afterClosed().subscribe((result) => {
            if (result?.task) {
                this._planService.updateAgileTask(proj.id, task.id, result.task).subscribe({
                    next: () => this.loadPlans(),
                    error: () => {
                        const updated = { ...proj } as ExtendedProjectItem;
                        updated.agileTasks = (updated.agileTasks || []).map((t) => (t.id === task.id ? result.task : t));
                        this.selectedProject.set(updated);
                        this.saveProjectChanges(updated);
                    },
                });
            }
        });
    }

    deleteAgileTask(proj: ProjectPlanItem, taskId: string, event?: Event): void {
        if (event) event.stopPropagation();
        this._planService.deleteAgileTask(proj.id, taskId).subscribe({
            next: () => {
                const updated = { ...proj } as ExtendedProjectItem;
                updated.agileTasks = (updated.agileTasks || []).filter((t) => t.id !== taskId);
                this.selectedProject.set(updated);
                this.saveProjectChanges(updated);
            },
            error: () => {
                const updated = { ...proj } as ExtendedProjectItem;
                updated.agileTasks = (updated.agileTasks || []).filter((t) => t.id !== taskId);
                this.selectedProject.set(updated);
                this.saveProjectChanges(updated);
            },
        });
    }

    openUserProfileDialog(user?: any): void {
        const currentUser = this._userService.getUser();
        const dialogConfig = this._dialogConfigService.getDialogConfig({
            data: user || currentUser,
            roles: (user || currentUser)?.roles ?? [],
            type: 'គណនី',
        });
        this._matDialog.open(ProfileViewComponent, dialogConfig);
    }

    // Search input inside selected project tasks
    taskSearchQuery = signal<string>('');

    // Overview tab task search and filter signals
    overviewTaskSearchQuery = signal<string>('');
    overviewTaskStatusFilter = signal<string>('all');

    // Filter for subtasks/tasks within selected project
    subtaskFilter = signal<string>('all');

    // Links search and filtering
    linkSearchQuery = signal<string>('');
    linkTypeFilter = signal<string>('all');
    copiedLinkId = signal<string | null>(null);

    // Filtered overview tasks for currently selected project in General Overview tab
    filteredOverviewTasks = computed(() => {
        const proj = this.selectedProject();
        if (!proj || !proj.tasks) return [];
        let list = proj.tasks;

        const q = this.overviewTaskSearchQuery().toLowerCase().trim();
        if (q) {
            list = list.filter(
                (t) =>
                    t.title.toLowerCase().includes(q) ||
                    t.code.toLowerCase().includes(q) ||
                    t.description.toLowerCase().includes(q) ||
                    (t.assignee && t.assignee.name.toLowerCase().includes(q)),
            );
        }

        const filter = this.overviewTaskStatusFilter();
        if (filter !== 'all') {
            if (filter === 'done') {
                list = list.filter((t) => t.status === 'done' || t.status === 'completed');
            } else if (filter === 'in_progress') {
                list = list.filter((t) => t.status === 'in_progress');
            } else if (filter === 'review') {
                list = list.filter((t) => t.status === 'review' || t.status === 'in_review');
            } else if (filter === 'new') {
                list = list.filter((t) => t.status === 'new' || t.status === 'unconfirmed' || t.status === 'todo');
            } else {
                list = list.filter((t) => t.status === filter);
            }
        }
        return list;
    });

    // Active Task for full modal / side detail view (showing chat, subtasks, members, links, documents)
    activeTaskModal = signal<IndividualTaskItem | null>(null);

    // Active Tab in Task Detail Modal: 'chat' | 'subtasks' | 'members' | 'links' | 'documents'
    activeDetailTab = signal<'chat' | 'subtasks' | 'members' | 'links' | 'documents'>('chat');

    // Task Chat Room State
    newChatMessageText = signal<string>('');
    pendingChatAttachments = signal<{ name: string; size: string; type: string; url?: string; isImage?: boolean }[]>([]);
    currentTaskChatMessages = signal<TaskChatMessageItem[]>([]);
    private _taskChatMap: Map<string, TaskChatMessageItem[]> = new Map();

    // New item inputs
    newSubtaskTitle = signal<string>('');
    newLinkTitle = signal<string>('');
    newLinkUrl = signal<string>('');
    showAddLinkForm = signal<boolean>(false);

    // Project counts computed
    projectCounts = computed(() => {
        const all = this.plans();
        return {
            all: all.length,
            active: all.filter((p) => p.status === 'active').length,
            planning: all.filter((p) => p.status === 'planning').length,
            on_hold: all.filter((p) => p.status === 'on_hold').length,
            completed: all.filter((p) => p.status === 'completed').length,
        };
    });

    // Filtered plans computed
    filteredPlans = computed(() => {
        let list = this.plans();
        const q = this.searchQuery().toLowerCase().trim();
        if (q) {
            list = list.filter(
                (p) =>
                    p.name.toLowerCase().includes(q) ||
                    p.code.toLowerCase().includes(q) ||
                    p.description.toLowerCase().includes(q),
            );
        }
        const status = this.statusFilter();
        if (status !== 'all') {
            list = list.filter((p) => p.status === status);
        }
        return list;
    });

    // Filtered tasks for currently selected project
    filteredProjectTasks = computed(() => {
        const proj = this.selectedProject();
        if (!proj || !proj.tasks) return [];
        let list = proj.tasks;

        const q = this.taskSearchQuery().toLowerCase().trim();
        if (q) {
            list = list.filter(
                (t) =>
                    t.title.toLowerCase().includes(q) ||
                    t.code.toLowerCase().includes(q) ||
                    t.description.toLowerCase().includes(q),
            );
        }

        const filter = this.subtaskFilter();
        if (filter !== 'all') {
            list = list.filter((t) => t.status === filter);
        }
        return list;
    });

    // All links flattened across all tasks and project-level links for the selected project
    allProjectLinks = computed(() => {
        const proj = this.selectedProject();
        if (!proj) return [];
        const q = this.linkSearchQuery().toLowerCase().trim();
        const filter = this.linkTypeFilter();

        const list: {
            id: string;
            title: string;
            url: string;
            type: 'figma' | 'github' | 'doc' | 'external';
            taskCode: string;
            taskTitle: string;
            task?: IndividualTaskItem;
        }[] = [];

        const seenIds = new Set<string>();

        if (proj.links) {
            for (const l of proj.links) {
                if (!seenIds.has(l.id)) {
                    seenIds.add(l.id);
                    list.push({
                        id: l.id,
                        title: l.title,
                        url: l.url,
                        type: l.type,
                        taskCode: `#${proj.code || 'WFM'}-001`,
                        taskTitle: proj.name || 'ឯកសារគម្រោង',
                    });
                }
            }
        }

        if (proj.tasks) {
            for (const t of proj.tasks) {
                if (t.links) {
                    for (const l of t.links) {
                        if (!seenIds.has(l.id)) {
                            seenIds.add(l.id);
                            list.push({
                                id: l.id,
                                title: l.title,
                                url: l.url,
                                type: l.type,
                                taskCode: t.code || `#${proj.code || 'WFM'}-001`,
                                taskTitle: t.title || proj.name,
                                task: t,
                            });
                        }
                    }
                }
            }
        }

        return list.filter((item) => {
            const matchesQuery =
                !q ||
                item.title.toLowerCase().includes(q) ||
                item.url.toLowerCase().includes(q) ||
                item.taskCode.toLowerCase().includes(q) ||
                item.taskTitle.toLowerCase().includes(q);
            const matchesType = filter === 'all' || item.type === filter;
            return matchesQuery && matchesType;
        });
    });

    // Board / Kanban Columns Grouping
    boardColumns = computed(() => {
        const tasks = this.filteredProjectTasks();
        return [
            {
                id: 'new',
                title: 'ថ្មី',
                count: tasks.filter((t) => t.status === 'new' || t.status === 'unconfirmed').length,
                badgeClass: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/50',
                dotClass: 'bg-sky-500',
                tasks: tasks.filter((t) => t.status === 'new' || t.status === 'unconfirmed'),
            },
            {
                id: 'in_progress',
                title: 'កំពុងដំណើរការ',
                count: tasks.filter((t) => t.status === 'in_progress' || t.status === 'reopened').length,
                badgeClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50',
                dotClass: 'bg-amber-500',
                tasks: tasks.filter((t) => t.status === 'in_progress' || t.status === 'reopened'),
            },
            {
                id: 'review',
                title: 'ស្នើសុំពិនិត្យ',
                count: tasks.filter((t) => t.status === 'review' || t.status === 'confirmed').length,
                badgeClass: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/50',
                dotClass: 'bg-purple-500',
                tasks: tasks.filter((t) => t.status === 'review' || t.status === 'confirmed'),
            },
            {
                id: 'done',
                title: 'បានបញ្ចប់',
                count: tasks.filter((t) => t.status === 'done' || t.status === 'completed').length,
                badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50',
                dotClass: 'bg-emerald-500',
                tasks: tasks.filter((t) => t.status === 'done' || t.status === 'completed'),
            },
        ];
    });

    calculateCurrentWeek(): number {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const pastDaysOfYear = (now.getTime() - startOfYear.getTime()) / 86400000;
        return Math.min(40, Math.max(14, Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7)));
    }

    getSegmentLeftPercent(startWeek: number): number {
        return Math.max(0, Math.min(100, ((startWeek - this.startWeek) / this.totalWeeks) * 100));
    }

    getSegmentWidthPercent(durationWeeks: number): number {
        return Math.max(0, Math.min(100, (durationWeeks / this.totalWeeks) * 100));
    }

    getIterationColor(iteration: 1 | 2 | 3): string {
        switch (iteration) {
            case 1:
                return 'bg-[#f59e0b] hover:bg-[#d97706]';
            case 2:
                return 'bg-[#f43f5e] hover:bg-[#e11d48]';
            case 3:
                return 'bg-[#581c87] hover:bg-[#4c1d95]';
            default:
                return 'bg-[#581c87] hover:bg-[#4c1d95]';
        }
    }

    loadTeamMembers(): void {
        this._taskService.getMembers().subscribe({
            next: (res) => {
                if (res?.data && res.data.length > 0) {
                    this.teamMembers.set(res.data);
                }
            },
            error: (err) => console.error('Failed to load team members from DB', err),
        });
    }

            ngOnInit(): void {
                this.currentUser.set(this._userService.getUser());
                this._userService.user$
                    .pipe(takeUntil(this._unsubscribeAll))
                    .subscribe((u) => {
                        this.currentUser.set(u);
                    });

                this.loadTeamMembers();
                this.loadPlans();

                // Replaces the old manual refresh button: project progress is derived
                // from task state, so both task and project events invalidate this list.
                merge(
                    this._taskSocket.taskUpdates(),
                    this._taskSocket.projectUpdates(),
                )
                    .pipe(takeUntil(this._unsubscribeAll))
                    .subscribe(() => this.loadPlans());

                // Real-time task comments & chat updates
                this._taskSocket
                    .taskCommentUpdates()
                    .pipe(takeUntil(this._unsubscribeAll))
                    .subscribe((evt) => {
                        const taskIdStr = String(evt.task_id);
                        const currentDrawer = this.selectedTaskDrawerItem();

                        // 1. Update task counter in selectedProject
                        this.selectedProject.update((proj) => {
                            if (!proj?.tasks) return proj;
                            return {
                                ...proj,
                                tasks: proj.tasks.map((t) => {
                                    const tId = String(t.id).replace(/\D/g, '') || String(t.id);
                                    const cleanTarget = taskIdStr.replace(/\D/g, '') || taskIdStr;
                                    if (tId === cleanTarget || String(t.id) === taskIdStr) {
                                        return {
                                            ...t,
                                            comments_count: evt.comments_count ?? (t.comments_count || 0) + 1,
                                            attachments_count: evt.attachments_count ?? t.attachments_count,
                                        };
                                    }
                                    return t;
                                }),
                            };
                        });

                        // 2. If task drawer is currently open for this task, append comment
                        if (currentDrawer) {
                            const drawerIdClean = String(currentDrawer.id).replace(/\D/g, '') || String(currentDrawer.id);
                            const incomingIdClean = taskIdStr.replace(/\D/g, '') || taskIdStr;

                            if (drawerIdClean === incomingIdClean || String(currentDrawer.id) === taskIdStr) {
                                currentDrawer.comments_count = evt.comments_count ?? (currentDrawer.comments_count || 0) + 1;
                                if (evt.attachments_count !== undefined) {
                                    currentDrawer.attachments_count = evt.attachments_count;
                                }

                                const currentUser = this._userService.getUser();
                                const isSelf = Boolean(currentUser?.id && evt.comment.sender_id === currentUser.id);

                                const currentMsgs = this.taskDrawerChatMessages();
                                const alreadyExists = currentMsgs.some((m) =>
                                    (m.id && evt.comment.id && m.id === evt.comment.id) ||
                                    (isSelf && m.text === evt.comment.text && Math.abs(new Date(m.created_at || 0).getTime() - new Date(evt.comment.created_at || 0).getTime()) < 4000)
                                );

                                if (!alreadyExists) {
                                    let displayTime = evt.comment.time;
                                    if (evt.comment.created_at) {
                                        const d = new Date(evt.comment.created_at);
                                        if (!isNaN(d.getTime())) {
                                            displayTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                        }
                                    }

                                    const incomingMsg: TaskChatMessage = {
                                        ...evt.comment,
                                        is_self: isSelf,
                                        time: displayTime || 'ទើបតែផ្ញើ',
                                    };

                                    this.taskDrawerChatMessages.update((msgs) => [...msgs, incomingMsg]);
                                }
                            }
                        }
                    });
            }

            loadPlans(): void {
                this.loading.set(true);

                forkJoin({
                    plansRes: this._planService.getPlans({
                        search: this.searchQuery() || undefined,
                        status: this.statusFilter() !== 'all' ? this.statusFilter() : undefined,
                    }).pipe(catchError(() => of(null))),
                    tasksRes: this._taskService.getTasks({ scope: 'all' }).pipe(catchError(() => of(null))),
                    projectsRes: this._taskService.getProjects().pipe(catchError(() => of(null))),
                }).subscribe({
                    next: ({ plansRes, tasksRes, projectsRes }) => {
                        const allTasks: TaskItem[] = tasksRes?.data?.results || [];
                        const taskProjects: any[] = projectsRes?.data || [];

                        const rawPlans: any[] = Array.isArray(plansRes?.data)
                            ? plansRes.data
                            : Array.isArray((plansRes?.data as any)?.results)
                            ? (plansRes?.data as any).results
                            : [];

                        if (rawPlans.length > 0) {
                            const items: ExtendedProjectItem[] = rawPlans.map((ap) => {
                                const matchingTaskProj = taskProjects.find(
                                    (tp) => tp.id === String(ap.id) || tp.code === ap.code || tp.name === ap.name
                                );
                                const fallbackDefaultLogo = getProjectFallbackLogo(ap.code, ap.name);

                                const pid = String(ap.id || '').toLowerCase().trim();
                                const pcode = (ap.code || '').toLowerCase().trim().replace('#', '');
                                const pname = (ap.name || '').toLowerCase().trim();

                                const projectTasks = allTasks.filter((t) => {
                                    const tPid = (t.project_id || '').toLowerCase().trim();
                                    const tPname = (t.project_name || '').toLowerCase().trim();
                                    const tCode = (t.code || '').toLowerCase().trim().replace('#', '');

                                    const isBmsPlan = pcode === '0002' || pid === '0002' || pid === 'bms-digitech' || pid === '4';
                                    if (isBmsPlan) {
                                        return tPid === '0002' || tPid === 'bms-digitech' || tPid === 'bms' || tCode.startsWith('0002-') || tCode.startsWith('bms-') || tPname.includes('bms');
                                    }

                                    const isWmsPlan = pcode === '0001' || pid === '0001' || pid === 'wms-digitech' || pid === '5';
                                    if (isWmsPlan) {
                                        return tPid === '0001' || tPid === 'wms-digitech' || tPid === 'wms' || tCode.startsWith('0001-') || tCode.startsWith('wms-') || tPname.includes('wms');
                                    }

                                    return (
                                        (tPid && (tPid === pid || tPid === pcode)) ||
                                        (pcode && (tCode === pcode || tCode.startsWith(pcode + '-'))) ||
                                        (pname && tPname === pname)
                                    );
                                });

                                const mappedTasks: IndividualTaskItem[] =
                                    projectTasks.length > 0
                                        ? projectTasks.map((t) => this.mapTaskToIndividualTaskItem(t))
                                        : (ap as any).tasks?.length
                                        ? (ap as any).tasks.map((t: any) => this.mapTaskToIndividualTaskItem(t))
                                        : [];

                                const total =
                                    projectTasks.length > 0
                                        ? projectTasks.length
                                        : typeof ap.total_tasks === 'number'
                                        ? ap.total_tasks
                                        : 0;

                                const completed =
                                    projectTasks.length > 0
                                        ? projectTasks.filter((t) =>
                                              ['done', 'completed'].includes((t.status || '').toLowerCase())
                                          ).length
                                        : typeof ap.completed_tasks === 'number'
                                        ? ap.completed_tasks
                                        : 0;

                                const progress =
                                    total > 0
                                        ? Math.round((completed / total) * 100)
                                        : typeof ap.progress === 'number'
                                        ? ap.progress
                                        : 0;

                                const mappedMembers = ((ap as any).members?.length ? (ap as any).members : []).map(
                                    (m: any, idx: number) => {
                                        const colors = ['bg-indigo-600', 'bg-emerald-600', 'bg-amber-600', 'bg-rose-600', 'bg-purple-600', 'bg-teal-600'];
                                        return {
                                            id: m.id || idx + 1,
                                            name: m.name || 'Member',
                                            role: m.role || 'Member',
                                            initial: (m.name || 'M').charAt(0).toUpperCase(),
                                            bgClass: m.bgClass || colors[idx % colors.length],
                                            email: m.email || '',
                                            phone: m.phone || '',
                                            avatar: m.avatar || null,
                                        };
                                    }
                                );

                                return {
                                    id: String(ap.id),
                                    code: ap.code,
                                    name: ap.name,
                                    logo:
                                        resolveFileUrl((ap as any).logo) ||
                                        resolveFileUrl((ap as any).image) ||
                                        resolveFileUrl(matchingTaskProj?.logo) ||
                                        resolveFileUrl(matchingTaskProj?.image) ||
                                        fallbackDefaultLogo,
                                    image:
                                        resolveFileUrl((ap as any).image) ||
                                        resolveFileUrl((ap as any).logo) ||
                                        resolveFileUrl(matchingTaskProj?.image) ||
                                        resolveFileUrl(matchingTaskProj?.logo) ||
                                        fallbackDefaultLogo,
                                    description: ap.description || '',
                                    status: (ap.status as any) || 'active',
                                    priority: (ap as any).priority || 'high',
                                    category: (ap as any).category || 'Development',
                                    budget_allocated: Number((ap as any).budget_allocated || (ap as any).budget || 0),
                                    budget_spent: Number((ap as any).budget_spent || 0),
                                    total_tasks: total,
                                    completed_tasks: completed,
                                    progress: progress,
                                    start_date: ap.start_date || new Date().toISOString(),
                                    end_date:
                                        ap.end_date ||
                                        new Date(Date.now() + 86400000 * 30).toISOString(),
                                    team_lead:
                                        (ap as any).team_lead || { id: 1, name: 'Project Lead', role: 'Leader' },
                                    members: mappedMembers,
                                    tasks: mappedTasks,
                                    phases: (ap as any).phases?.length ? (ap as any).phases : [],
                                    meetings: (ap as any).meetings?.length
                                        ? (ap as any).meetings
                                        : [],
                                    agileTasks: (ap as any).agileTasks?.length
                                        ? (ap as any).agileTasks
                                        : [],
                                    links: (ap as any).links?.length ? (ap as any).links : [],
                                };
                            });
                            this.plans.set(items);
                            if (this.selectedProject()) {
                                const currentSel = this.selectedProject();
                                const matchingSel = items.find(
                                    (p) => p.id === currentSel?.id || p.code === currentSel?.code
                                );
                                if (matchingSel) {
                                    this.selectedProject.set(matchingSel);
                                } else {
                                    this.selectedProject.set(null);
                                }
                            }
                        } else {
                            this.plans.set([]);
                            this.selectedProject.set(null);
                        }
                        this.loading.set(false);
                    },
                    error: () => {
                        this.plans.set([]);
                        this.selectedProject.set(null);
                        this.loading.set(false);
                    },
                });
            }

            saveProjectChanges(proj?: ExtendedProjectItem | null): void {
                const target = proj || this.selectedProject();
                if (!target) return;

                const updated = { ...target };
                this.selectedProject.set(updated);
                this.plans.update((list) => list.map((p) => (p.id === updated.id ? updated : p)));

                this._planService
                    .updatePlan(target.id, {
                        name: target.name,
                        code: target.code,
                        description: target.description,
                        status: target.status as any,
                        progress: target.progress,
                        start_date: target.start_date,
                        end_date: target.end_date,
                        total_tasks: target.tasks?.length || target.total_tasks,
                        completed_tasks:
                            target.tasks?.filter((t) => t.status === 'done' || t.status === 'completed').length ||
                            target.completed_tasks,
                        members: target.members,
                        ...({
                            tasks: target.tasks,
                            phases: target.phases,
                            meetings: target.meetings,
                            agileTasks: target.agileTasks,
                            links: target.links,
                        } as any),
                    })
                    .subscribe({
                        next: () => {},
                        error: () => {},
                    });
            }

    onSearchChange(): void {
        const q = this.searchQuery().toLowerCase().trim();
        if (!q && this.statusFilter() === 'all') {
            this.loadPlans();
        }
    }

    filterByStatus(status: string): void {
        this.statusFilter.set(status);
    }

    mapTaskToIndividualTaskItem(t: any): IndividualTaskItem {
        const priority = (t.priority || 'medium').toLowerCase();
        const status = (t.status || 'new').toLowerCase();

        // Reporter
        const reporterName = t.reporter?.name || (typeof t.reporter === 'string' ? t.reporter : 'ពិសិដ្ឋ បញ្ញាវ័ន្ត');
        const reporterInitial = reporterName ? reporterName.charAt(0).toUpperCase() : 'P';

        // Assignee
        let assigneeObj: TaskMember = {
            id: 1,
            name: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត',
            role: 'Super Admin',
            initial: 'P',
            bgClass: 'bg-indigo-600',
        };

        if (t.assignee) {
            const aName = t.assignee.name || (typeof t.assignee === 'string' ? t.assignee : '');
            if (aName) {
                assigneeObj = {
                    id: t.assignee.id || 1,
                    name: aName,
                    role: t.assignee.role || 'Member',
                    initial: aName.charAt(0).toUpperCase(),
                    bgClass: t.assignee.bgClass || t.assignee.colorClass || 'bg-blue-600',
                    avatar: t.assignee.avatar || null,
                    email: t.assignee.email || '',
                };
            }
        } else if (t.assignees && t.assignees.length > 0) {
            const first = t.assignees[0];
            const aName = first.name || (typeof first === 'string' ? first : '');
            if (aName) {
                assigneeObj = {
                    id: first.id || 1,
                    name: aName,
                    role: first.role || 'Member',
                    initial: aName.charAt(0).toUpperCase(),
                    bgClass: first.bgClass || first.colorClass || 'bg-blue-600',
                    avatar: first.avatar || null,
                    email: first.email || '',
                };
            }
        }

        const members: TaskMember[] = (t.assignees || []).map((a: any) => ({
            id: a.id || 1,
            name: a.name || 'Member',
            role: a.role || 'Member',
            initial: (a.name || 'M').charAt(0).toUpperCase(),
            bgClass: a.bgClass || a.colorClass || 'bg-slate-600',
            avatar: a.avatar || null,
            email: a.email || '',
        }));

        let dueDateStr = '';
        if (t.due_date) {
            try {
                dueDateStr = new Date(t.due_date).toISOString().split('T')[0];
            } catch {
                dueDateStr = String(t.due_date);
            }
        }

        return {
            id: String(t.id),
            code: t.code || `#TASK-${t.id}`,
            title: t.title || '',
            description: t.description || '',
            priority: (['urgent', 'high', 'medium', 'low'].includes(priority) ? priority : 'medium') as any,
            status: status,
            due_date: dueDateStr,
            created_at: t.created_at || new Date().toISOString(),
            time_ago: t.time_ago || '',
            comments_count: t.comments_count || 0,
            attachments_count: t.attachments_count || 0,
            reporter: {
                id: t.reporter?.id || 1,
                name: reporterName,
                role: t.reporter?.role || 'Super Admin',
                initial: reporterInitial,
                bgClass: 'bg-emerald-600',
                avatar: t.reporter?.avatar || null,
            },
            assignee: assigneeObj,
            members: members.length > 0 ? members : [assigneeObj],
            progress: t.progress || (['done', 'completed'].includes(status) ? 100 : 0),
            subtasks: t.subtasks || [],
            links: t.links || [],
            documents: t.documents || [],
        };
    }

    selectProject(project: ExtendedProjectItem): void {
        const latest = this.plans().find((p) => p.id === project.id || p.code === project.code) || project;
        this.selectedProject.set(latest);
        this.projectNavTab.set('tasks');
        this.subtaskFilter.set('all');
        this.taskSearchQuery.set('');
        this.isTasksLoading.set(true);

        this._planService
            .getTasks(latest.id)
            .pipe(
                catchError(() => of(null)),
                finalize(() => this.isTasksLoading.set(false))
            )
            .subscribe((res) => {
                const tasksList = res?.data;
                if (Array.isArray(tasksList) && tasksList.length > 0) {
                    const mapped = tasksList.map((t) => this.mapTaskToIndividualTaskItem(t));
                    const current = this.selectedProject();
                    if (current && (current.id === latest.id || current.code === latest.code)) {
                        const updatedProject: ExtendedProjectItem = {
                            ...current,
                            tasks: mapped,
                            total_tasks: mapped.length,
                            completed_tasks: mapped.filter((t) =>
                                ['done', 'completed'].includes((t.status || '').toLowerCase())
                            ).length,
                        };
                        updatedProject.progress =
                            updatedProject.total_tasks > 0
                                ? Math.round((updatedProject.completed_tasks / updatedProject.total_tasks) * 100)
                                : 0;

                        this.selectedProject.set(updatedProject);
                        this.plans.update((list) =>
                            list.map((p) => (p.id === updatedProject.id ? updatedProject : p))
                        );
                    }
                } else if (latest.tasks && latest.tasks.length > 0) {
                    this.selectedProject.set(latest);
                }
            });
    }

    clearSelectedProject(): void {
        this.selectedProject.set(null);
        this.activeTaskModal.set(null);
        this.closeTaskDrawer();
    }

    // Open unified Task Drawer (matching /member/tasks Image 1)
    openTaskModal(task: IndividualTaskItem, mode: 'details' | 'chat' = 'details'): void {
        const drawerTask: DrawerTaskItem = {
            id: task.id,
            code: task.code,
            title: task.title,
            description: task.description || task.title,
            task_type: (task.type as any) || 'feature',
            status: (task.status as any) || 'new',
            priority: (task.priority as any) || 'medium',
            progress: task.progress || 0,
            due_date: task.due_date || null,
            project_id: this.selectedProject()?.id || 'bms-digitech',
            project_name: this.selectedProject()?.name || 'BMS Digitech',
            reporter: task.reporter ? {
                id: task.reporter.id,
                name: task.reporter.name,
                avatar: task.reporter.avatar,
                role: task.reporter.role,
            } : undefined,
            assignee: task.assignee ? {
                id: task.assignee.id,
                name: task.assignee.name,
                avatar: task.assignee.avatar,
                role: task.assignee.role,
                email: task.assignee.email,
            } : { id: 1, name: 'Unassigned' },
            assignees: task.members && task.members.length > 0 ? task.members.map((m) => ({
                id: m.id,
                name: m.name,
                avatar: m.avatar,
                role: m.role,
                email: m.email,
            })) : (task.assignee ? [{
                id: task.assignee.id,
                name: task.assignee.name,
                avatar: task.assignee.avatar,
                role: task.assignee.role,
            }] : []),
            created_at: task.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
            comments_count: task.comments_count || 0,
            attachments_count: task.attachments_count || 0,
        };

        this.selectedTaskDrawerItem.set(drawerTask);
        this.taskDrawerDialogMode.set(mode);
        this.showTaskDrawer.set(true);

        const numericId = parseInt(String(task.id).replace(/\D/g, ''), 10);
        if (!isNaN(numericId)) {
            this._taskSocket.joinTask(numericId);
        }

        const msgs: TaskChatMessage[] = [
            {
                id: 1,
                sender_name: 'ប្រព័ន្ធ (System)',
                text: `កិច្ចការ ${task.code} ត្រូវបានបង្កើតឡើងកាលពី ${task.time_ago || 'ថ្មីៗ'}`,
                time: task.time_ago || 'ថ្មីៗ',
                is_self: false,
                is_system: true,
            },
            {
                id: 2,
                sender_name: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត',
                sender_avatar: '/images/placeholder/avatar.jpg',
                text: `សួស្តី! សូមពិនិត្យមើលព័ត៌មានលម្អិត និងកិច្ចការរងសម្រាប់ "${task.title}" នេះផង។`,
                time: '02:00 PM',
                is_self: false,
                is_system: false,
            },
        ];
        if (task.status) {
            msgs.push({
                id: 3,
                sender_name: 'ប្រព័ន្ធ (System)',
                text: `បានប្តូរស្ថានភាពទៅជា "${this.getTaskStatusLabel(task.status)}"`,
                time: '10:37 PM',
                is_self: false,
                is_system: true,
            });
        }
        this.taskDrawerChatMessages.set(msgs);

        if (task.documents && task.documents.length > 0) {
            this.allTaskFiles.set(task.documents.map((d) => ({
                name: d.name,
                size: d.size,
                type: d.type,
                url: d.url,
                isImage: d.type === 'image',
            })));
        } else {
            this.allTaskFiles.set([]);
        }
    }

    closeTaskDrawer(): void {
        const cur = this.selectedTaskDrawerItem();
        if (cur?.id) {
            const numericId = parseInt(String(cur.id).replace(/\D/g, ''), 10);
            if (!isNaN(numericId)) {
                this._taskSocket.leaveTask(numericId);
            }
        }
        this.showTaskDrawer.set(false);
        this.selectedTaskDrawerItem.set(null);
    }

    onTaskDrawerStatusChange(event: { task: DrawerTaskItem; status: string }): void {
        const proj = this.selectedProject();
        if (proj?.tasks) {
            const target = proj.tasks.find((t) => t.id === event.task.id || t.code === event.task.code);
            if (target) {
                target.status = event.status;
            }
        }
        this.selectedTaskDrawerItem.update((t) => t ? { ...t, status: event.status } : null);
        this.taskDrawerChatMessages.update((msgs) => [
            ...msgs,
            {
                id: Date.now(),
                sender_name: 'ប្រព័ន្ធ (System)',
                text: `បានប្តូរស្ថានភាពទៅជា "${this.getTaskStatusLabel(event.status)}"`,
                time: 'ទើបតែផ្ញើ',
                is_self: false,
                is_system: true,
            }
        ]);
    }

    onTaskDrawerTypeChange(event: { task: DrawerTaskItem; taskType: string }): void {
        const proj = this.selectedProject();
        if (proj?.tasks) {
            const target = proj.tasks.find((t) => t.id === event.task.id || t.code === event.task.code);
            if (target) {
                target.type = event.taskType as any;
            }
        }
        this.selectedTaskDrawerItem.update((t) => t ? { ...t, task_type: event.taskType } : null);
    }

    onTaskDrawerPriorityChange(event: { task: DrawerTaskItem; priority: string }): void {
        const proj = this.selectedProject();
        if (proj?.tasks) {
            const target = proj.tasks.find((t) => t.id === event.task.id || t.code === event.task.code);
            if (target) {
                target.priority = event.priority as any;
            }
        }
        this.selectedTaskDrawerItem.update((t) => t ? { ...t, priority: event.priority as any } : null);
    }

    onTaskDrawerDueDateChange(event: { task: DrawerTaskItem; dueDate: string | null }): void {
        const proj = this.selectedProject();
        if (proj?.tasks) {
            const target = proj.tasks.find((t) => t.id === event.task.id || t.code === event.task.code);
            if (target) {
                target.due_date = event.dueDate || undefined;
            }
        }
        this.selectedTaskDrawerItem.update((t) => t ? { ...t, due_date: event.dueDate } : null);
    }

    onTaskDrawerTitleChange(event: { task: DrawerTaskItem; title: string }): void {
        const proj = this.selectedProject();
        if (proj?.tasks) {
            const target = proj.tasks.find((t) => t.id === event.task.id || t.code === event.task.code);
            if (target) {
                target.title = event.title;
            }
        }
        this.selectedTaskDrawerItem.update((t) => (t ? { ...t, title: event.title } : null));
        const numericId = parseInt(String(event.task.id).replace(/\D/g, ''), 10);
        if (!isNaN(numericId)) {
            this._taskService.updateTask(numericId, { title: event.title }).subscribe({ error: () => {} });
        }
    }

    onTaskDrawerDescriptionChange(event: { task: DrawerTaskItem; description: string }): void {
        const proj = this.selectedProject();
        if (proj?.tasks) {
            const target = proj.tasks.find((t) => t.id === event.task.id || t.code === event.task.code);
            if (target) {
                target.description = event.description;
            }
        }
        this.selectedTaskDrawerItem.update((t) => (t ? { ...t, description: event.description } : null));
        const numericId = parseInt(String(event.task.id).replace(/\D/g, ''), 10);
        if (!isNaN(numericId)) {
            this._taskService.updateTask(numericId, { description: event.description }).subscribe({ error: () => {} });
        }
    }

    onTaskDrawerAssigneeToggle(event: { task: DrawerTaskItem; member: DrawerTaskMember }): void {
        this.selectedTaskDrawerItem.update((t) => {
            if (!t) return null;
            const current = t.assignees || [];
            const exists = current.some((a) => a.id === event.member.id);
            const updated = exists
                ? current.filter((a) => a.id !== event.member.id)
                : [...current, event.member];
            return {
                ...t,
                assignee: updated[0] || t.assignee,
                assignees: updated,
            };
        });
    }

    onTaskDrawerReporterChange(event: { task: DrawerTaskItem; member: DrawerTaskMember }): void {
        this.selectedTaskDrawerItem.update((t) => t ? { ...t, reporter: event.member } : null);
    }

    onTaskDrawerSendMessage(event: { text: string; attachments: TaskAttachment[] }): void {
        const user = this._userService.getUser();
        const userName = user?.name || (user as any)?.name_kh || (user as any)?.kh_name || 'ខ្ញុំ (Me)';
        const newMsg: TaskChatMessage = {
            id: Date.now(),
            sender_name: userName,
            sender_avatar: this.getCurrentUserAvatar(),
            text: event.text,
            time: 'ទើបតែផ្ញើ',
            is_self: true,
            is_system: false,
            attachments: event.attachments && event.attachments.length > 0 ? event.attachments : undefined,
        };
        this.taskDrawerChatMessages.update((msgs) => [...msgs, newMsg]);
    }

    viewTaskFile(file: TaskAttachment): void {
        this.selectedPreviewFile.set(file);
        if (file.isImage && file.url) {
            this.selectedPreviewImage.set(file.url);
        }
    }

    openImagePreview(url: string): void {
        this.selectedPreviewImage.set(url);
    }

    downloadTaskFile(file: TaskAttachment): void {
        if (file.url) {
            window.open(file.url, '_blank');
        }
    }

    closeFilePreview(): void {
        this.selectedPreviewFile.set(null);
        this.selectedPreviewImage.set(null);
    }

    onTaskDrawerDelete(task: DrawerTaskItem): void {
        const proj = this.selectedProject();
        if (proj?.tasks) {
            proj.tasks = proj.tasks.filter((t) => t.id !== task.id && t.code !== task.code);
        }
        this.closeTaskDrawer();
    }

    closeTaskModal(): void {
        this.activeTaskModal.set(null);
        this.showAddLinkForm.set(false);
        this.pendingChatAttachments.set([]);
        this.newChatMessageText.set('');
    }

    loadTaskChat(task: IndividualTaskItem): void {
        if (!this._taskChatMap.has(task.id)) {
            const initialChats: TaskChatMessageItem[] = [
                {
                    id: `msg-${Date.now()}-1`,
                    sender_name: 'ប្រព័ន្ធ (System)',
                    text: `កិច្ចការ ${task.code} ត្រូវបានបង្កើតឡើងកាលពី ${task.time_ago || 'ថ្មីៗ'}`,
                    time: task.time_ago || 'ថ្មីៗ',
                    is_self: false,
                    is_system: true,
                },
                {
                    id: `msg-${Date.now()}-2`,
                    sender_name: 'សុខ សុភា',
                    sender_initial: 'S',
                    sender_bg: 'bg-blue-600',
                    text: `សួស្តីក្រុមការងារ! សូមពិនិត្យមើលព័ត៌មានលម្អិត និងកិច្ចការរងសម្រាប់ ${task.title} នេះផង។`,
                    time: '១០ នាទីមុន',
                    is_self: false,
                    is_system: false,
                },
                {
                    id: `msg-${Date.now()}-3`,
                    sender_name: 'ពុំ ប្រុសមុន្នី',
                    sender_initial: 'PB',
                    sender_bg: 'bg-blue-600',
                    text: 'បានទទួលហើយបង! ខ្ញុំកំពុងត្រៀមអនុវត្ត និងធ្វើតេស្តតាមដំណាក់កាល។',
                    time: '៥ នាទីមុន',
                    is_self: false,
                    is_system: false,
                },
            ];

            if (task.code === '#PMS-513' || task.code === '#BMS-0003') {
                initialChats.push({
                    id: `msg-${Date.now()}-4`,
                    sender_name: 'សុខ សុភា',
                    sender_initial: 'S',
                    sender_bg: 'bg-blue-600',
                    text: 'សូមយកចិត្តទុកដាក់លើ Flow Clear Active Tokens and Cookies ពេល User Logout ដើម្បីធានាសុវត្ថិភាពទិន្នន័យ។',
                    time: '៣ នាទីមុន',
                    is_self: false,
                    is_system: false,
                });
            }

            this._taskChatMap.set(task.id, initialChats);
        }

        this.currentTaskChatMessages.set([...(this._taskChatMap.get(task.id) || [])]);
    }

    sendTaskChatMessage(task: IndividualTaskItem): void {
        const text = this.newChatMessageText().trim();
        const pendingAtts = [...this.pendingChatAttachments()];

        if (!text && pendingAtts.length === 0) return;

        const newMsg: TaskChatMessageItem = {
            id: `msg-${Date.now()}`,
            sender_name: 'អ្នក (ខ្ញុំ)',
            sender_initial: 'ME',
            sender_bg: 'bg-blue-600',
            text: text,
            time: 'ទើបតែផ្ញើ (Just now)',
            is_self: true,
            is_system: false,
            attachments: pendingAtts.length > 0 ? pendingAtts : undefined,
        };

        const currentList = this._taskChatMap.get(task.id) || [];
        const updatedList = [...currentList, newMsg];
        this._taskChatMap.set(task.id, updatedList);
        this.currentTaskChatMessages.set(updatedList);

        task.comments_count = updatedList.filter((m) => !m.is_system).length;

        this.newChatMessageText.set('');
        this.pendingChatAttachments.set([]);
    }

    onChatFileSelected(event: Event, task: IndividualTaskItem): void {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        const files = Array.from(input.files);
        const newAtts = files.map((f) => {
            const isImage = f.type.startsWith('image/');
            return {
                name: f.name,
                size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
                type: isImage ? 'image' : f.name.endsWith('.pdf') ? 'pdf' : f.name.endsWith('.xlsx') ? 'sheet' : 'doc',
                url: isImage ? URL.createObjectURL(f) : undefined,
                isImage: isImage,
            };
        });

        this.pendingChatAttachments.set([...this.pendingChatAttachments(), ...newAtts]);
        input.value = '';
    }

    removePendingChatAttachment(index: number): void {
        const current = [...this.pendingChatAttachments()];
        current.splice(index, 1);
        this.pendingChatAttachments.set(current);
    }

    toggleSubtask(task: IndividualTaskItem, subtask: ProjectSubtaskItem): void {
        subtask.completed = !subtask.completed;
        const total = task.subtasks.length;
        const done = task.subtasks.filter((s) => s.completed).length;
        task.progress = total > 0 ? Math.round((done / total) * 100) : 0;
        if (task.progress === 100) {
            task.status = 'done';
        } else if (task.progress > 0) {
            task.status = 'in_progress';
        }
        this.saveProjectChanges();
    }

    addSubtask(task: IndividualTaskItem): void {
        const title = this.newSubtaskTitle().trim();
        if (!title) return;
        task.subtasks.push({
            id: `st-${Date.now()}`,
            title,
            completed: false,
        });
        this.newSubtaskTitle.set('');
        const total = task.subtasks.length;
        const done = task.subtasks.filter((s) => s.completed).length;
        task.progress = Math.round((done / total) * 100);
        this.saveProjectChanges();
    }

    addLink(task: IndividualTaskItem): void {
        const title = this.newLinkTitle().trim();
        let url = this.newLinkUrl().trim();
        if (!title || !url) return;

        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = `https://${url}`;
        }

        let type: 'figma' | 'github' | 'doc' | 'external' = 'external';
        if (url.includes('figma.com')) type = 'figma';
        else if (url.includes('github.com')) type = 'github';
        else if (url.includes('notion.so') || url.includes('docs.google.com')) type = 'doc';

        task.links.push({
            id: `link-${Date.now()}`,
            title,
            url,
            type,
        });

        this.newLinkTitle.set('');
        this.newLinkUrl.set('');
        this.showAddLinkForm.set(false);
        this.saveProjectChanges();
    }

    removeLink(task: IndividualTaskItem, linkId: string): void {
        task.links = task.links.filter((l) => l.id !== linkId);
        this.saveProjectChanges();
    }

    openCreatePhaseModal(): void {
        if (!this.canManageMembers()) return;
        const proj = this.selectedProject();
        const dialogConfig = this._dialogConfigService.getDialogConfig({
            user: this._userService.getUser(),
            currentPhasesCount: proj?.phases?.length || 0,
            projectName: proj?.name,
        });
        const dialogRef = this._matDialog.open(CreatePhaseDialogComponent, dialogConfig);
        dialogRef.afterClosed().subscribe((result) => {
            if (result && result.title && proj) {
                if (!proj.phases) proj.phases = [];
                const newPhase: ProjectPhaseItem = {
                    id: `ph-${Date.now()}`,
                    title: result.title,
                    quarter: result.quarter || 'ត្រីមាស',
                    startDate: result.startDate || '01/10/2026',
                    endDate: result.endDate || '31/12/2026',
                    tasksCount: 0,
                    status: result.status || 'planned',
                };
                proj.phases.push(newPhase);
                this.saveProjectChanges(proj);
            }
        });
    }

    deletePhase(phaseId: string, event: Event): void {
        event.stopPropagation();
        if (!this.canManageMembers()) return;
        const proj = this.selectedProject();
        if (!proj || !proj.phases) return;
        proj.phases = proj.phases.filter((p) => p.id !== phaseId);
        this.saveProjectChanges(proj);
    }

    openCreateMeetingModal(): void {
        const dialogConfig = this._dialogConfigService.getDialogConfig({
            user: this._userService.getUser(),
        });
        const dialogRef = this._matDialog.open(CreateMeetingDialogComponent, dialogConfig);
        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.loadPlans();
            }
        });
    }

    deleteMeeting(meetingId: string, event: Event): void {
        event.stopPropagation();
        if (!this.canManageMembers()) return;
        const proj = this.selectedProject();
        if (!proj || !proj.meetings) return;
        proj.meetings = proj.meetings.filter((m) => m.id !== meetingId);
        this.saveProjectChanges(proj);
    }

    openCreateMemberModal(): void {
        if (!this.canManageMembers()) return;
        const proj = this.selectedProject();
        const dialogConfig = this._dialogConfigService.getDialogConfig({
            user: this._userService.getUser(),
            projectName: proj?.name,
            existingMemberIds: proj?.members?.map((m: any) => m.id) || [],
            existingMemberNames: proj?.members?.map((m: any) => m.name) || [],
        });
        const dialogRef = this._matDialog.open(CreateMemberDialogComponent, dialogConfig);
        dialogRef.afterClosed().subscribe((result) => {
            if (result && result.name && proj) {
                if (!proj.members) proj.members = [];
                const newM: TaskMember = {
                    id: result.id || Date.now(),
                    name: result.name,
                    role: result.role || 'Developer',
                    email: result.email || undefined,
                    avatar: result.avatar || undefined,
                    initial: result.initial || result.name.charAt(0).toUpperCase(),
                    bgClass: 'bg-indigo-600',
                };
                proj.members.push(newM);
                this.saveProjectChanges(proj);
            }
        });
    }

    deleteMember(memberId: number, event: Event): void {
        event.stopPropagation();
        if (!this.canManageMembers()) return;
        const proj = this.selectedProject();
        if (!proj || !proj.members) return;
        proj.members = proj.members.filter((m) => m.id !== memberId);
        this.saveProjectChanges(proj);
    }

    openCreateLinkModal(): void {
        const proj = this.selectedProject();
        const dialogConfig = this._dialogConfigService.getDialogConfig({
            user: this._userService.getUser(),
            taskCode: proj ? `#${proj.code}-001` : '#WMS-001',
            projectName: proj?.name,
        });
        const dialogRef = this._matDialog.open(CreateLinkDialogComponent, dialogConfig);
        dialogRef.afterClosed().subscribe((result) => {
            if (result && result.title && proj) {
                if (!proj.links) proj.links = [];
                const newLink: TaskLink = {
                    id: `lnk-${Date.now()}`,
                    title: result.title,
                    url: result.url,
                    type: result.type || 'figma',
                    createdAt: 'ថ្ងៃនេះ',
                };
                proj.links.unshift(newLink);
                if (proj.tasks && proj.tasks.length > 0) {
                    const task = proj.tasks[0];
                    if (!task.links) task.links = [];
                    task.links.unshift(newLink);
                }
                this.saveProjectChanges(proj);
            }
        });
    }

    deleteProjectLink(linkId: string, event: Event): void {
        event.stopPropagation();
        const proj = this.selectedProject();
        if (!proj) return;
        if (proj.links) {
            proj.links = proj.links.filter((l) => l.id !== linkId);
        }
        if (proj.tasks) {
            for (const t of proj.tasks) {
                if (t.links) {
                    t.links = t.links.filter((l) => l.id !== linkId);
                }
            }
        }
        this.saveProjectChanges(proj);
    }

    openCreateTaskModal(): void {
        const proj = this.selectedProject();
        const dialogConfig = this._dialogConfigService.getDialogConfig({
            user: this._userService.getUser(),
            projectId: proj?.id,
            projectCode: proj?.code,
            projectName: proj?.name,
            projects: this.plans().map((p) => ({
                id: String(p.id),
                name: p.name,
                code: p.code,
                logo: p.logo || p.image,
            })),
            members: proj?.members || [],
            existingTasks: proj?.tasks || [],
            onTaskCreated: () => {
                if (proj) {
                    this.selectProject(proj);
                }
            },
        });
        const dialogRef = this._matDialog.open(CreateTaskDialogComponent, dialogConfig);
        dialogRef.afterClosed().subscribe((result) => {
            if (result && result.title && proj) {
                if (!proj.tasks) proj.tasks = [];
                const codeFormatted = result.code ? (result.code.startsWith('#') ? result.code : `#${result.code}`) : `#${proj.code || 'BMS'}-${String(proj.tasks.length).padStart(4, '0')}`;
                
                const selectedMembers: TaskMember[] = result.assignees && result.assignees.length > 0
                    ? result.assignees.map((a: any, idx: number) => ({
                        id: Number(a.id) || idx + 1,
                        name: a.name,
                        role: a.role || 'Assignee',
                        initial: (a.name || 'M').charAt(0).toUpperCase(),
                        bgClass: 'bg-indigo-600',
                        avatar: a.avatar || null,
                    }))
                    : (result.assignee?.name ? [{
                        id: Number(result.assignee.id) || 1,
                        name: result.assignee.name,
                        role: result.assignee.role || 'Assignee',
                        initial: (result.assignee.name || 'M').charAt(0).toUpperCase(),
                        bgClass: 'bg-indigo-600',
                        avatar: result.assignee.avatar || null,
                    }] : []);

                const primaryAssignee: TaskMember | null = selectedMembers.length > 0 ? selectedMembers[0] : null;

                const reporterName = typeof result.reporter === 'string'
                    ? result.reporter
                    : (result.reporter?.name || result.reporterName || '');

                const newTask: IndividualTaskItem = {
                    id: `tsk-${Date.now()}`,
                    code: codeFormatted,
                    title: result.title,
                    description: result.description || result.title,
                    status: result.status || 'new',
                    priority: result.priority || 'medium',
                    due_date: result.due_date || '15/09/2026',
                    due_days_left: 7,
                    comments_count: 0,
                    attachments_count: result.attachments_count || (result.attachments?.length || 0),
                    reporter: {
                        id: 1,
                        name: reporterName,
                        role: result.reporter?.role || 'Super Admin',
                        initial: reporterName.charAt(0).toUpperCase(),
                        bgClass: 'bg-blue-600',
                    },
                    assignee: primaryAssignee,
                    subtasks: [
                        { id: 'st-1', title: 'រៀបចំលក្ខខណ្ឌតម្រូវការដំបូង', completed: false },
                    ],
                    members: selectedMembers,
                    links: [],
                    documents: [],
                };
                proj.tasks.unshift(newTask);
                this.saveProjectChanges(proj);
            }
        });
    }

    triggerUploadDocument(task: IndividualTaskItem): void {
        const sampleDocs: TaskDocument[] = [
            { id: `doc-${Date.now()}`, name: 'System_Functional_Requirements_v1.pdf', size: '1.9 MB', type: 'pdf', upload_date: 'ថ្ងៃនេះ' },
            { id: `doc-${Date.now() + 1}`, name: 'API_Contract_Review.xlsx', size: '420 KB', type: 'sheet', upload_date: 'ថ្ងៃនេះ' },
        ];
        const randomDoc = sampleDocs[Math.floor(Math.random() * sampleDocs.length)];
        task.documents.push(randomDoc);
        task.attachments_count = task.documents.length;
    }

    removeDocument(task: IndividualTaskItem, docId: string): void {
        task.documents = task.documents.filter((d) => d.id !== docId);
        task.attachments_count = task.documents.length;
    }

    navigateHome(): void {
        this._router.navigate(['/member/home']);
    }

    navigateToPlan(): void {
        this._router.navigate(['/member/activity']);
    }

    /**
     * Percentage of finished tasks, derived from the counts shown beside it.
     *
     * The API also carries a stored `progress` field, but it is seeded independently
     * of `completed_tasks`/`total_tasks` and drifts from them — a card was reading
     * "3 / 6 (55%)". Deriving it here keeps the number, the bar and the fraction
     * telling the same story whatever the stored field says.
     */
    projectProgress(plan?: { completed_tasks?: number; total_tasks?: number } | null): number {
        const total = plan?.total_tasks ?? 0;
        const completed = plan?.completed_tasks ?? 0;
        if (total <= 0) return 0;
        return Math.round((Math.min(completed, total) / total) * 100);
    }

    /** Accent bar along the top of a project card — colour-coded so the bar carries
     *  the project's status instead of being the same gradient on every card. */
    getStatusBarClass(status: string): string {
        switch (status) {
            case 'active':
                return 'bg-gradient-to-r from-emerald-400 to-emerald-600';
            case 'completed':
                return 'bg-gradient-to-r from-blue-400 to-blue-600';
            case 'on_hold':
                return 'bg-gradient-to-r from-amber-400 to-amber-600';
            case 'planning':
                return 'bg-gradient-to-r from-purple-400 to-purple-600';
            default:
                return 'bg-gradient-to-r from-slate-300 to-slate-400';
        }
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'active':
                return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40';
            case 'completed':
                return 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800/40';
            case 'on_hold':
                return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800/40';
            case 'planning':
                return 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800/40';
            default:
                return 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
        }
    }

    getStatusLabel(status: string): string {
        switch (status) {
            case 'active':
                return 'កំពុងដំណើរការ';
            case 'completed':
                return 'បានបញ្ចប់';
            case 'on_hold':
                return 'ផ្អាក';
            case 'planning':
                return 'រៀបចំផែនការ';
            default:
                return status;
        }
    }

    getStatusIcon(status: string): string {
        switch (status) {
            case 'active':
                return 'mdi:clock-outline';
            case 'completed':
                return 'mdi:check-circle-outline';
            case 'on_hold':
                return 'mdi:pause-circle-outline';
            case 'planning':
                return 'mdi:calendar-clock-outline';
            default:
                return 'mdi:circle-outline';
        }
    }

    // Exact Status Pill Classes matching 2-task
    getTaskStatusClass(status: string): string {
        switch (status?.toLowerCase()) {
            case 'new':
            case 'pending':
                return 'bg-blue-50/90 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200/80 dark:border-blue-800/40';
            case 'confirmed':
                return 'bg-indigo-50/90 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200/80 dark:border-indigo-800/40';
            case 'unconfirmed':
            case 'todo':
                return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
            case 'in_progress':
                return 'bg-amber-50/90 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/80 dark:border-amber-800/40';
            case 'in_review':
            case 'review':
                return 'bg-sky-50/90 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border-sky-200/80 dark:border-sky-800/40';
            case 'reopened':
                return 'bg-rose-50/90 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200/80 dark:border-rose-800/40';
            case 'done':
            case 'completed':
                return 'bg-emerald-50/90 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800/40';
            default:
                return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
        }
    }

    // Exact Status MDI Icons matching 2-task
    getTaskStatusIcon(status: string): string {
        switch (status?.toLowerCase()) {
            case 'new':
            case 'pending':
                return 'mdi:clipboard-text-outline';
            case 'confirmed':
                return 'mdi:clipboard-check-outline';
            case 'unconfirmed':
            case 'todo':
                return 'mdi:clipboard-minus-outline';
            case 'in_progress':
                return 'mdi:progress-clock';
            case 'in_review':
            case 'review':
                return 'mdi:magnify';
            case 'reopened':
                return 'mdi:restore';
            case 'done':
            case 'completed':
                return 'mdi:check-circle';
            default:
                return 'mdi:clipboard-outline';
        }
    }

    // Exact Status Pill Clean Khmer Labels matching 2-task
    getTaskStatusLabel(status: string): string {
        switch (status?.toLowerCase()) {
            case 'new':
            case 'pending':
                return 'ថ្មី';
            case 'confirmed':
                return 'បញ្ជាក់';
            case 'unconfirmed':
            case 'todo':
                return 'មិនបញ្ជាក់';
            case 'in_progress':
                return 'កំពុងធ្វើ';
            case 'in_review':
            case 'review':
                return 'ស្នើពិនិត្យ';
            case 'reopened':
                return 'បើកឡើងវិញ';
            case 'done':
            case 'completed':
                return 'បញ្ចប់';
            default:
                return status || 'មិនបញ្ជាក់';
        }
    }

    // Exact Priority Icon matching Screenshot 2
    getPriorityVisual(priority: string): { icon: string; color: string } {
        switch (priority) {
            case 'urgent':
                return { icon: 'mdi:alert-octagon', color: 'text-red-500' };
            case 'high':
                return { icon: 'mdi:arrow-up-bold', color: 'text-amber-500' };
            case 'low':
                return { icon: 'mdi:arrow-down-bold', color: 'text-slate-400' };
            case 'medium':
            default:
                return { icon: 'mdi:equal', color: 'text-blue-500' };
        }
    }

    getPriorityLabel(priority: string): string {
        switch (priority) {
            case 'urgent': return 'បន្ទាន់';
            case 'high': return 'ខ្ពស់';
            case 'low': return 'ទាប';
            case 'medium':
            default: return 'មធ្យម';
        }
    }

    getPriorityClass(priority: string): string {
        switch (priority) {
            case 'urgent': return 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 border-rose-200 dark:border-rose-900';
            case 'high': return 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 border-amber-200 dark:border-amber-900';
            case 'low': return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
            case 'medium':
            default: return 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 border-blue-200 dark:border-blue-900';
        }
    }

    getDocIcon(type: string): string {
        switch (type) {
            case 'pdf':
                return 'mdi:file-pdf-box';
            case 'sheet':
                return 'mdi:file-excel-box';
            case 'image':
                return 'mdi:file-image-box';
            case 'doc':
            default:
                return 'mdi:file-document-outline';
        }
    }

    getDocIconClass(type: string): string {
        switch (type) {
            case 'pdf':
                return 'text-red-500';
            case 'sheet':
                return 'text-emerald-600';
            case 'image':
                return 'text-purple-600';
            case 'doc':
            default:
                return 'text-blue-500';
        }
    }

    getLinkIcon(type: string): string {
        switch (type) {
            case 'figma':
                return 'mdi:palette';
            case 'github':
                return 'mdi:github';
            case 'doc':
                return 'mdi:file-document-edit-outline';
            default:
                return 'mdi:link-variant';
        }
    }

    getLinkTypeBadge(type: string): { label: string; bg: string; icon: string } {
        switch (type) {
            case 'figma':
                return {
                    label: 'Figma Spec',
                    bg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/40',
                    icon: 'mdi:palette',
                };
            case 'github':
                return {
                    label: 'GitHub PR / Repo',
                    bg: 'bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-200 border-slate-700',
                    icon: 'mdi:github',
                };
            case 'doc':
                return {
                    label: 'Documentation',
                    bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/40',
                    icon: 'mdi:file-document-outline',
                };
            default:
                return {
                    label: 'External Link',
                    bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40',
                    icon: 'mdi:link-variant',
                };
        }
    }

    copyLinkUrl(url: string, id: string): void {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(url);
        }
        this.copiedLinkId.set(id);
        setTimeout(() => {
            if (this.copiedLinkId() === id) {
                this.copiedLinkId.set(null);
            }
        }, 2000);
    }

    formatDate(dateStr?: string | null): string {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    }

    getTaskDateToDo(dueDateStr?: string | null, createdDateStr?: string | null): string {
        if (dueDateStr) {
            return this.formatDate(dueDateStr);
        }
        if (createdDateStr) {
            const d = new Date(createdDateStr);
            d.setDate(d.getDate() + 7);
            return this.formatDate(d.toISOString());
        }
        return '15/09/2026';
    }

    getDaysRemainingInfo(dueDateStr?: string | null): { text: string; isOverdue: boolean; isToday: boolean; isUpcoming: boolean } {
        if (!dueDateStr) {
            return { text: 'សល់ 7 ថ្ងៃ', isOverdue: false, isToday: false, isUpcoming: true };
        }
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const dueDate = new Date(dueDateStr);
        if (isNaN(dueDate.getTime())) {
            return { text: 'កំណត់រួចរាល់', isOverdue: false, isToday: false, isUpcoming: true };
        }
        dueDate.setHours(0, 0, 0, 0);

        const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
            return { text: 'ហួសកាលកំណត់', isOverdue: true, isToday: false, isUpcoming: false };
        } else if (diffDays === 0) {
            return { text: 'ថ្ងៃនេះ (Today)', isOverdue: false, isToday: true, isUpcoming: false };
        } else {
            return { text: `សល់ ${diffDays} ថ្ងៃ`, isOverdue: false, isToday: false, isUpcoming: true };
        }
    }

    updateTaskStatus(task: IndividualTaskItem, status: string): void {
        task.status = status;
        if (status === 'done') {
            task.progress = 100;
        }
        this.initGeneralCharts();
        this.saveProjectChanges();
    }

    getTaskCountByStatus(status: 'completed' | 'in_progress' | 'review' | 'new'): number {
        const proj = this.selectedProject();
        if (!proj || !proj.tasks || proj.tasks.length === 0) {
            if (status === 'completed') return 4;
            if (status === 'in_progress') return 2;
            if (status === 'review') return 1;
            if (status === 'new') return 1;
            return 0;
        }
        if (status === 'completed') {
            return proj.tasks.filter((t) => t.status === 'done' || t.status === 'confirmed').length;
        }
        if (status === 'in_progress') {
            return proj.tasks.filter((t) => t.status === 'in_progress').length;
        }
        if (status === 'review') {
            return proj.tasks.filter((t) => t.status === 'review').length;
        }
        if (status === 'new') {
            return proj.tasks.filter((t) => t.status === 'new' || t.status === 'unconfirmed' || t.status === 'reopened').length;
        }
        return 0;
    }

    initGeneralCharts(): void {
        this._generalCharts.forEach((c) => c.dispose());
        this._generalCharts = [];

        const proj = this.selectedProject();
        if (!proj) return;

        const completedCount = this.getTaskCountByStatus('completed');
        const inProgressCount = this.getTaskCountByStatus('in_progress');
        const reviewCount = this.getTaskCountByStatus('review');
        const newCount = this.getTaskCountByStatus('new');

        // 1. Task Distribution Donut Chart
        if (this.taskDistributionChartRef?.nativeElement) {
            const chart = echarts.init(this.taskDistributionChartRef.nativeElement);
            this._generalCharts.push(chart);

            const option: echarts.EChartsOption = {
                tooltip: {
                    trigger: 'item',
                    formatter: '{b}: {c} កិច្ចការ ({d}%)',
                    textStyle: {
                        fontFamily: 'Kantumruy Pro',
                        fontSize: 13,
                    },
                },
                legend: {
                    bottom: '0%',
                    left: 'center',
                    icon: 'circle',
                    itemWidth: 10,
                    itemHeight: 10,
                    textStyle: {
                        fontFamily: 'Kantumruy Pro',
                        fontSize: 13,
                        color: '#64748b',
                    },
                },
                series: [
                    {
                        name: 'ស្ថានភាពកិច្ចការ',
                        type: 'pie',
                        radius: ['52%', '78%'],
                        center: ['50%', '42%'],
                        avoidLabelOverlap: false,
                        itemStyle: {
                            borderRadius: 6,
                            borderColor: '#ffffff',
                            borderWidth: 2,
                        },
                        label: {
                            show: false,
                            position: 'center',
                        },
                        emphasis: {
                            label: {
                                show: true,
                                fontSize: 14,
                                fontWeight: 500,
                                fontFamily: 'Kantumruy Pro',
                                formatter: '{b}\n{c} ({d}%)',
                            },
                            scaleSize: 6,
                        },
                        labelLine: {
                            show: false,
                        },
                        data: [
                            { value: completedCount, name: 'បានបញ្ចប់', itemStyle: { color: '#10b981' } },
                            { value: inProgressCount, name: 'កំពុងធ្វើ', itemStyle: { color: '#3b82f6' } },
                            { value: reviewCount, name: 'រង់ចាំពិនិត្យ', itemStyle: { color: '#f59e0b' } },
                            { value: newCount, name: 'ថ្មី', itemStyle: { color: '#8b5cf6' } },
                        ],
                    },
                ],
            };
            chart.setOption(option);
        }

        // 2. Weekly Velocity & Progress Trend Area Chart
        if (this.taskTrendChartRef?.nativeElement) {
            const chart = echarts.init(this.taskTrendChartRef.nativeElement);
            this._generalCharts.push(chart);

            const option: echarts.EChartsOption = {
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'cross',
                        label: {
                            backgroundColor: '#6a7985',
                            fontFamily: 'Kantumruy Pro',
                        },
                    },
                    textStyle: {
                        fontFamily: 'Kantumruy Pro',
                        fontSize: 13,
                    },
                },
                legend: {
                    data: ['បានបញ្ចប់', 'គ្រោងទុក'],
                    top: '0%',
                    right: '4%',
                    icon: 'roundRect',
                    textStyle: {
                        fontFamily: 'Kantumruy Pro',
                        fontSize: 13,
                        color: '#64748b',
                    },
                },
                grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '3%',
                    top: '15%',
                    containLabel: true,
                },
                xAxis: [
                    {
                        type: 'category',
                        boundaryGap: false,
                        data: ['W14', 'W15', 'W16', 'W17', 'W18', 'W19', 'W20', 'W21', 'W22'],
                        axisLine: { lineStyle: { color: '#cbd5e1' } },
                        axisLabel: {
                            color: '#64748b',
                            fontFamily: 'Kantumruy Pro',
                            fontSize: 12,
                        },
                    },
                ],
                yAxis: [
                    {
                        type: 'value',
                        splitLine: { lineStyle: { color: '#f1f5f9' } },
                        axisLabel: {
                            color: '#64748b',
                            fontFamily: 'Kantumruy Pro',
                            fontSize: 12,
                        },
                    },
                ],
                series: [
                    {
                        name: 'បានបញ្ចប់',
                        type: 'line',
                        smooth: true,
                        lineStyle: { width: 3, color: '#10b981' },
                        showSymbol: false,
                        areaStyle: {
                            opacity: 0.25,
                            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                { offset: 0, color: '#10b981' },
                                { offset: 1, color: 'rgba(16, 185, 129, 0)' },
                            ]),
                        },
                        emphasis: { focus: 'series' },
                        data: [1, 2, 2, 4, 5, 5, 6, 7, 8],
                    },
                    {
                        name: 'គ្រោងទុក',
                        type: 'line',
                        smooth: true,
                        lineStyle: { width: 3, color: '#3b82f6', type: 'dashed' },
                        showSymbol: false,
                        areaStyle: {
                            opacity: 0.15,
                            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                { offset: 0, color: '#3b82f6' },
                                { offset: 1, color: 'rgba(59, 130, 246, 0)' },
                            ]),
                        },
                        emphasis: { focus: 'series' },
                        data: [1, 2, 3, 4, 5, 6, 7, 8, 9],
                    },
                ],
            };
            chart.setOption(option);
        }

        if (!this._resizeListener) {
            this._resizeListener = () => {
                this._generalCharts.forEach((c) => c.resize());
            };
            window.addEventListener('resize', this._resizeListener);
        }
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
        this._generalCharts.forEach((c) => c.dispose());
        if (this._resizeListener) {
            window.removeEventListener('resize', this._resizeListener);
        }
    }
}
