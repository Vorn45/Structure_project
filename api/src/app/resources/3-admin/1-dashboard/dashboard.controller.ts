import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import express from 'express';

// ===========================================================================>> Custom Library
import { DashboardService } from './dashboard.service';
import { RoleGuard } from 'src/app/common/guards/role.guard';
import { Roles } from 'src/app/common/decorators/roles.decorator';

@Controller('dashboard')
@UseGuards(RoleGuard)
@Roles('superadmin', 'org_admin')
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
@UseGuards(RoleGuard)
@Roles('superadmin', 'org_admin')
export class StatsController {
    constructor(private readonly _service: DashboardService) {}

    @Get('')
    async getStats(@Res({ passthrough: true }) res: express.Response) {
        return this._service.getStats(res.locals.user);
    }
}

