// ===========================================================================>> Core Library
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// ===========================================================================>> Custom Library
import { UserPayload } from 'src/app/interface/jwt.interface';
import { isAdminOrSuperAdmin } from 'src/app/common/utils/access.util';
import { ActivityStore } from 'src/app/model/user/activity-store.entity';
import { ProjectEntity } from 'src/app/model/project/project.entity';

import {
    CreateActivityDto,
    CreateRoadmapProjectDto,
    CreateRoadmapTaskDto,
    QueryActivityDto,
    SelectRoadmapProjectDto,
} from './activity.dto';

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



@Injectable()
export class ActivityService {
    // In-memory cache synced with database
    private userProjectsMap: { [userId: string]: RoadmapProject[] } = {};
    private userTasksMap: { [userId: string]: { [projectId: string]: AgilePlanTask[] } } = {};
    private userActivitiesMap: { [userId: string]: ActivityItem[] } = {};
    private userSelectedProjectMap: { [userId: string]: string } = {};
    private isDbLoaded = false;

    constructor(
        @InjectRepository(ActivityStore)
        private readonly _activityStoreRepo: Repository<ActivityStore>,
        @InjectRepository(ProjectEntity)
        private readonly _projectRepo: Repository<ProjectEntity>,
    ) {
        this.initDbStore();
    }

    private async ensureTableExists(): Promise<void> {
        try {
            await this._activityStoreRepo.query(`
                CREATE EXTENSION IF NOT EXISTS "pgcrypto";
                CREATE SCHEMA IF NOT EXISTS "user";
                CREATE TABLE IF NOT EXISTS "user"."activity_store" (
                    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    "key" VARCHAR(255) NOT NULL DEFAULT 'default_activities_store',
                    "projects" JSONB NULL DEFAULT '[]'::jsonb,
                    "tasks_map" JSONB NULL DEFAULT '{}'::jsonb,
                    "activities" JSONB NULL DEFAULT '[]'::jsonb,
                    "selected_project_ids" JSONB NULL DEFAULT '{}'::jsonb,
                    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
                );
                CREATE UNIQUE INDEX IF NOT EXISTS "IDX_activity_store_key" ON "user"."activity_store" ("key");
            `);
        } catch (e: any) {
            // Table or index already exists
        }
    }

    private async initDbStore(): Promise<void> {
        await this.ensureTableExists();
        try {
            const dbStore = await this._activityStoreRepo.findOne({ where: { key: 'default_activities_store' } });
            if (dbStore) {
                if (dbStore.projects && typeof dbStore.projects === 'object') {
                    this.userProjectsMap = { ...this.userProjectsMap, ...dbStore.projects };
                }
                if (dbStore.tasks_map && typeof dbStore.tasks_map === 'object') {
                    this.userTasksMap = { ...this.userTasksMap, ...dbStore.tasks_map };
                }
                if (dbStore.activities && typeof dbStore.activities === 'object') {
                    this.userActivitiesMap = { ...this.userActivitiesMap, ...dbStore.activities };
                }
                if (dbStore.selected_project_ids && typeof dbStore.selected_project_ids === 'object') {
                    this.userSelectedProjectMap = { ...this.userSelectedProjectMap, ...dbStore.selected_project_ids };
                }
            } else {
                await this.ensureUserData('1');
                await this.ensureUserData('2');
                await this.saveToDb();
            }
            this.isDbLoaded = true;
        } catch (err) {
            console.warn('Could not load activity store from DB:', err);
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
            const projectsJson = JSON.stringify(this.userProjectsMap);
            const tasksMapJson = JSON.stringify(this.userTasksMap);
            const activitiesJson = JSON.stringify(this.userActivitiesMap);
            const selectedIdsJson = JSON.stringify(this.userSelectedProjectMap);

            await this._activityStoreRepo.query(
                `
                INSERT INTO "user"."activity_store" ("key", "projects", "tasks_map", "activities", "selected_project_ids", "updated_at")
                VALUES ('default_activities_store', $1::jsonb, $2::jsonb, $3::jsonb, $4::jsonb, now())
                ON CONFLICT ("key") DO UPDATE SET
                    "projects" = EXCLUDED."projects",
                    "tasks_map" = EXCLUDED."tasks_map",
                    "activities" = EXCLUDED."activities",
                    "selected_project_ids" = EXCLUDED."selected_project_ids",
                    "updated_at" = now();
                `,
                [projectsJson, tasksMapJson, activitiesJson, selectedIdsJson],
            );
        } catch (err) {
            console.error('Failed to save activity store to DB:', err);
        }
    }

