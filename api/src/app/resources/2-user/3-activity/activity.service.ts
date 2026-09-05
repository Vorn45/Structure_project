// ===========================================================================>> Core Library
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// ===========================================================================>> Custom Library
import { UserPayload } from 'src/app/interface/jwt.interface';
import { ActivityStore } from 'src/app/model/user/activity-store.entity';
import { CreateActivityDto, CreateRoadmapProjectDto, CreateRoadmapTaskDto, QueryActivityDto } from './activity.dto';

export interface ActivityItem {
    id: number;
    action: string;
    title: string;
    description: string;
    type: 'task' | 'project' | 'comment' | 'auth' | 'security';
    icon: string;
    actor: {
        id: number;
        name: string;
        avatar?: string | null;
    };
    target?: {
        id: string | number;
        name: string;
        type: string;
    };
    created_at: string;
}

export interface AgilePlanSegment {
    iteration: 1 | 2 | 3;
    startWeek: number;
    durationWeeks: number;
    label?: string;
}

export interface AgilePlanTask {
    id: string;
    name: string;
    segments: AgilePlanSegment[];
}

export interface RoadmapProject {
    id: string;
    code: string;
    name: string;
    description?: string;
    tasksCount?: number;
}

const DEFAULT_PMS_TASKS: AgilePlanTask[] = [
    { id: 'task-1', name: 'ការប្រមូលតម្រូវការ PMS', segments: [{ iteration: 1, startWeek: 14, durationWeeks: 1 }, { iteration: 2, startWeek: 15, durationWeeks: 1 }, { iteration: 3, startWeek: 16, durationWeeks: 3, label: '3W' }] },
    { id: 'task-2', name: 'ដំណាក់កាលរចនាប្លង់ Architecture', segments: [{ iteration: 1, startWeek: 15, durationWeeks: 1 }, { iteration: 3, startWeek: 16, durationWeeks: 5, label: '5W' }] },
    { id: 'task-3', name: 'ការអភិវឌ្ឍគំរូសាកល្បង Prototype', segments: [{ iteration: 1, startWeek: 16, durationWeeks: 1 }, { iteration: 3, startWeek: 17, durationWeeks: 8, label: '8W' }] },
    { id: 'task-4', name: 'ការប្រមូលមតិកែលម្អ Stakeholders', segments: [{ iteration: 1, startWeek: 20, durationWeeks: 1 }, { iteration: 2, startWeek: 21, durationWeeks: 1 }, { iteration: 3, startWeek: 22, durationWeeks: 6, label: '6W' }] },
    { id: 'task-5', name: 'ការរចនាស្ថាបត្យកម្មប្រព័ន្ធ', segments: [{ iteration: 1, startWeek: 22, durationWeeks: 1 }, { iteration: 2, startWeek: 23, durationWeeks: 1 }, { iteration: 3, startWeek: 24, durationWeeks: 7, label: '7W' }] },
    { id: 'task-6', name: 'ការអភិវឌ្ឍប្រព័ន្ធ Backend NestJS', segments: [{ iteration: 1, startWeek: 23, durationWeeks: 2 }, { iteration: 2, startWeek: 25, durationWeeks: 1 }, { iteration: 3, startWeek: 26, durationWeeks: 8, label: '8W' }] },
    { id: 'task-7', name: 'ការអភិវឌ្ឍផ្ទៃប្រព័ន្ធ Angular Frontend', segments: [{ iteration: 1, startWeek: 25, durationWeeks: 2 }, { iteration: 2, startWeek: 27, durationWeeks: 2 }, { iteration: 3, startWeek: 29, durationWeeks: 7, label: '7W' }] },
    { id: 'task-8', name: 'ការធ្វើតេស្តសមាហរណកម្ម Integration', segments: [{ iteration: 1, startWeek: 26, durationWeeks: 1 }, { iteration: 2, startWeek: 27, durationWeeks: 2 }, { iteration: 3, startWeek: 29, durationWeeks: 6, label: '6W' }] },
    { id: 'task-9', name: 'ការធ្វើតេស្តទទួលយក (UAT)', segments: [{ iteration: 1, startWeek: 27, durationWeeks: 1 }, { iteration: 2, startWeek: 28, durationWeeks: 2 }, { iteration: 3, startWeek: 30, durationWeeks: 9, label: '9W' }] },
    { id: 'task-10', name: 'ការកែសម្រួល & ដោះស្រាយបញ្ហា', segments: [{ iteration: 1, startWeek: 28, durationWeeks: 2 }, { iteration: 2, startWeek: 30, durationWeeks: 1 }, { iteration: 3, startWeek: 31, durationWeeks: 8, label: '8W' }] },
    { id: 'task-11', name: 'ការបង្កើនល្បឿន & សមត្ថភាព Performance', segments: [{ iteration: 3, startWeek: 32, durationWeeks: 4, label: '4W' }] },
    { id: 'task-12', name: 'ការវាយតម្លៃសុវត្ថិភាព Security Audit', segments: [{ iteration: 1, startWeek: 30, durationWeeks: 1 }, { iteration: 2, startWeek: 31, durationWeeks: 2, label: '5W' }, { iteration: 3, startWeek: 33, durationWeeks: 5, label: '5W' }] },
    { id: 'task-13', name: 'ការរៀបចំឯកសារបច្ចេកទេស Documentation', segments: [{ iteration: 1, startWeek: 31, durationWeeks: 1 }, { iteration: 2, startWeek: 32, durationWeeks: 2 }, { iteration: 3, startWeek: 34, durationWeeks: 5, label: '5W' }] },
    { id: 'task-14', name: 'ការបណ្តុះបណ្តាល & ណែនាំ Training', segments: [{ iteration: 1, startWeek: 31, durationWeeks: 1 }, { iteration: 2, startWeek: 32, durationWeeks: 3, label: '4W' }, { iteration: 3, startWeek: 35, durationWeeks: 3, label: '3W' }] },
    { id: 'task-15', name: 'ការពិនិត្យ & អនុម័តចុងក្រោយ Final Signoff', segments: [{ iteration: 1, startWeek: 32, durationWeeks: 2, label: '3W' }, { iteration: 2, startWeek: 34, durationWeeks: 2, label: '4W' }, { iteration: 3, startWeek: 36, durationWeeks: 4, label: '4W' }] },
    { id: 'task-16', name: 'ការត្រៀមដាក់ឱ្យដំណើរការ Staging Release', segments: [{ iteration: 2, startWeek: 33, durationWeeks: 3, label: '4W' }, { iteration: 3, startWeek: 36, durationWeeks: 5, label: '5W' }] },
    { id: 'task-17', name: 'ការដាក់ឱ្យប្រើប្រាស់ផ្លូវការ Production Launch', segments: [{ iteration: 1, startWeek: 33, durationWeeks: 1 }, { iteration: 2, startWeek: 34, durationWeeks: 2, label: '4W' }, { iteration: 3, startWeek: 36, durationWeeks: 4, label: '4W' }] },
    { id: 'task-18', name: 'ការគាំទ្របច្ចេកទេស Maintenance & Support', segments: [{ iteration: 1, startWeek: 33, durationWeeks: 1 }, { iteration: 2, startWeek: 34, durationWeeks: 2, label: '4W' }, { iteration: 3, startWeek: 36, durationWeeks: 4, label: '4W' }] },
    { id: 'task-19', name: 'ការបិទបញ្ចប់ & ប្រគល់គម្រោង Project Handover', segments: [{ iteration: 1, startWeek: 34, durationWeeks: 1 }, { iteration: 2, startWeek: 35, durationWeeks: 2, label: '3W' }, { iteration: 3, startWeek: 37, durationWeeks: 3, label: '3W' }] },
];

