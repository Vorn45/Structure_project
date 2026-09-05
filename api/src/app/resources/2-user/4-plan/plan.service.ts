// ===========================================================================>> Core Library
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// ===========================================================================>> Custom Library
import { UserPayload } from 'src/app/interface/jwt.interface';
import { PlanStore } from 'src/app/model/user/plan-store.entity';
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
    private isDbLoaded = false;

    constructor(
        @InjectRepository(PlanStore)
        private readonly _planStoreRepo: Repository<PlanStore>,
    ) {
        this.initDbStore();
    }

    private async ensureTableExists(): Promise<void> {
        try {
            await this._planStoreRepo.query(`
                CREATE SCHEMA IF NOT EXISTS "user";
                CREATE TABLE IF NOT EXISTS "user"."plan_store" (
                    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    "key" VARCHAR(255) NOT NULL DEFAULT 'default_plans_store',
                    "plans" JSONB NULL DEFAULT '[]'::jsonb,
                    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
                );
                CREATE UNIQUE INDEX IF NOT EXISTS "IDX_plan_store_key" ON "user"."plan_store" ("key");
            `);
        } catch (e: any) {
            // Already exists or created
        }
    }

    private async initDbStore(): Promise<void> {
        await this.ensureTableExists();
        try {
            const dbStore = await this._planStoreRepo.findOne({ where: { key: 'default_plans_store' } });
            if (dbStore && Array.isArray(dbStore.plans) && dbStore.plans.length > 0) {
                this.projects = dbStore.plans;
            } else {
                await this.saveToDb();
            }
            this.isDbLoaded = true;
        } catch (err) {
            console.warn('Could not load plan store from DB, using default projects:', err);
        }
    }

    private async ensureLoaded(): Promise<void> {
        if (!this.isDbLoaded) {
            await this.initDbStore();
        }
    }

    private async saveToDb(): Promise<void> {
        try {
            let dbStore = await this._planStoreRepo.findOne({ where: { key: 'default_plans_store' } });
            if (!dbStore) {
                dbStore = this._planStoreRepo.create({
                    key: 'default_plans_store',
                    plans: this.projects,
                });
            } else {
                dbStore.plans = this.projects;
            }
            await this._planStoreRepo.save(dbStore);
        } catch (err) {
            console.error('Failed to save plan store to DB:', err);
        }
    }

    getRawProjects(): ProjectPlanItem[] {
        return this.projects;
    }

    async getPlans(user: UserPayload, query: QueryPlanDto) {
        await this.ensureLoaded();
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
        await this.ensureLoaded();
        const plan = this.projects.find((p) => p.id === id || p.code === id);
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
        await this.ensureLoaded();
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
        await this.ensureLoaded();
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
        await this.saveToDb();

        return {
            status_code: 201,
            message: 'Project plan created successfully',
            data: newPlan,
        };
    }

    async updatePlan(user: UserPayload, id: string, dto: any) {
        await this.ensureLoaded();
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
        await this.saveToDb();

        return {
            status_code: 200,
            message: 'Project plan updated successfully',
            data: updated,
        };
    }

    async deletePlan(user: UserPayload, id: string) {
        await this.ensureLoaded();
        const index = this.projects.findIndex((p) => p.id === id || p.code === id);
        if (index === -1) {
            throw new NotFoundException(`Plan / Project "${id}" not found`);
        }

        this.projects.splice(index, 1);
        await this.saveToDb();

        return {
            status_code: 200,
            message: 'Project plan deleted successfully',
        };
    }
}
