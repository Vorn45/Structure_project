// ===========================================================================>> Core Library
import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    Res,
    UploadedFile,
    UseInterceptors,
    ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

// ===========================================================================>> Third Party Library
import express from 'express';

// ===========================================================================>> Custom Library
import { FileService } from 'src/app/shared/file/file.service';
import { CreateTaskDto, QueryTasksDto, UpdateTaskDto } from './task.dto';
import { TaskService } from './task.service';

// ======================================= >> Code Starts Here << ========================== //
@Controller('task')
export class TaskController {
    constructor(
        private readonly _service: TaskService,
        private readonly _fileService: FileService,
    ) {}

    @Post('attachment/upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadAttachment(
        @UploadedFile() file: any,
    ) {
        if (!file) {
            throw new BadRequestException('No file provided');
        }
        const uploaded = await this._fileService.uploadMultipartFile('tasks', file);
        return {
            status_code: 200,
            message: 'Attachment uploaded successfully',
            data: {
                name: file.originalname,
                size: file.size,
                mimetype: file.mimetype,
                uri: uploaded.uri,
                url: uploaded.uri
                    ? uploaded.uri.startsWith('http')
                        ? uploaded.uri
                        : `/${uploaded.uri}`
                    : '',
            },
        };
    }

    @Get('')
    async getTasks(
        @Query(new ValidationPipe({ transform: true })) query: QueryTasksDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.getTasks(res.locals.user, query);
    }

    @Get('projects')
    async getProjects(@Res({ passthrough: true }) res: express.Response) {
        return await this._service.getProjects(res.locals.user);
    }

    @Get('members')
    async getMembers(@Res({ passthrough: true }) res: express.Response) {
        return await this._service.getMembers(res.locals.user);
    }

    @Get(':id')
    async getTaskById(
        @Param('id', ParseIntPipe) id: number,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.getTaskById(res.locals.user, id);
    }

    @Post('')
    async createTask(
        @Body(new ValidationPipe({ transform: true })) dto: CreateTaskDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.createTask(res.locals.user, dto);
    }

    @Patch(':id')
    async updateTask(
        @Param('id', ParseIntPipe) id: number,
        @Body(new ValidationPipe({ transform: true })) dto: UpdateTaskDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.updateTask(res.locals.user, id, dto);
    }

    @Delete(':id')
    async deleteTask(
        @Param('id', ParseIntPipe) id: number,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.deleteTask(res.locals.user, id);
    }

    // =========================================================================
    // TASK CHAT ROOM & COMMENTS (បន្ទប់ពិភាក្សាការងារ)
    // =========================================================================
    @Get(':id/comments')
    async getTaskComments(
        @Param('id', ParseIntPipe) id: number,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.getTaskComments(res.locals.user, id);
    }

    @Post(':id/comments')
    async createTaskComment(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: { text: string; attachments?: any[] },
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.createTaskComment(res.locals.user, id, body.text, body.attachments);
    }
}