const DEFAULT_WMS_TASKS: AgilePlanTask[] = [
    { id: 'wms-1', name: 'ការកំណត់តម្រូវការវត្តមាន និងមុខងារបុគ្គលិក', segments: [{ iteration: 1, startWeek: 14, durationWeeks: 2 }, { iteration: 2, startWeek: 16, durationWeeks: 2 }, { iteration: 3, startWeek: 18, durationWeeks: 4, label: '4W' }] },
    { id: 'wms-2', name: 'ការរចនាទម្រង់ស្កេនមុខ និង Geofencing', segments: [{ iteration: 1, startWeek: 16, durationWeeks: 2 }, { iteration: 3, startWeek: 18, durationWeeks: 6, label: '6W' }] },
    { id: 'wms-3', name: 'ការអភិវឌ្ឍប្រព័ន្ធ API វត្តមានប្រចាំថ្ងៃ', segments: [{ iteration: 1, startWeek: 18, durationWeeks: 3 }, { iteration: 2, startWeek: 21, durationWeeks: 2 }, { iteration: 3, startWeek: 23, durationWeeks: 7, label: '7W' }] },
    { id: 'wms-4', name: 'ការភ្ជាប់ប្រព័ន្ធគ្រប់គ្រងច្បាប់ និង OT', segments: [{ iteration: 1, startWeek: 22, durationWeeks: 2 }, { iteration: 3, startWeek: 24, durationWeeks: 5, label: '5W' }] },
    { id: 'wms-5', name: 'ការបង្កើតរបាយការណ៍វត្តមាន និង Export Excel', segments: [{ iteration: 2, startWeek: 25, durationWeeks: 3 }, { iteration: 3, startWeek: 28, durationWeeks: 6, label: '6W' }] },
    { id: 'wms-6', name: 'ការធ្វើតេស្តសាកល្បងលើ Mobile App', segments: [{ iteration: 1, startWeek: 28, durationWeeks: 2 }, { iteration: 2, startWeek: 30, durationWeeks: 2 }, { iteration: 3, startWeek: 32, durationWeeks: 5, label: '5W' }] },
    { id: 'wms-7', name: 'ការបណ្តុះបណ្តាលបុគ្គលិក និងដាក់ដំណើរការ', segments: [{ iteration: 1, startWeek: 33, durationWeeks: 2 }, { iteration: 3, startWeek: 35, durationWeeks: 4, label: '4W' }] },
];

