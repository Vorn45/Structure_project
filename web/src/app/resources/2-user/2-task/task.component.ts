import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, computed } from '@angular/core';
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
import { TaskDrawerComponent } from './task-drawer/task-drawer.component';
import { FilePreviewModalComponent } from './file-preview-modal/file-preview-modal.component';
import {
    TaskAttachment,
    TaskChatMessage,
    TaskItem,
    TaskMember,
    TaskPriority,
    TaskStatus,
} from './models/task.types';
import { UserTaskService } from './task.service';

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

    // Task Chat Drawer & File Modal State
    selectedTask = signal<TaskItem | null>(null);
    showChatRoom = signal<boolean>(false);
    chatMessages = signal<TaskChatMessage[]>([]);
    previewImageModal = signal<string | null>(null);
    previewFileModal = signal<TaskAttachment | null>(null);
    private taskChatHistoryMap = new Map<number, TaskChatMessage[]>();

    // Team Members Pool for Multi-Assignee Selection (Loaded dynamically from DB)
    teamMembers = signal<TaskMember[]>([
        { id: 1, name: 'កែវ វិបុល', role: 'អភិបាលប្រព័ន្ធ (Admin)', avatar: '/images/placeholder/avatar.jpg', colorClass: 'bg-indigo-600', email: 'keovibul.tech@gmail.com' },
        { id: 2, name: 'ស៊ុន ស្រីពេជ្រ', role: 'ប្រធានផ្នែក Frontend Lead', avatar: '/images/placeholder/avatar.jpg', colorClass: 'bg-blue-600', email: 'sunsreypich.dev@gmail.com' },
        { id: 3, name: 'ជា ដារ៉ារ័ត្ន', role: 'អ្នកអភិវឌ្ឍន៍ Backend ជាន់ខ្ពស់', avatar: '/images/placeholder/avatar.jpg', colorClass: 'bg-emerald-600', email: 'cheadararath@gmail.com' },
        { id: 4, name: 'មុន្នី រតនៈ', role: 'វិស្វករ Fullstack', avatar: '/images/placeholder/avatar.jpg', colorClass: 'bg-amber-600', email: 'monyrothana.dev@gmail.com' },
        { id: 5, name: 'អ៊ុក គឹមហុង', role: 'អ្នកបង្កើតកម្មវិធី Mobile', avatar: '/images/placeholder/avatar.jpg', colorClass: 'bg-purple-600', email: 'oukkimhong.app@gmail.com' },
        { id: 6, name: 'ផាន់ សុវណ្ណារ៉ា', role: 'ត្រួតពិនិត្យគុណភាព QA & Test', avatar: '/images/placeholder/avatar.jpg', colorClass: 'bg-rose-600', email: 'sovannara.phan@gmail.com' },
        { id: 7, name: 'អេង ពិសិដ្ឋ', role: 'វិស្វករ Cloud & DevOps', avatar: '/images/placeholder/avatar.jpg', colorClass: 'bg-cyan-600', email: 'engpiseth.cloud@gmail.com' },
        { id: 8, name: 'នួន គន្ធា', role: 'អ្នករចនា UI/UX', avatar: '/images/placeholder/avatar.jpg', colorClass: 'bg-teal-600', email: 'nounkunthea.ux@gmail.com' },
        { id: 9, name: 'តាំង ម៉េងហុង', role: 'អ្នកអភិវឌ្ឍន៍កម្មវិធី Web', avatar: '/images/placeholder/avatar.jpg', colorClass: 'bg-blue-600', email: 'tangmenghong@gmail.com' },
        { id: 10, name: 'ម៉ៅ សុភ័ក្ត្រ', role: 'អ្នកគ្រប់គ្រងទិន្នន័យ Database', avatar: '/images/placeholder/avatar.jpg', colorClass: 'bg-emerald-600', email: 'maosopheak.db@gmail.com' },
        { id: 11, name: 'សោម វណ្ណដា', role: 'វិស្វករប្រព័ន្ធ System Engineer', avatar: '/images/placeholder/avatar.jpg', colorClass: 'bg-amber-600', email: 'somvannda.sys@gmail.com' },
        { id: 12, name: 'ចាន់ ឧត្តម', role: 'អ្នកអភិវឌ្ឍន៍ Backend', avatar: '/images/placeholder/avatar.jpg', colorClass: 'bg-purple-600', email: 'chanoudom.code@gmail.com' },
        { id: 13, name: 'ឃុន ស្រីណែត', role: 'អ្នកអភិវឌ្ឍន៍ Frontend', avatar: '/images/placeholder/avatar.jpg', colorClass: 'bg-rose-600', email: 'khunsreynet.fe@gmail.com' },
        { id: 14, name: 'ឌុច វីរៈ', role: 'អ្នកគ្រប់គ្រងហេដ្ឋារចនាសម្ព័ន្ធ DevOps', avatar: '/images/placeholder/avatar.jpg', colorClass: 'bg-cyan-600', email: 'douchvirak.ops@gmail.com' },
        { id: 15, name: 'ព្រំ ធារ៉ា', role: 'អ្នកវិភាគទិន្នន័យ Data Analyst', avatar: '/images/placeholder/avatar.jpg', colorClass: 'bg-teal-600', email: 'promtheara.data@gmail.com' },
        { id: 16, name: 'យិន លីហ្សា', role: 'អ្នករចនា UI/UX Designer', avatar: '/images/placeholder/avatar.jpg', colorClass: 'bg-indigo-600', email: 'yinliza.design@gmail.com' },
        { id: 17, name: 'ថៃ វិសាល', role: 'វិស្វករសន្តិសុខ Security Engineer', avatar: '/images/placeholder/avatar.jpg', colorClass: 'bg-blue-600', email: 'thaiviseth.sec@gmail.com' },
        { id: 18, name: 'ហុង សម្បត្តិ', role: 'អ្នកគ្រប់គ្រងគម្រោង Project Manager', avatar: '/images/placeholder/avatar.jpg', colorClass: 'bg-emerald-600', email: 'hongsambath.pm@gmail.com' },
        { id: 19, name: 'ឡុង វិច្ឆិកា', role: 'អ្នកអភិវឌ្ឍន៍ Backend', avatar: '/images/placeholder/avatar.jpg', colorClass: 'bg-amber-600', email: 'longvicheka.be@gmail.com' },
        { id: 20, name: 'ឈិន ម៉ានិត', role: 'អ្នកអភិវឌ្ឍន៍ Frontend', avatar: '/images/placeholder/avatar.jpg', colorClass: 'bg-purple-600', email: 'chhinmanith.dev@gmail.com' },
    ]);

    // Aggregated list of all files for the task (defaults + uploaded in chat)
    allTaskFiles = computed<TaskAttachment[]>(() => {
        const defaultFiles: TaskAttachment[] = [
            {
                name: 'Task_Requirement_Specification.pdf',
                size: '2.4 MB',
                type: 'application/pdf',
                isImage: false,
                url: '',
            },
            {
                name: 'Design_Mockup_V2.png',
                size: '1.8 MB',
                type: 'image/png',
                isImage: true,
                url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
            },
        ];

        const chatFiles: TaskAttachment[] = [];
        this.chatMessages().forEach((m) => {
            if (m.attachments) {
                chatFiles.push(...m.attachments);
            }
        });

        return [...defaultFiles, ...chatFiles];
    });

    constructor(
        private readonly _taskService: UserTaskService,
        private readonly _userService: UserService,
        private readonly _route: ActivatedRoute,
        private readonly _router: Router,
        private readonly _matDialog: MatDialog,
        private readonly _dialogConfigService: DialogConfigService,
    ) {}

    getAvatarUrl(): string {
        const user = this._userService.getUser();
        if (user?.avatar?.uri && user?.avatar?.file_domain) {
            return user.avatar.file_domain.replace(/\/+$/, '') + '/' + user.avatar.uri.replace(/^\/+/, '');
        }
        return '/images/placeholder/avatar.jpg';
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

    isTaskBelongToCurrentUser(task: TaskItem): boolean {
        const user = this._userService.getUser();
        const userNameEn = (user?.en_name || user?.name || 'Cheng Chanpanha').toLowerCase().trim();
        const userNameKh = (user?.kh_name || 'ចេង ច័ន្ទបញ្ញា').toLowerCase().trim();
        const userEmail = (user?.email || '').toLowerCase().trim();

        const matchUser = (target?: { name?: string; email?: string; id?: number } | null): boolean => {
            if (!target) return false;
            const targetName = target.name?.toLowerCase().trim();
            if (targetName) {
                if (userNameKh && (targetName === userNameKh || targetName.includes(userNameKh) || userNameKh.includes(targetName))) return true;
                if (userNameEn && (targetName === userNameEn || targetName.includes(userNameEn) || userNameEn.includes(targetName))) return true;
                if (targetName.includes('ចេង ច័ន្ទបញ្ញា') || targetName.includes('cheng chanpanha')) {
                    if (userNameEn.includes('cheng') || userNameKh.includes('ចេង')) return true;
                }
                if (targetName.includes('ឡេង សុខឆាយ') || targetName.includes('leng sokchhay')) {
                    if (userNameEn.includes('leng') || userNameKh.includes('ឡេង')) return true;
                }
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
            })
            .subscribe({
                next: (res) => {
                    const results = res.data.results || [];
                    const userSpecific = results.filter((t) => this.isTaskBelongToCurrentUser(t));
                    const finalTasks = userSpecific.length > 0 ? userSpecific : results;
                    this.tasks.set(finalTasks);
                    this.computeCounts(finalTasks, res.data.counts);
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
        this.loadTasks();
    }

    updateTaskStatus(task: TaskItem, newStatus: string): void {
        const oldStatus = task.status;
        const targetStatus = newStatus as TaskStatus;

        if (this.selectedTask()?.id === task.id) {
            this.selectedTask.update((t) => (t ? { ...t, status: targetStatus } : null));
            const systemMsg: TaskChatMessage = {
                id: Date.now(),
                sender_name: 'ប្រព័ន្ធ (System)',
                text: `បានប្តូរស្ថានភាពពី "${this.getStatusLabel(oldStatus)}" ទៅជា "${this.getStatusLabel(targetStatus)}"`,
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

        if (this.selectedTask()?.id === task.id) {
            this.selectedTask.update((t) => (t ? { ...t, priority: targetPriority } : null));
            const systemMsg: TaskChatMessage = {
                id: Date.now(),
                sender_name: 'ប្រព័ន្ធ (System)',
                text: `បានប្តូរអាទិភាពពី "${this.getPriorityLabel(oldPriority)}" ទៅជា "${this.getPriorityLabel(targetPriority)}"`,
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

    updateTaskDueDate(task: TaskItem, newDateStr: string | null): void {
        const formatted = newDateStr ? this.formatDate(newDateStr) : 'សម្អាត';

        if (this.selectedTask()?.id === task.id) {
            this.selectedTask.update((t) => (t ? { ...t, due_date: newDateStr } : null));
            const systemMsg: TaskChatMessage = {
                id: Date.now(),
                sender_name: 'ប្រព័ន្ធ (System)',
                text: newDateStr ? `បានកំណត់កាលបរិច្ឆេទត្រូវធ្វើថ្មី៖ ${formatted}` : `បានសម្អាតកាលបរិច្ឆេទកំណត់`,
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

        let updatedAssignees: TaskMember[];
        let actionNotice = '';

        if (exists) {
            updatedAssignees = currentAssignees.filter(
                (a) => Number(a.id) !== Number(member.id) && !(a.name && member.name && a.name.trim().toLowerCase() === member.name.trim().toLowerCase())
            );
            actionNotice = updatedAssignees.length > 0
                ? `បានដកចេញអ្នកទទួលបន្ទុក៖ "${member.name}"`
                : `បានដកចេញអ្នកទទួលបន្ទុកទាំងអស់ (គ្មានអ្នកទទួលបន្ទុក)`;
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
            actionNotice = `បានបន្ថែមអ្នកទទួលបន្ទុក៖ "${member.name}"`;
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

    private saveChatToStorage(taskId: number, msgs: TaskChatMessage[]): void {
        try {
            const cacheKey = `wfm_task_chat_${taskId}`;
            localStorage.setItem(cacheKey, JSON.stringify(msgs));
        } catch (e) {}
    }

    private loadChatFromStorage(taskId: number): TaskChatMessage[] | null {
        try {
            const cacheKey = `wfm_task_chat_${taskId}`;
            const raw = localStorage.getItem(cacheKey);
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return null;
    }

    appendChatMessage(taskId: number, message: TaskChatMessage): void {
        this.chatMessages.update((msgs) => {
            const updated = [...msgs, message];
            this.taskChatHistoryMap.set(taskId, updated);
            this.saveChatToStorage(taskId, updated);
            return updated;
        });
    }

    openTaskChat(task: TaskItem): void {
        if (this.isDragging()) return;
        this.selectedTask.set(task);
        this.showChatRoom.set(true);

        const cached = this.taskChatHistoryMap.get(task.id) || this.loadChatFromStorage(task.id);
        if (cached && cached.length > 0) {
            this.chatMessages.set([...cached]);
            this.taskChatHistoryMap.set(task.id, cached);
        } else {
            const reporterName = task.reporter?.name || 'Leng sokchhay';
            const reporterAvatar = task.reporter?.avatar || '/images/placeholder/avatar.jpg';
            const assigneeName = task.assignee?.name || 'Cheng Chanpanha';

            const initialMessages: TaskChatMessage[] = [
                {
                    id: 1,
                    sender_name: 'ប្រព័ន្ធ (System)',
                    text: `ភារកិច្ច ${task.code || ('#PMS-' + task.id)} ត្រូវបានបង្កើតដោយ ${reporterName} និងចាត់តាំងទៅកាន់ ${assigneeName}`,
                    time: '8:30 AM',
                    is_self: false,
                    is_system: true,
                },
                {
                    id: 2,
                    sender_name: reporterName,
                    sender_avatar: reporterAvatar,
                    text: `សួស្តី @${assigneeName}! ខ្ញុំបានចាត់តាំងភារកិច្ច "${task.title}" នេះជូនអ្នក។ សូមជួយពិនិត្យមើល និងអនុវត្តតាមលក្ខខណ្ឌការងារ។`,
                    time: '8:45 AM',
                    is_self: false,
                },
            ];
            this.chatMessages.set(initialMessages);
            this.taskChatHistoryMap.set(task.id, initialMessages);
        }

        // Fetch live comments & action history from API
        this._taskService.getTaskComments(task.id).subscribe({
            next: (res) => {
                if (res?.data?.comments && res.data.comments.length > 0) {
                    const currentUser: any = this._userService.getUser();
                    const currentUserName = (currentUser?.en_name || currentUser?.name || currentUser?.kh_name || 'Cheng Chanpanha').toLowerCase().trim();

                    const mapped = (res.data.comments as TaskChatMessage[]).map((c) => {
                        if (c.is_system) {
                            return { ...c, is_self: false, is_system: true };
                        }
                        const senderName = (c.sender_name || '').toLowerCase().trim();
                        const isSelf = Boolean(
                            (currentUserName && (senderName === currentUserName || senderName.includes('cheng chanpanha') || currentUserName.includes(senderName))) ||
                            (currentUser?.id && c.sender_id === currentUser.id) ||
                            c.is_self
                        );
                        return { ...c, is_self: isSelf };
                    });

                    this.chatMessages.set(mapped);
                    this.taskChatHistoryMap.set(task.id, mapped);
                    this.saveChatToStorage(task.id, mapped);
                }
            },
            error: () => {},
        });
    }

    closeTaskChat(): void {
        this.showChatRoom.set(false);
        this.selectedTask.set(null);
    }

    sendChatMessage(payload: { text: string; attachments: TaskAttachment[] }): void {
        const text = payload.text.trim();
        const attachments = payload.attachments || [];
        if (!text && attachments.length === 0) return;

        const currentTask = this.selectedTask();
        const user = this._userService.getUser();
        const userAvatar = this.getAvatarUrl();

        const msg: TaskChatMessage = {
            id: Date.now(),
            sender_name: user?.kh_name || user?.en_name || 'អ្នក (You)',
            sender_avatar: userAvatar,
            text: text || (attachments.length > 0 ? 'បានផ្ញើឯកសារ' : ''),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            is_self: true,
            attachments: attachments.length > 0 ? [...attachments] : undefined,
        };

        if (currentTask) {
            this.appendChatMessage(currentTask.id, msg);
            currentTask.comments_count = (currentTask.comments_count || 0) + 1;
            if (attachments.length > 0) {
                currentTask.attachments_count = (currentTask.attachments_count || 0) + attachments.length;
            }
            this._taskService.createTaskComment(currentTask.id, { text: msg.text, attachments }).subscribe({
                next: () => {
                    // Update task in the main list
                    this.tasks.update((items) =>
                        items.map((t) => (t.id === currentTask.id ? { ...t, comments_count: currentTask.comments_count, attachments_count: currentTask.attachments_count } : t))
                    );
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
Project: ${this.selectedTask()?.project_name || 'PMS Core'}
Task: ${this.selectedTask()?.title || 'Task Details'}
Code: ${this.selectedTask()?.code || ('#PMS-' + this.selectedTask()?.id)}
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
