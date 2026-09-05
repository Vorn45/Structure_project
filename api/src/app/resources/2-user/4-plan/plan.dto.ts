import { Type } from 'class-transformer';
import {
    IsArray,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
} from 'class-validator';

export class QueryPlanDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    limit?: string;

    @IsOptional()
    @IsString()
    offset?: string;
}

export class CreatePlanDto {
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
    status?: 'active' | 'completed' | 'on_hold' | 'planning' = 'active';

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    progress?: number = 0;

    @IsOptional()
    @IsString()
    start_date?: string;

    @IsOptional()
    @IsString()
    end_date?: string;

    @IsOptional()
    @IsArray()
    members?: Array<{ id: number; name: string; role: string; avatar?: string | null }>;

    @IsOptional()
    @IsArray()
    tasks?: any[];

    @IsOptional()
    @IsArray()
    phases?: any[];

    @IsOptional()
    @IsArray()
    meetings?: any[];

    @IsOptional()
    @IsArray()
    agileTasks?: any[];

    @IsOptional()
    @IsArray()
    links?: any[];

    @IsOptional()
    @IsString()
    priority?: string;

    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsNumber()
    budget_allocated?: number;

    @IsOptional()
    @IsNumber()
    budget_spent?: number;
}

export class UpdatePlanDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    code?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    status?: 'active' | 'completed' | 'on_hold' | 'planning';

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    progress?: number;

    @IsOptional()
    @IsString()
    start_date?: string;

    @IsOptional()
    @IsString()
    end_date?: string;

    @IsOptional()
    @IsArray()
    members?: Array<{ id: number; name: string; role: string; avatar?: string | null }>;

    @IsOptional()
    @IsArray()
    tasks?: any[];

    @IsOptional()
    @IsArray()
    phases?: any[];

    @IsOptional()
    @IsArray()
    meetings?: any[];

    @IsOptional()
    @IsArray()
    agileTasks?: any[];

    @IsOptional()
    @IsArray()
    links?: any[];

    @IsOptional()
    @IsString()
    priority?: string;

    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsNumber()
    budget_allocated?: number;

    @IsOptional()
    @IsNumber()
    budget_spent?: number;
}

export class CreateProjectTaskDto {
    @IsNotEmpty()
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    code?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    status?: string = 'new';

    @IsOptional()
    @IsString()
    priority?: string = 'medium';

    @IsOptional()
    @IsString()
    due_date?: string;

    @IsOptional()
    assignee?: any;

    @IsOptional()
    reporter?: any;

    @IsOptional()
    @IsArray()
    subtasks?: any[];

    @IsOptional()
    @IsArray()
    links?: any[];
}

export class CreateProjectPhaseDto {
    @IsNotEmpty()
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    quarter?: string;

    @IsOptional()
    @IsString()
    status?: 'completed' | 'in_progress' | 'planned' = 'planned';

    @IsOptional()
    @IsString()
    startDate?: string;

    @IsOptional()
    @IsString()
    endDate?: string;
}

export class CreateProjectMeetingDto {
    @IsNotEmpty()
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    date?: string;

    @IsOptional()
    @IsString()
    time?: string;

    @IsOptional()
    @IsString()
    platform?: string = 'Google Meet';

    @IsOptional()
    @IsString()
    link?: string;

    @IsOptional()
    @IsString()
    status?: string = 'upcoming';

    @IsOptional()
    @IsArray()
    attendees?: any[];
}

export class CreateProjectMemberDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    role?: string = 'Developer';

    @IsOptional()
    @IsString()
    email?: string;
}
