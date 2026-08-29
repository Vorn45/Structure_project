// ===========================================================================>> Core Library
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Req, Res, ValidationPipe, } from '@nestjs/common';

// ===========================================================================>> Third Party Library
import express from 'express';

// ===========================================================================>> Custom Library
// > Local
import { PasskeyRegistrationVerifyDto, RenamePasskeyDto } from './passkey.dto';
import { PasskeyService } from './passkey.service';

// ======================================= >> Code Starts Here << ========================== //
@Controller('passkey')
export class PasskeyController {
    constructor(private readonly _service: PasskeyService) {}

    @Get()
    async list(@Res({ passthrough: true }) res: express.Response) {
        return await this._service.list(res.locals.user);
    }

    @Post('registration-options')
    async registrationOptions(
        @Req() req: express.Request,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.generateRegistrationOptions(res.locals.user, req.headers.origin);
    }

    @Post('registration-verify')
    async registrationVerify(
        @Body(new ValidationPipe()) dto: PasskeyRegistrationVerifyDto,
        @Req() req: express.Request,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.verifyRegistration(res.locals.user, dto, req.headers['user-agent']);
    }

    @Put(':id')
    async rename(
        @Param('id', ParseIntPipe) id: number,
        @Body(new ValidationPipe()) dto: RenamePasskeyDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.rename(res.locals.user, id, dto);
    }

    @Delete(':id')
    async remove(
        @Param('id', ParseIntPipe) id: number,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return await this._service.remove(res.locals.user, id);
    }
}
