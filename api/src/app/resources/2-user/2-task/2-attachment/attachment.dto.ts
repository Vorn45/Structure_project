// ===========================================================================>> Core Library
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

// ======================================= >> Code Starts Here << ========================== //
export class UploadTaskAttachmentDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    size: string;

    @IsOptional()
    @IsString()
    type?: string;

    @IsOptional()
    @IsString()
    url?: string;
}
