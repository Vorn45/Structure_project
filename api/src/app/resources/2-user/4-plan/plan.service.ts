import {
    ForbiddenException,
    Injectable,
    NotFoundException,
    Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// ===========================================================================>> Custom Library
import { RoleEnum } from 'src/app/enum/role.enum';
import { UserPayload } from 'src/app/interface/jwt.interface';
import { User } from 'src/app/model/user/users.entity';
import { TaskEntity } from 'src/app/model/task/task.entity';
import { PlanStore } from 'src/app/model/user/plan-store.entity';
import { ProjectEntity } from 'src/app/model/project/project.entity';
import { ProjectPhaseEntity } from 'src/app/model/project/project-phase.entity';
import { RealtimeGateway } from 'src/app/shared/realtime/realtime.gateway';
import { isAdminOrSuperAdmin } from 'src/app/common/utils/access.util';
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
    lead?: {
        id?: number;
        name?: string;
        role?: string;
        avatar?: string | null;
    };
    team_lead?: {
        id?: number;
        name?: string;
        role?: string;
        avatar?: string | null;
    };
    reporter?:
        | string
        | { id?: number; name?: string; role?: string; avatar?: string | null };
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
            if (member.email)
                this.avatarMap.set(
                    `email:${member.email.toLowerCase().trim()}`,
                    member.avatar,
                );
            if (member.phone) {
                const clean = member.phone.replace(/\D/g, '');
                if (clean) {
                    this.avatarMap.set(`phone:${clean}`, member.avatar);
                    if (clean.length >= 8)
                        this.avatarMap.set(
                            `phone:${clean.slice(-8)}`,
                            member.avatar,
                        );
                }
            }
            if (member.name)
                this.avatarMap.set(
                    `name:${member.name.toLowerCase().trim()}`,
                    member.avatar,
                );
            if (u.name_en)
                this.avatarMap.set(
                    `name:${u.name_en.toLowerCase().trim()}`,
                    member.avatar,
                );
            if (u.name_kh)
                this.avatarMap.set(
                    `name:${u.name_kh.toLowerCase().trim()}`,
                    member.avatar,
                );
            const parts = `${u.name_en || ''} ${u.name_kh || ''}`
                .toLowerCase()
                .split(/\s+/)
                .filter(Boolean);
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
            const em = String(candidate.email).toLowerCase().trim();
            if (this.byEmail.has(em)) return this.byEmail.get(em)!;
        }
        if (candidate.phone) {
            const ph = String(candidate.phone).replace(/\D/g, '');
            if (ph) {
                if (this.byPhone.has(ph)) return this.byPhone.get(ph)!;
                if (ph.length >= 8 && this.byPhone.has(ph.slice(-8))) {
                    return this.byPhone.get(ph.slice(-8))!;
                }
            }
        }
        if (candidate.name) {
            const nm = String(candidate.name).toLowerCase().trim();
            if (this.byName.has(nm)) return this.byName.get(nm)!;
        }
        return null;
    }
}

@Injectable()
export class PlanService {
    private projects: ProjectPlanItem[] = [];
    private isDbLoaded = false;

    constructor(
        @InjectRepository(PlanStore)
        private readonly _planStoreRepo: Repository<PlanStore>,
        @InjectRepository(ProjectEntity)
        private readonly _projectRepo: Repository<ProjectEntity>,
        @InjectRepository(ProjectPhaseEntity)
        private readonly _phaseRepo: Repository<ProjectPhaseEntity>,
        @InjectRepository(User)
        private readonly _userRepo: Repository<User>,
        @InjectRepository(TaskEntity)
        private readonly _taskRepo: Repository<TaskEntity>,
        @Optional()
        private readonly _realtimeGateway?: RealtimeGateway,
    ) {
        this.initDbStore();
    }

    private sanitizeTask(task: any): any {
        if (!task) return task;
        const copy: any = { ...task };

        // Ensure attachments_count is preserved before removing attachments array
        copy.attachments_count =
            copy.attachments_count ??
            (Array.isArray(copy.attachments)
                ? copy.attachments.length
                : Array.isArray(copy.documents)
                  ? copy.documents.length
                  : 0);
        delete copy.attachments;

        // Ensure comments_count is preserved before removing comments array
        if (Array.isArray(copy.comments)) {
            copy.comments_count = copy.comments_count ?? copy.comments.length;
            delete copy.comments;
        }

        // Strip heavy inline base64 images from description
        if (
            typeof copy.description === 'string' &&
            copy.description.includes('data:image/')
        ) {
            copy.description = copy.description.replace(
                /src="data:image\/[^;]+;base64,[^"]+"/g,
                'src=""',
            );
        }

