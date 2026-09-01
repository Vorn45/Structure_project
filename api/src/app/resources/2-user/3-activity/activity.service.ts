// ===========================================================================>> Core Library
import { Injectable } from '@nestjs/common';

// ===========================================================================>> Custom Library
import { UserPayload } from 'src/app/interface/jwt.interface';
import { QueryActivityDto } from './activity.dto';

export interface ActivityItem {
    id: number;
    action: string;
    title: string;
    description: string;
    type: 'task' | 'project' | 'comment' | 'auth' | 'security';
    icon: string;
    actor: {
        id: number;
        name: string;
        avatar?: string | null;
    };
    target?: {
        id: string | number;
        name: string;
        type: string;
    };
    created_at: string;
}

const ACTIVITIES: ActivityItem[] = [
    {
        id: 1,
        action: 'TASK_COMPLETED',
        title: 'Completed Task',
        description: 'Completed "Implement Refresh Token rotation & Cookie security"',
        type: 'task',
        icon: 'mdi:check-circle',
        actor: { id: 1, name: 'Current User', avatar: null },
        target: { id: 2, name: 'Refresh Token rotation', type: 'task' },
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
        id: 2,
        action: 'TASK_STATUS_UPDATED',
        title: 'Updated Task Status',
        description: 'Changed status of "Design high-fidelity UI components" to In Progress',
        type: 'task',
        icon: 'mdi:progress-clock',
        actor: { id: 1, name: 'Current User', avatar: null },
        target: { id: 1, name: 'Design high-fidelity UI', type: 'task' },
        created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    },
    {
        id: 3,
        action: 'PROJECT_JOINED',
        title: 'Joined Project',
        description: 'Assigned as Member in project "PMS Upgrade V2"',
        type: 'project',
        icon: 'mdi:folder-account',
        actor: { id: 1, name: 'Current User', avatar: null },
        target: { id: 'proj-001', name: 'PMS Upgrade V2', type: 'project' },
        created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
        id: 4,
        action: 'SECURITY_2FA_ENABLED',
        title: 'Security Setting Updated',
        description: 'Enabled Telegram Two-Factor Authentication',
        type: 'security',
        icon: 'mdi:shield-check',
        actor: { id: 1, name: 'Current User', avatar: null },
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
];

@Injectable()
export class ActivityService {
    async getActivities(user: UserPayload, query: QueryActivityDto) {
        let list = [...ACTIVITIES];

        if (query.type && query.type !== 'all') {
            list = list.filter((a) => a.type === query.type);
        }

        const limit = query.limit ? parseInt(query.limit, 10) : 20;
        const offset = query.offset ? parseInt(query.offset, 10) : 0;
        const paginated = list.slice(offset, offset + limit);

        return {
            status_code: 200,
            message: 'Activities retrieved successfully',
            data: {
                results: paginated,
                total: list.length,
                limit,
                offset,
            },
        };
    }
}
