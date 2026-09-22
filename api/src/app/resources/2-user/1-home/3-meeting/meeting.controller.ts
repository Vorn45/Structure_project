// ===========================================================================>> Core Library
import { Body, Controller, Delete, Get, Param, Post, Res, ValidationPipe } from '@nestjs/common';

// ===========================================================================>> Third Party Library
import express from 'express';

// ===========================================================================>> Custom Library
import { CreateMeetingDto } from './meeting.dto';
import { MeetingService } from './meeting.service';

@Controller('home/meetings')
export class MeetingController {
    constructor(private readonly _service: MeetingService) {}

    @Get()
    async getMeetings(@Res({ passthrough: true }) res: express.Response) {
        return await this._service.getMeetings(res.locals.user);
    }

    @Post()
    async createMeeting(
        @Body(new ValidationPipe({ transform: true })) dto: CreateMeetingDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.createMeeting(res.locals.user, dto);
    }

    @Delete(':id')
    async deleteMeeting(
        @Param('id') id: string,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.deleteMeeting(res.locals.user, id);
    }
}
