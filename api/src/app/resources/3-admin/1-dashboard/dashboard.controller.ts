// ===========================================================================>> Core Library
import { Controller, Get, Res } from '@nestjs/common';
import express from 'express';

// ===========================================================================>> Custom Library
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
    constructor(private readonly _service: DashboardService) {}

    @Get('')
    async getDashboard(@Res({ passthrough: true }) res: express.Response) {
        return this._service.getStats(res.locals.user);
    }

    @Get('stats')
    async getStats(@Res({ passthrough: true }) res: express.Response) {
        return this._service.getStats(res.locals.user);
    }
}

@Controller('stats')
export class StatsController {
    constructor(private readonly _service: DashboardService) {}

    @Get('')
    async getStats(@Res({ passthrough: true }) res: express.Response) {
        return this._service.getStats(res.locals.user);
    }
}