    private isAdmin(user?: UserPayload): boolean {
        return isAdminOrSuperAdmin(user);
    }

    private async getUserAssignedProjects(user?: UserPayload): Promise<RoadmapProject[]> {
        if (!user) return [];
        try {
            const dbProjects = await this._projectRepo.find({ order: { created_at: 'ASC' } });
            const uId = String(user.id || '');
            const numUId = Number(user.id || 0);
            const uEmail = (user.email || '').toLowerCase().trim();
            const uPhone = (user.phone || '').replace(/\D/g, '');

            const assigned = dbProjects.filter((p: any) => {
                const leadId = p.lead?.id || p.team_lead?.id;
                if (leadId && String(leadId) === uId) return true;
                const leadPhone = String(p.lead?.phone || p.team_lead?.phone || '').replace(/\D/g, '');
                if (leadPhone && uPhone && (leadPhone === uPhone || leadPhone.slice(-8) === uPhone.slice(-8))) return true;

                const members = Array.isArray(p.members) ? p.members : [];
                return members.some((m: any) => {
                    if (!m) return false;
                    const mId = Number(m.user_id || m.id || 0);
                    if (mId && numUId && mId === numUId) return true;

                    if (m.phone && uPhone) {
                        const cleanMPhone = String(m.phone).replace(/\D/g, '');
                        if (cleanMPhone === uPhone || (cleanMPhone.length >= 8 && cleanMPhone.slice(-8) === uPhone.slice(-8))) {
                            return true;
                        }
                    }

                    if (m.email && uEmail && String(m.email).toLowerCase().trim() === uEmail) {
                        return true;
                    }

                    return false;
                });
            });

            return assigned.map((p: any) => ({
                id: String(p.id || p.code),
                code: p.code || 'PROJ',
                name: p.name,
                description: p.description || '',
                tasksCount: p.total_tasks || 0,
            }));
        } catch (e) {
            console.warn('Failed to load user assigned projects from DB for activity roadmap:', e);
            return [];
        }
    }

    private async ensureUserData(userId: string | number, user?: UserPayload) {
        const uId = String(userId || '1');
        let needsSave = false;
        const isUserAdmin = user ? this.isAdmin(user) : false;

        if (isUserAdmin) {
            if (!this.userProjectsMap[uId] || !Array.isArray(this.userProjectsMap[uId]) || this.userProjectsMap[uId].length === 0) {
                try {
                    const dbProjects = await this._projectRepo.find({ order: { created_at: 'ASC' } });
                    this.userProjectsMap[uId] = dbProjects.map((p) => ({
                        id: String(p.id || p.code),
                        code: p.code || 'PROJ',
                        name: p.name,
                        description: p.description || '',
                        tasksCount: p.total_tasks || 0,
                    }));
                } catch (e) {
                    this.userProjectsMap[uId] = [];
                }
                needsSave = true;
            }
        } else {
            const assigned = await this.getUserAssignedProjects(user);
            this.userProjectsMap[uId] = assigned;
            needsSave = true;
        }

        if (!this.userTasksMap[uId]) {
            this.userTasksMap[uId] = {};
            needsSave = true;
        }
        if (!this.userActivitiesMap[uId] || !Array.isArray(this.userActivitiesMap[uId])) {
            this.userActivitiesMap[uId] = [];
            needsSave = true;
        }

        if (isUserAdmin) {
            if (!this.userSelectedProjectMap[uId]) {
                const firstProj = this.userProjectsMap[uId]?.[0]?.id;
                this.userSelectedProjectMap[uId] = firstProj ? String(firstProj) : '1';
                needsSave = true;
            }
        } else {
            const currentSelected = this.userSelectedProjectMap[uId];
            const hasMatch = this.userProjectsMap[uId]?.some((p) => String(p.id) === String(currentSelected));
            if (!hasMatch) {
                const firstProj = this.userProjectsMap[uId]?.[0]?.id;
                this.userSelectedProjectMap[uId] = firstProj ? String(firstProj) : '';
                needsSave = true;
            }
        }

        if (needsSave) {
            await this.saveStore();
        }
    }

