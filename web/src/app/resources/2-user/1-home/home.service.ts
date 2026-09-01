import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { env } from 'envs/env';
import { Observable } from 'rxjs';

export interface HomeOverviewData {
    user: {
        id: number;
        name_en: string;
        name_kh: string;
        email?: string;
        phone?: string;
        avatar?: any;
        active_role_id: number;
        organization_id?: string | null;
    };
    metrics: {
        total_tasks: number;
        pending_tasks: number;
        in_progress_tasks: number;
        completed_tasks: number;
        overdue_tasks: number;
        high_priority: number;
        medium_priority: number;
        low_priority: number;
        completion_rate: number;
    };
    recent_tasks: Array<{
        id: number;
        title: string;
        status: string;
        priority: string;
        due_date: string;
        progress: number;
        project_name: string;
    }>;
    active_projects: Array<{
        id: string;
        name: string;
        total_tasks: number;
        completed_tasks: number;
        progress: number;
        members_count: number;
        status: string;
    }>;
}

export interface HomeStatsData {
    tasks_summary: {
        todo: number;
        in_progress: number;
        review: number;
        done: number;
    };
    weekly_activity: Array<{
        day: string;
        completed: number;
        created: number;
    }>;
}

@Injectable({ providedIn: 'root' })
export class UserHomeService {
    private readonly baseUrl = `${env.API_BASE_URL}/user/home`;

    constructor(private readonly _http: HttpClient) {}

    getOverview(): Observable<{ status_code: number; data: HomeOverviewData }> {
        return this._http.get<{ status_code: number; data: HomeOverviewData }>(
            `${this.baseUrl}/overview`,
            { withCredentials: true }
        );
    }

    getStats(): Observable<{ status_code: number; data: HomeStatsData }> {
        return this._http.get<{ status_code: number; data: HomeStatsData }>(
            `${this.baseUrl}/stats`,
            { withCredentials: true }
        );
    }
}
