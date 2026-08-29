// ===========================================================================>> Third Party Library
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

// ======================================= >> Code Starts Here << ========================== //
export class MiniAppLoginDto {
    /** Raw, still URL-encoded value of `Telegram.WebApp.initData`. Must not be
     *  parsed or re-encoded by the client — the signature covers this string. */
    @IsString()
    @IsNotEmpty({ message: 'Field init_data is required' })
    init_data: string;

    @IsOptional()
    @IsString()
    device_id?: string;
}
