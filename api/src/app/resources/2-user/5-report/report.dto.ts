// ===========================================================================>> Third Party Library
import { IsEnum, IsOptional, IsString } from 'class-validator';

// ===========================================================================>> Enums & DTOs
export enum ReportPeriodEnum {
    WEEK = 'week',
    MONTH = 'month',
    QUARTER = 'quarter',
}

export class QueryReportDto {
    @IsOptional()
    @IsString()
    project_id?: string;

    @IsOptional()
    @IsEnum(ReportPeriodEnum)
    period?: ReportPeriodEnum = ReportPeriodEnum.WEEK;

    @IsOptional()
    @IsString()
    date_from?: string;

    @IsOptional()
    @IsString()
    date_to?: string;
}
