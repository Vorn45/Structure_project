// ===========================================================================>> Third Party Library
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

// ===========================================================================>> Custom Library
// > Local
import { OtpChannel } from 'src/app/enum/otp-channel.enum';

// ======================================= >> Code Starts Here << ========================== //
export class LoginRequestDto {
    @IsString()
    @IsNotEmpty({ message: 'Field username is required' })
    username: string;

    @IsNotEmpty({ message: 'Field password is required ' })
    password: string;

    @IsOptional()
    @IsString()
    device_id?: string;
}
export class VerifyOtptDto {
    @IsOptional()
    @IsString()
    username?: string;

    @IsOptional()
    @IsString()
    otp_token?: string;

    @IsNotEmpty({ message: 'Field otp is required' })
    otp: string;

    @IsOptional()
    @IsString()
    channel?: OtpChannel;

    @IsOptional()
    @IsString()
    device_id?: string;
}

export class SendOtpDto {
    @IsString()
    @IsNotEmpty({ message: 'Field otp_token is required' })
    otp_token: string;

    @IsString()
    @IsIn([OtpChannel.PHONE, OtpChannel.TELEGRAM, OtpChannel.EMAIL, OtpChannel.AUTHENTICATOR])
    channel: OtpChannel;
}
export class resendOtpDto {
    @IsString()
    @IsNotEmpty({ message: 'Field username is required' })
    username: string;

    @IsOptional()
    @IsString()
    channel?: OtpChannel;
}

export class RefreshTokenDto {
    @IsOptional()
    @IsString()
    refresh_token?: string;

    @IsOptional()
    @IsString()
    device_id?: string;
}
