// ===========================================================================>> Core Library
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// ===========================================================================>> Custom Library
import { CommonModule } from 'src/app/common/common.module';
import { User } from 'src/app/model/user/users.entity';
import { Role } from 'src/app/model/user/role.entity';
import { UserRole } from 'src/app/model/user/user_role.entity';
import { PlanStore } from 'src/app/model/user/plan-store.entity';
import { UserModule } from '../2-user/user.module';

// Controllers
import { DashboardController, StatsController } from './1-dashboard/dashboard.controller';
import { AdminUserController } from './2-user/user.controller';
import { AdminProjectController } from './3-project/project.controller';
import { AdminAttendanceController } from './4-attendance/attendance.controller';
import { AdminSettingController } from './5-setting/setting.controller';

// Services
import { DashboardService } from './1-dashboard/dashboard.service';
import { AdminUserService } from './2-user/user.service';
import { AdminProjectService } from './3-project/project.service';
import { AdminAttendanceService } from './4-attendance/attendance.service';
import { AdminSettingService } from './5-setting/setting.service';

@Module({
    imports: [
        HttpModule,
        CommonModule,
        UserModule,
        TypeOrmModule.forFeature([User, Role, UserRole, PlanStore]),
    ],
    controllers: [
        DashboardController,
        StatsController,
        AdminUserController,
        AdminProjectController,
        AdminAttendanceController,
        AdminSettingController,
    ],
    providers: [
        DashboardService,
        AdminUserService,
        AdminProjectService,
        AdminAttendanceService,
        AdminSettingService,
    ],
    exports: [
        DashboardService,
        AdminUserService,
        AdminProjectService,
        AdminAttendanceService,
        AdminSettingService,
    ],
})
export class AdminModule {}
