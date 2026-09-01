import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { env } from 'envs/env';
import { Observable } from 'rxjs';

export interface TaskItem {
    id: number;
    title: string;
    description: string;
    status: 'todo' | 'in_progress' | 'in_review' | 'done';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    progress: number;
    due_date: string | null;
    project_id: string;
    project_name: string;
    assignee: {
        id: number;
        name: string;
        avatar?: string | null;
    };
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
            todo: number;
            in_progress: number;
            in_review: number;
            done: number;
        };
    };
}

@Injectable({ providedIn: 'root' })
export class UserTaskService {
    private readonly baseUrl = `${env.API_BASE_URL}/user/task`;

    constructor(private readonly _http: HttpClient) {}

    getTasks(params?: { search?: string; status?: string; priority?: string; project_id?: string }): Observable<TaskListResponse> {
        return this._http.get<TaskListResponse>(this.baseUrl, {
            params: params as Record<string, string>,
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
}
