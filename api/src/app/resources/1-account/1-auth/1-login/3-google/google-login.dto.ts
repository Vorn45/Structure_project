// ===========================================================================>> Third Party Library
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

// ======================================= >> Code Starts Here << ========================== //

export type GoogleAuthMode = 'login' | 'signup';

export class GoogleLoginDto {
    // Access token from the Google OAuth2 token popup flow (initTokenClient).
    @IsString()
    @IsNotEmpty({ message: 'Field access_token is required' })
    access_token: string;

    @IsOptional()
    @IsIn(['login', 'signup'], { message: 'Field mode must be login or signup' })
    mode?: GoogleAuthMode;

    @IsOptional()
    @IsString()
    device_id?: string;
}
