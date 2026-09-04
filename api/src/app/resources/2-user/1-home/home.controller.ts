// ===========================================================================>> Core Library
import {
    Body,
    Controller,
    Get,
    Post,
    Query,
    Res,
    ValidationPipe,
} from '@nestjs/common';

// ===========================================================================>> Third Party Library
import express from 'express';

// ===========================================================================>> Custom Library
import {
    CheckInOutDto,
    CreateHomeProjectDto,
    CreateMeetingDto,
    CreateSupportTicketDto,
    HomeOverviewQueryDto,
} from './home.dto';
import { HomeService } from './home.service';

// ======================================= >> Code Starts Here << ========================== //
@Controller('home')
export class HomeController {
    constructor(private readonly _service: HomeService) {}

    // =========================================================================
    // Core Home Dashboard
    // =========================================================================
    @Get('overview')
    async getOverview(
        @Query(new ValidationPipe({ transform: true })) query: HomeOverviewQueryDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.getOverview(res.locals.user, query);
    }

    @Get('stats')
    async getStats(@Res({ passthrough: true }) res: express.Response) {
        return await this._service.getStats(res.locals.user);
    }

    // =========================================================================
    // 1. Attendance & Working Hours (សម្រង់វត្តមាន និង ម៉ោងធ្វើការ)
    // =========================================================================
    @Get('attendance')
    async getAttendance(@Res({ passthrough: true }) res: express.Response) {
        return await this._service.getAttendance(res.locals.user);
    }

    @Post('attendance/check-in')
    async recordCheckIn(
        @Body(new ValidationPipe({ transform: true })) dto: CheckInOutDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.recordCheckIn(res.locals.user, dto);
    }

    @Post('attendance/check-out')
    async recordCheckOut(
        @Body(new ValidationPipe({ transform: true })) dto: CheckInOutDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.recordCheckOut(res.locals.user, dto);
    }

    // =========================================================================
    // 2. Payroll & Salary Slip (ប្រាក់បៀវត្ស និង ប័ណ្ណបៀវត្ស)
    // =========================================================================
    @Get('payroll')
    async getPayroll(@Res({ passthrough: true }) res: express.Response) {
        return await this._service.getPayroll(res.locals.user);
    }

    // =========================================================================
    // 3. Meetings & Video Conference (បង្កើតអង្គប្រជុំ / បន្ទប់ប្រជុំ)
    // =========================================================================
    @Get('meetings')
    async getMeetings(@Res({ passthrough: true }) res: express.Response) {
        return await this._service.getMeetings(res.locals.user);
    }

    @Post('meetings')
    async createMeeting(
        @Body(new ValidationPipe({ transform: true })) dto: CreateMeetingDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.createMeeting(res.locals.user, dto);
    }

    // =========================================================================
    // 4. Projects: Creation & Active Projects (បង្កើតគម្រោង & គម្រោងសកម្ម)
    // =========================================================================
    @Get('active-projects')
    async getActiveProjects(@Res({ passthrough: true }) res: express.Response) {
        return await this._service.getActiveProjects(res.locals.user);
    }

    @Post('projects')
    async createProject(
        @Body(new ValidationPipe({ transform: true })) dto: CreateHomeProjectDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.createProject(res.locals.user, dto);
    }

    // =========================================================================
    // 5. Help & Support (ជំនួយ ឬ បញ្ហា / មជ្ឈមណ្ឌលជំនួយ)
    // =========================================================================
    @Get('help-support')
    async getHelpSupport(@Res({ passthrough: true }) res: express.Response) {
        return await this._service.getHelpSupport(res.locals.user);
    }

    @Post('help-support/ticket')
    async createSupportTicket(
        @Body(new ValidationPipe({ transform: true })) dto: CreateSupportTicketDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.createSupportTicket(res.locals.user, dto);
    }
}
