// ===========================================================================>> Core Library
import { Injectable, NotFoundException } from '@nestjs/common';

// ===========================================================================>> Custom Library
import { UserPayload } from 'src/app/interface/jwt.interface';
import { QueryPlanDto } from './plan.dto';

export interface ProjectPlanItem {
    id: string;
    code: string;
    name: string;
    description: string;
    status: 'active' | 'completed' | 'on_hold' | 'planning';
    progress: number;
    start_date: string;
    end_date: string;
    total_tasks: number;
    completed_tasks: number;
    members: Array<{
        id: number;
        name: string;
        role: string;
        avatar?: string | null;
    }>;
}

const PROJECTS: ProjectPlanItem[] = [
    {
        id: 'proj-001',
        code: 'PMS-V2',
        name: 'PMS Upgrade V2',
        description: 'Comprehensive upgrade of the Project Management System architecture, security, and UI.',
        status: 'active',
        progress: 58,
        start_date: new Date(Date.now() - 86400000 * 30).toISOString(),
        end_date: new Date(Date.now() + 86400000 * 60).toISOString(),
        total_tasks: 24,
        completed_tasks: 14,
        members: [
            { id: 1, name: 'Project Lead', role: 'Leader', avatar: null },
            { id: 2, name: 'Frontend Dev', role: 'Member', avatar: null },
            { id: 3, name: 'Backend Dev', role: 'Member', avatar: null },
        ],
    },
    {
        id: 'proj-002',
        code: 'DS-2026',
        name: 'Design System & UI Library',
        description: 'Modernizing UI components, dark mode aesthetics, and micro-interactions.',
        status: 'active',
        progress: 75,
        start_date: new Date(Date.now() - 86400000 * 15).toISOString(),
        end_date: new Date(Date.now() + 86400000 * 20).toISOString(),
        total_tasks: 12,
        completed_tasks: 9,
        members: [
            { id: 1, name: 'UI/UX Designer', role: 'Leader', avatar: null },
            { id: 2, name: 'Frontend Dev', role: 'Member', avatar: null },
        ],
    },
];

@Injectable()
export class PlanService {
    private projects: ProjectPlanItem[] = [...PROJECTS];

    getRawProjects(): ProjectPlanItem[] {
        return this.projects;
    }

    async getPlans(user: UserPayload, query: QueryPlanDto) {
        let list = [...this.projects];

        if (query.search) {
            const s = query.search.toLowerCase();
            list = list.filter(
                (p) =>
                    p.name.toLowerCase().includes(s) ||
                    p.code.toLowerCase().includes(s) ||
                    p.description.toLowerCase().includes(s),
            );
        }

        if (query.status && query.status !== 'all') {
            list = list.filter((p) => p.status === query.status);
        }

        const limit = query.limit ? parseInt(query.limit, 10) : 20;
        const offset = query.offset ? parseInt(query.offset, 10) : 0;
        const paginated = list.slice(offset, offset + limit);

        return {
            status_code: 200,
            message: 'Plans retrieved successfully',
            data: {
                results: paginated,
                total: list.length,
                limit,
                offset,
            },
        };
    }

    async getPlanById(user: UserPayload, id: string) {
        const plan = PROJECTS.find((p) => p.id === id || p.code === id);
        if (!plan) {
            throw new NotFoundException(`Plan / Project "${id}" not found`);
        }

        return {
            status_code: 200,
            message: 'Plan retrieved successfully',
            data: plan,
        };
    }

    async getTeamMembers(user: UserPayload, id: string) {
        const plan = this.projects.find((p) => p.id === id || p.code === id);
        if (!plan) {
            throw new NotFoundException(`Plan / Project "${id}" not found`);
        }

        return {
            status_code: 200,
            message: 'Team members retrieved successfully',
            data: {
                project_id: plan.id,
                project_name: plan.name,
                members: plan.members,
            },
        };
    }

    async createPlan(user: UserPayload, dto: any) {
        const newPlan: ProjectPlanItem = {
            id: `proj-${Date.now().toString().slice(-4)}`,
            code: dto.code || `PMS-${Math.floor(100 + Math.random() * 900)}`,
            name: dto.name,
            description: dto.description || '',
            status: dto.status || 'active',
            progress: dto.progress || 0,
            start_date: dto.start_date || new Date().toISOString(),
            end_date: dto.end_date || new Date(Date.now() + 86400000 * 30).toISOString(),
            total_tasks: 0,
            completed_tasks: 0,
            members: dto.members || [
                { id: user.id, name: user.name_en || user.name_kh || 'Project Lead', role: 'Leader', avatar: null },
            ],
        };

        this.projects.unshift(newPlan);

        return {
            status_code: 201,
            message: 'Project plan created successfully',
            data: newPlan,
        };
    }

    async updatePlan(user: UserPayload, id: string, dto: any) {
        const index = this.projects.findIndex((p) => p.id === id || p.code === id);
        if (index === -1) {
            throw new NotFoundException(`Plan / Project "${id}" not found`);
        }

        const current = this.projects[index];
        const updated: ProjectPlanItem = {
            ...current,
            name: dto.name ?? current.name,
            code: dto.code ?? current.code,
            description: dto.description ?? current.description,
            status: dto.status ?? current.status,
            progress: dto.progress !== undefined ? dto.progress : current.progress,
            start_date: dto.start_date ?? current.start_date,
            end_date: dto.end_date ?? current.end_date,
            members: dto.members ?? current.members,
        };

        this.projects[index] = updated;

        return {
            status_code: 200,
            message: 'Project plan updated successfully',
            data: updated,
        };
    }

    async deletePlan(user: UserPayload, id: string) {
        const index = this.projects.findIndex((p) => p.id === id || p.code === id);
        if (index === -1) {
            throw new NotFoundException(`Plan / Project "${id}" not found`);
        }

        this.projects.splice(index, 1);

        return {
            status_code: 200,
            message: 'Project plan deleted successfully',
        };
    }
}
