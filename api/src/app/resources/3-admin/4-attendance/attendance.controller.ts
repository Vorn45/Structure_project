import { Body, Controller, Delete, Get, Param, Patch, Post, Res, UseGuards } from '@nestjs/common';
import express from 'express';

// ===========================================================================>> Custom Library
import { AdminAttendanceService } from './attendance.service';
import { ActionLeaveDto, CreateLeaveDto, ManualAttendanceLogDto } from './attendance.dto';
import { RoleGuard } from 'src/app/common/guards/role.guard';
import { Roles } from 'src/app/common/decorators/roles.decorator';

@Controller('attendance')
@UseGuards(RoleGuard)
@Roles('superadmin', 'org_admin')
export class AdminAttendanceController {

    constructor(private readonly _service: AdminAttendanceService) {}

    @Get('')
    async getOverview(@Res({ passthrough: true }) res: express.Response) {
        return this._service.getOverview(res.locals.user);
    }

    @Get('leaves')
    async getLeaves(@Res({ passthrough: true }) res: express.Response) {
        return this._service.getLeaves(res.locals.user);
    }

    @Post('leaves')
    async createLeave(
        @Body() dto: CreateLeaveDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return this._service.createLeave(res.locals.user, dto);
    }

    @Patch('leaves/:id/action')
    async actionLeave(
        @Param('id') id: string,
        @Body() dto: ActionLeaveDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return this._service.actionLeave(res.locals.user, id, dto);
    }

    @Delete('leaves/:id')
    async deleteLeave(
        @Param('id') id: string,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return this._service.deleteLeave(res.locals.user, id);
    }

    @Post('logs')
    async recordLog(
        @Body() dto: ManualAttendanceLogDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return this._service.recordLog(res.locals.user, dto);
    }
}

@Controller('leaves')
@UseGuards(RoleGuard)
@Roles('superadmin', 'org_admin')
export class AdminLeavesController {
    constructor(private readonly _service: AdminAttendanceService) {}

    @Get('')
    async getLeaves(@Res({ passthrough: true }) res: express.Response) {
        return this._service.getLeaves(res.locals.user);
    }

    @Post('')
    async createLeave(
        @Body() dto: CreateLeaveDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return this._service.createLeave(res.locals.user, dto);
    }

    @Patch(':id/action')
    async actionLeave(
        @Param('id') id: string,
        @Body() dto: ActionLeaveDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return this._service.actionLeave(res.locals.user, id, dto);
    }

    @Delete(':id')
    async deleteLeave(
        @Param('id') id: string,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return this._service.deleteLeave(res.locals.user, id);
    }
}

