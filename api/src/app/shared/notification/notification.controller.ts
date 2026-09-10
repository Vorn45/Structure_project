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
} from '@nestjs/common';
import express from 'express';
import {
    MarkReadManyDto,
    QueryChatNotificationDto,
    QueryNotificationDto,
    QueryTaskChatNotificationDto,
    SaveFcmTokenDto,
    UpdateNotificationSettingDto,
} from './notification.dto';
import { NotificationService } from './notification.service';

@Controller('notification')
export class NotificationController {
    constructor(private readonly _service: NotificationService) {}

    @Get('')
    async getNotifications(
        @Res({ passthrough: true }) res: express.Response,
        @Query() query: QueryNotificationDto,
    ) {
        return await this._service.getNotifications(res.locals.user, query);
    }

    @Get('unread-count')
    async getUnreadCount(@Res({ passthrough: true }) res: express.Response) {
        return await this._service.getUnreadCount(res.locals.user);
    }

    @Get('firebase-config')
    async getFirebaseConfig(@Res({ passthrough: true }) res: express.Response) {
        return await this._service.getFirebaseConfig();
    }

    @Post('test')
    async simulateTestNotification(@Res({ passthrough: true }) res: express.Response) {
        return await this._service.simulateTestNotification(res.locals.user);
    }

    @Post('fcm-token')
    async saveFcmToken(
        @Res({ passthrough: true }) res: express.Response,
        @Body() body: SaveFcmTokenDto,
    ) {
        return await this._service.saveFcmToken(res.locals.user, body);
    }

    @Delete('fcm-token')
    async deleteFcmToken(
        @Res({ passthrough: true }) res: express.Response,
        @Body() body: { token: string },
    ) {
        return await this._service.deleteFcmToken(res.locals.user, body?.token);
    }

    @Get('chat')
    async getChatList(
        @Res({ passthrough: true }) res: express.Response,
        @Query() query: QueryChatNotificationDto,
    ) {
        return await this._service.getChatList(res.locals.user, query);
    }

    @Get('organization-chat')
    async getOrganizationChatList(
        @Res({ passthrough: true }) res: express.Response,
        @Query() query: QueryChatNotificationDto,
    ) {
        return await this._service.getOrganizationChatList(res.locals.user, query);
    }

    @Get('task-chat')
    async getTaskChatList(
        @Res({ passthrough: true }) res: express.Response,
        @Query() query: QueryTaskChatNotificationDto,
    ) {
        return await this._service.getTaskChatList(res.locals.user, query);
    }

    @Get('settings')
    async getSettings(
        @Res({ passthrough: true }) res: express.Response,
        @Query('scope') scope?: string,
    ) {
        return await this._service.getSettings(res.locals.user, scope);
    }

    @Get('setting')
    async getSetting(
        @Res({ passthrough: true }) res: express.Response,
        @Query('scope') scope?: string,
    ) {
        return await this._service.getSettings(res.locals.user, scope);
    }

    @Patch('settings')
    async updateSettings(
        @Res({ passthrough: true }) res: express.Response,
        @Body() body: UpdateNotificationSettingDto,
        @Query('scope') scope?: string,
    ) {
        return await this._service.updateSettings(res.locals.user, body, scope || body?.scope);
    }

    @Patch('setting')
    async updateSetting(
        @Res({ passthrough: true }) res: express.Response,
        @Body() body: UpdateNotificationSettingDto,
        @Query('scope') scope?: string,
    ) {
        return await this._service.updateSettings(res.locals.user, body, scope || body?.scope);
    }

    @Patch('mark-all-as-read')
    async markAllAsRead(@Res({ passthrough: true }) res: express.Response) {
        return await this._service.markAllAsRead(res.locals.user);
    }

    @Patch('read-all')
    async readAll(@Res({ passthrough: true }) res: express.Response) {
        return await this._service.markAllAsRead(res.locals.user);
    }

    @Patch('read-many')
    async markReadMany(
        @Res({ passthrough: true }) res: express.Response,
        @Body() body: MarkReadManyDto,
    ) {
        return await this._service.markReadMany(res.locals.user, body);
    }

    @Patch(':id/read')
    async markRead(
        @Res({ passthrough: true }) res: express.Response,
        @Param('id') id: string,
    ) {
        return await this._service.markRead(res.locals.user, id);
    }

    @Delete(':id')
    async deleteNotification(
        @Res({ passthrough: true }) res: express.Response,
        @Param('id') id: string,
    ) {
        return await this._service.deleteNotification(res.locals.user, id);
    }
}
