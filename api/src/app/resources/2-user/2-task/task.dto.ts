import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export enum TaskStatusEnum {
    NEW = 'new',
    CONFIRMED = 'confirmed',
    UNCONFIRMED = 'unconfirmed',
    IN_PROGRESS = 'in_progress',
    IN_REVIEW = 'in_review',
    REOPENED = 'reopened',
    DONE = 'done',
    // Compatibility aliases
    TODO = 'unconfirmed',
}

export enum TaskPriorityEnum {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    URGENT = 'urgent',
}

export class QueryTasksDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    priority?: string;

    @IsOptional()
    @IsString()
    project_id?: string;

    @IsOptional()
    @IsString()
    limit?: string;

    @IsOptional()
    @IsString()
    offset?: string;
}

export class CreateTaskDto {
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    project_id?: string;

    @IsOptional()
    @IsEnum(TaskPriorityEnum)
    priority?: TaskPriorityEnum;

    @IsOptional()
    @IsEnum(TaskStatusEnum)
    status?: TaskStatusEnum;

    @IsOptional()
    @IsString()
    due_date?: string;
}

export class UpdateTaskDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsEnum(TaskPriorityEnum)
    priority?: TaskPriorityEnum;

    @IsOptional()
    @IsEnum(TaskStatusEnum)
    status?: TaskStatusEnum;

    @IsOptional()
    @IsNumber()
    progress?: number;

    @IsOptional()
    @IsString()
    due_date?: string;
}
