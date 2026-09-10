// ===========================================================================>> Core Library
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

// ===========================================================================>> Custom Library
import { UserPayload } from 'src/app/interface/jwt.interface';
import { User } from 'src/app/model/user/users.entity';
import { PlanService } from '../2-user/4-plan/plan.service';
import {
    QueryAdminDto,
    CreateAdminUserDto,
    UpdateAdminUserDto,
    UpdateProjectBudgetDto,
    UpdateProjectLeadDto,
    LeaveActionDto,
    UpdateSettingsDto,
} from './admin.dto';

export interface AdminUserItem {
    id: number;
    name_kh: string;
    name_en: string;
    email: string;
    phone: string;
    role: string;
    department: string;
    position: string;
    avatar?: string | null;
    is_active: number;
    projects_count: number;
    created_at: string;
}

export interface LeaveRequestItem {
    id: string;
    user_id: number;
    user_name: string;
    department: string;
    leave_type: 'annual' | 'sick' | 'special' | 'maternity';
    start_date: string;
    end_date: string;
    duration_days: number;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    applied_at: string;
    reviewer_comment?: string;
}

const DEFAULT_USERS: AdminUserItem[] = [
    {
        id: 1,
        name_kh: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត',
        name_en: 'Piseth Panhavorn',
        email: 'pisethpanhavorn544@gmail.com',
        phone: '010 843 612',
        role: 'Super Admin',
        department: 'ព័ត៌មានវិទ្យា (IT)',
        position: 'Super Admin Architect',
        avatar: null,
        is_active: 1,
        projects_count: 2,
        created_at: '2026-01-10T08:00:00.000Z',
    },
    {
        id: 2,
        name_kh: 'ពុំ ប្រុសមុន្នី',
        name_en: 'Pum Brusmuny',
        email: 'pumprusmuny@example.com',
        phone: '087 280 875',
        role: 'Super Admin',
        department: 'គ្រប់គ្រងគម្រោង (PMO)',
        position: 'Project Director & Lead',
        avatar: null,
        is_active: 1,
        projects_count: 2,
        created_at: '2026-01-15T08:00:00.000Z',
    },
    {
        id: 3,
        name_kh: 'ថា វីនណឺរ',
        name_en: 'Tha Winner',
        email: 'thawinner@example.com',
        phone: '067 776 682',
        role: 'Team Lead',
        department: 'ព័ត៌មានវិទ្យា (IT)',
        position: 'Senior Frontend Architect',
        avatar: null,
        is_active: 1,
        projects_count: 2,
        created_at: '2026-02-01T08:00:00.000Z',
    },
    {
        id: 4,
        name_kh: 'ភួង សុវណ្ណារ៉ា',
        name_en: 'Phuong Sovannara',
        email: 'phuongsovannara@gmail.com',
        phone: '011 242 425',
        role: 'Member',
        department: 'ហេដ្ឋារចនាសម្ព័ន្ធ (DevOps)',
        position: 'Cloud & Security Specialist',
        avatar: null,
        is_active: 1,
        projects_count: 1,
        created_at: '2026-02-15T08:00:00.000Z',
    },
    {
        id: 5,
        name_kh: 'លី ម៉េងហួរ',
        name_en: 'Ly Menghour',
        email: 'menghour.ly@gmail.com',
        phone: '077 889 900',
        role: 'Team Lead',
        department: 'ព័ត៌មានវិទ្យា (IT)',
        position: 'Backend Lead Architect',
        avatar: null,
        is_active: 1,
        projects_count: 1,
        created_at: '2026-03-01T08:00:00.000Z',
    },
    {
        id: 6,
        name_kh: 'កែវ ធីតា',
        name_en: 'Keo Thida',
        email: 'thida.keo@gmail.com',
        phone: '010 445 566',
        role: 'Member',
        department: 'រចនា និងបទពិសោធន៍ (UI/UX)',
        position: 'Lead UI/UX Designer',
        avatar: null,
        is_active: 1,
        projects_count: 2,
        created_at: '2026-03-10T08:00:00.000Z',
    },
];

