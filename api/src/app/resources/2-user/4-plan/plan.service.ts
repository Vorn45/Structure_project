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
    async getPlans(user: UserPayload, query: QueryPlanDto) {
        let list = [...PROJECTS];

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
        const plan = PROJECTS.find((p) => p.id === id || p.code === id);
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
}
