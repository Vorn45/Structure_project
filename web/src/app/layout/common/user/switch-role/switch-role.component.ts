import { CommonModule }                                                                                                           from '@angular/common';
import { HttpClient }                                                                                                             from '@angular/common/http';
import { Component, inject, OnInit, ViewEncapsulation, ChangeDetectorRef }                                                                           from '@angular/core';
import { MatButtonModule }                                                                                                        from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef }                                                                                           from '@angular/material/dialog';
import { MatDividerModule }                                                                                                        from '@angular/material/divider';
import { MatIconModule }                                                                                                          from '@angular/material/icon';
import { TranslocoModule }                                                                                                        from '@ngneat/transloco';
import { TimeAgoPipe }                                                                                                            from 'app/shared/time-ago.pipe';
import { finalize }                                                                                                               from 'rxjs/operators';
import { AuthService }                                                                                                            from 'app/core/auth/auth.service';
import { ResponseLogin }                                                                                                          from 'app/core/auth/auth.types';
import { UserService }                                                                                                            from 'app/core/user/user.service';
import { toRoleArray, readPreferredRoleId }                                                                                       from 'app/core/auth/resolvers/role.util';
import { env }                                                                                                                    from 'envs/env';
import { HelperSplashScreenService }                                                                                              from 'helper/services/splash-screen';
import { SnackbarService }                                                                                                        from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants                                                                                                            from 'helper/shared/constants';
import { DialogConfigService }                                                                                                    from 'app/shared/dialog-config.service';
import { OrganizationSwitchDialogComponent }                                                                                     from 'app/resources/1-account/2-profile/dialog/organization-switch/component';

export interface SwitchRoleRow {
    id?: number;
    organizationId?: string;
    title: string;
    subtitle?: string;
    logo?: string;
    icon?: string;
    badgeIcon?: string;
    badgeImage?: string;
    badgeColor?: string;
    badgeBgClass?: string;
    badgeSize?: string;
    /** Section this role belongs to: 'system' (super admin), 'org' (org admin), 'user' or 'other'. */
    group?: string;
    isActive: boolean;
    switchedAt?: Date | string | number;
}

function resolveOrgSubtitle(org: any, roleName?: string): string | undefined {
    if (!org) return roleName || undefined;
    const rawEn = org?.name_en || org?.name?.name_en || '';
    const cleanEn = rawEn.replace(/\s*\([^)]*\)\s*$/, '').trim();
    let abbr = org?.abbreviation || org?.abbr || org?.short_name_en || org?.short_name || org?.short_name_kh;

    if (!abbr) {
        if (cleanEn) {
            const words = cleanEn.split(/\s+/).filter((w) => !/^(of|and|the|for|in|on|at|to|a|an)$/i.test(w));
            if (words.length >= 2) {
                abbr = words.slice(0, 3).map((w) => w[0].toUpperCase()).join('');
            }
        }
    }

    if (cleanEn && abbr) {
        return `${cleanEn} (${abbr})`;
    }
    return cleanEn || (abbr ? `(${abbr})` : (roleName || undefined));
}

@Component({
    selector: 'user-switch-role',
    templateUrl: './switch-role.component.html',
    styleUrls: ['./switch-role.component.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [
        CommonModule,
        MatIconModule,
        MatButtonModule,
        MatDialogModule,
        MatDividerModule,
        TranslocoModule,
        TimeAgoPipe,
    ]
})
export class SwitchRoleComponent implements OnInit {

    /** Fallback avatar shown when a user has not uploaded a profile photo yet. */
    private static readonly DEFAULT_AVATAR = '/images/placeholder/avatar.jpg';

    displayRoles: SwitchRoleRow[] = [];
    allOrgRoles: SwitchRoleRow[] = [];
    hiddenOrgCount = 0;

    /** True while /account/profile/roles is in flight, so the dialog shows skeleton rows. */
    isLoading = true;

    /** Placeholder rows rendered while loading. */
    readonly skeletons = Array.from({ length: 4 });

    /** Order in which the sections are displayed: super admin, org admin, user, then anything else. */
    private static readonly GROUP_ORDER = ['system', 'org', 'user', 'other'];

