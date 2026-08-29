// ===========================================================================>> Core Library
import { Module }        from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// ===========================================================================>> Custom Library
// > Local
import { UserOTP }          from 'src/app/model/user/otp.entity';
import { Role }             from 'src/app/model/user/role.entity';
import { UserRole }         from 'src/app/model/user/user_role.entity';
import { User }             from 'src/app/model/user/users.entity';
import { SignUpController } from './signup.controller';
import { SignUpService }    from './signup.service';

// ======================================= >> Code Starts Here << ========================== //
@Module({
    imports: [TypeOrmModule.forFeature([User, Role, UserRole, UserOTP])],
    controllers: [SignUpController],
    providers: [SignUpService],
})
export class SignUpModule {}
