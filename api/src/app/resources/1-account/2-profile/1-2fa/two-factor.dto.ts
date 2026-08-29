// ===========================================================================>> Third Party Library
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

// ======================================= >> Code Starts Here << ========================== //
export class UpdateTwoFactorDto {
    @IsNotEmpty({ message: 'Field enabled is required' })
    enabled: boolean | string | number;

    @IsOptional()
    @IsString()
    password?: string;
}

export class RequestPhoneChangeOtpDto {
    @IsNotEmpty({ message: 'Field phone_number is required' })
    @IsString()
    phone_number: string;

    @IsNotEmpty({ message: 'Field password is required' })
    @IsString()
    password: string;
}

export class UpdatePhoneNumberDto {
    @IsNotEmpty({ message: 'Field phone_number is required' })
    @IsString()
    phone_number: string;

    @IsNotEmpty({ message: 'Field otp is required' })
    @IsString()
    otp: string;
}

export class RequestEmailChangeOtpDto {
    @IsNotEmpty({ message: 'Field email is required' })
    @IsEmail({}, { message: 'Field email must be a valid email address' })
    email: string;

    @IsNotEmpty({ message: 'Field password is required' })
    @IsString()
    password: string;
}

export class UpdateEmailDto {
    @IsNotEmpty({ message: 'Field email is required' })
    @IsEmail({}, { message: 'Field email must be a valid email address' })
    email: string;

    @IsNotEmpty({ message: 'Field otp is required' })
    @IsString()
    otp: string;
}

export class EnableAuthenticatorDto {
    @IsNotEmpty({ message: 'Field secret is required' })
    @IsString()
    secret: string;

    @IsNotEmpty({ message: 'Field otp is required' })
    @IsString()
    otp: string;
}

export class DisableAuthenticatorDto {
    @IsOptional()
    @IsString()
    password?: string;

    @IsOptional()
    @IsString()
    otp?: string;
}

export class RegenerateBackupCodesDto {
    @IsOptional()
    @IsString()
    password?: string;
}
