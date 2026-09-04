// ===========================================================================>> Core Library
import { Injectable, NotFoundException } from '@nestjs/common';

// ===========================================================================>> Custom Library
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
        reporter: { id: 999, name: 'Ratha Vuth', avatar: null, role: 'Reporter' },
        assignee: { id: 1, name: 'Cheng Chanpanha', avatar: '/images/placeholder/avatar.jpg', role: 'Assignee' },
        assignees: [
            { id: 1, name: 'Cheng Chanpanha', avatar: '/images/placeholder/avatar.jpg', role: 'Frontend Lead' }
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
        reporter: { id: 999, name: 'Ratha Vuth', avatar: null, role: 'Reporter' },
        assignee: { id: 2, name: 'Sokha Meng', avatar: null, role: 'Backend Lead' },
        assignees: [
            { id: 2, name: 'Sokha Meng', avatar: null, role: 'Backend Lead' }
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
        reporter: { id: 999, name: 'Ratha Vuth', avatar: null, role: 'Reporter' },
        assignee: { id: 1, name: 'Cheng Chanpanha', avatar: '/images/placeholder/avatar.jpg' },
        assignees: [
            { id: 1, name: 'Cheng Chanpanha', avatar: '/images/placeholder/avatar.jpg', role: 'Frontend Lead' }
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
        reporter: { id: 1, name: 'Cheng Chanpanha', avatar: '/images/placeholder/avatar.jpg', role: 'Reporter' },
        assignee: { id: 3, name: 'Ratha Vuth', avatar: null, role: 'UI/UX Designer' },
        assignees: [
            { id: 3, name: 'Ratha Vuth', avatar: null, role: 'UI/UX Designer' }
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
        reporter: { id: 999, name: 'Ratha Vuth', avatar: null, role: 'Reporter' },
        assignee: { id: 1, name: 'Cheng Chanpanha', avatar: '/images/placeholder/avatar.jpg', role: 'Assignee' },
        assignees: [
            { id: 1, name: 'Cheng Chanpanha', avatar: '/images/placeholder/avatar.jpg', role: 'Frontend Lead' }
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
        reporter: { id: 999, name: 'Ratha Vuth', avatar: null, role: 'Reporter' },
        assignee: { id: 2, name: 'Sokha Meng', avatar: null, role: 'Backend Lead' },
        assignees: [
            { id: 2, name: 'Sokha Meng', avatar: null, role: 'Backend Lead' }
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
        reporter: { id: 999, name: 'Ratha Vuth', avatar: null, role: 'Reporter' },
        assignee: { id: 1, name: 'Cheng Chanpanha', avatar: '/images/placeholder/avatar.jpg' },
        assignees: [
            { id: 1, name: 'Cheng Chanpanha', avatar: '/images/placeholder/avatar.jpg', role: 'Frontend Lead' }
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
        reporter: { id: 999, name: 'Ratha Vuth', avatar: null, role: 'Reporter' },
        assignee: { id: 1, name: 'Cheng Chanpanha', avatar: '/images/placeholder/avatar.jpg' },
        assignees: [
            { id: 1, name: 'Cheng Chanpanha', avatar: '/images/placeholder/avatar.jpg', role: 'Frontend Lead' }
        ],
        created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
        updated_at: new Date().toISOString(),
    },
];

@Injectable()
export class TaskService {
    private tasks: TaskItem[] = [...INITIAL_TASKS];

    getRawTasks(): TaskItem[] {
        return this.tasks;
    }

    /**
     * Check whether a task belongs to the user:
     * Either the user is assigned to the task (primary assignee or in assignees list)
     * OR the user is the reporter of the task.
     */
    private isTaskBelongToUser(task: TaskItem, user?: UserPayload): boolean {
        const userId = user?.id ?? 1;
        const userNameEn = (user?.name_en || 'Cheng Chanpanha').toLowerCase().trim();
        const userNameKh = (user?.name_kh || '').toLowerCase().trim();
        const userEmail = (user?.email || '').toLowerCase().trim();

        // 1. Check if user is the Reporter
        if (task.reporter) {
            if (task.reporter.id && task.reporter.id === userId) return true;
            const repName = task.reporter.name?.toLowerCase().trim();
            if (repName && (repName === userNameEn || (userNameKh && repName === userNameKh))) return true;
        }

        // 2. Check if user is the Primary Assignee
        if (task.assignee) {
            if (task.assignee.id && task.assignee.id === userId) return true;
            const assName = task.assignee.name?.toLowerCase().trim();
            if (assName && (assName === userNameEn || (userNameKh && assName === userNameKh))) return true;
            if (userEmail && task.assignee.email && task.assignee.email.toLowerCase().trim() === userEmail) return true;
        }

        // 3. Check if user is in the Assignees list
        if (task.assignees && Array.isArray(task.assignees)) {
            for (const ass of task.assignees) {
                if (ass.id && ass.id === userId) return true;
                const assName = ass.name?.toLowerCase().trim();
                if (assName && (assName === userNameEn || (userNameKh && assName === userNameKh))) return true;
                if (userEmail && ass.email && ass.email.toLowerCase().trim() === userEmail) return true;
            }
        }

        return false;
    }

    async getTasks(user: UserPayload, query: QueryTasksDto) {
        // Filter tasks that belong to the current user (only own assigned or reported tasks)
        const userTasks = this.tasks.filter((t) => this.isTaskBelongToUser(t, user));
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
            const reporterName = task.reporter?.name || 'Ratha Vuth';
            const reporterAvatar = task.reporter?.avatar || '/images/placeholder/avatar.jpg';
            const assigneeName = task.assignee?.name || 'Cheng Chanpanha';
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

        return {
            status_code: 200,
            message: 'Task chat comments retrieved successfully',
            data: {
                task_id: taskId,
                task_title: task.title,
                task_status: task.status,
                comments: comments.map((c) => ({
                    ...c,
                    is_self: !c.is_system && c.sender_id !== 0 && c.sender_id !== 999 && c.sender_id === user.id,
                })),
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
            sender_name: user.name_en || user.name_kh || 'User',
            sender_avatar: (user.avatar as any)?.uri || '/images/placeholder/avatar.jpg',
            text: text.trim(),
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

        return {
            status_code: 201,
            message: 'Chat comment added successfully',
            data: newComment,
        };
    }
}
