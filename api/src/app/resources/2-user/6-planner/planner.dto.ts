import {
    IsArray,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
} from 'class-validator';

export class QueryPlannerDto {
    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsString()
    month?: string;

    @IsOptional()
    @IsString()
    search?: string;
}

export class CreateScheduleDto {
    @IsNotEmpty()
    @IsString()
    title: string;

    @IsNotEmpty()
    @IsString()
    category: 'work' | 'myself' | 'breaks' | string;

    @IsOptional()
    @IsString()
    type?: string;

    @IsOptional()
    @IsNumber()
    day_index?: number;

    @IsOptional()
    @IsNumber()
    start_day_index?: number;

    @IsOptional()
    @IsNumber()
    end_day_index?: number;

    @IsOptional()
    @IsString()
    start_time?: string;

    @IsOptional()
    @IsString()
    end_time?: string;

    @IsOptional()
    @IsString()
    time?: string;

    @IsOptional()
    @IsString()
    date?: string;

    @IsOptional()
    @IsString()
    plan_id?: string;

    @IsOptional()
    @IsString()
    plan_name?: string;

    @IsOptional()
    @IsNumber()
    top_position?: number;

    @IsOptional()
    @IsNumber()
    height?: number;

    @IsOptional()
    @IsString()
    color_theme?: string;

    @IsOptional()
    @IsArray()
    members?: Array<{
        id?: string | number;
        name: string;
        role?: string;
        initials?: string;
        avatar?: string | null;
        bg?: string;
    }>;

    @IsOptional()
    @IsString()
    note?: string;
}

export class UpdateScheduleDto extends CreateScheduleDto {}
