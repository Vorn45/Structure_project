// ===========================================================================>> Core Library
import { Module } from '@nestjs/common';

// ===========================================================================>> Custom Library
// > Local
import { SesService } from './ses.service';

// ======================================= >> Code Starts Here << ========================== //
@Module({
    providers: [SesService],
    exports: [SesService],
})
export class MailModule {}
