import {
    ForbiddenException,
    forwardRef,
    Inject,
    Injectable,
    NotFoundException,
    Optional,
} from '@nestjs/common';
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
import { TaskEntity } from 'src/app/model/task/task.entity';
import { TaskCommentEntity } from 'src/app/model/task/task-comment.entity';
import { UserPayload } from 'src/app/interface/jwt.interface';
import {
    NotificationService,
    NotificationItem,
} from 'src/app/shared/notification/notification.service';
import { RealtimeGateway } from 'src/app/shared/realtime/realtime.gateway';
import { isAdminOrSuperAdmin } from 'src/app/common/utils/access.util';
import { PlanService } from '../4-plan/plan.service';

import {
    CreateTaskDto,
    QueryTasksDto,
    TaskPriorityEnum,
    TaskStatusEnum,
    UpdateTaskDto,
} from './task.dto';

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
    attachments?: Array<{
        name: string;
        size: string;
        url?: string;
        type?: string;
        isImage?: boolean;
        textContent?: string;
    }>;
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
    attachments?: Array<{
        name: string;
        size: string;
        url?: string;
        type?: string;
        isImage?: boolean;
        textContent?: string;
    }>;
    created_at: string;
    seen_by?: Array<{
        id: number;
        name: string;
        avatar?: string | null;
        seen_at?: string;
    }>;
}

export interface LiveMemberInfo {
    id: number;
    name: string;
    role: string;
    avatar: string | null;
    email: string;
    phone: string;
}

export class LiveMemberLookup {
    public byId = new Map<number, LiveMemberInfo>();
    public byPhone = new Map<string, LiveMemberInfo>();
    public byEmail = new Map<string, LiveMemberInfo>();
    public byName = new Map<string, LiveMemberInfo>();
    public avatarMap = new Map<string, string>();

    add(member: LiveMemberInfo, u: User) {
        this.byId.set(member.id, member);
        if (member.email) {
            this.byEmail.set(member.email.toLowerCase().trim(), member);
        }
        if (member.phone) {
            const clean = member.phone.replace(/\D/g, '');
            if (clean) {
                this.byPhone.set(clean, member);
                if (clean.length >= 8) {
                    this.byPhone.set(clean.slice(-8), member);
                }
            }
        }
        if (u.name_en) {
            this.byName.set(u.name_en.toLowerCase().trim(), member);
        }
        if (u.name_kh) {
            this.byName.set(u.name_kh.toLowerCase().trim(), member);
        }
        if (member.name) {
            this.byName.set(member.name.toLowerCase().trim(), member);
        }
        if (member.avatar) {
            this.avatarMap.set(`id:${member.id}`, member.avatar);
            if (member.email) this.avatarMap.set(`email:${member.email.toLowerCase().trim()}`, member.avatar);
            if (member.phone) {
                const clean = member.phone.replace(/\D/g, '');
                if (clean) {
                    this.avatarMap.set(`phone:${clean}`, member.avatar);
                    if (clean.length >= 8) this.avatarMap.set(`phone:${clean.slice(-8)}`, member.avatar);
                }
            }
            if (member.name) this.avatarMap.set(`name:${member.name.toLowerCase().trim()}`, member.avatar);
            if (u.name_en) this.avatarMap.set(`name:${u.name_en.toLowerCase().trim()}`, member.avatar);
            if (u.name_kh) this.avatarMap.set(`name:${u.name_kh.toLowerCase().trim()}`, member.avatar);
            const parts = `${u.name_en || ''} ${u.name_kh || ''}`.toLowerCase().split(/\s+/).filter(Boolean);
            for (const part of parts) {
                if (part.length >= 3 && !this.avatarMap.has(`part:${part}`)) {
                    this.avatarMap.set(`part:${part}`, member.avatar);
                }
            }
        }
    }

    find(candidate: any): LiveMemberInfo | null {
        if (!candidate) return null;
        const cId = Number(candidate.id || candidate.user_id || 0);
        if (cId && this.byId.has(cId)) {
            return this.byId.get(cId)!;
        }
        if (candidate.email) {
            const eKey = String(candidate.email).toLowerCase().trim();
            if (this.byEmail.has(eKey)) return this.byEmail.get(eKey)!;
        }
        if (candidate.phone) {
            const p = String(candidate.phone).replace(/\D/g, '');
            if (p && this.byPhone.has(p)) return this.byPhone.get(p)!;
            if (p.length >= 8 && this.byPhone.has(p.slice(-8))) return this.byPhone.get(p.slice(-8))!;
        }
        const nKey = (candidate.name || '').toLowerCase().trim();
        if (nKey) {
            if (this.byName.has(nKey)) return this.byName.get(nKey)!;
            for (const [k, v] of this.byName.entries()) {
                if (k === nKey || k.includes(nKey) || nKey.includes(k)) return v;
            }
        }
        return null;
    }
}

@Injectable()
export class TaskService {
    private tasks: TaskItem[] = [];
    private taskComments = new Map<number, TaskCommentItem[]>();

    private isStoreLoaded = false;

    constructor(
        @InjectRepository(User)
        private readonly _userRepo: Repository<User>,
        @InjectRepository(TaskStore)
        private readonly _taskStoreRepo: Repository<TaskStore>,
        @InjectRepository(TelegramThread)
        private readonly _threadRepo: Repository<TelegramThread>,
        @InjectRepository(TaskEntity)
        private readonly _taskRepo: Repository<TaskEntity>,
        @InjectRepository(TaskCommentEntity)
        private readonly _taskCommentRepo: Repository<TaskCommentEntity>,
        private readonly _notificationService?: NotificationService,
        private readonly _realtimeGateway?: RealtimeGateway,
        @Optional()
        @Inject(forwardRef(() => PlanService))
        private readonly _planService?: PlanService,
    ) {
        this.initDbStore();
    }

    private getPlanProjects(): any[] {
        if (this._planService) {
            return this._planService.getRawProjects();
        }
        return [];
    }

