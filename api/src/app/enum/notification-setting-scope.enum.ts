/**
 * Which stream of notifications a `notification.user_setting` row governs.
 * Each scope is stored as its own row, so a user can silence one without
 * touching the other.
 */
export enum NotificationSettingScope {
    /** Everything except project/organization group chat: tasks, mentions in a task chat, plans… */
    GENERAL = 'general',
    /** Messages in a project's group chat. */
    PROJECT_CHAT = 'project_chat',
    /** Messages in an organization's group chat. */
    ORGANIZATION_CHAT = 'organization_chat',
}

/** The scope a notification belongs to — group chat messages carry a project/organization but no task. */
export function scopeOfNotification(notification: {
    type?: string | null;
    task_id?: string | null;
    project_id?: string | null;
    organization_id?: string | null;
}): NotificationSettingScope {
    const isChat = !!notification?.type?.startsWith('chat_');
    if (isChat && !notification?.task_id && !!notification?.project_id)
        return NotificationSettingScope.PROJECT_CHAT;
    if (isChat && !notification?.task_id && !notification?.project_id && !!notification?.organization_id)
        return NotificationSettingScope.ORGANIZATION_CHAT;
    return NotificationSettingScope.GENERAL;
}
