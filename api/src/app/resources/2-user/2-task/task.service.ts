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
    assignee: {
        id: number;
        name: string;
        avatar?: string | null;
    };
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
        assignee: { id: 1, name: 'Cheng Chanpanha', avatar: '/images/placeholder/avatar.jpg' },
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
        assignee: { id: 2, name: 'Sokha Meng', avatar: null },
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
        assignee: { id: 1, name: 'Cheng Chanpanha', avatar: '/images/placeholder/avatar.jpg' },
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
        assignee: { id: 3, name: 'Ratha Vuth', avatar: null },
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
        assignee: { id: 1, name: 'Cheng Chanpanha', avatar: '/images/placeholder/avatar.jpg' },
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
        assignee: { id: 2, name: 'Sokha Meng', avatar: null },
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
        assignee: { id: 1, name: 'Cheng Chanpanha', avatar: '/images/placeholder/avatar.jpg' },
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
        assignee: { id: 1, name: 'Cheng Chanpanha', avatar: '/images/placeholder/avatar.jpg' },
        created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
        updated_at: new Date().toISOString(),
    },
];

@Injectable()
export class TaskService {
    private tasks: TaskItem[] = [...INITIAL_TASKS];

    async getTasks(user: UserPayload, query: QueryTasksDto) {
        let list = [...this.tasks];

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
                    all: this.tasks.length,
                    new: this.tasks.filter((t) => t.status === TaskStatusEnum.NEW || (t.status as any) === 'pending').length,
                    confirmed: this.tasks.filter((t) => t.status === TaskStatusEnum.CONFIRMED).length,
                    unconfirmed: this.tasks.filter((t) => t.status === TaskStatusEnum.UNCONFIRMED || (t.status as any) === 'todo').length,
                    in_progress: this.tasks.filter((t) => t.status === TaskStatusEnum.IN_PROGRESS).length,
                    in_review: this.tasks.filter((t) => t.status === TaskStatusEnum.IN_REVIEW || (t.status as any) === 'review').length,
                    reopened: this.tasks.filter((t) => t.status === TaskStatusEnum.REOPENED).length,
                    done: this.tasks.filter((t) => t.status === TaskStatusEnum.DONE || (t.status as any) === 'completed').length,
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
            assignee: {
                id: user.id,
                name: user.name_en || user.name_kh || 'User',
                avatar: null,
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
}
