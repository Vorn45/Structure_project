// ===========================================================================>> Core Library
import { Controller, Get, Query, Res, ValidationPipe } from '@nestjs/common';

// ===========================================================================>> Third Party Library
import express from 'express';

// ===========================================================================>> Custom Library
import { QueryActivityDto } from './activity.dto';
import { ActivityService } from './activity.service';

// ======================================= >> Code Starts Here << ========================== //
@Controller('activity')
export class ActivityController {
    constructor(private readonly _service: ActivityService) {}

    @Get('')
    async getActivities(
        @Query(new ValidationPipe({ transform: true })) query: QueryActivityDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.getActivities(res.locals.user, query);
    }
}
