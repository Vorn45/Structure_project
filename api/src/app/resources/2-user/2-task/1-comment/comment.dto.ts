// ===========================================================================>> Core Library
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

// ======================================= >> Code Starts Here << ========================== //
export class CreateTaskCommentDto {
    @IsOptional()
    @IsString()
    text?: string;

    @IsOptional()
    @IsArray()
    attachments?: Array<{
        name: string;
        size: string;
        type?: string;
        url?: string;
        isImage?: boolean;
        textContent?: string;
    }>;
}
