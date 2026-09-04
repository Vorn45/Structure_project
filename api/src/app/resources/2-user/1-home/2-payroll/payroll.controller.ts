// ===========================================================================>> Core Library
import { Controller, Get, Res } from '@nestjs/common';

// ===========================================================================>> Third Party Library
import express from 'express';

// ===========================================================================>> Custom Library
import { PayrollService } from './payroll.service';

@Controller('home/payroll')
export class PayrollController {
    constructor(private readonly _service: PayrollService) {}

    @Get()
    async getPayroll(@Res({ passthrough: true }) res: express.Response) {
        return await this._service.getPayroll(res.locals.user);
    }
}
