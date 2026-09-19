import { CommonModule } from '@angular/common';
import { Component, computed, effect, ElementRef, HostListener, inject, input, OnDestroy, output, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, DateAdapter, MAT_DATE_FORMATS, MAT_NATIVE_DATE_FORMATS } from '@angular/material/core';
import { KhmerDateAdapter } from 'helper/adapter/khmer-date-adapter';
import { SideDialogCloseButtonComponent } from 'app/shared/side-dialog-close-button/component';
import { UserService } from 'app/core/user/user.service';
import { TaskSocketService } from 'app/core/realtime/task-socket.service';
import { UserTaskService } from '../task.service';
import { resolveFileUrl } from 'helper/shared/file-url';
import {
    TASK_TYPES_LIST,
    TaskAttachment,
    TaskChatMessage,
    TaskItem,
    TaskMember,
    TaskPriority,
    TaskStatus,
    TaskTypeOption,
} from '../models/task.types';

@Component({
    selector: 'task-drawer',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatIconModule,
        MatButtonModule,
        MatMenuModule,
        MatTooltipModule,
        MatDatepickerModule,
        MatNativeDateModule,
        SideDialogCloseButtonComponent,
    ],
    providers: [
        { provide: DateAdapter, useClass: KhmerDateAdapter },
        { provide: MAT_DATE_FORMATS, useValue: MAT_NATIVE_DATE_FORMATS },
    ],
    templateUrl: './template.html',
    styleUrl: './style.scss',
})
export class TaskDrawerComponent implements OnDestroy {
    task = input<TaskItem | null>(null);
    show = input<boolean>(false);
    messages = input<TaskChatMessage[]>([]);
    teamMembers = input<TaskMember[]>([]);
    allFiles = input<TaskAttachment[]>([]);
    currentUserAvatar = input<string>('');

    dialogMode = input<'details' | 'chat'>('details');

    closeDrawer = output<void>();
    switchToChat = output<void>();
    switchToDetails = output<void>();
    statusChange = output<{ task: TaskItem; status: string }>();
    typeChange = output<{ task: TaskItem; taskType: string }>();
    priorityChange = output<{ task: TaskItem; priority: string }>();
    dueDateChange = output<{ task: TaskItem; dueDate: string | null }>();
    titleChange = output<{ task: TaskItem; title: string }>();
    descriptionChange = output<{ task: TaskItem; description: string }>();
    assigneeToggle = output<{ task: TaskItem; member: TaskMember }>();
    reporterChange = output<{ task: TaskItem; member: TaskMember }>();
    sendMessage = output<{ text: string; attachments: TaskAttachment[] }>();
    viewFile = output<TaskAttachment>();
    previewImage = output<string>();
    downloadFile = output<TaskAttachment>();
    deleteTask = output<TaskItem>();

    private readonly _userService = inject(UserService);
    private readonly _taskSocket = inject(TaskSocketService);
    private readonly _taskService = inject(UserTaskService);

    taskTypes = TASK_TYPES_LIST;

    mobileTab = signal<'details' | 'chat'>('chat');
    isClosing = signal<boolean>(false);
    isVisible = signal<boolean>(false);

    @ViewChild('titleInputRef') titleInputRef?: ElementRef<HTMLTextAreaElement>;
    @ViewChild('descriptionInputRef') descriptionInputRef?: ElementRef<HTMLTextAreaElement>;
    @ViewChild('chatScrollContainer') chatScrollContainer?: ElementRef<HTMLDivElement>;

    isEditingTitle = signal<boolean>(false);
    editingTitle = signal<string>('');
    isEditingDescription = signal<boolean>(false);
    editingDescription = signal<string>('');

    typingUser = signal<{ user_name: string; state: string } | null>(null);
    private _typingTimeout?: any;
    private _sendTypingDebounce?: any;
    private _typingSub?: Subscription;

    private _titleDebounceTimer?: any;
    private _descriptionDebounceTimer?: any;
    private _lastEmittedTitle = '';
    private _lastEmittedDescription = '';

    @HostListener('document:keydown.escape', ['$event'])
    onEscapeKey(event?: KeyboardEvent): void {
        if (this.isEditingTitle()) {
            this.cancelEditTitle(event);
            return;
        }
        if (this.isEditingDescription()) {
            this.cancelEditDescription(event);
            return;
        }
        if (this.show() && !this.isClosing()) {
            this.triggerClose();
        }
    }

