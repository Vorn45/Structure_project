import { CommonModule } from '@angular/common';
import { Component, ElementRef, Inject, OnInit, ViewChild, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, DateAdapter, MAT_DATE_FORMATS, MAT_NATIVE_DATE_FORMATS } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { SideDialogCloseButtonComponent } from 'app/shared/side-dialog-close-button/component';
import { UserTaskService } from 'app/resources/2-user/2-task/task.service';
import { TASK_TYPES_LIST, TaskAttachment, TaskTypeOption } from 'app/resources/2-user/2-task/models/task.types';
import { KhmerDateAdapter } from 'helper/adapter/khmer-date-adapter';
import { resolveFileUrl } from 'helper/shared/file-url';


export * from './create-task-dialog.types';
import { CreateTaskDialogData, WorkStatus, TeamMember } from './create-task-dialog.types';

@Component({
    selector: 'app-create-task-dialog',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatTooltipModule,
        MatDividerModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatInputModule,
        SideDialogCloseButtonComponent,
    ],
    providers: [
        { provide: DateAdapter, useClass: KhmerDateAdapter },
        { provide: MAT_DATE_FORMATS, useValue: MAT_NATIVE_DATE_FORMATS },
    ],
    templateUrl: './template.html',
    styleUrl: './style.scss',
})
export class CreateTaskDialogComponent implements OnInit {
    @ViewChild('taskTitleInput') taskTitleInput?: ElementRef<HTMLInputElement>;

    taskTitle: string = '';
    taskCode: string = 'BMS-0000';
    category: string = 'it';
    startDate: Date | string | null = new Date();
    endDate: Date | string | null = new Date(Date.now() + 86400000 * 7);
    priority = signal<'low' | 'medium' | 'high'>('medium');
    description: string = '';

    // File attachments
    attachedFiles = signal<TaskAttachment[]>([]);
    isDraggingOver = signal<boolean>(false);
    private dragCounter = 0;

    projectList: Array<{ id: string; name: string; code: string }> = [];
    selectedProjectId: string = '';

    // State for continuous creation, notifications, and smooth closing
    isSubmitting = signal<boolean>(false);
    isClosing = signal<boolean>(false);
    successNotice = signal<string>('');
    private hasCreatedAnyTask = false;

    // The 7 statuses matching "ការងារខ្ញុំ"
    statusList: WorkStatus[] = [
        {
            id: 'new',
            label: 'ថ្មី',
            dotColor: 'bg-blue-500',
            activeColor: 'text-blue-600 dark:text-blue-400',
            activeBg: 'bg-blue-50/70 dark:bg-blue-950/40',
            activeBorder: 'border-blue-500',
        },
        {
            id: 'confirmed',
            label: 'បញ្ជាក់',
            dotColor: 'bg-blue-500',
            activeColor: 'text-blue-600 dark:text-blue-400',
            activeBg: 'bg-blue-50/70 dark:bg-blue-950/40',
            activeBorder: 'border-blue-500',
        },
        {
            id: 'unconfirmed',
            label: 'មិនបញ្ជាក់',
            dotColor: 'bg-slate-400',
            activeColor: 'text-slate-600 dark:text-slate-300',
            activeBg: 'bg-slate-100 dark:bg-slate-800',
            activeBorder: 'border-slate-500',
        },
        {
            id: 'in_progress',
            label: 'កំពុងធ្វើ',
            dotColor: 'bg-amber-500',
            activeColor: 'text-amber-600 dark:text-amber-400',
            activeBg: 'bg-amber-50/70 dark:bg-amber-950/40',
            activeBorder: 'border-amber-500',
        },
        {
            id: 'under_review',
            label: 'ស្នើសុំពិនិត្យ',
            dotColor: 'bg-sky-500',
            activeColor: 'text-sky-600 dark:text-sky-400',
            activeBg: 'bg-sky-50/70 dark:bg-sky-950/40',
            activeBorder: 'border-sky-500',
        },
        {
            id: 'reopened',
            label: 'បើកឡើងវិញ',
            dotColor: 'bg-rose-500',
            activeColor: 'text-rose-600 dark:text-rose-400',
            activeBg: 'bg-rose-50/70 dark:bg-rose-950/40',
            activeBorder: 'border-rose-500',
        },
        {
            id: 'completed',
            label: 'បញ្ចប់',
            dotColor: 'bg-emerald-500',
            activeColor: 'text-emerald-600 dark:text-emerald-400',
            activeBg: 'bg-emerald-50/70 dark:bg-emerald-950/40',
            activeBorder: 'border-emerald-500',
        },
    ];
    selectedStatus = signal<string>('new');

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
            case 'under_review':
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
            case 'under_review':
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
            case 'under_review':
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

