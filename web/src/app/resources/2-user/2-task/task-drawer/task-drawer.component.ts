import { CommonModule } from '@angular/common';
import { Component, computed, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, DateAdapter, MAT_DATE_FORMATS, MAT_NATIVE_DATE_FORMATS } from '@angular/material/core';
import { KhmerDateAdapter } from 'helper/adapter/khmer-date-adapter';
import { SideDialogCloseButtonComponent } from 'app/shared/side-dialog-close-button/component';
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
    templateUrl: './task-drawer.component.html',
    styles: [
        `
            ::ng-deep .task-dropdown-menu.mat-mdc-menu-panel {
                background-color: #ffffff !important;
                border: 1px solid #e2e8f0 !important;
                border-radius: 1rem !important;
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05) !important;
                padding: 6px !important;
            }

            :host-context(.dark) ::ng-deep .task-dropdown-menu.mat-mdc-menu-panel,
            .dark ::ng-deep .task-dropdown-menu.mat-mdc-menu-panel {
                background-color: #121c2e !important;
                border: 1px solid rgba(51, 65, 85, 0.8) !important;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.6) !important;
            }

            ::ng-deep .task-dropdown-menu .mat-mdc-menu-item {
                color: #1e293b !important;
                border-radius: 0.65rem !important;
                min-height: 38px !important;
                padding: 6px 10px !important;
                font-size: 13px !important;
                font-family: 'Kantumruy Pro', sans-serif !important;
                transition: all 120ms ease !important;
            }

            ::ng-deep .task-dropdown-menu .mat-mdc-menu-item:hover,
            ::ng-deep .task-dropdown-menu .mat-mdc-menu-item.cdk-keyboard-focused,
            ::ng-deep .task-dropdown-menu .mat-mdc-menu-item.cdk-program-focused {
                background-color: #f1f5f9 !important;
                color: #0f172a !important;
            }

            :host-context(.dark) ::ng-deep .task-dropdown-menu .mat-mdc-menu-item,
            .dark ::ng-deep .task-dropdown-menu .mat-mdc-menu-item {
                color: #cbd5e1 !important;
            }

            :host-context(.dark) ::ng-deep .task-dropdown-menu .mat-mdc-menu-item:hover,
            .dark ::ng-deep .task-dropdown-menu .mat-mdc-menu-item:hover {
                background-color: #1c2b44 !important;
                color: #ffffff !important;
            }

            ::ng-deep .task-dropdown-menu .mat-mdc-menu-item .mdc-list-item__primary-text {
                color: inherit !important;
                display: flex !important;
                align-items: center !important;
                width: 100% !important;
            }

            ::ng-deep .task-dropdown-menu .mat-mdc-menu-item .mat-icon {
                margin: 0 !important;
                margin-right: 0 !important;
                margin-left: 0 !important;
                margin-inline-end: 0 !important;
                margin-inline-start: 0 !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
            }

            ::ng-deep .task-dropdown-menu .mat-mdc-menu-item .mat-icon svg {
                width: 100% !important;
                height: 100% !important;
                display: block !important;
                margin: auto !important;
            }

            ::ng-deep .task-dropdown-menu .mat-divider {
                border-top-color: #e2e8f0 !important;
            }

            :host-context(.dark) ::ng-deep .task-dropdown-menu .mat-divider,
            .dark ::ng-deep .task-dropdown-menu .mat-divider {
                border-top-color: rgba(51, 65, 85, 0.6) !important;
            }

            ::ng-deep .side-dialog-close-button {
                z-index: 50 !important;
                box-shadow: -4px 0 10px rgba(0, 0, 0, 0.08) !important;
            }

            :host-context(.dark) ::ng-deep .side-dialog-close-button,
            .dark ::ng-deep .side-dialog-close-button {
                box-shadow: -4px 0 12px rgba(0, 0, 0, 0.4) !important;
            }
        `,
    ],
})
export class TaskDrawerComponent {
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
    assigneeToggle = output<{ task: TaskItem; member: TaskMember }>();
    reporterChange = output<{ task: TaskItem; member: TaskMember }>();
    sendMessage = output<{ text: string; attachments: TaskAttachment[] }>();
    viewFile = output<TaskAttachment>();
    previewImage = output<string>();
    downloadFile = output<TaskAttachment>();
    deleteTask = output<TaskItem>();

    taskTypes = TASK_TYPES_LIST;

    mobileTab = signal<'details' | 'chat'>('chat');

    constructor() {
        effect(() => {
            const mode = this.dialogMode();
            if (mode) {
                this.mobileTab.set(mode);
            }
        }, { allowSignalWrites: true });
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

    getViewerAvatar(viewer: { avatar?: string | null; name?: string; id?: number }): string {
        if (viewer?.avatar && viewer.avatar.trim()) {
            return viewer.avatar;
        }
        if (viewer?.name || viewer?.id) {
            const member = (this.teamMembers() || []).find(
                (m) => (viewer.id && Number(m.id) === Number(viewer.id)) ||
                       (viewer.name && m.name && m.name.toLowerCase().trim() === viewer.name.toLowerCase().trim())
            );
            if (member?.avatar && member.avatar.trim()) {
                return member.avatar;
            }
        }
        return '/images/placeholder/avatar.jpg';
    }

    getSeenTooltip(seenBy?: Array<{ name?: string }>): string {
        if (!seenBy || seenBy.length === 0) return '';
        return seenBy.map((v) => v.name || 'Member').join(', ');
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
                const isText = file.type.startsWith('text/') || /\.(txt|json|csv|md|js|ts|html|xml|sql|log)$/i.test(file.name);
                const sizeStr = this.formatFileSize(file.size);

                const reader = new FileReader();
                reader.onload = (e) => {
                    const dataUrl = (e.target?.result as string) || '';
                    const item: TaskAttachment = {
                        name: file.name,
                        size: sizeStr,
                        type: file.type || (isPdf ? 'application/pdf' : isImage ? 'image/png' : 'application/octet-stream'),
                        url: dataUrl,
                        isImage: isImage,
                        fileBlob: file,
                    };

                    if (isText) {
                        file.text().then((txt) => {
                            item.textContent = txt;
                            processedAttachments.push(item);
                            remaining--;
                            checkDone();
                        }).catch(() => {
                            processedAttachments.push(item);
                            remaining--;
                            checkDone();
                        });
                    } else {
                        processedAttachments.push(item);
                        remaining--;
                        checkDone();
                    }
                };
                reader.onerror = () => {
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
                };
                reader.readAsDataURL(file);
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

    submitChatMessage(): void {
        const text = this.newChatMessage.trim();
        const attachments = this.pendingAttachments();
        if (!text && attachments.length === 0) return;

        this.sendMessage.emit({ text, attachments });
        this.newChatMessage = '';
        this.pendingAttachments.set([]);
    }
}
