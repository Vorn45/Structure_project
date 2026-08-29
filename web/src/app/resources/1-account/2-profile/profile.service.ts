import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { env } from 'envs/env';
import { catchError, map, Observable, of, switchMap, throwError } from 'rxjs';
import {
    List,
    PasskeyCredentialSummary,
    PasswordLastChange,
    PasswordReq,
    ProfileDevice,
    ProfileLoginHistory,
    ProfileSession,
    ProfileSessionLog,
    ProfileUpdate,
    TelegramLinkStatus,
} from './profile.type';

@Injectable({
    providedIn: 'root',
})
export class ProfileService {

    private readonly baseUrl: string = env.API_BASE_URL;
    private readonly httpOptions = {
        headers: new HttpHeaders().set('Content-Type', 'application/json'),
    };

    constructor(private http: HttpClient) { }

    profile(body: ProfileUpdate): Observable<any> {
        return this.http.put<any>(`${this.baseUrl}/account/profile`, body, this.httpOptions);
    }

    updatePassword(body: PasswordReq): Observable<{ response_code: number; response_msg: string }> {
        return this.http.put<{ response_code: number; response_msg: string }>(`${this.baseUrl}/account/profile/change-password`, body, this.httpOptions);
    }

    updateAvatar(avatar: File): Observable<{data: any}> {
        const formData = new FormData();
        formData.append('avatar', avatar, avatar.name);

        // Do not use the JSON content-type header here; the browser supplies
        // the multipart boundary required for the server to receive the file.
        return this.http.put<{data: any}>(`${this.baseUrl}/account/profile`, formData);
    }

    updateCover (body: {cover: string}): Observable<any> {
        return this.http.put<any>(`${this.baseUrl}/account/profile/update-cover`, body, this.httpOptions);
    }

    validatePassword(body: { password: string }): Observable<{ message: any }> {
        return this.http.post<{ message: any }>(`${this.baseUrl}/account/profile/check-password`, body, this.httpOptions);
    }

    getPasswordLastChange(): Observable<PasswordLastChange> {
        return this.http
            .get<unknown>(`${this.baseUrl}/account/profile/password/last-change`)
            .pipe(map((response) => this.extractLastChange(response)));
    }

    getDevices(): Observable<ProfileDevice[]> {
        return this.http
            .get<unknown>(`${this.baseUrl}/account/profile/devices`)
            .pipe(map((response) => this.extractDevices(response)));
    }

    getLoginHistory(): Observable<ProfileLoginHistory> {
        return this.http
            .get<unknown>(`${this.baseUrl}/account/profile/sessions`)
            .pipe(map((response) => this.extractLoginHistory(response)));
    }

    getTelegramStatus(): Observable<TelegramLinkStatus> {
        return this.http
            .get<{ data: TelegramLinkStatus }>(`${this.baseUrl}/account/profile/telegram/status`)
            .pipe(map((response) => this.unwrapData(response) as TelegramLinkStatus));
    }

    generateTelegramLink(): Observable<{ link: string }> {
        return this.http
            .post<{ data: { link: string } }>(`${this.baseUrl}/account/profile/telegram/link`, {})
            .pipe(map((response) => this.unwrapData(response) as { link: string }));
    }

    listPasskeys(): Observable<PasskeyCredentialSummary[]> {
        return this.http
            .get<unknown>(`${this.baseUrl}/account/profile/passkey`)
            .pipe(map((response) => (this.unwrapData(response) as PasskeyCredentialSummary[]) ?? []));
    }

    renamePasskey(id: number, deviceName: string): Observable<PasskeyCredentialSummary> {
        return this.http
            .put<unknown>(`${this.baseUrl}/account/profile/passkey/${id}`, { device_name: deviceName }, this.httpOptions)
            .pipe(map((response) => this.unwrapData(response) as PasskeyCredentialSummary));
    }

    removePasskey(id: number): Observable<void> {
        return this.http
            .delete<unknown>(`${this.baseUrl}/account/profile/passkey/${id}`)
            .pipe(map(() => undefined));
    }

    list(params?: {
        page: number;
        page_size: number;
    }): Observable<List> {
        // Filter out null or undefined parameters
        const filteredParams: { [key: string]: any } = {};
        Object.keys(params || {}).forEach(key => {
            if (params![key] !== null && params![key] !== undefined) {
                filteredParams[key] = params![key];
            }
        });

        return this.http.get<List>(`${env.API_BASE_URL}/account/profile/logs`, { params: filteredParams }).pipe(
            switchMap((response: List) => of(response)),
            catchError((error: HttpErrorResponse) => {
                // Rethrow the error while maintaining the Observable<List> type
                return throwError(() => error);
            })
        );
    }

    private extractLastChange(response: unknown): PasswordLastChange {
        const payload = this.unwrapData(response);
        if (typeof payload === 'string') {
            return { changedAt: payload, daysSinceChange: null };
        }
        if (!payload || typeof payload !== 'object') {
            return { changedAt: null, daysSinceChange: null };
        }

        const data = payload as Record<string, unknown>;
        const changedAt =
            data['last_changed_at'] ??
            data['last_change_at'] ??
            data['last_changed'] ??
            data['last_change'] ??
            data['password_changed_at'] ??
            data['password_last_changed_at'] ??
            data['changed_at'] ??
            data['date'];
        const daysSinceChange =
            data['days_since_change'] ??
            data['days_since_password_change'] ??
            data['days_since_password_changed'] ??
            data['days'];

        return {
            changedAt: typeof changedAt === 'string' ? changedAt : null,
            daysSinceChange: this.numberOrNull(daysSinceChange),
        };
    }

    private extractDevices(response: unknown): ProfileDevice[] {
        const payload = this.unwrapData(response);
        if (Array.isArray(payload)) {
            return payload as ProfileDevice[];
        }
        if (!payload || typeof payload !== 'object') {
            return [];
        }

        const data = payload as Record<string, unknown>;
        const rows = data['results'] ?? data['devices'];
        return Array.isArray(rows) ? rows as ProfileDevice[] : [];
    }

    private extractLoginHistory(response: unknown): ProfileLoginHistory {
        let payload = response;

        // Some environments return the standard response envelope while
        // others add another `data` envelope. Stop as soon as the session
        // collections are found instead of assuming a fixed nesting depth.
        for (let depth = 0; depth < 4; depth += 1) {
            if (!payload || typeof payload !== 'object') {
                break;
            }

            const data = payload as Record<string, unknown>;
            if (
                Array.isArray(data['sessions']) ||
                Array.isArray(data['session_logs'])
            ) {
                return {
                    sessions: Array.isArray(data['sessions'])
                        ? data['sessions'] as ProfileSession[]
                        : [],
                    sessionLogs: Array.isArray(data['session_logs'])
                        ? data['session_logs'] as ProfileSessionLog[]
                        : [],
                };
            }

            if (!('data' in data) || data['data'] === payload) {
                break;
            }
            payload = data['data'];
        }

        return { sessions: [], sessionLogs: [] };
    }

    private unwrapData(response: unknown): unknown {
        if (!response || typeof response !== 'object') {
            return response;
        }

        const envelope = response as Record<string, unknown>;
        return 'data' in envelope ? envelope['data'] : response;
    }

    private numberOrNull(value: unknown): number | null {
        if (typeof value === 'number' && Number.isFinite(value)) {
            return value;
        }
        if (typeof value === 'string' && value.trim() !== '') {
            const parsed = Number(value);
            return Number.isFinite(parsed) ? parsed : null;
        }
        return null;
    }
}
