import { TaskMember } from 'app/resources/2-user/2-task/models/task.types';

export interface AgilePlanSegment {
    iteration: 1 | 2 | 3;
    startWeek: number; // 14 to 40
    durationWeeks: number;
    label?: string;
}

export interface AgilePlanTask {
    id: string;
    name: string;
    segments: AgilePlanSegment[];
}

export interface TaskLink {
    id: string;
    title: string;
    url: string;
    type: 'figma' | 'github' | 'doc' | 'external';
    taskCode?: string;
    taskTitle?: string;
    createdAt?: string;
}

export interface TaskDocument {
    id: string;
    name: string;
    size: string;
    type: 'pdf' | 'doc' | 'image' | 'sheet';
    upload_date: string;
    url?: string;
}

export interface ProjectSubtaskItem {
    id: string;
    title: string;
    completed: boolean;
}

export interface ProjectMeetingItem {
    id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    platform: 'Google Meet' | 'Zoom' | 'Microsoft Teams' | 'Office';
    link: string;
    status: 'upcoming' | 'completed' | 'ongoing';
    attendees: TaskMember[];
}

export interface ProjectPhaseItem {
    id: string;
    title: string;
    quarter: string;
    status: 'completed' | 'in_progress' | 'planned';
    startDate: string;
    endDate: string;
    tasksCount: number;
    progress?: number;
}

export interface TaskChatMessageItem {
    id: string;
    sender_name: string;
    sender_avatar?: string | null;
    sender_initial?: string;
    sender_bg?: string;
    text: string;
    time: string;
    is_self: boolean;
    is_system?: boolean;
    attachments?: { name: string; size: string; type: string; url?: string; isImage?: boolean }[];
}

export interface AdminTaskItem {
    id: string;
    code: string;
    title: string;
    description?: string;
    priority: 'urgent' | 'high' | 'medium' | 'low';
    due_date?: string;
    created_at?: string;
    comments_count: number;
    attachments_count: number;
    assignee?: TaskMember | null;
    assignees?: TaskMember[];
    reporter?: TaskMember | null;
    members?: TaskMember[];
    status: 'review' | 'done' | 'confirmed' | 'reopened' | 'new' | 'in_progress' | 'unconfirmed' | string;
    time_ago: string;
    progress?: number;
    subtasks?: ProjectSubtaskItem[];
    links?: TaskLink[];
    documents?: TaskDocument[];
    task_type?: string;
}

export const DEFAULT_AGILE_TASKS: AgilePlanTask[] = [];
export const DEFAULT_PROJECT_TASKS: AdminTaskItem[] = [];
export const DEFAULT_PROJECT_PHASES: ProjectPhaseItem[] = [];
export const DEFAULT_PROJECT_TEAM_MEMBERS: TaskMember[] = [];
export const DEFAULT_PROJECT_MEETINGS: ProjectMeetingItem[] = [];
export const DEFAULT_PROJECT_LINKS: TaskLink[] = [];

