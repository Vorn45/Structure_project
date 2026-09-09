import { Injectable, NotFoundException } from '@nestjs/common';
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
    created_at: string;
    updated_at: string;
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
    private taskComments = new Map<number, Array<{
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
    }>>();
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

    private ensureTaskComments(taskId: number): Array<{
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
    }> {
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
                initialComments.push({
                    id: 2,
                    sender_id: reporterId,
                    sender_name: reporterName,
                    sender_avatar: reporterAvatar,
                    text: `សួស្តី @${assigneeName}! ខ្ញុំបានចាត់តាំងភារកិច្ច "${task?.title || 'ការងារ'}" នេះជូនអ្នក។ សូមជួយពិនិត្យមើល និងអនុវត្តតាមលក្ខខណ្ឌការងារ។`,
                    time: '8:45 AM',
                    is_self: false,
                    created_at: task?.created_at || new Date(Date.now() - 3600000 * 3.5).toISOString(),
                });
            }

            comments = initialComments;
            this.taskComments.set(taskId, comments);
            this.saveStore();
        } else if (task && hasAssignee && assigneeName) {
            // Ensure default intro exists and is updated with real task info
            const introIndex = comments.findIndex(c => !c.is_system && typeof c.text === 'string' && c.text.includes('ខ្ញុំបានចាត់តាំងភារកិច្ច'));
            if (introIndex >= 0) {
                comments[introIndex].sender_name = reporterName;
                comments[introIndex].sender_avatar = reporterAvatar;
                comments[introIndex].sender_id = reporterId;
                comments[introIndex].text = `សួស្តី @${assigneeName}! ខ្ញុំបានចាត់តាំងភារកិច្ច "${task?.title || 'ការងារ'}" នេះជូនអ្នក។ សូមជួយពិនិត្យមើល និងអនុវត្តតាមលក្ខខណ្ឌការងារ។`;
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

    async getMembers(user: UserPayload) {
        let dbUsers: User[] = [];
        const allowedPhones = ['010843612', '087280875', '067776682', '011242425'];
        try {
            dbUsers = await this._userRepo.find({
                relations: ['user_roles', 'user_roles.role', 'avatar_file'],
                order: { id: 'ASC' },
            });
            // Filter strictly to the 4 active team members
            dbUsers = dbUsers.filter((u) => u.phone && allowedPhones.includes(u.phone));
            // Deduplicate by phone
            const seen = new Set<string>();
            const unique: User[] = [];
            for (const u of dbUsers) {
                const p = u.phone?.trim() || '';
                if (p && !seen.has(p)) {
                    seen.add(p);
                    unique.push(u);
                }
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

        // Ensure all 3 members (Piseth, Pum, Winner) are guaranteed to be in the returned list
        for (const def of defaultFallbacks) {
            const exists = mapped.some(
                (m) =>
                    (m.phone && def.phone && m.phone === def.phone) ||
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

    async getTasks(user: UserPayload, query: QueryTasksDto) {
        await this.ensureStoreLoaded();
        const validTasks = this.tasks.filter((t) => !this.isPmsTask(t));
        let list = [...validTasks];

        if (query.search && query.search !== 'undefined' && query.search !== 'null' && query.search.trim()) {
            const s = query.search.trim().toLowerCase();
            list = list.filter(
                (t) =>
                    (t.title && t.title.toLowerCase().includes(s)) ||
                    (t.description && t.description.toLowerCase().includes(s)) ||
                    (t.code && t.code.toLowerCase().includes(s)),
            );
        }

        if (query.status && query.status !== 'all' && query.status !== 'undefined' && query.status !== 'null') {
            list = list.filter((t) => t.status === query.status);
        }

        if (query.priority && query.priority !== 'all' && query.priority !== 'undefined' && query.priority !== 'null') {
            list = list.filter((t) => t.priority === query.priority);
        }

        if (query.project_id && query.project_id !== 'undefined' && query.project_id !== 'null' && query.project_id !== 'all') {
            const pid = query.project_id.toLowerCase();
            list = list.filter((t) =>
                (t.project_id && t.project_id.toLowerCase().includes(pid)) ||
                (t.project_name && t.project_name.toLowerCase().includes(pid))
            );
        }

        if (query.member_id && query.member_id !== 'all' && query.member_id !== 'undefined' && query.member_id !== 'null') {
            const mId = Number(query.member_id);
            list = list.filter(
                (t) =>
                    Number(t.assignee?.id) === mId ||
                    (t.assignees && t.assignees.some((a) => Number(a.id) === mId)) ||
                    Number(t.reporter?.id) === mId,
            );
        }

        const projectScope = (query.project_id && query.project_id !== 'all' && query.project_id !== 'undefined' && query.project_id !== 'null')
            ? validTasks.filter((t) => {
                const pid = query.project_id!.toLowerCase();
                return (t.project_id && t.project_id.toLowerCase().includes(pid)) ||
                       (t.project_name && t.project_name.toLowerCase().includes(pid));
            })
            : validTasks;

        const limit = query.limit ? parseInt(query.limit, 10) : 100;
        const offset = query.offset ? parseInt(query.offset, 10) : 0;
        const paginated = list.slice(offset, offset + limit);

        return {
            status_code: 200,
            message: 'Tasks retrieved successfully',
            data: {
                results: paginated,
                total: list.length,
                limit,
                offset,
                counts: {
                    all: projectScope.length,
                    new: projectScope.filter((t) => t.status === TaskStatusEnum.NEW || (t.status as any) === 'pending').length,
                    confirmed: projectScope.filter((t) => t.status === TaskStatusEnum.CONFIRMED).length,
                    unconfirmed: projectScope.filter((t) => t.status === TaskStatusEnum.UNCONFIRMED || (t.status as any) === 'todo').length,
                    in_progress: projectScope.filter((t) => t.status === TaskStatusEnum.IN_PROGRESS).length,
                    in_review: projectScope.filter((t) => t.status === TaskStatusEnum.IN_REVIEW || (t.status as any) === 'review').length,
                    reopened: projectScope.filter((t) => t.status === TaskStatusEnum.REOPENED).length,
                    done: projectScope.filter((t) => t.status === TaskStatusEnum.DONE || (t.status as any) === 'completed').length,
                },
            },
        };
    }

    async getTaskById(user: UserPayload, id: number) {
        await this.ensureStoreLoaded();
        const task = this.tasks.find((t) => t.id === id);
        if (!task) {
            throw new NotFoundException(`Task #${id} not found`);
        }

        return {
            status_code: 200,
            message: 'Task retrieved successfully',
            data: task,
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

        const newTask: TaskItem = {
            id: Date.now(),
            code: formattedCode,
            title: dto.title,
            description: dto.description || '',
            module: 'Task Management',
            task_type: dto.task_type || 'feature',
            status: dto.status || TaskStatusEnum.NEW,
            priority: dto.priority || TaskPriorityEnum.MEDIUM,
            progress: 0,
            comments_count: 0,
            attachments_count: 0,
            due_date: dto.due_date || null,
            project_id: dto.project_id || (prefix === 'WMS' ? 'wms-digitech' : 'bms-digitech'),
            project_name: prefix === 'BMS' ? 'BMS Digitech' : 'WMS Digitech',
            reporter: taskReporter,
            assignee: primaryAssignee,
            assignees: assigneesList,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        this.tasks.unshift(newTask);
        this.saveStore();

        // Dispatch Telegram Notification (Exact PMS format)
        const creatorName = taskReporter?.name || user?.name_kh || user?.name_en || 'អ្នកប្រើប្រាស់';
        const taskCode = newTask.code || `#${prefix}-0000`;
        const firstLine = `📌 ${creatorName} បានបង្កើតការងារថ្មី ${taskCode}`;
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

        return {
            status_code: 201,
            message: 'Task created successfully',
            data: newTask,
        };
    }

    private getProjectPrefix(task?: TaskItem): string {
        if (!task) return 'WMS';
        if (task.project_id === 'bms-digitech' || task.code?.startsWith('#BMS') || task.project_name?.includes('BMS')) return 'BMS';
        if (task.project_id === 'wms-digitech' || task.code?.startsWith('#WMS') || task.project_name?.includes('WMS')) return 'WMS';
        return 'WMS';
    }

    private getTaskContextLine(task: TaskItem): string {
        const prefix = this.getProjectPrefix(task);
        const label = task.module || task.title;
        return `${prefix}: ${label}`;
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
            '8680838714:AAGj_IKsIr8QS3XZEv3P_ihXYusECm4gNuM';
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

            const chatIdsToSend = new Set<string>(['8836877586', '853828296', '1174417436']);
            if (process.env.TELEGRAM_CHAT_MAIN_ID) {
                chatIdsToSend.add(String(process.env.TELEGRAM_CHAT_MAIN_ID));
            }
            if (process.env.TELEGRAM_CHAT_ID) {
                chatIdsToSend.add(String(process.env.TELEGRAM_CHAT_ID));
            }
            if (appConfig.ORGANIZATION_LOG.TELEGRAM_CHAT_ID) {
                chatIdsToSend.add(String(appConfig.ORGANIZATION_LOG.TELEGRAM_CHAT_ID));
            }
            for (const u of linkedUsers) {
                if (u.telegram_id) {
                    chatIdsToSend.add(String(u.telegram_id));
                }
            }

            for (const chatId of chatIdsToSend) {
                if (!chatId) continue;

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

                axios
                    .post(`https://api.telegram.org/bot${botToken}/sendMessage`, payload, { timeout: 15000 })
                    .catch((err) => {
                        if (messageThreadId) {
                            delete payload.message_thread_id;
                            axios
                                .post(`https://api.telegram.org/bot${botToken}/sendMessage`, payload, { timeout: 15000 })
                                .catch((e) => console.warn('[Telegram Notification Direct Fallback] Error:', e?.message || e));
                        } else {
                            console.warn(`[Telegram Notification] Failed to send to ${chatId}:`, err?.message || err);
                        }
                    });
            }
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

        if (dto.task_type && dto.task_type !== current.task_type) {
            comments.push({
                id: Date.now() + 5,
                sender_id: 0,
                sender_name: 'ប្រព័ន្ធ (System)',
                sender_avatar: null,
                text: `បានប្តូរប្រភេទការងារពី "${this.getTaskTypeLabel(current.task_type)}" ទៅជា "${this.getTaskTypeLabel(dto.task_type)}"`,
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
                text: `បានប្តូរស្ថានភាពពី "${this.getStatusLabel(current.status)}" ទៅជា "${this.getStatusLabel(dto.status)}"`,
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
                text: `បានប្តូរអាទិភាពពី "${this.getPriorityLabel(current.priority)}" ទៅជា "${this.getPriorityLabel(dto.priority)}"`,
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
                text: dto.due_date ? `បានកំណត់កាលបរិច្ឆេទត្រូវធ្វើថ្មី៖ ${formatted}` : `បានសម្អាតកាលបរិច្ឆេទកំណត់`,
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
                text: `បានធ្វើបច្ចុប្បន្នភាពអ្នកទទួលបន្ទុក៖ ${names}`,
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
                text: `បានចាត់តាំងភារកិច្ចទៅកាន់៖ ${dto.assignee.name}`,
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
                text: `បានប្តូរអ្នកបង្កើតទៅកាន់៖ "${dto.reporter.name}"`,
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
        const updaterName = user.name_kh || user.name_en || 'Piseth Panhavorn';
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

        return {
            status_code: 200,
            message: 'Task updated successfully',
            data: updated,
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
                    return {
                        ...c,
                        is_self: isSelf,
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

        const comments = this.ensureTaskComments(taskId);
        const newComment = {
            id: Date.now(),
            sender_id: user.id,
            sender_name: user.name_kh || user.name_en || 'អ្នកប្រើប្រាស់ (User)',
            sender_avatar: (user.avatar as any)?.uri || '/images/placeholder/avatar.jpg',
            text: (text || '').trim(),
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            is_self: true,
            is_system: false,
            attachments: attachments || undefined,
            created_at: new Date().toISOString(),
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
