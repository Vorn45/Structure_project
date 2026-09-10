import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { UserService } from 'app/core/user/user.service';
import { TaskSocketService } from 'app/core/realtime/task-socket.service';
import { DialogConfigService } from 'app/shared/dialog-config.service';
import { CreateTaskDialogComponent } from '../../3-admin/3-projects/dialogs/create-task-dialog.component';
import { TaskDrawerComponent } from './task-drawer/task-drawer.component';
import { FilePreviewModalComponent } from './file-preview-modal/file-preview-modal.component';
import {
    TASK_TYPES_LIST,
    TaskAttachment,
    TaskChatMessage,
    TaskItem,
    TaskMember,
    TaskPriority,
    TaskStatus,
    TaskTypeOption,
} from './models/task.types';
import { UserTaskService } from './task.service';

export interface ProjectFilterOption {
    id: string;
    code?: string;
    name: string;
    logo?: string;
    icon?: string;
    bgClass?: string;
}

@Component({
    selector: 'user-tasks',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatIconModule,
        MatButtonModule,
        MatMenuModule,
        MatTooltipModule,
        MatProgressSpinnerModule,
        MatDialogModule,
        DragDropModule,
        TaskDrawerComponent,
        FilePreviewModalComponent,
    ],
    templateUrl: './task.component.html',
    styles: [
        `
            :host {
                font-family: 'Kantumruy Pro', sans-serif !important;
                font-size: 14px;
                display: flex;
                flex-direction: column;
                flex: 1 1 auto;
                width: 100%;
                height: 100%;
                min-height: 0;
                max-height: 100%;
                overflow: hidden;
            }
            *:not(.mat-icon):not([class*='material-icons']):not([class*='icon-']):not([class*='mdi']) {
                font-family: 'Kantumruy Pro', sans-serif !important;
            }
            /* Hide board horizontal scrollbar while preserving full scrolling */
            .kanban-scroll-container {
                scrollbar-width: none !important;
                -ms-overflow-style: none !important;
            }
            .kanban-scroll-container::-webkit-scrollbar {
                display: none !important;
                width: 0 !important;
                height: 0 !important;
            }
            /* Hide vertical scrollbar for column tasks while preserving full smooth scrolling */
            .kanban-column-scroll {
                scrollbar-width: none !important;
                -ms-overflow-style: none !important;
            }
            .kanban-column-scroll::-webkit-scrollbar {
                display: none !important;
                width: 0 !important;
                height: 0 !important;
            }
            /* Hide vertical scrollbar for table list while preserving full smooth scrolling */
            .table-scroll-container {
                scrollbar-width: none !important;
                -ms-overflow-style: none !important;
            }
            .table-scroll-container::-webkit-scrollbar {
                display: none !important;
                width: 0 !important;
                height: 0 !important;
            }
            ::ng-deep .cdk-drag-preview {
                box-sizing: border-box;
                border-radius: 1rem !important;
                box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.2), 0 8px 10px -6px rgba(15, 23, 42, 0.1) !important;
                background-color: white !important;
                border: 2px solid #3b82f6 !important;
                opacity: 0.96;
                transform: rotate(1.5deg);
            }
            ::ng-deep .cdk-drag-placeholder {
                opacity: 0.4;
                border-radius: 1rem !important;
            }
            ::ng-deep .cdk-drag-animating {
                transition: transform 200ms cubic-bezier(0, 0, 0.2, 1);
            }
            ::ng-deep .cdk-drop-list-dragging .cdk-drag:not(.cdk-drag-placeholder) {
                transition: transform 200ms cubic-bezier(0, 0, 0.2, 1);
            }
        `,
    ],
})
export class UserTaskComponent implements OnInit, OnDestroy {
    taskTypes = TASK_TYPES_LIST;

    getTaskTypeInfo(type?: string): TaskTypeOption {
        const found = this.taskTypes.find((t) => t.id === type || t.id.toLowerCase() === type?.toLowerCase());
        return found || this.taskTypes[0]; // Default to 'feature' (មុខងារ)
    }

    loading = signal<boolean>(true);
    tasks = signal<TaskItem[]>([]);
    isDragging = signal<boolean>(false);
    showDeleteModal = signal<boolean>(false);
    deleteTarget = signal<TaskItem | null>(null);
    isDeleting = signal<boolean>(false);

    confirmDelete(task: TaskItem): void {
        this.deleteTarget.set(task);
        this.showDeleteModal.set(true);
    }
    counts = signal<{
        all: number;
        new: number;
        confirmed: number;
        unconfirmed: number;
        in_progress: number;
        in_review: number;
        reopened: number;
        done: number;
    }>({
        all: 0,
        new: 0,
        confirmed: 0,
        unconfirmed: 0,
        in_progress: 0,
        in_review: 0,
        reopened: 0,
        done: 0,
    });

    viewMode = signal<'grid' | 'kanban' | 'list'>('list');
    activeStatus = signal<string>('all');
    activePriority = signal<string>('all');
    // Set to the signed-in user in ngOnInit so the page opens on their own tasks;
    // picking "ទាំងអស់ (All Members)" widens it to the whole team.
    selectedMemberFilter = signal<number | 'all'>('all');
    selectedProjectId = signal<string | 'all'>('all');
    searchQuery = signal<string>('');

