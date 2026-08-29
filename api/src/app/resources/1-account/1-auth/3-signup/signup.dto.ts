// ===========================================================================>> Third Party Library
import { Type }                                                                             from 'class-transformer';
import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, Length, MaxLength, MinLength }    from 'class-validator';

// ======================================= >> Code Starts Here << ========================== //
export class SignUpStartDto {
    @IsEmail({}, { message: 'Field email must be a valid email address' })
    @IsNotEmpty({ message: 'Field email is required' })
    email: string;
}

export class SignUpResendDto {
    @IsString()
    @IsNotEmpty({ message: 'Field signup_token is required' })
    signup_token: string;
}

export class SignUpVerifyDto {
    @IsString()
    @IsNotEmpty({ message: 'Field signup_token is required' })
    signup_token: string;

    @IsString()
    @Length(6, 6, { message: 'Field otp must be 6 digits' })
    @IsNotEmpty({ message: 'Field otp is required' })
    otp: string;
}

export class SignUpCheckPhoneDto {
    @IsString()
    @MaxLength(225)
    @IsNotEmpty({ message: 'Field phone is required' })
    phone: string;

    // Optional: lets the check ignore the row the signup is already filling in.
    @IsOptional()
    @IsString()
    registration_token?: string;
}

export class SignUpCompleteDto {
    @IsString()
    @IsNotEmpty({ message: 'Field registration_token is required' })
    registration_token: string;

    @IsString()
    @MaxLength(50, { message: 'Field name_kh must not exceed 50 characters' })
    @IsNotEmpty({ message: 'Field name_kh is required' })
    name_kh: string;

    @IsString()
    @MaxLength(50, { message: 'Field name_en must not exceed 50 characters' })
    @IsNotEmpty({ message: 'Field name_en is required' })
    name_en: string;

    @Type(() => Number)
    @IsIn([1, 2], { message: 'Field sex_id must be 1 (male) or 2 (female)' })
    sex_id: number;

    @IsOptional()
    @IsString()
    @MaxLength(225)
    phone?: string;

    @IsOptional()
    @IsString()
    @MinLength(6, { message: 'password must be at least 6 characters' })
    password?: string;

    @IsOptional()
    @IsString()
    confirm_password?: string;

    @IsOptional()
    @IsString()
    device_id?: string;
}
