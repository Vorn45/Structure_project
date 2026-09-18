import { IsOptional, IsString } from 'class-validator';

export class UpdateSettingsDto {
    @IsOptional()
    @IsString()
    organization_name_kh?: string;

    @IsOptional()
    @IsString()
    organization_name_en?: string;

    @IsOptional()
    @IsString()
    code?: string;

    @IsOptional()
    @IsString()
    domain?: string;

    @IsOptional()
    departments?: Array<{
        id: string;
        name_kh: string;
        name_en: string;
        head: string;
        member_count: number;
    }>;

    @IsOptional()
    work_categories?: string[];

    @IsOptional()
    @IsString()
    logo?: string;

    @IsOptional()
    @IsString()
    contact_email?: string;

    @IsOptional()
    @IsString()
    contact_phone?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsString()
    currency?: string;

    @IsOptional()
    @IsString()
    timezone?: string;

    @IsOptional()
    @IsString()
    primary_color?: string;

    @IsOptional()
    preferences?: {
        allow_mobile_checkin?: boolean;
        auto_notify_telegram?: boolean;
    };
}

