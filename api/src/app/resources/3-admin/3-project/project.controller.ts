import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import express from 'express';

// ===========================================================================>> Custom Library
import { AdminProjectService } from './project.service';
import { QueryAdminProjectDto, UpdateProjectBudgetDto, UpdateProjectLeadDto } from './project.dto';
import { RoleGuard } from 'src/app/common/guards/role.guard';
import { Roles } from 'src/app/common/decorators/roles.decorator';

@Controller('projects')
@UseGuards(RoleGuard)
@Roles('superadmin', 'org_admin')
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

    // =========================================================================
    // SUB-RESOURCE OPERATIONS (TASKS, PHASES, MEETINGS, MEMBERS, AGILE)
    // =========================================================================
    @Get(':id/tasks')
    async getTasks(@Param('id') id: string, @Res({ passthrough: true }) res: express.Response) {
        return this._service.getTasks(res.locals.user, id);
    }

    @Post(':id/tasks')
    async createTask(@Param('id') id: string, @Body() dto: any, @Res({ passthrough: true }) res: express.Response) {
        return this._service.createTask(res.locals.user, id, dto);
    }

    @Patch(':id/tasks/:taskId')
    async updateTask(
        @Param('id') id: string,
        @Param('taskId') taskId: string,
        @Body() dto: any,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return this._service.updateTask(res.locals.user, id, taskId, dto);
    }

    @Delete(':id/tasks/:taskId')
    async deleteTask(
        @Param('id') id: string,
        @Param('taskId') taskId: string,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return this._service.deleteTask(res.locals.user, id, taskId);
    }

    @Post(':id/phases')
    async createPhase(@Param('id') id: string, @Body() dto: any, @Res({ passthrough: true }) res: express.Response) {
        return this._service.createPhase(res.locals.user, id, dto);
    }

    @Delete(':id/phases/:phaseId')
    async deletePhase(
        @Param('id') id: string,
        @Param('phaseId') phaseId: string,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return this._service.deletePhase(res.locals.user, id, phaseId);
    }

    @Post(':id/meetings')
    async createMeeting(@Param('id') id: string, @Body() dto: any, @Res({ passthrough: true }) res: express.Response) {
        return this._service.createMeeting(res.locals.user, id, dto);
    }

    @Delete(':id/meetings/:meetingId')
    async deleteMeeting(
        @Param('id') id: string,
        @Param('meetingId') meetingId: string,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return this._service.deleteMeeting(res.locals.user, id, meetingId);
    }

    @Post(':id/members')
    async createMember(@Param('id') id: string, @Body() dto: any, @Res({ passthrough: true }) res: express.Response) {
        return this._service.createMember(res.locals.user, id, dto);
    }

    @Delete(':id/members/:memberId')
    async deleteMember(
        @Param('id') id: string,
        @Param('memberId') memberId: number,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return this._service.deleteMember(res.locals.user, id, Number(memberId));
    }

    @Get(':id/agile-tasks')
    async getAgileTasks(@Param('id') id: string, @Res({ passthrough: true }) res: express.Response) {
        return this._service.getAgileTasks(res.locals.user, id);
    }

    @Post(':id/agile-tasks')
    async createAgileTask(@Param('id') id: string, @Body() dto: any, @Res({ passthrough: true }) res: express.Response) {
        return this._service.createAgileTask(res.locals.user, id, dto);
    }

    @Patch(':id/agile-tasks/:taskId')
    async updateAgileTask(
        @Param('id') id: string,
        @Param('taskId') taskId: string,
        @Body() dto: any,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return this._service.updateAgileTask(res.locals.user, id, taskId, dto);
    }

    @Delete(':id/agile-tasks/:taskId')
    async deleteAgileTask(
        @Param('id') id: string,
        @Param('taskId') taskId: string,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return this._service.deleteAgileTask(res.locals.user, id, taskId);
    }
}
