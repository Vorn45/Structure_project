import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { readPreferredRoleId } from 'app/core/auth/resolvers/role.util';
import { UserService } from 'app/core/user/user.service';
import { User } from 'app/core/user/user.types';
import { HelperConfig, HelperConfigService } from 'helper/services/config';
import { map, Observable } from 'rxjs';

export enum ProjectScope {
    User = 'user',
    OrgAdmin = 'org_admin',
    SupAdmin = 'super_admin',
}

/** Maps the active role's slug to the project-listing scope it corresponds to. */
function toScope(slug?: string): ProjectScope | null {
    switch (slug) {
        case 'user': return ProjectScope.User;
        case 'org_admin': return ProjectScope.OrgAdmin;
        case 'superadmin':
        case 'admin': return ProjectScope.SupAdmin;
        default: return null;
    }
}

@Injectable({ providedIn: 'root' })
export class ProjectShortcutService {
    readonly enabled$: Observable<boolean> = this._helperConfigService.config$.pipe(
        map((config: HelperConfig) => !!config.projectShortcut),
    );

    readonly scope$: Observable<ProjectScope | null> = this._userService.user$.pipe(
        map((user: User) => {
            const preferredRoleId = readPreferredRoleId();
            const role =
                user?.roles?.find((r) => r.id === preferredRoleId) ??
                user?.roles?.find((r) => r.id === user?.is_active) ??
                user?.roles?.find((r) => r.is_default);
            return toScope(role?.slug);
        }),
    );

    constructor(
        private _router: Router,
        private _helperConfigService: HelperConfigService,
        private _userService: UserService,
    ) {}

    tasksUrl(scope: ProjectScope, id: number | string): string {
        switch (scope) {
            case ProjectScope.OrgAdmin: return `/org-admin/projects/${id}/tasks`;
            case ProjectScope.SupAdmin: return `/super-admin/projects/view/${id}/tasks`;
            default: return `/member/projects/${id}/tasks`;
        }
    }

    goToProject(scope: ProjectScope, id: number | string): void {
        this._router.navigateByUrl(this.tasksUrl(scope, id));
    }
}
