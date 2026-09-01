import { IsOptional, IsString } from 'class-validator';

export class HomeOverviewQueryDto {
    @IsOptional()
    @IsString()
    organization_id?: string;

    @IsOptional()
    @IsString()
    filter_period?: string; // 'today' | 'week' | 'month' | 'all'
}
