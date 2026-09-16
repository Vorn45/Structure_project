import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

// ===========================================================================>> Custom Library
import { appConfig } from 'src/app.config';
import { User } from 'src/app/model/user/users.entity';
import { TaskStore } from 'src/app/model/user/task-store.entity';
import { TelegramThread } from 'src/app/model/user/telegram-thread.entity';
import { UserPayload } from 'src/app/interface/jwt.interface';
import { NotificationService, NotificationItem } from 'src/app/shared/notification/notification.service';
import { RealtimeGateway } from 'src/app/shared/realtime/realtime.gateway';
import { CreateTaskDto, QueryTasksDto, TaskPriorityEnum, TaskStatusEnum, UpdateTaskDto } from './task.dto';

// In-memory / mock store to serve user task operations
export interface TaskItem {
    id: number;
    code?: string;
    title: string;
    description: string;
    task_type?: string;
    module?: string;
    status: TaskStatusEnum;
    priority: TaskPriorityEnum;
    progress: number;
    comments_count?: number;
    attachments_count?: number;
    due_date: string | null;
    project_id: string;
    project_name: string;
    reporter?: {
        id: number;
        name: string;
        avatar?: string | null;
        role?: string;
    };
    assignee: {
        id: number;
        name: string;
        avatar?: string | null;
        role?: string;
        email?: string;
    };
    assignees?: Array<{
        id: number;
        name: string;
        avatar?: string | null;
        role?: string;
        email?: string;
    }>;
    attachments?: Array<{ name: string; size: string; url?: string; type?: string; isImage?: boolean; textContent?: string }>;
    created_at: string;
    updated_at: string;
}

export interface TaskCommentItem {
    id: number;
    sender_id: number;
    sender_name: string;
    sender_avatar: string | null;
    text: string;
    time: string;
    is_self: boolean;
    is_system?: boolean;
    attachments?: Array<{ name: string; size: string; url?: string; type?: string; isImage?: boolean; textContent?: string }>;
    created_at: string;
    seen_by?: Array<{ id: number; name: string; avatar?: string | null; seen_at?: string }>;
}

