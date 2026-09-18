import { CommonModule } from '@angular/common';
import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild, inject, signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { catchError, finalize, of, Subject, takeUntil } from 'rxjs';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import * as echarts from 'echarts';
import { UserService } from 'app/core/user/user.service';
import { readPreferredRoleId } from 'app/core/auth/resolvers/role.util';
import { DialogConfigService } from 'app/shared/dialog-config.service';
import { CreateProjectDialogComponent } from 'app/resources/2-user/1-home/create-project-dialog/component';
import { CreateMeetingDialogComponent } from 'app/resources/2-user/1-home/create-meeting-dialog/component';
import { AddPlanDialogComponent } from 'app/resources/2-user/3-activity/add-plan-dialog/component';
import { CreateTaskDialogComponent } from './dialogs/create-task-dialog/component';
import { CreatePhaseDialogComponent } from './dialogs/create-phase-dialog/component';
import { CreateMemberDialogComponent } from './dialogs/create-member-dialog/component';
import { CreateLinkDialogComponent } from './dialogs/create-link-dialog/component';
import { AdminService, AdminProject, AdminUser } from '../admin.service';
import { SideDialogCloseButtonComponent } from 'app/shared/side-dialog-close-button/component';
import { TaskDrawerComponent } from 'app/resources/2-user/2-task/task-drawer/component';
import { FilePreviewModalComponent } from 'app/resources/2-user/2-task/file-preview-modal/component';
import {
    TaskItem,
    TaskMember,
    TaskChatMessage,
    TaskAttachment,
    TaskStatus,
    TaskPriority,
    TaskType,
} from 'app/resources/2-user/2-task/models/task.types';
import { UserTaskService } from 'app/resources/2-user/2-task/task.service';
import { resolveFileUrl } from 'helper/shared/file-url';
import { BMS_PROJECT_LOGO, WMS_PROJECT_LOGO, DEFAULT_PROJECT_LOGO, getProjectFallbackLogo } from 'app/resources/2-user/4-plan/component';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import { TaskSocketService } from 'app/core/realtime/task-socket.service';

export interface AgilePlanSegment {
    iteration: 1 | 2 | 3;
    startWeek: number; // 14 to 40
    durationWeeks: number;
    label?: string;
}

export interface AgilePlanTask {
    id: string;
    name: string;
    segments: AgilePlanSegment[];
}

export interface TaskLink {
    id: string;
    title: string;
    url: string;
    type: 'figma' | 'github' | 'doc' | 'external';
    taskCode?: string;
    taskTitle?: string;
    createdAt?: string;
}

export interface TaskDocument {
    id: string;
    name: string;
    size: string;
    type: 'pdf' | 'doc' | 'image' | 'sheet';
    upload_date: string;
    url?: string;
}

export interface ProjectSubtaskItem {
    id: string;
    title: string;
    completed: boolean;
}

export interface ProjectMeetingItem {
    id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    platform: 'Google Meet' | 'Zoom' | 'Microsoft Teams' | 'Office';
    link: string;
    status: 'upcoming' | 'completed' | 'ongoing';
    attendees: TaskMember[];
}

export interface ProjectPhaseItem {
    id: string;
    title: string;
    quarter: string;
    status: 'completed' | 'in_progress' | 'planned';
    startDate: string;
    endDate: string;
    tasksCount: number;
    progress?: number;
}

export interface TaskChatMessageItem {
    id: string;
    sender_name: string;
    sender_avatar?: string | null;
    sender_initial?: string;
    sender_bg?: string;
    text: string;
    time: string;
    is_self: boolean;
    is_system?: boolean;
    attachments?: { name: string; size: string; type: string; url?: string; isImage?: boolean }[];
}

export interface AdminTaskItem {
    id: string;
    code: string;
    title: string;
    description?: string;
    priority: 'urgent' | 'high' | 'medium' | 'low';
    due_date?: string;
    created_at?: string;
    comments_count: number;
    attachments_count: number;
    assignee?: TaskMember | null;
    reporter?: TaskMember | null;
    members?: TaskMember[];
    status: 'review' | 'done' | 'confirmed' | 'reopened' | 'new' | 'in_progress' | 'unconfirmed' | string;
    time_ago: string;
    progress?: number;
    subtasks?: ProjectSubtaskItem[];
    links?: TaskLink[];
    documents?: TaskDocument[];
}

export const DEFAULT_AGILE_TASKS: AgilePlanTask[] = [
    {
        id: 'task-1',
        name: 'ការប្រមូលតម្រូវការ & Architecture',
        segments: [
            { iteration: 1, startWeek: 14, durationWeeks: 2 },
            { iteration: 2, startWeek: 16, durationWeeks: 1 },
            { iteration: 3, startWeek: 17, durationWeeks: 3, label: '3W' },
        ],
    },
    {
        id: 'task-2',
        name: 'ការរចនាទម្រង់ទូទៅ UI/UX Design System',
        segments: [
            { iteration: 1, startWeek: 15, durationWeeks: 3, label: 'Sprint 1' },
            { iteration: 2, startWeek: 18, durationWeeks: 2 },
            { iteration: 3, startWeek: 20, durationWeeks: 4, label: '4W' },
        ],
    },
    {
        id: 'task-3',
        name: 'ការរៀបចំ Database & Rest APIs',
        segments: [
            { iteration: 1, startWeek: 18, durationWeeks: 2 },
            { iteration: 2, startWeek: 20, durationWeeks: 4, label: 'Sprint 2' },
            { iteration: 3, startWeek: 24, durationWeeks: 5, label: '5W' },
        ],
    },
    {
        id: 'task-4',
        name: 'Frontend State & Angular Signals Integration',
        segments: [
            { iteration: 1, startWeek: 22, durationWeeks: 3 },
            { iteration: 2, startWeek: 25, durationWeeks: 3 },
            { iteration: 3, startWeek: 28, durationWeeks: 6, label: 'Sprint 3' },
        ],
    },
    {
        id: 'task-5',
        name: 'ការធ្វើតេស្តសមាហរណកម្ម & UAT QA Testing',
        segments: [
            { iteration: 1, startWeek: 27, durationWeeks: 2 },
            { iteration: 2, startWeek: 29, durationWeeks: 3 },
            { iteration: 3, startWeek: 32, durationWeeks: 5, label: '5W' },
        ],
    },
    {
        id: 'task-6',
        name: 'ការវាយតម្លៃសុវត្ថិភាព & ដាក់ឱ្យដំណើរការ Deployment',
        segments: [
            { iteration: 1, startWeek: 31, durationWeeks: 2 },
            { iteration: 2, startWeek: 33, durationWeeks: 3 },
            { iteration: 3, startWeek: 36, durationWeeks: 4, label: 'Release' },
        ],
    },
];

export const DEFAULT_PROJECT_TASKS: AdminTaskItem[] = [];

export const DEFAULT_PROJECT_PHASES: ProjectPhaseItem[] = [
    {
        id: 'ph-1',
        title: 'ដំណាក់កាលទី ១៖ តម្រូវការ & គម្រោងប្លង់ UI/UX (Phase 1)',
        quarter: 'ត្រីមាសទី ២ (Q2)',
        status: 'completed',
        startDate: '០១ មេសា ២០២៦',
        endDate: '៣០ មិថុនា ២០២៦',
        tasksCount: 6,
    },
    {
        id: 'ph-2',
        title: 'ដំណាក់កាលទី ២៖ ការអភិវឌ្ឍ Core Modules & State Signals (Phase 2)',
        quarter: 'ត្រីមាសទី ៣ (Q3)',
        status: 'in_progress',
        startDate: '០១ កក្កដា ២០២៦',
        endDate: '៣០ កញ្ញា ២០២៦',
        tasksCount: 12,
    },
    {
        id: 'ph-3',
        title: 'ដំណាក់កាលទី ៣៖ ការធ្វើតេស្ត QA, Security Audit & Deploy (Phase 3)',
        quarter: 'ត្រីមាសទី ៤ (Q4)',
        status: 'planned',
        startDate: '០១ តុលា ២០២៦',
        endDate: '៣១ ធ្នូ ២០២៦',
        tasksCount: 6,
    },
];

