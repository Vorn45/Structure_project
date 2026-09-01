// ===========================================================================>> Core Library
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// ===========================================================================>> Custom Library
import { CommonModule } from 'src/app/common/common.module';
import { User } from 'src/app/model/user/users.entity';

// Controllers
import { HomeController } from './1-home/home.controller';
import { TaskController } from './2-task/task.controller';
import { ActivityController } from './3-activity/activity.controller';
import { PlanController } from './4-plan/plan.controller';

// Services
import { HomeService } from './1-home/home.service';
import { TaskService } from './2-task/task.service';
import { ActivityService } from './3-activity/activity.service';
import { PlanService } from './4-plan/plan.service';

// ======================================= >> Code Starts Here << ========================== //
@Module({
    imports: [
        HttpModule,
        CommonModule,
        TypeOrmModule.forFeature([User]),
    ],
    controllers: [
        HomeController,
        TaskController,
        ActivityController,
        PlanController,
    ],
    providers: [
        HomeService,
        TaskService,
        ActivityService,
        PlanService,
    ],
    exports: [
        HomeService,
        TaskService,
        ActivityService,
        PlanService,
    ],
})
export class UserModule {}