const DEFAULT_EGOV_TASKS: AgilePlanTask[] = [
    { id: 'egov-1', name: 'ការសិក្សាលំហូរឯកសាររដ្ឋបាលឌីជីថល', segments: [{ iteration: 1, startWeek: 14, durationWeeks: 3 }, { iteration: 3, startWeek: 17, durationWeeks: 5, label: '5W' }] },
    { id: 'egov-2', name: 'ការរៀបចំច្រកចេញចូលតែមួយ One Window Service', segments: [{ iteration: 1, startWeek: 17, durationWeeks: 2 }, { iteration: 2, startWeek: 19, durationWeeks: 2 }, { iteration: 3, startWeek: 21, durationWeeks: 8, label: '8W' }] },
    { id: 'egov-3', name: 'ការតភ្ជាប់ទិន្នន័យអន្តរក្រសួង Data Exchange', segments: [{ iteration: 2, startWeek: 23, durationWeeks: 4 }, { iteration: 3, startWeek: 27, durationWeeks: 7, label: '7W' }] },
    { id: 'egov-4', name: 'ការផ្ទៀងផ្ទាត់អត្តសញ្ញាណ និង CamDigiKey', segments: [{ iteration: 1, startWeek: 26, durationWeeks: 3 }, { iteration: 3, startWeek: 29, durationWeeks: 6, label: '6W' }] },
    { id: 'egov-5', name: 'ការធ្វើតេស្តសុវត្ថិភាពទិន្នន័យសាធារណៈ UAT', segments: [{ iteration: 2, startWeek: 32, durationWeeks: 3 }, { iteration: 3, startWeek: 35, durationWeeks: 5, label: '5W' }] },
];

