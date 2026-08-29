import Pagination from 'helper/interfaces/pagination.interface';

export interface ResponseProfile {
    token: string;
    message: string;
}

export interface ProfileUpdate {
    name_kh?: string;
    name_en?: string;
    kh_name?: string;
    en_name?: string;
    name?: string;
    phone?: string;
    phone_number?: string;
    email?: string;
    avatar?: string;
    sex_id?: number;
    date_of_birth?: string;
    telegram_username?: string;
}

export interface PasswordReq {
    current_password: string;
    new_password: string;
}

export interface List extends Pagination {
    data: Data[];
}

export interface Data {
    id: number;
    action: string;
    details: string;
    ip_address: string;
    browser: string;
    os: string;
    platform: string;
    timestamp?: string | number | null;
    logged_in_at?: string | number | null;
    date_log_in?: string | number | null;
    last_activity_at?: string | number | null;
    created_at?: string | number | null;
    device_type?: string | null;
    country?: string | null;
    region?: string | null;
    city?: string | null;
}

export interface TelegramLinkStatus {
    telegram_linked: boolean;
    telegram_username: string | null;
}

export interface PasskeyCredentialSummary {
    id: number;
    device_name: string;
    device_type: string | null;
    transports: string[] | null;
    backed_up: boolean;
    created_at: string;
    last_used_at: string | null;
}

export interface ProfileDevice {
    id: number | string;
    name?: string | null;
    device?: string | null;
    device_id?: string | null;
    platform: string | null;
    os: string | null;
    browser?: string | null;
    device_type: string | null;
    country: string | null;
    country_code?: string | null;
    region?: string | null;
    city: string | null;
    timezone?: string | null;
    ip?: string | null;
    last_time_access?: string | number | null;
    last_activity_at?: string | number | null;
    last_activity?: string | number | null;
    last_active_at?: string | number | null;
    last_active?: string | number | null;
    last_used_at?: string | number | null;
    logged_in_at?: string | number | null;
    date_log_in?: string | number | null;
    created_at?: string | number | null;
    first_login_at?: string | number | null;
    updated_at?: string | number | null;
    this_devices?: boolean | number | null;
    is_current?: boolean | number | null;
    current?: boolean | number | null;
    is_active?: boolean | number | null;
    active?: boolean | number | null;
    status?: string | number | null;
}

export interface ProfileSession {
    id?: number | string;
    device_id?: string | null;
    device_name?: string | null;
    platform?: string | null;
    os?: string | null;
    browser?: string | null;
    device_type?: string | null;
    user_agent?: string | null;
    ip?: string | null;
    country_code?: string | null;
    region?: string | null;
    city?: string | null;
    latitude?: string | number | null;
    longitude?: string | number | null;
    timezone?: string | null;
    login_method?: number | string | null;
    is_active?: boolean | number | null;
    last_activity_at?: string | number | null;
    created_at?: string | number | null;
}

export interface ProfileSessionLog {
    id?: number | string;
    device_id?: string | null;
    device_name?: string | null;
    platform?: string | null;
    os?: string | null;
    browser?: string | null;
    device_type?: string | null;
    user_agent?: string | null;
    ip?: string | null;
    created_at?: string | number | null;
}

export interface ProfileLoginHistory {
    sessions: ProfileSession[];
    sessionLogs: ProfileSessionLog[];
}

export interface PasswordLastChange {
    changedAt: string | null;
    daysSinceChange: number | null;
    last_password_changed_at?: string | null;
    days_since_password_changed?: number | null;
}
