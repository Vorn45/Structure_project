import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { env } from 'envs/env';
import { Observable } from 'rxjs';

export * from './home.types';
import { TaskStatusCounts, HomeOverviewData, HomeStatsData } from './home.types';

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

    // 1. Attendance
    getAttendance(): Observable<{ status_code: number; data: any }> {
        return this._http.get<{ status_code: number; data: any }>(
            `${this.baseUrl}/attendance`,
            { withCredentials: true }
        );
    }

    checkIn(payload: { note?: string; location?: string }): Observable<{ status_code: number; data: any }> {
        return this._http.post<{ status_code: number; data: any }>(
            `${this.baseUrl}/attendance/check-in`,
            payload,
            { withCredentials: true }
        );
    }

    checkOut(payload: { note?: string; location?: string }): Observable<{ status_code: number; data: any }> {
        return this._http.post<{ status_code: number; data: any }>(
            `${this.baseUrl}/attendance/check-out`,
            payload,
            { withCredentials: true }
        );
    }

    // 2. Payroll
    getPayroll(): Observable<{ status_code: number; data: any }> {
        return this._http.get<{ status_code: number; data: any }>(
            `${this.baseUrl}/payroll`,
            { withCredentials: true }
        );
    }

    // 3. Meetings
    getMeetings(): Observable<{ status_code: number; data: any[] }> {
        return this._http.get<{ status_code: number; data: any[] }>(
            `${this.baseUrl}/meetings`,
            { withCredentials: true }
        );
    }

    createMeeting(dto: any): Observable<{ status_code: number; data: any }> {
        return this._http.post<{ status_code: number; data: any }>(
            `${this.baseUrl}/meetings`,
            dto,
            { withCredentials: true }
        );
    }

    // 4. Projects
    getActiveProjects(): Observable<{ status_code: number; data: any }> {
        return this._http.get<{ status_code: number; data: any }>(
            `${this.baseUrl}/active-projects`,
            { withCredentials: true }
        );
    }

    createProject(dto: any): Observable<{ status_code: number; data: any }> {
        return this._http.post<{ status_code: number; data: any }>(
            `${this.baseUrl}/projects`,
            dto,
            { withCredentials: true }
        );
    }

    // 5. Help & Support
    getHelpSupport(): Observable<{ status_code: number; data: any }> {
        return this._http.get<{ status_code: number; data: any }>(
            `${this.baseUrl}/help-support`,
            { withCredentials: true }
        );
    }

    createSupportTicket(dto: any): Observable<{ status_code: number; data: any }> {
        return this._http.post<{ status_code: number; data: any }>(
            `${this.baseUrl}/help-support/ticket`,
            dto,
            { withCredentials: true }
        );
    }
}