const INITIAL_PROJECTS: RoadmapProject[] = [
    { id: '1', code: 'PMS-V2', name: 'ប្រព័ន្ធគ្រប់គ្រងគម្រោងបច្ចេកវិទ្យា (PMS)', description: 'ប្រព័ន្ធគ្រប់គ្រងគម្រោងបច្ចេកវិទ្យា ការងារ ដំណាក់កាល និងកាលវិភាគការងាររបស់បុគ្គលិក', tasksCount: DEFAULT_PMS_TASKS.length },
    { id: '2', code: 'WMS-HR', name: 'ប្រព័ន្ធគ្រប់គ្រងវត្តមាន និងបុគ្គលិក (WMS)', description: 'ប្រព័ន្ធកត់ត្រាវត្តមាន ស្កេនមុខ និងគ្រប់គ្រងច្បាប់ឈប់សម្រាក', tasksCount: DEFAULT_WMS_TASKS.length },
    { id: '3', code: 'E-GOV', name: 'ប្រព័ន្ធច្រកចេញចូលតែមួយ (E-Gov Portal)', description: 'ប្រព័ន្ធផ្តល់សេវាសាធារណៈ និងឯកសាររដ្ឋបាលឌីជីថល', tasksCount: DEFAULT_EGOV_TASKS.length },
];

const ACTIVITIES: ActivityItem[] = [
    {
        id: 1,
        action: 'TASK_COMPLETED',
        title: 'Completed Task',
        description: 'Completed "Implement Refresh Token rotation & Cookie security"',
        type: 'task',
        icon: 'mdi:check-circle',
        actor: { id: 1, name: 'Current User', avatar: null },
        target: { id: 2, name: 'Refresh Token rotation', type: 'task' },
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
        id: 2,
        action: 'TASK_STATUS_UPDATED',
        title: 'Updated Task Status',
        description: 'Changed status of "Design high-fidelity UI components" to In Progress',
        type: 'task',
        icon: 'mdi:progress-clock',
        actor: { id: 1, name: 'Current User', avatar: null },
        target: { id: 1, name: 'Design high-fidelity UI', type: 'task' },
        created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    },
    {
        id: 3,
        action: 'PROJECT_JOINED',
        title: 'Joined Project',
        description: 'Assigned as Member in project "PMS Upgrade V2"',
        type: 'project',
        icon: 'mdi:folder-account',
        actor: { id: 1, name: 'Current User', avatar: null },
        target: { id: 'proj-001', name: 'PMS Upgrade V2', type: 'project' },
        created_at: new Date(Date.now() - 86400000).toISOString(),
    },
];

@Injectable()
export class ActivityService {
    // In-memory cache synced with database
    private userProjectsMap: { [userId: number]: RoadmapProject[] } = {};
    private userTasksMap: { [userId: number]: { [projectId: string]: AgilePlanTask[] } } = {};
    private userActivitiesMap: { [userId: number]: ActivityItem[] } = {};
    private isDbLoaded = false;

    constructor(
        @InjectRepository(ActivityStore)
        private readonly _activityStoreRepo: Repository<ActivityStore>,
    ) {
        this.initDbStore();
    }

    private async ensureTableExists(): Promise<void> {
        try {
            await this._activityStoreRepo.query(`
                CREATE SCHEMA IF NOT EXISTS "user";
                CREATE TABLE IF NOT EXISTS "user"."activity_store" (
                    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    "key" VARCHAR(255) NOT NULL DEFAULT 'default_activities_store',
                    "projects" JSONB NULL DEFAULT '[]'::jsonb,
                    "tasks_map" JSONB NULL DEFAULT '{}'::jsonb,
                    "activities" JSONB NULL DEFAULT '[]'::jsonb,
                    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
                );
                CREATE UNIQUE INDEX IF NOT EXISTS "IDX_activity_store_key" ON "user"."activity_store" ("key");
            `);
        } catch (e: any) {
            // Already exists or schema created
        }
    }

