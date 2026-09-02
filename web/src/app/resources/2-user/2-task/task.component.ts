import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from 'app/core/user/user.service';
import { DialogConfigService } from 'app/shared/dialog-config.service';
import { CreateProjectDialogComponent } from '../1-home/create-project-dialog/create-project-dialog.component';
import { TaskItem, TaskStatus, UserTaskService } from './task.service';

export interface TaskChatMessage {
    id: number;
    sender_id?: number;
    sender_name: string;
    sender_avatar?: string;
    text: string;
    time: string;
    is_self: boolean;
    is_system?: boolean;
    attachments?: Array<{ name: string; size: string }>;
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
    ],
    templateUrl: './task.component.html',
    styles: [
        `
            :host {
                font-family: 'Kantumruy Pro', sans-serif !important;
                font-size: 16px;
                display: flex;
                flex-direction: column;
                flex: 1 1 auto;
                width: 100%;
                min-height: 100vh;
            }
            *:not(.mat-icon):not([class*='material-icons']):not([class*='icon-']):not([class*='mdi']) {
                font-family: 'Kantumruy Pro', sans-serif !important;
            }
            /* Completely hide all scrollbars while preserving full left/right scrolling */
            .kanban-scroll-container,
            .kanban-scroll-container * {
                scrollbar-width: none !important;
                -ms-overflow-style: none !important;
            }
            .kanban-scroll-container::-webkit-scrollbar,
            .kanban-scroll-container *::-webkit-scrollbar {
                display: none !important;
                width: 0 !important;
                height: 0 !important;
            }
            ::ng-deep .cdk-drag-preview {
                box-sizing: border-box;
                border-radius: 0.75rem !important;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
                background-color: white !important;
                opacity: 0.96;
            }
            ::ng-deep .cdk-drag-placeholder {
                opacity: 0.35;
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
export class UserTaskComponent implements OnInit {
    loading = signal<boolean>(true);
    tasks = signal<TaskItem[]>([]);
    isDragging = signal<boolean>(false);
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

    viewMode = signal<'grid' | 'kanban' | 'list'>('kanban');
    activeStatus = signal<string>('all');
    activePriority = signal<string>('all');
    searchQuery = signal<string>('');


    // Task Chat Room State
    selectedTask = signal<TaskItem | null>(null);
    showChatRoom = signal<boolean>(false);
    activeChatTab = signal<'chat' | 'details' | 'files'>('chat');
    chatMessages = signal<TaskChatMessage[]>([]);
    newChatMessage = '';

    constructor(
        private readonly _taskService: UserTaskService,
        private readonly _userService: UserService,
        private readonly _route: ActivatedRoute,
        private readonly _router: Router,
        private readonly _matDialog: MatDialog,
        private readonly _dialogConfigService: DialogConfigService,
    ) { }

    getAvatarUrl(): string {
        const user = this._userService.getUser();
        if (user?.avatar?.uri && user?.avatar?.file_domain) {
            return user.avatar.file_domain.replace(/\/+$/, '') + '/' + user.avatar.uri.replace(/^\/+/, '');
        }
        return '/images/placeholder/avatar.jpg';
    }

    ngOnInit(): void {
        this._route.queryParams.subscribe((params) => {
            if (params['status']) {
                this.activeStatus.set(params['status']);
            }
            if (params['priority']) {
                this.activePriority.set(params['priority']);
            }
            if (params['view'] && (params['view'] === 'grid' || params['view'] === 'kanban' || params['view'] === 'list')) {
                this.viewMode.set(params['view']);
            }
            this.loadTasks();
        });
    }

    computeCounts(tasks: TaskItem[], apiCounts?: any): void {
        this.counts.set({
            all: apiCounts?.all ?? tasks.length,
            new: apiCounts?.new ?? tasks.filter((t) => t.status === 'new' || t.status === 'pending').length,
            confirmed: apiCounts?.confirmed ?? tasks.filter((t) => t.status === 'confirmed').length,
            unconfirmed: apiCounts?.unconfirmed ?? tasks.filter((t) => t.status === 'unconfirmed' || t.status === 'todo').length,
            in_progress: apiCounts?.in_progress ?? tasks.filter((t) => t.status === 'in_progress').length,
            in_review: apiCounts?.in_review ?? tasks.filter((t) => t.status === 'in_review' || t.status === 'review').length,
            reopened: apiCounts?.reopened ?? tasks.filter((t) => t.status === 'reopened').length,
            done: apiCounts?.done ?? tasks.filter((t) => t.status === 'done' || t.status === 'completed').length,
        });
    }

    loadTasks(): void {
        this.loading.set(true);
        this._taskService
            .getTasks({
                search: this.searchQuery() || undefined,
                status: this.activeStatus() !== 'all' ? this.activeStatus() : undefined,
                priority: this.activePriority() !== 'all' ? this.activePriority() : undefined,
            })
            .subscribe({
                next: (res) => {
                    this.tasks.set(res.data.results);
                    this.computeCounts(res.data.results, res.data.counts);
                    this.loading.set(false);
                },
                error: (err) => {
                    console.error('Failed to load tasks', err);
                    this.loading.set(false);
                },
            });
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
    }

    onSearchChange(): void {
        this.loadTasks();
    }

    onKanbanWheel(event: WheelEvent, el: HTMLElement): void {
        if (event.deltaY !== 0 && !event.shiftKey) {
            el.scrollLeft += event.deltaY * 0.8;
            event.preventDefault();
        }
    }

    Math = Math;

    getDaysRemaining(dueDateStr?: string): string {
        if (!dueDateStr) return 'សល់ 851 ថ្ងៃ';
        const due = new Date(dueDateStr).getTime();
        const now = Date.now();
        const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
        if (diffDays <= 0) return 'ហួសកាលកំណត់';
        return `សល់ ${diffDays} ថ្ងៃ`;
    }

    getActivityRate(task: TaskItem): number {
        const comments = task.comments_count || 1;
        return Math.min(100, Math.round((comments / 11) * 100));
    }

    getTeamAvatars(task: TaskItem): Array<{ name: string; avatar: string }> {
        return [
            {
                name: task.assignee?.name || 'User',
                avatar: task.assignee?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
            },
            {
                name: 'Dara',
                avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop',
            },
            {
                name: 'Vannak',
                avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
            },
            {
                name: 'Bopha',
                avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop',
            },
        ];
    }

    clearFilters(): void {
        this.activeStatus.set('all');
        this.activePriority.set('all');
        this.searchQuery.set('');
        this.loadTasks();
    }

    updateTaskStatus(task: TaskItem, newStatus: string): void {
        this._taskService.updateTask(task.id, { status: newStatus as any }).subscribe({
            next: (res) => {
                const updated = this.tasks().map((t) => (t.id === task.id ? res.data : t));
                this.tasks.set(updated);
                this.loadTasks();
            },
        });
    }

    onTaskDrop(event: CdkDragDrop<string>, targetStatus: string): void {
        const task = event.item.data as TaskItem;
        if (!task) return;

        const previousStatus = event.previousContainer.data;
        if (previousStatus === targetStatus) {
            return;
        }

        const originalStatus = task.status;
        // Optimistically update status in memory immediately
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
                // Revert on error
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

    openCreateModal(): void {
        const dialogConfig = this._dialogConfigService.getDialogConfig({
            user: this._userService.getUser(),
        });
        const dialogRef = this._matDialog.open(CreateProjectDialogComponent, dialogConfig);
        dialogRef.afterClosed().subscribe((result) => {
            if (result?.created && result?.name) {
                this._taskService
                    .createTask({
                        title: result.name,
                        status: result.status || 'new',
                        priority: 'medium',
                        description: result.name,
                    })
                    .subscribe({
                        next: () => this.loadTasks(),
                        error: () => this.loadTasks(),
                    });
            } else if (result?.created) {
                this.loadTasks();
            }
        });
    }



    deleteTask(id: number): void {
        if (!confirm('តើអ្នកពិតជាចង់លុបការងារនេះមែនទេ?')) return;
        this._taskService.deleteTask(id).subscribe({
            next: () => this.loadTasks(),
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

    openTaskChat(task: TaskItem): void {
        if (this.isDragging()) return;
        this.selectedTask.set(task);
        this.activeChatTab.set('chat');
        this.newChatMessage = '';

        const initialMessages: TaskChatMessage[] = [
            {
                id: 1,
                sender_name: 'ប្រព័ន្ធ (System)',
                text: `ភារកិច្ច ${task.code || ('#PMS-' + task.id)} ត្រូវបានបង្កើត និងចាត់តាំងទៅកាន់ ${task.assignee?.name || 'Cheng Chanpanha'}`,
                time: '8:30 AM',
                is_self: false,
                is_system: true,
            },
            {
                id: 2,
                sender_name: task.assignee?.name || 'Cheng Chanpanha',
                sender_avatar: task.assignee?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
                text: `សួស្តីក្រុមការងារ! ខ្ញុំបានទទួលភារកិច្ច "${task.title}" រួចរាល់ហើយ កំពុងចាប់ផ្តើមត្រួតពិនិត្យ និងអនុវត្តតាមលក្ខខណ្ឌ។`,
                time: '9:15 AM',
                is_self: false,
            },
            {
                id: 3,
                sender_name: 'Sokha Meng',
                sender_avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop',
                text: `បាទ ប្រសិនបើមានចម្ងល់លើផ្នែក Design ឬ API Endpoints អាចផ្ញើសារសួរក្នុងបន្ទប់នេះបានគ្រប់ពេល។`,
                time: '10:02 AM',
                is_self: false,
                attachments: (task.attachments_count || 0) > 0 ? [
                    { name: 'Specification-Doc-v1.2.pdf', size: '2.4 MB' },
                    { name: 'UI-Mockups-Preview.png', size: '1.1 MB' },
                ] : undefined,
            },
        ];

        this.chatMessages.set(initialMessages);
        this.showChatRoom.set(true);
    }

    closeTaskChat(): void {
        this.showChatRoom.set(false);
        this.selectedTask.set(null);
    }

    sendChatMessage(): void {
        const text = this.newChatMessage.trim();
        if (!text) return;

        const msg: TaskChatMessage = {
            id: Date.now(),
            sender_name: 'អ្នក (You)',
            sender_avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
            text: text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            is_self: true,
        };

        this.chatMessages.update((msgs) => [...msgs, msg]);
        this.newChatMessage = '';

        const current = this.selectedTask();
        if (current) {
            current.comments_count = (current.comments_count || 0) + 1;
        }
    }

    navigateHome(): void {
        this._router.navigate(['/member/home']);
    }
}
