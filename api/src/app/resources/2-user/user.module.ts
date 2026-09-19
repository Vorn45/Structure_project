// ===========================================================================>> Core Library
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// ===========================================================================>> Custom Library
import { CommonModule } from 'src/app/common/common.module';
import { User } from 'src/app/model/user/users.entity';
import { TaskStore } from 'src/app/model/user/task-store.entity';
import { ActivityStore } from 'src/app/model/user/activity-store.entity';
import { PlanStore } from 'src/app/model/user/plan-store.entity';
import { PlannerStore } from 'src/app/model/user/planner-store.entity';
import { TelegramThread } from 'src/app/model/user/telegram-thread.entity';
import { ProjectEntity } from 'src/app/model/project/project.entity';
import { ProjectPhaseEntity } from 'src/app/model/project/project-phase.entity';
import { TaskEntity } from 'src/app/model/task/task.entity';
import { TaskCommentEntity } from 'src/app/model/task/task-comment.entity';
import { MeetingEntity } from 'src/app/model/meeting/meeting.entity';
import { NotificationModule } from 'src/app/shared/notification/notification.module';
import { RealtimeModule } from 'src/app/shared/realtime/realtime.module';

// Controllers
import { HomeController } from './1-home/home.controller';
import { AttendanceController } from './1-home/1-attendance/attendance.controller';
import { PayrollController } from './1-home/2-payroll/payroll.controller';
import { MeetingController } from './1-home/3-meeting/meeting.controller';
import { ProjectController } from './1-home/4-project/project.controller';
import { SupportController } from './1-home/5-support/support.controller';

import { TaskController } from './2-task/task.controller';
import { TaskCommentController } from './2-task/1-comment/comment.controller';
import { TaskAttachmentController } from './2-task/2-attachment/attachment.controller';

import { ActivityController } from './3-activity/activity.controller';
import { PlanController } from './4-plan/plan.controller';
import { ReportController } from './5-report/report.controller';
import { PlannerController } from './6-planner/planner.controller';

// Services
import { HomeService } from './1-home/home.service';
import { AttendanceService } from './1-home/1-attendance/attendance.service';
import { PayrollService } from './1-home/2-payroll/payroll.service';
import { MeetingService } from './1-home/3-meeting/meeting.service';
import { ProjectService } from './1-home/4-project/project.service';
import { SupportService } from './1-home/5-support/support.service';

import { TaskService } from './2-task/task.service';
import { TaskCommentService } from './2-task/1-comment/comment.service';
import { TaskAttachmentService } from './2-task/2-attachment/attachment.service';

import { ActivityService } from './3-activity/activity.service';
import { PlanService } from './4-plan/plan.service';
import { ReportService } from './5-report/report.service';
import { PlannerService } from './6-planner/planner.service';
import { FileService } from 'src/app/shared/file/file.service';

// ======================================= >> Code Starts Here << ========================== //
@Module({
    imports: [
        HttpModule,
        CommonModule,
        NotificationModule,
        RealtimeModule,
        TypeOrmModule.forFeature([
            User,
            TaskStore,
            ActivityStore,
            PlanStore,
            PlannerStore,
            TelegramThread,
            ProjectEntity,
            ProjectPhaseEntity,
            TaskEntity,
            TaskCommentEntity,
            MeetingEntity,
        ]),
    ],
    controllers: [
        HomeController,
        AttendanceController,
        PayrollController,
        MeetingController,
        ProjectController,
        SupportController,
        TaskController,
        TaskCommentController,
        TaskAttachmentController,
        ActivityController,
        PlanController,
        ReportController,
        PlannerController,
    ],
    providers: [
        HomeService,
        AttendanceService,
        PayrollService,
        MeetingService,
        ProjectService,
        SupportService,
        TaskService,
        TaskCommentService,
        TaskAttachmentService,
        ActivityService,
        PlanService,
        ReportService,
        PlannerService,
        FileService,
    ],
    exports: [
        HomeService,
        AttendanceService,
        PayrollService,
        MeetingService,
        ProjectService,
        SupportService,
        TaskService,
        TaskCommentService,
        TaskAttachmentService,
        ActivityService,
        PlanService,
        ReportService,
        PlannerService,
    ],
})
export class UserModule {}