    private async initDbStore(): Promise<void> {
        await this.ensureTableExists();
        try {
            const dbStore = await this._activityStoreRepo.findOne({ where: { key: 'default_activities_store' } });
            if (dbStore) {
                if (dbStore.projects && typeof dbStore.projects === 'object') {
                    this.userProjectsMap = dbStore.projects;
                }
                if (dbStore.tasks_map && typeof dbStore.tasks_map === 'object') {
                    this.userTasksMap = dbStore.tasks_map;
                }
                if (dbStore.activities && typeof dbStore.activities === 'object') {
                    this.userActivitiesMap = dbStore.activities;
                }
            } else {
                this.ensureUserData(1);
                await this.saveToDb();
            }
            this.isDbLoaded = true;
        } catch (err) {
            console.warn('Could not load activity store from DB, using defaults:', err);
        }
    }

    private async ensureLoaded(): Promise<void> {
        if (!this.isDbLoaded) {
            await this.initDbStore();
        }
    }

    private async saveToDb(): Promise<void> {
        try {
            let dbStore = await this._activityStoreRepo.findOne({ where: { key: 'default_activities_store' } });
            if (!dbStore) {
                dbStore = this._activityStoreRepo.create({
                    key: 'default_activities_store',
                    projects: this.userProjectsMap,
                    tasks_map: this.userTasksMap,
                    activities: this.userActivitiesMap,
                });
            } else {
                dbStore.projects = this.userProjectsMap;
                dbStore.tasks_map = this.userTasksMap;
                dbStore.activities = this.userActivitiesMap;
            }
            await this._activityStoreRepo.save(dbStore);
        } catch (err) {
            console.error('Failed to save activity store to DB:', err);
        }
    }

    private ensureUserData(userId: number) {
        if (!this.userProjectsMap[userId] || !Array.isArray(this.userProjectsMap[userId]) || this.userProjectsMap[userId].length === 0) {
            this.userProjectsMap[userId] = JSON.parse(JSON.stringify(INITIAL_PROJECTS));
        }
        if (!this.userTasksMap[userId] || Object.keys(this.userTasksMap[userId]).length === 0) {
            this.userTasksMap[userId] = {
                '1': JSON.parse(JSON.stringify(DEFAULT_PMS_TASKS)),
                '2': JSON.parse(JSON.stringify(DEFAULT_WMS_TASKS)),
                '3': JSON.parse(JSON.stringify(DEFAULT_EGOV_TASKS)),
            };
        }
        if (!this.userActivitiesMap[userId] || !Array.isArray(this.userActivitiesMap[userId]) || this.userActivitiesMap[userId].length === 0) {
            this.userActivitiesMap[userId] = JSON.parse(JSON.stringify(ACTIVITIES));
        }
    }

    async getActivities(user: UserPayload, query: QueryActivityDto) {
        await this.ensureLoaded();
        const uId = user?.id || 1;
        this.ensureUserData(uId);

        let list = [...(this.userActivitiesMap[uId] || [])];

        if (query.type && query.type !== 'all') {
            list = list.filter((a) => a.type === query.type);
        }

        const limit = query.limit ? parseInt(query.limit, 10) : 20;
        const offset = query.offset ? parseInt(query.offset, 10) : 0;
        const paginated = list.slice(offset, offset + limit);

        return {
            status_code: 200,
            message: 'Activities retrieved successfully',
            data: {
                results: paginated,
                total: list.length,
                limit,
                offset,
            },
        };
    }

