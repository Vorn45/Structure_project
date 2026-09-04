import { IsOptional, IsString } from 'class-validator';

export class CheckInOutDto {
    @IsOptional()
    @IsString()
    note?: string;

    @IsOptional()
    @IsString()
    location?: string;
}
