// ===========================================================================>> Core Library
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

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
        email?: string;
    }>;
    tasks?: any[];
    phases?: any[];
    meetings?: any[];
    agileTasks?: any[];
}

const PROJECTS: ProjectPlanItem[] = [
    {
        id: '1',
        code: 'PMS-V2',
        name: 'ប្រព័ន្ធគ្រប់គ្រងគម្រោងបច្ចេកវិទ្យា (PMS)',
        description: 'ប្រព័ន្ធគ្រប់គ្រងគម្រោងបច្ចេកវិទ្យា ការងារ ដំណាក់កាល និងកាលវិភាគការងាររបស់បុគ្គលិក។',
        status: 'active',
        progress: 85,
        start_date: new Date(Date.now() - 86400000 * 30).toISOString(),
        end_date: new Date(Date.now() + 86400000 * 45).toISOString(),
        total_tasks: 8,
        completed_tasks: 2,
        members: [
            { id: 1, name: 'ចេង ច័ន្ទបញ្ញា', role: 'Frontend Dev', avatar: null, email: 'Chanpanhacheng@gmail.com' },
            { id: 2, name: 'សុខ សុភា', role: 'Project Lead', avatar: null, email: 'sok.sopheak@gmail.com' },
            { id: 3, name: 'រ័ត្ន វិចិត្រ', role: 'DevOps', avatar: null, email: 'rath.vichet@gmail.com' },
        ],
    },
    {
        id: '2',
        code: 'WMS-HR',
        name: 'ប្រព័ន្ធគ្រប់គ្រងវត្តមាន និងបុគ្គលិក (WMS)',
        description: 'ប្រព័ន្ធតាមដានម៉ោងធ្វើការ ច្បាប់ឈប់សម្រាក និងការបើកប្រាក់បៀវត្ស។',
        status: 'active',
        progress: 60,
        start_date: new Date(Date.now() - 86400000 * 60).toISOString(),
        end_date: new Date(Date.now() + 86400000 * 30).toISOString(),
        total_tasks: 12,
        completed_tasks: 7,
        members: [
            { id: 1, name: 'ចេង ច័ន្ទបញ្ញា', role: 'Frontend Dev', avatar: null },
            { id: 4, name: 'លី ម៉េងហួរ', role: 'Backend Lead', avatar: null },
        ],
    },
    {
        id: '3',
        code: 'E-GOV',
        name: 'ប្រព័ន្ធច្រកចេញចូលតែមួយ (E-Gov Portal)',
        description: 'ច្រកផ្ដល់សេវាសាធារណៈឌីជីថលជូនប្រជាពលរដ្ឋ និងអង្គភាពពាក់ព័ន្ធ។',
        status: 'planning',
        progress: 25,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 86400000 * 90).toISOString(),
        total_tasks: 5,
        completed_tasks: 1,
        members: [
            { id: 1, name: 'ចេង ច័ន្ទបញ្ញា', role: 'Frontend Dev', avatar: null },
            { id: 2, name: 'សុខ សុភា', role: 'Project Lead', avatar: null },
        ],
    },
];

@Injectable()
export class PlanService {
    private projects: ProjectPlanItem[] = [...PROJECTS];
    private readonly storeFilePath = path.join(process.cwd(), 'storage', 'plans_data_store.json');
    private isDbLoaded = false;

    constructor(
        @InjectRepository(PlanStore)
        private readonly _planStoreRepo: Repository<PlanStore>,
    ) {
        this.loadFromDisk();
        this.initDbStore();
    }

    private loadFromDisk(): void {
        try {
            if (fs.existsSync(this.storeFilePath)) {
                const raw = fs.readFileSync(this.storeFilePath, 'utf8');
                const data = JSON.parse(raw);
                if (data && Array.isArray(data.plans) && data.plans.length > 0) {
                    this.projects = data.plans;
                }
            }
        } catch (e) {
            console.warn('Failed to load plans from disk:', e);
        }
    }

