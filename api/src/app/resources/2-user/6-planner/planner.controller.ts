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
import express from 'express';

import { CreateScheduleDto, QueryPlannerDto, UpdateScheduleDto } from './planner.dto';
import { PlannerService } from './planner.service';

@Controller('planner')
export class PlannerController {
    constructor(private readonly _service: PlannerService) {}

    // =========================================================================
    // 1. GET ALL SCHEDULES (WORK PLANS & PERSONAL)
    // =========================================================================
    @Get('')
    async getSchedules(
        @Query(new ValidationPipe({ transform: true })) query: QueryPlannerDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.getSchedules(res.locals.user, query);
    }

    // =========================================================================
    // 2. GET TEAM MEMBERS (FOR MEMBER PICKER)
    // =========================================================================
    @Get('members')
    async getTeamMembers(@Res({ passthrough: true }) res: express.Response) {
        return await this._service.getTeamMembers(res.locals.user);
    }

    // =========================================================================
    // 3. GET SCHEDULE BY ID
    // =========================================================================
    @Get(':id')
    async getScheduleById(
        @Param('id') id: string,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.getScheduleById(res.locals.user, id);
    }

    // =========================================================================
    // 4. CREATE NEW SCHEDULE (WORK PLAN OR PERSONAL)
    // =========================================================================
    @Post('')
    async createSchedule(
        @Body(new ValidationPipe({ transform: true })) dto: CreateScheduleDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.createSchedule(res.locals.user, dto);
    }

    // =========================================================================
    // 5. UPDATE SCHEDULE
    // =========================================================================
    @Patch(':id')
    async updateSchedule(
        @Param('id') id: string,
        @Body(new ValidationPipe({ transform: true })) dto: UpdateScheduleDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.updateSchedule(res.locals.user, id, dto);
    }

    // =========================================================================
    // 6. DELETE SCHEDULE
    // =========================================================================
    @Delete(':id')
    async deleteSchedule(
        @Param('id') id: string,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.deleteSchedule(res.locals.user, id);
    }
}
