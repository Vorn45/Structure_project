// ===========================================================================>> Core Library
import {
    Controller,
    Get,
    Query,
    Res,
    ValidationPipe,
} from '@nestjs/common';

// ===========================================================================>> Third Party Library
import express from 'express';

// ===========================================================================>> Custom Library
import { QueryReportDto } from './report.dto';
import { ReportService } from './report.service';

// ======================================= >> Code Starts Here << ========================== //
@Controller('report')
export class ReportController {
    constructor(private readonly _service: ReportService) {}

    @Get('')
    async getReportMetrics(
        @Query(new ValidationPipe({ transform: true })) query: QueryReportDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.getReportMetrics(res.locals.user, query);
    }

    @Get('projects')
    async getProjects(@Res({ passthrough: true }) res: express.Response) {
        return await this._service.getProjects(res.locals.user);
    }

    @Get('digest')
    async getDigest(
        @Query(new ValidationPipe({ transform: true })) query: QueryReportDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.getDigest(res.locals.user, query);
    }
}
