// ===========================================================================>> Core Library
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

// ===========================================================================>> Custom Library
import { RoleEnum } from 'src/app/enum/role.enum';
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
    logo?: string | null;
    image?: string | null;
    members: Array<{
        id: number;
        name: string;
        role: string;
        avatar?: string | null;
        email?: string;
        phone?: string;
    }>;
    tasks?: any[];
    phases?: any[];
    meetings?: any[];
    agileTasks?: any[];
}

export const BMS_PROJECT_LOGO = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120"><defs><linearGradient id="bmsGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%230284c7"/><stop offset="100%" stop-color="%230369a1"/></linearGradient></defs><rect width="120" height="120" rx="28" fill="%230b1329"/><rect x="1.5" y="1.5" width="117" height="117" rx="27" fill="none" stroke="%231e293b" stroke-width="2"/><circle cx="60" cy="60" r="41" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="1.5"/><circle cx="60" cy="60" r="34" fill="url(%23bmsGrad)"/><line x1="39" y1="76" x2="81" y2="76" stroke="%2393c5fd" stroke-width="2.5" stroke-linecap="round"/><rect x="42" y="62" width="7" height="14" rx="2" fill="%23bae6fd"/><rect x="52" y="51" width="7" height="25" rx="2" fill="%23ffffff"/><rect x="62" y="57" width="7" height="19" rx="2" fill="%23bae6fd"/><rect x="72" y="44" width="7" height="32" rx="2" fill="%2338bdf8"/><path d="M 41 65 L 53 49 L 64 55 L 78 39" fill="none" stroke="%2338bdf8" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="78" cy="39" r="4" fill="%23ffffff" stroke="%230284c7" stroke-width="2"/><circle cx="53" cy="49" r="2.5" fill="%23ffffff"/><circle cx="64" cy="55" r="2.5" fill="%23ffffff"/></svg>';

export const WMS_PROJECT_LOGO = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120"><rect width="120" height="120" rx="28" fill="%230b1329"/><rect x="1.5" y="1.5" width="117" height="117" rx="27" fill="none" stroke="%231e293b" stroke-width="2"/><circle cx="60" cy="60" r="41" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="1.5"/><g transform="translate(60, 60)"><path d="M 0 -25 L 23 -12 L 0 1 L -23 -12 Z" fill="%23fb923c" stroke="%23ea580c" stroke-width="1.5" stroke-linejoin="round"/><path d="M -23 -12 L 0 1 L 0 26 L -23 13 Z" fill="%230284c7" stroke="%230369a1" stroke-width="1.5" stroke-linejoin="round"/><path d="M 0 1 L 23 -12 L 23 13 L 0 26 Z" fill="%23ea580c" stroke="%23c2410c" stroke-width="1.5" stroke-linejoin="round"/><path d="M 0 1 L 0 26 M 0 1 L -23 -12 M 0 1 L 23 -12" stroke="%23ffffff" stroke-width="2.5" stroke-linecap="round"/><path d="M -11.5 -5.5 L 0 -12 L 11.5 -5.5 L 0 1 Z" fill="none" stroke="%23ffffff" stroke-width="1.5" stroke-opacity="0.7"/><path d="M -11.5 7 L -11.5 -5.5 M 11.5 7 L 11.5 -5.5" stroke="%23ffffff" stroke-width="1.5" stroke-opacity="0.7"/></g></svg>';

