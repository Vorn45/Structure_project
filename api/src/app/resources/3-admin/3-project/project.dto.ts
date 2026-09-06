import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class QueryAdminProjectDto {
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

export class UpdateProjectBudgetDto {
    @IsNotEmpty()
    @IsNumber()
    budget: number;

    @IsOptional()
    @IsNumber()
    spent?: number;
}

export class UpdateProjectLeadDto {
    @IsNotEmpty()
    @IsNumber()
    lead_id: number;

    @IsNotEmpty()
    @IsString()
    lead_name: string;

    @IsOptional()
    @IsString()
    lead_role?: string;
}