    private async ensureTableExists(): Promise<void> {
        try {
            await this._userRepo.query(`
                CREATE EXTENSION IF NOT EXISTS "pgcrypto";
                CREATE SCHEMA IF NOT EXISTS "user";
                CREATE SCHEMA IF NOT EXISTS "task";
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
            console.warn(
                'Auto table create query skipped or already exists:',
                e?.message || e,
            );
        }
    }

    private isPmsTask(t: any): boolean {
        if (!t) return false;
        const code = (t.code || '').toUpperCase();
        const pid = (t.project_id || '').toLowerCase();
        const pname = (t.project_name || '').toLowerCase();
        return (
            code.includes('PMS') ||
            pid.includes('pms') ||
            pname.includes('pms') ||
            pid === 'proj-001' ||
            pid === 'proj-002' ||
            pid === 'proj-003'
        );
    }

    private isEventbookingTask(t: any): boolean {
        if (!t) return false;
        const code = (t.code || '').toUpperCase();
        const title = (t.title || '').trim();
        const pid = (t.project_id || '').toLowerCase().trim();
        const pname = (t.project_name || '').toLowerCase().trim();
        const eventTitles = [
            'Make it can upload profile',
            'Add organizer name in event',
            'Allow change phone number',
            'Improve bar chart change to use echart',
            'Improve or redesign home page',
            'Improve Footer UI',
            'Redesign event layout',
            'Improve profile panel',
            'Improve Navbar',
            'About us and contact us',
        ];
        return (
            code.includes('PRJ-0002-') ||
            code.includes('PRJ-002-') ||
            code.includes('0004-') ||
            pid === '0004' ||
            pname === 'eventbooking-system' ||
            eventTitles.includes(title)
        );
    }

    private sanitizeEventbookingTask(t: any): any {
        if (!this.isEventbookingTask(t)) return t;
        let code = (t.code || '').trim();
        if (code.includes('PRJ-0002-')) {
            code = code.replace(/#?PRJ-0002-/gi, '#0004-');
        } else if (code.includes('PRJ-002-')) {
            code = code.replace(/#?PRJ-002-/gi, '#0004-');
        } else if (!code.startsWith('#0004-') && !code.startsWith('0004-')) {
            code = `#0004-${t.id || 1}`;
        }
        if (!code.startsWith('#')) {
            code = `#${code}`;
        }
        return {
            ...t,
            code,
            project_id: '0004',
            project_name: 'Eventbooking-system',
        };
    }

    private isDummyMockTask(_t: any): boolean {
        return false;
    }

    private async initDbStore(): Promise<void> {
        await this.ensureTableExists();
        try {
            // Check if relational table has records
            const count = await this._taskRepo.count();
            if (count > 0) {
                const dbTasks = await this._taskRepo.find({
                    order: { id: 'DESC' },
                });
                const cleanTasks = dbTasks
                    .filter((t: any) => !this.isPmsTask(t))
                    .map((t: any) => this.sanitizeEventbookingTask(t));
                for (const t of cleanTasks) {
                    if (this.isEventbookingTask(t)) {
                        await this._taskRepo
                            .update(
                                { id: t.id },
                                {
                                    code: t.code,
                                    project_id: t.project_id,
                                    project_name: t.project_name,
                                },
                            )
                            .catch(() => {});
                    }
                }
                this.tasks = cleanTasks.map((t: any) => ({
                    id: Number(t.id),
                    code: t.code,
                    title: t.title,
                    description: t.description || '',
                    task_type: t.task_type || 'feature',
                    module: t.module,
                    status: t.status,
                    priority: t.priority,
                    progress: t.progress || 0,
                    comments_count: t.comments_count || 0,
                    attachments_count: t.attachments_count || 0,
                    due_date: t.due_date
                        ? new Date(t.due_date).toISOString()
                        : null,
                    project_id: t.project_id,
                    project_name: t.project_name || '',
                    reporter: t.reporter,
                    assignee: t.assignee,
                    assignees: t.assignees || [],
                    attachments: t.attachments || [],
                    created_at: t.created_at
                        ? new Date(t.created_at).toISOString()
                        : new Date().toISOString(),
                    updated_at: t.updated_at
                        ? new Date(t.updated_at).toISOString()
                        : new Date().toISOString(),
                }));

                const dbComments = await this._taskCommentRepo.find({
                    order: { id: 'ASC' },
                });
                this.taskComments.clear();
                for (const c of dbComments) {
                    const taskId = Number(c.task_id);
                    let commentsList = this.taskComments.get(taskId);
                    if (!commentsList) {
                        commentsList = [];
                        this.taskComments.set(taskId, commentsList);
                    }
                    commentsList.push({
                        id: Number(c.id),
                        sender_id: c.sender_id || 0,
                        sender_name: c.sender_name,
                        sender_avatar: c.sender_avatar,
                        text: c.text || '',
                        time: c.time || '',
                        is_self: c.is_self || false,
                        is_system: c.is_system || false,
                        attachments: c.attachments || undefined,
                        seen_by: c.seen_by || [],
                        created_at: c.created_at
                            ? new Date(c.created_at).toISOString()
                            : new Date().toISOString(),
                    });
                }

                for (const task of this.tasks) {
                    if (
                        !this.taskComments.has(task.id) ||
                        (this.taskComments.get(task.id)?.length || 0) === 0
                    ) {
                        this.ensureTaskComments(task.id);
                    }
                }
                this.isStoreLoaded = true;
                return;
            }

            // Seed relational tables from taskStoreRepo or legacy disk store if DB table was empty
            let sourceTasks: any[] = [];
            let sourceComments: Record<string, any[]> = {};

            const dbStore = await this._taskStoreRepo.findOne({
                where: { key: 'default_tasks_store' },
            });
            if (dbStore && Array.isArray(dbStore.tasks) && dbStore.tasks.length > 0) {
                sourceTasks = dbStore.tasks;
                if (dbStore.comments && typeof dbStore.comments === 'object') {
                    sourceComments = dbStore.comments as any;
                }
            }

            const nonPms = sourceTasks
                .filter((t: any) => !this.isPmsTask(t))
                .map((t: any) => this.sanitizeEventbookingTask(t));

            this.tasks = nonPms.map((t: any) => ({
                ...t,
                task_type: t.task_type || this.inferTaskType(t),
            }));

            for (const [k, v] of Object.entries(sourceComments)) {
                const numKey = Number(k);
                if (!isNaN(numKey) && Array.isArray(v)) {
                    this.taskComments.set(numKey, v);
                }
            }
            this.healMissingReporters();

            for (const task of this.tasks) {
                if (
                    !this.taskComments.has(task.id) ||
                    (this.taskComments.get(task.id)?.length || 0) === 0
                ) {
                    this.ensureTaskComments(task.id);
                }
            }

            // Migrate to relational PostgreSQL tables
            for (const t of this.tasks) {
                const entity = this._taskRepo.create({
                    id: t.id,
                    code: t.code || null,
                    project_id: t.project_id,
                    project_name: t.project_name,
                    title: t.title,
                    description: t.description,
                    task_type: t.task_type || 'feature',
                    module: t.module,
                    status: t.status,
                    priority: t.priority,
                    progress: t.progress || 0,
                    comments_count: t.comments_count || 0,
                    attachments_count: t.attachments_count || 0,
                    due_date: t.due_date,
                    reporter: t.reporter,
                    assignee: t.assignee,
                    assignees: t.assignees || [],
                    attachments: t.attachments || [],
                });
                await this._taskRepo.save(entity);

                const taskComms = this.taskComments.get(t.id) || [];
                for (const c of taskComms) {
                    const cEntity = this._taskCommentRepo.create({
                        id: c.id,
                        task_id: t.id,
                        sender_id: c.sender_id,
                        sender_name: c.sender_name,
                        sender_avatar: c.sender_avatar,
                        text: c.text,
                        time: c.time,
                        is_self: c.is_self,
                        is_system: c.is_system,
                        attachments: c.attachments || [],
                        seen_by: c.seen_by || [],
                    });
                    await this._taskCommentRepo.save(cEntity);
                }
            }

            await this.saveToDb();
            this.isStoreLoaded = true;
        } catch (err) {
            console.warn(
                'Could not load task store from DB, falling back to disk:',
                err,
            );
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
        const hasAssignee = Boolean(
            task?.assignee?.name ||
            (task?.assignees && task.assignees.length > 0),
        );
        const assigneeName =
            task?.assignee?.name ||
            (task?.assignees && task.assignees.length > 0
                ? task.assignees[0].name
                : '');

        if (!comments || comments.length === 0) {
            const initialComments: any[] = [
                {
                    id: 1,
                    sender_id: 0,
                    sender_name: 'ប្រព័ន្ធ (System)',
                    sender_avatar: null,
                    text:
                        hasAssignee && assigneeName
                            ? `ភារកិច្ច ${task?.code || '#' + taskId} ត្រូវបានបង្កើតដោយ ${reporterName} និងចាត់តាំងទៅកាន់ ${assigneeName}`
                            : `ភារកិច្ច ${task?.code || '#' + taskId} ត្រូវបានបង្កើតដោយ ${reporterName} (គ្មានអ្នកទទួលបន្ទុក)`,
                    time: '8:30 AM',
                    is_self: false,
                    is_system: true,
                    created_at:
                        task?.created_at ||
                        new Date(Date.now() - 3600000 * 4).toISOString(),
                },
            ];

            // Default intro assignment message from real reporter to assignee
            if (hasAssignee && assigneeName) {
                const seenList =
                    task?.assignees && task.assignees.length > 0
                        ? task.assignees.map((a: any) => ({
                              id: a.id,
                              name: a.name,
                              avatar: a.avatar || null,
                          }))
                        : task?.assignee
                          ? [
                                {
                                    id: task.assignee.id,
                                    name: task.assignee.name,
                                    avatar: task.assignee.avatar || null,
                                },
                            ]
                          : [];

                initialComments.push({
                    id: 2,
                    sender_id: reporterId,
                    sender_name: reporterName,
                    sender_avatar: reporterAvatar,
                    text: `សួស្តី @${assigneeName}! ខ្ញុំបានចាត់តាំងភារកិច្ច "${task?.title || 'ការងារ'}" នេះជូនអ្នក។ សូមជួយពិនិត្យមើល និងអនុវត្តតាមលក្ខខណ្ឌការងារ។`,
                    time: '8:45 AM',
                    is_self: false,
                    created_at:
                        task?.created_at ||
                        new Date(Date.now() - 3600000 * 3.5).toISOString(),
                    seen_by: seenList,
                });
            }

            comments = initialComments;
            this.taskComments.set(taskId, comments);
            this.saveStore();
        } else if (task && hasAssignee && assigneeName) {
            const seenList =
                task?.assignees && task.assignees.length > 0
                    ? task.assignees.map((a: any) => ({
                          id: a.id,
                          name: a.name,
                          avatar: a.avatar || null,
                      }))
                    : task?.assignee
                      ? [
                            {
                                id: task.assignee.id,
                                name: task.assignee.name,
                                avatar: task.assignee.avatar || null,
                            },
                        ]
                      : [];

            // Ensure default intro exists and is updated with real task info
            const introIndex = comments.findIndex(
                (c) =>
                    !c.is_system &&
                    typeof c.text === 'string' &&
                    c.text.includes('ខ្ញុំបានចាត់តាំងភារកិច្ច'),
            );
            if (introIndex >= 0) {
                comments[introIndex].sender_name = reporterName;
                comments[introIndex].sender_avatar = reporterAvatar;
                comments[introIndex].sender_id = reporterId;
                comments[introIndex].text =
                    `សួស្តី @${assigneeName}! ខ្ញុំបានចាត់តាំងភារកិច្ច "${task?.title || 'ការងារ'}" នេះជូនអ្នក។ សូមជួយពិនិត្យមើល និងអនុវត្តតាមលក្ខខណ្ឌការងារ។`;
                if (
                    !comments[introIndex].seen_by ||
                    comments[introIndex].seen_by.length === 0
                ) {
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
                    created_at:
                        task?.created_at ||
                        new Date(Date.now() - 3600000 * 3.5).toISOString(),
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

    private healMissingReporters(): boolean {
        let modified = false;
        for (const t of this.tasks) {
            if (
                !t.reporter ||
                !t.reporter.name ||
                t.reporter.name.trim() === ''
            ) {
                t.reporter = {
                    id: 2,
                    name: 'PUM BRUSMUNY',
                    role: 'Super Admin / Project Lead',
                    avatar: null,
                };
                modified = true;
            }
        }
        return modified;
    }

    private saveStore(): void {
        this.saveToDb().catch(() => {});
    }

    private sanitizeCommentAttachments(comments: any[]): any[] {
        if (!Array.isArray(comments)) return [];
        return comments.map((c) => {
            if (!c) return c;
            const copy = { ...c };
            if (Array.isArray(copy.attachments)) {
                copy.attachments = copy.attachments.map((a: any) => {
                    if (!a) return a;
                    const aCopy = { ...a };
                    if (
                        typeof aCopy.url === 'string' &&
                        aCopy.url.startsWith('data:')
                    ) {
                        aCopy.url = '';
                    }
                    return aCopy;
                });
            }
            return copy;
        });
    }

    private async saveToDb(): Promise<void> {
        try {
            // 1. Dual-write to relational PostgreSQL tables
            for (const t of this.tasks) {
                await this._taskRepo.save({
                    id: t.id,
                    code: t.code || null,
                    project_id: t.project_id,
                    project_name: t.project_name,
                    title: t.title,
                    description: t.description,
                    task_type: t.task_type || 'feature',
                    module: t.module,
                    status: t.status,
                    priority: t.priority,
                    progress: t.progress || 0,
                    comments_count: t.comments_count || 0,
                    attachments_count: t.attachments_count || 0,
                    due_date: t.due_date,
                    reporter: t.reporter,
                    assignee: t.assignee,
                    assignees: t.assignees || [],
                    attachments: t.attachments || [],
                });
            }

            // 2. Dual-write to legacy task_store backup
            const commentsObj: Record<number, any[]> = {};
            for (const [k, v] of this.taskComments.entries()) {
                commentsObj[k] = this.sanitizeCommentAttachments(v);
            }
            let dbStore = await this._taskStoreRepo.findOne({
                where: { key: 'default_tasks_store' },
            });
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

    private isAdmin(user: UserPayload): boolean {
        if (!user) return false;
        return isAdminOrSuperAdmin(user);
    }

    private isUserPlanMember(user: UserPayload, plan: any): boolean {
        if (!user) return false;
        if (this.isAdmin(user)) return true;

        const uId = Number(user.id || 0);
        const uEmail = (user.email || '').toLowerCase().trim();
        const uPhone = (user.phone || '').replace(/\D/g, '');

        const lead = plan.lead || plan.team_lead;
        if (lead) {
            const leadId = Number(lead.id || lead.user_id || 0);
            if (leadId && uId && leadId === uId) return true;
            const leadPhone = String(lead.phone || '').replace(/\D/g, '');
            if (
                leadPhone &&
                uPhone &&
                (leadPhone === uPhone ||
                    leadPhone.slice(-8) === uPhone.slice(-8))
            )
                return true;
            const leadEmail = String(lead.email || '')
                .toLowerCase()
                .trim();
            if (leadEmail && uEmail && leadEmail === uEmail) {
                if (leadEmail === 'pisethpanhavorn544@gmail.com') {
                    if (uPhone === '010843612' || uId === 5) return true;
                } else if (leadEmail === 'pumprusmuny@example.com') {
                    if (uPhone === '087280875' || uId === 6) return true;
                } else {
                    return true;
                }
            }
        }

        const members = Array.isArray(plan.members) ? plan.members : [];
        return members.some((m: any) => {
            if (!m) return false;
            const mId = Number(m.user_id || m.id || 0);
            if (
                mId &&
                uId &&
                mId === uId &&
                mId !== 101 &&
                mId !== 102 &&
                mId !== 103 &&
                mId !== 104
            )
                return true;

            if (m.phone && uPhone) {
                const cleanMPhone = String(m.phone).replace(/\D/g, '');
                if (
                    cleanMPhone === uPhone ||
                    (cleanMPhone.length >= 8 &&
                        cleanMPhone.slice(-8) === uPhone.slice(-8))
                ) {
                    return true;
                }
            }

            if (m.id === 101) return uPhone === '010843612' || uId === 5;
            if (m.id === 102) return uPhone === '087280875' || uId === 6;
            if (m.id === 103)
                return (
                    uPhone === '078776682' ||
                    uPhone === '067776682' ||
                    uId === 7 ||
                    uId === 8
                );
            if (m.id === 104) return uPhone === '011242425' || uId === 9;

            if (
                m.email &&
                uEmail &&
                String(m.email).toLowerCase().trim() === uEmail
            ) {
                if (uEmail === 'pisethpanhavorn544@gmail.com')
                    return uPhone === '010843612' || uId === 5;
                if (uEmail === 'pumprusmuny@example.com')
                    return uPhone === '087280875' || uId === 6;
                return true;
            }
            return false;
        });
    }

    private isUserTaskAssigneeOrReporter(
        user: UserPayload,
        t: TaskItem,
    ): boolean {
        if (!user) return false;
        const uId = Number(user.id || 0);
        const uEmail = (user.email || '').toLowerCase().trim();
        const uPhone = (user.phone || '').replace(/\D/g, '');

        if (
            (t as any).assignee_id &&
            uId &&
            Number((t as any).assignee_id) === uId
        )
            return true;
        if (
            (t as any).reporter_id &&
            uId &&
            Number((t as any).reporter_id) === uId
        )
            return true;
        if (
            Array.isArray((t as any).assignee_ids) &&
            uId &&
            (t as any).assignee_ids.some((id: any) => Number(id) === uId)
        )
            return true;

        const matchUser = (
            target?: {
                id?: number;
                user_id?: number;
                name?: string;
                email?: string;
                phone?: string;
            } | null,
        ): boolean => {
            if (!target) return false;
            const targetId = Number(target.id || (target as any).user_id || 0);

            if (targetId && uId && targetId === uId) {
                return true;
            }

            if (target.phone && uPhone) {
                const tPhone = String(target.phone).replace(/\D/g, '');
                if (
                    tPhone === uPhone ||
                    (tPhone.length >= 8 &&
                        tPhone.slice(-8) === uPhone.slice(-8))
                ) {
                    return true;
                }
            }

            if (
                target.email &&
                uEmail &&
                String(target.email).toLowerCase().trim() === uEmail
            ) {
                if (uEmail === 'pisethpanhavorn544@gmail.com') {
                    return uPhone === '010843612' || uId === 5;
                }
                if (uEmail === 'pumprusmuny@example.com') {
                    return uPhone === '087280875' || uId === 6;
                }
                return true;
            }

            return false;
        };

        if (matchUser(t.reporter)) return true;
        if (matchUser(t.assignee)) return true;
        if (Array.isArray(t.assignees)) {
            return t.assignees.some((a) => matchUser(a));
        }
        return false;
    }

    public getUserAccessiblePlanKeys(user: UserPayload): Set<string> {
        const allowed = new Set<string>();
        if (!user) return allowed;
        const userPlans = this.getPlanProjects().filter((p) =>
            this.isUserPlanMember(user, p),
        );
        for (const p of userPlans) {
            if (p.id) {
                const idStr = String(p.id).toLowerCase().trim();
                allowed.add(idStr);
                allowed.add(idStr.replace(/\s+/g, '-'));
            }
            if (p.code) {
                const codeStr = String(p.code)
                    .toLowerCase()
                    .trim()
                    .replace('#', '');
                allowed.add(codeStr);
            }
            if (p.name) {
                const nameStr = String(p.name).toLowerCase().trim();
                allowed.add(nameStr);
                allowed.add(nameStr.replace(/\s+/g, '-'));
            }
        }
        return allowed;
    }

    public isTaskInAccessiblePlans(
        t: TaskItem,
        allowedKeys: Set<string>,
    ): boolean {
        if (!allowedKeys || allowedKeys.size === 0) return false;
        const tPid = (t.project_id || '').toLowerCase().trim();
        const tPname = (t.project_name || '').toLowerCase().trim();
        const tCode = (t.code || '').toLowerCase().trim().replace('#', '');
        const tCodePrefix = tCode.split('-')[0];

        for (const key of allowedKeys) {
            if (tPid && tPid === key) return true;
            if (tPname && tPname === key) return true;
            if (tCode && (tCode === key || tCode.startsWith(key + '-')))
                return true;
            if (tCodePrefix && tCodePrefix === key) return true;
        }
        return false;
    }

    public canUserAccessTask(user: UserPayload, task: TaskItem): boolean {
        if (!user) return false;
        if (this.isAdmin(user)) return true;
        if (this.isUserTaskAssigneeOrReporter(user, task)) return true;
        const allowedPlanKeys = this.getUserAccessiblePlanKeys(user);
        return this.isTaskInAccessiblePlans(task, allowedPlanKeys);
    }

    async getProjects(user?: UserPayload) {
        let planProjects = this.getPlanProjects();
        const isUserAdmin = user ? this.isAdmin(user) : false;

        if (!isUserAdmin) {
            if (!user) {
                planProjects = [];
            } else {
                planProjects = planProjects.filter((p) =>
                    this.isUserPlanMember(user, p),
                );
            }
        }

        const allowedPlanKeys = new Set(
            planProjects.map((p) => (p.id || '').toLowerCase()),
        );
        planProjects.forEach((p) => {
            if (p.name) allowedPlanKeys.add(p.name.toLowerCase());
            if (p.code) allowedPlanKeys.add(p.code.toLowerCase());
        });

        // Collect distinct projects from current tasks
        const taskProjectMap = new Map<
            string,
            { id: string; name: string; code?: string }
        >();
        for (const t of this.tasks) {
            if (t.project_id || t.project_name) {
                if (!isUserAdmin) {
                    if (!user) continue;
                    const pidKey = (t.project_id || '').toLowerCase();
                    const pnameKey = (t.project_name || '').toLowerCase();
                    const isAllowedPlan =
                        allowedPlanKeys.has(pidKey) ||
                        allowedPlanKeys.has(pnameKey);
                    if (!isAllowedPlan) {
                        continue;
                    }
                }
                const key = (t.project_id || t.project_name).toLowerCase();
                if (!taskProjectMap.has(key)) {
                    taskProjectMap.set(key, {
                        id: t.project_id || key,
                        name: t.project_name || t.project_id || 'Project',
                        code: t.code
                            ? t.code.split('-')[0].replace('#', '')
                            : undefined,
                    });
                }
            }
        }

        const results: Array<{
            id: string;
            name: string;
            code?: string;
            logo?: string;
            image?: string;
            status?: string;
        }> = [];
        const seen = new Set<string>();

        for (const p of planProjects) {
            const normName = (p.name || '').trim().toLowerCase();
            if (normName && !seen.has(normName)) {
                seen.add(normName);
                const matchingTaskProj = Array.from(
                    taskProjectMap.values(),
                ).find(
                    (tp) =>
                        tp.name.toLowerCase() === normName ||
                        tp.id.toLowerCase() ===
                            (p.id ? String(p.id).toLowerCase() : '') ||
                        tp.id.toLowerCase() ===
                            (p.code ? String(p.code).toLowerCase() : ''),
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
        try {
            dbUsers = await this._userRepo.find({
                relations: ['user_roles', 'user_roles.role', 'avatar_file'],
                order: { id: 'ASC' },
            });

            // Keep all active users (exclude only soft-deleted or inactive if specified)
            dbUsers = dbUsers.filter((u) => {
                if ((u as any).deleted_at) return false;
                if ((u as any).is_active === 0) return false;
                return true;
            });

            // Deduplicate by ID and phone suffix
            const normalizePhone = (p?: string) =>
                (p || '').replace(/\D/g, '').slice(-8);
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
            'bg-teal-600',
            'bg-rose-600',
        ];

        const mapped = dbUsers.map((u, idx) => {
            const activeUserRole =
                u.user_roles?.find((ur) => ur.is_default) ||
                u.user_roles?.[0];
            const roleName =
                activeUserRole?.role?.name_kh ||
                activeUserRole?.role?.name_en ||
                activeUserRole?.role?.slug ||
                'សមាជិក (Member)';

            let avatarUrl: string | null = null;
            if (u.avatar_file?.uri) {
                const domain = (u.avatar_file.file_domain || '').replace(
                    /\/+$/,
                    '',
                );
                const uri = u.avatar_file.uri.replace(/^\/+/, '');
                avatarUrl = domain ? `${domain}/${uri}` : `/${uri}`;
            } else if (u.telegram_photo_url) {
                avatarUrl = u.telegram_photo_url;
            }

            const displayName = u.name_kh || u.name_en || `User #${u.id}`;

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

        return {
            status_code: 200,
            message: 'Members retrieved successfully',
            data: mapped,
        };
    }

    /**
     * Check whether a task belongs to the user:
     * Either the user is assigned to the task (primary assignee or in assignees list)
     * OR the user is the reporter of the task.
     */
    private isTaskBelongToUser(task: TaskItem, user?: UserPayload): boolean {
        if (!user) return false;
        return this.isUserTaskAssigneeOrReporter(user, task);
    }

    /** A query value only filters when it is set and is not one of the "no filter" sentinels the web sends. */
    private isFilterActive(value?: string): boolean {
        return Boolean(
            value &&
            value !== 'all' &&
            value !== 'undefined' &&
            value !== 'null' &&
            value.trim(),
        );
    }

    private matchesSearch(task: TaskItem, search?: string): boolean {
        if (!this.isFilterActive(search)) return true;
        const s = search.trim().toLowerCase();
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
        if (this.isEventbookingTask(task)) {
            const isEventFilter =
                projectId.toLowerCase().includes('0004') ||
                projectId.toLowerCase().includes('event');
            return isEventFilter;
        }

        const pid = projectId.toLowerCase().trim();
        const cleanPid = pid.replace('#', '');
        const paddedCleanPid = /^\d+$/.test(cleanPid)
            ? cleanPid.padStart(4, '0')
            : cleanPid;
        const tPid = (task.project_id || '').toLowerCase().trim();
        const tPname = (task.project_name || '').toLowerCase().trim();
        const tCode = (task.code || '').toLowerCase().trim().replace('#', '');
        const tCodePrefix = tCode.split('-')[0].trim();

        // 1. Direct project ID / code equality (matches '0006', '0007', etc.)
        if (
            tPid === pid ||
            tPid === cleanPid ||
            tPid === paddedCleanPid
        ) {
            return true;
        }

        // 2. Exact code prefix equality (#0006-1 -> prefix '0006')
        if (
            tCodePrefix === cleanPid ||
            tCodePrefix === paddedCleanPid
        ) {
            return true;
        }

        // 3. Exact project name equality (never substring .includes which causes bleeding)
        if (tPname && (tPname === pid || tPname === cleanPid)) {
            return true;
        }

        // 4. Legacy backward-compatibility aliases (ONLY for pre-redesign BMS & WMS data)
        const isBmsFilter =
            cleanPid === '0002' ||
            cleanPid === 'bms' ||
            cleanPid === 'bms-digitech' ||
            cleanPid === '4';
        if (isBmsFilter) {
            return (
                tPid === '0002' ||
                tPid === 'bms' ||
                tPid === 'bms-digitech' ||
                tPid === '4' ||
                tCodePrefix === '0002' ||
                tCodePrefix === 'bms' ||
                tPname === 'bms digitech'
            );
        }

        const isWmsFilter =
            cleanPid === '0001' ||
            cleanPid === 'wms' ||
            cleanPid === 'wms-digitech' ||
            cleanPid === '5';
        if (isWmsFilter) {
            return (
                tPid === '0001' ||
                tPid === 'wms' ||
                tPid === 'wms-digitech' ||
                tPid === '5' ||
                tCodePrefix === '0001' ||
                tCodePrefix === 'wms' ||
                tPname === 'wms digitech'
            );
        }

        return false;
    }

    private matchesMember(task: TaskItem, memberId?: string): boolean {
        if (!this.isFilterActive(memberId)) return true;
        const mId = Number(memberId);
        return Boolean(
            Number(task.assignee?.id) === mId ||
            (task.assignees &&
                task.assignees.some((a) => Number(a.id) === mId)) ||
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
            new: tasks.filter(
                (t) =>
                    t.status === TaskStatusEnum.NEW ||
                    (t.status as any) === 'pending',
            ).length,
            confirmed: tasks.filter(
                (t) => t.status === TaskStatusEnum.CONFIRMED,
            ).length,
            unconfirmed: tasks.filter(
                (t) =>
                    t.status === TaskStatusEnum.UNCONFIRMED ||
                    (t.status as any) === 'todo',
            ).length,
            in_progress: tasks.filter(
                (t) => t.status === TaskStatusEnum.IN_PROGRESS,
            ).length,
            in_review: tasks.filter(
                (t) =>
                    t.status === TaskStatusEnum.IN_REVIEW ||
                    (t.status as any) === 'review',
            ).length,
            reopened: tasks.filter((t) => t.status === TaskStatusEnum.REOPENED)
                .length,
            done: tasks.filter(
                (t) =>
                    t.status === TaskStatusEnum.DONE ||
                    (t.status as any) === 'completed',
            ).length,
        };
    }

    /** Public wrapper so the home overview can scope its counts to the signed-in user. */
    belongsToUser(task: TaskItem, user?: UserPayload): boolean {
        return this.isTaskBelongToUser(task, user);
    }

    /** Load database user members map for live role, name, and avatar enrichment */
    private async getLiveMemberLookup(): Promise<LiveMemberLookup> {
        const lookup = new LiveMemberLookup();
        try {
            const users = await this._userRepo.find({
                relations: ['user_roles', 'user_roles.role', 'avatar_file'],
                order: { id: 'ASC' },
            });
            for (const u of users) {
                if ((u as any).deleted_at || (u as any).is_active === 0) continue;
                const activeUserRole =
                    u.user_roles?.find((ur) => ur.is_default) ||
                    u.user_roles?.[0];
                const roleName =
                    activeUserRole?.role?.name_kh ||
                    activeUserRole?.role?.name_en ||
                    activeUserRole?.role?.slug ||
                    'សមាជិក (Member)';

                let avatarUrl: string | null = null;
                if (u.avatar_file?.uri) {
                    let domain = (u.avatar_file.file_domain || '').replace(
                        /\/+$/,
                        '',
                    );
                    if (
                        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(
                            domain.trim(),
                        )
                    ) {
                        domain = '';
                    }
                    const uri = u.avatar_file.uri.replace(/^\/+/, '');
                    avatarUrl = domain ? `${domain}/${uri}` : `/${uri}`;
                } else if (u.telegram_photo_url) {
                    avatarUrl = u.telegram_photo_url;
                }

                const displayName = u.name_kh || u.name_en || `User #${u.id}`;

                lookup.add(
                    {
                        id: u.id,
                        name: displayName,
                        role: roleName,
                        avatar: avatarUrl,
                        email: u.email || '',
                        phone: u.phone || '',
                    },
                    u,
                );
            }
        } catch (e) {
            console.error('Failed to load user members for live lookup:', e);
        }
        return lookup;
    }

    private resolveMemberAvatar(
        m: any,
        avatarMap: Map<string, string>,
    ): string | null {
        if (!m) return null;
        if (m.id && avatarMap.has(`id:${m.id}`)) {
            return avatarMap.get(`id:${m.id}`);
        }
        if (m.email && avatarMap.has(`email:${m.email.toLowerCase().trim()}`)) {
            return avatarMap.get(`email:${m.email.toLowerCase().trim()}`);
        }
        if (m.phone) {
            const p = String(m.phone).replace(/\D/g, '');
            if (avatarMap.has(`phone:${p}`)) return avatarMap.get(`phone:${p}`);
            if (p.length >= 8 && avatarMap.has(`phone:${p.slice(-8)}`))
                return avatarMap.get(`phone:${p.slice(-8)}`);
        }
        const nameKey = (m.name || '').toLowerCase().trim();
        if (nameKey) {
            if (avatarMap.has(`name:${nameKey}`))
                return avatarMap.get(`name:${nameKey}`);
            for (const [k, v] of avatarMap.entries()) {
                if (k.startsWith('name:')) {
                    const candidate = k.replace('name:', '');
                    if (
                        candidate &&
                        (candidate === nameKey ||
                            candidate.includes(nameKey) ||
                            nameKey.includes(candidate))
                    ) {
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
        if (
            m.avatar &&
            typeof m.avatar === 'string' &&
            !m.avatar.includes('placeholder')
        ) {
            const cleaned = m.avatar.replace(
                /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i,
                '/',
            );
            return cleaned.startsWith('/') || cleaned.startsWith('http')
                ? cleaned
                : `/${cleaned}`;
        }
        return null;
    }

    private resolveMember(m: any, lookup: LiveMemberLookup): any {
        if (!m) return m;
        const matched = lookup.find(m);
        if (matched) {
            return {
                ...m,
                id: matched.id,
                name: matched.name,
                role: matched.role,
                avatar: matched.avatar || this.resolveMemberAvatar(m, lookup.avatarMap),
                email: matched.email || m.email || '',
                phone: matched.phone || m.phone || '',
            };
        }
        const av = this.resolveMemberAvatar(m, lookup.avatarMap);
        return av ? { ...m, avatar: av } : m;
    }

    private async enrichTasksWithMembers(
        tasks: TaskItem[],
        _currentUser?: UserPayload,
    ): Promise<TaskItem[]> {
        if (!tasks || tasks.length === 0) return tasks;
        const lookup = await this.getLiveMemberLookup();
        return tasks.map((t) => {
            const copy = { ...t };
            if (
                (!copy.assignees ||
                    !Array.isArray(copy.assignees) ||
                    copy.assignees.length === 0) &&
                copy.assignee &&
                copy.assignee.name
            ) {
                copy.assignees = [copy.assignee];
            }
            if (
                Array.isArray(copy.assignees) &&
                copy.assignees.length > 0 &&
                (!copy.assignee || !copy.assignee.name)
            ) {
                copy.assignee = copy.assignees[0];
            }
            if (copy.assignee) {
                copy.assignee = this.resolveMember(copy.assignee, lookup);
            }
            if (Array.isArray(copy.assignees)) {
                copy.assignees = copy.assignees.map((a) =>
                    this.resolveMember(a, lookup),
                );
            }
            if (copy.reporter) {
                copy.reporter = this.resolveMember(copy.reporter, lookup);
            }
            return copy;
        });
    }

    private async enrichTasksWithAvatars(
        tasks: TaskItem[],
        currentUser?: UserPayload,
    ): Promise<TaskItem[]> {
        return this.enrichTasksWithMembers(tasks, currentUser);
    }

    async getTasks(user: UserPayload, query: QueryTasksDto) {
        await this.ensureStoreLoaded();
        let validTasks = this.tasks.filter((t) => !this.isPmsTask(t));

        // For non-admin users:
        // If viewing tasks within a specific project or requesting project scope (scope: 'all' | 'project'),
        // only show tasks from projects the user belongs to, or tasks explicitly assigned to them.
        // On the main Task feature (/member/tasks), strictly show only tasks where own account is reporter or assignee.
        if (!this.isAdmin(user)) {
            if (!user) {
                validTasks = [];
            } else {
                const allowedPlanKeys = this.getUserAccessiblePlanKeys(user);

                if (query.scope === 'all' || query.scope === 'project') {
                    validTasks = validTasks.filter(
                        (t) =>
                            this.isTaskInAccessiblePlans(t, allowedPlanKeys) ||
                            this.isUserTaskAssigneeOrReporter(user, t),
                    );
                } else if (query.project_id && query.project_id !== 'all') {
                    const targetProjectId = query.project_id
                        .toLowerCase()
                        .trim();
                    const cleanTargetPid = targetProjectId.replace('#', '');
                    const isMemberOfThisProject =
                        allowedPlanKeys.has(targetProjectId) ||
                        allowedPlanKeys.has(cleanTargetPid);
                    if (isMemberOfThisProject) {
                        validTasks = validTasks.filter((t) =>
                            this.matchesProject(t, query.project_id),
                        );
                    } else {
                        validTasks = validTasks.filter(
                            (t) =>
                                this.matchesProject(t, query.project_id) &&
                                this.isUserTaskAssigneeOrReporter(user, t),
                        );
                    }
                } else {
                    validTasks = validTasks.filter((t) =>
                        this.isUserTaskAssigneeOrReporter(user, t),
                    );
                }
            }
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

        const list = countScope.filter((t) =>
            this.matchesStatus(t, query.status),
        );

        const limit = query.limit ? parseInt(query.limit, 10) : 100;
        const offset = query.offset ? parseInt(query.offset, 10) : 0;
        const paginated = list.slice(offset, offset + limit);
        const enrichedResults = await this.enrichTasksWithAvatars(
            paginated,
            user,
        );

        // Sanitize tasks for list / kanban board view:
        // Strip heavy base64 data URLs from attachments and inline images in descriptions.
        // This drops the network transfer payload from 10MB down to ~40KB (99.6% reduction!).
        // Full attachments and details are loaded on demand via getTaskById when opening a specific task.
        const sanitizedResults = enrichedResults.map((t) => {
            const copy: any = { ...t };
            copy.attachments_count =
                copy.attachments_count ??
                (Array.isArray(copy.attachments) ? copy.attachments.length : 0);
            delete copy.attachments;

            if (
                typeof copy.description === 'string' &&
                copy.description.includes('data:image/')
            ) {
                copy.description = copy.description.replace(
                    /src="data:image\/[^;]+;base64,[^"]+"/g,
                    'src=""',
                );
            }

            return copy;
        });

        return {
            status_code: 200,
            message: 'Tasks retrieved successfully',
            data: {
                results: sanitizedResults,
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

        if (!user || !this.canUserAccessTask(user, task)) {
            throw new ForbiddenException(
                'អ្នកមិនមានសិទ្ធិចូលមើលភារកិច្ចនេះទេ (You do not have permission to view this task).',
            );
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
        if (!user) {
            throw new ForbiddenException(
                'អ្នកមិនមានសិទ្ធិបង្កើតភារកិច្ចទេ (You do not have permission to create tasks).',
            );
        }
        if (!this.isAdmin(user)) {
            const allowedPlanKeys = this.getUserAccessiblePlanKeys(user);
            const targetProjectId = (dto.project_id || '').toLowerCase().trim();
            const cleanTargetPid = targetProjectId.replace('#', '');
            const isMember =
                allowedPlanKeys.has(targetProjectId) ||
                allowedPlanKeys.has(cleanTargetPid);
            if (!isMember) {
                throw new ForbiddenException(
                    'អ្នកអាចបង្កើតភារកិច្ចបានតែក្នុងគម្រោងដែលអ្នកជាសមាជិកប៉ុណ្ណោះ (You can only create tasks in projects you are a member of).',
                );
            }
        }
        let prefix = 'PRJ';
        let formattedCode = '';
        if (dto.code && dto.code.trim()) {
            const clean = dto.code.replace(/^#/, '').trim();
            const parts = clean.split('-');
            if (parts.length > 0 && parts[0]) {
                prefix = parts[0].toUpperCase();
            }
            formattedCode = dto.code.trim().startsWith('#')
                ? dto.code.trim()
                : `#${dto.code.trim()}`;
        } else {
            const targetPid = dto.project_id || '';
            const foundPlan = this.getPlanProjects().find(
                (p) =>
                    String(p.id).toLowerCase() === targetPid.toLowerCase() ||
                    String(p.code || '').toLowerCase() ===
                        targetPid.toLowerCase(),
            );
            if (foundPlan?.code) {
                prefix = foundPlan.code.replace(/^#/, '').toUpperCase();
            } else if (/\bWMS\b|^WMS-/i.test(targetPid)) {
                prefix = '0001';
            } else if (/\bBMS\b|^BMS-/i.test(targetPid)) {
                prefix = '0002';
            } else if (targetPid) {
                prefix = targetPid.replace(/^#/, '').toUpperCase();
            }
            const projectTasks = this.tasks.filter(
                (t) =>
                    t.project_id === dto.project_id ||
                    (foundPlan?.id && t.project_id === String(foundPlan.id)) ||
                    (t.code &&
                        t.code
                            .toUpperCase()
                            .replace(/^#/, '')
                            .startsWith(prefix + '-')),
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
            const nextSeq = maxNum >= 0 ? maxNum + 1 : 1;
            formattedCode = `#${prefix}-${nextSeq}`;
        }

        // Process assignees
        let assigneesList: Array<{
            id: number;
            name: string;
            avatar?: string | null;
            role?: string;
            email?: string;
        }> = [];
        if (
            dto.assignees &&
            Array.isArray(dto.assignees) &&
            dto.assignees.length > 0
        ) {
            assigneesList = dto.assignees.map((a: any, idx: number) => ({
                id: Number(a.id) || idx + 1,
                name:
                    typeof a === 'string' ? a : a.name || a.title || 'Assignee',
                avatar: typeof a === 'object' && a.avatar ? a.avatar : null,
                role: typeof a === 'object' && a.role ? a.role : 'Assignee',
                email: typeof a === 'object' && a.email ? a.email : '',
            }));
        } else if (dto.assignee) {
            if (typeof dto.assignee === 'string' && dto.assignee.trim()) {
                assigneesList = dto.assignee
                    .split(',')
                    .map((nameStr: string, idx: number) => ({
                        id: idx + 1,
                        name: nameStr.trim(),
                        avatar: null,
                        role: 'Assignee',
                    }));
            } else if (
                typeof dto.assignee === 'object' &&
                dto.assignee.name &&
                dto.assignee.name.trim()
            ) {
                assigneesList = [
                    {
                        id: Number(dto.assignee.id) || 1,
                        name: dto.assignee.name.trim(),
                        avatar: dto.assignee.avatar || null,
                        role: dto.assignee.role || 'Assignee',
                        email: dto.assignee.email || '',
                    },
                ];
            }
        }

        const primaryAssignee =
            assigneesList.length > 0 ? assigneesList[0] : null;

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
            } else if (
                typeof dto.reporter === 'object' &&
                dto.reporter.name &&
                dto.reporter.name.trim()
            ) {
                taskReporter = {
                    id: Number(dto.reporter.id) || user?.id || 0,
                    name: dto.reporter.name.trim(),
                    avatar:
                        dto.reporter.avatar ||
                        (user?.avatar as any)?.uri ||
                        null,
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
                role:
                    user.roles?.[0]?.name_en ||
                    user.roles?.[0]?.name_kh ||
                    'Reporter',
            };
        }

        const initialAttachments =
            dto.attachments && Array.isArray(dto.attachments)
                ? dto.attachments
                : [];

        const rawTargetPid = (dto.project_id || prefix).toLowerCase().trim();
        const foundPlan = this.getPlanProjects().find(
            (p) =>
                String(p.id).toLowerCase().trim() === rawTargetPid ||
                String(p.code || '').toLowerCase().trim().replace('#', '') ===
                    rawTargetPid.replace('#', ''),
        );
        const targetPid =
            foundPlan?.id ||
            foundPlan?.code ||
            dto.project_id ||
            prefix;
        const resolvedProjectName =
            foundPlan?.name ||
            dto.project_name ||
            (foundPlan?.code ? foundPlan.code : prefix);

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
            project_id: targetPid,
            project_name: resolvedProjectName,
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
                sender_name:
                    taskReporter?.name ||
                    user?.name_kh ||
                    user?.name_en ||
                    'អ្នកប្រើប្រាស់',
                sender_avatar:
                    taskReporter?.avatar ||
                    (user?.avatar as any)?.uri ||
                    '/images/placeholder/avatar.jpg',
                text: 'បានភ្ជាប់ឯកសារពេលបង្កើតការងារថ្មី',
                time: new Date().toLocaleTimeString('en-US', {
                    timeZone: 'Asia/Phnom_Penh',
                    hour: '2-digit',
                    minute: '2-digit',
                }),
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
        try {
            await this._taskRepo.save(
                this._taskRepo.create({
                    id: newTask.id,
                    code: newTask.code,
                    title: newTask.title,
                    description: newTask.description,
                    task_type: newTask.task_type,
                    module: newTask.module,
                    status: newTask.status,
                    priority: newTask.priority,
                    progress: newTask.progress,
                    due_date: newTask.due_date,
                    project_id: newTask.project_id,
                    project_name: newTask.project_name,
                    reporter: newTask.reporter,
                    assignee: newTask.assignee,
                    assignees: newTask.assignees,
                    attachments: newTask.attachments,
                    attachments_count: newTask.attachments_count,
                    comments_count: newTask.comments_count,
                }),
            );
            if (initialAttachments.length > 0) {
                const comms = this.taskComments.get(newTask.id) || [];
                for (const c of comms) {
                    await this._taskCommentRepo.save(
                        this._taskCommentRepo.create({
                            id: c.id,
                            task_id: newTask.id,
                            sender_id: c.sender_id,
                            sender_name: c.sender_name,
                            sender_avatar: c.sender_avatar,
                            text: c.text,
                            time: c.time,
                            is_self: c.is_self,
                            is_system: c.is_system,
                            attachments: c.attachments,
                            seen_by: c.seen_by,
                        }),
                    );
                }
            }
        } catch (e) {}

        // Dispatch Telegram Notification (Exact PMS format)
        const creatorName =
            taskReporter?.name ||
            user?.name_kh ||
            user?.name_en ||
            'អ្នកប្រើប្រាស់';
        const taskCode = newTask.code || `#${prefix}-0000`;
        let firstLine = `📌 ${creatorName} បានបង្កើតការងារថ្មី ${taskCode}`;
        if (initialAttachments.length > 0) {
            firstLine += `\n📎 ឯកសារភ្ជាប់ (${initialAttachments.length})`;
        }
        const targetIds = [user?.id, ...assigneesList.map((a) => a.id)].filter(
            Boolean,
        );
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
                    sender: {
                        id: user?.id || 1,
                        name_en: creatorName,
                        name_kh: creatorName,
                    },
                },
            };
            this._notificationService.pushNotification(notif, targetIds);
        }

        if (this._realtimeGateway) {
            this._realtimeGateway.emitTaskCreated({
                task: newTask,
                project_id: newTask.project_id,
            });
        }

        const [enrichedTask] = await this.enrichTasksWithAvatars(
            [newTask],
            user,
        );

        return {
            status_code: 201,
            message: 'Task created successfully',
            data: enrichedTask || newTask,
        };
    }

    private getProjectPrefix(task?: TaskItem): string {
        if (!task) return 'WMS';
        if (
            task.project_id === 'bms-digitech' ||
            task.code?.startsWith('#BMS') ||
            /\bBMS\b|^BMS-/i.test(task.project_name || '')
        )
            return 'BMS';
        if (
            task.project_id === 'wms-digitech' ||
            task.code?.startsWith('#WMS') ||
            /\bWMS\b|^WMS-/i.test(task.project_name || '')
        )
            return 'WMS';
        return 'WMS';
    }

    private getTaskContextLine(task: TaskItem): string {
        return (task.title || task.code || 'Task').trim();
    }

    private getStatusLabel(status?: string): string {
        switch (status?.toLowerCase()) {
            case 'new':
            case 'todo':
                return 'ថ្មី';
            case 'confirmed':
                return 'បញ្ជាក់';
            case 'unconfirmed':
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
                return status || '';
        }
    }

    private getPriorityLabel(priority?: string): string {
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
                return priority || '';
        }
    }

    private getTaskTypeLabel(type?: string): string {
        switch (type?.toLowerCase()) {
            case 'feature':
                return 'មុខងារ';
            case 'improvement':
                return 'ការកែលម្អ';
            case 'bug':
                return 'កំហុស';
            case 'documentation':
                return 'ឯកសារ';
            case 'research':
                return 'ស្រាវជ្រាវ';
            case 'refactor':
                return 'ប្លង់កម្មវិធី';
            case 'core_task':
                return 'កិច្ចការចម្បង';
            default:
                return type || 'មុខងារ';
        }
    }

    private inferTaskType(task: any): string {
        if (task.task_type) return task.task_type;
        const text =
            `${task.title || ''} ${task.description || ''} ${task.module || ''}`.toLowerCase();
        if (
            text.includes('bug') ||
            text.includes('cannot scroll') ||
            text.includes('missing') ||
            text.includes('fix')
        ) {
            return 'bug';
        }
        if (
            text.includes('improvement') ||
            text.includes('refactor') ||
            text.includes('security setting')
        ) {
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
            process.env.APP_DEPLOY_URL || 'https://wms-digitechkh.vercel.app'
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
                chatIdsToSend.add(
                    String(appConfig.ORGANIZATION_LOG.TELEGRAM_CHAT_ID),
                );
            }

            const targetSet =
                targetUserIds && targetUserIds.length > 0
                    ? new Set(targetUserIds.map((id) => Number(id)))
                    : null;

            for (const u of linkedUsers) {
                if (u.telegram_id && (!targetSet || targetSet.has(u.id))) {
                    chatIdsToSend.add(String(u.telegram_id));
                }
            }

            const sendPromises = Array.from(chatIdsToSend).map(
                async (chatId) => {
                    if (!chatId) return;

                    let messageThreadId: number | undefined = undefined;
                    try {
                        const u = linkedUsers.find(
                            (user) => String(user.telegram_id) === chatId,
                        );
                        if (u) {
                            const thread = await this._threadRepo.findOne({
                                where: {
                                    user_id: u.id,
                                    project_id: task.project_id,
                                },
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
                        await axios.post(
                            `https://api.telegram.org/bot${botToken}/sendMessage`,
                            payload,
                            { timeout: 8000 },
                        );
                    } catch (err: any) {
                        const desc =
                            err?.response?.data?.description ||
                            err?.message ||
                            '';
                        if (
                            messageThreadId &&
                            desc.toLowerCase().includes('thread')
                        ) {
                            delete payload.message_thread_id;
                            try {
                                await axios.post(
                                    `https://api.telegram.org/bot${botToken}/sendMessage`,
                                    payload,
                                    { timeout: 8000 },
                                );
                            } catch (e: any) {
                                console.warn(
                                    `[Telegram Notification] Fallback failed for ${chatId}:`,
                                    e?.response?.data?.description ||
                                        e?.message ||
                                        e,
                                );
                            }
                        } else {
                            console.warn(
                                `[Telegram Notification] Failed to send to ${chatId}:`,
                                desc,
                            );
                        }
                    }
                },
            );

            await Promise.allSettled(sendPromises);
        } catch (err: any) {
            console.warn(
                '[Telegram Notification] Error querying linked users:',
                err?.message || err,
            );
        }
    }

    async updateTask(user: UserPayload, id: number, dto: UpdateTaskDto) {
        await this.ensureStoreLoaded();
        const index = this.tasks.findIndex((t) => t.id === id);
        if (index === -1) {
            throw new NotFoundException(`Task #${id} not found`);
        }

        const current = this.tasks[index];
        if (!user || !this.canUserAccessTask(user, current)) {
            throw new ForbiddenException(
                'អ្នកមិនមានសិទ្ធិកែប្រែភារកិច្ចនេះទេ (You do not have permission to update this task).',
            );
        }
        const updated: TaskItem = {
            ...current,
            title: dto.title ?? current.title,
            description: dto.description ?? current.description,
            status: dto.status ?? current.status,
            task_type:
                dto.task_type !== undefined
                    ? dto.task_type
                    : current.task_type || 'feature',
            priority: dto.priority ?? current.priority,
            progress:
                dto.progress !== undefined
                    ? dto.progress
                    : dto.status === TaskStatusEnum.DONE
                      ? 100
                      : current.progress,
            due_date:
                dto.due_date !== undefined ? dto.due_date : current.due_date,
            updated_at: new Date().toISOString(),
        };

        // Record action history in task comments
        const comments = this.ensureTaskComments(id);
        const nowTime = new Date().toLocaleTimeString('en-US', {
            timeZone: 'Asia/Phnom_Penh',
            hour: '2-digit',
            minute: '2-digit',
        });
        const updaterName =
            (user?.name_kh || user?.name_en || '').trim() || 'Piseth Panhavorn';
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

        if (
            dto.description !== undefined &&
            dto.description.trim() !== (current.description || '').trim()
        ) {
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
                text: dto.due_date
                    ? `${actorPrefix}បានកំណត់កាលបរិច្ឆេទត្រូវធ្វើថ្មី៖ ${formatted}`
                    : `${actorPrefix}បានសម្អាតកាលបរិច្ឆេទកំណត់`,
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
        try {
            await this._taskRepo.save(
                this._taskRepo.create({
                    id: updated.id,
                    code: updated.code,
                    title: updated.title,
                    description: updated.description,
                    task_type: updated.task_type,
                    module: updated.module,
                    status: updated.status,
                    priority: updated.priority,
                    progress: updated.progress,
                    due_date: updated.due_date,
                    project_id: updated.project_id,
                    project_name: updated.project_name,
                    reporter: updated.reporter,
                    assignee: updated.assignee,
                    assignees: updated.assignees,
                    attachments: updated.attachments,
                    attachments_count: updated.attachments_count,
                    comments_count: updated.comments_count,
                }),
            );
            // Save newly added system/audit comment
            if (comments.length > 0) {
                const lastComm = comments[comments.length - 1];
                if (lastComm && lastComm.is_system) {
                    await this._taskCommentRepo.save(
                        this._taskCommentRepo.create({
                            id: lastComm.id,
                            task_id: id,
                            sender_id: lastComm.sender_id,
                            sender_name: lastComm.sender_name,
                            sender_avatar: lastComm.sender_avatar,
                            text: lastComm.text,
                            time: lastComm.time,
                            is_self: lastComm.is_self,
                            is_system: lastComm.is_system,
                            attachments: lastComm.attachments,
                            seen_by: lastComm.seen_by,
                        }),
                    );
                }
            }
        } catch (e) {}

        // Send Telegram Notification (Exact PMS format)
        const targetIds = [
            user.id,
            updated.reporter?.id,
            updated.assignee?.id,
            ...(updated.assignees?.map((a) => a.id) || []),
        ].filter(Boolean);

        if (dto.task_type && dto.task_type !== current.task_type) {
            const firstLine = `🏷️ ${updaterName} ប្តូរប្រភេទការងារទៅ << ${this.getTaskTypeLabel(dto.task_type)} >>`;
            this.sendTelegramNotification(firstLine, updated, targetIds);
        } else if (dto.status && dto.status !== current.status) {
            const firstLine = `🔄 ${updaterName} ប្តូរស្ថានភាពការងារទៅ << ${this.getStatusLabel(dto.status)} >>`;
            this.sendTelegramNotification(firstLine, updated, targetIds);
        } else if (dto.priority && dto.priority !== current.priority) {
            const firstLine = `⚡ ${updaterName} ប្តូរអាទិភាពការងារទៅ << ${this.getPriorityLabel(dto.priority)} >>`;
            this.sendTelegramNotification(firstLine, updated, targetIds);
        } else if (
            dto.assignee ||
            (dto.assignees && dto.assignees.length > 0)
        ) {
            const assigneeName =
                dto.assignee?.name ||
                (dto.assignees
                    ? dto.assignees.map((a: any) => a.name).join(', ')
                    : '');
            const firstLine = `👤 ${updaterName} បានចាត់តាំងការងារទៅកាន់ << ${assigneeName} >>`;
            this.sendTelegramNotification(firstLine, updated, targetIds);
        } else if (
            dto.due_date !== undefined &&
            dto.due_date !== current.due_date
        ) {
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
        } else if (
            dto.progress !== undefined &&
            dto.progress !== current.progress
        ) {
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
                    sender: {
                        id: user?.id || 1,
                        name_en: updaterName,
                        name_kh: updaterName,
                    },
                },
            };
            this._notificationService.pushNotification(notif, targetIds);
        }

        if (this._realtimeGateway) {
            this._realtimeGateway.emitTaskUpdated({
                task_id: updated.id,
                status_id: updated.status as any,
                project_id: updated.project_id,
            });
        }

        const [enrichedUpdated] = await this.enrichTasksWithAvatars(
            [updated],
            user,
        );

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

        const taskToDelete = this.tasks[index];
        if (!this.isAdmin(user)) {
            if (
                !user ||
                !this.isUserTaskAssigneeOrReporter(user, taskToDelete)
            ) {
                throw new ForbiddenException(
                    'អ្នកមិនមានសិទ្ធិលុបភារកិច្ចនេះទេ (You do not have permission to delete this task).',
                );
            }
        }

        this.tasks.splice(index, 1);
        this.taskComments.delete(id);
        this.saveStore();
        try {
            await this._taskRepo.delete(id);
            await this._taskCommentRepo.delete({ task_id: id });
        } catch (e) {}

        if (this._realtimeGateway) {
            this._realtimeGateway.emitTaskDeleted({
                task_id: id,
                project_id: taskToDelete.project_id,
            });
        }

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

        if (!user || !this.canUserAccessTask(user, task)) {
            throw new ForbiddenException(
                'អ្នកមិនមានសិទ្ធិចូលមើលការសន្ទនានេះទេ (You do not have permission to view task comments).',
            );
        }

        const comments = this.ensureTaskComments(taskId);

        const lookup = await this.getLiveMemberLookup();

        // Record current viewer into seen_by for comments sent by others
        if (user && user.id) {
            const viewerName =
                (user.name_kh || user.name_en || '').trim() || 'User';
            const viewerMatched = lookup.find({
                id: user.id,
                email: user.email,
                name: viewerName,
            });
            const userAvatar =
                viewerMatched?.avatar ||
                this.resolveMemberAvatar(
                    { id: user.id, email: user.email, name: viewerName },
                    lookup.avatarMap,
                ) ||
                (user.avatar as any)?.uri ||
                null;
            const currentViewer = {
                id: user.id,
                name: viewerMatched?.name || viewerName,
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
                if (this._realtimeGateway) {
                    this._realtimeGateway.emitTaskCommentSeen({
                        task_id: taskId,
                        viewer: currentViewer,
                    });
                }
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
                    let formattedTime = c.time;
                    if (c.created_at) {
                        const d = new Date(c.created_at);
                        if (!isNaN(d.getTime())) {
                            formattedTime = d.toLocaleTimeString('en-US', {
                                timeZone: 'Asia/Phnom_Penh',
                                hour: '2-digit',
                                minute: '2-digit',
                            });
                        }
                    }
                    if (c.is_system || c.sender_id === 0) {
                        return {
                            ...c,
                            time: formattedTime,
                            is_self: false,
                            is_system: true,
                        };
                    }
                    const senderMatch = lookup.find({
                        id: c.sender_id,
                        name: c.sender_name,
                    });
                    const senderName = (
                        senderMatch?.name ||
                        c.sender_name ||
                        ''
                    )
                        .toLowerCase()
                        .trim();
                    const isSelf = Boolean(
                        (userNameKh &&
                            (senderName === userNameKh ||
                                senderName.includes(userNameKh) ||
                                userNameKh.includes(senderName))) ||
                        (userNameEn &&
                            (senderName === userNameEn ||
                                senderName.includes(userNameEn) ||
                                userNameEn.includes(senderName))) ||
                        (userEmail && senderName === userEmail) ||
                        (user?.id && c.sender_id === user.id),
                    );
                    let senderAvatar = senderMatch?.avatar || c.sender_avatar;
                    if (!senderAvatar || senderAvatar.includes('placeholder')) {
                        senderAvatar =
                            this.resolveMemberAvatar(
                                { id: c.sender_id, name: c.sender_name },
                                lookup.avatarMap,
                            ) ||
                            senderAvatar ||
                            null;
                    }
                    const seenByList = (
                        Array.isArray(c.seen_by) ? c.seen_by : []
                    ).map((s: any) => {
                        const sMatch = lookup.find(s);
                        const sAv =
                            sMatch?.avatar ||
                            this.resolveMemberAvatar(s, lookup.avatarMap);
                        return sAv
                            ? { ...s, name: sMatch?.name || s.name, avatar: sAv }
                            : s;
                    });
                    return {
                        ...c,
                        time: formattedTime,
                        sender_name: senderMatch?.name || c.sender_name,
                        sender_avatar: senderAvatar,
                        is_self: isSelf,
                        seen_by: seenByList,
                    };
                }),
            },
        };
    }

    async createTaskComment(
        user: UserPayload,
        taskId: number,
        text: string,
        attachments?: any[],
    ) {
        await this.ensureStoreLoaded();
        const task = this.tasks.find((t) => t.id === taskId);
        if (!task) {
            throw new NotFoundException(`Task #${taskId} not found`);
        }

        if (!user || !this.canUserAccessTask(user, task)) {
            throw new ForbiddenException(
                'អ្នកមិនមានសិទ្ធិចូលរួមក្នុងការសន្ទនានេះទេ (You do not have permission to comment on this task).',
            );
        }

        const lookup = await this.getLiveMemberLookup();
        const matchedSender = lookup.find({
            id: user.id,
            email: user.email,
            name: user.name_kh || user.name_en,
        });
        const userAvatar =
            matchedSender?.avatar ||
            this.resolveMemberAvatar(
                {
                    id: user.id,
                    email: user.email,
                    name: user.name_kh || user.name_en,
                },
                lookup.avatarMap,
            ) ||
            (user.avatar as any)?.uri ||
            null;

        const comments = this.ensureTaskComments(taskId);
        const newComment = {
            id: Date.now(),
            sender_id: user.id,
            sender_name:
                matchedSender?.name ||
                user.name_kh ||
                user.name_en ||
                'អ្នកប្រើប្រាស់ (User)',
            sender_avatar: userAvatar,
            text: (text || '').trim(),
            time: new Date().toLocaleTimeString('en-US', {
                timeZone: 'Asia/Phnom_Penh',
                hour: '2-digit',
                minute: '2-digit',
            }),
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
            task.attachments_count =
                (task.attachments_count || 0) + attachments.length;
        }
        task.updated_at = new Date().toISOString();
        this.saveStore();
        try {
            await this._taskCommentRepo.save(
                this._taskCommentRepo.create({
                    id: newComment.id,
                    task_id: taskId,
                    sender_id: newComment.sender_id,
                    sender_name: newComment.sender_name,
                    sender_avatar: newComment.sender_avatar,
                    text: newComment.text,
                    time: newComment.time,
                    is_self: newComment.is_self,
                    is_system: newComment.is_system,
                    attachments: newComment.attachments || [],
                    seen_by: newComment.seen_by || [],
                }),
            );
            await this._taskRepo.update(taskId, {
                comments_count: task.comments_count,
                attachments_count: task.attachments_count,
            });
        } catch (e) {}

        // Send Telegram Notification (Exact PMS format)
        const senderName = user.name_kh || user.name_en || 'Piseth Panhavorn';
        const commentText = (text || '').trim();
        let firstLine = '';
        if (commentText && attachments && attachments.length > 0) {
            firstLine = `💬 ${senderName}: ${commentText}\n📎 ឯកសារភ្ជាប់ (${attachments.length})`;
        } else if (commentText) {
            firstLine = `💬 ${senderName}: ${commentText}`;
        } else if (attachments && attachments.length > 0) {
            const fileNames = attachments
                .map((a: any) => a.name || a.filename || 'ឯកសារ')
                .join(', ');
            firstLine = `📎 ${senderName} បានផ្ញើឯកសារភ្ជាប់៖ ${fileNames}`;
        } else {
            firstLine = `🔔 ${senderName} បានផ្ញើសារក្នុងបន្ទប់ពិភាក្សា`;
        }

        const targetIds = [
            user.id,
            task.reporter?.id,
            task.assignee?.id,
            ...(task.assignees?.map((a) => a.id) || []),
        ].filter(Boolean);

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
                    sender: {
                        id: user.id,
                        name_en: user.name_en || senderName,
                        name_kh: user.name_kh || senderName,
                    },
                },
            };
            this._notificationService.pushNotification(commentNotif, targetIds);
        }

        if (this._realtimeGateway) {
            this._realtimeGateway.emitTaskUpdated({
                task_id: task.id,
                project_id: task.project_id,
            });
            this._realtimeGateway.emitTaskComment({
                task_id: task.id,
                project_id: task.project_id,
                comment: {
                    ...newComment,
                    sender_avatar: newComment.sender_avatar || userAvatar,
                    is_self: false,
                },
                comments_count: task.comments_count,
                attachments_count: task.attachments_count,
            });
        }

        return {
            status_code: 201,
            message: 'Chat comment added successfully',
            data: newComment,
        };
    }
}