const INITIAL_TASKS: TaskItem[] = [
    {
        id: 1,
        code: '#WMS-0000',
        module: 'Org Admin | Structure',
        title: 'Org Admin | Structure | Department',
        description: 'Manage departmental structures, permissions, and organizational units in core hierarchy.',
        task_type: 'feature',
        status: TaskStatusEnum.IN_REVIEW,
        priority: TaskPriorityEnum.HIGH,
        progress: 85,
        comments_count: 1,
        attachments_count: 2,
        due_date: new Date(Date.now() + 86400000 * 6).toISOString(),
        project_id: 'wms-digitech',
        project_name: 'WMS Digitech',
        reporter: { id: 1, name: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត', avatar: null, role: 'Super Admin' },
        assignee: null as any,
        assignees: [],
        created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 2,
        code: '#BMS-0000',
        module: 'Project | Folder',
        title: 'Project | Folder | Drag & Drop',
        description: 'Implement intuitive drag and drop folder organization for project documents.',
        task_type: 'feature',
        status: TaskStatusEnum.DONE,
        priority: TaskPriorityEnum.HIGH,
        progress: 100,
        comments_count: 0,
        attachments_count: 2,
        due_date: new Date(Date.now() - 86400000 * 2).toISOString(),
        project_id: 'bms-digitech',
        project_name: 'BMS Digitech',
        reporter: { id: 1, name: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត', avatar: null, role: 'Super Admin' },
        assignee: { id: 2, name: 'ពុំ ប្រុសមុន្នី', avatar: null, role: 'User' },
        assignees: [
            { id: 2, name: 'ពុំ ប្រុសមុន្នី', avatar: null, role: 'User' }
        ],
        created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 3,
        code: '#WMS-0001',
        module: 'Project | Folder',
        title: 'Project | Folder | Cannot Scroll PDF',
        description: 'Fix scrolling and pinch-to-zoom issues inside nested PDF preview modal containers.',
        task_type: 'bug',
        status: TaskStatusEnum.CONFIRMED,
        priority: TaskPriorityEnum.URGENT,
        progress: 100,
        comments_count: 2,
        attachments_count: 1,
        due_date: new Date(Date.now() - 86400000 * 3).toISOString(),
        project_id: 'wms-digitech',
        project_name: 'WMS Digitech',
        reporter: { id: 1, name: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត', avatar: null, role: 'Super Admin' },
        assignee: { id: 3, name: 'ថា វីនណឺរ', avatar: null, role: 'User' },
        assignees: [
            { id: 3, name: 'ថា វីនណឺរ', avatar: null, role: 'User' }
        ],
        created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 4,
        code: '#BMS-0001',
        module: 'My Work | Profile',
        title: 'My Work | Profile | Missing Cover',
        description: 'Provide fallback default cover gradient when user cover photo URL is empty or unverified.',
        task_type: 'bug',
        status: TaskStatusEnum.REOPENED,
        priority: TaskPriorityEnum.URGENT,
        progress: 40,
        comments_count: 1,
        attachments_count: 1,
        due_date: new Date(Date.now() - 86400000 * 5).toISOString(),
        project_id: 'bms-digitech',
        project_name: 'BMS Digitech',
        reporter: { id: 1, name: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត', avatar: null, role: 'Super Admin' },
        assignee: { id: 1, name: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត', avatar: null, role: 'Super Admin & User' },
        assignees: [
            { id: 1, name: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត', avatar: null, role: 'Super Admin & User' }
        ],
        created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 5,
        code: '#WMS-0002',
        module: 'Security Settings',
        title: 'Security setting UI improvements',
        description: 'Refactor passkey registration dialog, 2FA toggle switches, and active login sessions table.',
        task_type: 'improvement',
        status: TaskStatusEnum.NEW,
        priority: TaskPriorityEnum.HIGH,
        progress: 10,
        comments_count: 1,
        attachments_count: 1,
        due_date: new Date(Date.now() - 86400000 * 6).toISOString(),
        project_id: 'wms-digitech',
        project_name: 'WMS Digitech',
        reporter: { id: 1, name: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត', avatar: null, role: 'Super Admin' },
        assignee: { id: 2, name: 'ពុំ ប្រុសមុន្នី', avatar: null, role: 'User' },
        assignees: [
            { id: 2, name: 'ពុំ ប្រុសមុន្នី', avatar: null, role: 'User' }
        ],
        created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 6,
        code: '#BMS-0002',
        module: 'User | Report',
        title: 'User | Report | Progress Compare',
        description: 'Render interactive comparison charts comparing weekly member work hours and sprint deliverables.',
        task_type: 'feature',
        status: TaskStatusEnum.IN_PROGRESS,
        priority: TaskPriorityEnum.MEDIUM,
        progress: 55,
        comments_count: 0,
        attachments_count: 1,
        due_date: new Date(Date.now() + 86400000 * 4).toISOString(),
        project_id: 'bms-digitech',
        project_name: 'BMS Digitech',
        reporter: { id: 1, name: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត', avatar: null, role: 'Super Admin' },
        assignee: { id: 3, name: 'ថា វីនណឺរ', avatar: null, role: 'User' },
        assignees: [
            { id: 3, name: 'ថា វីនណឺរ', avatar: null, role: 'User' }
        ],
        created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 7,
        code: '#WMS-0003',
        module: 'User | Report',
        title: 'User | Report | Progress',
        description: 'Real-time sync of task milestone updates and aggregated department productivity scorecards.',
        task_type: 'feature',
        status: TaskStatusEnum.CONFIRMED,
        priority: TaskPriorityEnum.MEDIUM,
        progress: 88,
        comments_count: 2,
        attachments_count: 1,
        due_date: new Date(Date.now() + 86400000 * 2).toISOString(),
        project_id: 'wms-digitech',
        project_name: 'WMS Digitech',
        reporter: { id: 1, name: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត', avatar: null, role: 'Super Admin' },
        assignee: { id: 1, name: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត', avatar: null, role: 'Super Admin & User' },
        assignees: [
            { id: 1, name: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត', avatar: null, role: 'Super Admin & User' }
        ],
        created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 8,
        code: '#BMS-0003',
        module: 'Profile | Switch Org',
        title: 'Profile | Switch Org | Exit Org',
        description: 'Provide safe confirmation step and revoke tenant session when member switches workspace.',
        task_type: 'feature',
        status: TaskStatusEnum.UNCONFIRMED,
        priority: TaskPriorityEnum.LOW,
        progress: 0,
        comments_count: 1,
        attachments_count: 0,
        due_date: new Date(Date.now() + 86400000 * 8).toISOString(),
        project_id: 'bms-digitech',
        project_name: 'BMS Digitech',
        reporter: { id: 1, name: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត', avatar: null, role: 'Super Admin' },
        assignee: { id: 2, name: 'ពុំ ប្រុសមុន្នី', avatar: null, role: 'User' },
        assignees: [
            { id: 2, name: 'ពុំ ប្រុសមុន្នី', avatar: null, role: 'User' }
        ],
        created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
        updated_at: new Date().toISOString(),
    },
];

@Injectable()
export class TaskService {
    private tasks: TaskItem[] = [...INITIAL_TASKS];
    private taskComments = new Map<number, TaskCommentItem[]>();
    private readonly storeFilePath = path.join(process.cwd(), 'storage', 'tasks_data_store.json');

    private isStoreLoaded = false;

    constructor(
        @InjectRepository(User)
        private readonly _userRepo: Repository<User>,
        @InjectRepository(TaskStore)
        private readonly _taskStoreRepo: Repository<TaskStore>,
        @InjectRepository(TelegramThread)
        private readonly _threadRepo: Repository<TelegramThread>,
        private readonly _notificationService?: NotificationService,
        private readonly _realtimeGateway?: RealtimeGateway,
    ) {
        this.loadFromDisk();
        this.initDbStore();
    }

    private async ensureTableExists(): Promise<void> {
        try {
            await this._userRepo.query(`
                CREATE EXTENSION IF NOT EXISTS "pgcrypto";
                CREATE SCHEMA IF NOT EXISTS "user";
                CREATE TABLE IF NOT EXISTS "user"."task_store" (
                    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    "key" VARCHAR(255) NOT NULL DEFAULT 'default_tasks_store',
                    "tasks" JSONB NULL DEFAULT '[]'::jsonb,
                    "comments" JSONB NULL DEFAULT '{}'::jsonb,
                    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
                );
                CREATE UNIQUE INDEX IF NOT EXISTS "IDX_task_store_key" ON "user"."task_store" ("key");
            `);
        } catch (e: any) {
            console.warn('Auto table create query skipped or already exists:', e?.message || e);
        }
    }

    private isPmsTask(t: any): boolean {
        if (!t) return false;
        const code = (t.code || '').toUpperCase();
        const pid = (t.project_id || '').toLowerCase();
        const pname = (t.project_name || '').toLowerCase();
        return code.includes('PMS') || pid.includes('pms') || pname.includes('pms') || pid === 'proj-001' || pid === 'proj-002' || pid === 'proj-003';
    }

    private async initDbStore(): Promise<void> {
        await this.ensureTableExists();
        try {
            const dbStore = await this._taskStoreRepo.findOne({ where: { key: 'default_tasks_store' } });
            if (dbStore) {
                if (Array.isArray(dbStore.tasks) && dbStore.tasks.length > 0) {
                    const nonPms = dbStore.tasks.filter((t: any) => !this.isPmsTask(t));
                    if (nonPms.length > 0) {
                        this.tasks = nonPms.map((t: any) => ({
                            ...t,
                            task_type: t.task_type || this.inferTaskType(t),
                        }));
                    } else {
                        this.tasks = [...INITIAL_TASKS];
                    }
                }
                if (dbStore.comments && typeof dbStore.comments === 'object') {
                    for (const [k, v] of Object.entries(dbStore.comments)) {
                        const numKey = Number(k);
                        if (!isNaN(numKey) && Array.isArray(v)) {
                            this.taskComments.set(numKey, v as any[]);
                        }
                    }
                }
                // Heal any stored tasks that are missing a reporter so they are never orphaned
                this.healMissingReporters();
                await this.saveToDb();
                this.saveToDisk();
            } else {
                await this.saveToDb();
            }
            this.isStoreLoaded = true;
        } catch (err) {
            console.warn('Could not load task store from DB, falling back to disk:', err);
        }

        // Guarantee no PMS tasks exist in this.tasks
        this.tasks = this.tasks.filter((t: any) => !this.isPmsTask(t));
        if (this.tasks.length === 0) {
            this.tasks = [...INITIAL_TASKS];
        }

        // Ensure all loaded tasks have default comment threads seeded
        for (const task of this.tasks) {
            if (!this.taskComments.has(task.id) || (this.taskComments.get(task.id)?.length || 0) === 0) {
                this.ensureTaskComments(task.id);
            }
        }
    }

    private async ensureStoreLoaded(): Promise<void> {
        if (!this.isStoreLoaded) {
            await this.initDbStore();
        }
    }

    private ensureTaskComments(taskId: number): TaskCommentItem[] {
        let comments = this.taskComments.get(taskId);
        const task = this.tasks.find((t) => t.id === taskId);
        const reporterName = task?.reporter?.name || 'អ្នកគ្រប់គ្រង';
        const reporterAvatar = task?.reporter?.avatar || null;
        const reporterId = task?.reporter?.id || 1;
        const hasAssignee = Boolean(task?.assignee?.name || (task?.assignees && task.assignees.length > 0));
        const assigneeName = task?.assignee?.name || (task?.assignees && task.assignees.length > 0 ? task.assignees[0].name : '');

        if (!comments || comments.length === 0) {
            const initialComments: any[] = [
                {
                    id: 1,
                    sender_id: 0,
                    sender_name: 'ប្រព័ន្ធ (System)',
                    sender_avatar: null,
                    text: hasAssignee && assigneeName
                        ? `ភារកិច្ច ${task?.code || ('#' + taskId)} ត្រូវបានបង្កើតដោយ ${reporterName} និងចាត់តាំងទៅកាន់ ${assigneeName}`
                        : `ភារកិច្ច ${task?.code || ('#' + taskId)} ត្រូវបានបង្កើតដោយ ${reporterName} (គ្មានអ្នកទទួលបន្ទុក)`,
                    time: '8:30 AM',
                    is_self: false,
                    is_system: true,
                    created_at: task?.created_at || new Date(Date.now() - 3600000 * 4).toISOString(),
                },
            ];

            // Default intro assignment message from real reporter to assignee
            if (hasAssignee && assigneeName) {
                const seenList = (task?.assignees && task.assignees.length > 0)
                    ? task.assignees.map((a: any) => ({ id: a.id, name: a.name, avatar: a.avatar || null }))
                    : (task?.assignee ? [{ id: task.assignee.id, name: task.assignee.name, avatar: task.assignee.avatar || null }] : []);

                initialComments.push({
                    id: 2,
                    sender_id: reporterId,
                    sender_name: reporterName,
                    sender_avatar: reporterAvatar,
                    text: `សួស្តី @${assigneeName}! ខ្ញុំបានចាត់តាំងភារកិច្ច "${task?.title || 'ការងារ'}" នេះជូនអ្នក។ សូមជួយពិនិត្យមើល និងអនុវត្តតាមលក្ខខណ្ឌការងារ។`,
                    time: '8:45 AM',
                    is_self: false,
                    created_at: task?.created_at || new Date(Date.now() - 3600000 * 3.5).toISOString(),
                    seen_by: seenList,
                });
            }

            comments = initialComments;
            this.taskComments.set(taskId, comments);
            this.saveStore();
        } else if (task && hasAssignee && assigneeName) {
            const seenList = (task?.assignees && task.assignees.length > 0)
                ? task.assignees.map((a: any) => ({ id: a.id, name: a.name, avatar: a.avatar || null }))
                : (task?.assignee ? [{ id: task.assignee.id, name: task.assignee.name, avatar: task.assignee.avatar || null }] : []);

            // Ensure default intro exists and is updated with real task info
            const introIndex = comments.findIndex(c => !c.is_system && typeof c.text === 'string' && c.text.includes('ខ្ញុំបានចាត់តាំងភារកិច្ច'));
            if (introIndex >= 0) {
                comments[introIndex].sender_name = reporterName;
                comments[introIndex].sender_avatar = reporterAvatar;
                comments[introIndex].sender_id = reporterId;
                comments[introIndex].text = `សួស្តី @${assigneeName}! ខ្ញុំបានចាត់តាំងភារកិច្ច "${task?.title || 'ការងារ'}" នេះជូនអ្នក។ សូមជួយពិនិត្យមើល និងអនុវត្តតាមលក្ខខណ្ឌការងារ។`;
                if (!comments[introIndex].seen_by || comments[introIndex].seen_by.length === 0) {
                    comments[introIndex].seen_by = seenList;
                }
                this.taskComments.set(taskId, comments);
                this.saveStore();
            } else {
                const introMsg = {
                    id: 2,
                    sender_id: reporterId,
                    sender_name: reporterName,
                    sender_avatar: reporterAvatar,
                    text: `សួស្តី @${assigneeName}! ខ្ញុំបានចាត់តាំងភារកិច្ច "${task?.title || 'ការងារ'}" នេះជូនអ្នក។ សូមជួយពិនិត្យមើល និងអនុវត្តតាមលក្ខខណ្ឌការងារ។`,
                    time: '8:45 AM',
                    is_self: false,
                    created_at: task?.created_at || new Date(Date.now() - 3600000 * 3.5).toISOString(),
                    seen_by: seenList,
                };
                // Insert after system message or at start
                if (comments.length > 0 && comments[0].is_system) {
                    comments.splice(1, 0, introMsg);
                } else {
                    comments.unshift(introMsg);
                }
                this.taskComments.set(taskId, comments);
                this.saveStore();
            }
        }
        return comments;
    }

    private loadFromDisk(): void {
        try {
            if (fs.existsSync(this.storeFilePath)) {
                const raw = fs.readFileSync(this.storeFilePath, 'utf8');
                const data = JSON.parse(raw);
                if (data && Array.isArray(data.tasks) && data.tasks.length > 0) {
                    const nonPms = data.tasks.filter((t: any) => !this.isPmsTask(t));
                    if (nonPms.length > 0) {
                        this.tasks = nonPms.map((t: any) => ({
                            ...t,
                            task_type: t.task_type || this.inferTaskType(t),
                        }));
                    } else {
                        this.tasks = [...INITIAL_TASKS];
                    }
                }
                if (data && data.comments && typeof data.comments === 'object') {
                    for (const [k, v] of Object.entries(data.comments)) {
                        const numKey = Number(k);
                        if (!isNaN(numKey) && Array.isArray(v)) {
                            this.taskComments.set(numKey, v as any[]);
                        }
                    }
                }
                if (this.healMissingReporters()) {
                    this.saveToDisk();
                }
            }
        } catch (e) {
            console.error('Failed to load tasks from disk store:', e);
        }
    }

    private healMissingReporters(): boolean {
        let modified = false;
        for (const t of this.tasks) {
            if (!t.reporter || !t.reporter.name || t.reporter.name.trim() === '') {
                t.reporter = {
                    id: 2,
                    name: 'PUM BRUSMUNY',
                    role: 'Frontend Lead',
                    avatar: null,
                };
                modified = true;
            }
        }
        return modified;
    }

    private saveStore(): void {
        this.saveToDisk();
        this.saveToDb().catch(() => {});
    }

    private saveToDisk(): void {
        try {
            const dir = path.dirname(this.storeFilePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            const commentsObj: Record<number, any[]> = {};
            for (const [k, v] of this.taskComments.entries()) {
                commentsObj[k] = v;
            }
            const data = {
                tasks: this.tasks,
                comments: commentsObj,
                updated_at: new Date().toISOString(),
            };
            fs.writeFileSync(this.storeFilePath, JSON.stringify(data, null, 2), 'utf8');
        } catch (e) {
            console.error('Failed to save tasks to disk store:', e);
        }
    }

    private async saveToDb(): Promise<void> {
        try {
            const commentsObj: Record<number, any[]> = {};
            for (const [k, v] of this.taskComments.entries()) {
                commentsObj[k] = v;
            }
            let dbStore = await this._taskStoreRepo.findOne({ where: { key: 'default_tasks_store' } });
            if (!dbStore) {
                dbStore = this._taskStoreRepo.create({
                    key: 'default_tasks_store',
                    tasks: this.tasks,
                    comments: commentsObj,
                });
            } else {
                dbStore.tasks = this.tasks;
                dbStore.comments = commentsObj;
            }
            await this._taskStoreRepo.save(dbStore);
        } catch (err) {
            console.error('Failed to save tasks to database:', err);
        }
    }

    getRawTasks(): TaskItem[] {
        return this.tasks;
    }

    private isAdmin(user?: UserPayload): boolean {
        if (!user) return false;
        const roles = Array.isArray(user?.roles) ? user.roles : [];
        const activeRole: any =
            roles.find((r: any) => r.is_default) ??
            roles.find((r: any) => Number(r.id) === Number(user?.is_active)) ??
            roles[0];

        const slug = (activeRole?.slug || '').toLowerCase().trim();
        const nameEn = (activeRole?.name_en || '').toLowerCase().trim();
        const nameKh = (activeRole?.name_kh || '').trim();

        const isUserRole =
            slug === 'user' ||
            slug === 'org_user' ||
            slug === 'member' ||
            slug === 'personal_workspace' ||
            slug === 'employee' ||
            slug === 'staff' ||
            nameEn === 'user' ||
            nameEn === 'member' ||
            nameKh === 'អ្នកប្រើប្រាស់' ||
            nameKh === 'សមាជិក';

        if (isUserRole) {
            return false;
        }

        return (
            slug === 'superadmin' ||
            slug === 'super_admin' ||
            slug === 'org_admin' ||
            slug === 'admin' ||
            slug === 'org_owner' ||
            nameEn === 'superadmin' ||
            nameEn === 'super admin' ||
            nameEn === 'org admin' ||
            nameEn === 'admin' ||
            nameKh === 'អភិបាលប្រព័ន្ធ' ||
            nameKh === 'រដ្ឋបាល'
        );
    }

    private isUserPlanMember(user: UserPayload, plan: any): boolean {
        if (!user) return false;
        if (this.isAdmin(user)) return true;

        const uId = user.id ? String(user.id) : '';
        const uEmail = (user.email || '').toLowerCase().trim();
        const uPhone = (user.phone || '').replace(/\D/g, '');
        const uNameEn = (user.name_en || '').toLowerCase().trim();
        const uNameKh = (user.name_kh || '').trim();

        const leadId = plan.lead?.id || plan.team_lead?.id;
        if (leadId && String(leadId) === uId) return true;
        const leadName = (plan.lead?.name || plan.team_lead?.name || '').toLowerCase().trim();
        if (leadName && (leadName === uNameEn || (uNameKh && leadName === uNameKh.toLowerCase()))) return true;

        const reporter = plan.reporter;
        if (reporter && typeof reporter === 'string') {
            const rLow = reporter.toLowerCase().trim();
            if (rLow === uNameEn || (uNameKh && reporter.trim() === uNameKh)) return true;
        }

        const members = Array.isArray(plan.members) ? plan.members : [];
        return members.some((m: any) => {
            if (m.id && String(m.id) === uId) return true;
            if (m.user_id && String(m.user_id) === uId) return true;
            if (m.email && uEmail && m.email.toLowerCase().trim() === uEmail) return true;
            if (m.phone && uPhone && m.phone.replace(/\D/g, '') === uPhone) return true;
            if (m.name) {
                const mName = m.name.toLowerCase().trim();
                if (mName === uNameEn || (uNameKh && m.name.trim() === uNameKh)) return true;
            }
            return false;
        });
    }

    private isUserTaskAssigneeOrReporter(user: UserPayload, t: TaskItem): boolean {
        if (!user) return false;
        const uId = user.id ? String(user.id) : '';
        const uEmail = (user.email || '').toLowerCase().trim();
        const uNameEn = (user.name_en || '').toLowerCase().trim();
        const uNameKh = (user.name_kh || '').trim();

        if (t.reporter && (String(t.reporter.id) === uId || (t.reporter.name && (t.reporter.name.toLowerCase().trim() === uNameEn || (uNameKh && t.reporter.name.trim() === uNameKh))))) {
            return true;
        }

        if (t.assignee && (String(t.assignee.id) === uId || (uEmail && t.assignee.email && t.assignee.email.toLowerCase().trim() === uEmail) || (t.assignee.name && (t.assignee.name.toLowerCase().trim() === uNameEn || (uNameKh && t.assignee.name.trim() === uNameKh))))) {
            return true;
        }

        if (Array.isArray(t.assignees)) {
            return t.assignees.some((a) => (
                String(a.id) === uId ||
                (uEmail && a.email && a.email.toLowerCase().trim() === uEmail) ||
                (a.name && (a.name.toLowerCase().trim() === uNameEn || (uNameKh && a.name.trim() === uNameKh)))
            ));
        }

        return false;
    }

    async getProjects(user?: UserPayload) {
        let planProjects: any[] = [];
        try {
            const planStorePath = path.join(process.cwd(), 'storage', 'plans_data_store.json');
            if (fs.existsSync(planStorePath)) {
                const raw = fs.readFileSync(planStorePath, 'utf8');
                const parsed = JSON.parse(raw);
                if (parsed && Array.isArray(parsed.plans)) {
                    planProjects = parsed.plans;
                }
            }
        } catch (e) {
            console.warn('Failed to read plans_data_store.json for task projects:', e);
        }

        const isUserAdmin = user ? this.isAdmin(user) : false;

        // Filter projects from plans_data_store.json if not admin
        if (!isUserAdmin && user) {
            planProjects = planProjects.filter((p) => this.isUserPlanMember(user, p));
        }

        const allowedPlanKeys = new Set(planProjects.map((p) => (p.id || '').toLowerCase()));
        planProjects.forEach((p) => {
            if (p.name) allowedPlanKeys.add(p.name.toLowerCase());
            if (p.code) allowedPlanKeys.add(p.code.toLowerCase());
        });

        // Collect distinct projects from current tasks
        const taskProjectMap = new Map<string, { id: string; name: string; code?: string }>();
        for (const t of this.tasks) {
            if (t.project_id || t.project_name) {
                if (!isUserAdmin && user) {
                    const isTaskAssigned = this.isUserTaskAssigneeOrReporter(user, t);
                    const pidKey = (t.project_id || '').toLowerCase();
                    const pnameKey = (t.project_name || '').toLowerCase();
                    const isAllowedPlan = allowedPlanKeys.has(pidKey) || allowedPlanKeys.has(pnameKey);
                    if (!isTaskAssigned && !isAllowedPlan) {
                        continue;
                    }
                }
                const key = (t.project_id || t.project_name).toLowerCase();
                if (!taskProjectMap.has(key)) {
                    taskProjectMap.set(key, {
                        id: t.project_id || key,
                        name: t.project_name || t.project_id || 'Project',
                        code: t.code ? t.code.split('-')[0].replace('#', '') : undefined,
                    });
                }
            }
        }

        const results: Array<{ id: string; name: string; code?: string; logo?: string; image?: string; status?: string }> = [];
        const seen = new Set<string>();

        for (const p of planProjects) {
            const normName = (p.name || '').trim().toLowerCase();
            if (normName && !seen.has(normName)) {
                seen.add(normName);
                const matchingTaskProj = Array.from(taskProjectMap.values()).find(
                    (tp) => tp.name.toLowerCase() === normName || tp.id.toLowerCase().includes(p.code?.toLowerCase() || '___')
                );
                results.push({
                    id: matchingTaskProj?.id || p.id || p.code,
                    name: p.name,
                    code: p.code || p.name.slice(0, 3).toUpperCase(),
                    logo: p.logo || p.image || null,
                    image: p.image || p.logo || null,
                    status: p.status,
                });
                if (matchingTaskProj) {
                    seen.add(matchingTaskProj.id.toLowerCase());
                }
            }
        }

        for (const tp of taskProjectMap.values()) {
            const normName = tp.name.trim().toLowerCase();
            const normId = tp.id.trim().toLowerCase();
            if (!seen.has(normName) && !seen.has(normId)) {
                seen.add(normName);
                seen.add(normId);
                results.push({
                    id: tp.id,
                    name: tp.name,
                    code: tp.code || tp.name.slice(0, 3).toUpperCase(),
                    logo: null,
                    image: null,
                });
            }
        }

        // Only fallback to sample projects if admin
        if (results.length === 0 && isUserAdmin) {
            results.push(
                { id: 'bms-digitech', name: 'BMS Digitech', code: 'BMS' },
                { id: 'wms-digitech', name: 'WMS Digitech', code: 'WMS' },
            );
        }

        return {
            status_code: 200,
            message: 'Projects retrieved successfully',
            data: results,
        };
    }

    async getMembers(user: UserPayload) {
        let dbUsers: User[] = [];
        const allowedPhones = ['010843612', '087280875', '067776682', '011242425'];
        try {
            dbUsers = await this._userRepo.find({
                relations: ['user_roles', 'user_roles.role', 'avatar_file'],
                order: { id: 'ASC' },
            });
            const normalizePhone = (p?: string) => (p || '').replace(/\D/g, '').slice(-8);
            const targetPhoneSuffixes = allowedPhones.map((p) => p.slice(-8));

            // Filter strictly to active team members, guaranteeing current logged-in user is included
            dbUsers = dbUsers.filter((u) => {
                if (user?.id && u.id === user.id) return true;
                const p = normalizePhone(u.phone);
                if (p && targetPhoneSuffixes.includes(p)) return true;
                const name = `${u.name_en || ''} ${u.name_kh || ''}`.toLowerCase();
                return (
                    name.includes('piseth') || name.includes('panhavorn') || name.includes('ពិសិដ្ឋ') ||
                    name.includes('brusmuny') || name.includes('ប្រុសមុន្នី') ||
                    name.includes('winner') || name.includes('វីនណឺរ') ||
                    name.includes('sovannara') || name.includes('សុវណ្ណារ៉ា')
                );
            });

            // Deduplicate by ID and phone suffix
            const seenIds = new Set<number>();
            const seenPhones = new Set<string>();
            const unique: User[] = [];
            for (const u of dbUsers) {
                if (seenIds.has(u.id)) continue;
                const p = normalizePhone(u.phone);
                if (p && seenPhones.has(p)) continue;
                seenIds.add(u.id);
                if (p) seenPhones.add(p);
                unique.push(u);
            }
            dbUsers = unique;
        } catch (e) {
            console.error('Error fetching users from DB:', e);
        }

        const colors = [
            'bg-indigo-600',
            'bg-blue-600',
            'bg-emerald-600',
            'bg-amber-600',
            'bg-purple-600',
        ];

        const defaultFallbacks = [
            { id: 64, name: 'Piseth Panhavorn', name_en: 'Piseth Panhavorn', name_kh: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត', role: 'Super Administrator', email: 'pisethpanhavorn544@gmail.com', avatar: null, colorClass: 'bg-indigo-600', phone: '010843612' },
            { id: 65, name: 'Pum Brusmuny', name_en: 'PUM BRUSMUNY', name_kh: 'ពុំ ប្រុសមុន្នី', role: 'Frontend Lead', email: 'pumprusmuny@example.com', avatar: null, colorClass: 'bg-blue-600', phone: '087280875' },
            { id: 66, name: 'Tha Winner', name_en: 'THA WINNER', name_kh: 'ថា វីនណឺរ', role: 'Backend Lead', email: 'thawinner@example.com', avatar: null, colorClass: 'bg-emerald-600', phone: '067776682' },
            { id: 67, name: 'Phuong Sovannara', name_en: 'Phuong Sovannara', name_kh: 'ភួង សុវណ្ណារ៉ា', role: 'Developer', email: 'phuongsovannara@gmail.com', avatar: null, colorClass: 'bg-amber-600', phone: '011242425' },
        ];

        let mapped = dbUsers.map((u, idx) => {
            const roleName =
                u.user_roles?.[0]?.role?.name_kh ||
                u.user_roles?.[0]?.role?.name_en ||
                u.user_roles?.[0]?.role?.slug ||
                'សមាជិក (Member)';

            let avatarUrl: string | null = null;
            if (u.avatar_file?.uri) {
                const domain = (u.avatar_file.file_domain || '').replace(/\/+$/, '');
                const uri = u.avatar_file.uri.replace(/^\/+/, '');
                avatarUrl = domain ? `${domain}/${uri}` : `/${uri}`;
            } else if (u.telegram_photo_url) {
                avatarUrl = u.telegram_photo_url;
            }

            const displayName = u.name_en || u.name_kh || `User #${u.id}`;

            return {
                id: u.id,
                name: displayName,
                name_kh: u.name_kh,
                name_en: u.name_en,
                email: u.email || '',
                phone: u.phone || '',
                role: roleName,
                avatar: avatarUrl,
                colorClass: colors[idx % colors.length],
            };
        });

        // Ensure key team members exist in the returned list
        for (const def of defaultFallbacks) {
            const exists = mapped.some(
                (m) =>
                    (m.phone && def.phone && m.phone.replace(/\D/g, '').slice(-8) === def.phone.replace(/\D/g, '').slice(-8)) ||
                    m.id === def.id ||
                    (m.name && def.name && m.name.toLowerCase().includes(def.name.toLowerCase().split(' ')[0]))
            );
            if (!exists) {
                mapped.push(def);
            }
        }

        return {
            status_code: 200,
            message: 'Task team members retrieved successfully',
            data: mapped,
        };
    }

    /**
     * Check whether a task belongs to the user:
     * Either the user is assigned to the task (primary assignee or in assignees list)
     * OR the user is the reporter of the task.
     * Matches by Khmer/English name, email, or user ID so mock ID collisions do not cause cross-user leaks.
     */
    private isTaskBelongToUser(task: TaskItem, user?: UserPayload): boolean {
        const userNameEn = (user?.name_en || '').toLowerCase().trim();
        const userNameKh = (user?.name_kh || '').toLowerCase().trim();
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

        // 1. Check if user is the Reporter
        if (matchUser(task.reporter)) return true;

        // 2. Check if user is the Primary Assignee
        if (matchUser(task.assignee)) return true;

        // 3. Check if user is in the Assignees list
        if (task.assignees && Array.isArray(task.assignees)) {
            for (const ass of task.assignees) {
                if (matchUser(ass)) return true;
            }
        }

        return false;
    }

    /** A query value only filters when it is set and is not one of the "no filter" sentinels the web sends. */
    private isFilterActive(value?: string): boolean {
        return Boolean(
            value && value !== 'all' && value !== 'undefined' && value !== 'null' && value.trim(),
        );
    }

    private matchesSearch(task: TaskItem, search?: string): boolean {
        if (!this.isFilterActive(search)) return true;
        const s = search!.trim().toLowerCase();
        return Boolean(
            (task.title && task.title.toLowerCase().includes(s)) ||
            (task.description && task.description.toLowerCase().includes(s)) ||
            (task.code && task.code.toLowerCase().includes(s)),
        );
    }

    private matchesPriority(task: TaskItem, priority?: string): boolean {
        if (!this.isFilterActive(priority)) return true;
        return task.priority === priority;
    }

    private matchesProject(task: TaskItem, projectId?: string): boolean {
        if (!this.isFilterActive(projectId)) return true;
        const pid = projectId!.toLowerCase();
        return Boolean(
            (task.project_id && (task.project_id.toLowerCase().includes(pid) || pid.includes(task.project_id.toLowerCase()))) ||
            (task.project_name && (task.project_name.toLowerCase().includes(pid) || pid.includes(task.project_name.toLowerCase()))) ||
            (task.code && (task.code.toLowerCase().includes(pid) || pid.includes(task.code.toLowerCase()))),
        );
    }

    private matchesMember(task: TaskItem, memberId?: string): boolean {
        if (!this.isFilterActive(memberId)) return true;
        const mId = Number(memberId);
        return Boolean(
            Number(task.assignee?.id) === mId ||
            (task.assignees && task.assignees.some((a) => Number(a.id) === mId)) ||
            Number(task.reporter?.id) === mId,
        );
    }

    private matchesStatus(task: TaskItem, status?: string): boolean {
        if (!this.isFilterActive(status)) return true;
        return task.status === status;
    }

    /**
     * Per-status totals for a set of tasks, keyed the way the web's status chips are.
     * Shared by the task list and the home overview so both pages count identically.
     */
    countByStatus(tasks: TaskItem[]) {
        return {
            all: tasks.length,
            new: tasks.filter((t) => t.status === TaskStatusEnum.NEW || (t.status as any) === 'pending').length,
            confirmed: tasks.filter((t) => t.status === TaskStatusEnum.CONFIRMED).length,
            unconfirmed: tasks.filter((t) => t.status === TaskStatusEnum.UNCONFIRMED || (t.status as any) === 'todo').length,
            in_progress: tasks.filter((t) => t.status === TaskStatusEnum.IN_PROGRESS).length,
            in_review: tasks.filter((t) => t.status === TaskStatusEnum.IN_REVIEW || (t.status as any) === 'review').length,
            reopened: tasks.filter((t) => t.status === TaskStatusEnum.REOPENED).length,
            done: tasks.filter((t) => t.status === TaskStatusEnum.DONE || (t.status as any) === 'completed').length,
        };
    }

    /** Public wrapper so the home overview can scope its counts to the signed-in user. */
    belongsToUser(task: TaskItem, user?: UserPayload): boolean {
        return this.isTaskBelongToUser(task, user);
    }

    /** Load database user avatars map for high-performance task avatar enrichment */
    private async getAvatarMap(): Promise<Map<string, string>> {
        const avatarMap = new Map<string, string>();
        try {
            const users = await this._userRepo.find({
                relations: ['avatar_file'],
            });
            for (const u of users) {
                let avatarUrl: string | null = null;
                if (u.avatar_file?.uri) {
                    let domain = (u.avatar_file.file_domain || '').replace(/\/+$/, '');
                    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(domain.trim())) {
                        domain = '';
                    }
                    const uri = u.avatar_file.uri.replace(/^\/+/, '');
                    avatarUrl = domain ? `${domain}/${uri}` : `/${uri}`;
                } else if (u.telegram_photo_url) {
                    avatarUrl = u.telegram_photo_url;
                }
                if (avatarUrl) {
                    if (u.id) avatarMap.set(`id:${u.id}`, avatarUrl);
                    if (u.phone) {
                        const cleanPhone = u.phone.replace(/\D/g, '');
                        avatarMap.set(`phone:${cleanPhone}`, avatarUrl);
                        if (cleanPhone.length >= 8) avatarMap.set(`phone:${cleanPhone.slice(-8)}`, avatarUrl);
                    }
                    if (u.email) avatarMap.set(`email:${u.email.toLowerCase().trim()}`, avatarUrl);
                    if (u.name_en) avatarMap.set(`name:${u.name_en.toLowerCase().trim()}`, avatarUrl);
                    if (u.name_kh) avatarMap.set(`name:${u.name_kh.toLowerCase().trim()}`, avatarUrl);
                    const parts = `${u.name_en || ''} ${u.name_kh || ''}`.toLowerCase().split(/\s+/).filter(Boolean);
                    for (const part of parts) {
                        if (part.length >= 3 && !avatarMap.has(`part:${part}`)) {
                            avatarMap.set(`part:${part}`, avatarUrl);
                        }
                    }
                }
            }
        } catch (e) {
            console.error('Failed to load user avatars:', e);
        }
        return avatarMap;
    }

    private resolveMemberAvatar(m: any, avatarMap: Map<string, string>): string | null {
        if (!m) return null;
        if (m.id && avatarMap.has(`id:${m.id}`)) {
            return avatarMap.get(`id:${m.id}`)!;
        }
        if (m.email && avatarMap.has(`email:${m.email.toLowerCase().trim()}`)) {
            return avatarMap.get(`email:${m.email.toLowerCase().trim()}`)!;
        }
        if (m.phone) {
            const p = String(m.phone).replace(/\D/g, '');
            if (avatarMap.has(`phone:${p}`)) return avatarMap.get(`phone:${p}`)!;
            if (p.length >= 8 && avatarMap.has(`phone:${p.slice(-8)}`)) return avatarMap.get(`phone:${p.slice(-8)}`)!;
        }
        const nameKey = (m.name || '').toLowerCase().trim();
        if (nameKey) {
            if (avatarMap.has(`name:${nameKey}`)) return avatarMap.get(`name:${nameKey}`)!;
            for (const [k, v] of avatarMap.entries()) {
                if (k.startsWith('name:')) {
                    const candidate = k.replace('name:', '');
                    if (candidate && (candidate === nameKey || candidate.includes(nameKey) || nameKey.includes(candidate))) {
                        return v;
                    }
                } else if (k.startsWith('part:')) {
                    const candidate = k.replace('part:', '');
                    if (nameKey.includes(candidate)) {
                        return v;
                    }
                }
            }
        }
        if (m.avatar && typeof m.avatar === 'string' && !m.avatar.includes('placeholder')) {
            const cleaned = m.avatar.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i, '/');
            return cleaned.startsWith('/') || cleaned.startsWith('http') ? cleaned : `/${cleaned}`;
        }
        return null;
    }

    private async enrichTasksWithAvatars(tasks: TaskItem[], currentUser?: UserPayload): Promise<TaskItem[]> {
        if (!tasks || tasks.length === 0) return tasks;
        const avatarMap = await this.getAvatarMap();
        return tasks.map((t) => {
            const copy = { ...t };
            if (copy.assignee) {
                const av = this.resolveMemberAvatar(copy.assignee, avatarMap);
                if (av) {
                    copy.assignee = { ...copy.assignee, avatar: av };
                }
            }
            if (Array.isArray(copy.assignees)) {
                copy.assignees = copy.assignees.map((a) => {
                    const av = this.resolveMemberAvatar(a, avatarMap);
                    return av ? { ...a, avatar: av } : a;
                });
            }
            if (copy.reporter) {
                const av = this.resolveMemberAvatar(copy.reporter, avatarMap);
                if (av) {
                    copy.reporter = { ...copy.reporter, avatar: av };
                }
            }
            return copy;
        });
    }

    async getTasks(user: UserPayload, query: QueryTasksDto) {
        await this.ensureStoreLoaded();
        let validTasks = this.tasks.filter((t) => !this.isPmsTask(t));

        // For non-admin users, restrict tasks to those belonging to their assigned projects or tasks assigned to them
        if (user && !this.isAdmin(user)) {
            let accessiblePlans: any[] = [];
            try {
                const planStorePath = path.join(process.cwd(), 'storage', 'plans_data_store.json');
                if (fs.existsSync(planStorePath)) {
                    const raw = fs.readFileSync(planStorePath, 'utf8');
                    const parsed = JSON.parse(raw);
                    if (parsed && Array.isArray(parsed.plans)) {
                        accessiblePlans = parsed.plans.filter((p: any) => this.isUserPlanMember(user, p));
                    }
                }
            } catch (e) {
                console.warn('Failed to read plans for task filtering:', e);
            }

            const allowedPlanKeys = new Set(accessiblePlans.map((p) => (p.id || '').toLowerCase()));
            accessiblePlans.forEach((p) => {
                if (p.name) allowedPlanKeys.add(p.name.toLowerCase());
                if (p.code) allowedPlanKeys.add(p.code.toLowerCase());
            });

            validTasks = validTasks.filter((t) => {
                if (this.isUserTaskAssigneeOrReporter(user, t)) return true;
                const pidKey = (t.project_id || '').toLowerCase();
                const pnameKey = (t.project_name || '').toLowerCase();
                return allowedPlanKeys.has(pidKey) || allowedPlanKeys.has(pnameKey);
            });
        }

        // Every active filter EXCEPT status. Each status chip shows how many tasks
        // would match if that chip were picked, so the counted scope must not be
        // narrowed by whichever status happens to be selected right now.
        const countScope = validTasks.filter(
            (t) =>
                this.matchesSearch(t, query.search) &&
                this.matchesPriority(t, query.priority) &&
                this.matchesProject(t, query.project_id) &&
                this.matchesMember(t, query.member_id),
        );

        const list = countScope.filter((t) => this.matchesStatus(t, query.status));

        const limit = query.limit ? parseInt(query.limit, 10) : 100;
        const offset = query.offset ? parseInt(query.offset, 10) : 0;
        const paginated = list.slice(offset, offset + limit);
        const enrichedResults = await this.enrichTasksWithAvatars(paginated, user);

        return {
            status_code: 200,
            message: 'Tasks retrieved successfully',
            data: {
                results: enrichedResults,
                total: list.length,
                limit,
                offset,
                counts: this.countByStatus(countScope),
            },
        };
    }

    async getTaskById(user: UserPayload, id: number) {
        await this.ensureStoreLoaded();
        const task = this.tasks.find((t) => t.id === id);
        if (!task) {
            throw new NotFoundException(`Task #${id} not found`);
        }

        if (user && !this.isAdmin(user)) {
            let isAllowed = this.isUserTaskAssigneeOrReporter(user, task);
            if (!isAllowed) {
                try {
                    const planStorePath = path.join(process.cwd(), 'storage', 'plans_data_store.json');
                    if (fs.existsSync(planStorePath)) {
                        const raw = fs.readFileSync(planStorePath, 'utf8');
                        const parsed = JSON.parse(raw);
                        if (parsed && Array.isArray(parsed.plans)) {
                            const pidKey = (task.project_id || '').toLowerCase();
                            const pnameKey = (task.project_name || '').toLowerCase();
                            const matchedPlan = parsed.plans.find(
                                (p: any) =>
                                    (p.id && p.id.toLowerCase() === pidKey) ||
                                    (p.name && p.name.toLowerCase() === pnameKey) ||
                                    (p.code && p.code.toLowerCase() === pidKey)
                            );
                            if (matchedPlan && this.isUserPlanMember(user, matchedPlan)) {
                                isAllowed = true;
                            }
                        }
                    }
                } catch (e) {
                    console.warn('Failed to verify task project permissions:', e);
                }
            }
            if (!isAllowed) {
                throw new ForbiddenException('អ្នកមិនមានសិទ្ធិចូលមើលភារកិច្ចនេះទេ (You do not have permission to view this task).');
            }
        }

        const [enrichedTask] = await this.enrichTasksWithAvatars([task], user);

        return {
            status_code: 200,
            message: 'Task retrieved successfully',
            data: enrichedTask || task,
        };
    }

    async createTask(user: UserPayload, dto: CreateTaskDto) {
        await this.ensureStoreLoaded();
        const prefix = (dto.project_id === 'wms-digitech' || (dto.code && dto.code.toUpperCase().includes('WMS'))) ? 'WMS' : 'BMS';
        let formattedCode = '';
        if (dto.code && dto.code.trim()) {
            formattedCode = dto.code.trim().startsWith('#') ? dto.code.trim() : `#${dto.code.trim()}`;
        } else {
            const projectTasks = this.tasks.filter((t) => t.project_id === dto.project_id || t.code?.toUpperCase().includes(prefix));
            let maxNum = -1;
            for (const t of projectTasks) {
                if (t.code) {
                    const match = t.code.match(/\d+/);
                    if (match) {
                        const val = parseInt(match[0], 10);
                        if (!isNaN(val) && val > maxNum) {
                            maxNum = val;
                        }
                    }
                }
            }
            const nextSeq = maxNum >= 0 ? maxNum + 1 : 0;
            formattedCode = `#${prefix}-${String(nextSeq).padStart(4, '0')}`;
        }

        // Process assignees
        let assigneesList: Array<{ id: number; name: string; avatar?: string | null; role?: string; email?: string }> = [];
        if (dto.assignees && Array.isArray(dto.assignees) && dto.assignees.length > 0) {
            assigneesList = dto.assignees.map((a: any, idx: number) => ({
                id: Number(a.id) || (idx + 1),
                name: typeof a === 'string' ? a : (a.name || a.title || 'Assignee'),
                avatar: (typeof a === 'object' && a.avatar) ? a.avatar : null,
                role: (typeof a === 'object' && a.role) ? a.role : 'Assignee',
                email: (typeof a === 'object' && a.email) ? a.email : '',
            }));
        } else if (dto.assignee) {
            if (typeof dto.assignee === 'string' && dto.assignee.trim()) {
                assigneesList = dto.assignee.split(',').map((nameStr: string, idx: number) => ({
                    id: idx + 1,
                    name: nameStr.trim(),
                    avatar: null,
                    role: 'Assignee',
                }));
            } else if (typeof dto.assignee === 'object' && dto.assignee.name && dto.assignee.name.trim()) {
                assigneesList = [{
                    id: Number(dto.assignee.id) || 1,
                    name: dto.assignee.name.trim(),
                    avatar: dto.assignee.avatar || null,
                    role: dto.assignee.role || 'Assignee',
                    email: dto.assignee.email || '',
                }];
            }
        }

        const primaryAssignee = assigneesList.length > 0 ? assigneesList[0] : null;

        // Process reporter
        let taskReporter: any = null;
        if (dto.reporter) {
            if (typeof dto.reporter === 'string' && dto.reporter.trim()) {
                taskReporter = {
                    id: user?.id || 0,
                    name: dto.reporter.trim(),
                    avatar: (user?.avatar as any)?.uri || null,
                    role: 'Reporter',
                };
            } else if (typeof dto.reporter === 'object' && dto.reporter.name && dto.reporter.name.trim()) {
                taskReporter = {
                    id: Number(dto.reporter.id) || user?.id || 0,
                    name: dto.reporter.name.trim(),
                    avatar: dto.reporter.avatar || (user?.avatar as any)?.uri || null,
                    role: dto.reporter.role || 'Reporter',
                };
            }
        }

        // Fallback: If no reporter is explicitly selected, creator (user) is ALWAYS the reporter!
        if (!taskReporter && user) {
            taskReporter = {
                id: user.id || 1,
                name: user.name_en || user.name_kh || 'User',
                avatar: (user.avatar as any)?.uri || null,
                role: user.roles?.[0]?.name_en || user.roles?.[0]?.name_kh || 'Reporter',
            };
        }

        const initialAttachments = (dto.attachments && Array.isArray(dto.attachments)) ? dto.attachments : [];

        const newTask: TaskItem = {
            id: Date.now(),
            code: formattedCode,
            title: dto.title,
            description: dto.description || '',
            module: (dto as any).module || dto.title || 'Task Management',
            task_type: dto.task_type || 'feature',
            status: dto.status || TaskStatusEnum.NEW,
            priority: dto.priority || TaskPriorityEnum.MEDIUM,
            progress: 0,
            comments_count: 0,
            attachments_count: initialAttachments.length,
            due_date: dto.due_date || null,
            project_id: dto.project_id || (prefix === 'WMS' ? 'wms-digitech' : 'bms-digitech'),
            project_name: prefix === 'BMS' ? 'BMS Digitech' : 'WMS Digitech',
            reporter: taskReporter,
            assignee: primaryAssignee,
            assignees: assigneesList,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            attachments: initialAttachments,
        };

        this.tasks.unshift(newTask);

        if (initialAttachments.length > 0) {
            const comments = this.ensureTaskComments(newTask.id);
            comments.push({
                id: Date.now() + 1,
                sender_id: user?.id || taskReporter?.id || 1,
                sender_name: taskReporter?.name || user?.name_kh || user?.name_en || 'អ្នកប្រើប្រាស់',
                sender_avatar: taskReporter?.avatar || (user?.avatar as any)?.uri || '/images/placeholder/avatar.jpg',
                text: 'បានភ្ជាប់ឯកសារពេលបង្កើតការងារថ្មី',
                time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                is_self: true,
                is_system: false,
                attachments: initialAttachments,
                created_at: new Date().toISOString(),
                seen_by: [],
            });
            this.taskComments.set(newTask.id, comments);
            newTask.comments_count = comments.length;
        }

        this.saveStore();

        // Dispatch Telegram Notification (Exact PMS format)
        const creatorName = taskReporter?.name || user?.name_kh || user?.name_en || 'អ្នកប្រើប្រាស់';
        const taskCode = newTask.code || `#${prefix}-0000`;
        let firstLine = `📌 ${creatorName} បានបង្កើតការងារថ្មី ${taskCode}`;
        if (initialAttachments.length > 0) {
            firstLine += `\n📎 ឯកសារភ្ជាប់ (${initialAttachments.length})`;
        }
        const targetIds = [user?.id, ...assigneesList.map((a) => a.id)].filter(Boolean) as number[];
        this.sendTelegramNotification(firstLine, newTask, targetIds);

        // Push in-app real-time notification
        if (this._notificationService) {
            const notif: NotificationItem = {
                id: 'notif_task_' + Date.now(),
                type: 'task_assigned',
                title: 'ភារកិច្ចថ្មីត្រូវបានចាត់តាំង',
                title_kh: 'ភារកិច្ចថ្មីត្រូវបានចាត់តាំង',
                title_en: 'New task assigned',
                message: `${creatorName} បានបង្កើត និងចាត់តាំងភារកិច្ច "${taskCode}: ${newTask.title}"`,
                message_kh: `${creatorName} បានបង្កើត និងចាត់តាំងភារកិច្ច "${taskCode}: ${newTask.title}"`,
                message_en: `${creatorName} created and assigned task "${taskCode}: ${newTask.title}"`,
                is_unread: true,
                read_at: null,
                created_at: new Date().toISOString(),
                project: {
                    id: newTask.project_id,
                    name_en: newTask.project_name,
                    name_kh: newTask.project_name,
                    short_name_en: newTask.project_name,
                    short_name_kh: newTask.project_name,
                },
                task: {
                    id: newTask.id,
                    task_code: newTask.code,
                    title: newTask.title,
                },
                last_message: {
                    source: 'activity',
                    id: 'msg_' + Date.now(),
                    content: 'បានចាត់តាំងភារកិច្ចថ្មី',
                    sender_id: user?.id || 1,
                    chat_message_type_id: 1,
                    created_at: new Date().toISOString(),
                    sender: { id: user?.id || 1, name_en: creatorName, name_kh: creatorName },
                },
            };
            this._notificationService.pushNotification(notif, targetIds);
        }

        if (this._realtimeGateway) {
            this._realtimeGateway.emitTaskUpdated({ task_id: newTask.id, project_id: newTask.project_id });
        }

        const [enrichedTask] = await this.enrichTasksWithAvatars([newTask], user);

        return {
            status_code: 201,
            message: 'Task created successfully',
            data: enrichedTask || newTask,
        };
    }

    private getProjectPrefix(task?: TaskItem): string {
        if (!task) return 'WMS';
        if (task.project_id === 'bms-digitech' || task.code?.startsWith('#BMS') || task.project_name?.includes('BMS')) return 'BMS';
        if (task.project_id === 'wms-digitech' || task.code?.startsWith('#WMS') || task.project_name?.includes('WMS')) return 'WMS';
        return 'WMS';
    }

    private getTaskContextLine(task: TaskItem): string {
        return (task.title || task.code || 'Task').trim();
    }

    private getStatusLabel(status?: string): string {
        switch (status?.toLowerCase()) {
            case 'new':
            case 'todo': return 'ថ្មី';
            case 'confirmed': return 'បញ្ជាក់';
            case 'unconfirmed': return 'មិនបញ្ជាក់';
            case 'in_progress': return 'កំពុងធ្វើ';
            case 'in_review':
            case 'review': return 'ស្នើពិនិត្យ';
            case 'reopened': return 'បើកឡើងវិញ';
            case 'done':
            case 'completed': return 'បញ្ចប់';
            default: return status || '';
        }
    }

    private getPriorityLabel(priority?: string): string {
        switch (priority?.toLowerCase()) {
            case 'urgent': return 'បន្ទាន់';
            case 'high': return 'ខ្ពស់';
            case 'medium': return 'មធ្យម';
            case 'low': return 'ទាប';
            default: return priority || '';
        }
    }

    private getTaskTypeLabel(type?: string): string {
        switch (type?.toLowerCase()) {
            case 'feature': return 'មុខងារ';
            case 'improvement': return 'ការកែលម្អ';
            case 'bug': return 'កំហុស';
            case 'documentation': return 'ឯកសារ';
            case 'research': return 'ស្រាវជ្រាវ';
            case 'refactor': return 'ប្លង់កម្មវិធី';
            case 'core_task': return 'កិច្ចការចម្បង';
            default: return type || 'មុខងារ';
        }
    }

    private inferTaskType(task: any): string {
        if (task.task_type) return task.task_type;
        const text = `${task.title || ''} ${task.description || ''} ${task.module || ''}`.toLowerCase();
        if (text.includes('bug') || text.includes('cannot scroll') || text.includes('missing') || text.includes('fix')) {
            return 'bug';
        }
        if (text.includes('improvement') || text.includes('refactor') || text.includes('security setting')) {
            return 'improvement';
        }
        return 'feature';
    }

    private escapeHtml(text: string): string {
        return (text || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    private async sendTelegramNotification(
        firstLine: string,
        task: TaskItem,
        targetUserIds?: Array<number | string>,
    ): Promise<void> {
        const botToken =
            process.env.TELEGRAM_BOT_TOKEN ||
            appConfig.ORGANIZATION_LOG?.TELEGRAM_BOT_TOKEN ||
            '8680838714:AAHCMGOEmtoVZxzSUD9nxHrew0BazYGshXQ';
        if (!botToken) return;

        const secondLine = this.escapeHtml(this.getTaskContextLine(task));
        const escapedFirstLine = this.escapeHtml(firstLine);
        const fullMessage = `${escapedFirstLine}\n${secondLine}`;

        const frontendUrl = (
            process.env.APP_DEPLOY_URL ||
            'https://wms-digitechkh.vercel.app'
        ).replace(/\/+$/, '');
        const taskUrl = `${frontendUrl}/#/member/projects/${task.project_id || 'wms-digitech'}`;

        const replyMarkup = {
            inline_keyboard: [
                [
                    {
                        text: 'មើលការងារលម្អិត 🔍',
                        url: taskUrl,
                    },
                ],
            ],
        };

        try {
            const linkedUsers = await this._userRepo
                .createQueryBuilder('user')
                .where('user.telegram_id IS NOT NULL')
                .andWhere('user.is_active = 1')
                .getMany();

            const chatIdsToSend = new Set<string>();

            // Primary admin ID
            chatIdsToSend.add('8836877586');

            if (process.env.TELEGRAM_CHAT_MAIN_ID) {
                chatIdsToSend.add(String(process.env.TELEGRAM_CHAT_MAIN_ID));
            }
            if (process.env.TELEGRAM_CHAT_ID) {
                chatIdsToSend.add(String(process.env.TELEGRAM_CHAT_ID));
            }
            if (appConfig.ORGANIZATION_LOG?.TELEGRAM_CHAT_ID) {
                chatIdsToSend.add(String(appConfig.ORGANIZATION_LOG.TELEGRAM_CHAT_ID));
            }

            const targetSet = targetUserIds && targetUserIds.length > 0
                ? new Set(targetUserIds.map((id) => Number(id)))
                : null;

            for (const u of linkedUsers) {
                if (u.telegram_id && (!targetSet || targetSet.has(u.id))) {
                    chatIdsToSend.add(String(u.telegram_id));
                }
            }

            const sendPromises = Array.from(chatIdsToSend).map(async (chatId) => {
                if (!chatId) return;

                let messageThreadId: number | undefined = undefined;
                try {
                    const u = linkedUsers.find((user) => String(user.telegram_id) === chatId);
                    if (u) {
                        const thread = await this._threadRepo.findOne({
                            where: { user_id: u.id, project_id: task.project_id },
                        });
                        if (thread?.message_thread_id) {
                            messageThreadId = thread.message_thread_id;
                        }
                    }
                } catch (e) {}

                const payload: any = {
                    chat_id: chatId,
                    text: fullMessage,
                    parse_mode: 'HTML',
                    reply_markup: replyMarkup,
                };
                if (messageThreadId) {
                    payload.message_thread_id = messageThreadId;
                }

                try {
                    await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, payload, { timeout: 8000 });
                } catch (err: any) {
                    const desc = err?.response?.data?.description || err?.message || '';
                    if (messageThreadId && desc.toLowerCase().includes('thread')) {
                        delete payload.message_thread_id;
                        try {
                            await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, payload, { timeout: 8000 });
                        } catch (e: any) {
                            console.warn(`[Telegram Notification] Fallback failed for ${chatId}:`, e?.response?.data?.description || e?.message || e);
                        }
                    } else {
                        console.warn(`[Telegram Notification] Failed to send to ${chatId}:`, desc);
                    }
                }
            });

            await Promise.allSettled(sendPromises);
        } catch (err: any) {
            console.warn('[Telegram Notification] Error querying linked users:', err?.message || err);
        }
    }

    async updateTask(user: UserPayload, id: number, dto: UpdateTaskDto) {
        await this.ensureStoreLoaded();
        const index = this.tasks.findIndex((t) => t.id === id);
        if (index === -1) {
            throw new NotFoundException(`Task #${id} not found`);
        }

        const current = this.tasks[index];
        const updated: TaskItem = {
            ...current,
            title: dto.title ?? current.title,
            description: dto.description ?? current.description,
            status: dto.status ?? current.status,
            task_type: dto.task_type !== undefined ? dto.task_type : (current.task_type || 'feature'),
            priority: dto.priority ?? current.priority,
            progress: dto.progress !== undefined ? dto.progress : (dto.status === TaskStatusEnum.DONE ? 100 : current.progress),
            due_date: dto.due_date !== undefined ? dto.due_date : current.due_date,
            updated_at: new Date().toISOString(),
        };

        // Record action history in task comments
        const comments = this.ensureTaskComments(id);
        const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const updaterName = (user?.name_kh || user?.name_en || '').trim() || 'Piseth Panhavorn';
        const actorPrefix = updaterName ? `${updaterName} ` : '';

        if (dto.title && dto.title.trim() !== current.title) {
            comments.push({
                id: Date.now() + 7,
                sender_id: 0,
                sender_name: 'ប្រព័ន្ធ (System)',
                sender_avatar: null,
                text: `${actorPrefix}បានប្តូរចំណងជើងការងារទៅជា "${dto.title.trim()}"`,
                time: nowTime,
                is_self: false,
                is_system: true,
                created_at: new Date().toISOString(),
            });
        }

        if (dto.description !== undefined && dto.description.trim() !== (current.description || '').trim()) {
            comments.push({
                id: Date.now() + 8,
                sender_id: 0,
                sender_name: 'ប្រព័ន្ធ (System)',
                sender_avatar: null,
                text: `${actorPrefix}បានកែប្រែការពិពណ៌នាការងារ`,
                time: nowTime,
                is_self: false,
                is_system: true,
                created_at: new Date().toISOString(),
            });
        }

        if (dto.task_type && dto.task_type !== current.task_type) {
            comments.push({
                id: Date.now() + 5,
                sender_id: 0,
                sender_name: 'ប្រព័ន្ធ (System)',
                sender_avatar: null,
                text: `${actorPrefix}បានប្តូរប្រភេទការងារពី "${this.getTaskTypeLabel(current.task_type)}" ទៅជា "${this.getTaskTypeLabel(dto.task_type)}"`,
                time: nowTime,
                is_self: false,
                is_system: true,
                created_at: new Date().toISOString(),
            });
        }

        if (dto.status && dto.status !== current.status) {
            comments.push({
                id: Date.now() + 1,
                sender_id: 0,
                sender_name: 'ប្រព័ន្ធ (System)',
                sender_avatar: null,
                text: `${actorPrefix}បានប្តូរស្ថានភាពពី "${this.getStatusLabel(current.status)}" ទៅជា "${this.getStatusLabel(dto.status)}"`,
                time: nowTime,
                is_self: false,
                is_system: true,
                created_at: new Date().toISOString(),
            });
        }

        if (dto.priority && dto.priority !== current.priority) {
            comments.push({
                id: Date.now() + 2,
                sender_id: 0,
                sender_name: 'ប្រព័ន្ធ (System)',
                sender_avatar: null,
                text: `${actorPrefix}បានប្តូរអាទិភាពពី "${this.getPriorityLabel(current.priority)}" ទៅជា "${this.getPriorityLabel(dto.priority)}"`,
                time: nowTime,
                is_self: false,
                is_system: true,
                created_at: new Date().toISOString(),
            });
        }

        if (dto.due_date !== undefined && dto.due_date !== current.due_date) {
            let formatted = 'សម្អាត';
            if (dto.due_date) {
                const d = new Date(dto.due_date);
                if (!isNaN(d.getTime())) {
                    const day = String(d.getDate()).padStart(2, '0');
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const year = d.getFullYear();
                    formatted = `${day}/${month}/${year}`;
                }
            }
            comments.push({
                id: Date.now() + 3,
                sender_id: 0,
                sender_name: 'ប្រព័ន្ធ (System)',
                sender_avatar: null,
                text: dto.due_date ? `${actorPrefix}បានកំណត់កាលបរិច្ឆេទត្រូវធ្វើថ្មី៖ ${formatted}` : `${actorPrefix}បានសម្អាតកាលបរិច្ឆេទកំណត់`,
                time: nowTime,
                is_self: false,
                is_system: true,
                created_at: new Date().toISOString(),
            });
        }

        if (dto.assignees && Array.isArray(dto.assignees)) {
            updated.assignees = dto.assignees;
            if (dto.assignees.length > 0) {
                updated.assignee = dto.assignees[0];
            }
            const names = dto.assignees.map((a: any) => a.name).join(', ');
            comments.push({
                id: Date.now() + 4,
                sender_id: 0,
                sender_name: 'ប្រព័ន្ធ (System)',
                sender_avatar: null,
                text: `${actorPrefix}បានធ្វើបច្ចុប្បន្នភាពអ្នកទទួលបន្ទុក៖ ${names}`,
                time: nowTime,
                is_self: false,
                is_system: true,
                created_at: new Date().toISOString(),
            });
        } else if (dto.assignee) {
            updated.assignee = dto.assignee;
            updated.assignees = [dto.assignee];
            comments.push({
                id: Date.now() + 4,
                sender_id: 0,
                sender_name: 'ប្រព័ន្ធ (System)',
                sender_avatar: null,
                text: `${actorPrefix}បានចាត់តាំងភារកិច្ចទៅកាន់៖ ${dto.assignee.name}`,
                time: nowTime,
                is_self: false,
                is_system: true,
                created_at: new Date().toISOString(),
            });
        }

        if (dto.reporter) {
            updated.reporter = dto.reporter;
            comments.push({
                id: Date.now() + 6,
                sender_id: 0,
                sender_name: 'ប្រព័ន្ធ (System)',
                sender_avatar: null,
                text: `${actorPrefix}បានប្តូរអ្នកបង្កើតទៅកាន់៖ "${dto.reporter.name}"`,
                time: nowTime,
                is_self: false,
                is_system: true,
                created_at: new Date().toISOString(),
            });
        }

        this.taskComments.set(id, comments);
        updated.comments_count = comments.length;

        this.tasks[index] = updated;
        this.saveStore();

        // Send Telegram Notification (Exact PMS format)
        const targetIds = [
            user.id,
            updated.reporter?.id,
            updated.assignee?.id,
            ...(updated.assignees?.map((a) => a.id) || []),
        ].filter(Boolean) as number[];

        if (dto.task_type && dto.task_type !== current.task_type) {
            const firstLine = `🏷️ ${updaterName} ប្តូរប្រភេទការងារទៅ << ${this.getTaskTypeLabel(dto.task_type)} >>`;
            this.sendTelegramNotification(firstLine, updated, targetIds);
        } else if (dto.status && dto.status !== current.status) {
            const firstLine = `🔄 ${updaterName} ប្តូរស្ថានភាពការងារទៅ << ${this.getStatusLabel(dto.status)} >>`;
            this.sendTelegramNotification(firstLine, updated, targetIds);
        } else if (dto.priority && dto.priority !== current.priority) {
            const firstLine = `⚡ ${updaterName} ប្តូរអាទិភាពការងារទៅ << ${this.getPriorityLabel(dto.priority)} >>`;
            this.sendTelegramNotification(firstLine, updated, targetIds);
        } else if (dto.assignee || (dto.assignees && dto.assignees.length > 0)) {
            const assigneeName = dto.assignee?.name || (dto.assignees ? dto.assignees.map((a: any) => a.name).join(', ') : '');
            const firstLine = `👤 ${updaterName} បានចាត់តាំងការងារទៅកាន់ << ${assigneeName} >>`;
            this.sendTelegramNotification(firstLine, updated, targetIds);
        } else if (dto.due_date !== undefined && dto.due_date !== current.due_date) {
            let formatted = 'សម្អាត';
            if (dto.due_date) {
                const d = new Date(dto.due_date);
                if (!isNaN(d.getTime())) {
                    const day = String(d.getDate()).padStart(2, '0');
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const year = d.getFullYear();
                    formatted = `${day}/${month}/${year}`;
                }
            }
            const firstLine = dto.due_date
                ? `📅 ${updaterName} បានកំណត់កាលបរិច្ឆេទការងារថ្មី៖ ${formatted}`
                : `📅 ${updaterName} បានសម្អាតកាលបរិច្ឆេទកំណត់ការងារ`;
            this.sendTelegramNotification(firstLine, updated, targetIds);
        } else if (dto.progress !== undefined && dto.progress !== current.progress) {
            const firstLine = `📈 ${updaterName} បានធ្វើបច្ចុប្បន្នភាពវឌ្ឍនភាព៖ ${dto.progress}%`;
            this.sendTelegramNotification(firstLine, updated, targetIds);
        } else if (dto.title && dto.title !== current.title) {
            const firstLine = `✏️ ${updaterName} បានកែប្រែចំណងជើងការងារ`;
            this.sendTelegramNotification(firstLine, updated, targetIds);
        } else if (dto.description && dto.description !== current.description) {
            const firstLine = `📝 ${updaterName} បានកែប្រែការពិពណ៌នាការងារ`;
            this.sendTelegramNotification(firstLine, updated, targetIds);
        }

        if (this._notificationService) {
            let updateMsgKh = `${updaterName} បានធ្វើបច្ចុប្បន្នភាពភារកិច្ច "${updated.code}: ${updated.title}"`;
            if (dto.status && dto.status !== current.status) {
                updateMsgKh = `${updaterName} បានប្តូរស្ថានភាពទៅជា "${this.getStatusLabel(dto.status)}" លើភារកិច្ច "${updated.code}: ${updated.title}"`;
            } else if (dto.priority && dto.priority !== current.priority) {
                updateMsgKh = `${updaterName} បានប្តូរអាទិភាពទៅជា "${this.getPriorityLabel(dto.priority)}" លើភារកិច្ច "${updated.code}: ${updated.title}"`;
            }

            const notif: NotificationItem = {
                id: 'notif_update_' + Date.now(),
                type: 'task_updated',
                title: 'បច្ចុប្បន្នភាពភារកិច្ច',
                title_kh: 'បច្ចុប្បន្នភាពភារកិច្ច',
                title_en: 'Task Updated',
                message: updateMsgKh,
                message_kh: updateMsgKh,
                message_en: `${updaterName} updated task "${updated.code}: ${updated.title}"`,
                is_unread: true,
                read_at: null,
                created_at: new Date().toISOString(),
                project: {
                    id: updated.project_id,
                    name_en: updated.project_name,
                    name_kh: updated.project_name,
                    short_name_en: updated.project_name,
                    short_name_kh: updated.project_name,
                },
                task: {
                    id: updated.id,
                    task_code: updated.code,
                    title: updated.title,
                },
                last_message: {
                    source: 'activity',
                    id: 'msg_' + Date.now(),
                    content: updateMsgKh,
                    sender_id: user?.id || 1,
                    chat_message_type_id: 1,
                    created_at: new Date().toISOString(),
                    sender: { id: user?.id || 1, name_en: updaterName, name_kh: updaterName },
                },
            };
            this._notificationService.pushNotification(notif, targetIds);
        }

        if (this._realtimeGateway) {
            this._realtimeGateway.emitTaskUpdated({ task_id: updated.id, status_id: updated.status as any, project_id: updated.project_id });
        }

        const [enrichedUpdated] = await this.enrichTasksWithAvatars([updated], user);

        return {
            status_code: 200,
            message: 'Task updated successfully',
            data: enrichedUpdated || updated,
        };
    }

    async deleteTask(user: UserPayload, id: number) {
        await this.ensureStoreLoaded();
        const index = this.tasks.findIndex((t) => t.id === id);
        if (index === -1) {
            throw new NotFoundException(`Task #${id} not found`);
        }

        this.tasks.splice(index, 1);
        this.taskComments.delete(id);
        this.saveStore();

        return {
            status_code: 200,
            message: 'Task deleted successfully',
        };
    }

    // =========================================================================
    // TASK CHAT ROOM & COMMENTS
    // =========================================================================
    async getTaskComments(user: UserPayload, taskId: number) {
        await this.ensureStoreLoaded();
        const task = this.tasks.find((t) => t.id === taskId);
        if (!task) {
            throw new NotFoundException(`Task #${taskId} not found`);
        }

        const comments = this.ensureTaskComments(taskId);

        const avatarMap = await this.getAvatarMap();

        // Record current viewer into seen_by for comments sent by others
        if (user && user.id) {
            const viewerName = (user.name_kh || user.name_en || '').trim() || 'User';
            const userAvatar = this.resolveMemberAvatar({ id: user.id, email: user.email, name: viewerName }, avatarMap) || (user.avatar as any)?.uri || null;
            const currentViewer = {
                id: user.id,
                name: viewerName,
                avatar: userAvatar,
                seen_at: new Date().toISOString(),
            };
            let changed = false;
            for (const c of comments) {
                if (!c.is_system && c.sender_id && c.sender_id !== user.id) {
                    if (!Array.isArray(c.seen_by)) {
                        c.seen_by = [];
                    }
                    if (!c.seen_by.some((s: any) => s.id === user.id)) {
                        c.seen_by.push(currentViewer);
                        changed = true;
                    }
                }
            }
            if (changed) {
                this.taskComments.set(taskId, comments);
                this.saveStore();
            }
        }

        const userNameEn = (user?.name_en || '').toLowerCase().trim();
        const userNameKh = (user?.name_kh || '').toLowerCase().trim();
        const userEmail = (user?.email || '').toLowerCase().trim();

        return {
            status_code: 200,
            message: 'Task chat comments retrieved successfully',
            data: {
                task_id: taskId,
                task_title: task.title,
                task_status: task.status,
                comments: comments.map((c) => {
                    if (c.is_system || c.sender_id === 0) {
                        return { ...c, is_self: false, is_system: true };
                    }
                    const senderName = (c.sender_name || '').toLowerCase().trim();
                    const isSelf = Boolean(
                        (userNameKh && (senderName === userNameKh || senderName.includes(userNameKh) || userNameKh.includes(senderName))) ||
                        (userNameEn && (senderName === userNameEn || senderName.includes(userNameEn) || userNameEn.includes(senderName))) ||
                        (userEmail && senderName === userEmail) ||
                        (user?.id && c.sender_id === user.id)
                    );
                    let senderAvatar = c.sender_avatar;
                    if (!senderAvatar || senderAvatar.includes('placeholder')) {
                        senderAvatar = this.resolveMemberAvatar({ id: c.sender_id, name: c.sender_name }, avatarMap) || senderAvatar || null;
                    }
                    const seenByList = (Array.isArray(c.seen_by) ? c.seen_by : []).map((s: any) => {
                        const sAv = this.resolveMemberAvatar(s, avatarMap);
                        return sAv ? { ...s, avatar: sAv } : s;
                    });
                    return {
                        ...c,
                        sender_avatar: senderAvatar,
                        is_self: isSelf,
                        seen_by: seenByList,
                    };
                }),
            },
        };
    }

    async createTaskComment(user: UserPayload, taskId: number, text: string, attachments?: any[]) {
        await this.ensureStoreLoaded();
        const task = this.tasks.find((t) => t.id === taskId);
        if (!task) {
            throw new NotFoundException(`Task #${taskId} not found`);
        }

        const avatarMap = await this.getAvatarMap();
        const userAvatar = this.resolveMemberAvatar({ id: user.id, email: user.email, name: user.name_kh || user.name_en }, avatarMap) || (user.avatar as any)?.uri || null;

        const comments = this.ensureTaskComments(taskId);
        const newComment = {
            id: Date.now(),
            sender_id: user.id,
            sender_name: user.name_kh || user.name_en || 'អ្នកប្រើប្រាស់ (User)',
            sender_avatar: userAvatar,
            text: (text || '').trim(),
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            is_self: true,
            is_system: false,
            attachments: attachments || undefined,
            created_at: new Date().toISOString(),
            seen_by: [],
        };

        comments.push(newComment);
        this.taskComments.set(taskId, comments);

        task.comments_count = comments.length;
        if (attachments && attachments.length > 0) {
            task.attachments_count = (task.attachments_count || 0) + attachments.length;
        }
        task.updated_at = new Date().toISOString();
        this.saveStore();

        // Send Telegram Notification (Exact PMS format)
        const senderName = user.name_kh || user.name_en || 'Piseth Panhavorn';
        const commentText = (text || '').trim();
        let firstLine = '';
        if (commentText && attachments && attachments.length > 0) {
            firstLine = `💬 ${senderName}: ${commentText}\n📎 ឯកសារភ្ជាប់ (${attachments.length})`;
        } else if (commentText) {
            firstLine = `💬 ${senderName}: ${commentText}`;
        } else if (attachments && attachments.length > 0) {
            const fileNames = attachments.map((a: any) => a.name || a.filename || 'ឯកសារ').join(', ');
            firstLine = `📎 ${senderName} បានផ្ញើឯកសារភ្ជាប់៖ ${fileNames}`;
        } else {
            firstLine = `🔔 ${senderName} បានផ្ញើសារក្នុងបន្ទប់ពិភាក្សា`;
        }

        const targetIds = [
            user.id,
            task.reporter?.id,
            task.assignee?.id,
            ...(task.assignees?.map((a) => a.id) || []),
        ].filter(Boolean) as number[];

        this.sendTelegramNotification(firstLine, task, targetIds);

        // Push in-app real-time notification
        if (this._notificationService) {
            const commentNotif: NotificationItem = {
                id: 'notif_comment_' + Date.now(),
                type: 'chat_task',
                title: 'សារថ្មីក្នុងភារកិច្ច',
                title_kh: 'សារថ្មីក្នុងភារកិច្ច',
                title_en: 'New comment in task',
                message: `${senderName}: ${commentText || 'បានផ្ញើឯកសារភ្ជាប់'} (${task.code || ''})`,
                message_kh: `${senderName}: ${commentText || 'បានផ្ញើឯកសារភ្ជាប់'} (${task.code || ''})`,
                message_en: `${senderName}: ${commentText || 'sent an attachment'} (${task.code || ''})`,
                is_unread: true,
                read_at: null,
                created_at: new Date().toISOString(),
                project: {
                    id: task.project_id,
                    name_en: task.project_name,
                    name_kh: task.project_name,
                    short_name_en: task.project_name,
                    short_name_kh: task.project_name,
                },
                task: {
                    id: task.id,
                    task_code: task.code,
                    title: task.title,
                },
                last_message: {
                    source: 'message',
                    id: 'msg_' + Date.now(),
                    content: commentText || 'បានផ្ញើឯកសារភ្ជាប់',
                    sender_id: user.id,
                    chat_message_type_id: 1,
                    created_at: new Date().toISOString(),
                    sender: { id: user.id, name_en: user.name_en || senderName, name_kh: user.name_kh || senderName },
                },
            };
            this._notificationService.pushNotification(commentNotif, targetIds);
        }

        if (this._realtimeGateway) {
            this._realtimeGateway.emitTaskUpdated({ task_id: task.id, project_id: task.project_id });
        }

        return {
            status_code: 201,
            message: 'Chat comment added successfully',
            data: newComment,
        };
    }
}