    constructor() {
        effect(() => {
            const currentTask = this.task();
            if (currentTask) {
                clearTimeout(this._titleDebounceTimer);
                clearTimeout(this._descriptionDebounceTimer);
                this._lastEmittedTitle = currentTask.title || '';
                this._lastEmittedDescription = (currentTask.description || '').trim();
                this.isEditingTitle.set(false);
                this.isEditingDescription.set(false);
            }
        }, { allowSignalWrites: true });

        effect(() => {
            const mode = this.dialogMode();
            if (mode) {
                this.mobileTab.set(mode);
            }
        }, { allowSignalWrites: true });

        effect(() => {
            const isShow = this.show();
            if (isShow) {
                this.isClosing.set(false);
                setTimeout(() => {
                    this.isVisible.set(true);
                }, 10);
            } else {
                this.isVisible.set(false);
                this.isClosing.set(false);
                clearTimeout(this._titleDebounceTimer);
                clearTimeout(this._descriptionDebounceTimer);
                this.isEditingTitle.set(false);
                this.isEditingDescription.set(false);
            }
        }, { allowSignalWrites: true });

        // Auto-scroll chat to bottom when messages update
        effect(() => {
            const msgs = this.messages();
            if (msgs && msgs.length > 0) {
                setTimeout(() => this.scrollToBottom(true), 60);
            }
        });

        // Listen for real-time typing indicators in the active task room
        effect(() => {
            const currentTask = this.task();
            this._typingSub?.unsubscribe();
            this.typingUser.set(null);
            clearTimeout(this._typingTimeout);

            if (currentTask && currentTask.id) {
                const taskIdStr = String(currentTask.id);
                const curUser = this._userService.getUser();
                const curUserId = curUser?.id ? Number(curUser.id) : null;

                this._typingSub = this._taskSocket.taskTypingUpdates().subscribe((evt) => {
                    if (String(evt.task_id) === taskIdStr) {
                        if (curUserId && evt.user_id && Number(evt.user_id) === curUserId) {
                            return;
                        }
                        if (evt.state) {
                            this.typingUser.set({
                                user_name: evt.user_name || 'នរណាម្នាក់',
                                state: evt.state,
                            });
                            clearTimeout(this._typingTimeout);
                            this._typingTimeout = setTimeout(() => {
                                this.typingUser.set(null);
                            }, 3500);
                        } else {
                            this.typingUser.set(null);
                            clearTimeout(this._typingTimeout);
                        }
                    }
                });
            }
        });
    }

    ngOnDestroy(): void {
        clearTimeout(this._titleDebounceTimer);
        clearTimeout(this._descriptionDebounceTimer);
        this._typingSub?.unsubscribe();
        clearTimeout(this._typingTimeout);
        clearTimeout(this._sendTypingDebounce);
    }

    startEditTitle(): void {
        const t = this.task()?.title || '';
        this.editingTitle.set(t);
        this._lastEmittedTitle = t;
        this.isEditingTitle.set(true);
        setTimeout(() => {
            if (this.titleInputRef?.nativeElement) {
                this.titleInputRef.nativeElement.focus();
                this.titleInputRef.nativeElement.select();
            }
        }, 50);
    }

    onTitleInput(val: string): void {
        this.editingTitle.set(val);
        const currentTask = this.task();
        if (!currentTask) return;

        const trimmed = val.trim();
        if (trimmed) {
            (currentTask as any).title = trimmed;
        }

        clearTimeout(this._titleDebounceTimer);
        this._titleDebounceTimer = setTimeout(() => {
            if (trimmed && trimmed !== this._lastEmittedTitle) {
                this._lastEmittedTitle = trimmed;
                this.titleChange.emit({ task: currentTask, title: trimmed });
            }
        }, 700);
    }

    finishEditTitle(): void {
        clearTimeout(this._titleDebounceTimer);
        const currentTask = this.task();
        if (currentTask) {
            const trimmed = this.editingTitle().trim();
            if (trimmed) {
                (currentTask as any).title = trimmed;
                if (trimmed !== this._lastEmittedTitle) {
                    this._lastEmittedTitle = trimmed;
                    this.titleChange.emit({ task: currentTask, title: trimmed });
                }
            } else {
                this.editingTitle.set(this._lastEmittedTitle || currentTask.title || '');
                (currentTask as any).title = this._lastEmittedTitle || currentTask.title || '';
            }
        }
        this.isEditingTitle.set(false);
    }

