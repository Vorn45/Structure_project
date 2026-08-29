// ===========================================================================>> Third Party Library
import { Transform, Type }                            from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

// ======================================= >> Code Starts Here << ========================== //
export class TelegramLoginDto {
    @Transform(({ value }) => value?.toString())
    @IsString()
    @IsNotEmpty({ message: 'Field telegram_id is required' })
    telegram_id: string;

    @IsOptional()
    @IsString()
    telegram_username?: string;

    @IsOptional()
    @IsString()
    telegram_photo_url?: string;

    @IsOptional()
    @IsString()
    first_name?: string;

    @IsOptional()
    @IsString()
    last_name?: string;

    @IsOptional()
    @IsString()
    device_id?: string;

    @Type(() => Number)
    @IsNumber()
    @IsNotEmpty({ message: 'Field auth_date is required' })
    auth_date: number;

    @IsString()
    @IsNotEmpty({ message: 'Field hash is required' })
    hash: string;
}
