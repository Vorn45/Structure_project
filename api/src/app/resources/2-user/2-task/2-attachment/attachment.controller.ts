// ===========================================================================>> Core Library
import { Body, Controller, Get, Param, ParseIntPipe, Post, Res, ValidationPipe } from '@nestjs/common';

// ===========================================================================>> Third Party Library
import express from 'express';

// ===========================================================================>> Custom Library
import { UploadTaskAttachmentDto } from './attachment.dto';
import { TaskAttachmentService } from './attachment.service';

// ======================================= >> Code Starts Here << ========================== //
@Controller('task/:id/attachments')
export class TaskAttachmentController {
    constructor(private readonly _service: TaskAttachmentService) {}

    @Get()
    async getAttachments(
        @Param('id', ParseIntPipe) id: number,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.getTaskAttachments(res.locals.user, id);
    }

    @Post()
    async addAttachment(
        @Param('id', ParseIntPipe) id: number,
        @Body(new ValidationPipe({ transform: true })) dto: UploadTaskAttachmentDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.addAttachment(res.locals.user, id, dto);
    }
}