const DEFAULT_LEAVES: LeaveRequestItem[] = [
    {
        id: 'lv-101',
        user_id: 3,
        user_name: 'រ័ត្ន វិចិត្រ',
        department: 'ហេដ្ឋារចនាសម្ព័ន្ធ (DevOps)',
        leave_type: 'annual',
        start_date: '2026-09-10',
        end_date: '2026-09-12',
        duration_days: 3,
        reason: 'សម្រាកលំហែកាយប្រចាំឆ្នាំជាមួយក្រុមគ្រួសារ',
        status: 'pending',
        applied_at: '2026-09-04T09:30:00.000Z',
    },
    {
        id: 'lv-102',
        user_id: 5,
        user_name: 'កែវ ធីតា',
        department: 'រចនា និងបទពិសោធន៍ (UI/UX)',
        leave_type: 'sick',
        start_date: '2026-09-01',
        end_date: '2026-09-02',
        duration_days: 2,
        reason: 'ឈឺក្បាល ផ្ដាសាយ និងគ្រុនក្តៅ',
        status: 'approved',
        applied_at: '2026-08-31T14:00:00.000Z',
        reviewer_comment: 'អនុញ្ញាត សូមសម្រាកព្យាបាលឱ្យឆាប់ជាសះស្បើយ',
    },
];

@Injectable()
export class AdminService {
    private users: AdminUserItem[] = [...DEFAULT_USERS];
    private leaves: LeaveRequestItem[] = [...DEFAULT_LEAVES];
    private organizationSettings = {
        organization_name_kh: 'ប្រព័ន្ធគ្រប់គ្រងការងារ និងគម្រោងឌីជីថល',
        organization_name_en: 'Digital Workforce & Project Management System',
        code: 'WFM-HQ',
        domain: 'wfm.internal.gov.kh',
        departments: [
            { id: 'dept-1', name_kh: 'ព័ត៌មានវិទ្យា និងអភិវឌ្ឍន៍សូហ្វវែរ (IT)', name_en: 'Information Technology', head: 'លី ម៉េងហួរ', member_count: 14 },
            { id: 'dept-2', name_kh: 'គ្រប់គ្រងគម្រោង និងផែនការ (PMO)', name_en: 'Project Management Office', head: 'សុខ សុភា', member_count: 6 },
            { id: 'dept-3', name_kh: 'រចនា និងបទពិសោធន៍អ្នកប្រើប្រាស់ (UI/UX)', name_en: 'UI/UX & Product Design', head: 'កែវ ធីតា', member_count: 5 },
            { id: 'dept-4', name_kh: 'ហេដ្ឋារចនាសម្ព័ន្ធ និងសន្តិសុខ (DevOps)', name_en: 'Infrastructure & Security', head: 'រ័ត្ន វិចិត្រ', member_count: 4 },
            { id: 'dept-5', name_kh: 'ធនធានមនុស្ស និងរដ្ឋបាល (HR & Admin)', name_en: 'HR & Administration', head: 'ចេង ច័ន្ទបញ្ញា', member_count: 8 },
        ],
        work_categories: ['អភិវឌ្ឍន៍បច្ចេកវិទ្យា', 'ហេដ្ឋារចនាសម្ព័ន្ធ Cloud', 'សន្តិសុខព័ត៌មាន', 'រចនាផលិតផល', 'ការងាររដ្ឋបាល'],
    };

    private readonly storeFilePath = path.join(process.cwd(), 'storage', 'admin_data_store.json');

    constructor(
        @InjectRepository(User)
        private readonly _userRepo: Repository<User>,
        private readonly _planService: PlanService,
    ) {
        this.loadFromDisk();
    }

    private loadFromDisk(): void {
        try {
            if (fs.existsSync(this.storeFilePath)) {
                const raw = fs.readFileSync(this.storeFilePath, 'utf8');
                const data = JSON.parse(raw);
                if (data.users && Array.isArray(data.users)) this.users = data.users;
                if (data.leaves && Array.isArray(data.leaves)) this.leaves = data.leaves;
                if (data.settings) this.organizationSettings = { ...this.organizationSettings, ...data.settings };
            }
        } catch (e) {
            console.warn('Failed to load admin data from disk:', e);
        }
    }

