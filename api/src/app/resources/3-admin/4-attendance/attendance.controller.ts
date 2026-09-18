import { Body, Controller, Get, Param, Patch, Res, UseGuards } from '@nestjs/common';
import express from 'express';

// ===========================================================================>> Custom Library
import { AdminAttendanceService } from './attendance.service';
import { ActionLeaveDto } from './attendance.dto';
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

    @Patch('leaves/:id/action')
    async actionLeave(
        @Param('id') id: string,
        @Body() dto: ActionLeaveDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return this._service.actionLeave(res.locals.user, id, dto);
    }
}
