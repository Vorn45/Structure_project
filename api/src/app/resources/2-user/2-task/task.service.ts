// ===========================================================================>> Core Library
import { Injectable, NotFoundException } from '@nestjs/common';

// ===========================================================================>> Custom Library
import { UserPayload } from 'src/app/interface/jwt.interface';
import { CreateTaskDto, QueryTasksDto, TaskPriorityEnum, TaskStatusEnum, UpdateTaskDto } from './task.dto';

// In-memory / mock store to serve user task operations
export interface TaskItem {
    id: number;
    title: string;
    description: string;
    status: TaskStatusEnum;
    priority: TaskPriorityEnum;
    progress: number;
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
        title: 'Design high-fidelity UI components for User Module',
        description: 'Create modular Angular components matching the design system and Tailwind tokens.',
        status: TaskStatusEnum.IN_PROGRESS,
        priority: TaskPriorityEnum.HIGH,
        progress: 65,
        due_date: new Date(Date.now() + 86400000 * 3).toISOString(),
        project_id: 'proj-001',
        project_name: 'PMS Architecture',
        assignee: { id: 1, name: 'Current User', avatar: null },
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 2,
        title: 'Implement Refresh Token rotation & Cookie security',
        description: 'Enhance token rotation security with token family invalidation on reuse.',
        status: TaskStatusEnum.DONE,
        priority: TaskPriorityEnum.URGENT,
        progress: 100,
        due_date: new Date(Date.now() - 86400000).toISOString(),
        project_id: 'proj-001',
        project_name: 'PMS Architecture',
        assignee: { id: 1, name: 'Current User', avatar: null },
        created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 3,
        title: 'Set up Telegram 2FA Bot Webhook Notifications',
        description: 'Ensure Telegram bot properly notifies users upon task assignments and status updates.',
        status: TaskStatusEnum.TODO,
        priority: TaskPriorityEnum.MEDIUM,
        progress: 0,
        due_date: new Date(Date.now() + 86400000 * 5).toISOString(),
        project_id: 'proj-002',
        project_name: 'Notification Service',
        assignee: { id: 1, name: 'Current User', avatar: null },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 4,
        title: 'Configure automated CI/CD pipeline and test suites',
        description: 'Configure GitHub Actions pipeline for linting, testing, and deployment.',
        status: TaskStatusEnum.IN_REVIEW,
        priority: TaskPriorityEnum.MEDIUM,
        progress: 90,
        due_date: new Date(Date.now() + 86400000 * 1).toISOString(),
        project_id: 'proj-001',
        project_name: 'PMS Architecture',
        assignee: { id: 1, name: 'Current User', avatar: null },
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date().toISOString(),
    },
];

@Injectable()
export class TaskService {
    private tasks: TaskItem[] = [...INITIAL_TASKS];

    async getTasks(user: UserPayload, query: QueryTasksDto) {
        let list = [...this.tasks];

        if (query.search) {
            const s = query.search.toLowerCase();
            list = list.filter(
                (t) =>
                    t.title.toLowerCase().includes(s) ||
                    t.description.toLowerCase().includes(s),
            );
        }

        if (query.status && query.status !== 'all') {
            list = list.filter((t) => t.status === query.status);
        }

        if (query.priority && query.priority !== 'all') {
            list = list.filter((t) => t.priority === query.priority);
        }

        if (query.project_id) {
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
                    todo: this.tasks.filter((t) => t.status === TaskStatusEnum.TODO).length,
                    in_progress: this.tasks.filter((t) => t.status === TaskStatusEnum.IN_PROGRESS).length,
                    in_review: this.tasks.filter((t) => t.status === TaskStatusEnum.IN_REVIEW).length,
                    done: this.tasks.filter((t) => t.status === TaskStatusEnum.DONE).length,
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
            title: dto.title,
            description: dto.description || '',
            status: dto.status || TaskStatusEnum.TODO,
            priority: dto.priority || TaskPriorityEnum.MEDIUM,
            progress: 0,
            due_date: dto.due_date || null,
            project_id: dto.project_id || 'proj-001',
            project_name: 'General Project',
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
