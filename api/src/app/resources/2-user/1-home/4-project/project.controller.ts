// ===========================================================================>> Core Library
import { Body, Controller, Get, Post, Res, ValidationPipe } from '@nestjs/common';

// ===========================================================================>> Third Party Library
import express from 'express';

// ===========================================================================>> Custom Library
import { CreateHomeProjectDto } from './project.dto';
import { ProjectService } from './project.service';

@Controller('home/projects')
export class ProjectController {
    constructor(private readonly _service: ProjectService) {}

    @Get('active')
    async getActiveProjects(@Res({ passthrough: true }) res: express.Response) {
        return await this._service.getActiveProjects(res.locals.user);
    }

    @Post()
    async createProject(
        @Body(new ValidationPipe({ transform: true })) dto: CreateHomeProjectDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.createProject(res.locals.user, dto);
    }
}
