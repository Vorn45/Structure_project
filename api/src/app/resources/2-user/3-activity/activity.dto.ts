import { IsOptional, IsString } from 'class-validator';

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
