import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { env } from 'envs/env';
import { Observable } from 'rxjs';

export interface BackendPlannerSchedule {
    id: string;
    title: string;
    time: string;
    date?: string;
    start_date?: string;
    end_date?: string;
    day_index: number;
    start_day_index?: number;
    end_day_index?: number;
    start_time?: string;
    end_time?: string;
    category: 'work' | 'myself' | 'breaks' | string;
    type: string;
    color_theme: 'peach' | 'lavender' | 'pink' | 'mint' | string;
    top_position: number;
    height: number;
    members: Array<{
        id?: string | number;
        name: string;
        role?: string;
        initials: string;
        avatar?: string | null;
        bg: string;
    }>;
    extra_count: number;
    note?: string;
    plan_id?: string;
    plan_name?: string;
    created_by?: number | string;
    created_by_name?: string;
    created_at?: string;
    updated_at?: string;
}

export interface PlannerTeamMember {
    id: string | number;
    name: string;
    role: string;
    initials: string;
    avatar?: string | null;
    bg: string;
}

export interface PlannerListResponse {
    status_code: number;
    message: string;
    data: {
        results: BackendPlannerSchedule[];
        total: number;
        counts: {
            all: number;
            work: number;
            myself: number;
            breaks: number;
        };
    };
}

@Injectable({
    providedIn: 'root',
})
export class PlannerService {
    private readonly _http = inject(HttpClient);
    private readonly baseUrl = `${env.API_BASE_URL}/user/planner`;

    // =========================================================================
    // 1. GET SCHEDULES
    // =========================================================================
    getSchedules(params?: { category?: string; search?: string; admin?: string; scope?: string }): Observable<PlannerListResponse> {
        return this._http.get<PlannerListResponse>(this.baseUrl, {
            params: params as Record<string, string>,
            withCredentials: true,
        });
    }

    // =========================================================================
    // 2. GET SCHEDULE BY ID
    // =========================================================================
    getScheduleById(id: string): Observable<{ status_code: number; data: BackendPlannerSchedule }> {
        return this._http.get<{ status_code: number; data: BackendPlannerSchedule }>(`${this.baseUrl}/${id}`, {
            withCredentials: true,
        });
    }

    // =========================================================================
    // 3. CREATE SCHEDULE
    // =========================================================================
    createSchedule(payload: Partial<BackendPlannerSchedule>): Observable<{ status_code: number; message: string; data: BackendPlannerSchedule }> {
        return this._http.post<{ status_code: number; message: string; data: BackendPlannerSchedule }>(this.baseUrl, payload, {
            withCredentials: true,
        });
    }

    // =========================================================================
    // 4. UPDATE SCHEDULE
    // =========================================================================
    updateSchedule(id: string, payload: Partial<BackendPlannerSchedule>): Observable<{ status_code: number; message: string; data: BackendPlannerSchedule }> {
        return this._http.patch<{ status_code: number; message: string; data: BackendPlannerSchedule }>(`${this.baseUrl}/${id}`, payload, {
            withCredentials: true,
        });
    }

    // =========================================================================
    // 5. DELETE SCHEDULE
    // =========================================================================
    deleteSchedule(id: string): Observable<{ status_code: number; message: string; data: { id: string } }> {
        return this._http.delete<{ status_code: number; message: string; data: { id: string } }>(`${this.baseUrl}/${id}`, {
            withCredentials: true,
        });
    }

    // =========================================================================
    // 6. GET TEAM MEMBERS
    // =========================================================================
    getTeamMembers(): Observable<{ status_code: number; data: PlannerTeamMember[] }> {
        return this._http.get<{ status_code: number; data: PlannerTeamMember[] }>(`${this.baseUrl}/members`, {
            withCredentials: true,
        });
    }
}
