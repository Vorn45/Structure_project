import {
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
} from 'class-validator';

export class QueryAdminDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    role?: string;

    @IsOptional()
    @IsString()
    department?: string;

    @IsOptional()
    @IsString()
    limit?: string;

    @IsOptional()
    @IsString()
    offset?: string;
}

export class CreateAdminUserDto {
    @IsNotEmpty()
    @IsString()
    name_kh: string;

    @IsNotEmpty()
    @IsString()
    name_en: string;

    @IsOptional()
    @IsString()
    email?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    role?: string;

    @IsOptional()
    @IsString()
    department?: string;

    @IsOptional()
    @IsString()
    position?: string;

    @IsOptional()
    @IsNumber()
    sex_id?: number;

    @IsOptional()
    @IsString()
    password?: string;

    @IsOptional()
    @IsNumber()
    is_active?: number;
}

export class UpdateAdminUserDto {
    @IsOptional()
    @IsString()
    name_kh?: string;

    @IsOptional()
    @IsString()
    name_en?: string;

    @IsOptional()
    @IsString()
    email?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    role?: string;

    @IsOptional()
    @IsString()
    department?: string;

    @IsOptional()
    @IsString()
    position?: string;

    @IsOptional()
    @IsNumber()
    is_active?: number;

    @IsOptional()
    @IsString()
    password?: string;
}

export class UpdateProjectBudgetDto {
    @IsNotEmpty()
    @IsNumber()
    budget: number;

    @IsOptional()
    @IsNumber()
    spent?: number;

    @IsOptional()
    @IsString()
    currency?: string;
}

export class UpdateProjectLeadDto {
    @IsNotEmpty()
    @IsNumber()
    lead_id: number;

    @IsNotEmpty()
    @IsString()
    lead_name: string;

    @IsOptional()
    @IsString()
    lead_role?: string;
}

export class LeaveActionDto {
    @IsNotEmpty()
    @IsString()
    status: 'approved' | 'rejected' | 'pending';

    @IsOptional()
    @IsString()
    comment?: string;
}

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
