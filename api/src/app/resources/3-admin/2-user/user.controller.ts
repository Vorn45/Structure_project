// ===========================================================================>> Core Library
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res } from '@nestjs/common';
import express from 'express';

// ===========================================================================>> Custom Library
import { AdminUserService } from './user.service';
import { CreateAdminUserDto, QueryAdminUserDto, UpdateAdminUserDto } from './user.dto';

@Controller('users')
export class AdminUserController {
    constructor(private readonly _service: AdminUserService) {}

    @Get('')
    async getUsers(@Query() query: QueryAdminUserDto, @Res({ passthrough: true }) res: express.Response) {
        return this._service.getUsers(res.locals.user, query);
    }

    @Post('')
    async createUser(@Body() dto: CreateAdminUserDto, @Res({ passthrough: true }) res: express.Response) {
        return this._service.createUser(res.locals.user, dto);
    }

    @Patch(':id')
    async updateUser(
        @Param('id') id: string,
        @Body() dto: UpdateAdminUserDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return this._service.updateUser(res.locals.user, parseInt(id, 10), dto);
    }

    @Patch(':id/toggle-status')
    async toggleStatus(@Param('id') id: string, @Res({ passthrough: true }) res: express.Response) {
        return this._service.toggleStatus(res.locals.user, parseInt(id, 10));
    }

    @Delete(':id')
    async deleteUser(@Param('id') id: string, @Res({ passthrough: true }) res: express.Response) {
        return this._service.deleteUser(res.locals.user, parseInt(id, 10));
    }
}
