import { IsOptional, IsString } from 'class-validator';

export class UpdateSettingsDto {
    @IsOptional()
    @IsString()
    organization_name_kh?: string;

    @IsOptional()
    @IsString()
    organization_name_en?: string;

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
}
