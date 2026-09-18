// ===========================================================================>> Admin TypeScript Domain Interfaces

export interface AdminStats {
    kpi: {
        total_projects: number;
        active_projects: number;
        completed_projects: number;
        planning_projects: number;
        total_tasks: number;
        completed_tasks: number;
        in_progress_tasks?: number;
        pending_tasks?: number;
        task_completion_rate: number;
        active_users: number;
        total_users: number;
        pending_leaves: number;
    };
    kpi_badges?: {
        members: string;
        projects: string;
        leaves: string;
    };
    sparklines?: {
        members: number[];
        projects: number[];
        leaves: number[];
    };
    task_distribution?: {
        completed: number;
        in_progress: number;
        pending: number;
        completion_percentage: number;
    };
    trend?: {
        weekly: {
            days: string[];
            in_progress: number[];
            completed: number[];
        };
        monthly: {
            months: string[];
            in_progress: number[];
            completed: number[];
        };
        yearly: {
            years: string[];
            in_progress: number[];
            completed: number[];
        };
    };
    scheduled_meetings?: Array<{
        id: string;
        title: string;
        time: string;
        dateGroup: string;
        dateLabel: string;
        badgeColor: string;
        borderClass: string;
        members: string[];
        extraCount: number;
    }>;
    top_performers?: Array<{
        id: string;
        name: string;
        name_kh: string;
        email: string;
        role: string;
        avatar: string;
        initials: string;
        avatarBg: string;
        tasks_completed?: number;
        tasks_1d?: number;
        tasks_7d?: number;
        tasks_1m?: number;
        tasks_1y?: number;
        tasks_all?: number;
    }>;
    projects_summary: Array<{
        id: string;
        code: string;
        name: string;
        status: string;
        progress: number;
        total_tasks: number;
        completed_tasks: number;
        lead: string;
    }>;
    department_stats: Array<{
        name: string;
        name_en: string;
        members: number;
        progress: number;
    }>;
    recent_activity: Array<{
        id: string;
        text: string;
        user: string;
        time: string;
    }>;
}

export interface AdminUser {
    id: number;
    name_kh: string;
    name_en: string;
    email: string;
    phone: string;
    role: string;
    department: string;
    position: string;
    avatar?: string | null;
    is_active: number;
    projects_count: number;
    created_at: string;
    telegram_username?: string | null;
    gender?: string | null;
    date_of_birth?: string | null;
    address?: string | null;
    join_date?: string | null;
    note?: string | null;
    password?: string;
    _avatarFailed?: boolean;
}

export interface AdminProject {
    id: string;
    code: string;
    name: string;
    description: string;
    status: 'active' | 'completed' | 'on_hold' | 'planning';
    progress: number;
    start_date: string;
    end_date: string;
    budget?: number;
    spent?: number;
    currency?: string;
    total_tasks: number;
    completed_tasks: number;
    logo?: string | null;
    image?: string | null;
    members: Array<{
        id: number;
        user_id?: number | string | null;
        name: string;
        role: string;
        avatar?: string | null;
        email?: string | null;
        phone?: string | null;
    }>;
    tasks?: any[];
    phases?: any[];
    meetings?: any[];
    links?: any[];
    agileTasks?: any[];
}

export interface AdminLeaveRequest {
    id: string;
    user_id: number;
    user_name: string;
    department: string;
    leave_type: 'annual' | 'sick' | 'special' | 'maternity';
    start_date: string;
    end_date: string;
    duration_days: number;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    applied_at: string;
    reviewer_comment?: string;
}

export interface AdminAttendanceData {
    total_staff: number;
    present_today: number;
    late_today: number;
    on_leave: number;
    logs: Array<{
        id: string;
        user_id: number;
        user_name: string;
        user_en: string;
        department: string;
        check_in: string;
        check_out?: string | null;
        status: 'on_time' | 'late';
        date: string;
        location?: string;
        avatar?: string | null;
    }>;
}

export interface AdminClient {
    id: number;
    company_name: string;
    name_kh: string;
    name_en: string;
    email: string;
    phone: string;
    industry: string;
    contact_person: string;
    contact_phone?: string;
    contact_email?: string;
    status: 'active' | 'inactive' | 'lead' | 'contracted';
    projects_count: number;
    address?: string;
    website?: string;
    logo?: string | null;
    note?: string;
    created_at: string;
}

export interface AdminSettingsData {
    id?: string;
    organization_name_kh: string;
    organization_name_en: string;
    code: string;
    domain: string;
    departments: Array<{
        id: string;
        name_kh: string;
        name_en: string;
        head: string;
        member_count: number;
    }>;
    work_categories: string[];
    logo?: string | null;
    contact_email?: string;
    contact_phone?: string;
    address?: string;
    currency?: string;
    timezone?: string;
    primary_color?: string;
    preferences?: {
        allow_mobile_checkin?: boolean;
        auto_notify_telegram?: boolean;
    };
}

export interface AdminUserInvitation {
    id: string;
    email: string;
    name?: string | null;
    role: string;
    department?: string | null;
    position?: string | null;
    status: 'pending' | 'accepted' | 'expired' | 'revoked';
    expires_at: string;
    created_at: string;
    invite_link?: string;
    token?: string;
}

export interface InviteUserPayload {
    email: string;
    name?: string;
    role?: string;
    department?: string;
    position?: string;
    note?: string;
}
