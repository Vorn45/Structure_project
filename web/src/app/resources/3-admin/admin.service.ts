import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { env } from 'envs/env';

export interface AdminStats {
    kpi: {
        total_projects: number;
        active_projects: number;
        completed_projects: number;
        planning_projects: number;
        total_tasks: number;
        completed_tasks: number;
        in_progress_tasks?: number;
        pending_tasks?: number;
        task_completion_rate: number;
        active_users: number;
        total_users: number;
        pending_leaves: number;
    };
    task_distribution?: {
        completed: number;
        in_progress: number;
        pending: number;
        completion_percentage: number;
    };
    trend?: {
        weekly: {
            days: string[];
            in_progress: number[];
            completed: number[];
        };
        monthly: {
            months: string[];
            in_progress: number[];
            completed: number[];
        };
        yearly: {
            years: string[];
            in_progress: number[];
            completed: number[];
        };
    };
    scheduled_meetings?: Array<{
        id: string;
        title: string;
        time: string;
        dateGroup: string;
        dateLabel: string;
        badgeColor: string;
        borderClass: string;
        members: string[];
        extraCount: number;
    }>;
    top_performers?: Array<{
        id: string;
        name: string;
        name_kh: string;
        email: string;
        role: string;
        avatar: string;
        initials: string;
        avatarBg: string;
        tasks_completed?: number;
    }>;
    projects_summary: Array<{
        id: string;
        code: string;
        name: string;
        status: string;
        progress: number;
        total_tasks: number;
        completed_tasks: number;
        lead: string;
    }>;
    department_stats: Array<{
        name: string;
        name_en: string;
        members: number;
        progress: number;
    }>;
    recent_activity: Array<{
        id: string;
        text: string;
        user: string;
        time: string;
    }>;
}

export interface AdminUser {
    id: number;
    name_kh: string;
    name_en: string;
    email: string;
    phone: string;
    role: string;
    department: string;
    position: string;
    avatar?: string | null;
    is_active: number;
    projects_count: number;
    created_at: string;
}

export interface AdminProject {
    id: string;
    code: string;
    name: string;
    description: string;
    status: 'active' | 'completed' | 'on_hold' | 'planning';
    progress: number;
    start_date: string;
    end_date: string;
    budget?: number;
    spent?: number;
    currency?: string;
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
}

export interface AdminLeaveRequest {
    id: string;
    user_id: number;
    user_name: string;
    department: string;
    leave_type: 'annual' | 'sick' | 'special' | 'maternity';
    start_date: string;
    end_date: string;
    duration_days: number;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    applied_at: string;
    reviewer_comment?: string;
}

export interface AdminAttendanceData {
    total_staff: number;
    present_today: number;
    late_today: number;
    on_leave: number;
    logs: Array<{
        id: string;
        user_id: number;
        user_name: string;
        user_en: string;
        department: string;
        check_in: string;
        check_out?: string | null;
        status: 'on_time' | 'late';
        date: string;
    }>;
}

export interface AdminSettingsData {
    organization_name_kh: string;
    organization_name_en: string;
    code: string;
    domain: string;
    departments: Array<{
        id: string;
        name_kh: string;
        name_en: string;
        head: string;
        member_count: number;
    }>;
    work_categories: string[];
}

@Injectable({
    providedIn: 'root',
})
export class AdminService {
    private readonly _http = inject(HttpClient);
    private readonly _baseUrl = `${env.API_BASE_URL}/admin`;

    // 1. Dashboard Stats
    getStats(): Observable<{ status_code: number; message: string; data: AdminStats }> {
        return this._http.get<{ status_code: number; message: string; data: AdminStats }>(`${this._baseUrl}/stats`);
    }