const PROJECTS: ProjectPlanItem[] = [
    {
        id: '4',
        code: 'BMS-DIGI',
        name: 'BMS Digitech',
        description: 'Business Management System - Digitech Project Management & Workflow.',
        status: 'active',
        progress: 20,
        start_date: new Date(Date.now() - 86400000 * 15).toISOString(),
        end_date: new Date(Date.now() + 86400000 * 60).toISOString(),
        total_tasks: 5,
        completed_tasks: 1,
        logo: BMS_PROJECT_LOGO,
        image: BMS_PROJECT_LOGO,
        members: [
            { id: 101, name: 'PISETH PANHAVORN', role: 'Lead Developer', phone: '010843612', avatar: '/images/placeholder/panha-portrait.jpg' },
            { id: 102, name: 'PUM BRUSMUNY', role: 'Developer', phone: '087280875', avatar: '/images/placeholder/brusmuny-portrait.png' },
            { id: 103, name: 'THA WINNER', role: 'Developer', phone: '067776682', avatar: null },
            { id: 104, name: 'PHUONG SOVANNARA', role: 'Developer', phone: '011242425', avatar: null },
        ],
    },
    {
        id: '5',
        code: 'WMS-DIGI',
        name: 'WMS Digitech',
        description: 'Workforce & Attendance Management System - Digitech.',
        status: 'active',
        progress: 0,
        start_date: new Date(Date.now() - 86400000 * 30).toISOString(),
        end_date: new Date(Date.now() + 86400000 * 45).toISOString(),
        total_tasks: 4,
        completed_tasks: 0,
        logo: WMS_PROJECT_LOGO,
        image: WMS_PROJECT_LOGO,
        members: [
            { id: 101, name: 'PISETH PANHAVORN', role: 'Project Manager', phone: '010843612', avatar: '/images/placeholder/panha-portrait.jpg' },
            { id: 102, name: 'PUM BRUSMUNY', role: 'Developer', phone: '087280875', avatar: '/images/placeholder/brusmuny-portrait.png' },
            { id: 103, name: 'THA WINNER', role: 'Developer', phone: '067776682', avatar: null },
            { id: 104, name: 'PHUONG SOVANNARA', role: 'Developer', phone: '011242425', avatar: null },
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
                    this.projects = data.plans.filter((p: any) => !['PMS-V2', 'WMS-HR', 'E-GOV', '1', '2', '3'].includes(p.code) && !['1', '2', '3'].includes(p.id));
                    if (this.projects.length === 0) {
                        this.projects = [...PROJECTS];
                    }
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
                this.projects = dbStore.plans.filter((p: any) => !['PMS-V2', 'WMS-HR', 'E-GOV', '1', '2', '3'].includes(p.code) && !['1', '2', '3'].includes(p.id));
                if (this.projects.length === 0) {
                    this.projects = [...PROJECTS];
                } else {
                    for (const proj of this.projects) {
                        if (!proj.members) proj.members = [];
                        if (!proj.members.some((m: any) => m.phone === '011242425' || m.name?.toLowerCase().includes('sovannara'))) {
                            proj.members.push({ id: 104, name: 'PHUONG SOVANNARA', role: 'Developer', phone: '011242425', avatar: null });
                        }
                    }
                }
                await this.saveStore();
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
        this.syncTaskCounts(this.projects);
        return this.projects;
    }

    private syncTaskCounts(plans: ProjectPlanItem[]): void {
        try {
            const taskStorePath = path.join(process.cwd(), 'storage', 'tasks_data_store.json');
            if (fs.existsSync(taskStorePath)) {
                const raw = fs.readFileSync(taskStorePath, 'utf8');
                const parsed = JSON.parse(raw);
                if (parsed && Array.isArray(parsed.tasks)) {
                    const tasks: any[] = parsed.tasks;
                    for (const p of plans) {
                        const pid = (p.id || '').toLowerCase();
                        const pcode = (p.code || '').toLowerCase().replace('#', '');
                        const pname = (p.name || '').toLowerCase();

                        const projectTasks = tasks.filter((t: any) => {
                            const tPid = (t.project_id || '').toLowerCase();
                            const tPname = (t.project_name || '').toLowerCase();
                            const tCode = (t.code || '').toLowerCase().replace('#', '');

                            return (
                                (tPid && (tPid === pid || tPid.includes(pid) || pid.includes(tPid))) ||
                                (pcode && (tCode.includes(pcode) || tPid.includes(pcode))) ||
                                (pname && (tPname.includes(pname) || pname.includes(tPname)))
                            );
                        });

                        p.total_tasks = projectTasks.length;
                        p.completed_tasks = projectTasks.filter((t: any) =>
                            ['done', 'completed'].includes((t.status || '').toLowerCase())
                        ).length;
                        p.progress = p.total_tasks > 0 ? Math.round((p.completed_tasks / p.total_tasks) * 100) : 0;
                        p.tasks = projectTasks;
                    }
                }
            }
        } catch (e) {
            console.warn('Failed to sync task counts:', e);
        }
    }

    async getPlans(user: UserPayload, query: QueryPlanDto) {
        await this.ensureLoaded();
        this.syncTaskCounts(this.projects);

        // Sanitize any accidental duplicates: Project 4 is BMS Digitech
        this.projects = this.projects.filter((p) => !(p.code && /^BMS-DIGI-\d+$/i.test(p.code)));
        for (const p of this.projects) {
            if ((p.id === '4' || p.description?.toLowerCase().includes('business management')) && p.name === 'WMS Digitech') {
                p.name = 'BMS Digitech';
                p.code = 'BMS-DIGI';
            }
            if (p.code === 'BMS-DIGI' || p.name?.includes('BMS') || (p.code && p.code.includes('BMS'))) {
                p.logo = BMS_PROJECT_LOGO;
                p.image = BMS_PROJECT_LOGO;
            }
            if (p.code === 'WMS-DIGI' || p.name?.includes('WMS') || (p.code && p.code.includes('WMS'))) {
                p.logo = WMS_PROJECT_LOGO;
                p.image = WMS_PROJECT_LOGO;
            }
            if (p.members && Array.isArray(p.members)) {
                for (const m of p.members) {
                    const mName = (m.name || '').toLowerCase();
                    if (mName.includes('brusmuny') || mName.includes('pum')) {
                        m.avatar = '/images/placeholder/brusmuny-portrait.png';
                    } else if (mName.includes('piseth') || mName.includes('panhavorn')) {
                        m.avatar = '/images/placeholder/panha-portrait.jpg';
                    }
                }
            }
        }

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
        this.syncTaskCounts([plan]);

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

    assertAdminOrSuperAdmin(user: UserPayload, actionDesc: string = 'កែប្រែ ឬគ្រប់គ្រងគម្រោង'): void {
        const roles = Array.isArray(user?.roles) ? user.roles : [];
        const activeRole: any =
            roles.find((r: any) => r.is_default) ??
            roles.find((r: any) => Number(r.id) === Number(user?.is_active)) ??
            roles[0];

        const slug = (activeRole?.slug || '').toLowerCase().trim();
        const nameEn = (activeRole?.name_en || '').toLowerCase().trim();
        const nameKh = (activeRole?.name_kh || '').trim();

        const isUserRole =
            slug === 'user' ||
            slug === 'personal_workspace' ||
            slug === 'member' ||
            nameKh === 'អ្នកប្រើប្រាស់';

        const isAdmin =
            !isUserRole &&
            (
                slug.includes('admin') ||
                slug.includes('owner') ||
                slug.includes('super') ||
                nameEn.includes('admin') ||
                nameEn.includes('owner') ||
                nameKh === 'អភិបាលប្រព័ន្ធ' ||
                nameKh === 'រដ្ឋបាល' ||
                user?.is_active === RoleEnum.ORG_ADMIN ||
                user?.is_active === RoleEnum.ORG_OWNER ||
                user?.is_active === RoleEnum.SUPER_ADMIN
            );

        if (!isAdmin) {
            throw new ForbiddenException(`មានតែ Administrator ឬ Super Administrator ប៉ុណ្ណោះដែលអាច${actionDesc}បាន (Only Admin or Super Admin can perform this action).`);
        }
    }

    async createPlan(user: UserPayload, dto: any) {
        this.assertAdminOrSuperAdmin(user, 'បង្កើតគម្រោងថ្មី');

        await this.ensureLoaded();
        const projName = dto.name;
        let projCode = dto.code || `PMS-${Math.floor(100 + Math.random() * 900)}`;
        if (this.projects.some((p) => p.code?.toUpperCase() === projCode.toUpperCase())) {
            projCode = `${projCode}-${Math.floor(10 + Math.random() * 90)}`;
        }

        const effectiveLead = dto.team_lead || dto.lead || (dto.members?.[0] ? {
            id: Number(dto.members[0].id) || 1,
            name: dto.members[0].name,
            role: dto.members[0].role || 'Leader',
            avatar: dto.members[0].avatar || null,
        } : {
            id: user?.id || 1,
            name: user?.name_en || user?.name_kh || 'Project Lead',
            role: 'Leader',
            avatar: null,
        });

        const starterTasks = [
            {
                id: `task-${Date.now()}-1`,
                code: `#${projCode}-001`,
                title: `${projName} | ការរៀបចំស្ថាបត្យកម្ម & ផែនការអនុវត្ត`,
                description: `រៀបចំផែនការអនុវត្តគម្រោង ${projName} បែងចែកភារកិច្ច និងកំណត់កាលវិភាគ Sprint។`,
                priority: 'high',
                status: 'in_progress',
                due_date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
                created_at: new Date().toISOString().split('T')[0],
                time_ago: 'ទើបបង្កើត',
                comments_count: 0,
                attachments_count: 0,
                assignee: dto.members?.[0] || effectiveLead,
                members: dto.members?.length ? dto.members : [effectiveLead],
                progress: 50,
                subtasks: [
                    { id: `st-${Date.now()}-1`, title: 'កំណត់គោលដៅ និងតម្រូវការប្រព័ន្ធ (SRS)', completed: true },
                    { id: `st-${Date.now()}-2`, title: 'បែងចែកការងារជូនសមាជិកក្រុម', completed: false },
                ],
                links: [],
                documents: [],
            },
            {
                id: `task-${Date.now()}-2`,
                code: `#${projCode}-002`,
                title: `${projName} | ការរចនា UI/UX & Prototypes`,
                description: `រចនាទម្រង់ផ្ទៃមុខងារប្រព័ន្ធ (UI Components) ក្នុង Figma សម្រាប់គម្រោង ${projName}។`,
                priority: 'medium',
                status: 'new',
                due_date: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
                created_at: new Date().toISOString().split('T')[0],
                time_ago: 'ទើបបង្កើត',
                comments_count: 0,
                attachments_count: 0,
                assignee: dto.members?.[1] || dto.members?.[0] || effectiveLead,
                members: dto.members?.length ? dto.members : [effectiveLead],
                progress: 0,
                subtasks: [
                    { id: `st-${Date.now()}-3`, title: 'Design Layout & Mobile responsive mockups', completed: false },
                ],
                links: [],
                documents: [],
            },
        ];

        const starterPhases = [
            {
                id: `ph-${Date.now()}-1`,
                number: 1,
                title: 'ដំណាក់កាលទី ១៖ ការរៀបចំ និងរចនាប្លង់ប្រព័ន្ធ (Design & Planning)',
                quarter: 'ត្រីមាសទី ២ (Q2)',
                status: 'in_progress',
                progress: 50,
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
                tasksCount: 2,
            },
            {
                id: `ph-${Date.now()}-2`,
                number: 2,
                title: 'ដំណាក់កាលទី ២៖ ការអភិវឌ្ឍមុខងារស្នូល (Core Development)',
                quarter: 'ត្រីមាសទី ៣ (Q3)',
                status: 'planned',
                progress: 0,
                startDate: new Date(Date.now() + 86400000 * 31).toISOString().split('T')[0],
                endDate: new Date(Date.now() + 86400000 * 90).toISOString().split('T')[0],
                tasksCount: 0,
            },
        ];

        const starterMeetings = [
            {
                id: `m-${Date.now()}-1`,
                title: `${projName} Kickoff & Sprint Planning Sync`,
                description: `កិច្ចប្រជុំបើកដំណើរការគម្រោង ${projName} និងតម្រង់ទិសក្រុមការងារ។`,
                date: 'ថ្ងៃស្អែក (Tomorrow)',
                time: 'ម៉ោង ១០:០០ ព្រឹក - ១១:០០ ព្រឹក',
                platform: 'Google Meet',
                link: 'https://meet.google.com/new-project-sync',
                status: 'upcoming',
                attendees: dto.members?.length ? dto.members : [effectiveLead],
            },
        ];

        const newPlan: any = {
            ...dto,
            id: dto.id || `proj-${Date.now().toString().slice(-4)}`,
            code: projCode,
            name: projName,
            description: dto.description || '',
            status: dto.status || 'active',
            priority: dto.priority || 'medium',
            category: dto.category || 'it',
            budget_allocated: Number(dto.budget_allocated || dto.budget || 5000),
            budget_spent: Number(dto.budget_spent || 0),
            progress: dto.progress || 0,
            start_date: dto.start_date || new Date().toISOString(),
            end_date: dto.end_date || new Date(Date.now() + 86400000 * 30).toISOString(),
            team_lead: effectiveLead,
            lead: effectiveLead,
            total_tasks: dto.tasks?.length || starterTasks.length,
            completed_tasks: dto.tasks?.filter((t: any) => t.status === 'done' || t.status === 'completed')?.length || 0,
            members: dto.members?.length ? dto.members : [effectiveLead],
            tasks: dto.tasks?.length ? dto.tasks : starterTasks,
            phases: dto.phases?.length ? dto.phases : starterPhases,
            meetings: dto.meetings?.length ? dto.meetings : starterMeetings,
            agileTasks: dto.agileTasks?.length ? dto.agileTasks : [],
            attachments: dto.attachments || [],
            attachments_count: dto.attachments?.length || 0,
            logo: dto.logo || dto.image || null,
            image: dto.image || dto.logo || null,
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
        this.assertAdminOrSuperAdmin(user, 'កែប្រែព័ត៌មានគម្រោង');
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
            logo: dto.logo !== undefined ? dto.logo : current.logo,
            image: dto.image !== undefined ? dto.image : current.image,
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
        this.assertAdminOrSuperAdmin(user, 'លុបគម្រោង');
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
        this.syncTaskCounts([plan]);
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
            assignee: dto.assignee || null,
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
        this.assertAdminOrSuperAdmin(user, 'បង្កើតផែនការអនុវត្ត');
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

    async updateAgileTask(user: UserPayload, id: string, taskId: string, dto: any) {
        this.assertAdminOrSuperAdmin(user, 'កែប្រែផែនការអនុវត្ត');
        await this.ensureLoaded();
        const plan = this.projects.find((p) => p.id === id || p.code === id);
        if (!plan) throw new NotFoundException(`Plan / Project "${id}" not found`);
        if (!plan.agileTasks) plan.agileTasks = [];

        const idx = plan.agileTasks.findIndex((t: any) => t.id === taskId);
        if (idx === -1) throw new NotFoundException(`Agile task "${taskId}" not found`);

        plan.agileTasks[idx] = {
            ...plan.agileTasks[idx],
            ...dto,
            name: dto.name ?? plan.agileTasks[idx].name,
            segments: dto.segments ?? plan.agileTasks[idx].segments,
        };
        await this.saveStore();

        return {
            status_code: 200,
            message: 'Agile task updated successfully',
            data: plan.agileTasks[idx],
        };
    }

    async deleteAgileTask(user: UserPayload, id: string, taskId: string) {
        this.assertAdminOrSuperAdmin(user, 'លុបផែនការអនុវត្ត');
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
