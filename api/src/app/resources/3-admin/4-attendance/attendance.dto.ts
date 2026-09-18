import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class ActionLeaveDto {
    @IsNotEmpty()
    @IsString()
    status: 'approved' | 'rejected';

    @IsOptional()
    @IsString()
    comment?: string;
}

export class CreateLeaveDto {
    @IsOptional()
    @IsNumber()
    user_id?: number;

    @IsNotEmpty()
    @IsString()
    user_name: string;

    @IsOptional()
    @IsString()
    department?: string;

    @IsNotEmpty()
    @IsString()
    leave_type: 'annual' | 'sick' | 'special' | 'maternity';

    @IsNotEmpty()
    @IsString()
    start_date: string;

    @IsNotEmpty()
    @IsString()
    end_date: string;

    @IsOptional()
    @IsNumber()
    duration_days?: number;

    @IsNotEmpty()
    @IsString()
    reason: string;

    @IsOptional()
    @IsString()
    status?: 'pending' | 'approved' | 'rejected';

    @IsOptional()
    @IsString()
    reviewer_comment?: string;
}

export class ManualAttendanceLogDto {
    @IsNotEmpty()
    @IsString()
    user_name: string;

    @IsOptional()
    @IsString()
    user_en?: string;

    @IsOptional()
    @IsNumber()
    user_id?: number;

    @IsOptional()
    @IsString()
    department?: string;

    @IsOptional()
    @IsString()
    check_in?: string;

    @IsOptional()
    @IsString()
    check_out?: string;

    @IsOptional()
    @IsString()
    status?: 'on_time' | 'late';

    @IsOptional()
    @IsString()
    date?: string;

    @IsOptional()
    @IsString()
    location?: string;
}

