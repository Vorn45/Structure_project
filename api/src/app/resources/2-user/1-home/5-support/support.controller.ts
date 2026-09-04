// ===========================================================================>> Core Library
import { Body, Controller, Get, Post, Res, ValidationPipe } from '@nestjs/common';

// ===========================================================================>> Third Party Library
import express from 'express';

// ===========================================================================>> Custom Library
import { CreateSupportTicketDto } from './support.dto';
import { SupportService } from './support.service';

@Controller('home/help-support')
export class SupportController {
    constructor(private readonly _service: SupportService) {}

    @Get()
    async getHelpSupport(@Res({ passthrough: true }) res: express.Response) {
        return await this._service.getHelpSupport(res.locals.user);
    }

    @Post('ticket')
    async createSupportTicket(
        @Body(new ValidationPipe({ transform: true })) dto: CreateSupportTicketDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.createSupportTicket(res.locals.user, dto);
    }
}
