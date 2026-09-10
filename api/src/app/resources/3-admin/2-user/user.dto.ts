import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class QueryAdminUserDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    role?: string;

    @IsOptional()
    @IsString()
    department?: string;

    @IsOptional()
    @IsString()
    status?: string;
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
    is_active?: number;

    @IsOptional()
    @IsString()
    avatar?: string;

    @IsOptional()
    @IsString()
    telegram_username?: string;

    @IsOptional()
    @IsString()
    gender?: string;

    @IsOptional()
    @IsString()
    date_of_birth?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsString()
    join_date?: string;

    @IsOptional()
    @IsString()
    note?: string;

    @IsOptional()
    @IsString()
    password?: string;
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
    avatar?: string;

    @IsOptional()
    @IsString()
    telegram_username?: string;

    @IsOptional()
    @IsString()
    gender?: string;

    @IsOptional()
    @IsString()
    date_of_birth?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsString()
    join_date?: string;

    @IsOptional()
    @IsString()
    note?: string;

    @IsOptional()
    @IsString()
    password?: string;
}
