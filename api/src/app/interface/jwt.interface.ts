export class UserPayload {
    id: number;
    session_id?: number;
    sex_id: number;
    avatar: FilePayload | null;
    name_kh: string;
    name_en: string;
    phone: string;
    email?: string | null;
    is_active: number;
    organization_id?: string | null;
    organization?: OrganizationPayload | null;
    roles: Role[];
}

export class FilePayload {
    id?: number;
    title?: string;
    extention?: string;
    type?: string;
    size?: number;
    uri: string | null;
    file_domain: string | null;
}

export class Role {
    id: number;
    name_kh: string;
    name_en: string;
    slug?: string;
    icon: string;
    color: string;
    avatar?: FilePayload | null;
    background?: FilePayload | null;
    is_default?: boolean;
    organization_id?: string | null;
}

export class OrganizationPayload {
    id: string;
    name: {
        name_en: string | null;
        name_kh: string | null;
    };
    logo?: FilePayload | null;
    primary_color?: string | null;
    organization_position?: {
        name_en: string | null;
        name_kh: string | null;
    } | null;
}

export default interface TokenPayload {
    user: UserPayload;
    iat: number;
    exp: number;
}
