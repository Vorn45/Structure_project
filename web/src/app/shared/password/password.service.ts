import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
// Helper
// ================================================================================>> Third Party Library
// RxJS
import { env } from 'envs/env';
import { PasswordReq } from './component';
@Injectable({ providedIn: 'root' })
export class PasswordService {

    constructor(private _httpClient: HttpClient) { }
    private httpOptions = {
        headers: new HttpHeaders().set('Content-Type', 'application/json'),
    };

    updatePassword(cv_id: number, body: PasswordReq): Observable<any> {
        return this._httpClient.put(`${env.API_BASE_URL}/shared/password/${cv_id}`, body, this.httpOptions);
    }

}

