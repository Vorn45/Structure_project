import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

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
    @IsString()
    room_code?: string;

    @IsOptional()
    @IsString()
    room_url?: string;

    @IsOptional()
    @IsString()
    roomCode?: string;

    @IsOptional()
    @IsString()
    roomUrl?: string;

    @IsOptional()
    @IsArray()
    participants?: Array<{ name: string; avatar?: string | null; role?: string }>;

    @IsOptional()
    @IsString()
    agenda?: string;

    @IsOptional()
    @IsNumber()
    project_id?: number;

    @IsOptional()
    @IsString()
    project_name?: string;

    @IsOptional()
    @IsBoolean()
    notify_telegram?: boolean;
}
