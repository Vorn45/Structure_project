export interface NotificationAvatarRef {
    id?: number;
    uri?: string | null;
    file_domain?: string | null;
    url?: string | null;
}

export interface NotificationProjectRef {
    id: string;
    name_en?: string;
    name_kh?: string;
    short_name_en?: string;
    short_name_kh?: string;
    avatar?: NotificationAvatarRef | null;
    type?: { id: number; name_en?: string; name_kh?: string } | null;
    status?: { id: number; name_en?: string; name_kh?: string } | null;
    organization?: { id: string; name_en?: string; name_kh?: string; avatar?: NotificationAvatarRef | null } | null;
    archive?: boolean;
}

export interface NotificationOrganizationRef {
    id: string;
    name_en?: string;
    name_kh?: string;
    avatar?: NotificationAvatarRef | null;
}

export interface NotificationTaskRef {
    id: string;
    task_code?: string;
    title?: string;
    avatar?: NotificationAvatarRef | null;
}

export interface NotificationLastMessageSender {
    id: number;
    name_en?: string;
    name_kh?: string;
    avatar?: NotificationAvatarRef | null;
}

export interface NotificationLastMessageValue {
    id?: number;
    name_en?: string;
    name_kh?: string;
    color?: string | null;
    icon?: NotificationAvatarRef | null;
    users?: NotificationLastMessageSender[];
    text?: string;
}

export interface NotificationLastMessage {
    source: 'message' | 'activity';
    id: string;
    content: string;
    field_name?: string | null;
    sender_id: number;
    chat_message_type_id: number | null;
    created_at: Date;
    sender?: NotificationLastMessageSender | null;
    value?: NotificationLastMessageValue | null;
}

/** GET/PATCH /shared/notification/setting — the user's delivery preferences. */
export interface NotificationSettingData {
    enabled: boolean;
    muted_until: string | null;
    sound: boolean;
    web: boolean;
    web_muted_until: string | null;
    mobile: boolean;
    email: boolean;
    telegram: boolean;
}

/** The dialog patches one switch at a time, so every field is optional. */
export type NotificationSettingPayload = Partial<NotificationSettingData>;

/** One row from GET /shared/notification/chat — a project's group chat room. */
export interface ChatNotificationEntry {
    project_id: string;
    project: NotificationProjectRef;
    room_id: string;
    unread_count: number;
    is_muted?: boolean;
    is_pinned?: boolean;
    last_message: {
        id: string;
        content: string;
        sender: { id: number; name_en?: string; name_kh?: string } | null;
        created_at: Date;
    } | null;
    last_message_at: Date | null;
}

/** One row from GET /shared/notification/organization-chat — the organization's group chat room. */
export interface OrganizationChatNotificationEntry {
    organization_id: string;
    organization: NotificationOrganizationRef;
    room_id: string;
    unread_count: number;
    is_muted?: boolean;
    is_pinned?: boolean;
    last_message: {
        id: string;
        content: string;
        sender: { id: number; name_en?: string; name_kh?: string } | null;
        created_at: Date;
    } | null;
    last_message_at: Date | null;
}

/** The task a task-chat row belongs to — has no avatar of its own, only its parent project's. */
export interface NotificationTaskChatRef {
    id: string;
    task_code?: string;
    title?: string;
    status: { id: number; name_en?: string; name_kh?: string } | null;
    priority: { id: number; name_en?: string; name_kh?: string } | null;
    type: { id: number; name_en?: string; name_kh?: string } | null;
    /** "Assigner" in the task-list filter's vocabulary — the task's reporter. */
    reporter: { id: number; name_en?: string; name_kh?: string } | null;
    /** "Receiver" in the task-list filter's vocabulary — a task can have several. */
    assignee_ids: number[];
    project_id: string | null;
    project: NotificationProjectRef | null;
}

/** One row from GET /shared/notification/task-chat — a task's chat room. */
export interface TaskChatNotificationEntry {
    task_id: string;
    task: NotificationTaskChatRef;
    room_id: string;
    unread_count: number;
    last_message: {
        id: string;
        content: string;
        sender: { id: number; name_en?: string; name_kh?: string } | null;
        created_at: Date;
    } | null;
    last_message_at: Date | null;
}

/** GET /user/invitation/:id — full detail for the invitation dialog. */
export interface InvitationDetail {
    id: string;
    email: string;
    status: string;
    expires_at: string;
    is_admin: boolean;
    organization: {
        id: string;
        name_en?: string;
        name_kh?: string;
        logo: NotificationAvatarRef | null;
    };
    position: { id: number; name_en?: string; name_kh?: string } | null;
    office: { id: number; name_en?: string; name_kh?: string } | null;
    inviter: {
        id: number;
        name_en?: string;
        name_kh?: string;
        avatar: NotificationAvatarRef | null;
    } | null;
    invitee: {
        id: number;
        name_en?: string;
        name_kh?: string;
    } | null;
    projects: {
        id: string;
        name_en?: string;
        name_kh?: string;
        avatar: NotificationAvatarRef | null;
        role: { id: number; name_en?: string; name_kh?: string } | null;
    }[];
}

export interface Notification {
    id: string;
    type: string;
    title: string;
    title_kh?: string | null;
    title_en?: string | null;
    message?: string | null;
    message_kh?: string | null;
    message_en?: string | null;
    data?: Record<string, any> | null;
    /** convenience boolean derived from the API's `is_unread` flag */
    read: boolean;
    read_at: Date | null;
    created_at: Date;
    organization: NotificationOrganizationRef | null;
    project: NotificationProjectRef | null;
    task: NotificationTaskRef | null;
    last_message?: NotificationLastMessage | null;
}
