// ===========================================================================>> Core Library
import { Body, Controller, Get, Post, Res, ValidationPipe } from '@nestjs/common';

// ===========================================================================>> Third Party Library
import express from 'express';

// ===========================================================================>> Custom Library
import { CheckInOutDto } from './attendance.dto';
import { AttendanceService } from './attendance.service';

@Controller('home/attendance')
export class AttendanceController {
    constructor(private readonly _service: AttendanceService) {}

    @Get()
    async getAttendance(@Res({ passthrough: true }) res: express.Response) {
        return await this._service.getAttendance(res.locals.user);
    }

    @Post('check-in')
    async recordCheckIn(
        @Body(new ValidationPipe({ transform: true })) dto: CheckInOutDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.recordCheckIn(res.locals.user, dto);
    }

    @Post('check-out')
    async recordCheckOut(
        @Body(new ValidationPipe({ transform: true })) dto: CheckInOutDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.recordCheckOut(res.locals.user, dto);
    }
}
