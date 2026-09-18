import { Body, Controller, Get, Patch, Res, UseGuards } from '@nestjs/common';
import express from 'express';

// ===========================================================================>> Custom Library
import { AdminSettingService } from './setting.service';
import { UpdateSettingsDto } from './setting.dto';
import { RoleGuard } from 'src/app/common/guards/role.guard';
import { Roles } from 'src/app/common/decorators/roles.decorator';

@Controller('settings')
@UseGuards(RoleGuard)
@Roles('superadmin', 'org_admin')
export class AdminSettingController {

    constructor(private readonly _service: AdminSettingService) {}

    @Get('')
    async getSettings(@Res({ passthrough: true }) res: express.Response) {
        return this._service.getSettings(res.locals.user);
    }

    @Patch('')
    async updateSettings(
        @Body() dto: UpdateSettingsDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return this._service.updateSettings(res.locals.user, dto);
    }
}