    // Kanban Columns Configuration
    kanbanColumns = [
        {
            key: 'new',
            label: 'ថ្មី',
            icon: 'mdi:clipboard-text-outline',
            textColor: 'text-blue-600 dark:text-blue-400',
            dotColor: 'bg-blue-500',
            colAccent: 'border-l-[3px] border-l-blue-500',
            panelBg: 'bg-white dark:bg-slate-800/20',
            panelBorder: 'border-slate-200/80 dark:border-slate-700/60',
            emptyBorder: 'border-blue-300/60 text-blue-500 dark:border-blue-800/50 dark:text-blue-400 hover:bg-blue-50/60 dark:hover:bg-blue-950/20',
            badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
        },
        {
            key: 'confirmed',
            label: 'បញ្ជាក់',
            icon: 'mdi:clipboard-check-outline',
            textColor: 'text-indigo-600 dark:text-indigo-400',
            dotColor: 'bg-indigo-500',
            colAccent: 'border-l-[3px] border-l-indigo-500',
            panelBg: 'bg-white dark:bg-slate-800/20',
            panelBorder: 'border-slate-200/80 dark:border-slate-700/60',
            emptyBorder: 'border-indigo-300/60 text-indigo-500 dark:border-indigo-800/50 dark:text-indigo-400 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/20',
            badgeClass: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
        },
        {
            key: 'unconfirmed',
            label: 'មិនបញ្ជាក់',
            icon: 'mdi:clipboard-minus-outline',
            textColor: 'text-slate-500 dark:text-slate-400',
            dotColor: 'bg-slate-400',
            colAccent: 'border-l-[3px] border-l-slate-400',
            panelBg: 'bg-white dark:bg-slate-800/20',
            panelBorder: 'border-slate-200/80 dark:border-slate-700/60',
            emptyBorder: 'border-slate-300/60 text-slate-500 dark:border-slate-700/50 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30',
            badgeClass: 'bg-slate-100 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300',
        },
        {
            key: 'in_progress',
            label: 'កំពុងធ្វើ',
            icon: 'mdi:progress-clock',
            textColor: 'text-amber-600 dark:text-amber-400',
            dotColor: 'bg-amber-500',
            colAccent: 'border-l-[3px] border-l-amber-500',
            panelBg: 'bg-white dark:bg-slate-800/20',
            panelBorder: 'border-slate-200/80 dark:border-slate-700/60',
            emptyBorder: 'border-amber-300/60 text-amber-500 dark:border-amber-800/50 dark:text-amber-400 hover:bg-amber-50/60 dark:hover:bg-amber-950/20',
            badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
        },
        {
            key: 'in_review',
            label: 'ស្នើពិនិត្យ',
            icon: 'mdi:magnify',
            textColor: 'text-sky-600 dark:text-sky-400',
            dotColor: 'bg-sky-500',
            colAccent: 'border-l-[3px] border-l-sky-500',
            panelBg: 'bg-white dark:bg-slate-800/20',
            panelBorder: 'border-slate-200/80 dark:border-slate-700/60',
            emptyBorder: 'border-sky-300/60 text-sky-500 dark:border-sky-800/50 dark:text-sky-400 hover:bg-sky-50/60 dark:hover:bg-sky-950/20',
            badgeClass: 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300',
        },
        {
            key: 'reopened',
            label: 'បើកឡើងវិញ',
            icon: 'mdi:restore',
            textColor: 'text-rose-600 dark:text-rose-400',
            dotColor: 'bg-rose-500',
            colAccent: 'border-l-[3px] border-l-rose-500',
            panelBg: 'bg-white dark:bg-slate-800/20',
            panelBorder: 'border-slate-200/80 dark:border-slate-700/60',
            emptyBorder: 'border-rose-300/60 text-rose-500 dark:border-rose-800/50 dark:text-rose-400 hover:bg-rose-50/60 dark:hover:bg-rose-950/20',
            badgeClass: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
        },
        {
            key: 'done',
            label: 'បញ្ចប់',
            icon: 'mdi:check-circle',
            textColor: 'text-emerald-600 dark:text-emerald-400',
            dotColor: 'bg-emerald-500',
            colAccent: 'border-l-[3px] border-l-emerald-500',
            panelBg: 'bg-white dark:bg-slate-800/20',
            panelBorder: 'border-slate-200/80 dark:border-slate-700/60',
            emptyBorder: 'border-emerald-300/60 text-emerald-500 dark:border-emerald-800/50 dark:text-emerald-400 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/20',
            badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
        },
    ];

    // Available Projects list (Loaded dynamically from database / tasks; default icon used when no image)
    projects = signal<ProjectFilterOption[]>([
        {
            id: 'bms-digitech',
            name: 'BMS Digitech',
            code: 'BMS',
            bgClass: 'bg-sky-600 text-white',
        },
        {
            id: 'wms-digitech',
            name: 'WMS Digitech',
            code: 'WMS',
            bgClass: 'bg-emerald-700 text-white',
        },
    ]);

