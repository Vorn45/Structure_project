// ===========================================================================>> Core Library
import { Body, Controller, Get, Param, Patch, Res } from '@nestjs/common';
import express from 'express';

// ===========================================================================>> Custom Library
import { AdminAttendanceService } from './attendance.service';
import { ActionLeaveDto } from './attendance.dto';

@Controller('attendance')
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
