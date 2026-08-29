// ===========================================================================>> Third Party Library
import { Type }                                                    from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString, ValidateNested }   from 'class-validator';

// ======================================= >> Code Starts Here << ========================== //
class TelegramChatDto {
    @IsNumber() id: number;
}

class TelegramFromDto {
    @IsNumber() id: number;
    @IsOptional() @IsString() username?: string;
}

class TelegramContactDto {
    @IsString() phone_number: string;
    @IsOptional() @IsString() first_name?: string;
    @IsOptional() @IsNumber() user_id?: number;
}

class TelegramPhotoSizeDto {
    @IsString() file_id: string;
    @IsOptional() @IsNumber() file_size?: number;
    @IsNumber() width: number;
    @IsNumber() height: number;
}

class TelegramDocumentDto {
    @IsString() file_id: string;
    @IsOptional() @IsString() file_name?: string;
    @IsOptional() @IsString() mime_type?: string;
    @IsOptional() @IsNumber() file_size?: number;
}

class TelegramMessageDto {
    @IsOptional() @IsInt() message_id?: number;

    @Type(() => TelegramChatDto)
    @ValidateNested()
    chat: TelegramChatDto;

    @IsOptional()
    @Type(() => TelegramFromDto)
    @ValidateNested()
    from?: TelegramFromDto;

    @IsOptional() @IsString() text?: string;

    @IsOptional()
    @Type(() => TelegramContactDto)
    @ValidateNested()
    contact?: TelegramContactDto;

    @IsOptional()
    @Type(() => TelegramPhotoSizeDto)
    @ValidateNested({ each: true })
    photo?: TelegramPhotoSizeDto[];

    @IsOptional()
    @Type(() => TelegramDocumentDto)
    @ValidateNested()
    document?: TelegramDocumentDto;
}

class TelegramCallbackQueryDto {
    @IsString() id: string;

    @Type(() => TelegramFromDto)
    @ValidateNested()
    from: TelegramFromDto;

    @IsOptional()
    @Type(() => TelegramMessageDto)
    @ValidateNested()
    message?: TelegramMessageDto;

    @IsOptional() @IsString() data?: string;
}

/** Shape of a Telegram Bot API `Update` object — only the fields this webhook reads. */
export class TelegramUpdateDto {
    @IsInt() update_id: number;

    @IsOptional()
    @Type(() => TelegramMessageDto)
    @ValidateNested()
    message?: TelegramMessageDto;

    @IsOptional()
    @Type(() => TelegramCallbackQueryDto)
    @ValidateNested()
    callback_query?: TelegramCallbackQueryDto;
}
