// ===========================================================================>> Core Library
import { Controller, Get, Query, Res, ValidationPipe } from '@nestjs/common';

// ===========================================================================>> Third Party Library
import express from 'express';

// ===========================================================================>> Custom Library
import { HomeOverviewQueryDto } from './home.dto';
import { HomeService } from './home.service';

// ======================================= >> Code Starts Here << ========================== //
@Controller('home')
export class HomeController {
    constructor(private readonly _service: HomeService) {}

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
}
