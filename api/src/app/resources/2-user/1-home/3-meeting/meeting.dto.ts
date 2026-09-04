import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMeetingDto {
    @IsNotEmpty()
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    type?: string;

    @IsNotEmpty()
    @IsString()
    date: string;

    @IsNotEmpty()
    @IsString()
    time: string;

    @IsOptional()
    @IsString()
    duration?: string;

    @IsOptional()
    @IsArray()
    participants?: Array<{ name: string; avatar?: string | null; role?: string }>;

    @IsOptional()
    @IsString()
    agenda?: string;
}