    private saveToDisk(): void {
        try {
            const dir = path.dirname(this.storeFilePath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            const data = {
                users: this.users,
                leaves: this.leaves,
                settings: this.organizationSettings,
                updated_at: new Date().toISOString(),
            };
            fs.writeFileSync(this.storeFilePath, JSON.stringify(data, null, 2), 'utf8');
        } catch (e) {
            console.warn('Failed to save admin data to disk:', e);
        }
    }

    // =========================================================================
    // DASHBOARD & ANALYTICS
    // =========================================================================
    async getDashboardStats(user: UserPayload) {
        const rawProjects = this._planService.getRawProjects();
        const totalProjects = rawProjects.length;
        const activeProjects = rawProjects.filter((p) => p.status === 'active').length;
        const completedProjects = rawProjects.filter((p) => p.status === 'completed').length;
        const planningProjects = rawProjects.filter((p) => p.status === 'planning' || p.status === 'on_hold').length;

        let totalTasks = 0;
        let completedTasks = 0;
        rawProjects.forEach((p) => {
            totalTasks += p.total_tasks || p.tasks?.length || 0;
            completedTasks += p.completed_tasks || p.tasks?.filter((t: any) => t.status === 'done' || t.status === 'completed')?.length || 0;
        });

        const activeUsersCount = this.users.filter((u) => u.is_active === 1).length;
        const pendingLeavesCount = this.leaves.filter((l) => l.status === 'pending').length;

        // Department velocity breakdown
        const departmentStats = this.organizationSettings.departments.map((dept) => {
            return {
                name: dept.name_kh,
                name_en: dept.name_en,
                members: dept.member_count,
                progress: Math.floor(65 + Math.random() * 30),
            };
        });

        return {
            status_code: 200,
            message: 'Dashboard stats retrieved successfully',
            data: {
                kpi: {
                    total_projects: totalProjects,
                    active_projects: activeProjects,
                    completed_projects: completedProjects,
                    planning_projects: planningProjects,
                    total_tasks: totalTasks,
                    completed_tasks: completedTasks,
                    task_completion_rate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
                    active_users: activeUsersCount,
                    total_users: this.users.length,
                    pending_leaves: pendingLeavesCount,
                },
                projects_summary: rawProjects.map((p) => ({
                    id: p.id,
                    code: p.code,
                    name: p.name,
                    status: p.status,
                    progress: p.progress,
                    total_tasks: p.total_tasks || p.tasks?.length || 0,
                    completed_tasks: p.completed_tasks || 0,
                    lead: p.members?.[0]?.name || 'Project Lead',
                })),
                department_stats: departmentStats,
                recent_activity: [
                    { id: 'act-1', text: 'បានបង្កើតគម្រោងថ្មី WFM-V2 ជោគជ័យ', user: 'សុខ សុភា', time: '១០ នាទីមុន' },
                    { id: 'act-2', text: 'បានអនុម័តច្បាប់ឈប់សម្រាករបស់ រ័ត្ន វិចិត្រ', user: 'Admin', time: '១ ម៉ោងមុន' },
                    { id: 'act-3', text: 'បានបញ្ចប់ Task #WMS-0001 នៅក្នុងប្រព័ន្ធ WMS', user: 'ចេង ច័ន្ទបញ្ញា', time: '៣ ម៉ោងមុន' },
                    { id: 'act-4', text: 'បានធ្វើបច្ចុប្បន្នភាពថវិកាគម្រោង E-Gov Portal', user: 'ចេង ច័ន្ទបញ្ញា', time: 'ម្សិលមិញ' },
                ],
            },
        };
    }

    // =========================================================================
    // PROJECT GOVERNANCE (គម្រោង)
    // =========================================================================
    async getProjects(user: UserPayload, query: QueryAdminDto) {
        return this._planService.getPlans(user, query);
    }

    async getProjectById(user: UserPayload, id: string) {
        return this._planService.getPlanById(user, id);
    }

    async createProject(user: UserPayload, dto: any) {
        return this._planService.createPlan(user, dto);
    }

    async updateProject(user: UserPayload, id: string, dto: any) {
        return this._planService.updatePlan(user, id, dto);
    }

    async deleteProject(user: UserPayload, id: string) {
        return this._planService.deletePlan(user, id);
    }

    async updateProjectBudget(user: UserPayload, id: string, dto: UpdateProjectBudgetDto) {
        const rawProjects = this._planService.getRawProjects();
        const project = rawProjects.find((p) => p.id === id || p.code === id);
        if (!project) throw new NotFoundException(`Project "${id}" not found`);

        (project as any).budget = dto.budget;
        (project as any).spent = dto.spent || 0;
        (project as any).currency = dto.currency || 'USD';

        await this._planService.updatePlan(user, id, {
            budget: dto.budget,
            spent: dto.spent || 0,
            currency: dto.currency || 'USD',
        });

        return {
            status_code: 200,
            message: 'Project budget updated successfully',
            data: project,
        };
    }

    async updateProjectLead(user: UserPayload, id: string, dto: UpdateProjectLeadDto) {
        const rawProjects = this._planService.getRawProjects();
        const project = rawProjects.find((p) => p.id === id || p.code === id);
        if (!project) throw new NotFoundException(`Project "${id}" not found`);

        if (!project.members) project.members = [];
        const existingMemberIndex = project.members.findIndex((m) => m.id === dto.lead_id);
        if (existingMemberIndex > -1) {
            project.members[existingMemberIndex].role = 'Project Lead';
            const lead = project.members.splice(existingMemberIndex, 1)[0];
            project.members.unshift(lead);
        } else {
            project.members.unshift({
                id: dto.lead_id,
                name: dto.lead_name,
                role: dto.lead_role || 'Project Lead',
                avatar: null,
            });
        }

        await this._planService.updatePlan(user, id, { members: project.members });

        return {
            status_code: 200,
            message: 'Project lead updated successfully',
            data: project,
        };
    }

    // =========================================================================
    // USERS MANAGEMENT
    // =========================================================================
    async getUsers(user: UserPayload, query: QueryAdminDto) {
        let list = [...this.users];

        if (query.search) {
            const s = query.search.toLowerCase();
            list = list.filter(
                (u) =>
                    u.name_kh.toLowerCase().includes(s) ||
                    u.name_en.toLowerCase().includes(s) ||
                    u.email.toLowerCase().includes(s) ||
                    u.department.toLowerCase().includes(s) ||
                    u.position.toLowerCase().includes(s),
            );
        }

        if (query.role && query.role !== 'all') {
            list = list.filter((u) => u.role.toLowerCase() === query.role.toLowerCase());
        }

        if (query.department && query.department !== 'all') {
            list = list.filter((u) => u.department.includes(query.department));
        }

        if (query.status !== undefined && query.status !== 'all') {
            const isActiveNum = parseInt(query.status, 10);
            list = list.filter((u) => u.is_active === isActiveNum);
        }

        return {
            status_code: 200,
            message: 'Users retrieved successfully',
            data: {
                results: list,
                total: list.length,
            },
        };
    }

    async createUser(user: UserPayload, dto: CreateAdminUserDto) {
        const newUser: AdminUserItem = {
            id: Date.now(),
            name_kh: dto.name_kh,
            name_en: dto.name_en,
            email: dto.email || `${dto.name_en.toLowerCase().replace(/\s+/g, '.')}@wfm.kh`,
            phone: dto.phone || '012 000 000',
            role: dto.role || 'Member',
            department: dto.department || 'ព័ត៌មានវិទ្យា (IT)',
            position: dto.position || 'Software Engineer',
            avatar: null,
            is_active: 1,
            projects_count: 0,
            created_at: new Date().toISOString(),
        };

        this.users.unshift(newUser);
        this.saveToDisk();

        return {
            status_code: 201,
            message: 'User created successfully',
            data: newUser,
        };
    }

    async updateUser(user: UserPayload, id: number, dto: UpdateAdminUserDto) {
        const index = this.users.findIndex((u) => u.id === Number(id));
        if (index === -1) throw new NotFoundException(`User with ID ${id} not found`);

        this.users[index] = {
            ...this.users[index],
            ...dto,
            name_kh: dto.name_kh ?? this.users[index].name_kh,
            name_en: dto.name_en ?? this.users[index].name_en,
            email: dto.email ?? this.users[index].email,
            phone: dto.phone ?? this.users[index].phone,
            role: dto.role ?? this.users[index].role,
            department: dto.department ?? this.users[index].department,
            position: dto.position ?? this.users[index].position,
            is_active: dto.is_active !== undefined ? dto.is_active : this.users[index].is_active,
        };

        this.saveToDisk();

        return {
            status_code: 200,
            message: 'User updated successfully',
            data: this.users[index],
        };
    }

    async deleteUser(user: UserPayload, id: number) {
        const index = this.users.findIndex((u) => u.id === Number(id));
        if (index === -1) throw new NotFoundException(`User with ID ${id} not found`);

        this.users.splice(index, 1);
        this.saveToDisk();

        return {
            status_code: 200,
            message: 'User deleted successfully',
        };
    }

    async toggleUserStatus(user: UserPayload, id: number) {
        const index = this.users.findIndex((u) => u.id === Number(id));
        if (index === -1) throw new NotFoundException(`User with ID ${id} not found`);

        this.users[index].is_active = this.users[index].is_active === 1 ? 0 : 1;
        this.saveToDisk();

        return {
            status_code: 200,
            message: `User status changed to ${this.users[index].is_active === 1 ? 'Active' : 'Suspended'}`,
            data: this.users[index],
        };
    }

    // =========================================================================
    // ATTENDANCE & LEAVES
    // =========================================================================
    async getAttendanceOverview(user: UserPayload) {
        const today = new Date().toISOString().slice(0, 10);
        const attendanceLogs = this.users.map((u, idx) => ({
            id: `att-${u.id}`,
            user_id: u.id,
            user_name: u.name_kh,
            user_en: u.name_en,
            department: u.department,
            check_in: idx === 2 ? '08:45 AM' : '07:55 AM',
            check_out: idx === 0 ? '05:30 PM' : null,
            status: idx === 2 ? 'late' : 'on_time',
            date: today,
        }));

        return {
            status_code: 200,
            data: {
                total_staff: this.users.length,
                present_today: this.users.length - 1,
                late_today: 1,
                on_leave: 1,
                logs: attendanceLogs,
            },
        };
    }

    async getLeaveRequests(user: UserPayload) {
        return {
            status_code: 200,
            data: this.leaves,
        };
    }

    async actionLeaveRequest(user: UserPayload, id: string, dto: LeaveActionDto) {
        const leave = this.leaves.find((l) => l.id === id);
        if (!leave) throw new NotFoundException(`Leave request "${id}" not found`);

        leave.status = dto.status;
        if (dto.comment) leave.reviewer_comment = dto.comment;
        this.saveToDisk();

        return {
            status_code: 200,
            message: `Leave request ${dto.status} successfully`,
            data: leave,
        };
    }

    // =========================================================================
    // SETTINGS & ORGANIZATION
    // =========================================================================
    async getSettings(user: UserPayload) {
        return {
            status_code: 200,
            data: this.organizationSettings,
        };
    }

    async updateSettings(user: UserPayload, dto: UpdateSettingsDto) {
        this.organizationSettings = {
            ...this.organizationSettings,
            ...dto,
            organization_name_kh: dto.organization_name_kh ?? this.organizationSettings.organization_name_kh,
            organization_name_en: dto.organization_name_en ?? this.organizationSettings.organization_name_en,
            departments: dto.departments ?? this.organizationSettings.departments,
            work_categories: dto.work_categories ?? this.organizationSettings.work_categories,
        };

        this.saveToDisk();

        return {
            status_code: 200,
            message: 'Organization settings updated successfully',
            data: this.organizationSettings,
        };
    }
}
