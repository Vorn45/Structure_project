export enum NotificationField {
    TITLE = 'title',
    DESCRIPTION = 'description',
    TYPE = 'type',
    STATUS = 'status',
    PRIORITY = 'priority',
    DUE_DATE = 'due_date',
}

/** Telegram message icon per changed task field (see task-notification-message.util.ts builders). */
export const NOTIFICATION_FIELD_ICON: Record<NotificationField, string> = {
    [NotificationField.TITLE]: '✏️',
    [NotificationField.DESCRIPTION]: '📝',
    [NotificationField.TYPE]: '🏷️',
    [NotificationField.STATUS]: '🔄',
    [NotificationField.PRIORITY]: '❗',
    [NotificationField.DUE_DATE]: '📅',
};
