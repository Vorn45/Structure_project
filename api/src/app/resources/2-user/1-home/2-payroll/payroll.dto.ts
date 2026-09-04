import { IsOptional, IsString } from 'class-validator';

export class QueryPayrollDto {
    @IsOptional()
    @IsString()
    month?: string;

    @IsOptional()
    @IsString()
    year?: string;
}
