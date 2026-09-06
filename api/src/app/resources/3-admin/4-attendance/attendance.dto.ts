import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ActionLeaveDto {
    @IsNotEmpty()
    @IsString()
    status: 'approved' | 'rejected';

    @IsOptional()
    @IsString()
    comment?: string;
}
