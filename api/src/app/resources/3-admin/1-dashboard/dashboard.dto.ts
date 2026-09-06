import { IsOptional, IsString } from 'class-validator';

export class QueryDashboardDto {
    @IsOptional()
    @IsString()
    range?: string;
}
