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
        email?: string;
    }>;
    tasks?: any[];
    phases?: any[];
    meetings?: any[];
    agileTasks?: any[];
    links?: any[];
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

    // =========================================================================
    // 1. MAIN PLAN CRUD
    // =========================================================================
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

    createPlan(payload: Partial<ProjectPlanItem>): Observable<{ status_code: number; data: ProjectPlanItem }> {
        return this._http.post<{ status_code: number; data: ProjectPlanItem }>(this.baseUrl, payload, {
            withCredentials: true,
        });
    }

    updatePlan(id: string, payload: Partial<ProjectPlanItem>): Observable<{ status_code: number; data: ProjectPlanItem }> {
        return this._http.patch<{ status_code: number; data: ProjectPlanItem }>(`${this.baseUrl}/${id}`, payload, {
            withCredentials: true,
        });
    }

    deletePlan(id: string): Observable<{ status_code: number; message: string }> {
        return this._http.delete<{ status_code: number; message: string }>(`${this.baseUrl}/${id}`, {
            withCredentials: true,
        });
    }

    // =========================================================================
    // 2. TASKS
    // =========================================================================
    getTasks(projectId: string): Observable<{ status_code: number; data: any[] }> {
        return this._http.get<{ status_code: number; data: any[] }>(`${this.baseUrl}/${projectId}/tasks`, {
            withCredentials: true,
        });
    }

    createTask(projectId: string, task: any): Observable<{ status_code: number; data: any }> {
        return this._http.post<{ status_code: number; data: any }>(`${this.baseUrl}/${projectId}/tasks`, task, {
            withCredentials: true,
        });
    }

    updateTask(projectId: string, taskId: string, task: any): Observable<{ status_code: number; data: any }> {
        return this._http.patch<{ status_code: number; data: any }>(`${this.baseUrl}/${projectId}/tasks/${taskId}`, task, {
            withCredentials: true,
        });
    }

    deleteTask(projectId: string, taskId: string): Observable<{ status_code: number; message: string }> {
        return this._http.delete<{ status_code: number; message: string }>(`${this.baseUrl}/${projectId}/tasks/${taskId}`, {
            withCredentials: true,
        });
    }

    // =========================================================================
    // 3. PHASES
    // =========================================================================
    createPhase(projectId: string, phase: any): Observable<{ status_code: number; data: any }> {
        return this._http.post<{ status_code: number; data: any }>(`${this.baseUrl}/${projectId}/phases`, phase, {
            withCredentials: true,
        });
    }

    deletePhase(projectId: string, phaseId: string): Observable<{ status_code: number; message: string }> {
        return this._http.delete<{ status_code: number; message: string }>(`${this.baseUrl}/${projectId}/phases/${phaseId}`, {
            withCredentials: true,
        });
    }

    // =========================================================================
    // 4. MEETINGS
    // =========================================================================
    createMeeting(projectId: string, meeting: any): Observable<{ status_code: number; data: any }> {
        return this._http.post<{ status_code: number; data: any }>(`${this.baseUrl}/${projectId}/meetings`, meeting, {
            withCredentials: true,
        });
    }

    deleteMeeting(projectId: string, meetingId: string): Observable<{ status_code: number; message: string }> {
        return this._http.delete<{ status_code: number; message: string }>(`${this.baseUrl}/${projectId}/meetings/${meetingId}`, {
            withCredentials: true,
        });
    }

    // =========================================================================
    // 5. MEMBERS
    // =========================================================================
    createMember(projectId: string, member: any): Observable<{ status_code: number; data: any }> {
        return this._http.post<{ status_code: number; data: any }>(`${this.baseUrl}/${projectId}/members`, member, {
            withCredentials: true,
        });
    }

    deleteMember(projectId: string, memberId: number | string): Observable<{ status_code: number; message: string }> {
        return this._http.delete<{ status_code: number; message: string }>(`${this.baseUrl}/${projectId}/members/${memberId}`, {
            withCredentials: true,
        });
    }

    // =========================================================================
    // 6. AGILE TIMELINE ROADMAP
    // =========================================================================
    getAgileTasks(projectId: string): Observable<{ status_code: number; data: any[] }> {
        return this._http.get<{ status_code: number; data: any[] }>(`${this.baseUrl}/${projectId}/agile-tasks`, {
            withCredentials: true,
        });
    }

    createAgileTask(projectId: string, task: any): Observable<{ status_code: number; data: any }> {
        return this._http.post<{ status_code: number; data: any }>(`${this.baseUrl}/${projectId}/agile-tasks`, task, {
            withCredentials: true,
        });
    }

    deleteAgileTask(projectId: string, taskId: string): Observable<{ status_code: number; message: string }> {
        return this._http.delete<{ status_code: number; message: string }>(`${this.baseUrl}/${projectId}/agile-tasks/${taskId}`, {
            withCredentials: true,
        });
    }
}
