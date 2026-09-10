import { IsBoolean, IsOptional, IsString } from 'class-validator';

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
    @IsOptional()
    @IsBoolean()
    enabled?: boolean;

    @IsOptional()
    @IsString()
    muted_until?: string | null;

    @IsOptional()
    @IsBoolean()
    sound?: boolean;

    @IsOptional()
    @IsBoolean()
    web?: boolean;

    @IsOptional()
    @IsString()
    web_muted_until?: string | null;

    @IsOptional()
    @IsBoolean()
    mobile?: boolean;

    @IsOptional()
    @IsBoolean()
    email?: boolean;

    @IsOptional()
    @IsBoolean()
    telegram?: boolean;

    @IsOptional()
    @IsString()
    scope?: string;
}

export class SaveFcmTokenDto {
    token: string;
    device_name?: string;
    platform?: string;
}
