// ===========================================================================>> Core Library
import { Module }        from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// ===========================================================================>> Custom Library
// > Local
import { User }                     from 'src/app/model/user/users.entity';
import { UserOTP }                  from 'src/app/model/user/otp.entity';
import { CommonModule }             from 'src/app/common/common.module';
import { ForgetPasswordController } from './forget-password.controller';
import { ForgetPasswordService }    from './forget-password.service';

// ======================================= >> Code Starts Here << ========================== //
@Module({
    imports: [TypeOrmModule.forFeature([User, UserOTP]), CommonModule],
    controllers: [ForgetPasswordController],
    providers: [ForgetPasswordService],
})
export class ForgetPasswordModule {}
