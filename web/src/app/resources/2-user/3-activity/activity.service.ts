import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { env } from 'envs/env';
import { Observable } from 'rxjs';

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
}
