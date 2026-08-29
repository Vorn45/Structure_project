export interface User {
    id            : number;
    said          : number;
    kh_name       : string;
    en_name       : string;
    phone         : string;
    avatar        : UserFile | null;
    is_active     : number;
    roles         : Role[];
    name?         : string;
    email?        : string;
    created_at?   : Date;
    sex_id?       : number;
}

export interface UserFile {
    id?          : number;
    title?       : string;
    extention?   : string;
    type?        : string;
    size?        : number;
    uri          : string | null;
    file_domain  : string | null;
}


export interface Role {
    id            : number;
    name?         : string;
    name_kh?      : string;
    name_en?      : string;
    color?        : string;
    icon?         : string;
    slug?         : string;
    is_default?   : boolean;
    organization? : RoleScope | null;
    bank?         : RoleScope | null;
}

export interface RoleScope {
    id?            : string;
    code           : string;
    name_kh?       : string | null;
    name_en?       : string | null;
    abbr?          : string | null;
    logo?          : UserFile | null;
    primary_color? : string | null;
}