export const DEFAULT_PROJECT_TEAM_MEMBERS: TaskMember[] = [
    { id: 1, name: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត', role: 'Super Admin & Lead Developer', initial: 'PP', bgClass: 'bg-emerald-600 text-white', email: 'pisethpanhavorn544@gmail.com' },
    { id: 2, name: 'ពុំ ប្រុសមុន្នី', role: 'Frontend Engineer', initial: 'PB', bgClass: 'bg-blue-600 text-white', email: 'pumprusmuny@example.com' },
    { id: 3, name: 'ថា វីនណឺរ', role: 'QA & DevOps Engineer', initial: 'TW', bgClass: 'bg-blue-700 text-white', email: 'thawinner@example.com' },
];

export const DEFAULT_PROJECT_MEETINGS: ProjectMeetingItem[] = [
    {
        id: 'm-1',
        title: 'Weekly Sprint Sync & Task Progress Review',
        description: 'ពិនិត្យមើលវឌ្ឍនភាពការងារប្រចាំសប្តាហ៍ បញ្ហាស្ទះ (Blockers) និងកាលវិភាគ Sprint បន្ទាប់។',
        date: 'ថ្ងៃនេះ (Today)',
        time: 'ម៉ោង ០២:០០ រសៀល - ០៣:០០ រសៀល',
        platform: 'Google Meet',
        link: 'https://meet.google.com/pms-sync-2026',
        status: 'upcoming',
        attendees: [
            { id: 1, name: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត', role: 'Super Admin', initial: 'PP', bgClass: 'bg-emerald-600' },
            { id: 2, name: 'ពុំ ប្រុសមុន្នី', role: 'User', initial: 'PB', bgClass: 'bg-blue-600' },
            { id: 3, name: 'ថា វីនណឺរ', role: 'User', initial: 'TW', bgClass: 'bg-blue-700' },
        ],
    },
    {
        id: 'm-2',
        title: 'UI/UX Design Review & Department Flow Alignment',
        description: 'ពិភាក្សាលើ Design Specs នៃ Department Hierarchy ក្នុង Figma ជាមួយក្រុម UI/UX។',
        date: 'ថ្ងៃស្អែក (Tomorrow)',
        time: 'ម៉ោង ១០:០០ ព្រឹក - ១១:០០ ព្រឹក',
        platform: 'Zoom',
        link: 'https://zoom.us/j/987654321',
        status: 'upcoming',
        attendees: [
            { id: 1, name: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត', role: 'Super Admin', initial: 'PP', bgClass: 'bg-emerald-600' },
            { id: 2, name: 'ពុំ ប្រុសមុន្នី', role: 'User', initial: 'PB', bgClass: 'bg-blue-600' },
        ],
    },
    {
        id: 'm-3',
        title: 'Monthly Architecture & Security Retrospective',
        description: 'កិច្ចប្រជុំបូកសរុបរចនាសម្ព័ន្ធប្រព័ន្ធ សុវត្ថិភាពទិន្នន័យ និងផែនការកែលម្អប្រចាំខែ។',
        date: '២៥ សីហា ២០២៦',
        time: 'ម៉ោង ០៣:៣០ រសៀល',
        platform: 'Office',
        link: 'បន្ទប់ប្រជុំ A2',
        status: 'completed',
        attendees: [
            { id: 1, name: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត', role: 'Super Admin', initial: 'PP', bgClass: 'bg-emerald-600' },
            { id: 3, name: 'រ័ត្ន វិចិត្រ', role: 'DevOps / QA', initial: 'R', bgClass: 'bg-blue-800' },
        ],
    },
];

export const DEFAULT_PROJECT_LINKS: TaskLink[] = [
    {
        id: 'l-1',
        title: 'Git Repository — WFM Enterprise V2',
        url: 'https://github.com/vorn45/wfm-v2',
        type: 'github',
        taskCode: '#WMS-CORE',
    },
    {
        id: 'l-2',
        title: 'Figma Design System & Token UI Kit',
        url: 'https://figma.com/file/wfm-design-v2',
        type: 'figma',
        taskCode: '#BMS-UI',
    },
    {
        id: 'l-3',
        title: 'Swagger API Documentation & Specifications',
        url: 'http://localhost:3000/api/docs',
        type: 'doc',
        taskCode: '#WMS-API',
    },
    {
        id: 'l-4',
        title: 'Security Compliance & Audit Checklist',
        url: 'https://docs.google.com/spreadsheets/wfm-security-audit',
        type: 'doc',
        taskCode: '#WMS-0002',
    },
    {
        id: 'l-5',
        title: 'System Architecture & Database Schema Diagram',
        url: 'https://dbdiagram.io/d/wfm-enterprise-schema',
        type: 'external',
        taskCode: '#WMS-0000',
    },
    {
        id: 'l-6',
        title: 'Sprint 2 Planning Board & Milestones',
        url: 'https://jira.wfm.gov.kh/projects/WFM/boards/2',
        type: 'external',
        taskCode: '#BMS-SPRINT2',
    },
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
        MatDialogModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        SideDialogCloseButtonComponent,
        TaskDrawerComponent,
        FilePreviewModalComponent,
    ],
    templateUrl: './template.html',
    styleUrl: './style.scss',
    styles: [`
        :host {
            display: block;
            font-family: 'Kantumruy Pro', sans-serif !important;
            font-size: 16px;
        }
    `],
})
export class ProjectManagementComponent implements OnInit, AfterViewInit, OnDestroy {
    private readonly _adminService = inject(AdminService);
    private readonly _fb = inject(FormBuilder);
    private readonly _matDialog = inject(MatDialog);
    private readonly _dialogConfigService = inject(DialogConfigService);
    private readonly _userService = inject(UserService);
    private readonly _userTaskService = inject(UserTaskService);
    private readonly _route = inject(ActivatedRoute);
    private readonly _snackbarService = inject(SnackbarService);
    private readonly _taskSocket = inject(TaskSocketService);
    private readonly _destroy$ = new Subject<void>();

    projects = signal<AdminProject[]>([]);
    users = signal<AdminUser[]>([]);
    loading = signal<boolean>(true);

    searchQuery = signal<string>('');
    statusFilter = signal<string>('all');

    // Selected Project for Scenario B
    selectedProject = signal<AdminProject | null>(null);
    projectNavTab = signal<'general' | 'plan' | 'tasks' | 'phases' | 'team' | 'meetings' | 'links'>('tasks');
    taskViewMode = signal<'list' | 'board'>('list');
    taskSearchQuery = signal<string>('');
    subtaskFilter = signal<string>('all');

    isAdmin = computed(() => {
        const u: any = this._userService.getUser();
        if (!u) return true;

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

        if (!activeRole) return true;

        const slug = (activeRole.slug || '').toLowerCase().trim();
        const nameEn = (activeRole.name_en || activeRole.name || '').toLowerCase().trim();
        const nameKh = (activeRole.name_kh || '').trim();

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
    });

    taskCounts = computed(() => {
        const list = this.tasks();
        return {
            all: list.length,
            new: list.filter((t) => (t.status || '').toLowerCase() === 'new' || (t.status || '').toLowerCase() === 'pending').length,
            confirmed: list.filter((t) => (t.status || '').toLowerCase() === 'confirmed').length,
            unconfirmed: list.filter((t) => (t.status || '').toLowerCase() === 'unconfirmed' || (t.status || '').toLowerCase() === 'todo').length,
            in_progress: list.filter((t) => (t.status || '').toLowerCase() === 'in_progress').length,
            in_review: list.filter((t) => (t.status || '').toLowerCase() === 'in_review' || (t.status || '').toLowerCase() === 'review').length,
            reopened: list.filter((t) => (t.status || '').toLowerCase() === 'reopened').length,
            done: list.filter((t) => (t.status || '').toLowerCase() === 'done' || (t.status || '').toLowerCase() === 'completed').length,
        };
    });

    taskToDelete = signal<AdminTaskItem | null>(null);
    showDeleteTaskModal = signal<boolean>(false);

    // Collections
    tasks = signal<AdminTaskItem[]>([]);
    isTasksLoading = signal<boolean>(false);
    phases = signal<ProjectPhaseItem[]>(DEFAULT_PROJECT_PHASES);
    teamMembers = signal<TaskMember[]>(DEFAULT_PROJECT_TEAM_MEMBERS);
    meetings = signal<ProjectMeetingItem[]>(DEFAULT_PROJECT_MEETINGS);
    links = signal<TaskLink[]>(DEFAULT_PROJECT_LINKS);
    agileTasks = signal<AgilePlanTask[]>(DEFAULT_AGILE_TASKS);

    // Links search and clipboard
    linkSearchQuery = signal<string>('');
    linkTypeFilter = signal<string>('all');
    copiedLinkId = signal<string | null>(null);

    // Unified Task Drawer & Chat Conversation State
    selectedTaskDrawerItem = signal<TaskItem | null>(null);
    showTaskDrawer = signal<boolean>(false);
    taskDrawerDialogMode = signal<'details' | 'chat'>('chat');
    taskDrawerChatMessages = signal<TaskChatMessage[]>([]);
    previewImageModal = signal<string | null>(null);
    previewFileModal = signal<TaskAttachment | null>(null);
    private _drawerChatHistoryMap = new Map<string | number, TaskChatMessage[]>();

    allTaskFiles = computed<TaskAttachment[]>(() => {
        const files: TaskAttachment[] = [];
        const currentTask = this.selectedTaskDrawerItem();
        if (!currentTask) return [];

        const adminTask = this.tasks().find((t) => t.id === currentTask.id);
        if (adminTask?.documents && Array.isArray(adminTask.documents)) {
            adminTask.documents.forEach((d) => {
                files.push({
                    name: d.name,
                    size: d.size,
                    type: d.type,
                    url: d.url,
                    isImage: d.type === 'image',
                });
            });
        }
        if (adminTask && (adminTask as any).attachments && Array.isArray((adminTask as any).attachments)) {
            files.push(...(adminTask as any).attachments);
        }

        this.taskDrawerChatMessages().forEach((m) => {
            if (m.attachments && Array.isArray(m.attachments)) {
                files.push(...m.attachments);
            }
        });

        const seen = new Set<string>();
        return files.filter((f) => {
            const key = f.url || f.name;
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    });

    // Active Task Modal / Drawer (Legacy compatibility)
    activeTaskModal = signal<AdminTaskItem | null>(null);
    activeDetailTab = signal<'chat' | 'subtasks' | 'members' | 'links' | 'documents'>('chat');
    newChatMessageText = signal<string>('');
    pendingChatAttachments = signal<{ name: string; size: string; type: string; url?: string; isImage?: boolean }[]>([]);
    currentTaskChatMessages = signal<TaskChatMessageItem[]>([]);
    private _taskChatMap: Map<string, TaskChatMessageItem[]> = new Map();

    // In-modal task detail inputs
    newSubtaskTitle = signal<string>('');
    newLinkTitle = signal<string>('');
    newLinkUrl = signal<string>('');
    showAddLinkForm = signal<boolean>(false);

    // Gantt / Timeline Configuration (Weeks 14 to 40 = 27 weeks total)
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

    // ECharts references
    @ViewChild('progressChartRef') progressChartRef?: ElementRef<HTMLDivElement>;
    @ViewChild('taskDistributionChartRef') taskDistributionChartRef?: ElementRef<HTMLDivElement>;
    private _progressChart?: echarts.ECharts;
    private _distributionChart?: echarts.ECharts;
    private _resizeObserver?: ResizeObserver;

    // Drawer & Modal States
    isDrawerOpen = signal<boolean>(false);
    isEditing = signal<boolean>(false);
    editingProject = signal<AdminProject | null>(null);
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
        const q = this.taskSearchQuery().toLowerCase().trim();
        let list = this.tasks();
        if (q) {
            list = list.filter((t) =>
                t.title?.toLowerCase().includes(q) ||
                t.code?.toLowerCase().includes(q) ||
                t.description?.toLowerCase().includes(q),
            );
        }
        const filter = this.subtaskFilter();
        if (filter !== 'all') {
            list = list.filter((t) => t.status === filter);
        }
        return list;
    });

    allProjectLinks = computed(() => {
        const q = this.linkSearchQuery().toLowerCase().trim();
        const filter = this.linkTypeFilter();
        const proj = this.selectedProject();

        const list: {
            id: string;
            title: string;
            url: string;
            type: 'figma' | 'github' | 'doc' | 'external';
            taskCode: string;
            taskTitle: string;
        }[] = [];

        const seenIds = new Set<string>();

        // Project-level links
        for (const l of this.links()) {
            if (!seenIds.has(l.id)) {
                seenIds.add(l.id);
                list.push({
                    id: l.id,
                    title: l.title,
                    url: l.url,
                    type: l.type,
                    taskCode: l.taskCode || `#${proj?.code || 'PMS'}-001`,
                    taskTitle: proj?.name || 'ឯកសារគម្រោង',
                });
            }
        }

        // Task-level links
        for (const t of this.tasks()) {
            if (t.links) {
                for (const l of t.links) {
                    if (!seenIds.has(l.id)) {
                        seenIds.add(l.id);
                        list.push({
                            id: l.id,
                            title: l.title,
                            url: l.url,
                            type: l.type,
                            taskCode: t.code || `#${proj?.code || 'PMS'}-001`,
                            taskTitle: t.title || proj?.name || 'ការងារគម្រោង',
                        });
                    }
                }
            }
        }

        return list.filter((item) => {
            const matchesQuery =
                !q ||
                item.title.toLowerCase().includes(q) ||
                item.url.toLowerCase().includes(q) ||
                item.taskCode.toLowerCase().includes(q);
            const matchesType = filter === 'all' || item.type === filter;
            return matchesQuery && matchesType;
        });
    });

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
                title: 'កំពុងធ្វើ',
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
                title: 'បញ្ចប់',
                count: tasks.filter((t) => t.status === 'done' || t.status === 'completed').length,
                badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50',
                dotClass: 'bg-emerald-500',
                tasks: tasks.filter((t) => t.status === 'done' || t.status === 'completed'),
            },
        ];
    });

    taskStatusDistribution = computed(() => {
        const tasks = this.tasks();
        const counts = {
            done: tasks.filter((t) => t.status === 'done' || t.status === 'completed').length,
            review: tasks.filter((t) => t.status === 'review').length,
            in_progress: tasks.filter((t) => t.status === 'in_progress').length,
            confirmed: tasks.filter((t) => t.status === 'confirmed').length,
            reopened: tasks.filter((t) => t.status === 'reopened').length,
            new: tasks.filter((t) => t.status === 'new').length,
            unconfirmed: tasks.filter((t) => t.status === 'unconfirmed').length,
        };
        return [
            { key: 'done', name: 'បញ្ចប់', count: counts.done || 2, color: '#10b981' },
            { key: 'review', name: 'ស្នើសុំពិនិត្យ', count: counts.review || 1, color: '#0284c7' },
            { key: 'in_progress', name: 'កំពុងធ្វើ', count: counts.in_progress || 1, color: '#f59e0b' },
            { key: 'confirmed', name: 'បញ្ជាក់', count: counts.confirmed || 1, color: '#8b5cf6' },
            { key: 'reopened', name: 'បើកឡើងវិញ', count: counts.reopened || 1, color: '#f43f5e' },
            { key: 'new', name: 'ថ្មី', count: counts.new || 1, color: '#64748b' },
            { key: 'unconfirmed', name: 'មិនបញ្ជាក់', count: counts.unconfirmed || 1, color: '#94a3b8' },
        ];
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
            logo: [''],
            image: [''],
        });

        this.budgetForm = this._fb.group({
            budget: [0, [Validators.required, Validators.min(0)]],
            spent: [0, [Validators.min(0)]],
        });
    }

    ngOnInit(): void {
        this.loadData();

        // Real-time task comments & chat updates
        this._taskSocket
            .taskCommentUpdates()
            .pipe(takeUntil(this._destroy$))
            .subscribe((evt) => {
                const taskIdStr = String(evt.task_id);
                const currentModal = this.selectedTaskDrawerItem();

                // 1. Live update task counters in the project task list
                this.tasks.update((items) =>
                    items.map((t) => {
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
                    })
                );

                // 2. If task details modal / drawer is currently open for this task
                if (currentModal) {
                    const modalIdClean = String(currentModal.id).replace(/\D/g, '') || String(currentModal.id);
                    const incomingIdClean = taskIdStr.replace(/\D/g, '') || taskIdStr;

                    if (modalIdClean === incomingIdClean || String(currentModal.id) === taskIdStr) {
                        currentModal.comments_count = evt.comments_count ?? (currentModal.comments_count || 0) + 1;
                        if (evt.attachments_count !== undefined) {
                            currentModal.attachments_count = evt.attachments_count;
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

                            const updated = [...currentMsgs, incomingMsg];
                            this.taskDrawerChatMessages.set(updated);
                            this._drawerChatHistoryMap.set(currentModal.id, updated);
                        }
                    }
                }
            });

        this._route.queryParams.subscribe((params) => {
            const taskCode = (params['taskCode'] || params['task_code'] || '').trim().toLowerCase();
            const taskId = (params['taskId'] || params['task_id'] || '').trim();
            if (taskCode || taskId) {
                setTimeout(() => {
                    const matched = this.tasks().find(
                        (t) => (taskCode && t.code?.toLowerCase() === taskCode) || (taskId && String(t.id) === taskId)
                    );
                    if (matched) {
                        if (!this.selectedProject() && this.projects().length > 0) {
                            this.selectProject(this.projects()[0]);
                        }
                        this.setNavTab('tasks');
                        this.openTaskModal(matched, 'chat');
                    }
                }, 300);
            }
        });
    }

    ngAfterViewInit(): void {
        this.setupResizeObserver();
    }

    ngOnDestroy(): void {
        this._destroy$.next();
        this._destroy$.complete();
        this._resizeObserver?.disconnect();
        this.disposeCharts();
    }

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

    setNavTab(tab: 'general' | 'plan' | 'tasks' | 'phases' | 'team' | 'meetings' | 'links'): void {
        this.projectNavTab.set(tab);
        if (tab === 'general') {
            setTimeout(() => {
                this.initProjectCharts();
            }, 100);
        }
    }

    // Task details modal methods (Unified TaskDrawerComponent)
    openTaskModal(task: AdminTaskItem, mode: 'details' | 'chat' = 'chat'): void {
        this.activeTaskModal.set(task);
        this.activeDetailTab.set(mode === 'details' ? 'subtasks' : 'chat');
        this.showAddLinkForm.set(false);
        this.loadTaskChat(task);

        const mappedTask = this.mapToTaskItem(task);
        this.selectedTaskDrawerItem.set(mappedTask);
        this.taskDrawerDialogMode.set(mode);
        this.showTaskDrawer.set(true);
        this.loadTaskDrawerChat(task);
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
        this.activeTaskModal.set(null);
        this.showAddLinkForm.set(false);
        this.pendingChatAttachments.set([]);
        this.newChatMessageText.set('');
    }

    closeTaskModal(): void {
        this.closeTaskDrawer();
    }

    mapToTaskItem(task: AdminTaskItem): TaskItem {
        const proj = this.selectedProject();
        const reporterMember: TaskMember = task.reporter ? {
            id: task.reporter.id,
            name: task.reporter.name,
            role: task.reporter.role,
            avatar: task.reporter.avatar || '/images/placeholder/avatar.jpg',
            initial: task.reporter.initial,
            bgClass: task.reporter.bgClass,
            email: task.reporter.email,
        } : {
            id: 1,
            name: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត',
            role: 'Super Admin',
            avatar: '/images/placeholder/avatar.jpg',
        };

        const assigneeMember: TaskMember = task.assignee ? {
            id: task.assignee.id,
            name: task.assignee.name,
            role: task.assignee.role,
            avatar: task.assignee.avatar || '/images/placeholder/avatar.jpg',
            initial: task.assignee.initial,
            bgClass: task.assignee.bgClass,
            email: task.assignee.email,
        } : {
            id: 0,
            name: 'មិនទាន់ចាត់តាំង',
        };

        const assigneesList: TaskMember[] = (task.members && task.members.length > 0)
            ? task.members.map((m) => ({
                  id: m.id,
                  name: m.name,
                  role: m.role,
                  avatar: m.avatar || '/images/placeholder/avatar.jpg',
                  initial: m.initial,
                  bgClass: m.bgClass,
                  email: m.email,
              }))
            : task.assignee
            ? [assigneeMember]
            : [];

        return {
            id: task.id,
            code: task.code,
            title: task.title,
            description: task.description || '',
            module: proj?.code || 'PROJECT',
            task_type: 'feature',
            status: task.status,
            priority: task.priority,
            progress: task.progress || 0,
            comments_count: task.comments_count || 0,
            attachments_count: task.attachments_count || 0,
            due_date: task.due_date || null,
            project_id: proj ? String(proj.id) : '1',
            project_name: proj ? proj.name : 'Project',
            reporter: reporterMember,
            assignee: assigneeMember,
            assignees: assigneesList,
            created_at: task.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
    }

    loadTaskDrawerChat(task: AdminTaskItem): void {
        const numericId = parseInt(String(task.id).replace(/\D/g, ''), 10);
        if (!isNaN(numericId)) {
            this._taskSocket.joinTask(numericId);
        }

        const cached = this._drawerChatHistoryMap.get(task.id);
        if (cached && cached.length > 0) {
            this.taskDrawerChatMessages.set([...cached]);
            return;
        }

        const reporterName = task.reporter?.name || 'ពិសិដ្ឋ បញ្ញាវ័ន្ត';
        const assigneeName = task.assignee?.name || (task.members?.[0]?.name) || '';

        const initialMsgs: TaskChatMessage[] = [
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
                sender_id: task.reporter?.id || 1,
                sender_name: reporterName,
                sender_avatar: task.reporter?.avatar || '/images/placeholder/avatar.jpg',
                text: `សួស្តីក្រុមការងារ! សូមពិនិត្យមើលព័ត៌មានលម្អិត និងកិច្ចការសម្រាប់ ${task.title} នេះផង។`,
                time: '១០ នាទីមុន',
                is_self: false,
                is_system: false,
            },
        ];

        if (assigneeName) {
            initialMsgs.push({
                id: 3,
                sender_id: task.assignee?.id || 2,
                sender_name: assigneeName,
                sender_avatar: task.assignee?.avatar || '/images/placeholder/avatar.jpg',
                text: 'បានទទួលហើយបង! ខ្ញុំកំពុងត្រៀមអនុវត្ត និងធ្វើតេស្តតាមដំណាក់កាល។',
                time: '៥ នាទីមុន',
                is_self: false,
                is_system: false,
            });
        }

        this.taskDrawerChatMessages.set(initialMsgs);
        this._drawerChatHistoryMap.set(task.id, initialMsgs);

        // Fetch live comments from backend if available
        if (!isNaN(numericId)) {
            this._userTaskService.getTaskComments(numericId).subscribe({
                next: (res) => {
                    if (res?.data?.comments && res.data.comments.length > 0) {
                        const currentUser = this._userService.getUser();
                        const currentUserName = (currentUser?.en_name || currentUser?.name || currentUser?.kh_name || '').toLowerCase().trim();
                        const currentUserId = currentUser?.id;

                        const mapped = (res.data.comments as TaskChatMessage[]).map((c) => {
                            let displayTime = c.time;
                            if (c.created_at) {
                                const d = new Date(c.created_at);
                                if (!isNaN(d.getTime())) {
                                    displayTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                }
                            }
                            if (c.is_system) return { ...c, time: displayTime, is_self: false, is_system: true };
                            const senderName = (c.sender_name || '').toLowerCase().trim();
                            const isSelf = Boolean(
                                (currentUserName && (senderName === currentUserName || currentUserName.includes(senderName) || senderName.includes(currentUserName))) ||
                                (currentUserId && c.sender_id === currentUserId) ||
                                c.is_self
                            );
                            return { ...c, time: displayTime, is_self: isSelf };
                        });
                        this.taskDrawerChatMessages.set(mapped);
                        this._drawerChatHistoryMap.set(task.id, mapped);
                    }
                },
                error: () => {},
            });
        }
    }

    onTaskDrawerSendMessage(payload: { text: string; attachments: TaskAttachment[] }): void {
        const text = payload.text.trim();
        const attachments = payload.attachments || [];
        if (!text && attachments.length === 0) return;

        const currentTask = this.selectedTaskDrawerItem();
        if (!currentTask) return;

        const user = this._userService.getUser();
        const userAvatar = this.getCurrentUserAvatar();
        const tempId = Date.now();

        const newMsg: TaskChatMessage = {
            id: tempId,
            sender_id: user?.id,
            sender_name: user?.kh_name || user?.en_name || 'អ្នកគ្រប់គ្រង (Admin)',
            sender_avatar: userAvatar,
            text: text || (attachments.length > 0 ? 'បានផ្ញើឯកសារ' : ''),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            is_self: true,
            attachments: attachments.length > 0 ? [...attachments] : undefined,
            seen_by: [],
        };

        const currentList = this._drawerChatHistoryMap.get(currentTask.id) || [];
        const updatedList = [...currentList, newMsg];
        this._drawerChatHistoryMap.set(currentTask.id, updatedList);
        this.taskDrawerChatMessages.set(updatedList);

        // Update counts on task item
        const newCommentsCount = (currentTask.comments_count || 0) + 1;
        const newAttCount = (currentTask.attachments_count || 0) + attachments.length;

        this.selectedTaskDrawerItem.update((t) =>
            t ? { ...t, comments_count: newCommentsCount, attachments_count: newAttCount } : null
        );

        this.tasks.update((items) =>
            items.map((t) =>
                t.id === currentTask.id
                    ? { ...t, comments_count: newCommentsCount, attachments_count: newAttCount }
                    : t
            )
        );

        // Attempt backend sync if valid ID
        const numericId = parseInt(String(currentTask.id).replace(/\D/g, ''), 10);
        if (!isNaN(numericId)) {
            this._userTaskService.createTaskComment(numericId, { text: newMsg.text, attachments }).subscribe({
                next: (res) => {
                    if (res?.data) {
                        const serverComment = res.data;
                        this.taskDrawerChatMessages.update((msgs) => {
                            const updated = msgs.map((m) =>
                                m.id === tempId ? { ...m, id: serverComment.id, created_at: serverComment.created_at } : m
                            );
                            this._drawerChatHistoryMap.set(currentTask.id, updated);
                            return updated;
                        });
                    }
                },
                error: (err) => console.error('Failed to sync comment with server', err),
            });
        }
    }

    onTaskDrawerStatusChange(event: { task: TaskItem; status: string }): void {
        this.selectedTaskDrawerItem.update((t) => (t ? { ...t, status: event.status } : null));
        this.tasks.update((items) =>
            items.map((t) => (t.id === event.task.id ? { ...t, status: event.status } : t))
        );
        const numericId = parseInt(String(event.task.id).replace(/\D/g, ''), 10);
        if (!isNaN(numericId)) {
            this._userTaskService.updateTask(numericId, { status: event.status }).subscribe({ error: () => {} });
        }
    }

    onTaskDrawerTypeChange(event: { task: TaskItem; taskType: string }): void {
        this.selectedTaskDrawerItem.update((t) => (t ? { ...t, task_type: event.taskType } : null));
        const numericId = parseInt(String(event.task.id).replace(/\D/g, ''), 10);
        if (!isNaN(numericId)) {
            this._userTaskService.updateTask(numericId, { task_type: event.taskType } as any).subscribe({ error: () => {} });
        }
    }

    onTaskDrawerPriorityChange(event: { task: TaskItem; priority: string }): void {
        this.selectedTaskDrawerItem.update((t) => (t ? { ...t, priority: event.priority as any } : null));
        this.tasks.update((items) =>
            items.map((t) => (t.id === event.task.id ? { ...t, priority: event.priority as any } : t))
        );
        const numericId = parseInt(String(event.task.id).replace(/\D/g, ''), 10);
        if (!isNaN(numericId)) {
            this._userTaskService.updateTask(numericId, { priority: event.priority as any }).subscribe({ error: () => {} });
        }
    }

    onTaskDrawerDueDateChange(event: { task: TaskItem; dueDate: string | null }): void {
        this.selectedTaskDrawerItem.update((t) => (t ? { ...t, due_date: event.dueDate } : null));
        this.tasks.update((items) =>
            items.map((t) => (t.id === event.task.id ? { ...t, due_date: event.dueDate || undefined } : t))
        );
        const numericId = parseInt(String(event.task.id).replace(/\D/g, ''), 10);
        if (!isNaN(numericId)) {
            this._userTaskService.updateTask(numericId, { due_date: event.dueDate }).subscribe({ error: () => {} });
        }
    }

    onTaskDrawerTitleChange(event: { task: TaskItem; title: string }): void {
        this.selectedTaskDrawerItem.update((t) => (t ? { ...t, title: event.title } : null));
        this.tasks.update((items) =>
            items.map((t) => (t.id === event.task.id ? { ...t, title: event.title } : t))
        );
        const numericId = parseInt(String(event.task.id).replace(/\D/g, ''), 10);
        if (!isNaN(numericId)) {
            this._userTaskService.updateTask(numericId, { title: event.title }).subscribe({ error: () => {} });
        }
    }

    onTaskDrawerDescriptionChange(event: { task: TaskItem; description: string }): void {
        this.selectedTaskDrawerItem.update((t) => (t ? { ...t, description: event.description } : null));
        this.tasks.update((items) =>
            items.map((t) => (t.id === event.task.id ? { ...t, description: event.description } : t))
        );
        const numericId = parseInt(String(event.task.id).replace(/\D/g, ''), 10);
        if (!isNaN(numericId)) {
            this._userTaskService.updateTask(numericId, { description: event.description }).subscribe({ error: () => {} });
        }
    }

    onTaskDrawerAssigneeToggle(event: { task: TaskItem; member: TaskMember }): void {
        const currentAssignees = event.task.assignees ? [...event.task.assignees] : [];
        const index = currentAssignees.findIndex((m) => m.id === event.member.id);
        let updatedAssignees: TaskMember[];
        if (index >= 0) {
            updatedAssignees = currentAssignees.filter((m) => m.id !== event.member.id);
        } else {
            updatedAssignees = [...currentAssignees, event.member];
        }
        const primaryAssignee = updatedAssignees[0] || { id: 0, name: 'មិនទាន់ចាត់តាំង' };

        this.selectedTaskDrawerItem.update((t) =>
            t ? { ...t, assignee: primaryAssignee, assignees: updatedAssignees } : null
        );
        this.tasks.update((items) =>
            items.map((t) =>
                t.id === event.task.id
                    ? {
                          ...t,
                          assignee: primaryAssignee,
                          members: updatedAssignees,
                      }
                    : t
            )
        );
    }

    onTaskDrawerReporterChange(event: { task: TaskItem; member: TaskMember }): void {
        this.selectedTaskDrawerItem.update((t) => (t ? { ...t, reporter: event.member } : null));
        this.tasks.update((items) =>
            items.map((t) => (t.id === event.task.id ? { ...t, reporter: event.member } : t))
        );
    }

    onTaskDrawerDelete(task: TaskItem): void {
        this.tasks.update((items) => items.filter((t) => t.id !== task.id));
        this.closeTaskDrawer();
        const numericId = parseInt(String(task.id).replace(/\D/g, ''), 10);
        if (!isNaN(numericId)) {
            this._userTaskService.deleteTask(numericId).subscribe({ error: () => {} });
        }
    }

    viewTaskFile(file: TaskAttachment): void {
        const isImg = file.isImage || /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(file.name || '') || (file.type ? file.type.startsWith('image/') : false);
        if (isImg && file.url) {
            this.openImagePreview(file.url);
        } else {
            this.previewFileModal.set(file);
        }
    }

    openImagePreview(url: string): void {
        this.previewImageModal.set(url);
    }

    closeFilePreview(): void {
        this.previewFileModal.set(null);
        this.previewImageModal.set(null);
    }

    downloadTaskFile(file: TaskAttachment): void {
        if (!file.url) return;
        const a = document.createElement('a');
        a.href = file.url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    getCurrentUserAvatar(): string {
        const user = this._userService.getUser();
        return resolveFileUrl(user?.avatar) || '/images/placeholder/avatar.jpg';
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
        const cur = this._userService.getUser();
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

        const usersList = this.users();
        if (usersList && usersList.length > 0) {
            const found = usersList.find((u: any) => {
                const uId = u.id ? Number(u.id) : null;
                const uPhone = (u.phone || '').replace(/\D/g, '');
                return (memberId && uId && memberId === uId) ||
                       (targetPhone && uPhone && targetPhone === uPhone);
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

    loadTaskChat(task: AdminTaskItem): void {
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
                    sender_name: 'ពុំ ប្រុសមុន្នី',
                    sender_initial: 'PB',
                    sender_bg: 'bg-blue-600',
                    text: `សួស្តីក្រុមការងារ! សូមពិនិត្យមើលព័ត៌មានលម្អិត និងកិច្ចការរងសម្រាប់ ${task.title} នេះផង។`,
                    time: '១០ នាទីមុន',
                    is_self: false,
                    is_system: false,
                },
                {
                    id: `msg-${Date.now()}-3`,
                    sender_name: 'ថា វីនណឺរ',
                    sender_initial: 'TW',
                    sender_bg: 'bg-blue-700',
                    text: 'បានទទួលហើយបង! ខ្ញុំកំពុងត្រៀមអនុវត្ត និងធ្វើតេស្តតាមដំណាក់កាល។',
                    time: '៥ នាទីមុន',
                    is_self: false,
                    is_system: false,
                },
            ];
            this._taskChatMap.set(task.id, initialChats);
        }
        this.currentTaskChatMessages.set([...(this._taskChatMap.get(task.id) || [])]);
    }

    sendTaskChatMessage(task: AdminTaskItem): void {
        const text = this.newChatMessageText().trim();
        const pendingAtts = [...this.pendingChatAttachments()];

        if (!text && pendingAtts.length === 0) return;

        const newMsg: TaskChatMessageItem = {
            id: `msg-${Date.now()}`,
            sender_name: 'អ្នកគ្រប់គ្រង (Admin)',
            sender_initial: 'AD',
            sender_bg: 'bg-blue-600',
            text: text,
            time: 'ទើបតែផ្ញើ',
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

    onChatFileSelected(event: Event, task: AdminTaskItem): void {
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

    toggleSubtask(task: AdminTaskItem, subtask: ProjectSubtaskItem): void {
        subtask.completed = !subtask.completed;
        if (task.subtasks) {
            const total = task.subtasks.length;
            const done = task.subtasks.filter((s) => s.completed).length;
            task.progress = total > 0 ? Math.round((done / total) * 100) : 0;
            if (task.progress === 100) {
                task.status = 'done';
            } else if (task.progress > 0) {
                task.status = 'in_progress';
            }
        }
    }

    addSubtask(task: AdminTaskItem): void {
        const title = this.newSubtaskTitle().trim();
        if (!title) return;
        if (!task.subtasks) task.subtasks = [];
        task.subtasks.push({
            id: `st-${Date.now()}`,
            title,
            completed: false,
        });
        this.newSubtaskTitle.set('');
        const total = task.subtasks.length;
        const done = task.subtasks.filter((s) => s.completed).length;
        task.progress = Math.round((done / total) * 100);
    }

    addLink(task: AdminTaskItem): void {
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

        if (!task.links) task.links = [];
        task.links.push({
            id: `link-${Date.now()}`,
            title,
            url,
            type,
            taskCode: task.code,
        });

        this.newLinkTitle.set('');
        this.newLinkUrl.set('');
        this.showAddLinkForm.set(false);
    }

    removeLink(task: AdminTaskItem, linkId: string): void {
        if (task.links) {
            task.links = task.links.filter((l) => l.id !== linkId);
        }
    }

    triggerUploadDocument(task: AdminTaskItem): void {
        if (!task.documents) task.documents = [];
        const sampleDocs: TaskDocument[] = [
            { id: `doc-${Date.now()}`, name: 'System_Functional_Requirements_v1.pdf', size: '1.9 MB', type: 'pdf', upload_date: 'ថ្ងៃនេះ' },
            { id: `doc-${Date.now() + 1}`, name: 'API_Contract_Review.xlsx', size: '420 KB', type: 'sheet', upload_date: 'ថ្ងៃនេះ' },
        ];
        const randomDoc = sampleDocs[Math.floor(Math.random() * sampleDocs.length)];
        task.documents.push(randomDoc);
        task.attachments_count = task.documents.length;
    }

    removeDocument(task: AdminTaskItem, docId: string): void {
        if (task.documents) {
            task.documents = task.documents.filter((d) => d.id !== docId);
            task.attachments_count = task.documents.length;
        }
    }

    updateTaskStatus(task: AdminTaskItem, status: string): void {
        task.status = status;
        if (status === 'done') {
            task.progress = 100;
        }
    }

    // Phase management
    openCreatePhaseModal(): void {
        if (!this.isAdmin()) return;
        const proj = this.selectedProject();
        const dialogConfig = this._dialogConfigService.getDialogConfig({
            user: this._userService.getUser(),
            currentPhasesCount: this.phases().length,
            projectName: proj?.name,
        });
        const dialogRef = this._matDialog.open(CreatePhaseDialogComponent, dialogConfig);
        dialogRef.afterClosed().subscribe((result) => {
            if (result && result.title) {
                const newPhase: ProjectPhaseItem = {
                    id: `ph-${Date.now()}`,
                    title: result.title,
                    quarter: result.quarter || 'ត្រីមាស',
                    startDate: result.startDate || '01/10/2026',
                    endDate: result.endDate || '31/12/2026',
                    tasksCount: 0,
                    status: result.status || 'planned',
                };
                this.phases.update((list) => [...list, newPhase]);
            }
        });
    }

    deletePhase(phaseId: string, event: Event): void {
        event.stopPropagation();
        if (!this.isAdmin()) return;
        this.phases.update((list) => list.filter((p) => p.id !== phaseId));
    }

    // Project Dialog
    openCreateProjectModal(): void {
        const dialogConfig = this._dialogConfigService.getDialogConfig({
            user: this._userService.getUser(),
            existingProjects: this.projects().map((p) => ({ id: p.id, code: p.code })),
            onProjectCreated: () => this.loadData(),
        });
        const dialogRef = this._matDialog.open(CreateProjectDialogComponent, dialogConfig);
        dialogRef.afterClosed().subscribe((result) => {
            if (result?.created) {
                this.loadData();
            }
        });
    }

    // Agile Plan Dialog
    openAddPlanDialog(proj?: AdminProject | null): void {
        if (!this.isAdmin()) return;
        const p = proj || this.selectedProject();
        const dialogConfig = this._dialogConfigService.getDialogConfig({
            user: this._userService.getUser(),
            totalWeeks: this.totalWeeks,
            weeks: this.weeks,
            projects: this.projects().map((item) => ({ id: item.id, code: item.code, name: item.name })),
            selectedProjectId: p?.id,
            selectedProjectName: p?.name,
        });

        const dialogRef = this._matDialog.open(AddPlanDialogComponent, dialogConfig);

        dialogRef.afterClosed().subscribe((result?: any) => {
            if (result) {
                const newTask: AgilePlanTask = result.task || result;
                this.agileTasks.update((list) => [newTask, ...list]);
            }
        });
    }

    openEditPlanDialog(task: AgilePlanTask, event?: Event): void {
        if (event) event.stopPropagation();
        if (!this.isAdmin()) return;
        const p = this.selectedProject();
        const dialogConfig = this._dialogConfigService.getDialogConfig({
            user: this._userService.getUser(),
            totalWeeks: this.totalWeeks,
            weeks: this.weeks,
            projects: this.projects().map((item) => ({ id: item.id, code: item.code, name: item.name })),
            selectedProjectId: p?.id,
            selectedProjectName: p?.name,
            task: task,
            isEditing: true,
        });

        const dialogRef = this._matDialog.open(AddPlanDialogComponent, dialogConfig);

        dialogRef.afterClosed().subscribe((result?: any) => {
            if (result) {
                const updated: AgilePlanTask = result.task || result;
                this.agileTasks.update((list) =>
                    list.map((t) => (t.id === task.id ? { ...t, ...updated } : t)),
                );
            }
        });
    }

    deleteAgileTask(taskId: string, event: Event): void {
        event.stopPropagation();
        if (!this.isAdmin()) return;
        this.agileTasks.update((list) => list.filter((t) => t.id !== taskId));
    }

    confirmDeleteTask(task: AdminTaskItem, event?: Event): void {
        if (event) event.stopPropagation();
        this.taskToDelete.set(task);
        this.showDeleteTaskModal.set(true);
    }

    deleteTask(): void {
        const target = this.taskToDelete();
        if (!target) return;

        const numericId = Number(String(target.id).replace(/\D/g, '')) || Number(target.id);
        if (numericId) {
            this._userTaskService.deleteTask(numericId).subscribe({
                next: () => {
                    this.tasks.update((list) => list.filter((t) => t.id !== target.id));
                    this.showDeleteTaskModal.set(false);
                    this.taskToDelete.set(null);
                },
                error: (err) => {
                    console.error('Failed to delete task on backend:', err);
                    this.tasks.update((list) => list.filter((t) => t.id !== target.id));
                    this.showDeleteTaskModal.set(false);
                    this.taskToDelete.set(null);
                },
            });
        } else {
            this.tasks.update((list) => list.filter((t) => t.id !== target.id));
            this.showDeleteTaskModal.set(false);
            this.taskToDelete.set(null);
        }
    }

    // Meeting management
    openCreateMeetingModal(): void {
        const dialogConfig = this._dialogConfigService.getDialogConfig({
            user: this._userService.getUser(),
        });
        const dialogRef = this._matDialog.open(CreateMeetingDialogComponent, dialogConfig);
        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                const newM: ProjectMeetingItem = {
                    id: `m-${Date.now()}`,
                    title: result.title || result.name || 'កិច្ចប្រជុំថ្មី',
                    description: result.description || 'ការពិភាក្សា និងសម្របសម្រួលការងារគម្រោង',
                    date: result.date || 'ថ្ងៃនេះ',
                    time: result.time || 'ម៉ោង ០២:០០ រសៀល',
                    platform: result.platform || 'Google Meet',
                    link: result.link || 'https://meet.google.com',
                    status: 'upcoming',
                    attendees: [...this.teamMembers().slice(0, 3)],
                };
                this.meetings.update((list) => [newM, ...list]);
            }
        });
    }

    deleteMeeting(meetingId: string, event: Event): void {
        event.stopPropagation();
        this.meetings.update((list) => list.filter((m) => m.id !== meetingId));
    }

    // Member management
    openCreateMemberModal(): void {
        if (!this.isAdmin()) return;
        const proj = this.selectedProject();
        if (!proj) return;
        const dialogConfig = this._dialogConfigService.getDialogConfig({
            user: this._userService.getUser(),
            projectName: proj?.name,
            users: this.users(),
            existingMemberIds: this.teamMembers().map((m) => m.id),
            existingMemberNames: this.teamMembers().map((m) => m.name),
        });
        const dialogRef = this._matDialog.open(CreateMemberDialogComponent, dialogConfig);
        dialogRef.afterClosed().subscribe((result) => {
            if (result && result.name) {
                const newM: TaskMember = {
                    id: Number(result.id || result.user_id) || Date.now(),
                    name: result.name,
                    role: result.role || 'Developer',
                    email: result.email || undefined,
                    avatar: result.avatar || undefined,
                    initial: result.initial || result.name.charAt(0).toUpperCase(),
                    bgClass: 'bg-indigo-600 text-white',
                    phone: result.phone || undefined,
                    user_id: result.user_id || result.id,
                };
                const updatedList = [...this.teamMembers(), newM];
                this.teamMembers.set(updatedList);
                this.persistProjectMembers(proj.id, updatedList, 'add');
            }
        });
    }

    deleteMember(memberId: number | string, event: Event): void {
        event.stopPropagation();
        if (!this.isAdmin()) return;
        const proj = this.selectedProject();
        if (!proj) return;
        const updatedList = this.teamMembers().filter((m) => String(m.id) !== String(memberId));
        this.teamMembers.set(updatedList);
        this.persistProjectMembers(proj.id, updatedList, 'delete');
    }

    private persistProjectMembers(projectId: string | number, members: TaskMember[], action: 'add' | 'delete' = 'add'): void {
        const payloadMembers = members.map((m) => ({
            id: Number(m.id) || m.id,
            user_id: Number((m as any).user_id || m.id) || undefined,
            name: m.name,
            role: m.role || 'សមាជិក',
            email: m.email || null,
            phone: (m as any).phone || null,
            avatar: m.avatar || null,
        }));

        this._adminService.updateProject(String(projectId), { members: payloadMembers as any }).subscribe({
            next: (res) => {
                if (res.data) {
                    this.selectedProject.set(res.data);
                    this.projects.update((list) =>
                        list.map((p) => (p.id === res.data.id || p.code === res.data.code ? { ...p, members: res.data.members } : p))
                    );
                    this._snackbarService.success(
                        action === 'add'
                            ? 'បានបន្ថែមសមាជិកទៅក្នុងគម្រោងដោយជោគជ័យ'
                            : 'បានដកសមាជិកចេញពីគម្រោងដោយជោគជ័យ'
                    );
                }
            },
            error: (err) => {
                console.error('Failed to update project members:', err);
                this._snackbarService.error('មានបញ្ហាក្នុងការរក្សាទុកសមាជិកគម្រោង');
            },
        });
    }

    // Link management
    openCreateLinkModal(): void {
        const proj = this.selectedProject();
        const dialogConfig = this._dialogConfigService.getDialogConfig({
            user: this._userService.getUser(),
            taskCode: proj ? `#${proj.code}-001` : '#WMS-001',
            projectName: proj?.name,
        });
        const dialogRef = this._matDialog.open(CreateLinkDialogComponent, dialogConfig);
        dialogRef.afterClosed().subscribe((result) => {
            if (result && result.title) {
                const newLink: TaskLink = {
                    id: `lnk-${Date.now()}`,
                    title: result.title,
                    url: result.url,
                    type: result.type || 'figma',
                    taskCode: result.taskCode || (proj ? `#${proj.code}-CORE` : '#WMS-CORE'),
                    createdAt: 'ថ្ងៃនេះ',
                };
                this.links.update((list) => [newLink, ...list]);
            }
        });
    }

    deleteProjectLink(linkId: string, event: Event): void {
        event.stopPropagation();
        this.links.update((list) => list.filter((l) => l.id !== linkId));
    }

    // Create Task modal
    openCreateTaskModal(): void {
        const proj = this.selectedProject();
        const dialogConfig = this._dialogConfigService.getDialogConfig({
            user: this._userService.getUser(),
            projectId: proj?.id,
            projectCode: proj?.code,
            projectName: proj?.name,
            projects: this.projects().map((p) => ({
                id: String(p.id),
                name: p.name,
                code: p.code,
                logo: p.logo || p.image,
            })),
            members: this.teamMembers(),
            existingTasks: this.tasks(),
            onTaskCreated: () => {
                if (proj) {
                    this.selectProject(proj);
                }
            },
        });
        const dialogRef = this._matDialog.open(CreateTaskDialogComponent, dialogConfig);
        dialogRef.afterClosed().subscribe((result) => {
            if (result && result.title) {
                if (proj) {
                    this.selectProject(proj);
                }
            }
        });
    }

    // Helper visual formatting
    getPriorityVisual(priority: string): { icon: string; color: string } {
        switch (priority) {
            case 'urgent': return { icon: 'mdi:alert-octagon', color: 'text-rose-500' };
            case 'high': return { icon: 'mdi:arrow-up-bold', color: 'text-amber-500' };
            case 'low': return { icon: 'mdi:arrow-down-bold', color: 'text-slate-400' };
            case 'medium':
            default: return { icon: 'mdi:equal', color: 'text-blue-500' };
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
            case 'pdf': return 'mdi:file-pdf-box';
            case 'sheet': return 'mdi:file-excel-box';
            case 'image': return 'mdi:file-image-box';
            case 'doc':
            default: return 'mdi:file-document-outline';
        }
    }

    getDocIconClass(type: string): string {
        switch (type) {
            case 'pdf': return 'text-red-500';
            case 'sheet': return 'text-emerald-600';
            case 'image': return 'text-purple-600';
            case 'doc':
            default: return 'text-blue-500';
        }
    }

    getLinkIcon(type: string): string {
        switch (type) {
            case 'figma': return 'mdi:palette';
            case 'github': return 'mdi:github';
            case 'doc': return 'mdi:file-document-edit-outline';
            default: return 'mdi:link-variant';
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

    getTaskStatusLabel(status: string): string {
        switch (status?.toLowerCase()) {
            case 'review':
            case 'in_review': return 'ស្នើសុំពិនិត្យ';
            case 'done':
            case 'completed': return 'បញ្ចប់';
            case 'confirmed': return 'បញ្ជាក់';
            case 'reopened': return 'បើកឡើងវិញ';
            case 'new':
            case 'pending': return 'ថ្មី';
            case 'in_progress': return 'កំពុងធ្វើ';
            case 'unconfirmed':
            case 'todo': return 'មិនបញ្ជាក់';
            default: return status || 'មិនបញ្ជាក់';
        }
    }

    getTaskStatusClass(status: string): string {
        switch (status?.toLowerCase()) {
            case 'review':
            case 'in_review': return 'bg-sky-50/80 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800';
            case 'done':
            case 'completed': return 'bg-emerald-50/80 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
            case 'confirmed': return 'bg-purple-50/80 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800';
            case 'reopened': return 'bg-rose-50/80 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800';
            case 'new':
            case 'pending': return 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';
            case 'in_progress': return 'bg-amber-50/80 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800';
            case 'unconfirmed':
            case 'todo': return 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700';
            default: return 'bg-slate-100 text-slate-700 border-slate-300';
        }
    }

    getTaskStatusIcon(status: string): string {
        switch (status?.toLowerCase()) {
            case 'review':
            case 'in_review': return 'mdi:magnify';
            case 'done':
            case 'completed': return 'mdi:check-circle-outline';
            case 'confirmed': return 'mdi:clipboard-check-outline';
            case 'reopened': return 'mdi:restore';
            case 'new':
            case 'pending': return 'mdi:clipboard-text-outline';
            case 'in_progress': return 'mdi:progress-clock';
            case 'unconfirmed':
            case 'todo': return 'mdi:close-circle-outline';
            default: return 'mdi:circle-outline';
        }
    }

    private setupResizeObserver(): void {
        if (typeof ResizeObserver !== 'undefined') {
            this._resizeObserver = new ResizeObserver(() => {
                if (this._progressChart && !this._progressChart.isDisposed()) {
                    this._progressChart.resize();
                }
                if (this._distributionChart && !this._distributionChart.isDisposed()) {
                    this._distributionChart.resize();
                }
            });
            this._resizeObserver.observe(document.body);
        }
    }

    private disposeCharts(): void {
        if (this._progressChart && !this._progressChart.isDisposed()) {
            this._progressChart.dispose();
            this._progressChart = undefined;
        }
        if (this._distributionChart && !this._distributionChart.isDisposed()) {
            this._distributionChart.dispose();
            this._distributionChart = undefined;
        }
    }

    initProjectCharts(): void {
        const proj = this.selectedProject();
        if (!proj) return;

        // 1. Progress & S-Curve / Burndown Chart
        if (this.progressChartRef?.nativeElement) {
            if (this._progressChart && !this._progressChart.isDisposed()) {
                this._progressChart.dispose();
            }
            this._progressChart = echarts.init(this.progressChartRef.nativeElement);
            
            const option: echarts.EChartsOption = {
                tooltip: {
                    trigger: 'axis',
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    borderColor: '#cbd5e1',
                    borderWidth: 1,
                    padding: [10, 14],
                    textStyle: { color: '#1e293b', fontFamily: "'Kantumruy Pro', sans-serif", fontSize: 15 },
                    axisPointer: {
                        type: 'cross',
                        crossStyle: { color: '#94a3b8' }
                    }
                },
                legend: {
                    data: ['វឌ្ឍនភាពជាក់ស្តែង (%)', 'ផែនការគ្រោងទុក (S-Curve %)', 'ការងារបានបញ្ចប់ (Tasks)'],
                    bottom: 0,
                    itemGap: 16,
                    textStyle: { color: '#475569', fontFamily: "'Kantumruy Pro', sans-serif", fontSize: 14 }
                },
                grid: {
                    top: '12%',
                    left: '3%',
                    right: '4%',
                    bottom: '14%',
                    containLabel: true
                },
                xAxis: [
                    {
                        type: 'category',
                        data: ['សប្តាហ៍ ១', 'សប្តាហ៍ ២', 'សប្តាហ៍ ៣', 'សប្តាហ៍ ៤', 'សប្តាហ៍ ៥', 'សប្តាហ៍ ៦', 'សប្តាហ៍ ៧', 'សប្តាហ៍ ៨'],
                        axisLine: { lineStyle: { color: '#cbd5e1' } },
                        axisLabel: { color: '#64748b', fontFamily: "'Kantumruy Pro', sans-serif", fontSize: 14 }
                    }
                ],
                yAxis: [
                    {
                        type: 'value',
                        name: 'វឌ្ឍនភាព (%)',
                        min: 0,
                        max: 100,
                        nameTextStyle: { fontFamily: "'Kantumruy Pro', sans-serif", fontSize: 14, color: '#475569' },
                        axisLabel: { formatter: '{value}%', color: '#64748b', fontFamily: "'Kantumruy Pro', sans-serif", fontSize: 13.5 },
                        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } }
                    },
                    {
                        type: 'value',
                        name: 'ចំនួនការងារ',
                        min: 0,
                        max: 30,
                        nameTextStyle: { fontFamily: "'Kantumruy Pro', sans-serif", fontSize: 14, color: '#475569' },
                        axisLabel: { color: '#64748b', fontFamily: "'Kantumruy Pro', sans-serif", fontSize: 13.5 },
                        splitLine: { show: false }
                    }
                ],
                series: [
                    {
                        name: 'ផែនការគ្រោងទុក (S-Curve %)',
                        type: 'line',
                        smooth: true,
                        lineStyle: { width: 2.5, type: 'dashed', color: '#94a3b8' },
                        itemStyle: { color: '#94a3b8' },
                        data: [10, 20, 35, 50, 65, 80, 90, 100]
                    },
                    {
                        name: 'វឌ្ឍនភាពជាក់ស្តែង (%)',
                        type: 'line',
                        smooth: true,
                        lineStyle: { width: 3.5, color: '#2563eb' },
                        itemStyle: { color: '#2563eb' },
                        areaStyle: {
                            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                { offset: 0, color: 'rgba(37, 99, 235, 0.28)' },
                                { offset: 1, color: 'rgba(37, 99, 235, 0.01)' }
                            ])
                        },
                        data: [12, 22, 38, 48, proj.progress || 58]
                    },
                    {
                        name: 'ការងារបានបញ្ចប់ (Tasks)',
                        type: 'bar',
                        yAxisIndex: 1,
                        barWidth: 14,
                        itemStyle: {
                            borderRadius: [4, 4, 0, 0],
                            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                { offset: 0, color: '#38bdf8' },
                                { offset: 1, color: '#0284c7' }
                            ])
                        },
                        data: [2, 5, 8, 11, proj.completed_tasks || 14]
                    }
                ]
            };
            this._progressChart.setOption(option);
        }

        // 2. Task Status Distribution Doughnut Chart
        if (this.taskDistributionChartRef?.nativeElement) {
            if (this._distributionChart && !this._distributionChart.isDisposed()) {
                this._distributionChart.dispose();
            }
            this._distributionChart = echarts.init(this.taskDistributionChartRef.nativeElement);

            const distList = this.taskStatusDistribution();

            const option: echarts.EChartsOption = {
                tooltip: {
                    trigger: 'item',
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    borderColor: '#cbd5e1',
                    borderWidth: 1,
                    padding: [10, 14],
                    textStyle: { color: '#1e293b', fontFamily: "'Kantumruy Pro', sans-serif", fontSize: 15 },
                    formatter: '{b}: <b>{c} ការងារ</b> ({d}%)'
                },
                legend: {
                    show: false
                },
                series: [
                    {
                        name: 'ស្ថានភាពការងារ',
                        type: 'pie',
                        radius: ['50%', '76%'],
                        center: ['50%', '50%'],
                        avoidLabelOverlap: false,
                        itemStyle: {
                            borderRadius: 6,
                            borderColor: '#ffffff',
                            borderWidth: 2.5
                        },
                        label: {
                            show: false,
                            position: 'center'
                        },
                        emphasis: {
                            label: {
                                show: true,
                                formatter: '{b}\n{c} ការងារ',
                                fontSize: 15,
                                fontWeight: 'bold',
                                fontFamily: "'Kantumruy Pro', sans-serif",
                                color: '#1e293b'
                            }
                        },
                        labelLine: {
                            show: false
                        },
                        data: distList.map(item => ({
                            value: item.count,
                            name: item.name,
                            itemStyle: { color: item.color }
                        }))
                    }
                ]
            };
            this._distributionChart.setOption(option);
        }
    }

    loadData(): void {
        this.loading.set(true);
        this._adminService.getProjects().subscribe({
            next: (res) => {
                if (res.data && res.data.results) {
                    this.projects.set(res.data.results);
                    const curr = this.selectedProject();
                    if (curr) {
                        const updatedSelected = res.data.results.find((p: any) => p.id === curr.id || p.code === curr.code);
                        if (updatedSelected) {
                            this.selectedProject.set(updatedSelected);
                            if (updatedSelected.members && Array.isArray(updatedSelected.members) && updatedSelected.members.length > 0) {
                                this.teamMembers.set(updatedSelected.members.map((m: any) => this.mapProjectMemberToTaskMember(m)));
                            }
                        }
                    }
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
                    const curr = this.selectedProject();
                    if (curr && curr.members && Array.isArray(curr.members) && curr.members.length > 0) {
                        this.teamMembers.set(curr.members.map((m: any) => this.mapProjectMemberToTaskMember(m)));
                    }
                }
            },
        });
    }

    private mapTaskToAdminTaskItem(t: any): AdminTaskItem {
        const rawStatus = (t.status || 'new').toLowerCase().trim();
        let status: any = rawStatus;
        if (rawStatus === 'completed') status = 'done';
        if (rawStatus === 'in-progress') status = 'in_progress';
        if (rawStatus === 'in_review') status = 'review';

        const priority = (t.priority || 'medium').toLowerCase().trim();

        const reporterName = t.reporter?.name || 'ពិសិដ្ឋ បញ្ញាវ័ន្ត';
        const reporterInitial = (reporterName.charAt(0) || 'P').toUpperCase();

        let assigneeObj: TaskMember | null = null;
        if (t.assignee) {
            const aName = t.assignee.name || 'Member';
            assigneeObj = {
                id: t.assignee.id || 1,
                name: aName,
                role: t.assignee.role || 'Member',
                initial: aName.charAt(0).toUpperCase(),
                bgClass: t.assignee.bgClass || t.assignee.colorClass || 'bg-blue-600 text-white',
                avatar: t.assignee.avatar || null,
                email: t.assignee.email || '',
            };
        } else if (Array.isArray(t.assignees) && t.assignees.length > 0) {
            const first = t.assignees[0];
            const aName = first.name || 'Member';
            assigneeObj = {
                id: first.id || 1,
                name: aName,
                role: first.role || 'Member',
                initial: aName.charAt(0).toUpperCase(),
                bgClass: first.bgClass || first.colorClass || 'bg-blue-600 text-white',
                avatar: first.avatar || null,
                email: first.email || '',
            };
        }

        const members: TaskMember[] = (t.assignees || []).map((a: any) => ({
            id: a.id || 1,
            name: a.name || 'Member',
            role: a.role || 'Member',
            initial: (a.name || 'M').charAt(0).toUpperCase(),
            bgClass: a.bgClass || a.colorClass || 'bg-slate-600 text-white',
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
                bgClass: 'bg-emerald-600 text-white',
                avatar: t.reporter?.avatar || null,
            },
            assignee: assigneeObj,
            members: members.length > 0 ? members : (assigneeObj ? [assigneeObj] : []),
            progress: t.progress || (['done', 'completed'].includes(status) ? 100 : 0),
            subtasks: t.subtasks || [],
            links: t.links || [],
            documents: t.documents || [],
        };
    }

    private mapProjectMemberToTaskMember(m: any): TaskMember {
        const uId = String(m.id || m.user_id || '');
        const uPhone = (m.phone || '').replace(/\D/g, '');
        const uEmail = (m.email || '').toLowerCase().trim();
        const mName = (m.name || '').toLowerCase().trim();

        // Match against system users list if available
        const matchedUser = this.users().find((u) => {
            if (uId && String(u.id) === uId) return true;
            if (uPhone && (u.phone || '').replace(/\D/g, '') === uPhone) return true;
            if (uEmail && (u.email || '').toLowerCase().trim() === uEmail) return true;
            if (mName && (u.name_en?.toLowerCase().trim() === mName || u.name_kh?.trim() === m.name?.trim())) return true;
            return false;
        });

        const name = matchedUser ? (matchedUser.name_kh || matchedUser.name_en) : (m.name || 'សមាជិក');
        const role = m.role || (matchedUser ? (matchedUser.position || matchedUser.role) : 'សមាជិក');
        const email = m.email || matchedUser?.email || undefined;
        const phone = m.phone || matchedUser?.phone || undefined;
        const avatar = m.avatar || matchedUser?.avatar || undefined;
        const initial = m.initial || (name ? name.trim().charAt(0).toUpperCase() : 'M');

        return {
            id: Number(matchedUser?.id || m.id) || Date.now(),
            user_id: Number(matchedUser?.id || m.user_id || m.id) || undefined,
            name,
            role,
            avatar,
            email,
            phone,
            initial,
            bgClass: 'bg-blue-600 text-white',
        };
    }

    selectProject(project: AdminProject): void {
        this.selectedProject.set(project);
        this.projectNavTab.set('tasks');
        this.taskSearchQuery.set('');
        this.subtaskFilter.set('all');
        this.isTasksLoading.set(true);

        if (project.members && Array.isArray(project.members) && project.members.length > 0) {
            this.teamMembers.set(project.members.map((m: any) => this.mapProjectMemberToTaskMember(m)));
        } else if (project.code === 'WMS-DIGI' || project.name?.includes('WMS')) {
            this.teamMembers.set([...DEFAULT_PROJECT_TEAM_MEMBERS]);
        } else {
            this.teamMembers.set([]);
        }

        if (project.phases && Array.isArray(project.phases) && project.phases.length > 0) {
            this.phases.set(project.phases);
        } else {
            this.phases.set(DEFAULT_PROJECT_PHASES);
        }

        if (project.meetings && Array.isArray(project.meetings) && project.meetings.length > 0) {
            this.meetings.set(project.meetings);
        } else {
            this.meetings.set(DEFAULT_PROJECT_MEETINGS);
        }

        this._userTaskService
            .getTasks({ scope: 'all' })
            .pipe(
                catchError(() => of(null)),
                finalize(() => this.isTasksLoading.set(false))
            )
            .subscribe((res) => {
                if (res?.data?.results?.length) {
                    const allTasks = res.data.results;
                    const pid = String(project.id || '').toLowerCase();
                    const pcode = (project.code || '').toLowerCase().replace('#', '');
                    const pname = (project.name || '').toLowerCase();
                    const pPrefix = pcode.split('-')[0];

                    const projectTasks = allTasks.filter((t: any) => {
                        const tPid = (t.project_id || '').toLowerCase();
                        const tPname = (t.project_name || '').toLowerCase();
                        const tCode = (t.code || '').toLowerCase().replace('#', '');

                        return (
                            (tPid && (tPid === pid || tPid.includes(pid) || pid.includes(tPid))) ||
                            (pcode && (tCode.includes(pcode) || tPid.includes(pcode))) ||
                            (pPrefix && (tCode.startsWith(pPrefix + '-') || tPid.startsWith(pPrefix))) ||
                            (pname && (tPname.includes(pname) || pname.includes(tPname)))
                        );
                    });

                    this.tasks.set(projectTasks.map((t: any) => this.mapTaskToAdminTaskItem(t)));
                } else {
                    this.tasks.set([]);
                }
            });
    }

    clearSelectedProject(): void {
        this.disposeCharts();
        this.selectedProject.set(null);
        this.activeTaskModal.set(null);
        this.showTaskDrawer.set(false);
        this.selectedTaskDrawerItem.set(null);
    }

    filterByStatus(status: string): void {
        this.statusFilter.set(status);
    }

    openCreateDrawer(): void {
        this.isEditing.set(false);
        this.editingProject.set(null);
        this.projectForm.reset({
            name: '',
            code: `WFM-${Math.floor(100 + Math.random() * 900)}`,
            description: '',
            status: 'active',
            progress: 0,
            start_date: new Date().toISOString().slice(0, 10),
            end_date: new Date(Date.now() + 86400000 * 45).toISOString().slice(0, 10),
            budget: 5000,
            logo: '',
            image: '',
        });
        this.isDrawerOpen.set(true);
    }

    openEditDrawer(project: AdminProject): void {
        this.isEditing.set(true);
        this.editingProject.set(project);
        this.projectForm.patchValue({
            name: project.name,
            code: project.code,
            description: project.description,
            status: project.status,
            progress: project.progress,
            start_date: project.start_date ? project.start_date.slice(0, 10) : '',
            end_date: project.end_date ? project.end_date.slice(0, 10) : '',
            budget: project.budget || 0,
            logo: project.logo || project.image || '',
            image: project.image || project.logo || '',
        });
        this.isDrawerOpen.set(true);
    }

    onLogoSelected(event: Event): void {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                this.projectForm.patchValue({
                    logo: result,
                    image: result,
                });
            };
            reader.readAsDataURL(file);
        }
    }

    removeLogo(): void {
        this.projectForm.patchValue({
            logo: '',
            image: '',
        });
    }

    closeDrawer(): void {
        this.isDrawerOpen.set(false);
        this.isEditing.set(false);
        this.editingProject.set(null);
    }

    submitProjectForm(): void {
        if (this.projectForm.invalid) {
            this.projectForm.markAllAsTouched();
            return;
        }

        this.saving.set(true);
        const formVal = this.projectForm.value;
        const targetProject = this.editingProject() || this.selectedProject();

        if (this.isEditing() && targetProject) {
            this._adminService.updateProject(targetProject.id, formVal).subscribe({
                next: (res) => {
                    const updated = res.data;
                    this.projects.update((list) =>
                        list.map((p) => (p.id === updated.id || String(p.id) === String(targetProject.id) ? { ...p, ...updated } : p)),
                    );
                    if (this.selectedProject()?.id === targetProject.id || String(this.selectedProject()?.id) === String(targetProject.id)) {
                        this.selectedProject.set({ ...this.selectedProject()!, ...updated });
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

    projectProgress(plan?: { completed_tasks?: number; total_tasks?: number; progress?: number } | null): number {
        if (!plan) return 0;
        const total = plan.total_tasks ?? 0;
        const completed = plan.completed_tasks ?? 0;
        if (total > 0) {
            return Math.round((Math.min(completed, total) / total) * 100);
        }
        return plan.progress ?? 0;
    }
}
