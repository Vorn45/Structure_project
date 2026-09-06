// ===========================================================================>> Core Library
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res } from '@nestjs/common';
import express from 'express';

// ===========================================================================>> Custom Library
import { AdminProjectService } from './project.service';
import { QueryAdminProjectDto, UpdateProjectBudgetDto, UpdateProjectLeadDto } from './project.dto';

@Controller('projects')
export class AdminProjectController {
    constructor(private readonly _service: AdminProjectService) {}

    @Get('')
    async getProjects(@Query() query: QueryAdminProjectDto, @Res({ passthrough: true }) res: express.Response) {
        return this._service.getProjects(res.locals.user, query);
    }

    @Get(':id')
    async getProjectById(@Param('id') id: string, @Res({ passthrough: true }) res: express.Response) {
        return this._service.getProjectById(res.locals.user, id);
    }

    @Post('')
    async createProject(@Body() dto: any, @Res({ passthrough: true }) res: express.Response) {
        return this._service.createProject(res.locals.user, dto);
    }

    @Patch(':id')
    async updateProject(@Param('id') id: string, @Body() dto: any, @Res({ passthrough: true }) res: express.Response) {
        return this._service.updateProject(res.locals.user, id, dto);
    }

    @Delete(':id')
    async deleteProject(@Param('id') id: string, @Res({ passthrough: true }) res: express.Response) {
        return this._service.deleteProject(res.locals.user, id);
    }

    @Patch(':id/budget')
    async updateBudget(
        @Param('id') id: string,
        @Body() dto: UpdateProjectBudgetDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return this._service.updateBudget(res.locals.user, id, dto);
    }

    @Patch(':id/lead')
    async updateLead(
        @Param('id') id: string,
        @Body() dto: UpdateProjectLeadDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return this._service.updateLead(res.locals.user, id, dto);
    }
}
