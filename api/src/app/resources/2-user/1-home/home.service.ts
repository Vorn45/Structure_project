// ===========================================================================>> Core Library
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

// ===========================================================================>> Third Party Library
import { Repository } from 'typeorm';

// ===========================================================================>> Custom Library
import { UserPayload } from 'src/app/interface/jwt.interface';
import { User } from 'src/app/model/user/users.entity';
import { TaskPriorityEnum, TaskStatusEnum } from '../2-task/task.dto';
import { TaskService } from '../2-task/task.service';
import { PlanService } from '../4-plan/plan.service';
import { AttendanceService } from './1-attendance/attendance.service';
import { PayrollService } from './2-payroll/payroll.service';
import { MeetingService } from './3-meeting/meeting.service';
import { ProjectService } from './4-project/project.service';
import { SupportService } from './5-support/support.service';
import { CheckInOutDto } from './1-attendance/attendance.dto';
import { CreateMeetingDto } from './3-meeting/meeting.dto';
import { CreateHomeProjectDto } from './4-project/project.dto';
import { CreateSupportTicketDto } from './5-support/support.dto';
import { HomeOverviewQueryDto } from './home.dto';

// ======================================= >> Code Starts Here << ========================== //
@Injectable()
export class HomeService {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        private readonly taskService: TaskService,
        private readonly planService: PlanService,
        private readonly attendanceService: AttendanceService,
        private readonly payrollService: PayrollService,
        private readonly meetingService: MeetingService,
        private readonly projectService: ProjectService,
        private readonly supportService: SupportService,
    ) {}

    async getOverview(user: UserPayload, query?: HomeOverviewQueryDto) {
        let userInfo: User | null = null;
        if (user?.id) {
            try {
                userInfo = await this.userRepo.findOne({
                    where: { id: user.id },
                    relations: {
                        avatar_file: true,
                        background_file: true,
                        user_roles: {
                            role: true,
                            organization: {
                                logo_file: true,
                            },
                        },
                    },
                });
            } catch {
                // Graceful fallback to user token payload
            }
        }

        const allTasks = this.taskService.getRawTasks();
        const allProjects = this.planService.getRawProjects();

        // Dynamically compute real-time task metrics
        const total_tasks = allTasks.length;
        const pending_tasks = allTasks.filter(
            (t) =>
                t.status === TaskStatusEnum.TODO ||
                t.status === TaskStatusEnum.NEW,
        ).length;
        const in_progress_tasks = allTasks.filter(
            (t) =>
                t.status === TaskStatusEnum.IN_PROGRESS ||
                t.status === TaskStatusEnum.REOPENED ||
                t.status === TaskStatusEnum.IN_REVIEW,
        ).length;
        const completed_tasks = allTasks.filter(
            (t) =>
                t.status === TaskStatusEnum.DONE ||
                t.status === TaskStatusEnum.CONFIRMED,
        ).length;

        const now = new Date();
        const overdue_tasks = allTasks.filter(
            (t) =>
                t.due_date &&
                new Date(t.due_date) < now &&
                t.status !== TaskStatusEnum.DONE &&
                t.status !== TaskStatusEnum.CONFIRMED,
        ).length;

        const high_priority = allTasks.filter(
            (t) =>
                t.priority === TaskPriorityEnum.HIGH ||
                t.priority === TaskPriorityEnum.URGENT,
        ).length;
        const medium_priority = allTasks.filter(
            (t) => t.priority === TaskPriorityEnum.MEDIUM,
        ).length;
        const low_priority = allTasks.filter(
            (t) => t.priority === TaskPriorityEnum.LOW,
        ).length;

        const completion_rate =
            total_tasks > 0 ? Math.round((completed_tasks / total_tasks) * 100) : 0;

        // Dynamic recent tasks
        const recent_tasks = allTasks.slice(0, 5).map((t) => ({
            id: t.id,
            title: t.title,
            status: t.status,
            priority: t.priority,
            due_date: t.due_date || new Date().toISOString(),
            progress: t.progress,
            project_name: t.project_name,
        }));

        // Dynamic active projects
        const active_projects = allProjects
            .filter((p) => p.status === 'active')
            .map((p) => {
                const projectTasks = allTasks.filter((t) => t.project_id === p.id);
                const pTotal = projectTasks.length || p.total_tasks;
                const pCompleted =
                    projectTasks.filter(
                        (t) =>
                            t.status === TaskStatusEnum.DONE ||
                            t.status === TaskStatusEnum.CONFIRMED,
                    ).length || p.completed_tasks;
                const pProgress =
                    pTotal > 0 ? Math.round((pCompleted / pTotal) * 100) : p.progress;

                return {
                    id: p.id,
                    name: p.name,
                    total_tasks: pTotal,
                    completed_tasks: pCompleted,
                    progress: pProgress,
                    members_count: p.members?.length || 1,
                    status: p.status,
                };
            });

        let avatarObj: any = user?.avatar ?? null;
        if (userInfo?.avatar_file) {
            avatarObj = {
                id: userInfo.avatar_file.id,
                uri: userInfo.avatar_file.uri,
                file_domain: userInfo.avatar_file.file_domain,
                type: userInfo.avatar_file.type,
                title: userInfo.avatar_file.title,
            };
        }

        let coverObj: any = (user as any)?.cover ?? null;
        if (userInfo?.background_file) {
            coverObj = {
                id: userInfo.background_file.id,
                uri: userInfo.background_file.uri,
                file_domain: userInfo.background_file.file_domain,
                type: userInfo.background_file.type,
                title: userInfo.background_file.title,
            };
        }

        const defaultUserRole =
            userInfo?.user_roles?.find((ur) => ur.is_default) ||
            userInfo?.user_roles?.[0];
        const defaultOrg = defaultUserRole?.organization;
        const defaultRole = defaultUserRole?.role;

        const name_kh =
            userInfo?.name_kh || user?.name_kh || (user as any)?.kh_name || '';
        const name_en =
            userInfo?.name_en || user?.name_en || (user as any)?.en_name || '';
        const email = userInfo?.email || user?.email || '';
        const phone = userInfo?.phone || user?.phone || '';

        return {
            status_code: 200,
            message: 'User dashboard overview retrieved successfully',
            data: {
                user: {
                    id: user?.id ?? userInfo?.id ?? 0,
                    name_en,
                    name_kh,
                    en_name: name_en,
                    kh_name: name_kh,
                    email,
                    phone,
                    avatar: avatarObj,
                    cover: coverObj,
                    active_role_id: user?.roles?.[0]?.id ?? defaultRole?.id ?? 1,
                    role_name: defaultRole?.name_kh || defaultRole?.name_en || defaultRole?.slug || null,
                    organization_id: defaultOrg?.id ?? user?.organization_id ?? null,
                    organization_name: defaultOrg?.name_kh || defaultOrg?.name_en || null,
                },
                metrics: {
                    total_tasks,
                    pending_tasks,
                    in_progress_tasks,
                    completed_tasks,
                    overdue_tasks,
                    high_priority,
                    medium_priority,
                    low_priority,
                    completion_rate,
                },
                recent_tasks,
                active_projects,
            },
        };
    }

    async getStats(user: UserPayload) {
        const allTasks = this.taskService.getRawTasks();

        const todo = allTasks.filter(
            (t) =>
                t.status === TaskStatusEnum.TODO ||
                t.status === TaskStatusEnum.NEW,
        ).length;
        const in_progress = allTasks.filter(
            (t) =>
                t.status === TaskStatusEnum.IN_PROGRESS ||
                t.status === TaskStatusEnum.REOPENED,
        ).length;
        const review = allTasks.filter(
            (t) => t.status === TaskStatusEnum.IN_REVIEW,
        ).length;
        const done = allTasks.filter(
            (t) =>
                t.status === TaskStatusEnum.DONE ||
                t.status === TaskStatusEnum.CONFIRMED,
        ).length;

        const dayMap: Record<string, { completed: number; created: number }> = {
            Mon: { completed: 0, created: 0 },
            Tue: { completed: 0, created: 0 },
            Wed: { completed: 0, created: 0 },
            Thu: { completed: 0, created: 0 },
            Fri: { completed: 0, created: 0 },
            Sat: { completed: 0, created: 0 },
            Sun: { completed: 0, created: 0 },
        };

        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        allTasks.forEach((t) => {
            if (t.created_at) {
                const day = dayNames[new Date(t.created_at).getDay()];
                if (dayMap[day]) dayMap[day].created += 1;
            }
            if (
                (t.status === TaskStatusEnum.DONE || t.status === TaskStatusEnum.CONFIRMED) &&
                t.updated_at
            ) {
                const day = dayNames[new Date(t.updated_at).getDay()];
                if (dayMap[day]) dayMap[day].completed += 1;
            }
        });

        const weekly_activity = Object.keys(dayMap).map((day) => ({
            day,
            completed: dayMap[day].completed,
            created: dayMap[day].created,
        }));

        return {
            status_code: 200,
            message: 'User statistics retrieved successfully',
            data: {
                tasks_summary: {
                    todo,
                    in_progress,
                    review,
                    done,
                },
                weekly_activity,
            },
        };
    }

    // Delegation to sub-services
    async getAttendance(user: UserPayload) {
        return await this.attendanceService.getAttendance(user);
    }

    async recordCheckIn(user: UserPayload, dto: CheckInOutDto) {
        return await this.attendanceService.recordCheckIn(user, dto);
    }

    async recordCheckOut(user: UserPayload, dto: CheckInOutDto) {
        return await this.attendanceService.recordCheckOut(user, dto);
    }

    async getPayroll(user: UserPayload) {
        return await this.payrollService.getPayroll(user);
    }

    async getMeetings(user: UserPayload) {
        return await this.meetingService.getMeetings(user);
    }

    async createMeeting(user: UserPayload, dto: CreateMeetingDto) {
        return await this.meetingService.createMeeting(user, dto);
    }

    async getActiveProjects(user: UserPayload) {
        return await this.projectService.getActiveProjects(user);
    }

    async createProject(user: UserPayload, dto: CreateHomeProjectDto) {
        return await this.projectService.createProject(user, dto);
    }

    async getHelpSupport(user: UserPayload) {
        return await this.supportService.getHelpSupport(user);
    }

    async createSupportTicket(user: UserPayload, dto: CreateSupportTicketDto) {
        return await this.supportService.createSupportTicket(user, dto);
    }
}
