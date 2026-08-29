import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnInit, OnDestroy, Optional } from '@angular/core';
import {
    MAT_DIALOG_DATA,
    MatDialog,
    MatDialogConfig,
    MatDialogModule,
    MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { MatButtonModule } from '@angular/material/button';
import { Subject, takeUntil } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { Router } from '@angular/router';

import { DialogConfigService } from 'app/shared/dialog-config.service';
import { ProfileService } from '../profile.service';
import { UpdateProfileDialogComponent } from './update/component';
import { ProfileSecurityComponent } from '../dialog/security/component';
import { QRDialogComponent } from 'app/shared/qr/component';
import { ChangePasswordProfileComponent } from '../dialog/change-password/component';
import { UserService } from 'app/core/user/user.service';
import { AuthService } from 'app/core/auth/auth.service';
import { SideDialogCloseButtonComponent } from 'app/shared/side-dialog-close-button/component';

import { ResponseLogin } from 'app/core/auth/auth.types';
import { toRoleArray, readPreferredRoleId } from 'app/core/auth/resolvers/role.util';
import { env } from 'envs/env';
import { HelperSplashScreenService } from 'helper/services/splash-screen';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { HelperConfirmationService } from 'helper/services/confirmation/confirmation.service';
import { OrganizationSwitchDialogComponent } from '../dialog/organization-switch/component';
import { TimeAgoPipe } from 'app/shared/time-ago.pipe';

export interface SwitchRoleRow {
    id?: number;
    organizationId?: string;
    title: string;
    subtitle?: string;
    logo?: string;
    cover?: string;
    rawOrg?: any;
    icon?: string;
    badgeIcon?: string;
    badgeImage?: string;
    badgeColor?: string;
    badgeBgClass?: string;
    badgeSize?: string;
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
    standalone: true,
    imports: [
        CommonModule,
        MatIconModule,
        MatMenuModule,
        MatDividerModule,
        TranslocoModule,
        MatDialogModule,
        MatButtonModule,
        MatTooltipModule,
        MatProgressSpinnerModule,
        SideDialogCloseButtonComponent,
        TimeAgoPipe,
    ],
    selector: 'profile-component-view',
    templateUrl: './template.html',
    styleUrls: ['./style.scss'],
})
export class ProfileViewComponent implements OnInit, OnDestroy {
    public user: any = {};
    public current_lang: string = '';
    public isAvatarUpdating = false;
    public fileInput: any;
    public isLoadingRoles: boolean = true;
    public activeTab: 'my-work' | 'unit-work' = 'my-work';

    private static readonly DEFAULT_AVATAR = '/images/placeholder/avatar.jpg';
    public displayRoles: SwitchRoleRow[] = [];
    public readonly skeletons = Array.from({ length: 4 });
    private static readonly GROUP_ORDER = ['org', 'user', 'personal', 'other'];
    private static readonly GROUP_HEADERS: Record<string, string> = {
        org: 'រដ្ឋបាល',
        user: 'អ្នកប្រើប្រាស់',
        personal: 'កន្លែងធ្វើការផ្ទាល់ខ្លួន',
    };
    public displayGroups: { key: string; header?: string; items: SwitchRoleRow[]; hiddenCount: number }[] = [];

    get systemRoles(): SwitchRoleRow[] {
        return this.displayRoles.filter((r) => r.group === 'system');
    }

    get superAdminRole(): SwitchRoleRow | undefined {
        return this.systemRoles[0];
    }

    get isPersonalWorkspaceActive(): boolean {
        return !!this.displayRoles.find((item) => item.group === 'personal')?.isActive;
    }

    private readonly _fileBaseUrl = env.FILE_BASE_URL;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        @Optional()
        @Inject(MAT_DIALOG_DATA)
        public dialog_data: {
            data?: any;
            role?: any;
            type?: string;
            is_return?: boolean;
        } | null,
        private _translocoService: TranslocoService,
        private _userService: UserService,
        private _authService: AuthService,
        private _matDialog: MatDialog,
        private _service: ProfileService,
        private _dialogConfigService: DialogConfigService,
        private _httpClient: HttpClient,

