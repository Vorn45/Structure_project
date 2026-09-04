import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';

export class QueryActivityDto {
    @IsOptional()
    @IsString()
    type?: string;

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

export class CreateRoadmapSegmentDto {
    @IsInt()
    @Min(1)
    @Max(52)
    iteration: 1 | 2 | 3;

    @IsInt()
    @Min(1)
    @Max(52)
    startWeek: number;

    @IsInt()
    @Min(1)
    @Max(52)
    durationWeeks: number;

    @IsOptional()
    @IsString()
    label?: string;
}

export class CreateRoadmapTaskDto {
    @IsOptional()
    @IsString()
    id?: string;

    @IsNotEmpty()
    @IsString()
    project_id: string;

    @IsNotEmpty()
    @IsString()
    name: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateRoadmapSegmentDto)
    segments: CreateRoadmapSegmentDto[];
}

export class CreateRoadmapProjectDto {
    @IsOptional()
    @IsString()
    id?: string;

    @IsNotEmpty()
    @IsString()
    code: string;

    @IsNotEmpty()
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;
}

export class CreateActivityDto {
    @IsNotEmpty()
    @IsString()
    action: string;

    @IsNotEmpty()
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    type?: 'task' | 'project' | 'comment' | 'auth' | 'security';

    @IsOptional()
    @IsString()
    icon?: string;
}
