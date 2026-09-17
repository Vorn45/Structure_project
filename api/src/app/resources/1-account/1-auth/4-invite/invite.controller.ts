import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { InviteService } from './invite.service';
import { AcceptInviteDto } from 'src/app/resources/3-admin/2-user/user.dto';

@Controller('auth/invite')
export class InviteController {
    constructor(private readonly _service: InviteService) {}

    @Get('verify')
    async verify(@Query('token') token: string) {
        return this._service.verify(token);
    }

    @Post('accept')
    async accept(@Body() dto: AcceptInviteDto, @Req() req: Request) {
        return this._service.accept(dto, req);
    }
}