    private saveToDisk(): void {
        try {
            const dir = path.dirname(this.storeFilePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            const data = {
                plans: this.projects,
                updated_at: new Date().toISOString(),
            };
            fs.writeFileSync(this.storeFilePath, JSON.stringify(data, null, 2), 'utf8');
        } catch (e) {
            console.warn('Failed to save plans to disk:', e);
        }
    }

    private async ensureTableExists(): Promise<void> {
        try {
            await this._planStoreRepo.query(`
                CREATE EXTENSION IF NOT EXISTS "pgcrypto";
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
            console.warn('Could not load plan store from DB, using memory/disk store:', err);
        }
    }

    private async ensureLoaded(): Promise<void> {
        if (!this.isDbLoaded) {
            await this.initDbStore();
        }
    }

    private async saveStore(): Promise<void> {
        this.saveToDisk();
        await this.saveToDb();
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

        const limit = query.limit ? parseInt(query.limit, 10) : 50;
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
                members: plan.members || [],
            },
        };
    }

    async createPlan(user: UserPayload, dto: any) {
        await this.ensureLoaded();
        const newPlan: any = {
            ...dto,
            id: dto.id || `proj-${Date.now().toString().slice(-4)}`,
            code: dto.code || `PMS-${Math.floor(100 + Math.random() * 900)}`,
            name: dto.name,
            description: dto.description || '',
            status: dto.status || 'active',
            progress: dto.progress || 0,
            start_date: dto.start_date || new Date().toISOString(),
            end_date: dto.end_date || new Date(Date.now() + 86400000 * 30).toISOString(),
            total_tasks: dto.tasks?.length || dto.total_tasks || 0,
            completed_tasks: dto.tasks?.filter((t: any) => t.status === 'done' || t.status === 'completed')?.length || dto.completed_tasks || 0,
            members: dto.members || [
                { id: user?.id || 1, name: user?.name_en || user?.name_kh || 'Project Lead', role: 'Leader', avatar: null },
            ],
            tasks: dto.tasks || [],
            phases: dto.phases || [],
            meetings: dto.meetings || [],
            agileTasks: dto.agileTasks || [],
        };

        this.projects.unshift(newPlan);
        await this.saveStore();

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
        const updated: any = {
            ...current,
            ...dto,
            name: dto.name ?? current.name,
            code: dto.code ?? current.code,
            description: dto.description ?? current.description,
            status: dto.status ?? current.status,
            progress: dto.progress !== undefined ? dto.progress : current.progress,
            start_date: dto.start_date ?? current.start_date,
            end_date: dto.end_date ?? current.end_date,
            members: dto.members ?? current.members,
            tasks: dto.tasks ?? (current as any).tasks,
            phases: dto.phases ?? (current as any).phases,
            meetings: dto.meetings ?? (current as any).meetings,
            agileTasks: dto.agileTasks ?? (current as any).agileTasks,
        };

        this.projects[index] = updated;
        await this.saveStore();

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
        await this.saveStore();

        return {
            status_code: 200,
            message: 'Project plan deleted successfully',
        };
    }

    // =========================================================================
    // SUB-RESOURCE OPERATIONS
    // =========================================================================
    async getTasks(user: UserPayload, id: string) {
        await this.ensureLoaded();
        const plan = this.projects.find((p) => p.id === id || p.code === id);
        if (!plan) throw new NotFoundException(`Plan / Project "${id}" not found`);
        return {
            status_code: 200,
            data: plan.tasks || [],
        };
    }

    async createTask(user: UserPayload, id: string, dto: any) {
        await this.ensureLoaded();
        const plan = this.projects.find((p) => p.id === id || p.code === id);
        if (!plan) throw new NotFoundException(`Plan / Project "${id}" not found`);
        if (!plan.tasks) plan.tasks = [];

        const newTask = {
            id: dto.id || `tsk-${Date.now()}`,
            code: dto.code || `#${plan.code}-${plan.tasks.length + 101}`,
            title: dto.title,
            description: dto.description || dto.title,
            status: dto.status || 'new',
            priority: dto.priority || 'medium',
            due_date: dto.due_date,
            assignee: dto.assignee || { id: user?.id || 1, name: user?.name_en || 'Assignee', role: 'Member' },
            reporter: dto.reporter || { id: 1, name: 'Admin', role: 'Project Manager' },
            subtasks: dto.subtasks || [],
            links: dto.links || [],
            documents: dto.documents || [],
            created_at: new Date().toISOString(),
        };

        plan.tasks.unshift(newTask);
        plan.total_tasks = plan.tasks.length;
        await this.saveStore();

        return {
            status_code: 201,
            message: 'Task created successfully',
            data: newTask,
        };
    }

    async updateTask(user: UserPayload, id: string, taskId: string, dto: any) {
        await this.ensureLoaded();
        const plan = this.projects.find((p) => p.id === id || p.code === id);
        if (!plan) throw new NotFoundException(`Plan / Project "${id}" not found`);
        if (!plan.tasks) plan.tasks = [];

        const tIndex = plan.tasks.findIndex((t: any) => t.id === taskId || t.code === taskId);
        if (tIndex === -1) throw new NotFoundException(`Task "${taskId}" not found`);

        plan.tasks[tIndex] = {
            ...plan.tasks[tIndex],
            ...dto,
        };
        await this.saveStore();

        return {
            status_code: 200,
            message: 'Task updated successfully',
            data: plan.tasks[tIndex],
        };
    }

    async deleteTask(user: UserPayload, id: string, taskId: string) {
        await this.ensureLoaded();
        const plan = this.projects.find((p) => p.id === id || p.code === id);
        if (!plan) throw new NotFoundException(`Plan / Project "${id}" not found`);
        if (!plan.tasks) return { status_code: 200, message: 'Deleted' };

        plan.tasks = plan.tasks.filter((t: any) => t.id !== taskId && t.code !== taskId);
        plan.total_tasks = plan.tasks.length;
        await this.saveStore();

        return {
            status_code: 200,
            message: 'Task deleted successfully',
        };
    }

    async createPhase(user: UserPayload, id: string, dto: any) {
        await this.ensureLoaded();
        const plan = this.projects.find((p) => p.id === id || p.code === id);
        if (!plan) throw new NotFoundException(`Plan / Project "${id}" not found`);
        if (!plan.phases) plan.phases = [];

        const newPhase = {
            id: `ph-${Date.now()}`,
            title: dto.title,
            quarter: dto.quarter || 'ត្រីមាស',
            startDate: dto.startDate || '01/10/2026',
            endDate: dto.endDate || '31/12/2026',
            tasksCount: 0,
            status: dto.status || 'planned',
        };

        plan.phases.push(newPhase);
        await this.saveStore();

        return {
            status_code: 201,
            message: 'Phase created successfully',
            data: newPhase,
        };
    }

    async deletePhase(user: UserPayload, id: string, phaseId: string) {
        await this.ensureLoaded();
        const plan = this.projects.find((p) => p.id === id || p.code === id);
        if (!plan) throw new NotFoundException(`Plan / Project "${id}" not found`);
        if (!plan.phases) return { status_code: 200, message: 'Deleted' };

        plan.phases = plan.phases.filter((p: any) => p.id !== phaseId);
        await this.saveStore();

        return {
            status_code: 200,
            message: 'Phase deleted successfully',
        };
    }

    async createMeeting(user: UserPayload, id: string, dto: any) {
        await this.ensureLoaded();
        const plan = this.projects.find((p) => p.id === id || p.code === id);
        if (!plan) throw new NotFoundException(`Plan / Project "${id}" not found`);
        if (!plan.meetings) plan.meetings = [];

        const newMeeting = {
            id: `m-${Date.now()}`,
            title: dto.title,
            description: dto.description || '',
            date: dto.date || 'ថ្ងៃនេះ',
            time: dto.time || 'ម៉ោង ០២:០០ រសៀល',
            platform: dto.platform || 'Google Meet',
            link: dto.link || 'https://meet.google.com',
            status: dto.status || 'upcoming',
            attendees: dto.attendees || plan.members || [],
        };

        plan.meetings.unshift(newMeeting);
        await this.saveStore();

        return {
            status_code: 201,
            message: 'Meeting created successfully',
            data: newMeeting,
        };
    }

    async deleteMeeting(user: UserPayload, id: string, meetingId: string) {
        await this.ensureLoaded();
        const plan = this.projects.find((p) => p.id === id || p.code === id);
        if (!plan) throw new NotFoundException(`Plan / Project "${id}" not found`);
        if (!plan.meetings) return { status_code: 200, message: 'Deleted' };

        plan.meetings = plan.meetings.filter((m: any) => m.id !== meetingId);
        await this.saveStore();

        return {
            status_code: 200,
            message: 'Meeting deleted successfully',
        };
    }

    async createMember(user: UserPayload, id: string, dto: any) {
        await this.ensureLoaded();
        const plan = this.projects.find((p) => p.id === id || p.code === id);
        if (!plan) throw new NotFoundException(`Plan / Project "${id}" not found`);
        if (!plan.members) plan.members = [];

        const newMember = {
            id: Date.now(),
            name: dto.name,
            role: dto.role || 'Developer',
            email: dto.email,
            avatar: dto.avatar || null,
        };

        plan.members.push(newMember);
        await this.saveStore();

        return {
            status_code: 201,
            message: 'Member added successfully',
            data: newMember,
        };
    }

    async deleteMember(user: UserPayload, id: string, memberId: number) {
        await this.ensureLoaded();
        const plan = this.projects.find((p) => p.id === id || p.code === id);
        if (!plan) throw new NotFoundException(`Plan / Project "${id}" not found`);
        if (!plan.members) return { status_code: 200, message: 'Deleted' };

        plan.members = plan.members.filter((m: any) => m.id !== memberId && m.id !== Number(memberId));
        await this.saveStore();

        return {
            status_code: 200,
            message: 'Member removed successfully',
        };
    }

    async getAgileTasks(user: UserPayload, id: string) {
        await this.ensureLoaded();
        const plan = this.projects.find((p) => p.id === id || p.code === id);
        if (!plan) throw new NotFoundException(`Plan / Project "${id}" not found`);
        return {
            status_code: 200,
            data: plan.agileTasks || [],
        };
    }

    async createAgileTask(user: UserPayload, id: string, dto: any) {
        await this.ensureLoaded();
        const plan = this.projects.find((p) => p.id === id || p.code === id);
        if (!plan) throw new NotFoundException(`Plan / Project "${id}" not found`);
        if (!plan.agileTasks) plan.agileTasks = [];

        const newTask = {
            id: dto.id || `at-${Date.now()}`,
            name: dto.name,
            segments: dto.segments || [{ iteration: 1, startWeek: 14, durationWeeks: 2 }],
        };

        plan.agileTasks.unshift(newTask);
        await this.saveStore();

        return {
            status_code: 201,
            message: 'Agile task added successfully',
            data: newTask,
        };
    }

    async deleteAgileTask(user: UserPayload, id: string, taskId: string) {
        await this.ensureLoaded();
        const plan = this.projects.find((p) => p.id === id || p.code === id);
        if (!plan) throw new NotFoundException(`Plan / Project "${id}" not found`);
        if (!plan.agileTasks) return { status_code: 200, message: 'Deleted' };

        plan.agileTasks = plan.agileTasks.filter((t: any) => t.id !== taskId);
        await this.saveStore();

        return {
            status_code: 200,
            message: 'Agile task deleted successfully',
        };
    }
}