    async getActivities(user: UserPayload, query: QueryActivityDto) {
        await this.ensureLoaded();
        const uId = String(user?.id || 1);
        await this.ensureUserData(uId, user);

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
        const uId = String(user?.id || 1);
        await this.ensureUserData(uId, user);

        const item: ActivityItem = {
            id: Date.now(),
            action: dto.action,
            title: dto.title,
            description: dto.description || '',
            type: dto.type || 'task',
            icon: dto.icon || 'mdi:check-circle',
            actor: {
                id: Number(uId),
                name: user?.name_en || user?.name_kh || 'Current User',
                avatar: null,
            },
            created_at: new Date().toISOString(),
        };

        if (!this.userActivitiesMap[uId]) {
            this.userActivitiesMap[uId] = [];
        }
        this.userActivitiesMap[uId].unshift(item);
        await this.saveStore();

        return {
            status_code: 201,
            message: 'Activity recorded successfully',
            data: item,
        };
    }

    async getRoadmapData(user: UserPayload) {
        await this.ensureLoaded();
        const uId = String(user?.id || 1);
        await this.ensureUserData(uId, user);

        return {
            status_code: 200,
            message: 'Roadmap data retrieved successfully',
            data: {
                projects: this.userProjectsMap[uId] || [],
                tasksMap: this.userTasksMap[uId] || {},
                selectedProjectId: this.userSelectedProjectMap[uId] || '',
            },
        };
    }

    async selectRoadmapProject(user: UserPayload, dto: SelectRoadmapProjectDto) {
        await this.ensureLoaded();
        const uId = String(user?.id || 1);
        await this.ensureUserData(uId, user);

        const targetId = String(dto.project_id || dto.projectId || '1');
        this.userSelectedProjectMap[uId] = targetId;
        await this.saveStore();

        return {
            status_code: 200,
            message: 'Project selected successfully',
            data: {
                selectedProjectId: this.userSelectedProjectMap[uId],
            },
        };
    }

    async createRoadmapProject(user: UserPayload, dto: CreateRoadmapProjectDto) {
        await this.ensureLoaded();
        const uId = String(user?.id || 1);
        await this.ensureUserData(uId, user);

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
        // Avoid duplicate project with same id
        this.userProjectsMap[uId] = this.userProjectsMap[uId].filter((p) => String(p.id) !== String(newProject.id));
        this.userProjectsMap[uId].unshift(newProject);

        if (!this.userTasksMap[uId]) {
            this.userTasksMap[uId] = {};
        }
        this.userTasksMap[uId][newProject.id] = [starterTask];
        this.userSelectedProjectMap[uId] = newProject.id;

        await this.saveStore();

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
        const uId = String(user?.id || 1);
        await this.ensureUserData(uId, user);

        const projectId = String(dto.project_id || dto.projectId || '1');
        const rawSegments = Array.isArray(dto.segments) ? dto.segments : [];
        const sanitizedSegments: AgilePlanSegment[] = rawSegments.map((s: any) => {
            const iter = Number(s.iteration) || 1;
            const start = Number(s.startWeek !== undefined ? s.startWeek : s.start_week) || 14;
            const duration = Number(s.durationWeeks !== undefined ? s.durationWeeks : s.duration_weeks) || 1;
            return {
                iteration: (iter === 2 ? 2 : iter === 3 ? 3 : 1) as 1 | 2 | 3,
                startWeek: start,
                durationWeeks: duration,
                label: s.label || (duration > 1 ? `${duration}W` : undefined),
            };
        });

        const newTask: AgilePlanTask = {
            id: dto.id || `task-${Date.now()}`,
            name: dto.name,
            segments: sanitizedSegments,
        };

        if (!this.userTasksMap[uId]) {
            this.userTasksMap[uId] = {};
        }
        if (!this.userTasksMap[uId][projectId]) {
            this.userTasksMap[uId][projectId] = [];
        }

        // Avoid duplicate task with same id
        this.userTasksMap[uId][projectId] = this.userTasksMap[uId][projectId].filter((t) => t.id !== newTask.id);
        this.userTasksMap[uId][projectId].unshift(newTask);

        const proj = this.userProjectsMap[uId]?.find((p) => String(p.id) === projectId);
        if (proj) {
            proj.tasksCount = this.userTasksMap[uId][projectId].length;
        }

        await this.saveStore();

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
        const uId = String(user?.id || 1);
        await this.ensureUserData(uId, user);

        const pId = String(projectId);
        if (this.userTasksMap[uId] && this.userTasksMap[uId][pId]) {
            this.userTasksMap[uId][pId] = this.userTasksMap[uId][pId].filter((t) => t.id !== taskId);
            const proj = this.userProjectsMap[uId]?.find((p) => String(p.id) === pId);
            if (proj) {
                proj.tasksCount = this.userTasksMap[uId][pId].length;
            }
            await this.saveStore();
        }

        return {
            status_code: 200,
            message: 'Roadmap task deleted successfully',
        };
    }
}
