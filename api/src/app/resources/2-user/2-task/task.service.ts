// ===========================================================================>> Core Library
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

// ===========================================================================>> Custom Library
import { User } from 'src/app/model/user/users.entity';
import { UserPayload } from 'src/app/interface/jwt.interface';
import { CreateTaskDto, QueryTasksDto, TaskPriorityEnum, TaskStatusEnum, UpdateTaskDto } from './task.dto';

// In-memory / mock store to serve user task operations
export interface TaskItem {
    id: number;
    code?: string;
    title: string;
    description: string;
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
        code: '#PMS-675',
        module: 'Org Admin | Structure',
        title: 'Org Admin | Structure | Department',
        description: 'Manage departmental structures, permissions, and organizational units in core hierarchy.',
        status: TaskStatusEnum.IN_REVIEW,
        priority: TaskPriorityEnum.HIGH,
        progress: 85,
        comments_count: 1,
        attachments_count: 2,
        due_date: new Date(Date.now() + 86400000 * 6).toISOString(),
        project_id: 'proj-001',
        project_name: 'Core System Structure',
        reporter: { id: 1, name: 'ឡេង សុខឆាយ', avatar: null, role: 'អ្នករាយការណ៍ (Reporter)' },
        assignee: { id: 2, name: 'ចេង ច័ន្ទបញ្ញា', avatar: '/images/placeholder/avatar.jpg', role: 'អ្នកទទួលបន្ទុក (Assignee)' },
        assignees: [
            { id: 2, name: 'ចេង ច័ន្ទបញ្ញា', avatar: '/images/placeholder/avatar.jpg', role: 'ប្រធានផ្នែក Frontend Lead' }
        ],
        created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 2,
        code: '#PMS-671',
        module: 'Project | Folder',
        title: 'Project | Folder | Drag & Drop',
        description: 'Implement intuitive drag and drop folder organization for project documents.',
        status: TaskStatusEnum.DONE,
        priority: TaskPriorityEnum.HIGH,
        progress: 100,
        comments_count: 0,
        attachments_count: 2,
        due_date: new Date(Date.now() - 86400000 * 2).toISOString(),
        project_id: 'proj-001',
        project_name: 'Document Management',
        reporter: { id: 1, name: 'ឡេង សុខឆាយ', avatar: null, role: 'អ្នករាយការណ៍ (Reporter)' },
        assignee: { id: 3, name: 'ស៊ន់ ​លាង', avatar: null, role: 'អ្នកអភិវឌ្ឍន៍ Backend ជាន់ខ្ពស់' },
        assignees: [
            { id: 3, name: 'ស៊ន់ ​លាង', avatar: null, role: 'អ្នកអភិវឌ្ឍន៍ Backend ជាន់ខ្ពស់' }
        ],
        created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 3,
        code: '#PMS-670',
        module: 'Project | Folder',
        title: 'Project | Folder | Cannot Scroll PDF',
        description: 'Fix scrolling and pinch-to-zoom issues inside nested PDF preview modal containers.',
        status: TaskStatusEnum.CONFIRMED,
        priority: TaskPriorityEnum.URGENT,
        progress: 100,
        comments_count: 5,
        attachments_count: 1,
        due_date: new Date(Date.now() - 86400000 * 3).toISOString(),
        project_id: 'proj-001',
        project_name: 'Document Management',
        reporter: { id: 1, name: 'ឡេង សុខឆាយ', avatar: null, role: 'អ្នករាយការណ៍ (Reporter)' },
        assignee: { id: 2, name: 'ចេង ច័ន្ទបញ្ញា', avatar: '/images/placeholder/avatar.jpg', role: 'ប្រធានផ្នែក Frontend Lead' },
        assignees: [
            { id: 2, name: 'ចេង ច័ន្ទបញ្ញា', avatar: '/images/placeholder/avatar.jpg', role: 'ប្រធានផ្នែក Frontend Lead' }
        ],
        created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 4,
        code: '#PMS-574',
        module: 'My Work | Profile',
        title: 'My Work | Profile | Missing Cover',
        description: 'Provide fallback default cover gradient when user cover photo URL is empty or unverified.',
        status: TaskStatusEnum.REOPENED,
        priority: TaskPriorityEnum.URGENT,
        progress: 40,
        comments_count: 3,
        attachments_count: 1,
        due_date: new Date(Date.now() - 86400000 * 5).toISOString(),
        project_id: 'proj-002',
        project_name: 'User Experience',
        reporter: { id: 2, name: 'ចេង ច័ន្ទបញ្ញា', avatar: '/images/placeholder/avatar.jpg', role: 'អ្នករាយការណ៍ (Reporter)' },
        assignee: { id: 4, name: 'បញ្ញា វិរៈទិត្យា', avatar: null, role: 'វិស្វករ Fullstack' },
        assignees: [
            { id: 4, name: 'បញ្ញា វិរៈទិត្យា', avatar: null, role: 'វិស្វករ Fullstack' }
        ],
        created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 5,
        code: '#PMS-554',
        module: 'Security Settings',
        title: 'Security setting UI improvements',
        description: 'Refactor passkey registration dialog, 2FA toggle switches, and active login sessions table.',
        status: TaskStatusEnum.NEW,
        priority: TaskPriorityEnum.HIGH,
        progress: 10,
        comments_count: 4,
        attachments_count: 1,
        due_date: new Date(Date.now() - 86400000 * 6).toISOString(),
        project_id: 'proj-002',
        project_name: 'Security Hub',
        reporter: { id: 1, name: 'ឡេង សុខឆាយ', avatar: null, role: 'អ្នករាយការណ៍ (Reporter)' },
        assignee: { id: 2, name: 'ចេង ច័ន្ទបញ្ញា', avatar: '/images/placeholder/avatar.jpg', role: 'អ្នកទទួលបន្ទុក (Assignee)' },
        assignees: [
            { id: 2, name: 'ចេង ច័ន្ទបញ្ញា', avatar: '/images/placeholder/avatar.jpg', role: 'ប្រធានផ្នែក Frontend Lead' }
        ],
        created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 6,
        code: '#PMS-532',
        module: 'User | Report',
        title: 'User | Report | Progress Compare',
        description: 'Render interactive comparison charts comparing weekly member work hours and sprint deliverables.',
        status: TaskStatusEnum.IN_PROGRESS,
        priority: TaskPriorityEnum.MEDIUM,
        progress: 55,
        comments_count: 0,
        attachments_count: 1,
        due_date: new Date(Date.now() + 86400000 * 4).toISOString(),
        project_id: 'proj-003',
        project_name: 'Analytics & Reporting',
        reporter: { id: 1, name: 'ឡេង សុខឆាយ', avatar: null, role: 'អ្នករាយការណ៍ (Reporter)' },
        assignee: { id: 3, name: 'ស៊ន់ ​លាង', avatar: null, role: 'អ្នកអភិវឌ្ឍន៍ Backend ជាន់ខ្ពស់' },
        assignees: [
            { id: 3, name: 'ស៊ន់ ​លាង', avatar: null, role: 'អ្នកអភិវឌ្ឍន៍ Backend ជាន់ខ្ពស់' }
        ],
        created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 7,
        code: '#PMS-531',
        module: 'User | Report',
        title: 'User | Report | Progress',
        description: 'Real-time sync of task milestone updates and aggregated department productivity scorecards.',
        status: TaskStatusEnum.CONFIRMED,
        priority: TaskPriorityEnum.MEDIUM,
        progress: 88,
        comments_count: 19,
        attachments_count: 1,
        due_date: new Date(Date.now() + 86400000 * 2).toISOString(),
        project_id: 'proj-003',
        project_name: 'Analytics & Reporting',
        reporter: { id: 1, name: 'ឡេង សុខឆាយ', avatar: null, role: 'អ្នករាយការណ៍ (Reporter)' },
        assignee: { id: 2, name: 'ចេង ច័ន្ទបញ្ញា', avatar: '/images/placeholder/avatar.jpg', role: 'ប្រធានផ្នែក Frontend Lead' },
        assignees: [
            { id: 2, name: 'ចេង ច័ន្ទបញ្ញា', avatar: '/images/placeholder/avatar.jpg', role: 'ប្រធានផ្នែក Frontend Lead' }
        ],
        created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 8,
        code: '#PMS-513',
        module: 'Profile | Switch Org',
        title: 'Profile | Switch Org | Exit Org',
        description: 'Provide safe confirmation step and revoke tenant session when member switches workspace.',
        status: TaskStatusEnum.UNCONFIRMED,
        priority: TaskPriorityEnum.LOW,
        progress: 0,
        comments_count: 10,
        attachments_count: 0,
        due_date: new Date(Date.now() + 86400000 * 8).toISOString(),
        project_id: 'proj-001',
        project_name: 'Core System Structure',
        reporter: { id: 1, name: 'ឡេង សុខឆាយ', avatar: null, role: 'អ្នករាយការណ៍ (Reporter)' },
        assignee: { id: 2, name: 'ចេង ច័ន្ទបញ្ញា', avatar: '/images/placeholder/avatar.jpg', role: 'ប្រធានផ្នែក Frontend Lead' },
        assignees: [
            { id: 2, name: 'ចេង ច័ន្ទបញ្ញា', avatar: '/images/placeholder/avatar.jpg', role: 'ប្រធានផ្នែក Frontend Lead' }
        ],
        created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
        updated_at: new Date().toISOString(),
    },
];

