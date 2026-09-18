// ===========================================================================>> Custom Library
import { UserPayload } from 'src/app/interface/jwt.interface';

// ======================================= >> Code Starts Here << ========================== //
export function isSuperAdministrator(user?: Partial<UserPayload> | null): boolean {
    if (!user || !Array.isArray(user.roles)) return false;
    return user.roles.some((role: any) => {
        const slug = (role?.slug || '').toLowerCase().trim();
        const nameEn = (role?.name_en || '').toLowerCase().trim();
        const nameKh = (role?.name_kh || '').trim();
        return (
            slug === 'superadmin' ||
            slug === 'super_admin' ||
            nameEn === 'super administrator' ||
            nameEn === 'superadmin' ||
            nameEn === 'super admin' ||
            nameKh === 'អភិបាលប្រព័ន្ធ'
        );
    });
}

export function isOrgAdministrator(user?: Partial<UserPayload> | null): boolean {
    if (!user || !Array.isArray(user.roles)) return false;
    return user.roles.some((role: any) => {
        const slug = (role?.slug || '').toLowerCase().trim();
        const nameEn = (role?.name_en || '').toLowerCase().trim();
        const nameKh = (role?.name_kh || '').trim();
        return (
            slug === 'org_admin' ||
            slug === 'admin' ||
            slug === 'org_owner' ||
            nameEn === 'organization admin' ||
            nameEn === 'administrator' ||
            nameEn === 'admin' ||
            nameKh === 'អ្នកគ្រប់គ្រងអង្គភាព' ||
            nameKh === 'រដ្ឋបាល'
        );
    });
}

export function isAdminOrSuperAdmin(user?: Partial<UserPayload> | null): boolean {
    return isSuperAdministrator(user) || isOrgAdministrator(user);
}

export function hasAnyRole(
    user: Partial<UserPayload> | null | undefined,
    allowedSlugs: string[],
): boolean {
    if (!user || !Array.isArray(user.roles)) return false;
    if (isSuperAdministrator(user)) return true;

    const normalizedAllowed = allowedSlugs.map((s) => s.toLowerCase().trim());
    return user.roles.some((role: any) => {
        const slug = (role?.slug || '').toLowerCase().trim();
        const nameEn = (role?.name_en || '').toLowerCase().trim();
        return normalizedAllowed.includes(slug) || normalizedAllowed.includes(nameEn);
    });
}

