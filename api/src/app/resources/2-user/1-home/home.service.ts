// ===========================================================================>> Core Library
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

// ===========================================================================>> Third Party Library
import { Repository } from 'typeorm';

// ===========================================================================>> Custom Library
import { UserPayload } from 'src/app/interface/jwt.interface';
import { User } from 'src/app/model/user/users.entity';
import { HomeOverviewQueryDto } from './home.dto';

// ======================================= >> Code Starts Here << ========================== //
@Injectable()
export class HomeService {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
    ) {}

    async getOverview(user: UserPayload, query?: HomeOverviewQueryDto) {
        const userInfo = await this.userRepo.findOne({
            where: { id: user.id },
            relations: ['user_roles', 'user_roles.role', 'user_roles.organization'],
        });

        // Overview metrics & summary for user dashboard
        return {
            status_code: 200,
            message: 'User dashboard overview retrieved successfully',
            data: {
                user: {
                    id: user.id,
                    name_en: user.name_en,
                    name_kh: user.name_kh,
                    email: user.email,
                    phone: user.phone,
                    avatar: user.avatar,
                    active_role_id: user.is_active,
                    organization_id: user.organization_id ?? null,
                },
                metrics: {
                    total_tasks: 12,
                    pending_tasks: 4,
                    in_progress_tasks: 5,
                    completed_tasks: 3,
                    overdue_tasks: 1,
                    high_priority: 2,
                    medium_priority: 7,
                    low_priority: 3,
                    completion_rate: 25, // percentage
                },
                recent_tasks: [
                    {
                        id: 101,
                        title: 'Complete System Architecture Review',
                        status: 'in_progress',
                        priority: 'high',
                        due_date: new Date(Date.now() + 86400000 * 2).toISOString(),
                        progress: 60,
                        project_name: 'PMS Upgrade V2',
                    },
                    {
                        id: 102,
                        title: 'Refactor Authentication & Passkey Service',
                        status: 'in_progress',
                        priority: 'medium',
                        due_date: new Date(Date.now() + 86400000 * 4).toISOString(),
                        progress: 40,
                        project_name: 'PMS Upgrade V2',
                    },
                    {
                        id: 103,
                        title: 'Design Member Portal UI Components',
                        status: 'completed',
                        priority: 'medium',
                        due_date: new Date(Date.now() - 86400000).toISOString(),
                        progress: 100,
                        project_name: 'Design System',
                    },
                ],
                active_projects: [
                    {
                        id: 'proj-001',
                        name: 'PMS Upgrade V2',
                        total_tasks: 24,
                        completed_tasks: 14,
                        progress: 58,
                        members_count: 8,
                        status: 'active',
                    },
                    {
                        id: 'proj-002',
                        name: 'Design System & UI Library',
                        total_tasks: 12,
                        completed_tasks: 9,
                        progress: 75,
                        members_count: 5,
                        status: 'active',
                    },
                ],
            },
        };
    }

    async getStats(user: UserPayload) {
        return {
            status_code: 200,
            message: 'User statistics retrieved successfully',
            data: {
                tasks_summary: {
                    todo: 4,
                    in_progress: 5,
                    review: 0,
                    done: 3,
                },
                weekly_activity: [
                    { day: 'Mon', completed: 2, created: 3 },
                    { day: 'Tue', completed: 1, created: 2 },
                    { day: 'Wed', completed: 4, created: 1 },
                    { day: 'Thu', completed: 0, created: 2 },
                    { day: 'Fri', completed: 3, created: 4 },
                    { day: 'Sat', completed: 0, created: 0 },
                    { day: 'Sun', completed: 0, created: 0 },
                ],
            },
        };
    }
}
