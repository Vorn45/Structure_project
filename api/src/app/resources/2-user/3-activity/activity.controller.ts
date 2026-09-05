// ===========================================================================>> Core Library
import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Query,
    Res,
    ValidationPipe,
} from '@nestjs/common';

// ===========================================================================>> Third Party Library
import express from 'express';

// ===========================================================================>> Custom Library
import {
    CreateActivityDto,
    CreateRoadmapProjectDto,
    CreateRoadmapTaskDto,
    QueryActivityDto,
    SelectRoadmapProjectDto,
} from './activity.dto';
import { ActivityService } from './activity.service';

// ======================================= >> Code Starts Here << ========================== //
@Controller('activity')
export class ActivityController {
    constructor(private readonly _service: ActivityService) {}

    @Get('roadmap')
    async getRoadmapData(@Res({ passthrough: true }) res: express.Response) {
        return await this._service.getRoadmapData(res.locals.user);
    }

    @Post('roadmap/select-project')
    async selectRoadmapProject(
        @Body(new ValidationPipe({ transform: true })) dto: SelectRoadmapProjectDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.selectRoadmapProject(res.locals.user, dto);
    }

    @Post('roadmap/project')
    async createRoadmapProject(
        @Body(new ValidationPipe({ transform: true })) dto: CreateRoadmapProjectDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.createRoadmapProject(res.locals.user, dto);
    }

    @Post('roadmap/task')
    async createRoadmapTask(
        @Body(new ValidationPipe({ transform: true })) dto: CreateRoadmapTaskDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.createRoadmapTask(res.locals.user, dto);
    }

    @Delete('roadmap/task/:id')
    async deleteRoadmapTask(
        @Param('id') id: string,
        @Query('project_id') projectId: string,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.deleteRoadmapTask(res.locals.user, id, projectId);
    }

    @Get('')
    async getActivities(
        @Query(new ValidationPipe({ transform: true })) query: QueryActivityDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.getActivities(res.locals.user, query);
    }

    @Post('')
    async createActivity(
        @Body(new ValidationPipe({ transform: true })) dto: CreateActivityDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.createActivity(res.locals.user, dto);
    }
}
