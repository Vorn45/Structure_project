import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from 'src/app/model/user/users.entity';
import { Role } from 'src/app/model/user/role.entity';
import { UserRole } from 'src/app/model/user/user_role.entity';
import { UserInvitation } from 'src/app/model/user/user-invitation.entity';
import { SharedModule } from 'src/app/shared/shared.module';

import { InviteController } from './invite.controller';
import { InviteService } from './invite.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Role, UserRole, UserInvitation]),
        SharedModule,
    ],
    controllers: [InviteController],
    providers: [InviteService],
    exports: [InviteService],
})
export class InviteModule {}