        private _splashScreen: HelperSplashScreenService,
        private _snackbar: SnackbarService,
        private _router: Router,
        private _confirmationService: HelperConfirmationService,
        @Optional() private _dialogRef?: MatDialogRef<ProfileViewComponent>,
    ) {
        if (this.dialog_data?.data) {
            this.user = this.dialog_data.data;
        }
        this._translocoService.langChanges$.pipe(takeUntil(this._unsubscribeAll)).subscribe((lang) => {
            this.current_lang = lang;
        });
        this._userService.user$.pipe(takeUntil(this._unsubscribeAll)).subscribe((item) => {
            const base = item ?? this.dialog_data?.data ?? {};
            const storedEmail = localStorage.getItem('2fa_email') || localStorage.getItem('userEmail') || localStorage.getItem('email');
            const storedPhone = localStorage.getItem('2fa_phone');
            this.user = {
                ...base,
                ...(!base?.email && storedEmail ? { email: storedEmail } : {}),
                ...(!base?.phone && storedPhone ? { phone: storedPhone } : {}),
            };
        });
    }

    ngOnInit() {
        const storedEmail = localStorage.getItem('2fa_email') || localStorage.getItem('userEmail') || localStorage.getItem('email');
        const storedPhone = localStorage.getItem('2fa_phone');
        if (this.user) {
            if (!this.user.email && storedEmail) this.user.email = storedEmail;
            if (!this.user.phone && storedPhone) this.user.phone = storedPhone;
        }
        this._loadRoles();
    }

    public allOrgRoles: SwitchRoleRow[] = [];
    public hiddenOrgCount: number = 0;
    private static readonly RECENT_ORGS_KEY = 'recent_organization_history';
    private static readonly RECENT_ORGS_TIMESTAMPS_KEY = 'recent_organization_timestamps';

    private _getRecentOrgIds(): number[] {
        try {
            const raw = localStorage.getItem(ProfileViewComponent.RECENT_ORGS_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed.map((id: any) => Number(id)).filter((id: number) => !isNaN(id)) : [];
        } catch {
            return [];
        }
    }

    private _getRecentOrgTimestamps(): Record<string, number> {
        try {
            const raw = localStorage.getItem(ProfileViewComponent.RECENT_ORGS_TIMESTAMPS_KEY);
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
            localStorage.setItem(ProfileViewComponent.RECENT_ORGS_KEY, JSON.stringify(list));

            const timestamps = this._getRecentOrgTimestamps();
            timestamps[String(roleId)] = Date.now();
            localStorage.setItem(ProfileViewComponent.RECENT_ORGS_TIMESTAMPS_KEY, JSON.stringify(timestamps));
        } catch { }
    }

    // Role Switching Logic
    private _buildDisplayGroups(): void {
        const orgRoles = this.displayRoles.filter((r) => r.group === 'org');
        const userRoles = this.displayRoles.filter((r) => r.group === 'user');
        const otherRoles = this.displayRoles.filter((r) => r.group !== 'system' && r.group !== 'personal' && r.group !== 'org' && r.group !== 'user');

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

        const totalShown = (buckets.get('org')?.length || 0) + (buckets.get('user')?.length || 0) + (buckets.get('other')?.length || 0);
        this.hiddenOrgCount = Math.max(0, this.allOrgRoles.length - totalShown);

        // The personal workspace has its own "ការងារខ្ញុំ" button up top
        // (see switchToPersonalWorkspace) — don't also list it down here.
        this.displayGroups = ProfileViewComponent.GROUP_ORDER
            .filter((key) => key !== 'personal' && buckets.has(key))
            .map((key) => ({
                key,
                header: ProfileViewComponent.GROUP_HEADERS[key],
                items: buckets.get(key)!,
                hiddenCount: hiddenCounts.get(key) || 0,
            }));
    }

    trackGroup = (_index: number, group: { key: string }): string => group.key;
    trackRole = (_index: number, item: SwitchRoleRow): number | string => item.id ?? item.title;

    private _loadRoles(): void {
        this.isLoadingRoles = true;
        this._httpClient.get<any>(`${env.API_BASE_URL}/account/profile/roles`).pipe(
            finalize(() => this.isLoadingRoles = false),
        ).subscribe({
            next: (res) => {
                const roles: any[] = toRoleArray(res?.data?.roles);
                if (!roles.length) return;
                const activeRoleId = readPreferredRoleId();
                if (activeRoleId != null) {
                    this._saveRecentOrgId(activeRoleId);
                }
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
                            const cover = this._fileUrl(org?.background_logo ?? org?.cover ?? org?.backgroud_logo ?? org?.backgroud);
                            return {
                                id: role.id,
                                organizationId: orgId,
                                title,
                                subtitle,
                                logo: logo || undefined,
                                cover: cover || undefined,
                                rawOrg: org,
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
                            const avatarUrl = this._fileUrl(role.avatar ?? this.user?.avatar) ?? undefined;
                            const orgNameKh = org?.name_kh || org?.name?.name_kh;
                            const orgNameEn = org?.name_en || org?.name?.name_en;
                            const title = orgNameKh || orgNameEn || 'អ្នកប្រើប្រាស់';
                            const subtitle = resolveOrgSubtitle(org);
                            const cover = this._fileUrl(org?.background_logo ?? org?.cover ?? org?.backgroud_logo ?? org?.backgroud);
                            return {
                                id: role.id,
                                organizationId: orgId,
                                title,
                                subtitle,
                                logo: logo || undefined,
                                cover: cover || undefined,
                                rawOrg: org,
                                icon: logo ? undefined : 'mdi:account-circle',
                                group: 'user',
                                isActive,
                                switchedAt,
                            } as SwitchRoleRow;
                        }
                        case 'personal_workspace': {
                            const avatarUrl = this._fileUrl(role.avatar ?? this.user?.avatar) ?? undefined;
                            return {
                                id: role.id,
                                organizationId: orgId,
                                title: 'កន្លែងធ្វើការផ្ទាល់ខ្លួន',
                                subtitle: undefined,
                                logo: undefined,
                                icon: 'mdi:account-multiple-outline',
                                badgeImage: avatarUrl || ProfileViewComponent.DEFAULT_AVATAR,
                                badgeIcon: undefined,
                                badgeColor: 'text-teal-500',
                                group: 'personal',
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
            error: () => { },
        });
    }

    onSelectDisplay(item: SwitchRoleRow): void {
        if (item.isActive) {
            return;
        }
        if (item.id != null) {
            this._saveRecentOrgId(item.id);
        }
        this._splashScreen.show();
        this._splashScreen.setLogo(item.logo);
        this._httpClient.post<ResponseLogin>(`${env.API_BASE_URL}/account/profile/switch`, { role_id: item.id }).subscribe({
            next: (res) => {
                this._authService.accessToken = res.token;
                localStorage.setItem('preferredRoleId', String(item.id));
                if (item.organizationId) {
                    localStorage.setItem('preferredOrganizationId', item.organizationId);
                } else {
                    localStorage.removeItem('preferredOrganizationId');
                }
                this._reloadIntoRedirect();
            },
            error: (err) => {
                this._splashScreen.hide();
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

    leaveOrg(_item: SwitchRoleRow): void { }

    private _reloadIntoRedirect(): void {
        window.location.hash = '/redirect';
        window.location.reload();
    }

    /** "ការងារខ្ញុំ" tab — switches straight into the personal workspace role. */
    switchToPersonalWorkspace(): void {
        const role = this.displayRoles.find((item) => item.group === 'personal');
        if (!role || role.isActive) return;
        this.onSelectDisplay(role);
    }

    private _fileUrl(file: any): string | null {
        if (!file) return null;
        const uri = file.uri ?? file.url;
        if (!uri) return null;
        if (/^https?:\/\//i.test(uri)) return uri;
        let domain = file.file_domain || this._fileBaseUrl || '';
        if (!domain || domain.includes('${')) domain = '';
        domain = domain.replace(/\/+$/, '');
        const path = String(uri).replace(/^\/+/, '');
        return domain ? `${domain}/${path}` : `/${path}`;
    }

    // Profile Settings & Actions
    signOut(): void {
        const confirmation = this._confirmationService.open({
            title: 'បញ្ជាក់ការចាកចេញ',
            message: 'តើអ្នកប្រាកដថាចង់ចាកចេញពីប្រព័ន្ធមែនទេ?',
            icon: { show: true, name: 'heroicons_outline:arrow-right-on-rectangle', color: 'warn' },
            actions: {
                confirm: { show: true, label: 'ចាកចេញ', color: 'warn' },
                cancel: { show: true, label: 'បោះបង់' },
            },
            dismissible: true,
        });

        confirmation.afterClosed().subscribe(result => {
            if (result === 'confirmed') {
                this._dialogRef.close();
                this._authService.signOut();
                this._router.navigateByUrl('/auth/sign-in');
            }
        });
    }

    settingDialog(): void { }

    openCreateOrganization(): void { }

    openUnderConstruction(_featureName?: string): void { }

    /** Template action bindings can't use the transloco pipe directly, so this wraps translate() for use inside (click) handlers. */
    translate(key: string): string {
        return this._translocoService.translate(key);
    }

    openAboutOrg(_item: SwitchRoleRow): void { }

    updateProfile(): void {
        const dialogConfig = this._dialogConfigService.getDialogConfig(this.user);
        const dialogRef = this._matDialog.open(UpdateProfileDialogComponent, dialogConfig);
        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                const oldAvatar = this.user?.avatar;
                this.user = this.mergeUser(this.user, result);

                const avatarUrl = this.getImageUrl(this.user?.avatar, 'avatar');
                const avatarChanged = !!result.avatar && this.user.avatar !== oldAvatar;

                if (avatarChanged) {
                    this.isAvatarUpdating = true;
                    this.waitForAvatarToLoad(avatarUrl);
                }
            }
        });
    }

    openPasswordDialog(): void {
        const dialogConfig = this._dialogConfigService.getDialogConfig(null);
        this._matDialog.open(ChangePasswordProfileComponent, dialogConfig);
    }

    securityDialog(): void {
        const dialogConfig = this._dialogConfigService.getDialogConfig(null);
        this._matDialog.open(ProfileSecurityComponent, dialogConfig);
    }

    reportBugDialog(): void { }

    openMyWorkReport(): void { }

    openQrDialog(): void {
        this._matDialog.open(QRDialogComponent, {
            autoFocus: false,
            width: '100dvw',
            maxWidth: '600px',
            enterAnimationDuration: '0s',
            data: { with_token: true },
        });
    }

    openCroppedDialog(_event: Event, _aspect: number = 1 / 1, _type?: 'avatar' | 'cover', _onClose?: () => void): void { }

    uploadProfileDialog(): void {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e: any) => {
            const file = e.target.files?.[0];
            if (file) {
                this.isAvatarUpdating = true;
                this._service.updateAvatar(file).subscribe({
                    next: (res: any) => {
                        this.storeUpdatedTokens(res);
                        const patch = {
                            ...(res?.data || {}),
                            avatar: res?.data?.avatar,
                        };
                        const updatedUser = this.mergeUser(this.user, patch);
                        this.user = updatedUser;
                        this._userService.user = updatedUser;
                        this.isAvatarUpdating = false;
                        this._snackbar.openSnackBar(
                            this._translocoService.translate('upload_success'),
                            GlobalConstants.success,
                        );
                    },
                    error: () => {
                        this.isAvatarUpdating = false;
                        this._snackbar.openSnackBar(
                            this._translocoService.translate('update_error'),
                            GlobalConstants.error,
                        );
                    },
                });
            }
        };
        input.click();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    private mergeUser(currentUser: any, patch: any): any {
        const nextUser = {
            ...(currentUser || {}),
            ...(patch || {}),
        };

        const getKhName = (u: any) =>
            u?.name_kh ||
            u?.kh_name ||
            u?.name?.name_kh ||
            (typeof u?.name === 'string' ? u?.name : null);
        const getEnName = (u: any) =>
            u?.name_en ||
            u?.en_name ||
            u?.name?.name_en ||
            (typeof u?.name === 'string' ? u?.name : null);

        nextUser.kh_name = getKhName(patch) || getKhName(currentUser);
        nextUser.en_name = getEnName(patch) || getEnName(currentUser);
        nextUser.phone =
            patch?.phone_number ??
            patch?.phone ??
            currentUser?.phone_number ??
            currentUser?.phone ??
            null;
        nextUser.email = patch?.email ?? currentUser?.email ?? null;

        return nextUser;
    }

    private storeUpdatedTokens(response: any): void {
        if (response?.token) {
            this._authService.accessToken = response.token;
        }
        if (response?.refresh_token) {
            this._authService.refreshToken = response.refresh_token;
        }
    }

    private dataUrlToFile(dataUrl: string): File {
        const [header, encodedData] = dataUrl.split(',');
        const contentType = header?.match(/data:(.*?);base64/)?.[1] || 'image/png';
        const binary = atob(encodedData || '');
        const bytes = new Uint8Array(binary.length);

        for (let index = 0; index < binary.length; index++) {
            bytes[index] = binary.charCodeAt(index);
        }

        const extension = contentType.split('/')[1] || 'png';
        return new File([bytes], `avatar.${extension}`, { type: contentType });
    }

    private waitForAvatarToLoad(avatarUrl: string): void {
        const startedAt = performance.now();
        const image = new Image();

        const finishLoading = () => {
            const elapsed = performance.now() - startedAt;
            const minimumLoadingTime = 1200;

            window.setTimeout(() => {
                this.isAvatarUpdating = false;
            }, Math.max(0, minimumLoadingTime - elapsed));
        };

        image.onload = finishLoading;
        image.onerror = finishLoading;
        image.src = avatarUrl;
    }

    getImageUrl(imageObj: any, type: 'avatar' | 'cover'): string {
        const image =
            typeof imageObj === 'string' ? imageObj : imageObj?.uri || null;

        if (!image) {
            return type === 'avatar'
                ? '/images/placeholder/avatar.jpg'
                : 'images/apps/phnom_penh.png';
        }

        if (image.startsWith('data:image/') || image.startsWith('http')) {
            return image;
        }

        const fileDomain = imageObj?.file_domain || this._fileBaseUrl || '';
        return `${fileDomain}${image.startsWith('/') ? image : `/${image}`}`;
    }
}

