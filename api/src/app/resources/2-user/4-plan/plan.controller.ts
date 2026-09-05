// ===========================================================================>> Core Library
import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Res,
    ValidationPipe,
} from '@nestjs/common';

// ===========================================================================>> Third Party Library
import express from 'express';

// ===========================================================================>> Custom Library
import {
    CreatePlanDto,
    CreateProjectMeetingDto,
    CreateProjectMemberDto,
    CreateProjectPhaseDto,
    CreateProjectTaskDto,
    QueryPlanDto,
    UpdatePlanDto,
} from './plan.dto';
import { PlanService } from './plan.service';

// ======================================= >> Code Starts Here << ========================== //
@Controller('plan')
export class PlanController {
    constructor(private readonly _service: PlanService) {}

    // =========================================================================
    // 1. PLAN / PROJECT MAIN CRUD
    // =========================================================================
    @Get('')
    async getPlans(
        @Query(new ValidationPipe({ transform: true })) query: QueryPlanDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.getPlans(res.locals.user, query);
    }

    @Get(':id')
    async getPlanById(
        @Param('id') id: string,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.getPlanById(res.locals.user, id);
    }

    @Post('')
    async createPlan(
        @Body(new ValidationPipe({ transform: true })) dto: CreatePlanDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.createPlan(res.locals.user, dto);
    }

    @Patch(':id')
    async updatePlan(
        @Param('id') id: string,
        @Body(new ValidationPipe({ transform: true })) dto: UpdatePlanDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.updatePlan(res.locals.user, id, dto);
    }

    @Delete(':id')
    async deletePlan(
        @Param('id') id: string,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.deletePlan(res.locals.user, id);
    }

    // =========================================================================
    // 2. TASKS SUB-RESOURCE
    // =========================================================================
    @Get(':id/tasks')
    async getTasks(
        @Param('id') id: string,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.getTasks(res.locals.user, id);
    }

    @Post(':id/tasks')
    async createTask(
        @Param('id') id: string,
        @Body(new ValidationPipe({ transform: true })) dto: CreateProjectTaskDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.createTask(res.locals.user, id, dto);
    }

    @Patch(':id/tasks/:taskId')
    async updateTask(
        @Param('id') id: string,
        @Param('taskId') taskId: string,
        @Body() dto: any,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.updateTask(res.locals.user, id, taskId, dto);
    }

    @Delete(':id/tasks/:taskId')
    async deleteTask(
        @Param('id') id: string,
        @Param('taskId') taskId: string,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.deleteTask(res.locals.user, id, taskId);
    }

    // =========================================================================
    // 3. PHASES SUB-RESOURCE
    // =========================================================================
    @Post(':id/phases')
    async createPhase(
        @Param('id') id: string,
        @Body(new ValidationPipe({ transform: true })) dto: CreateProjectPhaseDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.createPhase(res.locals.user, id, dto);
    }

    @Delete(':id/phases/:phaseId')
    async deletePhase(
        @Param('id') id: string,
        @Param('phaseId') phaseId: string,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.deletePhase(res.locals.user, id, phaseId);
    }

    // =========================================================================
    // 4. MEETINGS SUB-RESOURCE
    // =========================================================================
    @Post(':id/meetings')
    async createMeeting(
        @Param('id') id: string,
        @Body(new ValidationPipe({ transform: true })) dto: CreateProjectMeetingDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.createMeeting(res.locals.user, id, dto);
    }

    @Delete(':id/meetings/:meetingId')
    async deleteMeeting(
        @Param('id') id: string,
        @Param('meetingId') meetingId: string,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.deleteMeeting(res.locals.user, id, meetingId);
    }

    // =========================================================================
    // 5. MEMBERS SUB-RESOURCE
    // =========================================================================
    @Get(':id/team-members')
    async getTeamMembers(
        @Param('id') id: string,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.getTeamMembers(res.locals.user, id);
    }

    @Post(':id/members')
    async createMember(
        @Param('id') id: string,
        @Body(new ValidationPipe({ transform: true })) dto: CreateProjectMemberDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.createMember(res.locals.user, id, dto);
    }

    @Delete(':id/members/:memberId')
    async deleteMember(
        @Param('id') id: string,
        @Param('memberId') memberId: string,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.deleteMember(res.locals.user, id, parseInt(memberId, 10));
    }

    // =========================================================================
    // 6. AGILE ROADMAP TIMELINE TASKS
    // =========================================================================
    @Get(':id/agile-tasks')
    async getAgileTasks(
        @Param('id') id: string,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.getAgileTasks(res.locals.user, id);
    }

    @Post(':id/agile-tasks')
    async createAgileTask(
        @Param('id') id: string,
        @Body() dto: any,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.createAgileTask(res.locals.user, id, dto);
    }

    @Delete(':id/agile-tasks/:taskId')
    async deleteAgileTask(
        @Param('id') id: string,
        @Param('taskId') taskId: string,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.deleteAgileTask(res.locals.user, id, taskId);
    }
}
