import { CommonModule } from '@angular/common';
import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
    TaskAttachment,
    TaskChatMessage,
    TaskItem,
    TaskMember,
    TaskPriority,
    TaskStatus,
} from '../models/task.types';

@Component({
    selector: 'task-drawer',
    standalone: true,
    imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatMenuModule, MatTooltipModule],
    templateUrl: './task-drawer.component.html',
})
export class TaskDrawerComponent {
    task = input<TaskItem | null>(null);
    show = input<boolean>(false);
    messages = input<TaskChatMessage[]>([]);
    teamMembers = input<TaskMember[]>([]);
    allFiles = input<TaskAttachment[]>([]);
    currentUserAvatar = input<string>('');

    closeDrawer = output<void>();
    statusChange = output<{ task: TaskItem; status: string }>();
    priorityChange = output<{ task: TaskItem; priority: string }>();
    dueDateChange = output<{ task: TaskItem; dueDate: string | null }>();
    assigneeToggle = output<{ task: TaskItem; member: TaskMember }>();
    sendMessage = output<{ text: string; attachments: TaskAttachment[] }>();
    viewFile = output<TaskAttachment>();
    previewImage = output<string>();
    downloadFile = output<TaskAttachment>();

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
        if (diffDays === 0) return { text: 'ថ្ងៃនេះ (Today)', isOverdue: false };
        return { text: `សល់ ${diffDays} ថ្ងៃ`, isOverdue: false };
    }

    getIsoDate(dateStr?: string | null): string {
        if (!dateStr) return new Date().toISOString().split('T')[0];
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
        return d.toISOString().split('T')[0];
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

    onFileInputChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input?.files?.length) {
            this.handleIncomingFiles(input.files);
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

    handleIncomingFiles(fileList: FileList | File[]): void {
        const filesArray = Array.from(fileList);
        for (const file of filesArray) {
            const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(file.name);
            const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
            const isText = file.type.startsWith('text/') || /\.(txt|json|csv|md|js|ts|html|xml|sql|log)$/i.test(file.name);
            const sizeStr = this.formatFileSize(file.size);
            const blobUrl = URL.createObjectURL(file);

            if (isImage) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.pendingAttachments.update((prev) => [
                        ...prev,
                        { name: file.name, size: sizeStr, type: file.type, url: e.target?.result as string, isImage: true, fileBlob: file },
                    ]);
                };
                reader.readAsDataURL(file);
            } else if (isPdf) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.pendingAttachments.update((prev) => [
                        ...prev,
                        { name: file.name, size: sizeStr, type: 'application/pdf', url: (e.target?.result as string) || blobUrl, isImage: false, fileBlob: file },
                    ]);
                };
                reader.readAsDataURL(file);
            } else if (isText) {
                file.text().then((content) => {
                    this.pendingAttachments.update((prev) => [
                        ...prev,
                        { name: file.name, size: sizeStr, type: file.type || 'text/plain', url: blobUrl, isImage: false, textContent: content, fileBlob: file },
                    ]);
                }).catch(() => {});
            } else {
                this.pendingAttachments.update((prev) => [
                    ...prev,
                    { name: file.name, size: sizeStr, type: file.type || 'application/octet-stream', url: blobUrl, isImage: false, fileBlob: file },
                ]);
            }
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