        // Strip base64 data URLs from documents
        if (Array.isArray(copy.documents)) {
            copy.documents = copy.documents.map((d: any) => {
                if (!d) return d;
                const docCopy = { ...d };
                if (
                    typeof docCopy.url === 'string' &&
                    docCopy.url.startsWith('data:')
                ) {
                    docCopy.url = '';
                }
                if (docCopy.data) {
                    delete docCopy.data;
                }
                return docCopy;
            });
        }

        return copy;
    }

    private sanitizeProject(
        project: ProjectPlanItem,
        includeTasks = true,
    ): any {
        if (!project) return project;
        const copy: any = { ...project };

        if (Array.isArray(copy.tasks)) {
            if (!includeTasks) {
                delete copy.tasks;
            } else {
                copy.tasks = copy.tasks.map((t: any) => this.sanitizeTask(t));
            }
        }

        // Sanitize project attachments
        if (Array.isArray(copy.attachments)) {
            copy.attachments_count =
                copy.attachments_count ?? copy.attachments.length;
            copy.attachments = copy.attachments.map((att: any) => {
                if (!att) return att;
                const attCopy = { ...att };
                if (
                    typeof attCopy.url === 'string' &&
                    attCopy.url.startsWith('data:')
                ) {
                    attCopy.url = '';
                }
                if (attCopy.data) {
                    delete attCopy.data;
                }
                return attCopy;
            });
        }

        return copy;
    }

    private async ensureTableExists(): Promise<void> {
        try {
            await this._planStoreRepo.query(`
                CREATE EXTENSION IF NOT EXISTS "pgcrypto";
                CREATE SCHEMA IF NOT EXISTS "user";
                CREATE SCHEMA IF NOT EXISTS "project";
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
            const count = await this._projectRepo.count();
            if (count > 0) {
                const dbProjects = await this._projectRepo.find({
                    order: { created_at: 'ASC' },
                });
                const allPhases = await this._phaseRepo.find({
                    order: { number: 'ASC' },
                });

                this.projects = dbProjects.map((p) => {
                    const projectPhases = allPhases.filter(
                        (ph) =>
                            ph.project_id === p.id || ph.project_id === p.code,
                    );
                    return {
                        id: p.id,
                        code: p.code,
                        name: p.name,
                        description: p.description || '',
                        status: (p.status as any) || 'active',
                        progress: p.progress || 0,
                        start_date: p.start_date
                            ? new Date(p.start_date).toISOString()
                            : new Date().toISOString(),
                        end_date: p.end_date
                            ? new Date(p.end_date).toISOString()
                            : new Date(
                                  Date.now() + 86400000 * 30,
                              ).toISOString(),
                        total_tasks: p.total_tasks || 0,
                        completed_tasks: p.completed_tasks || 0,
                        logo: p.logo,
                        image: p.image,
                        lead: p.lead,
                        team_lead: p.team_lead,
                        members: p.members || [],
                        phases: projectPhases,
                        meetings: p.meetings || [],
                        links: p.links || [],
                        attachments: p.attachments || [],
                        attachments_count: p.attachments_count || 0,
                    };
                });
                this.isDbLoaded = true;
                return;
            }

            // Fallback: check planStoreRepo
            const dbStore = await this._planStoreRepo.findOne({
                where: { key: 'default_plans_store' },
            });
            if (
                dbStore &&
                Array.isArray(dbStore.plans) &&
                dbStore.plans.length > 0
            ) {
                this.projects = dbStore.plans
                    .filter(
                        (p: any) =>
                            ![
                                'PMS-V2',
                                'WMS-HR',
                                'E-GOV',
                                '1',
                                '2',
                                '3',
                            ].includes(p.code) &&
                            !['1', '2', '3'].includes(p.id),
                    )
                    .map((p: any) => this.sanitizeProject(p));

                for (const p of this.projects) {
                    const projectEntity = this._projectRepo.create({
                        id: p.id,
                        code: p.code,
                        name: p.name,
                        description: p.description,
                        status: p.status,
                        progress: p.progress,
                        start_date: p.start_date,
                        end_date: p.end_date,
                        total_tasks: p.total_tasks,
                        completed_tasks: p.completed_tasks,
                        logo: p.logo,
                        image: p.image,
                        lead: p.lead,
                        team_lead: p.team_lead,
                        members: p.members || [],
                        links: (p as any).links || [],
                        meetings: (p as any).meetings || [],
                        attachments: (p as any).attachments || [],
                        attachments_count: (p as any).attachments_count || 0,
                    });
                    await this._projectRepo.save(projectEntity);
                }
            } else {
                this.projects = [];
            }
            this.isDbLoaded = true;
        } catch (err) {
            console.warn('Could not load plan store from DB:', err);
        }
    }

    private async ensureLoaded(): Promise<void> {
        if (!this.isDbLoaded) {
            await this.initDbStore();
        }
    }

    private async saveStore(): Promise<void> {
        await this.saveToDb();
    }

    private async saveToDb(): Promise<void> {
        try {
            for (const p of this.projects) {
                await this._projectRepo.save({
                    id: p.id,
                    code: p.code,
                    name: p.name,
                    description: p.description,
                    status: p.status,
                    progress: p.progress,
                    start_date: p.start_date,
                    end_date: p.end_date,
                    total_tasks: p.total_tasks,
                    completed_tasks: p.completed_tasks,
                    logo: p.logo,
                    image: p.image,
                    lead: p.lead,
                    team_lead: p.team_lead,
                    members: p.members || [],
                    links: (p as any).links || [],
                    meetings: (p as any).meetings || [],
                    attachments: (p as any).attachments || [],
                    attachments_count: (p as any).attachments_count || 0,
                });
            }

            let dbStore = await this._planStoreRepo.findOne({
                where: { key: 'default_plans_store' },
            });
            const sanitizedPlans = this.projects.map((p) =>
                this.sanitizeProject(p),
            );
            if (!dbStore) {
                dbStore = this._planStoreRepo.create({
                    key: 'default_plans_store',
                    plans: sanitizedPlans,
                });
            } else {
                dbStore.plans = sanitizedPlans;
            }
            await this._planStoreRepo.save(dbStore);
        } catch (err) {
            console.error('Failed to save plan store to DB:', err);
        }
    }

    /** Load database user members for live role, name, and avatar enrichment */
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
                    let uri = (u.avatar_file.uri || '').replace(/^\/+/, '');
                    avatarUrl = `${domain}/${uri}`;
                    if (
                        avatarUrl.includes('localhost') ||
                        avatarUrl.includes('127.0.0.1')
                    ) {
                        const idx = avatarUrl.indexOf('/uploads');
                        if (idx !== -1) {
                            avatarUrl = avatarUrl.substring(idx);
                        }
                    }
                } else if (u.telegram_photo_url) {
                    avatarUrl = u.telegram_photo_url;
                }

                const displayName =
                    u.name_kh || u.name_en || `User #${u.id}`;
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
            console.error(
                'Failed to load user members for live lookup in PlanService:',
                e,
            );
        }
        return lookup;
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
                avatar: matched.avatar || m.avatar || null,
                email: matched.email || m.email || '',
                phone: matched.phone || m.phone || '',
            };
        }
        return m;
    }

    private enrichProjectWithMembers(
        p: ProjectPlanItem,
        lookup: LiveMemberLookup,
    ): ProjectPlanItem {
        const copy: any = { ...p };
        if (copy.lead) {
            copy.lead = this.resolveMember(copy.lead, lookup);
        }
        if (copy.team_lead) {
            copy.team_lead = this.resolveMember(copy.team_lead, lookup);
        }
        if (copy.reporter && typeof copy.reporter === 'object') {
            copy.reporter = this.resolveMember(copy.reporter, lookup);
        }
        if (Array.isArray(copy.members)) {
            copy.members = copy.members.map((m: any) =>
                this.resolveMember(m, lookup),
            );
        }
        return copy;
    }

    getRawProjects(): ProjectPlanItem[] {
        return this.projects.map((p) => this.sanitizeProject(p));
    }

    private async syncTaskCounts(plans: ProjectPlanItem[]): Promise<void> {
        try {
            const dbTasks = await this._taskRepo.find();
            for (const p of plans) {
                const pid = (p.id || '').toLowerCase();
                const pcode = (p.code || '')
                    .toLowerCase()
                    .replace('#', '');
                const pname = (p.name || '').toLowerCase();

                const projectTasks = dbTasks.filter((t: any) => {
                    const tPid = (t.project_id || '')
                        .toLowerCase()
                        .trim();
                    const tPname = (t.project_name || '')
                        .toLowerCase()
                        .trim();
                    const tCode = (t.code || '')
                        .toLowerCase()
                        .trim()
                        .replace('#', '');

                    return (
                        (tPid && (tPid === pid || tPid === pcode)) ||
                        (pcode &&
                            (tCode === pcode ||
                                tCode.startsWith(pcode + '-'))) ||
                        (pname && tPname === pname)
                    );
                });

                p.total_tasks = projectTasks.length;
                p.completed_tasks = projectTasks.filter((t: any) =>
                    ['done', 'completed'].includes(
                        (t.status || '').toLowerCase(),
                    ),
                ).length;
                p.progress =
                    p.total_tasks > 0
                        ? Math.round(
                              (p.completed_tasks / p.total_tasks) * 100,
                          )
                        : 0;
            }
        } catch (e) {
            // Safe fallback
        }
    }

    async getPlans(user: UserPayload, query: QueryPlanDto) {
        await this.ensureLoaded();
        this.syncTaskCounts(this.projects);

        // Sanitize any accidental duplicates: Project 4 is BMS Digitech
        this.projects = this.projects.filter(
            (p) => !(p.code && /^BMS-DIGI-\d+$/i.test(p.code)),
        );
        for (const p of this.projects) {
            if (
                (p.id === '4' ||
                    p.description
                        ?.toLowerCase()
                        .includes('business management')) &&
                p.name === 'WMS Digitech'
            ) {
                p.name = 'BMS Digitech';
                p.code = 'BMS-DIGI';
            }

            if (p.members && Array.isArray(p.members)) {
                for (const m of p.members) {
                    if (
                        typeof m.avatar === 'string' &&
                        (m.avatar.includes('portrait') ||
                            m.avatar.includes('placeholder'))
                    ) {
                        m.avatar = null;
                    }
                }
            }
        }

        let list = [...this.projects];

        // Role-based scoping: Non-admin members ONLY see projects they are assigned to
        if (!this.isAdmin(user)) {
            if (!user) {
                list = [];
            } else {
                list = list.filter((p) => this.isUserProjectMember(user, p));
            }
        }

        if (this.isFilterActive(query.search)) {
            const s = query.search.toLowerCase().trim();
            list = list.filter(
                (p) =>
                    p.name.toLowerCase().includes(s) ||
                    p.code.toLowerCase().includes(s) ||
                    p.description.toLowerCase().includes(s),
            );
        }

        if (this.isFilterActive(query.status)) {
            list = list.filter((p) => p.status === query.status);
        }

        const lookup = await this.getLiveMemberLookup();
        const limit = query.limit ? parseInt(query.limit, 10) : 50;
        const offset = query.offset ? parseInt(query.offset, 10) : 0;
        const paginated = list
            .slice(offset, offset + limit)
            .map((p) =>
                this.enrichProjectWithMembers(
                    this.sanitizeProject(p),
                    lookup,
                ),
            );

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
        const normId = String(id || '')
            .toLowerCase()
            .replace(/^#/, '')
            .trim();
        const plan = this.projects.find(
            (p) =>
                String(p.id || '').toLowerCase() === normId ||
                String(p.code || '')
                    .toLowerCase()
                    .replace(/^#/, '') === normId ||
                String(p.name || '').toLowerCase() === normId ||
                (normId === '4' && (p.code === '0002' || p.id === '0002')) ||
                (normId === '5' && (p.code === '0001' || p.id === '0001')) ||
                (normId.includes('wms') &&
                    (p.name.toLowerCase().includes('wms') ||
                        (p.code && p.code.toLowerCase().includes('wms')))) ||
                (normId.includes('bms') &&
                    (p.name.toLowerCase().includes('bms') ||
                        (p.code && p.code.toLowerCase().includes('bms')))),
        );
        if (!plan) {
            throw new NotFoundException(`Plan / Project "${id}" not found`);
        }
        if (!this.isAdmin(user) && !this.isUserProjectMember(user, plan)) {
            throw new ForbiddenException(
                'អ្នកមិនមានសិទ្ធិចូលមើលគម្រោងនេះទេ (You do not have permission to view this project).',
            );
        }
        await this.syncTaskCounts([plan]);

        const lookup = await this.getLiveMemberLookup();
        return {
            status_code: 200,
            message: 'Plan retrieved successfully',
            data: this.enrichProjectWithMembers(
                this.sanitizeProject(plan),
                lookup,
            ),
        };
    }

    async getTeamMembers(user: UserPayload, id: string) {
        await this.ensureLoaded();
        const plan = this.projects.find((p) => p.id === id || p.code === id);
        if (!plan) {
            throw new NotFoundException(`Plan / Project "${id}" not found`);
        }
        if (!this.isAdmin(user) && !this.isUserProjectMember(user, plan)) {
            throw new ForbiddenException(
                'អ្នកមិនមានសិទ្ធិចូលមើលសមាជិកនៃគម្រោងនេះទេ (You do not have permission to view members of this project).',
            );
        }

        const lookup = await this.getLiveMemberLookup();
        const enrichedMembers = (plan.members || []).map((m: any) =>
            this.resolveMember(m, lookup),
        );

        return {
            status_code: 200,
            message: 'Team members retrieved successfully',
            data: {
                project_id: plan.id,
                project_name: plan.name,
                members: enrichedMembers,
            },
        };
    }

    private isFilterActive(value?: string): boolean {
        return Boolean(
            value &&
            value !== 'all' &&
            value !== 'undefined' &&
            value !== 'null' &&
            value.trim(),
        );
    }

    public isAdmin(user?: UserPayload): boolean {
        return isAdminOrSuperAdmin(user);
    }

    public isUserProjectMember(
        user: UserPayload,
        project: ProjectPlanItem,
    ): boolean {
        if (!user) return false;
        if (this.isAdmin(user)) return true;

        const uId = Number(user.id || 0);
        const uEmail = (user.email || '').toLowerCase().trim();
        const uPhone = (user.phone || '').replace(/\D/g, '');

        // 1. Check if user is the project lead by verified user_id, phone, or email
        const lead = project.lead || (project as any).team_lead;
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

        // 2. Check project members list
        const members = Array.isArray(project.members) ? project.members : [];
        return members.some((m: any) => {
            if (!m) return false;
            // Match by numeric user ID (excluding mock seed IDs 101-104)
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

            // Match by phone number (unique per person)
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

            // For mock seed members (IDs 101, 102, 103, 104):
            if (m.id === 101) {
                return uPhone === '010843612' || uId === 5;
            }
            if (m.id === 102) {
                return uPhone === '087280875' || uId === 6;
            }
            if (m.id === 103) {
                return (
                    uPhone === '078776682' ||
                    uPhone === '067776682' ||
                    uId === 7 ||
                    uId === 8
                );
            }
            if (m.id === 104) {
                return uPhone === '011242425' || uId === 9;
            }

            // Match by email ONLY if not the admin's shared/reused email
            if (
                m.email &&
                uEmail &&
                String(m.email).toLowerCase().trim() === uEmail
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
        });
    }

    assertAdminOrSuperAdmin(
        user: UserPayload,
        actionDesc: string = 'កែប្រែ ឬគ្រប់គ្រងគម្រោង',
    ): void {
        if (!this.isAdmin(user)) {
            throw new ForbiddenException(
                `មានតែ Administrator ឬ Super Administrator ប៉ុណ្ណោះដែលអាច${actionDesc}បាន (Only Admin or Super Admin can perform this action).`,
            );
        }
    }

    async createPlan(user: UserPayload, dto: any) {
        this.assertAdminOrSuperAdmin(user, 'បង្កើតគម្រោងថ្មី');

        await this.ensureLoaded();
        const projName = dto.name;
        let projCode = (dto.code || '').trim().replace(/^#/, '');
        if (!projCode) {
            let maxNum = 0;
            for (const p of this.projects) {
                if (p.code) {
                    const match = p.code.match(/\d+/);
                    if (match) {
                        const val = parseInt(match[0], 10);
                        if (!isNaN(val) && val > maxNum) maxNum = val;
                    }
                }
            }
            projCode = String(maxNum + 1).padStart(4, '0');
        }

        const lookup = await this.getLiveMemberLookup();
        const rawLead =
            dto.team_lead ||
            dto.lead ||
            (dto.members?.[0] ? dto.members[0] : null) ||
            (user
                ? {
                      id: user.id,
                      email: user.email,
                      name: user.name_kh || user.name_en,
                  }
                : null);
        const resolvedLead = rawLead ? this.resolveMember(rawLead, lookup) : null;
        const effectiveLead = resolvedLead || {
            id: user?.id || 1,
            name: user?.name_en || user?.name_kh || 'Project Lead',
            role: 'Leader',
            avatar: null,
        };

        const resolvedMembers = (
            dto.members?.length ? dto.members : [effectiveLead]
        ).map((m: any) => this.resolveMember(m, lookup));

        const newPlan: any = {
            ...dto,
            id: dto.id || projCode,
            code: projCode,
            name: projName,
            description: dto.description || '',
            status: dto.status || 'active',
            priority: dto.priority || 'medium',
            category: dto.category || 'it',
            budget_allocated: Number(
                dto.budget_allocated || dto.budget || 5000,
            ),
            budget_spent: Number(dto.budget_spent || 0),
            progress: dto.progress || 0,
            start_date: dto.start_date || new Date().toISOString(),
            end_date:
                dto.end_date ||
                new Date(Date.now() + 86400000 * 30).toISOString(),
            team_lead: effectiveLead,
            lead: effectiveLead,
            total_tasks: dto.tasks?.length || 0,
            completed_tasks:
                dto.tasks?.filter(
                    (t: any) => t.status === 'done' || t.status === 'completed',
                )?.length || 0,
            members: resolvedMembers,
            tasks: (dto.tasks?.length ? dto.tasks : []).map((t: any) =>
                this.sanitizeTask(t),
            ),
            phases: dto.phases?.length ? dto.phases : [],
            meetings: dto.meetings?.length ? dto.meetings : [],
            agileTasks: dto.agileTasks?.length ? dto.agileTasks : [],
            links: dto.links || [],
            attachments: dto.attachments || [],
            attachments_count: dto.attachments?.length || 0,
            logo: dto.logo || dto.image || null,
            image: dto.image || dto.logo || null,
        };

        this.projects.unshift(newPlan);
        await this.saveStore();
        try {
            await this._projectRepo.save(this._projectRepo.create(newPlan));
        } catch (e) {}
        this._realtimeGateway?.emitProjectCreated({ project: newPlan });

        return {
            status_code: 201,
            message: 'Project plan created successfully',
            data: newPlan,
        };
    }

    async updatePlan(user: UserPayload, id: string, dto: any) {
        this.assertAdminOrSuperAdmin(user, 'កែប្រែព័ត៌មានគម្រោង');
        await this.ensureLoaded();
        const normId = String(id || '')
            .toLowerCase()
            .replace(/^#/, '')
            .trim();
        const index = this.projects.findIndex(
            (p) =>
                String(p.id || '').toLowerCase() === normId ||
                String(p.code || '')
                    .toLowerCase()
                    .replace(/^#/, '') === normId,
        );
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
            progress:
                dto.progress !== undefined ? dto.progress : current.progress,
            start_date: dto.start_date ?? current.start_date,
            end_date: dto.end_date ?? current.end_date,
            members: dto.members ?? current.members,
            tasks: dto.tasks
                ? dto.tasks.map((t: any) => this.sanitizeTask(t))
                : (current as any).tasks,
            phases: dto.phases ?? (current as any).phases,
            meetings: dto.meetings ?? (current as any).meetings,
            agileTasks: dto.agileTasks ?? (current as any).agileTasks,
            links: dto.links !== undefined ? dto.links : (current as any).links,
            logo:
                dto.logo !== undefined
                    ? dto.logo
                    : dto.image !== undefined
                      ? dto.image
                      : current.logo,
            image:
                dto.image !== undefined
                    ? dto.image
                    : dto.logo !== undefined
                      ? dto.logo
                      : current.image,
        };

        this.projects[index] = updated;
        await this.saveStore();
        try {
            await this._projectRepo.save({
                id: updated.id,
                code: updated.code,
                name: updated.name,
                description: updated.description,
                status: updated.status,
                progress: updated.progress,
                start_date: updated.start_date,
                end_date: updated.end_date,
                total_tasks: updated.total_tasks,
                completed_tasks: updated.completed_tasks,
                logo: updated.logo,
                image: updated.image,
                lead: updated.lead,
                team_lead: updated.team_lead,
                members: updated.members || [],
                links: updated.links || [],
                meetings: updated.meetings || [],
                attachments: updated.attachments || [],
                attachments_count: updated.attachments_count || 0,
            });
        } catch (e) {
            console.error('Failed to save project entity in updatePlan:', e);
        }
        this._realtimeGateway?.emitProjectUpdated({ project: updated });

        return {
            status_code: 200,
            message: 'Project plan updated successfully',
            data: updated,
        };
    }

    async deletePlan(user: UserPayload, id: string) {
        this.assertAdminOrSuperAdmin(user, 'លុបគម្រោង');
        await this.ensureLoaded();
        const index = this.projects.findIndex(
            (p) => p.id === id || p.code === id,
        );
        if (index === -1) {
            throw new NotFoundException(`Plan / Project "${id}" not found`);
        }

        const toDelete = this.projects[index];
        this.projects.splice(index, 1);
        await this.saveStore();
        try {
            await this._projectRepo.delete({ id: toDelete.id });
            await this._phaseRepo.delete({ project_id: toDelete.id });
        } catch (e) {}
        this._realtimeGateway?.emitProjectDeleted({ project_id: id });

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
        const normId = String(id || '')
            .toLowerCase()
            .replace(/^#/, '')
            .trim();
        const plan = this.projects.find(
            (p) =>
                String(p.id || '').toLowerCase() === normId ||
                String(p.code || '')
                    .toLowerCase()
                    .replace(/^#/, '') === normId ||
                String(p.name || '').toLowerCase() === normId ||
                (normId.includes('wms') &&
                    (p.name.toLowerCase().includes('wms') ||
                        (p.code && p.code.toLowerCase().includes('wms')))) ||
                (normId.includes('bms') &&
                    (p.name.toLowerCase().includes('bms') ||
                        (p.code && p.code.toLowerCase().includes('bms')))),
        );
        if (!plan)
            throw new NotFoundException(`Plan / Project "${id}" not found`);
        if (!this.isAdmin(user) && !this.isUserProjectMember(user, plan)) {
            throw new ForbiddenException(
                'អ្នកមិនមានសិទ្ធិចូលមើលកិច្ចការនៃគម្រោងនេះទេ (You do not have permission to view tasks in this project).',
            );
        }
        this.syncTaskCounts([plan]);
        return {
            status_code: 200,
            data: (plan.tasks || []).map((t: any) => this.sanitizeTask(t)),
        };
    }

    async createTask(user: UserPayload, id: string, dto: any) {
        await this.ensureLoaded();
        const plan = this.projects.find((p) => p.id === id || p.code === id);
        if (!plan)
            throw new NotFoundException(`Plan / Project "${id}" not found`);
        if (!this.isAdmin(user) && !this.isUserProjectMember(user, plan)) {
            throw new ForbiddenException(
                'អ្នកមិនមានសិទ្ធិបង្កើតកិច្ចការក្នុងគម្រោងនេះទេ (You do not have permission to create tasks in this project).',
            );
        }
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
            reporter: dto.reporter || {
                id: 1,
                name: 'Admin',
                role: 'Project Manager',
            },
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
        if (!plan)
            throw new NotFoundException(`Plan / Project "${id}" not found`);
        if (!plan.tasks) plan.tasks = [];

        const tIndex = plan.tasks.findIndex(
            (t: any) => t.id === taskId || t.code === taskId,
        );
        if (tIndex === -1)
            throw new NotFoundException(`Task "${taskId}" not found`);

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
        if (!plan)
            throw new NotFoundException(`Plan / Project "${id}" not found`);
        if (!plan.tasks) return { status_code: 200, message: 'Deleted' };

        plan.tasks = plan.tasks.filter(
            (t: any) => t.id !== taskId && t.code !== taskId,
        );
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
        if (!plan)
            throw new NotFoundException(`Plan / Project "${id}" not found`);
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
        try {
            await this._phaseRepo.save(
                this._phaseRepo.create({
                    id: newPhase.id,
                    project_id: plan.id,
                    number: plan.phases.length,
                    title: newPhase.title,
                    quarter: newPhase.quarter,
                    status: newPhase.status,
                    progress: 0,
                    tasks_count: 0,
                }),
            );
        } catch (e) {}

        return {
            status_code: 201,
            message: 'Phase created successfully',
            data: newPhase,
        };
    }

    async deletePhase(user: UserPayload, id: string, phaseId: string) {
        await this.ensureLoaded();
        const plan = this.projects.find((p) => p.id === id || p.code === id);
        if (!plan)
            throw new NotFoundException(`Plan / Project "${id}" not found`);
        if (!plan.phases) return { status_code: 200, message: 'Deleted' };

        plan.phases = plan.phases.filter((p: any) => p.id !== phaseId);
        await this.saveStore();
        try {
            await this._phaseRepo.delete({ id: phaseId });
        } catch (e) {}

        return {
            status_code: 200,
            message: 'Phase deleted successfully',
        };
    }

    async createMeeting(user: UserPayload, id: string, dto: any) {
        await this.ensureLoaded();
        const plan = this.projects.find((p) => p.id === id || p.code === id);
        if (!plan)
            throw new NotFoundException(`Plan / Project "${id}" not found`);
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
        if (!plan)
            throw new NotFoundException(`Plan / Project "${id}" not found`);
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
        if (!plan)
            throw new NotFoundException(`Plan / Project "${id}" not found`);

        if (!this.isAdmin(user)) {
            const uId = user.id ? String(user.id) : '';
            const leadId = plan.lead?.id || (plan as any).team_lead?.id;
            const isLead = leadId && String(leadId) === uId;
            if (!isLead) {
                throw new ForbiddenException(
                    'មានតែ Administrator ឬ ប្រធានគម្រោងប៉ុណ្ណោះដែលអាចបន្ថែមសមាជិកបាន (Only Admin or Project Lead can add members).',
                );
            }
        }

        if (!plan.members) plan.members = [];

        const lookup = await this.getLiveMemberLookup();
        const matched = lookup.find(dto);
        const newMember = {
            id: matched?.id || dto.id || dto.user_id || Date.now(),
            user_id: matched?.id || dto.user_id || dto.id,
            name: matched?.name || dto.name,
            role: matched?.role || dto.role || 'Developer',
            email: matched?.email || dto.email,
            phone: matched?.phone || dto.phone,
            avatar: matched?.avatar || dto.avatar || null,
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
        if (!plan)
            throw new NotFoundException(`Plan / Project "${id}" not found`);

        if (!this.isAdmin(user)) {
            const uId = user.id ? String(user.id) : '';
            const leadId = plan.lead?.id || (plan as any).team_lead?.id;
            const isLead = leadId && String(leadId) === uId;
            if (!isLead) {
                throw new ForbiddenException(
                    'មានតែ Administrator ឬ ប្រធានគម្រោងប៉ុណ្ណោះដែលអាចលុបសមាជិកបាន (Only Admin or Project Lead can remove members).',
                );
            }
        }

        if (!plan.members) return { status_code: 200, message: 'Deleted' };

        plan.members = plan.members.filter(
            (m: any) => m.id !== memberId && m.id !== Number(memberId),
        );
        await this.saveStore();

        return {
            status_code: 200,
            message: 'Member removed successfully',
        };
    }

    async getAgileTasks(user: UserPayload, id: string) {
        await this.ensureLoaded();
        const plan = this.projects.find((p) => p.id === id || p.code === id);
        if (!plan)
            throw new NotFoundException(`Plan / Project "${id}" not found`);
        if (!this.isAdmin(user) && !this.isUserProjectMember(user, plan)) {
            throw new ForbiddenException(
                'អ្នកមិនមានសិទ្ធិចូលមើលផែនការនៃគម្រោងនេះទេ (You do not have permission to view agile plans in this project).',
            );
        }
        return {
            status_code: 200,
            data: plan.agileTasks || [],
        };
    }

    async createAgileTask(user: UserPayload, id: string, dto: any) {
        this.assertAdminOrSuperAdmin(user, 'បង្កើតផែនការអនុវត្ត');
        await this.ensureLoaded();
        const plan = this.projects.find((p) => p.id === id || p.code === id);
        if (!plan)
            throw new NotFoundException(`Plan / Project "${id}" not found`);
        if (!plan.agileTasks) plan.agileTasks = [];

        const newTask = {
            id: dto.id || `at-${Date.now()}`,
            name: dto.name,
            segments: dto.segments || [
                { iteration: 1, startWeek: 14, durationWeeks: 2 },
            ],
        };

        plan.agileTasks.unshift(newTask);
        await this.saveStore();

        return {
            status_code: 201,
            message: 'Agile task added successfully',
            data: newTask,
        };
    }

    async updateAgileTask(
        user: UserPayload,
        id: string,
        taskId: string,
        dto: any,
    ) {
        this.assertAdminOrSuperAdmin(user, 'កែប្រែផែនការអនុវត្ត');
        await this.ensureLoaded();
        const plan = this.projects.find((p) => p.id === id || p.code === id);
        if (!plan)
            throw new NotFoundException(`Plan / Project "${id}" not found`);
        if (!plan.agileTasks) plan.agileTasks = [];

        const idx = plan.agileTasks.findIndex((t: any) => t.id === taskId);
        if (idx === -1)
            throw new NotFoundException(`Agile task "${taskId}" not found`);

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
        if (!plan)
            throw new NotFoundException(`Plan / Project "${id}" not found`);
        if (!plan.agileTasks) return { status_code: 200, message: 'Deleted' };

        plan.agileTasks = plan.agileTasks.filter((t: any) => t.id !== taskId);
        await this.saveStore();

        return {
            status_code: 200,
            message: 'Agile task deleted successfully',
        };
    }
}
