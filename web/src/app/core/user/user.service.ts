import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from 'app/core/user/user.types';
import { env } from 'envs/env';
import { Observable, ReplaySubject } from 'rxjs';

export interface ProfileOrganizationOption {
    id: string | number;
    name_en: string | null;
    name_kh: string | null;
    is_default: boolean;
    role: {
        id: number;
        slug: string;
        name_en: string | null;
        name_kh: string | null;
    };
    /** Legacy response shape retained for compatibility with older environments. */
    name?: {
        name_en: string | null;
        name_kh: string | null;
    };
}

export interface ProfileOrganizationsResponse {
    response_code: number;
    response_msg: string;
    data: ProfileOrganizationOption[];
}

@Injectable({ providedIn: 'root' })
export class UserService {

    private _user: ReplaySubject<User> = new ReplaySubject<User>(1);
    private _currentUser: User | null = null;
    private _org: any = null;

    constructor(private _http: HttpClient) {}

    set user(value: User) {
        this._currentUser = value;
        this._user.next(value);
    }

    get user$(): Observable<User> {
        return this._user.asObservable();
    }

    get user(): User | null {
        return this._currentUser;
    }

    getUser(): User | null {
        return this._currentUser;
    }

    set org(value: any) {
        this._org = value;
    }

    get org(): any {
        return this._org;
    }

    refreshUserData(): Observable<User> {
        return this._user.asObservable();
    }

    getOrganizations(): Observable<ProfileOrganizationsResponse> {
        return this._http.get<ProfileOrganizationsResponse>(
            `${env.API_BASE_URL}/account/profile/organizations`,
        );
    }

}
