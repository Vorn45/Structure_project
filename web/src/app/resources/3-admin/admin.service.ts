import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { env } from 'envs/env';

export * from './admin.types';
import {
    AdminStats,
    AdminUser,
    AdminProject,
    AdminLeaveRequest,
    AdminAttendanceData,
    AdminClient,
    AdminSettingsData,
    AdminUserInvitation,
    InviteUserPayload,
} from './admin.types';

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

    // 2.1 Clients Management (អតិថិជន)
    getClients(params?: any): Observable<{ status_code: number; data: { results: AdminClient[]; total: number } }> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach((key) => {
                if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
                    httpParams = httpParams.set(key, params[key]);
                }
            });
        }
        return this._http.get<{ status_code: number; data: { results: AdminClient[]; total: number } }>(
            `${this._baseUrl}/clients`,
            { params: httpParams },
        );
    }

    getClientById(id: number): Observable<{ status_code: number; data: AdminClient }> {
        return this._http.get<{ status_code: number; data: AdminClient }>(`${this._baseUrl}/clients/${id}`);
    }

    createClient(payload: Partial<AdminClient>): Observable<{ status_code: number; message: string; data: AdminClient }> {
        return this._http.post<{ status_code: number; message: string; data: AdminClient }>(
            `${this._baseUrl}/clients`,
            payload,
        );
    }

    updateClient(id: number, payload: Partial<AdminClient>): Observable<{ status_code: number; message: string; data: AdminClient }> {
        return this._http.patch<{ status_code: number; message: string; data: AdminClient }>(
            `${this._baseUrl}/clients/${id}`,
            payload,
        );
    }

    toggleClientStatus(id: number): Observable<{ status_code: number; message: string; data: AdminClient }> {
        return this._http.patch<{ status_code: number; message: string; data: AdminClient }>(
            `${this._baseUrl}/clients/${id}/toggle-status`,
            {},
        );
    }

    deleteClient(id: number): Observable<{ status_code: number; message: string }> {
        return this._http.delete<{ status_code: number; message: string }>(`${this._baseUrl}/clients/${id}`);
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

    // 3.1 Project Sub-Resources (Phases, Meetings, Members, Agile Tasks)
    createProjectPhase(projectId: string, dto: any): Observable<{ status_code: number; message: string; data: any }> {
        return this._http.post<{ status_code: number; message: string; data: any }>(`${this._baseUrl}/projects/${projectId}/phases`, dto);
    }

    deleteProjectPhase(projectId: string, phaseId: string): Observable<{ status_code: number; message: string }> {
        return this._http.delete<{ status_code: number; message: string }>(`${this._baseUrl}/projects/${projectId}/phases/${phaseId}`);
    }

    createProjectMeeting(projectId: string, dto: any): Observable<{ status_code: number; message: string; data: any }> {
        return this._http.post<{ status_code: number; message: string; data: any }>(`${this._baseUrl}/projects/${projectId}/meetings`, dto);
    }

    deleteProjectMeeting(projectId: string, meetingId: string): Observable<{ status_code: number; message: string }> {
        return this._http.delete<{ status_code: number; message: string }>(`${this._baseUrl}/projects/${projectId}/meetings/${meetingId}`);
    }

    createProjectMember(projectId: string, dto: any): Observable<{ status_code: number; message: string; data: any }> {
        return this._http.post<{ status_code: number; message: string; data: any }>(`${this._baseUrl}/projects/${projectId}/members`, dto);
    }

    deleteProjectMember(projectId: string, memberId: number | string): Observable<{ status_code: number; message: string }> {
        return this._http.delete<{ status_code: number; message: string }>(`${this._baseUrl}/projects/${projectId}/members/${memberId}`);
    }

    getAgileTasks(projectId: string): Observable<{ status_code: number; data: any[] }> {
        return this._http.get<{ status_code: number; data: any[] }>(`${this._baseUrl}/projects/${projectId}/agile-tasks`);
    }

    createAgileTask(projectId: string, dto: any): Observable<{ status_code: number; message: string; data: any }> {
        return this._http.post<{ status_code: number; message: string; data: any }>(`${this._baseUrl}/projects/${projectId}/agile-tasks`, dto);
    }

    updateAgileTask(projectId: string, taskId: string, dto: any): Observable<{ status_code: number; message: string; data: any }> {
        return this._http.patch<{ status_code: number; message: string; data: any }>(`${this._baseUrl}/projects/${projectId}/agile-tasks/${taskId}`, dto);
    }

    deleteAgileTask(projectId: string, taskId: string): Observable<{ status_code: number; message: string }> {
        return this._http.delete<{ status_code: number; message: string }>(`${this._baseUrl}/projects/${projectId}/agile-tasks/${taskId}`);
    }

    // 4. Attendance & Leaves
    getAttendance(date?: string): Observable<{ status_code: number; data: AdminAttendanceData }> {
        let params = new HttpParams();
        if (date) params = params.set('date', date);
        return this._http.get<{ status_code: number; data: AdminAttendanceData }>(`${this._baseUrl}/attendance`, { params });
    }

    getLeaves(): Observable<{ status_code: number; data: AdminLeaveRequest[] }> {
        return this._http.get<{ status_code: number; data: AdminLeaveRequest[] }>(`${this._baseUrl}/attendance/leaves`);
    }

    createLeave(payload: Partial<AdminLeaveRequest>): Observable<{ status_code: number; message: string; data: AdminLeaveRequest }> {
        return this._http.post<{ status_code: number; message: string; data: AdminLeaveRequest }>(`${this._baseUrl}/attendance/leaves`, payload);
    }

    actionLeave(id: string, status: 'approved' | 'rejected', comment?: string): Observable<{ status_code: number; data: AdminLeaveRequest }> {
        return this._http.patch<{ status_code: number; data: AdminLeaveRequest }>(`${this._baseUrl}/attendance/leaves/${id}/action`, {
            status,
            comment,
        });
    }

    deleteLeave(id: string): Observable<{ status_code: number; message: string }> {
        return this._http.delete<{ status_code: number; message: string }>(`${this._baseUrl}/attendance/leaves/${id}`);
    }

    recordAttendanceLog(payload: any): Observable<{ status_code: number; message: string; data: any }> {
        return this._http.post<{ status_code: number; message: string; data: any }>(`${this._baseUrl}/attendance/logs`, payload);
    }

    // 5. Settings
    getSettings(): Observable<{ status_code: number; data: AdminSettingsData }> {
        return this._http.get<{ status_code: number; data: AdminSettingsData }>(`${this._baseUrl}/settings`);
    }

    updateSettings(payload: Partial<AdminSettingsData>): Observable<{ status_code: number; data: AdminSettingsData }> {
        return this._http.patch<{ status_code: number; data: AdminSettingsData }>(`${this._baseUrl}/settings`, payload);
    }

    // 6. Invitations
    getInvitations(status?: string): Observable<{ status_code: number; data: AdminUserInvitation[] }> {
        let params = new HttpParams();
        if (status) params = params.set('status', status);
        return this._http.get<{ status_code: number; data: AdminUserInvitation[] }>(`${this._baseUrl}/users/invitations`, { params });
    }

    inviteUser(payload: InviteUserPayload): Observable<{ status_code: number; message: string; data: AdminUserInvitation }> {
        return this._http.post<{ status_code: number; message: string; data: AdminUserInvitation }>(`${this._baseUrl}/users/invite`, payload);
    }

    resendInvitation(id: string): Observable<{ status_code: number; message: string; data: AdminUserInvitation }> {
        return this._http.post<{ status_code: number; message: string; data: AdminUserInvitation }>(`${this._baseUrl}/users/invitations/${id}/resend`, {});
    }

    revokeInvitation(id: string): Observable<{ status_code: number; message: string }> {
        return this._http.delete<{ status_code: number; message: string }>(`${this._baseUrl}/users/invitations/${id}`);
    }

    // Auth Invite (public verification and acceptance)
    verifyInviteToken(token: string): Observable<{ status_code: number; data: any }> {
        return this._http.get<{ status_code: number; data: any }>(`${env.API_BASE_URL}/auth/invite/verify`, {
            params: new HttpParams().set('token', token),
        });
    }

    acceptInvite(payload: { token: string; password: string; name_kh?: string; name_en?: string; phone?: string; gender?: string }): Observable<any> {
        return this._http.post<any>(`${env.API_BASE_URL}/auth/invite/accept`, payload);
    }
}
