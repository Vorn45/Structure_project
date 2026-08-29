// ===========================================================================>> Third Party Library
import { Transform }                                             from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, MinLength, } from 'class-validator';

// ======================================= >> Code Starts Here << ========================== //
export class SwitchRoleDto {
    @Transform(({ value }) => Number(value))
    @IsNumber()
    @IsNotEmpty({ message: 'Field role_id is required' })
    role_id: number;
}

export class UpdateOwnProfileInfoDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    name_en?: string;

    @IsOptional()
    @IsString()
    name_kh?: string;

    @IsOptional()
    gender?: number | string;

    @IsOptional()
    sex_id?: number | string;

    @IsOptional()
    @IsString()
    phone_number?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    email?: string;

    @IsOptional()
    @IsString()
    first_name?: string;

    @IsOptional()
    @IsString()
    last_name?: string;

    @IsOptional()
    @IsString()
    telegram_username?: string;
}

export class ChangeOwnPasswordDto {
    @IsNotEmpty()
    @IsString()
    current_password: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    new_password: string;
}

export class CheckPasswordDto {
    @IsNotEmpty()
    @IsString()
    password: string;
}

export class QrLoginDto {
    @IsNotEmpty({ message: 'Field qr_token is required' })
    @IsString()
    qr_token: string;
}
