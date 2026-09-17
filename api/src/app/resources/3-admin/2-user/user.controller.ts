// ===========================================================================>> Core Library
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import express from 'express';

// ===========================================================================>> Custom Library
import { AdminUserService } from './user.service';
import { CreateAdminUserDto, InviteUserDto, QueryAdminUserDto, QueryInvitationsDto, UpdateAdminUserDto } from './user.dto';
import { IMAGE_UPLOAD_OPTIONS } from 'src/app/shared/file/file-upload.util';

@Controller('users')
export class AdminUserController {
    constructor(private readonly _service: AdminUserService) {}

    @Get('invitations')
    async getInvitations(@Query() query: QueryInvitationsDto) {
        return this._service.getInvitations(query);
    }

    @Post('invite')
    async inviteUser(@Body() dto: InviteUserDto, @Res({ passthrough: true }) res: express.Response) {
        return this._service.inviteUser(res.locals.user, dto);
    }

    @Post('invitations/:id/resend')
    async resendInvitation(@Param('id') id: string, @Res({ passthrough: true }) res: express.Response) {
        return this._service.resendInvitation(res.locals.user, id);
    }

    @Delete('invitations/:id')
    async revokeInvitation(@Param('id') id: string, @Res({ passthrough: true }) res: express.Response) {
        return this._service.revokeInvitation(res.locals.user, id);
    }

    @Get('')
    async getUsers(@Query() query: QueryAdminUserDto, @Res({ passthrough: true }) res: express.Response) {
        return this._service.getUsers(res.locals.user, query);
    }

    @Post('')
    async createUser(@Body() dto: CreateAdminUserDto, @Res({ passthrough: true }) res: express.Response) {
        return this._service.createUser(res.locals.user, dto);
    }

    @Post(':id/avatar')
    @UseInterceptors(FileInterceptor('avatar', IMAGE_UPLOAD_OPTIONS))
    async uploadAvatar(
        @Param('id') id: string,
        @UploadedFile() file: any,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return this._service.uploadAvatar(res.locals.user, parseInt(id, 10), file);
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
