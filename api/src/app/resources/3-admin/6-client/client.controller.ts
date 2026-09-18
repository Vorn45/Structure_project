import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Res,
    UseGuards,
} from '@nestjs/common';
import express from 'express';

import { AdminClientService } from './client.service';
import { CreateAdminClientDto, QueryAdminClientDto, UpdateAdminClientDto } from './client.dto';
import { RoleGuard } from 'src/app/common/guards/role.guard';
import { Roles } from 'src/app/common/decorators/roles.decorator';

@Controller('clients')
@UseGuards(RoleGuard)
@Roles('superadmin', 'org_admin')
export class AdminClientController {
    constructor(private readonly _service: AdminClientService) {}

    @Get('')
    async getClients(
        @Query() query: QueryAdminClientDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return this._service.getClients(res.locals.user, query);
    }

    @Get(':id')
    async getClientById(
        @Param('id') id: string,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return this._service.getClientById(res.locals.user, parseInt(id, 10));
    }

    @Post('')
    async createClient(
        @Body() dto: CreateAdminClientDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return this._service.createClient(res.locals.user, dto);
    }

    @Patch(':id')
    async updateClient(
        @Param('id') id: string,
        @Body() dto: UpdateAdminClientDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return this._service.updateClient(res.locals.user, parseInt(id, 10), dto);
    }

    @Patch(':id/toggle-status')
    async toggleClientStatus(
        @Param('id') id: string,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return this._service.toggleClientStatus(res.locals.user, parseInt(id, 10));
    }

    @Delete(':id')
    async deleteClient(
        @Param('id') id: string,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return this._service.deleteClient(res.locals.user, parseInt(id, 10));
    }
}