    taskTypesList = TASK_TYPES_LIST;
    selectedTaskType: string = 'feature';

    getTaskTypeOption(typeId: string): TaskTypeOption {
        return this.taskTypesList.find((t) => t.id === typeId) || this.taskTypesList[0];
    }

    getSelectedProjectName(): string {
        const found = this.projectList.find((p) => p.id === this.selectedProjectId);
        return found ? found.name : 'ជ្រើសរើសគម្រោង';
    }

    formatDisplayDate(date: Date | string | null): string {
        if (!date) return 'ជ្រើសរើសកាលបរិច្ឆេទ';
        const d = typeof date === 'string' ? new Date(date) : date;
        if (isNaN(d.getTime())) return 'ជ្រើសរើសកាលបរិច្ឆេទ';
        const day = String(d.getDate()).padStart(2, '0');
        const khmerMonths = ['មករា', 'កម្ភៈ', 'មិនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
        return `${day} ${khmerMonths[d.getMonth()]} ${d.getFullYear()}`;
    }

    private formatIsoDate(d: Date | string | null): string | null {
        if (!d) return null;
        if (typeof d === 'string') {
            return d.includes('T') ? d.split('T')[0] : d;
        }
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Reporter (អ្នករាយការណ៍ / អ្នកបង្កើត) - Empty by default
    reporterName: string = '';
    reporterRole: string = '';
    reporterAvatar: string | null = null;
    reporterId: string | number | null = null;

    // Team Members for Assignee / Response - Empty by default
    teamMembers: TeamMember[] = [];
    selectedAssigneeIds = signal<string[]>([]);
    assigneeSearch: string = '';
    reporterSearch: string = '';

    get filteredAssigneeMembers(): TeamMember[] {
        const q = this.assigneeSearch.trim().toLowerCase();
        if (!q) return this.teamMembers;
        return this.teamMembers.filter(
            (m) =>
                (m.name && m.name.toLowerCase().includes(q)) ||
                (m.role && m.role.toLowerCase().includes(q))
        );
    }

    get filteredReporterMembers(): TeamMember[] {
        const q = this.reporterSearch.trim().toLowerCase();
        if (!q) return this.teamMembers;
        return this.teamMembers.filter(
            (m) =>
                (m.name && m.name.toLowerCase().includes(q)) ||
                (m.role && m.role.toLowerCase().includes(q))
        );
    }

    get selectedAssignees(): TeamMember[] {
        return this.teamMembers.filter((m) => this.selectedAssigneeIds().includes(String(m.id)));
    }

    getMemberAvatar(m: TeamMember): string | null {
        if (!m) return null;
        if (m.avatar) {
            const resolved = resolveFileUrl(m.avatar);
            if (resolved && !resolved.includes('placeholder')) return resolved;
        }
        if (this.data?.user) {
            const u = this.data.user;
            const uName = (u.en_name || u.name || u.kh_name || '').toLowerCase().trim();
            if (uName && m.name && (m.name.toLowerCase().trim() === uName || String(u.id) === String(m.id))) {
                const resolved = resolveFileUrl(u.avatar);
                if (resolved && !resolved.includes('placeholder')) return resolved;
            }
        }
        return null;
    }

    isAssigneeSelected(id: string | number): boolean {
        return this.selectedAssigneeIds().includes(String(id));
    }

    toggleAssignee(id: string | number): void {
        const current = this.selectedAssigneeIds();
        const strId = String(id);
        if (current.includes(strId)) {
            this.selectedAssigneeIds.set(current.filter((item) => item !== strId));
        } else {
            this.selectedAssigneeIds.set([...current, strId]);
        }
    }

    selectReporter(m: TeamMember): void {
        if (this.reporterName === m.name || (this.reporterId && String(this.reporterId) === String(m.id))) {
            this.clearReporter();
            return;
        }
        this.reporterName = m.name;
        this.reporterRole = m.role || 'អ្នករាយការណ៍';
        this.reporterAvatar = m.avatar || null;
        this.reporterId = m.id;
    }

    clearReporter(): void {
        this.reporterName = '';
        this.reporterRole = '';
        this.reporterAvatar = null;
        this.reporterId = null;
    }

    generateNextCode(projId: string): string {
        const found = this.projectList.find((p) => p.id === projId);
        let prefix = found?.code || this.data?.projectCode;
        if (!prefix) {
            prefix = projId.toUpperCase().includes('WMS') ? '0001' : (projId.toUpperCase().includes('BMS') ? '0002' : '0001');
        }
        prefix = prefix.replace(/^#/, '');

        const projectTasks = (this.data?.existingTasks || []).filter(
            (t) => (t.project_id === projId || (t.code && t.code.toUpperCase().includes(prefix.toUpperCase())))
        );

        let maxNum = -1;
        for (const t of projectTasks) {
            if (t.code) {
                const match = t.code.match(/(\d+)(?!.*\d)/);
                if (match) {
                    const val = parseInt(match[1], 10);
                    if (!isNaN(val) && val > maxNum) {
                        maxNum = val;
                    }
                }
            }
        }

        const nextNum = maxNum >= 0 ? maxNum + 1 : 1;
        return `${prefix}-${nextNum}`;
    }

    incrementTaskCode(): void {
        const lastDash = this.taskCode.lastIndexOf('-');
        if (lastDash !== -1) {
            const prefix = this.taskCode.substring(0, lastDash);
            const numPart = this.taskCode.substring(lastDash + 1);
            const num = parseInt(numPart, 10);
            if (!isNaN(num)) {
                this.taskCode = `${prefix}-${num + 1}`;
                return;
            }
        }
        this.taskCode = this.generateNextCode(this.selectedProjectId);
    }

    onProjectSelected(projId: string): void {
        this.selectedProjectId = projId;
        this.taskCode = this.generateNextCode(projId);
    }

    private mergeMembers(newMembers: TeamMember[]): void {
        const current = [...this.teamMembers];
        const normalize = (s?: string) => (s || '').toLowerCase().replace(/[\s\-_]/g, '');

        for (const nm of newMembers) {
            const nmNorm = normalize(nm.name);
            const exists = current.some((cm) => {
                if (String(cm.id) === String(nm.id)) return true;
                const cmNorm = normalize(cm.name);
                if (cmNorm && nmNorm && (cmNorm === nmNorm || cmNorm.includes(nmNorm) || nmNorm.includes(cmNorm))) return true;
                return false;
            });

            if (!exists) {
                current.push(nm);
            }
        }

        this.teamMembers = current;
    }

    loadAllMembers(): void {
        this._userTaskService.getMembers().subscribe({
            next: (res) => {
                if (res?.data && res.data.length > 0) {
                    const fetched: TeamMember[] = res.data.map((u: any) => ({
                        id: String(u.id),
                        name: u.name_kh || u.name_en || u.name,
                        role: u.role || 'សមាជិក (Member)',
                        avatar: u.avatar || undefined,
                    }));
                    this.mergeMembers(fetched);
                }
            },
            error: (err) => {
                console.warn('Could not load full team members list:', err);
            },
        });
    }

    constructor(
        public dialogRef: MatDialogRef<CreateTaskDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: CreateTaskDialogData,
        private readonly _userTaskService: UserTaskService,
    ) {
        // Enable custom smooth closing on backdrop click & escape key
        this.dialogRef.disableClose = true;
        this.dialogRef.backdropClick().subscribe(() => {
            this.cancel();
        });
        this.dialogRef.keydownEvents().subscribe((e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                this.cancel();
            }
        });

        // Initialize projects list if provided in dialog data
        if (this.data?.projects && this.data.projects.length > 0) {
            this.projectList = this.data.projects.map((p) => ({
                id: String(p.id),
                name: p.name,
                code: (p.code || p.id).replace(/^#/, ''),
            }));
        }

        // Auto-select and guarantee active project
        const targetId = this.data?.projectId || this.data?.projectCode;
        const targetCode = (this.data?.projectCode || this.data?.projectId || '').replace(/^#/, '');
        const targetName = this.data?.projectName || targetCode || 'Project';

        if (targetId || targetCode) {
            const found = this.projectList.find(
                (p) =>
                    (targetId && (p.id.toLowerCase() === String(targetId).toLowerCase() || p.code.toLowerCase() === String(targetId).toLowerCase())) ||
                    (targetCode && p.code.toLowerCase() === targetCode.toLowerCase())
            );
            if (found) {
                this.selectedProjectId = found.id;
            } else if (targetId) {
                const newProj = { id: String(targetId), name: targetName, code: targetCode || 'PRJ' };
                this.projectList.unshift(newProj);
                this.selectedProjectId = String(targetId);
            }
        }
        if (this.data?.members && this.data.members.length > 0) {
            this.teamMembers = this.data.members.map((m) => ({
                id: String(m.id),
                name: m.name,
                role: m.role,
                avatar: m.avatar,
            }));
        }
        if (this.data?.user) {
            const u = this.data.user;
            const uName = (u.en_name || u.name || u.kh_name || '').trim();
            const uKh = (u.kh_name || '').trim();
            const uEn = (u.en_name || '').trim();
            const normalize = (s?: string) => (s || '').toLowerCase().replace(/[\s\-_]/g, '');
            const uNorm = normalize(uName);
            const uKhNorm = normalize(uKh);
            const uEnNorm = normalize(uEn);

            const isExisting = this.teamMembers.some((m) => {
                if (String(m.id) === String(u.id)) return true;
                const mNorm = normalize(m.name);
                if (uNorm && (mNorm === uNorm || mNorm.includes(uNorm) || uNorm.includes(mNorm))) return true;
                if (uKhNorm && (mNorm === uKhNorm || mNorm.includes(uKhNorm) || uKhNorm.includes(mNorm))) return true;
                if (uEnNorm && (mNorm === uEnNorm || mNorm.includes(uEnNorm) || uEnNorm.includes(mNorm))) return true;
                return false;
            });

            if (!isExisting && (uKh || uEn || uName)) {
                this.teamMembers.unshift({
                    id: String(u.id || 'me'),
                    name: uKh || uEn || uName,
                    role: u.roles?.[0]?.name_kh || u.roles?.[0]?.name_en || 'User',
                    avatar: u.avatar?.uri || null,
                });
            }
        }
        this.taskCode = this.generateNextCode(this.selectedProjectId);
        if (this.data?.defaultStatus) {
            this.selectedStatus.set(this.data.defaultStatus);
        }
        // Note: reporter and assignees deliberately start empty (no defaults) per user requirement
    }

    loadProjects(): void {
        this._userTaskService.getProjects().subscribe({
            next: (res) => {
                if (res?.data && res.data.length > 0) {
                    const currentList = [...this.projectList];
                    for (const p of res.data) {
                        const pid = String(p.id || p.code);
                        const pcode = (p.code || pid).replace(/^#/, '');
                        const pname = p.name || pcode;
                        const exists = currentList.some((item) => item.id.toLowerCase() === pid.toLowerCase() || item.code.toLowerCase() === pcode.toLowerCase());
                        if (!exists) {
                            currentList.push({ id: pid, name: pname, code: pcode });
                        }
                    }
                    this.projectList = currentList;
                    const found = this.projectList.find((p) => p.id === this.selectedProjectId);
                    if (!found && this.data?.projectName) {
                        const cur = this.projectList.find(
                            (p) => p.name.toLowerCase() === this.data?.projectName?.toLowerCase() || p.code.toLowerCase() === this.data?.projectCode?.toLowerCase()
                        );
                        if (cur) {
                            this.selectedProjectId = cur.id;
                        }
                    }
                }
            },
            error: (err) => {
                console.warn('Could not fetch project list dynamically:', err);
            },
        });
    }

    ngOnInit(): void {
        this.loadProjects();
        this.loadAllMembers();
    }

    private buildPayload(): any {
        const title = this.taskTitle.trim();
        const selectedProj = this.projectList.find((p) => p.id === this.selectedProjectId);
        const primaryAssignee = this.selectedAssignees.length > 0 ? this.selectedAssignees[0] : null;
        const currentUser = this.data?.user;
        const currentUserName = currentUser?.en_name || currentUser?.name || currentUser?.kh_name || '';

        const effectiveReporter = this.reporterName
            ? {
                  id: this.reporterId ? Number(this.reporterId) : (currentUser?.id || undefined),
                  name: this.reporterName,
                  role: this.reporterRole || 'Reporter',
                  avatar: this.reporterAvatar,
              }
            : (currentUserName
                  ? {
                        id: currentUser?.id,
                        name: currentUserName,
                        role: currentUser?.roles?.[0]?.name_en || currentUser?.roles?.[0]?.name_kh || 'Reporter',
                        avatar: currentUser?.avatar?.uri || null,
                    }
                  : null);

        return {
            title,
            code: this.taskCode,
            task_type: this.selectedTaskType,
            status: this.selectedStatus(),
            priority: this.priority(),
            due_date: this.formatIsoDate(this.endDate),
            start_date: this.formatIsoDate(this.startDate),
            reporter: effectiveReporter,
            reporterName: effectiveReporter?.name || null,
            assignee: primaryAssignee,
            assignees: this.selectedAssignees,
            assigneeNames: this.selectedAssignees.map((m) => m.name).join(', '),
            project_id: this.selectedProjectId,
            project_name: selectedProj?.name || this.data?.projectName || 'Project',
            description: this.description.trim() || title,
            attachments: this.attachedFiles(),
            attachments_count: this.attachedFiles().length,
        };
    }

    submitAndAddAnother(): void {
        const title = this.taskTitle.trim();
        if (!title || this.isSubmitting() || this.isClosing()) return;

        this.isSubmitting.set(true);
        const payload = this.buildPayload();

        this._userTaskService.createTask(payload).subscribe({
            next: () => {
                this.isSubmitting.set(false);
                this.hasCreatedAnyTask = true;
                if (this.data?.onTaskCreated) {
                    this.data.onTaskCreated();
                }
                const savedTitle = title;
                this.successNotice.set(`បានបង្កើត «${savedTitle}» ដោយជោគជ័យ!`);
                this.incrementTaskCode();
                this.taskTitle = '';
                this.description = '';
                this.attachedFiles.set([]);
                setTimeout(() => {
                    this.taskTitleInput?.nativeElement?.focus();
                }, 100);
            },
            error: (err) => {
                console.error('Failed to create task', err);
                this.isSubmitting.set(false);
            },
        });
    }

    private performSmoothClose(result: any = null): void {
        if (this.isClosing()) return;
        this.isClosing.set(true);

        try {
            this.dialogRef.addPanelClass('side-dialog-closing');
            const backdrop =
                ((this.dialogRef as any)._overlayRef?.backdropElement as HTMLElement) ||
                (document.querySelector('.cdk-overlay-backdrop.cdk-overlay-backdrop-showing') as HTMLElement);
            if (backdrop) {
                backdrop.style.transition = 'opacity 200ms cubic-bezier(0.2, 0, 0, 1)';
                backdrop.style.opacity = '0';
            }
        } catch (e) {
            console.warn('Error during smooth close animation', e);
        }

        setTimeout(() => {
            this.dialogRef.close(result);
        }, 190);
    }

    submitAndClose(): void {
        const title = this.taskTitle.trim();
        if (!title || this.isSubmitting() || this.isClosing()) return;

        this.isSubmitting.set(true);
        const payload = this.buildPayload();

        this._userTaskService.createTask(payload).subscribe({
            next: () => {
                this.isSubmitting.set(false);
                if (this.data?.onTaskCreated) {
                    this.data.onTaskCreated();
                }
                this.performSmoothClose({
                    alreadyCreated: true,
                    ...payload,
                });
            },
            error: (err) => {
                console.error('Failed to create task', err);
                this.isSubmitting.set(false);
                this.performSmoothClose(payload);
            },
        });
    }

    cancel(): void {
        this.performSmoothClose(this.hasCreatedAnyTask ? { alreadyCreated: true } : null);
    }

    // =========================================================================
    // ATTACHMENT DRAG & DROP AND FILE HANDLING
    // =========================================================================
    onDragOver(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    }

    onDragEnter(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.dragCounter++;
        if (event.dataTransfer?.types?.includes('Files')) {
            this.isDraggingOver.set(true);
        }
    }

    onDragLeave(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.dragCounter--;
        if (this.dragCounter <= 0) {
            this.dragCounter = 0;
            this.isDraggingOver.set(false);
        }
    }

    onFileDrop(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.dragCounter = 0;
        this.isDraggingOver.set(false);
        if (event.dataTransfer?.files?.length) {
            this.handleIncomingFiles(event.dataTransfer.files);
        }
    }

    onFileInputChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files?.length) {
            this.handleIncomingFiles(input.files);
            input.value = '';
        }
    }

    handleIncomingFiles(fileList: FileList | File[]): void {
        const filesArray = Array.from(fileList);
        const processed: TaskAttachment[] = [];
        let remaining = filesArray.length;

        const checkDone = () => {
            if (remaining === 0 && processed.length > 0) {
                this.attachedFiles.update((prev) => [...prev, ...processed]);
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
                    file.text()
                        .then((txt) => {
                            item.textContent = txt;
                            processed.push(item);
                            remaining--;
                            checkDone();
                        })
                        .catch(() => {
                            processed.push(item);
                            remaining--;
                            checkDone();
                        });
                } else {
                    processed.push(item);
                    remaining--;
                    checkDone();
                }
            };
            reader.onerror = () => {
                const blobUrl = URL.createObjectURL(file);
                processed.push({
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

    removeAttachment(index: number): void {
        this.attachedFiles.update((prev) => prev.filter((_, i) => i !== index));
    }

    formatFileSize(bytes: number): string {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
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
}
