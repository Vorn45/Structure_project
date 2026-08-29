// ===========================================================================>> Core Library
import { Module }        from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// ===========================================================================>> Custom Library
// > Local
import { User }               from 'src/app/model/user/users.entity';
import { UserOTP }            from 'src/app/model/user/otp.entity';
import { UsernameController } from './username.controller';
import { UsernameService }    from './username.service';
import { CommonModule }       from 'src/app/common/common.module';

// ======================================= >> Code Starts Here << ========================== //
@Module({
    imports: [TypeOrmModule.forFeature([User, UserOTP]), CommonModule],
    controllers: [UsernameController],
    providers: [UsernameService],
})
export class UsernameModule {}
