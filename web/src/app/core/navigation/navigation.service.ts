import { Injectable, inject } from '@angular/core';
import { HelperNavigationItem } from 'helper/components/navigation';
import { TranslocoService } from '@ngneat/transloco';
import { Observable, ReplaySubject } from 'rxjs';
import { Role } from '../user/user.types';
import { navigationData } from './navigation.data';

@Injectable({ providedIn: 'root' })
export class NavigationService {
    private readonly _transloco = inject(TranslocoService);

    private _navigation: ReplaySubject<HelperNavigationItem[]> = new ReplaySubject<HelperNavigationItem[]>(1);
    private _rawItems: HelperNavigationItem[] = [];

    constructor() {
        // `title` on the raw data is a translation key — re-translate and
        // re-emit the whole tree whenever the active language changes.
        this._transloco.langChanges$.subscribe(() => {
            if (this._rawItems.length) this._navigation.next(this._translate(this._rawItems));
        });
    }

    set navigations(role: Role) {
        switch (role.slug) {
            case 'org_admin':
                this._rawItems = navigationData.orgAdmin;
                break;
            case 'personal_workspace':
                this._rawItems = navigationData.personalWorkspace;
                break;
            case 'member':
            case 'user':
            case 'volunteer':
                this._rawItems = navigationData.member;
                break;
            case 'superadmin':
            case 'admin':
            default:
                this._rawItems = navigationData.admin;
                break;
        }
        this._navigation.next(this._translate(this._rawItems));
    }

    get navigations$(): Observable<HelperNavigationItem[]> {
        return this._navigation.asObservable();
    }

    /** Deep-clones the raw items, resolving each `title` translation key into display text. */
    private _translate(items: HelperNavigationItem[]): HelperNavigationItem[] {
        return items.map((item) => {
            let title = item.title;
            if (item.id === 'activity' || item.title === 'Navigation.Activity' || item.title === 'Navigation.Plan') {
                const isEnglish = this._transloco.getActiveLang() === 'en';
                title = isEnglish ? 'Plan' : 'ផែនការ';
            } else if (item.title) {
                title = this._transloco.translate(item.title);
            }
            return {
                ...item,
                title,
                children: item.children ? this._translate(item.children) : item.children,
            };
        });
    }
}

