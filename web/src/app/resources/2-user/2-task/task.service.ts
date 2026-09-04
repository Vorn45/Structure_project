import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { env } from 'envs/env';
import { Observable } from 'rxjs';

export type TaskStatus =
    | 'new'
    | 'pending'
    | 'confirmed'
    | 'unconfirmed'
    | 'todo'
    | 'in_progress'
    | 'in_review'
    | 'review'
    | 'reopened'
    | 'done'
    | 'completed'
    | string;

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskItem {
    id: number;
    code?: string;
    title: string;
    description: string;
    module?: string;
    status: TaskStatus;
    priority: TaskPriority;
    progress: number;
    comments_count?: number;
    attachments_count?: number;
    due_date: string | null;
    project_id: string;
    project_name: string;
    reporter?: {
        id: number;
        name: string;
        avatar?: string | null;
        role?: string;
    };
    assignee: {
        id: number;
        name: string;
        avatar?: string | null;
        role?: string;
        email?: string;
    };
    assignees?: Array<{
        id: number;
        name: string;
        avatar?: string | null;
        role?: string;
        email?: string;
    }>;
    created_at: string;
    updated_at: string;
}

export interface TaskListResponse {
    status_code: number;
    message: string;
    data: {
        results: TaskItem[];
        total: number;
        limit: number;
        offset: number;
        counts: {
            all: number;
            new?: number;
            confirmed?: number;
            unconfirmed?: number;
            in_progress?: number;
            in_review?: number;
            reopened?: number;
            done?: number;
            todo?: number;
        };
    };
}

@Injectable({ providedIn: 'root' })
export class UserTaskService {
    private readonly baseUrl = `${env.API_BASE_URL}/user/task`;

    constructor(private readonly _http: HttpClient) {}

    getTasks(params?: { search?: string; status?: string; priority?: string; project_id?: string }): Observable<TaskListResponse> {
        let httpParams = new HttpParams();
        if (params?.search && params.search.trim()) {
            httpParams = httpParams.set('search', params.search.trim());
        }
        if (params?.status && params.status !== 'all') {
            httpParams = httpParams.set('status', params.status);
        }
        if (params?.priority && params.priority !== 'all') {
            httpParams = httpParams.set('priority', params.priority);
        }
        if (params?.project_id) {
            httpParams = httpParams.set('project_id', params.project_id);
        }

        return this._http.get<TaskListResponse>(this.baseUrl, {
            params: httpParams,
            withCredentials: true,
        });
    }

    getTaskById(id: number): Observable<{ status_code: number; data: TaskItem }> {
        return this._http.get<{ status_code: number; data: TaskItem }>(`${this.baseUrl}/${id}`, {
            withCredentials: true,
        });
    }

    createTask(payload: Partial<TaskItem>): Observable<{ status_code: number; data: TaskItem }> {
        return this._http.post<{ status_code: number; data: TaskItem }>(this.baseUrl, payload, {
            withCredentials: true,
        });
    }

    updateTask(id: number, payload: Partial<TaskItem>): Observable<{ status_code: number; data: TaskItem }> {
        return this._http.patch<{ status_code: number; data: TaskItem }>(`${this.baseUrl}/${id}`, payload, {
            withCredentials: true,
        });
    }

    deleteTask(id: number): Observable<{ status_code: number; message: string }> {
        return this._http.delete<{ status_code: number; message: string }>(`${this.baseUrl}/${id}`, {
            withCredentials: true,
        });
    }

    getTaskComments(id: number): Observable<{ status_code: number; data: { comments: any[] } }> {
        return this._http.get<{ status_code: number; data: { comments: any[] } }>(`${this.baseUrl}/${id}/comments`, {
            withCredentials: true,
        });
    }

    createTaskComment(id: number, payload: { text: string; attachments?: any[] }): Observable<{ status_code: number; data: any }> {
        return this._http.post<{ status_code: number; data: any }>(`${this.baseUrl}/${id}/comments`, payload, {
            withCredentials: true,
        });
    }
}