    /** Display label for each section's header. Groups without an entry render without a header. */
    private static readonly GROUP_HEADERS: Record<string, string> = {
        org: 'រដ្ឋបាល',
        user: 'អ្នកប្រើប្រាស់',
    };

    private static readonly RECENT_ORGS_KEY = 'recent_organization_history';
    private static readonly RECENT_ORGS_TIMESTAMPS_KEY = 'recent_organization_timestamps';

    private _getRecentOrgIds(): number[] {
        try {
            const raw = localStorage.getItem(SwitchRoleComponent.RECENT_ORGS_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed.map((id: any) => Number(id)).filter((id: number) => !isNaN(id)) : [];
        } catch {
            return [];
        }
    }

    private _getRecentOrgTimestamps(): Record<string, number> {
        try {
            const raw = localStorage.getItem(SwitchRoleComponent.RECENT_ORGS_TIMESTAMPS_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    }

    private _saveRecentOrgId(roleId: number | undefined): void {
        if (roleId == null) return;
        try {
            let list = this._getRecentOrgIds();
            list = list.filter((id) => id !== roleId);
            list.unshift(roleId);
            list = list.slice(0, 20);
            localStorage.setItem(SwitchRoleComponent.RECENT_ORGS_KEY, JSON.stringify(list));

            const timestamps = this._getRecentOrgTimestamps();
            timestamps[String(roleId)] = Date.now();
            localStorage.setItem(SwitchRoleComponent.RECENT_ORGS_TIMESTAMPS_KEY, JSON.stringify(timestamps));
        } catch {}
    }

    displayGroups: { key: string; header?: string; items: SwitchRoleRow[]; hiddenCount: number }[] = [];

    private _buildDisplayGroups(): void {
        const orgRoles = this.displayRoles.filter((r) => r.group === 'org');
        const userRoles = this.displayRoles.filter((r) => r.group === 'user');
        const otherRoles = this.displayRoles.filter((r) => r.group !== 'system' && r.group !== 'personal' && r.group !== 'org' && r.group !== 'user');
        const systemRoles = this.displayRoles.filter((r) => r.group === 'system');

        const recentIds = this._getRecentOrgIds();

        const sortFn = (a: SwitchRoleRow, b: SwitchRoleRow) => {
            if (a.isActive) return -1;
            if (b.isActive) return 1;

            const indexA = a.id != null ? recentIds.indexOf(a.id) : -1;
            const indexB = b.id != null ? recentIds.indexOf(b.id) : -1;

            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;

            return 0;
        };

        const sortedOrg = [...orgRoles].sort(sortFn);
        const sortedUser = [...userRoles].sort(sortFn);
        const sortedOther = [...otherRoles].sort(sortFn);

        this.allOrgRoles = [...sortedOrg, ...sortedUser, ...sortedOther];

        const maxPerGroup = 5;
        const buckets = new Map<string, SwitchRoleRow[]>();
        const hiddenCounts = new Map<string, number>();

        if (sortedOrg.length) {
            buckets.set('org', sortedOrg.slice(0, maxPerGroup));
            hiddenCounts.set('org', Math.max(0, sortedOrg.length - maxPerGroup));
        }
        if (sortedUser.length) {
            buckets.set('user', sortedUser.slice(0, maxPerGroup));
            hiddenCounts.set('user', Math.max(0, sortedUser.length - maxPerGroup));
        }
        if (sortedOther.length) {
            buckets.set('other', sortedOther.slice(0, maxPerGroup));
            hiddenCounts.set('other', Math.max(0, sortedOther.length - maxPerGroup));
        }
        if (systemRoles.length) {
            buckets.set('system', systemRoles);
            hiddenCounts.set('system', 0);
        }

        const totalShown = (buckets.get('org')?.length || 0) + (buckets.get('user')?.length || 0) + (buckets.get('other')?.length || 0);
        this.hiddenOrgCount = Math.max(0, this.allOrgRoles.length - totalShown);

        this.displayGroups = SwitchRoleComponent.GROUP_ORDER
            .filter((key) => buckets.has(key))
            .map((key) => ({
                key,
                header: SwitchRoleComponent.GROUP_HEADERS[key],
                items: buckets.get(key)!,
                hiddenCount: hiddenCounts.get(key) || 0,
            }));
    }

    trackGroup = (_index: number, group: { key: string }): string => group.key;

    trackRole = (_index: number, item: SwitchRoleRow): number | string => item.id ?? item.title;

    private _loadRoles(): void {
        this.isLoading = true;
        this._httpClient.get<any>(`${env.API_BASE_URL}/account/profile/roles`).pipe(
            finalize(() => this.isLoading = false),
        ).subscribe({
            next: (res) => {
                const roles: any[] = toRoleArray(res?.data?.roles);
                if (!roles.length) return;
                const activeRoleId = readPreferredRoleId();
                const timestamps = this._getRecentOrgTimestamps();
                this.displayRoles = roles.map((role) => {
                    const legacyOrganization = Array.isArray(role.organizations)
                        ? role.organizations[0]
                        : role.organizations;
                    const org = role.organization ?? legacyOrganization;
                    const logo = this._fileUrl(org?.logo);
                    const orgId = role.organization_id != null
                        ? String(role.organization_id)
                        : org?.id != null
                            ? String(org.id)
                            : undefined;
                    const isActive = activeRoleId != null
                        ? role.id === activeRoleId
                        : !!role.is_default;

                    const roleIdKey = role.id != null ? String(role.id) : undefined;
                    const savedTimestamp = roleIdKey ? timestamps[roleIdKey] : undefined;
                    const switchedAt = savedTimestamp ? new Date(savedTimestamp) : undefined;

                    switch (role.slug) {
                        case 'superadmin':
                        case 'admin':
                            return {
                                id: role.id,
                                organizationId: orgId,
                                title: 'អភិបាលប្រព័ន្ធ',
                                subtitle: undefined,
                                logo: undefined,
                                icon: 'mdi:star',
                                badgeIcon: undefined,
                                badgeColor: 'text-slate-400',
                                group: 'system',
                                isActive,
                                switchedAt,
                            } as SwitchRoleRow;
                        case 'org_admin': {
                            const orgNameKh = org?.name_kh || org?.name?.name_kh;
                            const orgNameEn = org?.name_en || org?.name?.name_en;
                            const title = orgNameKh || orgNameEn || 'អង្គភាព';
                            const subtitle = resolveOrgSubtitle(org);
                            return {
                                id: role.id,
                                organizationId: orgId,
                                title,
                                subtitle,
                                logo: logo || undefined,
                                icon: logo ? undefined : 'mdi:star',
                                badgeIcon: logo ? 'mdi:star' : undefined,
                                badgeColor: 'text-white',
                                badgeBgClass: 'bg-amber-500',
                                badgeSize: 'icon-size-4',
                                group: 'org',
                                isActive,
                                switchedAt,
                            } as SwitchRoleRow;
                        }
                        case 'user': {
                            const avatarUrl = this._fileUrl(role.avatar ?? this.userService.user?.avatar) ?? undefined;
                            const orgNameKh = org?.name_kh || org?.name?.name_kh;
                            const orgNameEn = org?.name_en || org?.name?.name_en;
                            const title = orgNameKh || orgNameEn || 'អ្នកប្រើប្រាស់';
                            const subtitle = resolveOrgSubtitle(org);
                            return {
                                id: role.id,
                                organizationId: orgId,
                                title,
                                subtitle,
                                logo: logo || undefined,
                                icon: logo ? undefined : 'mdi:account-circle',
                                badgeIcon: 'mdi:star',
                                badgeColor: 'text-white',
                                badgeBgClass: 'bg-amber-500',
                                badgeSize: 'icon-size-4',
                                group: 'user',
                                isActive,
                                switchedAt,
                            } as SwitchRoleRow;
                        }
                        default: {
                            const orgNameKh = org?.name_kh || org?.name_en || org?.name?.name_kh || role.name_kh || role.name_en || role.slug || '';
                            const subtitle = resolveOrgSubtitle(org, role.name_kh || role.name_en || undefined);
                            return {
                                id: role.id,
                                organizationId: orgId,
                                title: orgNameKh,
                                subtitle,
                                logo: logo || undefined,
                                icon: logo ? undefined : (role.icon || 'mdi:account-circle'),
                                badgeIcon: logo ? (role.icon || 'mdi:account') : undefined,
                                badgeColor: 'text-blue-500',
                                group: 'other',
                                isActive,
                                switchedAt,
                            } as SwitchRoleRow;
                        }
                    }
                });
                this._buildDisplayGroups();
            },
            error: () => {},
        });
    }
    onSelectDisplay(item: SwitchRoleRow): void {
        if (item.id != null) {
            this._saveRecentOrgId(item.id);
        }
        // if (this._canClick === false) {
        //     return;
        // }
        // this._canClick = false;
        // this._dialogRef.disableClose = true;

        // Cover the whole switch — the POST and then the reload — with the same
        // splash screen index.html shows on a cold boot, so there is no dead
        // time between the click and the new document taking over.
        this._splashScreen.show();
        // Paint the target role's branding right away instead of leaving the
        // previous org's logo up until the reloaded document re-derives it from
        // the JWT — item.logo is already warm in the browser's image cache from
        // rendering this row, so this swap is instant.
        this._splashScreen.setLogo(item.logo);

        this._httpClient.post<ResponseLogin>(`${env.API_BASE_URL}/account/profile/switch`, { role_id: item.id }).subscribe({
            next: (res) => {

                // this._canClick = true;
                this.authService.accessToken = res.token;
                localStorage.setItem('preferredRoleId', String(item.id));
                if (item.organizationId) {
                    localStorage.setItem('preferredOrganizationId', item.organizationId);
                } else {
                    localStorage.removeItem('preferredOrganizationId');
                }
                this._reloadIntoRedirect();
            },
            error: (err) => {
                // Nothing is going to reload now, and the service only auto-hides
                // on the first NavigationEnd (which fired at boot), so the splash
                // has to be taken down by hand or it covers the app forever.
                this._splashScreen.hide();
                // this._canClick = true;
                this._dialogRef.disableClose = false;
                const errors: { field: string, message: string }[] | undefined = err.error?.errors;
                let message: string = err.error?.message ?? GlobalConstants.genericError;
                if (errors && errors.length > 0) {
                    message = errors.map((obj) => obj.message).join(', ');
                }
                this._snackbar.openSnackBar(message, GlobalConstants.error);
            },
        });
    }

    openOrgDialog(groupKey?: string): void {
        const allRoles = groupKey
            ? this.displayRoles.filter((r) => r.group === groupKey)
            : this.allOrgRoles;

        const dialogConfig = this._dialogConfigService.getCenterDialogConfig(
            { roles: allRoles },
            '520px'
        );
        dialogConfig.disableClose = false;

        const dialogRef = this._matDialog.open(OrganizationSwitchDialogComponent, dialogConfig);
        dialogRef.afterClosed().subscribe((selectedRole: SwitchRoleRow) => {
            if (selectedRole) {
                this.onSelectDisplay(selectedRole);
            }
        });
    }

    /**
     * Set the destination first, then reload. The order matters: reload()
     * navigates to whatever the URL is when the navigation is processed, so
     * assigning the hash afterwards is a race over which route the fresh
     * document boots on. Hash first means it always boots at /redirect, where
     * RedirectGuard decodes the new token and picks the role's home.
     */
    private _reloadIntoRedirect(): void {
        window.location.hash = '/redirect';
        window.location.reload();
    }

    private _fileUrl(file: any): string | null {
        if (!file) return null;
        const uri = file.uri ?? file.url;
        if (!uri) return null;
        if (/^https?:\/\//i.test(uri)) return uri;
        let domain = file.file_domain || env.FILE_BASE_URL || '';
        if (!domain || domain.includes('${')) domain = '';
        domain = domain.replace(/\/+$/, '');
        const path = String(uri).replace(/^\/+/, '');
        return domain ? `${domain}/${path}` : `/${path}`;
    }

    // private _canClick: boolean = true;
    private readonly _dialogRef = inject(MatDialogRef<SwitchRoleComponent>);
    private readonly _matDialog = inject(MatDialog);
    private readonly _dialogConfigService = inject(DialogConfigService);
    private readonly _httpClient = inject(HttpClient);
    private readonly _snackbar = inject(SnackbarService);
    private readonly _splashScreen = inject(HelperSplashScreenService);

    ngOnInit(): void {
        this._loadRoles();
    }

    //=======================================================================
    authService = inject(AuthService);
    userService = inject(UserService);
    //=======================================================================
    close(): void {
        // if (!this._canClick) {
        //     return;
        // }
        this._dialogRef.close();
    }
}
