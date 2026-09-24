import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { env } from 'envs/env';
import { Observable, shareReplay } from 'rxjs';
import { TaskMember } from './models/task.types';

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
    id: number | string;
    code?: string;
    title: string;
    description: string;
    module?: string;
    task_type?: string;
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
    private _projectsCache$: Observable<{ status_code: number; message: string; data: any[] }> | null = null;
    private _membersCache$: Observable<{ status_code: number; message: string; data: TaskMember[] }> | null = null;

    constructor(private readonly _http: HttpClient) {}

    getProjects(forceRefresh = false): Observable<{ status_code: number; message: string; data: any[] }> {
        if (forceRefresh || !this._projectsCache$) {
            this._projectsCache$ = this._http
                .get<{ status_code: number; message: string; data: any[] }>(`${this.baseUrl}/projects`, {
                    withCredentials: true,
                })
                .pipe(shareReplay({ bufferSize: 1, refCount: false }));
        }
        return this._projectsCache$;
    }

    getMembers(forceRefresh = false): Observable<{ status_code: number; message: string; data: TaskMember[] }> {
        if (forceRefresh || !this._membersCache$) {
            this._membersCache$ = this._http
                .get<{ status_code: number; message: string; data: TaskMember[] }>(`${this.baseUrl}/members`, {
                    withCredentials: true,
                })
                .pipe(shareReplay({ bufferSize: 1, refCount: false }));
        }
        return this._membersCache$;
    }

    clearCache(): void {
        this._projectsCache$ = null;
        this._membersCache$ = null;
    }

    getTasks(params?: { search?: string; status?: string; priority?: string; project_id?: string; member_id?: string; scope?: string }): Observable<TaskListResponse> {
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
        if (params?.project_id && params.project_id !== 'all') {
            httpParams = httpParams.set('project_id', params.project_id);
        }
        if (params?.member_id && params.member_id !== 'all') {
            httpParams = httpParams.set('member_id', params.member_id);
        }
        if (params?.scope) {
            httpParams = httpParams.set('scope', params.scope);
        }

        return this._http.get<TaskListResponse>(this.baseUrl, {
            params: httpParams,
            withCredentials: true,
        });
    }

    getTaskById(id: number | string): Observable<{ status_code: number; data: TaskItem }> {
        return this._http.get<{ status_code: number; data: TaskItem }>(`${this.baseUrl}/${id}`, {
            withCredentials: true,
        });
    }

    createTask(payload: Partial<TaskItem>): Observable<{ status_code: number; data: TaskItem }> {
        return this._http.post<{ status_code: number; data: TaskItem }>(this.baseUrl, payload, {
            withCredentials: true,
        });
    }

    updateTask(id: number | string, payload: Partial<TaskItem>): Observable<{ status_code: number; data: TaskItem }> {
        return this._http.patch<{ status_code: number; data: TaskItem }>(`${this.baseUrl}/${id}`, payload, {
            withCredentials: true,
        });
    }

    deleteTask(id: number | string): Observable<{ status_code: number; message: string }> {
        return this._http.delete<{ status_code: number; message: string }>(`${this.baseUrl}/${id}`, {
            withCredentials: true,
        });
    }

    getTaskComments(id: number | string): Observable<{ status_code: number; data: { comments: any[] } }> {
        return this._http.get<{ status_code: number; data: { comments: any[] } }>(`${this.baseUrl}/${id}/comments`, {
            withCredentials: true,
        });
    }

    createTaskComment(id: number | string, payload: { text: string; attachments?: any[] }): Observable<{ status_code: number; data: any }> {
        return this._http.post<{ status_code: number; data: any }>(`${this.baseUrl}/${id}/comments`, payload, {
            withCredentials: true,
        });
    }

    uploadAttachment(file: File): Observable<{
        status_code: number;
        message: string;
        data: { name: string; size: number; mimetype: string; uri: string; url: string };
    }> {
        const formData = new FormData();
        formData.append('file', file);
        return this._http.post<{
            status_code: number;
            message: string;
            data: { name: string; size: number; mimetype: string; uri: string; url: string };
        }>(`${this.baseUrl}/attachment/upload`, formData, {
            withCredentials: true,
        });
    }
}
