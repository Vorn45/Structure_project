// ===========================================================================>> Third Party Library
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

// ======================================= >> Code Starts Here << ========================== //
export class ForgetPasswordDto {
    @IsString()
    @IsNotEmpty({ message: 'Field username is required' })
    username: string;
}

export class VerifyResetOtpDto {
    @IsString()
    @IsNotEmpty({ message: 'Field username is required' })
    username: string;

    @IsString()
    @IsNotEmpty({ message: 'Field otp is required' })
    otp: string;

    @IsString()
    @IsNotEmpty({ message: 'Field otp_token is required' })
    otp_token: string;
}

export class ResetPasswordDto {
    @IsString()
    @IsNotEmpty({ message: 'Field username is required' })
    username: string;

    @IsOptional()
    @IsString()
    otp?: string;

    @IsOptional()
    @IsString()
    otp_token?: string;

    @IsString()
    @MinLength(6, { message: 'new_password must be at least 6 characters' })
    @IsNotEmpty({ message: 'Field new_password is required' })
    new_password: string;

    @IsString()
    @IsNotEmpty({ message: 'Field confirm_password is required' })
    confirm_password: string;
}
