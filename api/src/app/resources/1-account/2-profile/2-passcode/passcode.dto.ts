// ===========================================================================>> Third Party Library
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

// ======================================= >> Code Starts Here << ========================== //
export class SetPasscodeDto {
    @IsNotEmpty({ message: 'Field passcode is required' })
    @IsString()
    passcode: string;

    @IsOptional()
    @IsIn([1, 5, 60, 300], { message: 'Field idle_timeout_minutes must be one of 1, 5, 60, 300' })
    idle_timeout_minutes?: number;

    // Present when resetting an existing passcode via the forgot-passcode
    // email-OTP flow (proves identity out of band); absent for a normal
    // in-session set/change, where the JWT already proves identity.
    @IsOptional()
    @IsString()
    reset_token?: string;
}

export class VerifyPasscodeDto {
    @IsNotEmpty({ message: 'Field passcode is required' })
    @IsString()
    passcode: string;
}

export class DisablePasscodeDto {
    @IsNotEmpty({ message: 'Field passcode is required' })
    @IsString()
    passcode: string;
}

export class UpdateIdleTimeoutDto {
    @IsIn([1, 5, 60, 300], { message: 'Field idle_timeout_minutes must be one of 1, 5, 60, 300' })
    idle_timeout_minutes: number;
}

export class RequestPasscodeResetOtpDto {
    @IsOptional()
    @IsString()
    email?: string;
}

export class VerifyPasscodeResetOtpDto {
    @IsNotEmpty({ message: 'Field otp is required' })
    @IsString()
    otp: string;

    @IsNotEmpty({ message: 'Field otp_token is required' })
    @IsString()
    otp_token: string;
}