    saveTitle(): void {
        this.finishEditTitle();
    }

    cancelEditTitle(event?: Event): void {
        if (event) {
            event.stopPropagation();
        }
        clearTimeout(this._titleDebounceTimer);
        const currentTask = this.task();
        if (currentTask) {
            this.editingTitle.set(this._lastEmittedTitle || currentTask.title || '');
            (currentTask as any).title = this._lastEmittedTitle || currentTask.title || '';
        }
        this.isEditingTitle.set(false);
    }

    onTitleKeydown(event: KeyboardEvent): void {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.finishEditTitle();
        }
    }

    startEditDescription(): void {
        const d = this.task()?.description || '';
        this.editingDescription.set(d);
        this._lastEmittedDescription = d.trim();
        this.isEditingDescription.set(true);
        setTimeout(() => {
            if (this.descriptionInputRef?.nativeElement) {
                this.descriptionInputRef.nativeElement.focus();
            }
        }, 50);
    }

    onDescriptionInput(val: string): void {
        this.editingDescription.set(val);
        const currentTask = this.task();
        if (!currentTask) return;

        const trimmed = val.trim();
        (currentTask as any).description = val;

        clearTimeout(this._descriptionDebounceTimer);
        this._descriptionDebounceTimer = setTimeout(() => {
            if (trimmed !== this._lastEmittedDescription) {
                this._lastEmittedDescription = trimmed;
                this.descriptionChange.emit({ task: currentTask, description: val });
            }
        }, 800);
    }

    finishEditDescription(): void {
        clearTimeout(this._descriptionDebounceTimer);
        const currentTask = this.task();
        if (currentTask) {
            const rawVal = this.editingDescription();
            const trimmed = rawVal.trim();
            (currentTask as any).description = rawVal;
            if (trimmed !== this._lastEmittedDescription) {
                this._lastEmittedDescription = trimmed;
                this.descriptionChange.emit({ task: currentTask, description: rawVal });
            }
        }
        this.isEditingDescription.set(false);
    }

    saveDescription(): void {
        this.finishEditDescription();
    }

    cancelEditDescription(event?: Event): void {
        if (event) {
            event.stopPropagation();
        }
        clearTimeout(this._descriptionDebounceTimer);
        const currentTask = this.task();
        if (currentTask) {
            this.editingDescription.set(this._lastEmittedDescription || currentTask.description || '');
            (currentTask as any).description = this._lastEmittedDescription || currentTask.description || '';
        }
        this.isEditingDescription.set(false);
    }

    triggerClose(): void {
        if (this.isClosing()) return;
        this.isClosing.set(true);
        this.isVisible.set(false);
        setTimeout(() => {
            this.closeDrawer.emit();
            this.isClosing.set(false);
        }, 220);
    }

    taskDueDate = computed<Date | null>(() => {
        const raw = this.task()?.due_date;
        if (!raw) return null;
        const d = new Date(raw);
        return isNaN(d.getTime()) ? null : d;
    });

    getTaskTypeInfo(type?: string): TaskTypeOption {
        const found = this.taskTypes.find((t) => t.id === type || t.id.toLowerCase() === type?.toLowerCase());
        return found || this.taskTypes[0]; // Default to 'feature' (មុខងារ)
    }

    activeTab = signal<'chat' | 'details' | 'files'>('chat');
    newChatMessage = '';
    assigneeSearchQuery = signal<string>('');

    // Drag and drop / file upload
    isDraggingFile = signal<boolean>(false);
    pendingAttachments = signal<TaskAttachment[]>([]);
    private dragCounter = 0;

    filteredTeamMembers = computed(() => {
        const q = this.assigneeSearchQuery().toLowerCase().trim();
        if (!q) return this.teamMembers();
        return this.teamMembers().filter(
            (m) => m.name.toLowerCase().includes(q) || (m.role && m.role.toLowerCase().includes(q))
        );
    });

    getTaskAssignees(task: TaskItem | null | undefined): TaskMember[] {
        if (!task) return [];
        if (task.assignees !== undefined && Array.isArray(task.assignees)) {
            return task.assignees;
        }
        if (task.assignee) return [task.assignee];
        return [];
    }

    getAssigneeNamesLabel(task: TaskItem | null | undefined): string {
        const assignees = this.getTaskAssignees(task);
        if (assignees.length === 0) return 'គ្មានអ្នកទទួលបន្ទុក';
        if (assignees.length === 1) return assignees[0].name;
        if (assignees.length === 2) return `${assignees[0].name}, ${assignees[1].name}`;
        return `${assignees[0].name}, ${assignees[1].name} (+${assignees.length - 2})`;
    }

    hasUserChatMessages(): boolean {
        return (this.messages() || []).some((m) => !m.is_system);
    }

    shouldShowMessageStatus(index: number): boolean {
        const msgs = this.messages() || [];
        const msg = msgs[index];
        if (!msg || !msg.is_self) return false;

        // Show if it's the last message overall
        if (index === msgs.length - 1) return true;

        // Find the next self message
        for (let i = index + 1; i < msgs.length; i++) {
            const nextMsg = msgs[i];
            if (nextMsg.is_self) {
                const currentSeen = msg.seen_by?.length || 0;
                const nextSeen = nextMsg.seen_by?.length || 0;
                
                // If this message has more viewers than the next one, show it.
                if (currentSeen > nextSeen) {
                    return true;
                }
                return false;
            }
        }
        return true;
    }

    isMemberAssigned(task: TaskItem | null | undefined, member: TaskMember): boolean {
        const assignees = this.getTaskAssignees(task);
        return assignees.some(
            (a) => Number(a.id) === Number(member.id) || (a.name && member.name && a.name.trim().toLowerCase() === member.name.trim().toLowerCase())
        );
    }

    toggleAssignee(member: TaskMember, event?: Event): void {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        const currentTask = this.task();
        if (!currentTask) return;
        this.assigneeToggle.emit({ task: currentTask, member });
    }

    getMemberColorClass(member: TaskMember): string {
        if (member.colorClass) return member.colorClass;
        const colors = [
            'bg-indigo-600',
            'bg-blue-600',
            'bg-emerald-600',
            'bg-amber-600',
            'bg-purple-600',
            'bg-rose-600',
            'bg-cyan-600',
            'bg-teal-600',
        ];
        const id = Number(member.id) || 0;
        return colors[id % colors.length];
    }

    getMemberInitial(name?: string): string {
        if (!name) return 'U';
        const parts = name.trim().split(/\s+/);
        if (parts.length > 1) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    }

    getAssigneeAvatar(member: TaskMember | { name?: string; avatar?: any; id?: any; email?: string } | null | undefined): string | null {
        if (!member) return null;
        if ((member as any)._avatarFailed) return null;

        // 1. Check if member is current logged-in user
        const cur = this._userService.getUser();
        const curPhone = (cur?.phone || '').replace(/\D/g, '');
        const targetPhone = (((member as any).phone || '') as string).replace(/\D/g, '');

        const curId = cur?.id ? Number(cur.id) : null;
        const memberId = member?.id ? Number(member.id) : null;
        const isCurrentUser = Boolean(
            (curId && memberId && curId === memberId) ||
            (!curId && !memberId && curPhone && targetPhone && curPhone === targetPhone)
        );

        if (isCurrentUser && cur?.avatar) {
            const curAvatar = resolveFileUrl(cur.avatar);
            if (curAvatar && !curAvatar.includes('placeholder')) {
                return curAvatar;
            }
        }

        // 2. If member has an avatar that is not a placeholder
        if (member.avatar) {
            if (typeof member.avatar === 'string' && member.avatar.includes('placeholder')) {
                // Ignore placeholder
            } else {
                const resolved = resolveFileUrl(member.avatar);
                if (resolved && !resolved.includes('placeholder')) {
                    return resolved;
                }
            }
        }

        // 3. Fallback: match from teamMembers()
        const team = this.teamMembers();
        if (team && team.length > 0) {
            const found = team.find((m) => {
                const mId = m.id ? Number(m.id) : null;
                const mPhone = (((m as any).phone || '') as string).replace(/\D/g, '');
                return (memberId && mId && memberId === mId) ||
                       (targetPhone && mPhone && targetPhone === mPhone);
            });
            if (found?.avatar) {
                const resolved = resolveFileUrl(found.avatar);
                if (resolved && !resolved.includes('placeholder')) {
                    return resolved;
                }
            }
        }

        return null;
    }

    getSenderAvatar(msg: TaskChatMessage): string | null {
        if (!msg) return null;
        if (msg.is_self) {
            const cur = this._userService.getUser();
            if (cur?.avatar) {
                const url = resolveFileUrl(cur.avatar);
                if (url && !url.includes('placeholder')) return url;
            }
        }
        return this.getAssigneeAvatar({
            id: msg.sender_id,
            name: msg.sender_name,
            avatar: msg.sender_avatar,
        });
    }

    getViewerAvatar(viewer: { avatar?: string | null; name?: string; id?: number }): string {
        const av = this.getAssigneeAvatar(viewer);
        return av || '/images/placeholder/avatar.jpg';
    }

    onAvatarError(event: Event, member?: any): void {
        const target = event.target as HTMLImageElement;
        if (target) {
            target.style.display = 'none';
        }
        if (member) {
            member._avatarFailed = true;
        }
    }

    getSeenTooltip(seenBy?: Array<{ name?: string }>): string {
        if (!seenBy || seenBy.length === 0) return '';
        return seenBy.map((v) => v.name || 'Member').join(', ');
    }

    formatMessageTime(msg: TaskChatMessage): string {
        if (!msg) return '';
        if (msg.created_at) {
            const d = new Date(msg.created_at);
            if (!isNaN(d.getTime())) {
                return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
        }
        return msg.time || '';
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
        if (dueDateStr) return this.formatDate(dueDateStr);
        if (createdDateStr) {
            const d = new Date(createdDateStr);
            d.setDate(d.getDate() + 7);
            return this.formatDate(d.toISOString());
        }
        return '15/09/2026';
    }

    getDaysRemainingInfo(dueDateStr?: string | null): { text: string; isOverdue: boolean } {
        if (!dueDateStr) return { text: 'សល់ 7 ថ្ងៃ', isOverdue: false };
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const dueDate = new Date(dueDateStr);
        if (isNaN(dueDate.getTime())) return { text: 'កំណត់រួចរាល់', isOverdue: false };
        dueDate.setHours(0, 0, 0, 0);

        const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return { text: 'ហួសកាលកំណត់', isOverdue: true };
        if (diffDays === 0) return { text: 'ថ្ងៃនេះ', isOverdue: false };
        return { text: `សល់ ${diffDays} ថ្ងៃ`, isOverdue: false };
    }

    getStatusDot(status?: string): string {
        switch (status?.toLowerCase()) {
            case 'new':
            case 'pending':
                return 'bg-blue-500';
            case 'confirmed':
                return 'bg-indigo-500';
            case 'unconfirmed':
            case 'todo':
                return 'bg-slate-400';
            case 'in_progress':
                return 'bg-amber-500';
            case 'in_review':
            case 'review':
                return 'bg-sky-500';
            case 'reopened':
                return 'bg-rose-500';
            case 'done':
            case 'completed':
                return 'bg-emerald-500';
            default:
                return 'bg-slate-400';
        }
    }

    getPriorityColor(priority?: string): string {
        switch (priority?.toLowerCase()) {
            case 'urgent':
                return 'text-rose-500';
            case 'high':
                return 'text-amber-500';
            case 'medium':
                return 'text-blue-500';
            case 'low':
                return 'text-slate-400';
            default:
                return 'text-blue-500';
        }
    }

    getIsoDate(dateStr?: string | null): string {
        if (!dateStr) return new Date().toISOString().split('T')[0];
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
        return d.toISOString().split('T')[0];
    }

    clearDueDate(task: TaskItem): void {
        this.dueDateChange.emit({ task, dueDate: null });
    }

    onDateInputChange(event: Event, task: TaskItem): void {
        const input = event.target as HTMLInputElement;
        if (input && input.value) {
            const d = new Date(input.value);
            this.dueDateChange.emit({ task, dueDate: d.toISOString() });
        }
    }

    setQuickDueDate(task: TaskItem, daysToAdd: number): void {
        const d = new Date();
        d.setDate(d.getDate() + daysToAdd);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const iso = `${year}-${month}-${day}`;
        this.dueDateChange.emit({ task, dueDate: iso });
    }

    onMatDateChange(event: any, task: TaskItem): void {
        const dateVal = event.value;
        if (!dateVal) {
            this.clearDueDate(task);
            return;
        }
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return;
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const iso = `${year}-${month}-${day}`;
        this.dueDateChange.emit({ task, dueDate: iso });
    }

    getStatusClass(status?: string): string {
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

    isStatusDone(status?: string): boolean {
        const s = (status || '').toLowerCase();
        return s === 'done' || s === 'completed';
    }

    getStatusPillClass(status?: string): string {
        switch (status?.toLowerCase()) {
            case 'done':
            case 'completed':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200/90 dark:bg-emerald-950/70 dark:border-emerald-700/80 dark:text-emerald-400';
            case 'in_progress':
                return 'bg-amber-50 text-amber-700 border-amber-200/90 dark:bg-amber-950/70 dark:border-amber-700/80 dark:text-amber-400';
            case 'in_review':
            case 'review':
                return 'bg-sky-50 text-sky-700 border-sky-200/90 dark:bg-sky-950/70 dark:border-sky-700/80 dark:text-sky-400';
            case 'confirmed':
                return 'bg-indigo-50 text-indigo-700 border-indigo-200/90 dark:bg-indigo-950/70 dark:border-indigo-700/80 dark:text-indigo-400';
            case 'new':
            case 'pending':
                return 'bg-blue-50 text-blue-700 border-blue-200/90 dark:bg-blue-950/70 dark:border-blue-700/80 dark:text-blue-400';
            case 'reopened':
                return 'bg-rose-50 text-rose-700 border-rose-200/90 dark:bg-rose-950/70 dark:border-rose-700/80 dark:text-rose-400';
            default:
                return 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200';
        }
    }

    getKhmerDateLabel(dateStr?: string | null): string {
        const khmerMonths = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
        if (!dateStr) {
            const now = new Date();
            return `${now.getDate()} ${khmerMonths[now.getMonth()]}`;
        }
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '25 សីហា';
        return `${d.getDate()} ${khmerMonths[d.getMonth()]}`;
    }

    addQuickEmoji(emoji: string): void {
        this.newChatMessage = (this.newChatMessage || '') + emoji;
    }

    getStatusLabel(status?: string): string {
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

    getStatusIcon(status?: string): string {
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

    getPriorityClass(priority?: string): string {
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

    getPriorityLabel(priority?: string): string {
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

    getPriorityIcon(priority?: string): string {
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

    getFileIcon(name: string, type?: string): string {
        const lower = name.toLowerCase();
        if (lower.endsWith('.pdf') || type?.includes('pdf')) return 'mdi:file-pdf-box';
        if (lower.endsWith('.xls') || lower.endsWith('.xlsx') || type?.includes('excel') || type?.includes('spreadsheet'))
            return 'mdi:file-excel-box';
        if (lower.endsWith('.doc') || lower.endsWith('.docx') || type?.includes('word') || type?.includes('document'))
            return 'mdi:file-word-box';
        if (lower.endsWith('.zip') || lower.endsWith('.rar') || lower.endsWith('.7z') || type?.includes('zip'))
            return 'mdi:folder-zip-outline';
        if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp'))
            return 'mdi:file-image';
        return 'mdi:file-document-outline';
    }

    getFileIconColor(name: string): string {
        const lower = name.toLowerCase();
        if (lower.endsWith('.pdf')) return 'text-rose-500 bg-rose-50 dark:bg-rose-950/40';
        if (lower.endsWith('.xls') || lower.endsWith('.xlsx')) return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40';
        if (lower.endsWith('.doc') || lower.endsWith('.docx')) return 'text-blue-500 bg-blue-50 dark:bg-blue-950/40';
        if (lower.endsWith('.zip') || lower.endsWith('.rar')) return 'text-amber-500 bg-amber-50 dark:bg-amber-950/40';
        return 'text-blue-500 bg-blue-50 dark:bg-blue-950/40';
    }

    isImageAttachment(att?: TaskAttachment | null): boolean {
        if (!att) return false;
        if (att.isImage) return true;
        const name = (att.name || '').toLowerCase();
        const type = (att.type || '').toLowerCase();
        return (
            type.startsWith('image/') ||
            /\.(png|jpe?g|gif|webp|svg|bmp|ico)$/i.test(name) ||
            (!!att.url && att.url.startsWith('data:image/'))
        );
    }

    // Drag drop & file handling
    onDragOver(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    }

    onDragEnter(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.dragCounter++;
        if (event.dataTransfer?.types?.includes('Files')) this.isDraggingFile.set(true);
    }

    onDragLeave(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.dragCounter--;
        if (this.dragCounter <= 0) {
            this.dragCounter = 0;
            this.isDraggingFile.set(false);
        }
    }

    onFileDrop(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.dragCounter = 0;
        this.isDraggingFile.set(false);
        if (event.dataTransfer?.files?.length) this.handleIncomingFiles(event.dataTransfer.files);
        }

        onFileInputChange(event: Event, autoSubmit = false): void {
            const input = event.target as HTMLInputElement;
            if (input?.files?.length) {
                this.handleIncomingFiles(input.files, autoSubmit);
                input.value = '';
            }
        }

        onInputPaste(event: ClipboardEvent): void {
            const items = event.clipboardData?.items;
            if (!items) return;
            const files: File[] = [];
            for (let i = 0; i < items.length; i++) {
                if (items[i].kind === 'file') {
                    const file = items[i].getAsFile();
                    if (file) files.push(file);
                }
            }
            if (files.length > 0) this.handleIncomingFiles(files);
        }

        handleIncomingFiles(fileList: FileList | File[], autoSubmit = false): void {
            const filesArray = Array.from(fileList);
            const processedAttachments: TaskAttachment[] = [];
            let remaining = filesArray.length;

            const checkDone = () => {
                if (remaining === 0) {
                    if (autoSubmit && processedAttachments.length > 0) {
                        this.sendMessage.emit({ text: 'បានផ្ញើឯកសារ', attachments: processedAttachments });
                    } else if (processedAttachments.length > 0) {
                        this.pendingAttachments.update((prev) => [...prev, ...processedAttachments]);
                    }
                }
            };

            for (const file of filesArray) {
                const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(file.name);
                const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
                const sizeStr = this.formatFileSize(file.size);

                this._taskService.uploadAttachment(file).subscribe({
                    next: (res) => {
                        const serverUrl = res?.data?.url || res?.data?.uri || '';
                        processedAttachments.push({
                            name: file.name,
                            size: sizeStr,
                            type: file.type || (isPdf ? 'application/pdf' : isImage ? 'image/png' : 'application/octet-stream'),
                            url: serverUrl,
                            isImage: isImage,
                            fileBlob: file,
                        });
                        remaining--;
                        checkDone();
                    },
                    error: () => {
                        const blobUrl = URL.createObjectURL(file);
                        processedAttachments.push({
                            name: file.name,
                            size: sizeStr,
                            type: file.type || 'application/octet-stream',
                            url: blobUrl,
                            isImage: isImage,
                            fileBlob: file,
                        });
                        remaining--;
                        checkDone();
                    },
                });
            }
        }

    removePendingAttachment(index: number): void {
        this.pendingAttachments.update((prev) => prev.filter((_, i) => i !== index));
    }

    formatFileSize(bytes: number): string {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    scrollToBottom(smooth = true): void {
        if (this.chatScrollContainer?.nativeElement) {
            const el = this.chatScrollContainer.nativeElement;
            el.scrollTo({
                top: el.scrollHeight,
                behavior: smooth ? 'smooth' : 'auto',
            });
        }
    }

    onChatInput(): void {
        const currentTask = this.task();
        if (!currentTask?.id) return;
        const curUser = this._userService.getUser();
        const myName = (curUser?.kh_name || curUser?.name || curUser?.en_name || '').trim();

        this._taskSocket.sendTaskTyping(currentTask.id, 'text', myName);

        clearTimeout(this._sendTypingDebounce);
        this._sendTypingDebounce = setTimeout(() => {
            this._taskSocket.sendTaskTyping(currentTask.id, null, myName);
        }, 2500);
    }

    submitChatMessage(): void {
        const text = this.newChatMessage.trim();
        const attachments = this.pendingAttachments();
        if (!text && attachments.length === 0) return;

        const currentTask = this.task();
        if (currentTask?.id) {
            clearTimeout(this._sendTypingDebounce);
            this._taskSocket.sendTaskTyping(currentTask.id, null);
        }

        this.sendMessage.emit({ text, attachments });
        this.newChatMessage = '';
        this.pendingAttachments.set([]);
        setTimeout(() => this.scrollToBottom(true), 50);
    }
}
