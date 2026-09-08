export class QueryNotificationDto {
    limit?: number;
    offset?: number;
    unread_only?: string | boolean;
}

export class QueryChatNotificationDto {
    archived?: string | boolean;
}

export class QueryTaskChatNotificationDto {
    offset?: number;
    limit?: number;
}

export class MarkReadManyDto {
    ids: string[];
}

export class UpdateNotificationSettingDto {
    enabled?: boolean;
    muted_until?: string | null;
    sound?: boolean;
    web?: boolean;
    web_muted_until?: string | null;
    mobile?: boolean;
    email?: boolean;
    telegram?: boolean;
}

export class SaveFcmTokenDto {
    token: string;
    device_name?: string;
    platform?: string;
}
