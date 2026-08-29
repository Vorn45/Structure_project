// ===========================================================================>> Core Library
import { Module }        from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// ===========================================================================>> Custom Library
// > Local
import { Role }                    from 'src/app/model/user/role.entity';
import { UserRole }                from 'src/app/model/user/user_role.entity';
import { User }                    from 'src/app/model/user/users.entity';
import { TelegramLoginController } from './telegram-login.controller';
import { TelegramLoginRepository } from './telegram-login.repository';
import { TelegramLoginService }    from './telegram-login.service';
import { CommonModule }            from 'src/app/common/common.module';

// ======================================= >> Code Starts Here << ========================== //
@Module({
    imports: [
        TypeOrmModule.forFeature([User, Role, UserRole]),
        CommonModule,
    ],
    controllers: [TelegramLoginController],
    providers: [TelegramLoginService, TelegramLoginRepository],
    exports: [TelegramLoginService],
})
export class TelegramLoginModule {}
