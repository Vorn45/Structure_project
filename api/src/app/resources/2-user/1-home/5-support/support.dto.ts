import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSupportTicketDto {
    @IsNotEmpty()
    @IsString()
    subject: string;

    @IsOptional()
    @IsString()
    category?: string;

    @IsNotEmpty()
    @IsString()
    description: string;
}
