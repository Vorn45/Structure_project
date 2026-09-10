import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CheckInOutDto {
    @IsOptional()
    @IsString()
    note?: string;

    @IsOptional()
    @IsString()
    location?: string;

    @IsOptional()
    @IsString()
    attendee_name?: string;

    @IsOptional()
    @IsString()
    token?: string;

    @IsOptional()
    @IsNumber()
    latitude?: number;

    @IsOptional()
    @IsNumber()
    longitude?: number;

    @IsOptional()
    @IsNumber()
    accuracy?: number;

    @IsOptional()
    @IsString()
    device?: string;
}