    // 2. Users Management
    getUsers(params?: any): Observable<{ status_code: number; data: { results: AdminUser[]; total: number } }> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach((key) => {
                if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
                    httpParams = httpParams.set(key, params[key]);
                }
            });
        }
        return this._http.get<{ status_code: number; data: { results: AdminUser[]; total: number } }>(
            `${this._baseUrl}/users`,
            { params: httpParams },
        );
    }

    createUser(payload: Partial<AdminUser>): Observable<{ status_code: number; message: string; data: AdminUser }> {
        return this._http.post<{ status_code: number; message: string; data: AdminUser }>(
            `${this._baseUrl}/users`,
            payload,
        );
    }

    updateUser(id: number, payload: Partial<AdminUser>): Observable<{ status_code: number; message: string; data: AdminUser }> {
        return this._http.patch<{ status_code: number; message: string; data: AdminUser }>(
            `${this._baseUrl}/users/${id}`,
            payload,
        );
    }

    toggleUserStatus(id: number): Observable<{ status_code: number; message: string; data: AdminUser }> {
        return this._http.patch<{ status_code: number; message: string; data: AdminUser }>(
            `${this._baseUrl}/users/${id}/toggle-status`,
            {},
        );
    }

    deleteUser(id: number): Observable<{ status_code: number; message: string }> {
        return this._http.delete<{ status_code: number; message: string }>(`${this._baseUrl}/users/${id}`);
    }

    // 3. Projects Governance (គម្រោង)
    getProjects(params?: any): Observable<{ status_code: number; data: { results: AdminProject[]; total: number } }> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach((key) => {
                if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
                    httpParams = httpParams.set(key, params[key]);
                }
            });
        }
        return this._http.get<{ status_code: number; data: { results: AdminProject[]; total: number } }>(
            `${this._baseUrl}/projects`,
            { params: httpParams },
        );
    }

    getProjectById(id: string): Observable<{ status_code: number; data: AdminProject }> {
        return this._http.get<{ status_code: number; data: AdminProject }>(`${this._baseUrl}/projects/${id}`);
    }

    createProject(payload: Partial<AdminProject>): Observable<{ status_code: number; data: AdminProject }> {
        return this._http.post<{ status_code: number; data: AdminProject }>(`${this._baseUrl}/projects`, payload);
    }

    updateProject(id: string, payload: Partial<AdminProject>): Observable<{ status_code: number; data: AdminProject }> {
        return this._http.patch<{ status_code: number; data: AdminProject }>(`${this._baseUrl}/projects/${id}`, payload);
    }

    deleteProject(id: string): Observable<{ status_code: number; message: string }> {
        return this._http.delete<{ status_code: number; message: string }>(`${this._baseUrl}/projects/${id}`);
    }

    updateProjectBudget(id: string, budget: number, spent?: number): Observable<{ status_code: number; data: AdminProject }> {
        return this._http.patch<{ status_code: number; data: AdminProject }>(`${this._baseUrl}/projects/${id}/budget`, {
            budget,
            spent,
        });
    }

    updateProjectLead(id: string, lead_id: number, lead_name: string, lead_role?: string): Observable<{ status_code: number; data: AdminProject }> {
        return this._http.patch<{ status_code: number; data: AdminProject }>(`${this._baseUrl}/projects/${id}/lead`, {
            lead_id,
            lead_name,
            lead_role,
        });
    }

    // 4. Attendance & Leaves
    getAttendance(): Observable<{ status_code: number; data: AdminAttendanceData }> {
        return this._http.get<{ status_code: number; data: AdminAttendanceData }>(`${this._baseUrl}/attendance`);
    }

    getLeaves(): Observable<{ status_code: number; data: AdminLeaveRequest[] }> {
        return this._http.get<{ status_code: number; data: AdminLeaveRequest[] }>(`${this._baseUrl}/leaves`);
    }

    actionLeave(id: string, status: 'approved' | 'rejected', comment?: string): Observable<{ status_code: number; data: AdminLeaveRequest }> {
        return this._http.patch<{ status_code: number; data: AdminLeaveRequest }>(`${this._baseUrl}/leaves/${id}/action`, {
            status,
            comment,
        });
    }

    // 5. Settings
    getSettings(): Observable<{ status_code: number; data: AdminSettingsData }> {
        return this._http.get<{ status_code: number; data: AdminSettingsData }>(`${this._baseUrl}/settings`);
    }

    updateSettings(payload: Partial<AdminSettingsData>): Observable<{ status_code: number; data: AdminSettingsData }> {
        return this._http.patch<{ status_code: number; data: AdminSettingsData }>(`${this._baseUrl}/settings`, payload);
    }
}
