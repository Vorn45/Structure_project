import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class QueryAdminClientDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    industry?: string;
}

export class CreateAdminClientDto {
    @IsNotEmpty()
    @IsString()
    company_name: string;

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
    industry?: string;

    @IsOptional()
    @IsString()
    contact_person?: string;

    @IsOptional()
    @IsString()
    contact_phone?: string;

    @IsOptional()
    @IsString()
    contact_email?: string;

    @IsOptional()
    @IsString()
    status?: 'active' | 'inactive' | 'lead' | 'contracted';

    @IsOptional()
    projects_count?: number;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsString()
    website?: string;

    @IsOptional()
    logo?: string | null;

    @IsOptional()
    @IsString()
    note?: string;
}

export class UpdateAdminClientDto {
    @IsOptional()
    @IsString()
    company_name?: string;

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
    industry?: string;

    @IsOptional()
    @IsString()
    contact_person?: string;

    @IsOptional()
    @IsString()
    contact_phone?: string;

    @IsOptional()
    @IsString()
    contact_email?: string;

    @IsOptional()
    @IsString()
    status?: 'active' | 'inactive' | 'lead' | 'contracted';

    @IsOptional()
    projects_count?: number;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsString()
    website?: string;

    @IsOptional()
    logo?: string | null;

    @IsOptional()
    @IsString()
    note?: string;
}