@Injectable()
export class TaskService {
    private tasks: TaskItem[] = [...INITIAL_TASKS];
    private readonly storeFilePath = path.join(process.cwd(), 'storage', 'tasks_data_store.json');

    constructor(
        @InjectRepository(User)
        private readonly _userRepo: Repository<User>,
    ) {
        this.loadFromDisk();
    }

    private loadFromDisk(): void {
        try {
            if (fs.existsSync(this.storeFilePath)) {
                const raw = fs.readFileSync(this.storeFilePath, 'utf8');
                const data = JSON.parse(raw);
                if (data && Array.isArray(data.tasks) && data.tasks.length > 0) {
                    this.tasks = data.tasks;
                }
                if (data && data.comments && typeof data.comments === 'object') {
                    for (const [k, v] of Object.entries(data.comments)) {
                        const numKey = Number(k);
                        if (!isNaN(numKey) && Array.isArray(v)) {
                            this.taskComments.set(numKey, v as any[]);
                        }
                    }
                }
            }
        } catch (e) {
            console.error('Failed to load tasks from disk store:', e);
        }
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

    getRawTasks(): TaskItem[] {
        return this.tasks;
    }

    async getMembers(user: UserPayload) {
        let dbUsers: User[] = [];
        try {
            dbUsers = await this._userRepo.find({
                relations: ['user_roles', 'user_roles.role', 'avatar_file'],
                order: { id: 'ASC' },
                take: 100,
            });
        } catch (e) {
            console.error('Error fetching users from DB:', e);
        }

        const colors = [
            'bg-blue-600',
            'bg-emerald-600',
            'bg-indigo-600',
            'bg-amber-600',
            'bg-purple-600',
            'bg-rose-600',
            'bg-cyan-600',
            'bg-teal-600',
        ];

        const mapped = dbUsers.map((u, idx) => {
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

            return {
                id: u.id,
                name: u.name_kh || u.name_en || `User #${u.id}`,
                name_kh: u.name_kh,
                name_en: u.name_en,
                email: u.email || '',
                role: roleName,
                avatar: avatarUrl,
                colorClass: colors[idx % colors.length],
            };
        });

        return {
            status_code: 200,
            message: 'Task team members retrieved successfully from DB',
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
        const userNameEn = (user?.name_en || 'Cheng Chanpanha').toLowerCase().trim();
        const userNameKh = (user?.name_kh || 'ចេង ច័ន្ទបញ្ញា').toLowerCase().trim();
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
        // Filter tasks that belong to the current user (fallback to all tasks if no specific match)
        const matchedTasks = this.tasks.filter((t) => this.isTaskBelongToUser(t, user));
        const userTasks = matchedTasks.length > 0 ? matchedTasks : this.tasks;
        let list = [...userTasks];

        if (query.search && query.search !== 'undefined' && query.search !== 'null' && query.search.trim()) {
            const s = query.search.trim().toLowerCase();
            list = list.filter(
                (t) =>
                    t.title.toLowerCase().includes(s) ||
                    t.description.toLowerCase().includes(s),
            );
        }

        if (query.status && query.status !== 'all' && query.status !== 'undefined' && query.status !== 'null') {
            list = list.filter((t) => t.status === query.status);
        }

        if (query.priority && query.priority !== 'all' && query.priority !== 'undefined' && query.priority !== 'null') {
            list = list.filter((t) => t.priority === query.priority);
        }

        if (query.project_id && query.project_id !== 'undefined' && query.project_id !== 'null') {
            list = list.filter((t) => t.project_id === query.project_id);
        }

        const limit = query.limit ? parseInt(query.limit, 10) : 20;
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
                    all: userTasks.length,
                    new: userTasks.filter((t) => t.status === TaskStatusEnum.NEW || (t.status as any) === 'pending').length,
                    confirmed: userTasks.filter((t) => t.status === TaskStatusEnum.CONFIRMED).length,
                    unconfirmed: userTasks.filter((t) => t.status === TaskStatusEnum.UNCONFIRMED || (t.status as any) === 'todo').length,
                    in_progress: userTasks.filter((t) => t.status === TaskStatusEnum.IN_PROGRESS).length,
                    in_review: userTasks.filter((t) => t.status === TaskStatusEnum.IN_REVIEW || (t.status as any) === 'review').length,
                    reopened: userTasks.filter((t) => t.status === TaskStatusEnum.REOPENED).length,
                    done: userTasks.filter((t) => t.status === TaskStatusEnum.DONE || (t.status as any) === 'completed').length,
                },
            },
        };
    }

    async getTaskById(user: UserPayload, id: number) {
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
        const newTask: TaskItem = {
            id: Date.now(),
            code: `#PMS-${Math.floor(100 + Math.random() * 900)}`,
            title: dto.title,
            description: dto.description || '',
            module: 'Core System',
            status: dto.status || TaskStatusEnum.TODO,
            priority: dto.priority || TaskPriorityEnum.MEDIUM,
            progress: 0,
            comments_count: 0,
            attachments_count: 0,
            due_date: dto.due_date || null,
            project_id: dto.project_id || 'proj-001',
            project_name: 'Core System Structure',
            reporter: {
                id: user.id,
                name: user.name_en || user.name_kh || 'Ratha Vuth',
                avatar: (user.avatar as any)?.uri || null,
                role: 'Reporter',
            },
            assignee: {
                id: 1,
                name: 'Cheng Chanpanha',
                avatar: '/images/placeholder/avatar.jpg',
                role: 'Assignee',
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        this.tasks.unshift(newTask);
        this.saveToDisk();

        return {
            status_code: 201,
            message: 'Task created successfully',
            data: newTask,
        };
    }

    private getStatusLabel(status?: string): string {
        switch (status) {
            case 'new': return 'ថ្មី';
            case 'confirmed': return 'បញ្ជាក់';
            case 'unconfirmed': return 'មិនបញ្ជាក់';
            case 'in_progress': return 'កំពុងធ្វើ';
            case 'in_review': return 'ស្នើពិនិត្យ';
            case 'reopened': return 'បើកឡើងវិញ';
            case 'done': return 'បញ្ចប់';
            default: return status || '';
        }
    }

    private getPriorityLabel(priority?: string): string {
        switch (priority) {
            case 'urgent': return 'បន្ទាន់';
            case 'high': return 'ខ្ពស់';
            case 'medium': return 'មធ្យម';
            case 'low': return 'ទាប';
            default: return priority || '';
        }
    }

    async updateTask(user: UserPayload, id: number, dto: UpdateTaskDto) {
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
            priority: dto.priority ?? current.priority,
            progress: dto.progress !== undefined ? dto.progress : (dto.status === TaskStatusEnum.DONE ? 100 : current.progress),
            due_date: dto.due_date !== undefined ? dto.due_date : current.due_date,
            updated_at: new Date().toISOString(),
        };

        // Record action history in task comments
        let comments = this.taskComments.get(id);
        if (!comments || comments.length === 0) {
            comments = [
                {
                    id: 1,
                    sender_id: 0,
                    sender_name: 'ប្រព័ន្ធ (System)',
                    sender_avatar: null,
                    text: `ភារកិច្ច ${current.code || ('#PMS-' + current.id)} ត្រូវបានបង្កើត និងចាត់តាំងទៅកាន់ ${current.assignee?.name || 'Cheng Chanpanha'}`,
                    time: '8:30 AM',
                    is_self: false,
                    is_system: true,
                    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
                }
            ];
        }

        const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

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

        this.taskComments.set(id, comments);
        updated.comments_count = comments.length;

        this.tasks[index] = updated;
        this.saveToDisk();

        return {
            status_code: 200,
            message: 'Task updated successfully',
            data: updated,
        };
    }

    async deleteTask(user: UserPayload, id: number) {
        const index = this.tasks.findIndex((t) => t.id === id);
        if (index === -1) {
            throw new NotFoundException(`Task #${id} not found`);
        }

        this.tasks.splice(index, 1);
        this.saveToDisk();

        return {
            status_code: 200,
            message: 'Task deleted successfully',
        };
    }

    // =========================================================================
    // TASK CHAT ROOM & COMMENTS
    // =========================================================================
    private taskComments: Map<number, Array<{
        id: number;
        sender_id: number;
        sender_name: string;
        sender_avatar: string | null;
        text: string;
        time: string;
        is_self: boolean;
        is_system?: boolean;
        attachments?: Array<{ name: string; size: string; url?: string }>;
        created_at: string;
    }>> = new Map();

    async getTaskComments(user: UserPayload, taskId: number) {
        const task = this.tasks.find((t) => t.id === taskId);
        if (!task) {
            throw new NotFoundException(`Task #${taskId} not found`);
        }

        let comments = this.taskComments.get(taskId);
        if (!comments || comments.length === 0) {
            const reporterName = task.reporter?.name || 'ឡេង សុខឆាយ';
            const reporterAvatar = task.reporter?.avatar || '/images/placeholder/avatar.jpg';
            const assigneeName = task.assignee?.name || 'ចេង ច័ន្ទបញ្ញា';
            const assigneeAvatar = task.assignee?.avatar || '/images/placeholder/avatar.jpg';

            comments = [
                {
                    id: 1,
                    sender_id: 0,
                    sender_name: 'ប្រព័ន្ធ (System)',
                    sender_avatar: null,
                    text: `ភារកិច្ច ${task.code || ('#PMS-' + task.id)} ត្រូវបានបង្កើតដោយ ${reporterName} និងចាត់តាំងទៅកាន់ ${assigneeName}`,
                    time: '8:30 AM',
                    is_self: false,
                    is_system: true,
                    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
                },
                {
                    id: 2,
                    sender_id: 999,
                    sender_name: reporterName,
                    sender_avatar: reporterAvatar,
                    text: `សួស្តី @${assigneeName}! ខ្ញុំបានចាត់តាំងភារកិច្ច "${task.title}" នេះជូនអ្នក។ សូមជួយពិនិត្យមើល និងអនុវត្តតាមលក្ខខណ្ឌការងារ។`,
                    time: '8:45 AM',
                    is_self: false,
                    created_at: new Date(Date.now() - 3600000 * 3.5).toISOString(),
                },
            ];
            this.taskComments.set(taskId, comments);
        }

        const userNameEn = (user?.name_en || 'Cheng Chanpanha').toLowerCase().trim();
        const userNameKh = (user?.name_kh || 'ចេង ច័ន្ទបញ្ញា').toLowerCase().trim();
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
                        (senderName.includes('ចេង ច័ន្ទបញ្ញា') || senderName.includes('cheng chanpanha')) ||
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
        const task = this.tasks.find((t) => t.id === taskId);
        if (!task) {
            throw new NotFoundException(`Task #${taskId} not found`);
        }

        let comments = this.taskComments.get(taskId) || [];
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
        this.saveToDisk();

        return {
            status_code: 201,
            message: 'Chat comment added successfully',
            data: newComment,
        };
    }
}
