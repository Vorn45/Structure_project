// ===========================================================================>> Core Library
import { Body, Controller, Get, Param, ParseIntPipe, Post, Res, ValidationPipe } from '@nestjs/common';

// ===========================================================================>> Third Party Library
import express from 'express';

// ===========================================================================>> Custom Library
import { CreateTaskCommentDto } from './comment.dto';
import { TaskCommentService } from './comment.service';

// ======================================= >> Code Starts Here << ========================== //
@Controller('task/:id/comments')
export class TaskCommentController {
    constructor(private readonly _service: TaskCommentService) {}

    @Get()
    async getComments(
        @Param('id', ParseIntPipe) id: number,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.getComments(res.locals.user, id);
    }

    @Post()
    async createComment(
        @Param('id', ParseIntPipe) id: number,
        @Body(new ValidationPipe({ transform: true })) dto: CreateTaskCommentDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.createComment(res.locals.user, id, dto);
    }
}
