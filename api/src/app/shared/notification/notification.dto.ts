import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class QueryNotificationDto {
    @IsOptional()
    limit?: number;

    @IsOptional()
    offset?: number;

    @IsOptional()
    unread_only?: string | boolean;
}

export class QueryChatNotificationDto {
    @IsOptional()
    archived?: string | boolean;
}

export class QueryTaskChatNotificationDto {
    @IsOptional()
    offset?: number;

    @IsOptional()
    limit?: number;
}

export class MarkReadManyDto {
    @IsOptional()
    @IsArray()
    ids?: (string | number)[];

    @IsOptional()
    id?: string | number;
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
