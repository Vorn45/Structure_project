// ===========================================================================>> Core Library
import { Body, Controller, Get, HttpCode, Param, Post, Put, Query, Req, Res, UploadedFiles, UseInterceptors, ValidationPipe, } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

// ===========================================================================>> Third Party Library
import express from 'express';

// ===========================================================================>> Custom Library
// > Local
import { ChangeOwnPasswordDto, CheckPasswordDto, QrLoginDto, SwitchRoleDto, UpdateOwnProfileInfoDto, } from './account.dto';
import { AccountService } from './account.service';
import { IMAGE_UPLOAD_OPTIONS } from 'src/app/shared/file/file-upload.util';

// ======================================= >> Code Starts Here << ========================== //
const transformValidationPipe = new ValidationPipe({ transform: true });

@Controller('')
export class AccountController {
    constructor(private _service: AccountService) { }

    @Get('roles')
    async getExistingRoles(@Res({ passthrough: true }) res: express.Response) {
        return await this._service.getExistingRoles(res.locals.user);
    }

    @Get('info')
    async getOwnProfileInfo(@Res({ passthrough: true }) res: express.Response) {
        return await this._service.getOwnProfileInfo(res.locals.user);
    }

    @Post('switch')
    async switchRole(
        @Body(transformValidationPipe) dto: SwitchRoleDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.switchRole(res.locals.user, dto);
    }

    @Get('organizations')
    async getOrganizations(@Res({ passthrough: true }) res: express.Response) {
        return await this._service.getOrganizations(res.locals.user);
    }

    @Put('')
    @UseInterceptors(
        FileFieldsInterceptor(
            [
                { name: 'avatar', maxCount: 1 },
                { name: 'background', maxCount: 1 },
            ],
            IMAGE_UPLOAD_OPTIONS,
        ),
    )
    async updateOwnProfileInfo(
        @Body(new ValidationPipe()) dto: UpdateOwnProfileInfoDto,
        @UploadedFiles() files: Record<string, any[]>,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        const currentUser =
            res.locals.user?.name_en ??
            res.locals.user?.name_kh ??
            String(res.locals.user?.id ?? 'system');

        return await this._service.updateOwnProfileInfo(
            res.locals.user,
            dto,
            currentUser,
            files,
        );
    }

    @Get('telegram/status')
    async getTelegramStatus(@Res({ passthrough: true }) res: express.Response) {
        return await this._service.getTelegramStatus(res.locals.user);
    }

    @Post('telegram/link')
    async linkTelegram(@Res({ passthrough: true }) res: express.Response) {
        return await this._service.generateTelegramLink(res.locals.user);
    }

    @Get('telegram/organization/:organizationId/status')
    async getOrgTelegramStatus(
        @Param('organizationId') organizationId: string,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.getOrgTelegramStatus(res.locals.user, organizationId);
    }

    @Post('telegram/organization/:organizationId/link')
    async linkOrgTelegram(
        @Param('organizationId') organizationId: string,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.generateOrgTelegramLink(res.locals.user, organizationId);
    }

    @Post('organization/:organizationId/leave')
    async leaveOrganization(
        @Param('organizationId') organizationId: string,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.leaveOrganization(res.locals.user, organizationId);
    }

    @Post('check-password')
    @HttpCode(200)
    async checkPassword(
        @Body(new ValidationPipe()) dto: CheckPasswordDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.checkPassword(res.locals.user, dto);
    }

    @Get('password/last-change')
    async getOwnPasswordLastChanged(
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.getOwnPasswordLastChanged(res.locals.user);
    }

    @Get('devices')
    async getOwnActiveDevices(
        @Req() req: express.Request,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.getOwnActiveDevices(res.locals.user, req);
    }

    @Get('sessions')
    async getOwnSessions(@Res({ passthrough: true }) res: express.Response) {
        return await this._service.getOwnSessions(res.locals.user);
    }

    @Get('qr-login')
    async createQrLogin(@Res({ passthrough: true }) res: express.Response) {
        return await this._service.createQrLogin(res.locals.user);
    }

    @Get('qr-login/status')
    async getQrLoginStatus(@Query(new ValidationPipe()) dto: QrLoginDto) {
        return await this._service.getQrLoginStatus(dto);
    }

    @Post('qr-login/scan')
    async scanQrLogin(
        @Body(new ValidationPipe()) dto: QrLoginDto,
        @Req() req: express.Request,
    ) {
        return await this._service.scanQrLogin(dto, req);
    }

    @Put('change-password')
    async changeOwnPassword(
        @Body(new ValidationPipe()) dto: ChangeOwnPasswordDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.changeOwnPassword(res.locals.user, dto);
    }
}
