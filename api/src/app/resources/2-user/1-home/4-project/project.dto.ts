import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

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
    status?: string;

    @IsOptional()
    @IsString()
    priority?: string;

    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsNumber()
    budget?: number;

    @IsOptional()
    @IsNumber()
    budget_allocated?: number;

    @IsOptional()
    @IsString()
    start_date?: string;

    @IsOptional()
    @IsString()
    end_date?: string;

    @IsOptional()
    lead?: any;

    @IsOptional()
    team_lead?: any;

    @IsOptional()
    @IsString()
    reporter?: string;

    @IsOptional()
    @IsArray()
    assignees?: any[];

    @IsOptional()
    @IsArray()
    members?: Array<{ id: number | string; name: string; role: string; avatar?: string | null }>;

    @IsOptional()
    @IsArray()
    attachments?: any[];

    @IsOptional()
    @IsNumber()
    attachments_count?: number;

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
}
