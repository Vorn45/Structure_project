// ===========================================================================>> Third Party Library
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

// ======================================= >> Code Starts Here << ========================== //

export type SsoAuthMode = 'login' | 'signup';

export class SsoLoginDto {
    // Access token issued by CDC SSO (Keycloak) for the pms-client, obtained by
    // the frontend via the standard OIDC authorization-code + PKCE flow.
    @IsString()
    @IsNotEmpty({ message: 'Field access_token is required' })
    access_token: string;

    @IsOptional()
    @IsIn(['login', 'signup'], { message: 'Field mode must be login or signup' })
    mode?: SsoAuthMode;

    @IsOptional()
    @IsString()
    device_id?: string;
}
