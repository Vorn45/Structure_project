// ===========================================================================>> Third Party Library
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

// ======================================= >> Code Starts Here << ========================== //
export class PasskeyLoginVerifyDto {
    @IsString()
    @IsNotEmpty({ message: 'Field challenge_token is required' })
    challenge_token: string;

    // The AuthenticationResponseJSON returned by @simplewebauthn/browser's
    // startAuthentication() — passed through untouched to
    // verifyAuthenticationResponse().
    @IsObject()
    @IsNotEmpty({ message: 'Field credential is required' })
    credential: Record<string, unknown>;

    @IsOptional()
    @IsString()
    device_id?: string;
}
