import { RoleEnum } from 'helper/enums/role.enum';
import jwt_decode from 'jwt-decode';

/** Map a role slug/name to its default landing route. */
export const getRoleDefaultUrl = (roleName?: string): string => {
    const slug = (roleName || '').toLowerCase().trim();
    switch (slug) {
        case RoleEnum.ADMIN:
        case 'superadmin':
        case 'super-admin':
        case 'super administrator':
        case 'អភិបាលប្រព័ន្ធ':
            return '/super-admin/home';

        case RoleEnum.ORG_ADMIN:
        case 'org-admin':
        case 'orgadmin':
        case 'រដ្ឋបាល':
            return '/org-admin/home';

        case RoleEnum.BANK_ADMIN:
        case 'bank-admin':
        case 'bank admin':
            return '/bank/invoice';

        case RoleEnum.USER:
        case 'member':
        case 'អ្នកប្រើប្រាស់':
            return '/member/tasks';
        case RoleEnum.PERSONAL_WORKSPACE:
        case 'កន្លែងធ្វើការផ្ទាល់ខ្លួន':
            // Matches personalWorkspaceNavigation's "ការងារ" link exactly (?view=list),
            // so it's highlighted as active immediately on landing.
            return '/member/tasks?view=list';
        default:
            return '/org-admin/home';
    }
};

export const toRoleArray = (roles: any): any[] => {
    if (Array.isArray(roles)) return roles;
    if (roles && typeof roles === 'object') return Object.values(roles);
    return [];
};

export const pickActiveRole = (payload: any, preferredId?: number | null): any => {
    const roles = toRoleArray(payload?.user?.roles || payload?.roles);
    if (!roles.length) {
        const fallbackSlug = payload?.user?.role || payload?.role || payload?.user?.slug;
        if (fallbackSlug) {
            return { slug: fallbackSlug };
        }
        return { slug: 'org_admin' };
    }
    const activeId = preferredId ?? payload?.user?.is_active;
    return roles.find((role: any) => role?.id === activeId) ?? roles[0];
};

/** Highest-privilege first — used to choose the default role on a fresh login. */
const ROLE_PRIORITY: Record<string, number> = {
    superadmin: 0,
    admin: 0,
    org_admin: 1,
    'org-admin': 1,
    bank_admin: 2,
    user: 3,
    personal_workspace: 4,
};

export const pickPrimaryRole = (payload: any): any => {
    const roles = toRoleArray(payload?.user?.roles || payload?.roles);
    if (!roles.length) {
        const fallbackSlug = payload?.user?.role || payload?.role;
        return fallbackSlug ? { slug: fallbackSlug } : undefined;
    }
    const flagged = roles.find((role: any) => role?.is_default);
    if (flagged) return flagged;
    return roles
        .slice()
        .sort((a: any, b: any) => (ROLE_PRIORITY[a?.slug] ?? 99) - (ROLE_PRIORITY[b?.slug] ?? 99))[0];
};

/** The role id the user is currently acting as (set on login / role switch). */
export const readPreferredRoleId = (): number | null => {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('preferredRoleId') : null;
    const id = raw ? parseInt(raw, 10) : NaN;
    return Number.isFinite(id) ? id : null;
};

/** The single source of truth for "which role is active" across guards/resolvers. */
export const resolveActiveRole = (payload: any): any => pickActiveRole(payload, readPreferredRoleId());

export const pickRoleByOrganizationName = (payload: any, nameEn?: string, nameKh?: string): any => {
    const roles = toRoleArray(payload?.user?.roles || payload?.roles);
    if (!roles.length) return undefined;
    const wantedEn = (nameEn ?? '').trim().toLowerCase();
    const wantedKh = (nameKh ?? '').trim().toLowerCase();
    if (!wantedEn && !wantedKh) return undefined;

    return roles.find((role: any) => {
        const org = role.organization ?? (Array.isArray(role.organizations) ? role.organizations[0] : role.organizations);
        const orgNameEn = (org?.name_en ?? org?.name?.name_en ?? '').trim().toLowerCase();
        const orgNameKh = (org?.name_kh ?? org?.name?.name_kh ?? '').trim().toLowerCase();
        return (!!wantedEn && orgNameEn === wantedEn) || (!!wantedKh && orgNameKh === wantedKh);
    });
};

export const decodeUserFromToken = (token: string): any => {
    const tokenPayload: any = jwt_decode(token);
    const preferredRoleId = readPreferredRoleId();
    const activeRole = pickActiveRole(tokenPayload, preferredRoleId);
    const activeRoleId = activeRole?.id ?? tokenPayload?.user?.is_active;

    return {
        ...tokenPayload?.user,
        kh_name: tokenPayload?.user?.kh_name ?? tokenPayload?.user?.name_kh,
        en_name: tokenPayload?.user?.en_name ?? tokenPayload?.user?.name_en,
        is_active: activeRoleId,
        roles: toRoleArray(tokenPayload?.user?.roles).map((r: any) => ({
            ...r,
            name: r.name_en ?? r.name_kh ?? r.slug ?? '',
            is_default: r.id === activeRoleId
        }))
    };
};