    async createActivity(user: UserPayload, dto: CreateActivityDto) {
        await this.ensureLoaded();
        const uId = user?.id || 1;
        this.ensureUserData(uId);

        const item: ActivityItem = {
            id: Date.now(),
            action: dto.action,
            title: dto.title,
            description: dto.description || '',
            type: dto.type || 'task',
            icon: dto.icon || 'mdi:check-circle',
            actor: {
                id: uId,
                name: user?.name_en || user?.name_kh || 'Current User',
                avatar: null,
            },
            created_at: new Date().toISOString(),
        };

        if (!this.userActivitiesMap[uId]) {
            this.userActivitiesMap[uId] = [];
        }
        this.userActivitiesMap[uId].unshift(item);
        await this.saveToDb();

        return {
            status_code: 201,
            message: 'Activity recorded successfully',
            data: item,
        };
    }

    async getRoadmapData(user: UserPayload) {
        await this.ensureLoaded();
        const uId = user?.id || 1;
        this.ensureUserData(uId);

        return {
            status_code: 200,
            message: 'Roadmap data retrieved successfully',
            data: {
                projects: this.userProjectsMap[uId],
                tasksMap: this.userTasksMap[uId],
            },
        };
    }

    async createRoadmapProject(user: UserPayload, dto: CreateRoadmapProjectDto) {
        await this.ensureLoaded();
        const uId = user?.id || 1;
        this.ensureUserData(uId);

        const newProject: RoadmapProject = {
            id: dto.id || `proj-${Date.now()}`,
            code: dto.code.toUpperCase(),
            name: dto.name,
            description: dto.description || 'ផែនការអនុវត្តគម្រោង និងកាលវិភាគ Agile',
            tasksCount: 1,
        };

        const starterTask: AgilePlanTask = {
            id: `task-${Date.now()}`,
            name: `ដំណាក់កាលទី ១ នៃ ${newProject.name}`,
            segments: [{ iteration: 1, startWeek: 14, durationWeeks: 3, label: '3W' }],
        };

        if (!this.userProjectsMap[uId]) {
            this.userProjectsMap[uId] = [];
        }
        this.userProjectsMap[uId].unshift(newProject);

        if (!this.userTasksMap[uId]) {
            this.userTasksMap[uId] = {};
        }
        this.userTasksMap[uId][newProject.id] = [starterTask];

        await this.saveToDb();

        return {
            status_code: 201,
            message: 'Roadmap project created successfully',
            data: {
                project: newProject,
                starterTask,
            },
        };
    }

    async createRoadmapTask(user: UserPayload, dto: CreateRoadmapTaskDto) {
        await this.ensureLoaded();
        const uId = user?.id || 1;
        this.ensureUserData(uId);

        const projectId = String(dto.project_id);
        const newTask: AgilePlanTask = {
            id: dto.id || `task-${Date.now()}`,
            name: dto.name,
            segments: dto.segments as AgilePlanSegment[],
        };

        if (!this.userTasksMap[uId]) {
            this.userTasksMap[uId] = {};
        }
        if (!this.userTasksMap[uId][projectId]) {
            this.userTasksMap[uId][projectId] = [];
        }

        this.userTasksMap[uId][projectId].unshift(newTask);

        const proj = this.userProjectsMap[uId]?.find((p) => String(p.id) === projectId);
        if (proj) {
            proj.tasksCount = this.userTasksMap[uId][projectId].length;
        }

        await this.saveToDb();

        return {
            status_code: 201,
            message: 'Roadmap task added successfully',
            data: {
                task: newTask,
                projectId,
            },
        };
    }

    async deleteRoadmapTask(user: UserPayload, taskId: string, projectId: string) {
        await this.ensureLoaded();
        const uId = user?.id || 1;
        this.ensureUserData(uId);

        const pId = String(projectId);
        if (this.userTasksMap[uId] && this.userTasksMap[uId][pId]) {
            this.userTasksMap[uId][pId] = this.userTasksMap[uId][pId].filter((t) => t.id !== taskId);
            const proj = this.userProjectsMap[uId]?.find((p) => String(p.id) === pId);
            if (proj) {
                proj.tasksCount = this.userTasksMap[uId][pId].length;
            }
            await this.saveToDb();
        }

        return {
            status_code: 200,
            message: 'Roadmap task deleted successfully',
        };
    }
}
