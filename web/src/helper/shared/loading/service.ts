import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoadingSpinnerService {
    private _open$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    get open$(): Observable<boolean> {
        return this._open$.asObservable();
    }

    open(): void {
        this._open$.next(true);
    }

    close(): void {
        this._open$.next(false);
    }
}
