// ===========================================================================>> Third Party Library
import { IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

// ======================================= >> Code Starts Here << ========================== //
export class PasskeyRegistrationVerifyDto {
    @IsString()
    @IsNotEmpty({ message: 'Field challenge_token is required' })
    challenge_token: string;

    // The RegistrationResponseJSON returned by @simplewebauthn/browser's
    // startRegistration() — passed through untouched to verifyRegistrationResponse().
    @IsObject()
    @IsNotEmpty({ message: 'Field credential is required' })
    credential: Record<string, unknown>;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    device_name?: string;
}

export class RenamePasskeyDto {
    @IsString()
    @IsNotEmpty({ message: 'Field device_name is required' })
    @MaxLength(255)
    device_name: string;
}
