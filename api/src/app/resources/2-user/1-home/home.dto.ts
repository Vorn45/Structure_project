import { Type } from 'class-transformer';
import {
    IsArray,
    IsDateString,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';

export class HomeOverviewQueryDto {
    @IsOptional()
    @IsString()
    organization_id?: string;

    @IsOptional()
    @IsString()
    filter_period?: string; // 'today' | 'week' | 'month' | 'all'
}

// ===== Attendance DTOs =====
export class CheckInOutDto {
    @IsOptional()
    @IsString()
    note?: string;

    @IsOptional()
    @IsString()
    location?: string;
}

// ===== Meeting DTOs =====
export enum MeetingTypeEnum {
    WMS = 'wms',
    GOOGLE = 'google',
    ZOOM = 'zoom',
}

export class CreateMeetingDto {
    @IsNotEmpty()
    @IsString()
    title: string;

    @IsOptional()
    @IsEnum(MeetingTypeEnum)
    type?: MeetingTypeEnum = MeetingTypeEnum.WMS;

    @IsNotEmpty()
    @IsString()
    date: string;

    @IsNotEmpty()
    @IsString()
    time: string;

    @IsOptional()
    @IsString()
    duration?: string = '30 នាទី';

    @IsOptional()
    @IsString()
    agenda?: string;

    @IsOptional()
    @IsArray()
    participants?: Array<{ name: string; avatar?: string; role?: string }>;
}

// ===== Project DTOs =====
export class CreateHomeProjectDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    code?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    start_date?: string;

    @IsOptional()
    @IsString()
    end_date?: string;

    @IsOptional()
    @IsString()
    status?: 'active' | 'completed' | 'on_hold' | 'planning' = 'active';
}

// ===== Support Ticket DTOs =====
export class CreateSupportTicketDto {
    @IsNotEmpty()
    @IsString()
    subject: string;

    @IsNotEmpty()
    @IsString()
    category: string; // 'technical' | 'account' | 'attendance' | 'payroll' | 'general'

    @IsNotEmpty()
    @IsString()
    description: string;

    @IsOptional()
    @IsString()
    priority?: 'low' | 'medium' | 'high' = 'medium';
}
