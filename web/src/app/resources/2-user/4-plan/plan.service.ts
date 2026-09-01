import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { env } from 'envs/env';
import { Observable } from 'rxjs';

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

export interface PlanListResponse {
    status_code: number;
    message: string;
    data: {
        results: ProjectPlanItem[];
        total: number;
        limit: number;
        offset: number;
    };
}

@Injectable({ providedIn: 'root' })
export class UserPlanService {
    private readonly baseUrl = `${env.API_BASE_URL}/user/plan`;

    constructor(private readonly _http: HttpClient) {}

    getPlans(params?: { search?: string; status?: string }): Observable<PlanListResponse> {
        return this._http.get<PlanListResponse>(this.baseUrl, {
            params: params as Record<string, string>,
            withCredentials: true,
        });
    }

    getPlanById(id: string): Observable<{ status_code: number; data: ProjectPlanItem }> {
        return this._http.get<{ status_code: number; data: ProjectPlanItem }>(`${this.baseUrl}/${id}`, {
            withCredentials: true,
        });
    }
}
