import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { env } from 'envs/env';
import { Observable } from 'rxjs';
import { AgilePlanTask } from './activity.component';
import { ProjectPlanOption } from './select-project-plan-dialog.component';

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

export interface ActivityListResponse {
    status_code: number;
    message: string;
    data: {
        results: ActivityItem[];
        total: number;
        limit: number;
        offset: number;
    };
}

export interface RoadmapDataResponse {
    status_code: number;
    message: string;
    data: {
        projects: ProjectPlanOption[];
        tasksMap: { [projectId: string]: AgilePlanTask[] };
    };
}

@Injectable({ providedIn: 'root' })
export class UserActivityService {
    private readonly baseUrl = `${env.API_BASE_URL}/user/activity`;

    constructor(private readonly _http: HttpClient) {}

    getActivities(params?: { type?: string; project_id?: string }): Observable<ActivityListResponse> {
        return this._http.get<ActivityListResponse>(this.baseUrl, {
            params: params as Record<string, string>,
            withCredentials: true,
        });
    }

    getRoadmap(): Observable<RoadmapDataResponse> {
        return this._http.get<RoadmapDataResponse>(`${this.baseUrl}/roadmap`, {
            withCredentials: true,
        });
    }

    createRoadmapProject(project: { id?: string; code: string; name: string; description?: string }): Observable<any> {
        return this._http.post(`${this.baseUrl}/roadmap/project`, project, {
            withCredentials: true,
        });
    }

    createRoadmapTask(taskData: { id?: string; project_id: string; name: string; segments: any[] }): Observable<any> {
        return this._http.post(`${this.baseUrl}/roadmap/task`, taskData, {
            withCredentials: true,
        });
    }

    deleteRoadmapTask(taskId: string, projectId: string): Observable<any> {
        return this._http.delete(`${this.baseUrl}/roadmap/task/${taskId}`, {
            params: { project_id: projectId },
            withCredentials: true,
        });
    }
}