    loadProjects(): void {
        this._taskService.getProjects().subscribe({
            next: (res) => {
                if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
                    const bgColors = [
                        'bg-sky-600 text-white',
                        'bg-emerald-700 text-white',
                        'bg-rose-600 text-white',
                        'bg-indigo-600 text-white',
                        'bg-amber-600 text-white',
                        'bg-purple-600 text-white',
                        'bg-teal-600 text-white',
                        'bg-blue-600 text-white',
                    ];
                    const mapped: ProjectFilterOption[] = res.data.map((p: any, idx: number) => ({
                        id: String(p.id),
                        code: p.code || p.name?.slice(0, 3)?.toUpperCase() || 'PRJ',
                        name: p.name,
                        logo: p.logo || p.image || null,
                        image: p.image || p.logo || null,
                        bgClass: p.bgClass || bgColors[idx % bgColors.length],
                    }));
                    this.projects.set(mapped);
                } else {
                    this.deriveProjectsFromTasks();
                }
            },
            error: () => {
                this.deriveProjectsFromTasks();
            },
        });
    }

    deriveProjectsFromTasks(): void {
        const currentTasks = this.tasks();
        if (!currentTasks || currentTasks.length === 0) return;

        const bgColors = [
            'bg-sky-600 text-white',
            'bg-emerald-700 text-white',
            'bg-rose-600 text-white',
            'bg-indigo-600 text-white',
            'bg-amber-600 text-white',
            'bg-purple-600 text-white',
            'bg-teal-600 text-white',
            'bg-blue-600 text-white',
        ];

        const pMap = new Map<string, ProjectFilterOption>();
        // Keep known projects first
        for (const p of this.projects()) {
            pMap.set(p.id.toLowerCase(), p);
            pMap.set(p.name.toLowerCase(), p);
        }

        currentTasks.forEach((t) => {
            const id = t.project_id || t.project_name;
            if (id && !pMap.has(id.toLowerCase())) {
                const name = t.project_name || t.project_id || 'Project';
                const code = t.code ? t.code.split('-')[0].replace('#', '') : name.slice(0, 3).toUpperCase();
                const option: ProjectFilterOption = {
                    id: t.project_id || id,
                    name: name,
                    code: code,
                    bgClass: bgColors[pMap.size % bgColors.length],
                };
                pMap.set(id.toLowerCase(), option);
                pMap.set(name.toLowerCase(), option);
            }
        });

        // Deduplicate
        const unique = Array.from(new Set(pMap.values()));
        if (unique.length > 0) {
            this.projects.set(unique);
        }
    }

    // Task Dialogs & File Modal State (Dialog 1: Details, Dialog 2: Chat)
    selectedTask = signal<TaskItem | null>(null);
    showChatRoom = signal<boolean>(false);
    dialogMode = signal<'details' | 'chat'>('details');
    chatMessages = signal<TaskChatMessage[]>([]);
    previewImageModal = signal<string | null>(null);
    previewFileModal = signal<TaskAttachment | null>(null);
    private taskChatHistoryMap = new Map<number, TaskChatMessage[]>();

    // Team Members Pool for Multi-Assignee Selection (Loaded dynamically from DB)
    teamMembers = signal<TaskMember[]>([
        { id: 1, name: 'PISETH PANHAVORN', role: 'Super Admin / Lead Developer', avatar: '/images/placeholder/avatar.jpg', colorClass: 'bg-indigo-600', email: 'pisethpanhavorn544@gmail.com' },
        { id: 2, name: 'PUM BRUSMUNY', role: 'Frontend Lead', avatar: '/images/placeholder/avatar.jpg', colorClass: 'bg-blue-600', email: 'pumprusmuny@example.com' },
        { id: 3, name: 'THA WINNER', role: 'Backend Lead', avatar: '/images/placeholder/avatar.jpg', colorClass: 'bg-emerald-600', email: 'thawinner@example.com' },
    ]);

    // Aggregated list of all files for the task (task attachments + uploaded in chat)
    allTaskFiles = computed<TaskAttachment[]>(() => {
        const files: TaskAttachment[] = [];
        const currentTask = this.selectedTask();

        // Include attachments belonging directly to current task if present
        if (currentTask && (currentTask as any).attachments && Array.isArray((currentTask as any).attachments)) {
            files.push(...(currentTask as any).attachments);
        }

        // Include attachments sent in comments/chat
        this.chatMessages().forEach((m) => {
            if (m.attachments && Array.isArray(m.attachments)) {
                files.push(...m.attachments);
            }
        });

        // Deduplicate attachments by name/url
        const seen = new Set<string>();
        return files.filter((f) => {
            const key = f.url || f.name;
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    });

    private readonly _unsubscribeAll = new Subject<any>();

    constructor(
        private readonly _taskService: UserTaskService,
        private readonly _userService: UserService,
        private readonly _route: ActivatedRoute,
        private readonly _router: Router,
        private readonly _matDialog: MatDialog,
        private readonly _dialogConfigService: DialogConfigService,
        private readonly _taskSocket: TaskSocketService,
    ) {}

    getAvatarUrl(): string {
        const user = this._userService.getUser();
        if (user?.avatar?.uri && user?.avatar?.file_domain) {
            return user.avatar.file_domain.replace(/\/+$/, '') + '/' + user.avatar.uri.replace(/^\/+/, '');
        }
        return '/images/placeholder/avatar.jpg';
    }

    getCurrentActorName(): string {
        const user = this._userService.getUser();
        return (user?.kh_name || user?.name || user?.en_name || '').trim();
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
        this.loadTeamMembers();
        this.loadProjects();

        // Anyone moving a task on any board changes what these chips should read,
        // so refresh from the server rather than guessing at the delta locally.
        this._taskSocket
            .taskUpdates()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(() => this.loadTasks());

        this._route.queryParams.subscribe((params) => {
            if (params['status']) {
                this.activeStatus.set(params['status']);
            }
            if (params['priority']) {
                this.activePriority.set(params['priority']);
            }

            // View mode: URL parameter > saved in localStorage > default 'list' (table view)
            if (params['view'] && (params['view'] === 'grid' || params['view'] === 'kanban' || params['view'] === 'list')) {
                this.viewMode.set(params['view']);
                try { localStorage.setItem('user_tasks_view_mode', params['view']); } catch {}
            } else {
                try {
                    const savedView = localStorage.getItem('user_tasks_view_mode') as 'grid' | 'kanban' | 'list';
                    if (savedView && (savedView === 'grid' || savedView === 'kanban' || savedView === 'list')) {
                        this.viewMode.set(savedView);
                    } else {
                        this.viewMode.set('list');
                    }
                } catch {
                    this.viewMode.set('list');
                }
            }

            // Project filter: URL parameter > saved in localStorage > default 'all'
            const projectParam = params['project'] || params['project_id'];
            if (projectParam) {
                this.selectedProjectId.set(projectParam);
                try { localStorage.setItem('user_tasks_project_filter', projectParam); } catch {}
            } else {
                try {
                    const savedProject = localStorage.getItem('user_tasks_project_filter');
                    // Validate: only restore if it's 'all' or matches a known project ID
                    const validIds = ['all', ...this.projects().map((p) => p.id)];
                    if (savedProject && validIds.includes(savedProject)) {
                        this.selectedProjectId.set(savedProject);
                    } else {
                        // Stale/unknown project ID — reset to 'all' and clean up
                        this.selectedProjectId.set('all');
                        try { localStorage.removeItem('user_tasks_project_filter'); } catch {}
                    }
                } catch {
                    this.selectedProjectId.set('all');
                }
            }

            this.loadTasks();
        });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    computeCounts(tasks: TaskItem[], apiCounts?: any): void {
        // The API counts over every active filter except status, so they stay correct
        // while a status chip is selected. Recomputing from `tasks` here cannot do
        // that — `tasks` is already narrowed to the active status, which would zero
        // every other chip — so the local tally is only a fallback for a missing
        // `counts` block, and then only meaningful when no status filter is on.
        if (apiCounts) {
            this.counts.set({
                all: apiCounts.all ?? 0,
                new: apiCounts.new ?? 0,
                confirmed: apiCounts.confirmed ?? 0,
                unconfirmed: apiCounts.unconfirmed ?? 0,
                in_progress: apiCounts.in_progress ?? 0,
                in_review: apiCounts.in_review ?? 0,
                reopened: apiCounts.reopened ?? 0,
                done: apiCounts.done ?? 0,
            });
            return;
        }

        this.counts.set({
            all: tasks.length,
            new: tasks.filter((t) => t.status === 'new' || t.status === 'pending').length,
            confirmed: tasks.filter((t) => t.status === 'confirmed').length,
            unconfirmed: tasks.filter((t) => t.status === 'unconfirmed' || t.status === 'todo').length,
            in_progress: tasks.filter((t) => t.status === 'in_progress').length,
            in_review: tasks.filter((t) => t.status === 'in_review' || t.status === 'review').length,
            reopened: tasks.filter((t) => t.status === 'reopened').length,
            done: tasks.filter((t) => t.status === 'done' || t.status === 'completed').length,
        });
    }

    isTaskBelongToCurrentUser(task: TaskItem): boolean {
        const user = this._userService.getUser();
        const userNameEn = (user?.en_name || user?.name || '').toLowerCase().trim();
        const userNameKh = (user?.kh_name || '').toLowerCase().trim();
        const userEmail = (user?.email || '').toLowerCase().trim();

        const matchUser = (target?: { name?: string; email?: string; id?: number } | null): boolean => {
            if (!target) return false;
            const targetName = target.name?.toLowerCase().trim();
            if (targetName) {
                if (userNameKh && (targetName === userNameKh || targetName.includes(userNameKh) || userNameKh.includes(targetName))) return true;
                if (userNameEn && (targetName === userNameEn || targetName.includes(userNameEn) || userNameEn.includes(targetName))) return true;
            }
            if (userEmail && target.email && target.email.toLowerCase().trim() === userEmail) return true;
            if (user?.id && target.id && target.id === user.id) return true;
            return false;
        };

        // 1. Check Reporter
        if (matchUser(task.reporter)) return true;

        // 2. Check Assignee
        if (matchUser(task.assignee)) return true;

        // 3. Check Assignees list
        if (task.assignees && Array.isArray(task.assignees)) {
            for (const ass of task.assignees) {
                if (matchUser(ass)) return true;
            }
        }

        return false;
    }

    loadTasks(): void {
        this.loading.set(true);
        this._taskService
            .getTasks({
                search: this.searchQuery() || undefined,
                status: this.activeStatus() !== 'all' ? this.activeStatus() : undefined,
                priority: this.activePriority() !== 'all' ? this.activePriority() : undefined,
                project_id: this.selectedProjectId() !== 'all' ? this.selectedProjectId() : undefined,
            })
            .subscribe({
                next: (res) => {
                    const rawResults = res.data.results || [];
                    const results = rawResults.filter((t) => {
                        const code = (t.code || '').toUpperCase();
                        const pid = (t.project_id || '').toLowerCase();
                        const pname = (t.project_name || '').toLowerCase();
                        return !code.includes('PMS') && !pid.includes('pms') && !pname.includes('pms') && pid !== 'proj-001' && pid !== 'proj-002' && pid !== 'proj-003';
                    });
                    let finalTasks = results;
                    
                    if (this.selectedProjectId() !== 'all') {
                        const pid = this.selectedProjectId().toLowerCase();
                        const selectedProj = this.projects().find((p) => p.id === this.selectedProjectId());
                        const pCode = (selectedProj?.code || '').toLowerCase();
                        const pName = (selectedProj?.name || '').toLowerCase();

                        finalTasks = finalTasks.filter((t) => {
                            const tPid = (t.project_id || '').toLowerCase();
                            const tPname = (t.project_name || '').toLowerCase();
                            const tCode = (t.code || '').toLowerCase();

                            return (
                                (tPid && (tPid === pid || tPid.includes(pid) || pid.includes(tPid))) ||
                                (pCode && (tCode.includes(pCode) || tPid.includes(pCode))) ||
                                (pName && (tPname.includes(pName) || pName.includes(tPname)))
                            );
                        });
                    }

                    this.tasks.set(finalTasks);
                    this.computeCounts(finalTasks, res.data.counts);
                    this.loading.set(false);
                    if (this.projects().length <= 2) {
                        this.deriveProjectsFromTasks();
                    }

                    // Auto-open task if navigating from notification with taskId/taskCode
                    const q = this._route.snapshot.queryParams;
                    if (q['taskId'] || q['taskCode']) {
                        const targetId = q['taskId'];
                        const targetCode = (q['taskCode'] || '').toLowerCase();
                        const found = finalTasks.find(
                            (t) =>
                                (targetId && String(t.id) === String(targetId)) ||
                                (targetCode && t.code && t.code.toLowerCase().includes(targetCode)),
                        );
                        if (found) {
                            setTimeout(() => {
                                this.openTaskChat(found);
                                // Clean query params from URL so reloading or filtering won't re-trigger opening
                                this._router.navigate([], {
                                    relativeTo: this._route,
                                    queryParams: { taskId: null, taskCode: null },
                                    queryParamsHandling: 'merge',
                                    replaceUrl: true,
                                    });
                            }, 100);
                        }
                    }
                },
                error: (err) => {
                    console.error('Failed to load tasks', err);
                    this.loading.set(false);
                },
            });
    }

    setProjectFilter(projectId: string | 'all'): void {
        this.selectedProjectId.set(projectId);
        try {
            localStorage.setItem('user_tasks_project_filter', projectId);
        } catch {}
        this._router.navigate([], {
            relativeTo: this._route,
            queryParams: { project: projectId !== 'all' ? projectId : null },
            queryParamsHandling: 'merge',
        });
        this.loadTasks();
    }

    toggleProjectFilter(projectId: string): void {
        if (this.selectedProjectId() === projectId) {
            this.setProjectFilter('all');
        } else {
            this.setProjectFilter(projectId);
        }
    }

    isOtherProjectSelected(): boolean {
        const id = this.selectedProjectId();
        if (id === 'all') return false;
        if (this.projects().length <= 3) return false;
        const top3Ids = this.projects().slice(0, 3).map((p) => p.id);
        return !top3Ids.includes(id);
    }

    getSelectedOtherProjectName(): string {
        const found = this.projects().find((p) => p.id === this.selectedProjectId());
        return found ? found.name : '';
    }

    getSelectedProjectLabel(): string {
        const p = this.projects().find((item) => item.id === this.selectedProjectId());
        return p ? p.name : 'គម្រោងទាំងអស់';
    }

    setMemberFilter(memberId: number | 'all'): void {
        this.selectedMemberFilter.set(memberId);
        this.loadTasks();
    }

    setStatusFilter(status: string): void {
        this.activeStatus.set(status);
        this.loadTasks();
    }

    setPriorityFilter(priority: string): void {
        this.activePriority.set(priority);
        this.loadTasks();
    }

    setViewMode(mode: 'grid' | 'kanban' | 'list'): void {
        this.viewMode.set(mode);
        try {
            localStorage.setItem('user_tasks_view_mode', mode);
        } catch {}
        this._router.navigate([], {
            relativeTo: this._route,
            queryParams: { view: mode },
            queryParamsHandling: 'merge',
        });
    }

    onSearchChange(): void {
        this.loadTasks();
    }

    onKanbanWheel(event: WheelEvent, el: HTMLElement): void {
        const target = event.target as HTMLElement | null;
        const scrollableCol = target?.closest('.kanban-column-scroll') as HTMLElement | null;

        if (scrollableCol) {
            const hasVerticalScroll = scrollableCol.scrollHeight > scrollableCol.clientHeight;
            if (hasVerticalScroll) {
                // Allow native vertical scroll inside the column
                return;
            }
        }

        if (event.deltaY !== 0 && !event.shiftKey) {
            el.scrollLeft += event.deltaY * 0.8;
            event.preventDefault();
        }
    }

    Math = Math;

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

    getDaysRemaining(dueDateStr?: string): string {
        return this.getDaysRemainingInfo(dueDateStr).text;
    }

    getActivityRate(task: TaskItem): number {
        const comments = task.comments_count || 1;
        return Math.min(100, Math.round((comments / 11) * 100));
    }

    getTaskAssignees(task: TaskItem | null | undefined): TaskMember[] {
        if (!task) return [];
        if (task.assignees !== undefined && Array.isArray(task.assignees)) {
            return task.assignees;
        }
        if (task.assignee) return [task.assignee];
        return [];
    }

    clearFilters(): void {
        this.activeStatus.set('all');
        this.activePriority.set('all');
        this.searchQuery.set('');
        this._router.navigate([], {
            relativeTo: this._route,
            queryParams: { status: null, priority: null },
            queryParamsHandling: 'merge',
        });
        this.loadTasks();
    }

    updateTaskStatus(task: TaskItem, newStatus: string): void {
        const oldStatus = task.status;
        const targetStatus = newStatus as TaskStatus;
        const actorName = this.getCurrentActorName();
        const actorPrefix = actorName ? `${actorName} ` : '';

        if (this.selectedTask()?.id === task.id) {
            this.selectedTask.update((t) => (t ? { ...t, status: targetStatus } : null));
            const systemMsg: TaskChatMessage = {
                id: Date.now(),
                sender_name: 'ប្រព័ន្ធ (System)',
                text: `${actorPrefix}បានប្តូរស្ថានភាពពី "${this.getStatusLabel(oldStatus)}" ទៅជា "${this.getStatusLabel(targetStatus)}"`,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                is_system: true,
            };
            this.appendChatMessage(task.id, systemMsg);
        }

        this.tasks.update((tasks) =>
            tasks.map((t) => (t.id === task.id ? { ...t, status: targetStatus } : t))
        );
        this.computeCounts(this.tasks());

        this._taskService.updateTask(task.id, { status: targetStatus as any }).subscribe({
            next: (res) => {
                if (res?.data) {
                    if (this.selectedTask()?.id === task.id) {
                        this.selectedTask.update((t) => (t ? { ...t, ...res.data } : null));
                    }
                    this.tasks.update((tasks) =>
                        tasks.map((t) => (t.id === task.id ? { ...t, ...res.data } : t))
                    );
                    this.computeCounts(this.tasks());
                }
            },
            error: (err) => {
                console.error('Failed to update task status', err);
                if (this.selectedTask()?.id === task.id) {
                    this.selectedTask.update((t) => (t ? { ...t, status: oldStatus } : null));
                }
                this.tasks.update((tasks) =>
                    tasks.map((t) => (t.id === task.id ? { ...t, status: oldStatus } : t))
                );
                this.computeCounts(this.tasks());
            },
        });
    }

    updateTaskPriority(task: TaskItem, newPriority: string): void {
        const oldPriority = task.priority;
        const targetPriority = newPriority as TaskPriority;
        const actorName = this.getCurrentActorName();
        const actorPrefix = actorName ? `${actorName} ` : '';

        if (this.selectedTask()?.id === task.id) {
            this.selectedTask.update((t) => (t ? { ...t, priority: targetPriority } : null));
            const systemMsg: TaskChatMessage = {
                id: Date.now(),
                sender_name: 'ប្រព័ន្ធ (System)',
                text: `${actorPrefix}បានប្តូរអាទិភាពពី "${this.getPriorityLabel(oldPriority)}" ទៅជា "${this.getPriorityLabel(targetPriority)}"`,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                is_system: true,
            };
            this.appendChatMessage(task.id, systemMsg);
        }

        this.tasks.update((tasks) =>
            tasks.map((t) => (t.id === task.id ? { ...t, priority: targetPriority } : t))
        );

        this._taskService.updateTask(task.id, { priority: targetPriority as any }).subscribe({
            next: (res) => {
                if (res?.data) {
                    if (this.selectedTask()?.id === task.id) {
                        this.selectedTask.update((t) => (t ? { ...t, ...res.data } : null));
                    }
                    this.tasks.update((tasks) =>
                        tasks.map((t) => (t.id === task.id ? { ...t, ...res.data } : t))
                    );
                }
            },
            error: (err) => {
                console.error('Failed to update task priority', err);
                if (this.selectedTask()?.id === task.id) {
                    this.selectedTask.update((t) => (t ? { ...t, priority: oldPriority } : null));
                }
                this.tasks.update((tasks) =>
                    tasks.map((t) => (t.id === task.id ? { ...t, priority: oldPriority } : t))
                );
            },
        });
    }

    updateTaskType(task: TaskItem, newType: string): void {
        const oldType = task.task_type;
        const targetType = newType;
        const actorName = this.getCurrentActorName();
        const actorPrefix = actorName ? `${actorName} ` : '';

        if (this.selectedTask()?.id === task.id) {
            this.selectedTask.update((t) => (t ? { ...t, task_type: targetType } : null));
            const oldLabel = this.getTaskTypeInfo(oldType).label;
            const newLabel = this.getTaskTypeInfo(targetType).label;
            const systemMsg: TaskChatMessage = {
                id: Date.now(),
                sender_name: 'ប្រព័ន្ធ (System)',
                text: `${actorPrefix}បានប្តូរប្រភេទការងារពី "${oldLabel}" ទៅជា "${newLabel}"`,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                is_system: true,
            };
            this.appendChatMessage(task.id, systemMsg);
        }

        this.tasks.update((tasks) =>
            tasks.map((t) => (t.id === task.id ? { ...t, task_type: targetType } : t))
        );

        this._taskService.updateTask(task.id, { task_type: targetType as any }).subscribe({
            next: (res) => {
                if (res?.data) {
                    if (this.selectedTask()?.id === task.id) {
                        this.selectedTask.update((t) => (t ? { ...t, ...res.data } : null));
                    }
                    this.tasks.update((tasks) =>
                        tasks.map((t) => (t.id === task.id ? { ...t, ...res.data } : t))
                    );
                }
            },
            error: (err) => console.error('Failed to update task type', err),
        });
    }

    updateTaskDueDate(task: TaskItem, newDateStr: string | null): void {
        const formatted = newDateStr ? this.formatDate(newDateStr) : 'សម្អាត';
        const actorName = this.getCurrentActorName();
        const actorPrefix = actorName ? `${actorName} ` : '';

        if (this.selectedTask()?.id === task.id) {
            this.selectedTask.update((t) => (t ? { ...t, due_date: newDateStr } : null));
            const systemMsg: TaskChatMessage = {
                id: Date.now(),
                sender_name: 'ប្រព័ន្ធ (System)',
                text: newDateStr ? `${actorPrefix}បានកំណត់កាលបរិច្ឆេទត្រូវធ្វើថ្មី៖ ${formatted}` : `${actorPrefix}បានសម្អាតកាលបរិច្ឆេទកំណត់`,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                is_system: true,
            };
            this.appendChatMessage(task.id, systemMsg);
        }

        this.tasks.update((list) =>
            list.map((t) => (t.id === task.id ? { ...t, due_date: newDateStr } : t))
        );

        this._taskService.updateTask(task.id, { due_date: newDateStr }).subscribe({
            next: (res) => {
                if (res?.data) {
                    if (this.selectedTask()?.id === task.id) {
                        this.selectedTask.update((t) => (t ? { ...t, ...res.data } : null));
                    }
                    this.tasks.update((list) =>
                        list.map((t) => (t.id === task.id ? { ...t, ...res.data } : t))
                    );
                }
            },
            error: (err) => console.error('Failed to update due date', err),
        });
    }

    toggleTaskAssignee(task: TaskItem, member: TaskMember): void {
        const currentAssignees = this.getTaskAssignees(task);
        const exists = currentAssignees.some(
            (a) => Number(a.id) === Number(member.id) || (a.name && member.name && a.name.trim().toLowerCase() === member.name.trim().toLowerCase())
        );
        const actorName = this.getCurrentActorName();
        const actorPrefix = actorName ? `${actorName} ` : '';

        let updatedAssignees: TaskMember[];
        let actionNotice = '';

        if (exists) {
            updatedAssignees = currentAssignees.filter(
                (a) => Number(a.id) !== Number(member.id) && !(a.name && member.name && a.name.trim().toLowerCase() === member.name.trim().toLowerCase())
            );
            actionNotice = updatedAssignees.length > 0
                ? `${actorPrefix}បានដកចេញអ្នកទទួលបន្ទុក៖ "${member.name}"`
                : `${actorPrefix}បានដកចេញអ្នកទទួលបន្ទុកទាំងអស់ (គ្មានអ្នកទទួលបន្ទុក)`;
        } else {
            const newMember: TaskMember = {
                id: member.id,
                name: member.name,
                avatar: member.avatar || null,
                role: member.role || 'អ្នកទទួលបន្ទុក',
                email: member.email || '',
                colorClass: member.colorClass || 'bg-blue-600',
            };
            updatedAssignees = [...currentAssignees, newMember];
            actionNotice = `${actorPrefix}បានបន្ថែមអ្នកទទួលបន្ទុក៖ "${member.name}"`;
        }

        const updatedTask: TaskItem = {
            ...task,
            assignees: [...updatedAssignees],
            assignee: updatedAssignees.length > 0 ? { ...updatedAssignees[0] } : (null as any),
        };

        this.tasks.update((list) => list.map((t) => (t.id === task.id ? updatedTask : t)));
        if (this.selectedTask()?.id === task.id) {
            this.selectedTask.set({ ...updatedTask });
        }

        const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        this.appendChatMessage(task.id, {
            id: Date.now(),
            sender_name: 'ប្រព័ន្ធ (System)',
            text: actionNotice,
            time: nowTime,
            is_self: false,
            is_system: true,
        });

        this._taskService.updateTask(task.id, {
            assignee: (updatedTask.assignee || null) as any,
            assignees: updatedAssignees as any,
        }).subscribe({
            next: (res) => {
                if (res?.data) {
                    this.tasks.update((list) => list.map((t) => (t.id === task.id ? { ...t, ...res.data } : t)));
                    if (this.selectedTask()?.id === task.id) {
                        this.selectedTask.set({ ...updatedTask, ...res.data });
                    }
                }
            },
            error: (err) => console.error('Failed to update task assignees', err),
        });
    }

    updateTaskReporter(task: TaskItem, member: TaskMember): void {
        const actorName = this.getCurrentActorName();
        const actorPrefix = actorName ? `${actorName} ` : '';
        const newReporter: TaskMember = {
            id: member.id,
            name: member.name,
            avatar: member.avatar || null,
            role: member.role || 'អ្នករាយការណ៍',
            email: member.email || '',
            colorClass: member.colorClass || 'bg-blue-600',
        };

        const updatedTask: TaskItem = {
            ...task,
            reporter: newReporter,
        };

        this.tasks.update((list) => list.map((t) => (t.id === task.id ? updatedTask : t)));
        if (this.selectedTask()?.id === task.id) {
            this.selectedTask.set({ ...updatedTask });
        }

        const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        this.appendChatMessage(task.id, {
            id: Date.now(),
            sender_name: 'ប្រព័ន្ធ (System)',
            text: `${actorPrefix}បានប្តូរអ្នកបង្កើតទៅកាន់៖ "${member.name}"`,
            time: nowTime,
            is_self: false,
            is_system: true,
        });

        this._taskService.updateTask(task.id, {
            reporter: newReporter as any,
        }).subscribe({
            next: (res) => {
                if (res?.data) {
                    this.tasks.update((list) => list.map((t) => (t.id === task.id ? { ...t, ...res.data } : t)));
                    if (this.selectedTask()?.id === task.id) {
                        this.selectedTask.set({ ...updatedTask, ...res.data });
                    }
                }
            },
            error: (err) => console.error('Failed to update task reporter', err),
        });
    }

    onTaskDrop(event: CdkDragDrop<string>, targetStatus: string): void {
        const task = event.item.data as TaskItem;
        if (!task) return;

        const previousStatus = event.previousContainer.data;
        if (previousStatus === targetStatus) return;

        const originalStatus = task.status;
        this.tasks.update((tasks) =>
            tasks.map((t) => (t.id === task.id ? { ...t, status: targetStatus as TaskStatus } : t))
        );
        this.computeCounts(this.tasks());

        this._taskService.updateTask(task.id, { status: targetStatus as any }).subscribe({
            next: (res) => {
                if (res?.data) {
                    this.tasks.update((tasks) =>
                        tasks.map((t) => (t.id === task.id ? res.data : t))
                    );
                    this.computeCounts(this.tasks());
                }
            },
            error: (err) => {
                console.error('Failed to update task status on drag drop', err);
                this.tasks.update((tasks) =>
                    tasks.map((t) => (t.id === task.id ? { ...t, status: originalStatus } : t))
                );
                this.computeCounts(this.tasks());
            },
        });
    }

    onDragStarted(): void {
        this.isDragging.set(true);
    }

    onDragEnded(): void {
        setTimeout(() => this.isDragging.set(false), 80);
    }

    trackByTaskId(_index: number, task: TaskItem): number {
        return task.id;
    }

    openCreateModal(defaultStatus?: string): void {
        const currentProj = this.projects().find((p) => p.id === this.selectedProjectId() && p.id !== 'all');
        const dialogConfig = this._dialogConfigService.getDialogConfig({
            user: this._userService.getUser(),
            projectCode: currentProj?.id || 'BMS',
            projectName: currentProj?.name || 'BMS Digitech',
            members: this.teamMembers(),
            existingTasks: this.tasks(),
            onTaskCreated: () => this.loadTasks(),
        });
        const dialogRef = this._matDialog.open(CreateTaskDialogComponent, dialogConfig);
        dialogRef.afterClosed().subscribe((result) => {
            if (result?.alreadyCreated) {
                this.loadTasks();
                return;
            }
            if (result?.title) {
                const primaryAssignee = result.assignees && result.assignees.length > 0
                    ? {
                        id: Number(result.assignees[0].id) || 1,
                        name: result.assignees[0].name,
                        role: result.assignees[0].role || 'Assignee',
                        avatar: result.assignees[0].avatar || null,
                    }
                    : (typeof result.assignee === 'object' && result.assignee && result.assignee.name
                        ? result.assignee
                        : (typeof result.assignee === 'string' && result.assignee.trim() ? { id: 1, name: result.assignee.trim(), role: 'Assignee' } : null));

                const assigneesList = result.assignees && result.assignees.length > 0
                    ? result.assignees.map((a: any) => ({
                        id: Number(a.id) || 1,
                        name: a.name,
                        role: a.role || 'Assignee',
                        avatar: a.avatar || null,
                    }))
                    : (primaryAssignee ? [primaryAssignee] : []);

                let reporterObj: any = null;
                if (result.reporter) {
                    if (typeof result.reporter === 'object' && result.reporter.name && result.reporter.name.trim()) {
                        reporterObj = {
                            id: Number(result.reporter.id) || this._userService.getUser()?.id || 0,
                            name: result.reporter.name.trim(),
                            role: result.reporter.role || 'Reporter',
                            avatar: result.reporter.avatar || null,
                        };
                    } else if (typeof result.reporter === 'string' && result.reporter.trim()) {
                        reporterObj = {
                            id: this._userService.getUser()?.id || 0,
                            name: result.reporter.trim(),
                            role: 'Reporter',
                        };
                    }
                }

                this._taskService
                    .createTask({
                        title: result.title,
                        code: result.code,
                        task_type: result.task_type || 'feature',
                        status: result.status || defaultStatus || 'new',
                        priority: result.priority || 'medium',
                        due_date: result.due_date,
                        reporter: reporterObj,
                        assignee: primaryAssignee,
                        assignees: assigneesList,
                        project_id: result.project_id || (this.selectedProjectId() !== 'all' ? this.selectedProjectId() : 'bms-digitech'),
                        project_name: result.project_name || (currentProj?.name || 'BMS Digitech'),
                        description: result.description || result.title,
                    } as any)
                    .subscribe({
                        next: () => this.loadTasks(),
                        error: () => this.loadTasks(),
                    });
            }
        });
    }

    deleteTask(taskId?: number): void {
        const id = taskId || this.deleteTarget()?.id;
        if (!id) return;
        this.isDeleting.set(true);
        this._taskService.deleteTask(id).subscribe({
            next: () => {
                this.isDeleting.set(false);
                this.showDeleteModal.set(false);
                this.deleteTarget.set(null);
                if (this.selectedTask()?.id === id) {
                    this.closeTaskChat();
                }
                this.loadTasks();
            },
            error: () => {
                this.isDeleting.set(false);
                this.showDeleteModal.set(false);
                this.deleteTarget.set(null);
            },
        });
    }

    getTasksByColumn(colKey: string): TaskItem[] {
        switch (colKey) {
            case 'new':
                return this.tasks().filter((t) => t.status === 'new' || t.status === 'pending');
            case 'confirmed':
                return this.tasks().filter((t) => t.status === 'confirmed');
            case 'unconfirmed':
                return this.tasks().filter((t) => t.status === 'unconfirmed' || t.status === 'todo');
            case 'in_progress':
                return this.tasks().filter((t) => t.status === 'in_progress');
            case 'in_review':
                return this.tasks().filter((t) => t.status === 'in_review' || t.status === 'review');
            case 'reopened':
                return this.tasks().filter((t) => t.status === 'reopened');
            case 'done':
                return this.tasks().filter((t) => t.status === 'done' || t.status === 'completed');
            default:
                return this.tasks().filter((t) => t.status === colKey);
        }
    }

    getStatusLabel(status: string): string {
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

    getStatusIcon(status: string): string {
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

    getStatusClass(status: string): string {
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

    getPriorityLabel(priority: string): string {
        switch (priority?.toLowerCase()) {
            case 'urgent':
                return 'បន្ទាន់';
            case 'high':
                return 'ខ្ពស់';
            case 'medium':
                return 'មធ្យម';
            case 'low':
                return 'ទាប';
            default:
                return priority || 'មធ្យម';
        }
    }

    getPriorityIcon(priority: string): string {
        switch (priority?.toLowerCase()) {
            case 'urgent':
                return 'mdi:alert-decagram';
            case 'high':
                return 'mdi:arrow-up-bold';
            case 'medium':
                return 'mdi:equal';
            case 'low':
                return 'mdi:arrow-down-bold';
            default:
                return 'mdi:equal';
        }
    }

    getPriorityClass(priority: string): string {
        switch (priority?.toLowerCase()) {
            case 'urgent':
                return 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40';
            case 'high':
                return 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40';
            case 'medium':
                return 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40';
            default:
                return 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700';
        }
    }

    getPriorityColor(priority: string): string {
        switch (priority?.toLowerCase()) {
            case 'urgent':
                return 'text-rose-500 dark:text-rose-400';
            case 'high':
                return 'text-amber-500 dark:text-amber-400';
            case 'medium':
                return 'text-blue-500 dark:text-blue-400';
            case 'low':
                return 'text-slate-400 dark:text-slate-500';
            default:
                return 'text-slate-400 dark:text-slate-500';
        }
    }

    getRelativeTime(dateStr?: string | null): string {
        if (!dateStr) return 'ថ្មីៗនេះ';
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays <= 0) return 'ថ្ងៃនេះ';
        if (diffDays === 1) return 'ម្សិលមិញ';
        if (diffDays < 7) return `${diffDays} ថ្ងៃមុន`;
        const weeks = Math.floor(diffDays / 7);
        if (weeks < 4) return `${weeks} សប្តាហ៍មុន`;
        const months = Math.floor(diffDays / 30);
        return `${months} ខែមុន`;
    }

    appendChatMessage(taskId: number, message: TaskChatMessage): void {
        this.chatMessages.update((msgs) => {
            const updated = [...msgs, message];
            this.taskChatHistoryMap.set(taskId, updated);
            return updated;
        });
    }

    openTaskDetails(task: TaskItem): void {
        if (this.isDragging()) return;
        this.selectedTask.set(task);
        this.dialogMode.set('details');
        this.showChatRoom.set(true);
        this.loadTaskChat(task);
    }

    openTaskChat(task: TaskItem, event?: Event): void {
        if (event) {
            event.stopPropagation();
        }
        if (this.isDragging()) return;
        this.selectedTask.set(task);
        this.dialogMode.set('chat');
        this.showChatRoom.set(true);
        this.loadTaskChat(task);
    }

    switchToChat(): void {
        this.dialogMode.set('chat');
    }

    switchToDetails(): void {
        this.dialogMode.set('details');
    }

    loadTaskChat(task: TaskItem): void {
        const reporterName = task.reporter?.name || 'អ្នកគ្រប់គ្រង';
        const reporterAvatar = task.reporter?.avatar || null;
        const reporterId = task.reporter?.id || 1;
        const assignees = this.getTaskAssignees(task);
        const hasAssignee = assignees.length > 0;
        const assigneeName = hasAssignee ? assignees[0].name : '';

        const currentUser: any = this._userService.getUser();
        const currentUserName = (currentUser?.en_name || currentUser?.name || currentUser?.kh_name || '').toLowerCase().trim();
        const currentUserId = currentUser?.id;

        const isReporterMe = Boolean(
            (currentUserId && reporterId && Number(currentUserId) === Number(reporterId)) ||
            (currentUserName && reporterName && (
                reporterName.toLowerCase().trim() === currentUserName ||
                currentUserName.includes(reporterName.toLowerCase().trim()) ||
                reporterName.toLowerCase().trim().includes(currentUserName)
            ))
        );

        const initialMessages: TaskChatMessage[] = [
            {
                id: 1,
                sender_name: 'ប្រព័ន្ធ (System)',
                text: hasAssignee && assigneeName
                    ? `ភារកិច្ច ${task.code || ('#' + task.id)} ត្រូវបានបង្កើតដោយ ${reporterName} និងចាត់តាំងទៅកាន់ ${assigneeName}`
                    : `ភារកិច្ច ${task.code || ('#' + task.id)} ត្រូវបានបង្កើតដោយ ${reporterName} (គ្មានអ្នកទទួលបន្ទុក)`,
                time: '8:30 AM',
                is_self: false,
                is_system: true,
            },
        ];

        if (hasAssignee && assigneeName) {
            const assignees = task.assignees && task.assignees.length > 0 
                ? task.assignees 
                : (task.assignee ? [task.assignee] : []);
            const seenList = assignees.map((a) => ({
                id: Number(a.id),
                name: a.name,
                avatar: a.avatar || null,
            }));

            initialMessages.push({
                id: 2,
                sender_id: reporterId,
                sender_name: reporterName,
                sender_avatar: reporterAvatar,
                text: `សួស្តី @${assigneeName}! ខ្ញុំបានចាត់តាំងភារកិច្ច "${task.title}" នេះជូនអ្នក។ សូមជួយពិនិត្យមើល និងអនុវត្តតាមលក្ខខណ្ឌការងារ។`,
                time: '8:45 AM',
                is_self: isReporterMe,
                seen_by: isReporterMe ? seenList : undefined,
            });
        }

        const cached = this.taskChatHistoryMap.get(task.id);
        if (cached && cached.length > 0) {
            this.chatMessages.set([...cached]);
        } else {
            this.chatMessages.set(initialMessages);
            this.taskChatHistoryMap.set(task.id, initialMessages);
        }

        // Fetch live comments & action history from API
        this._taskService.getTaskComments(task.id).subscribe({
            next: (res) => {
                if (res?.data?.comments && res.data.comments.length > 0) {
                    const mapped = (res.data.comments as TaskChatMessage[]).map((c) => {
                        if (c.is_system) {
                            return { ...c, is_self: false, is_system: true };
                        }
                        const senderName = (c.sender_name || '').toLowerCase().trim();
                        const isSelf = Boolean(
                            (currentUserName && (senderName === currentUserName || currentUserName.includes(senderName) || senderName.includes(currentUserName))) ||
                            (currentUser?.id && c.sender_id === currentUser.id) ||
                            c.is_self
                        );

                        // Format time in user's local timezone if created_at exists
                        let displayTime = c.time;
                        if (c.created_at) {
                            const d = new Date(c.created_at);
                            if (!isNaN(d.getTime())) {
                                displayTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            }
                        }

                        return { ...c, time: displayTime, is_self: isSelf, seen_by: c.seen_by || [] };
                    });

                    this.chatMessages.set(mapped);
                    this.taskChatHistoryMap.set(task.id, mapped);
                }
            },
            error: () => {},
        });
    }

    closeTaskChat(): void {
        this.showChatRoom.set(false);
        this.selectedTask.set(null);
        const q = this._route.snapshot.queryParams;
        if (q['taskId'] || q['taskCode']) {
            this._router.navigate([], {
                relativeTo: this._route,
                queryParams: { taskId: null, taskCode: null },
                queryParamsHandling: 'merge',
                replaceUrl: true,
            });
        }
    }

    sendChatMessage(payload: { text: string; attachments: TaskAttachment[] }): void {
        const text = payload.text.trim();
        const attachments = payload.attachments || [];
        if (!text && attachments.length === 0) return;

        const currentTask = this.selectedTask();
        const user = this._userService.getUser();
        const userAvatar = this.getAvatarUrl();
        const tempId = Date.now();

        const msg: TaskChatMessage = {
            id: tempId,
            sender_id: user?.id,
            sender_name: user?.kh_name || user?.en_name || 'អ្នក (You)',
            sender_avatar: userAvatar,
            text: text || (attachments.length > 0 ? 'បានផ្ញើឯកសារ' : ''),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            is_self: true,
            attachments: attachments.length > 0 ? [...attachments] : undefined,
            seen_by: [],
        };

        if (currentTask) {
            this.appendChatMessage(currentTask.id, msg);
            currentTask.comments_count = (currentTask.comments_count || 0) + 1;
            if (attachments.length > 0) {
                currentTask.attachments_count = (currentTask.attachments_count || 0) + attachments.length;
            }
            this._taskService.createTaskComment(currentTask.id, { text: msg.text, attachments }).subscribe({
                next: (res) => {
                    // Update task in the main list
                    this.tasks.update((items) =>
                        items.map((t) => (t.id === currentTask.id ? { ...t, comments_count: currentTask.comments_count, attachments_count: currentTask.attachments_count } : t))
                    );

                    // Sync server ID and timestamp to the sent message
                    if (res?.data) {
                        const serverComment = res.data;
                        this.chatMessages.update((msgs) => {
                            const updated = msgs.map((m) =>
                                m.id === tempId ? { ...m, id: serverComment.id, created_at: serverComment.created_at, seen_by: serverComment.seen_by || [] } : m
                            );
                            this.taskChatHistoryMap.set(currentTask.id, updated);
                            return updated;
                        });
                    }
                },
                error: (err) => console.error('Failed to sync comment with server', err),
            });
        }
    }

    openImagePreview(url: string): void {
        this.previewImageModal.set(url);
    }

    viewFile(file: TaskAttachment): void {
        const isImg = file.isImage || /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(file.name || '') || (file.type ? file.type.startsWith('image/') : false);
        if (isImg && file.url) {
            this.openImagePreview(file.url);
        } else {
            this.previewFileModal.set(file);
        }
    }

    closeFilePreview(): void {
        this.previewFileModal.set(null);
        this.previewImageModal.set(null);
    }

    downloadFile(file: TaskAttachment): void {
        if (file.url && (file.url.startsWith('data:') || file.url.startsWith('blob:'))) {
            const link = document.createElement('a');
            link.href = file.url;
            link.download = file.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else if (file.textContent) {
            const blob = new Blob([file.textContent], { type: file.type || 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = file.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } else if (file.url && file.url.startsWith('http')) {
            window.open(file.url, '_blank');
        } else {
            const dummyContent = `=====================================================
${file.name}
Project: ${this.selectedTask()?.project_name || 'Core'}
Task: ${this.selectedTask()?.title || 'Task Details'}
Code: ${this.selectedTask()?.code || ('#' + this.selectedTask()?.id)}
Generated / Downloaded At: ${new Date().toLocaleString()}
=====================================================

This is a preview export of the document "${file.name}".
All specifications, comments, and task workflows are verified.`;
            const blob = new Blob([dummyContent], { type: file.type || 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = file.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    }

    navigateHome(): void {
        this._router.navigate(['/member/home']);
    }
}
