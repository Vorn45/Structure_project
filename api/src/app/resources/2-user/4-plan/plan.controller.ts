// ===========================================================================>> Core Library
import { Controller, Get, Param, Query, Res, ValidationPipe } from '@nestjs/common';

// ===========================================================================>> Third Party Library
import express from 'express';

// ===========================================================================>> Custom Library
import { QueryPlanDto } from './plan.dto';
import { PlanService } from './plan.service';

// ======================================= >> Code Starts Here << ========================== //
@Controller('plan')
export class PlanController {
    constructor(private readonly _service: PlanService) {}

    @Get('')
    async getPlans(
        @Query(new ValidationPipe({ transform: true })) query: QueryPlanDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.getPlans(res.locals.user, query);
    }

    @Get(':id')
    async getPlanById(
        @Param('id') id: string,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.getPlanById(res.locals.user, id);
    }

    @Get(':id/team-members')
    async getTeamMembers(
        @Param('id') id: string,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.getTeamMembers(res.locals.user, id);
    }
}
