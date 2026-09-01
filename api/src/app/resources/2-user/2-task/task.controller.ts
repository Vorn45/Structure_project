// ===========================================================================>> Core Library
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Res, ValidationPipe } from '@nestjs/common';

// ===========================================================================>> Third Party Library
import express from 'express';

// ===========================================================================>> Custom Library
import { CreateTaskDto, QueryTasksDto, UpdateTaskDto } from './task.dto';
import { TaskService } from './task.service';

// ======================================= >> Code Starts Here << ========================== //
@Controller('task')
export class TaskController {
    constructor(private readonly _service: TaskService) {}

    @Get('')
    async getTasks(
        @Query(new ValidationPipe({ transform: true })) query: QueryTasksDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.getTasks(res.locals.user, query);
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
}
