export type TaskStatus =
    | 'all'
    | 'new'
    | 'confirmed'
    | 'unconfirmed'
    | 'in_progress'
    | 'in_review'
    | 'reopened'
    | 'done'
    | 'pending'
    | 'todo'
    | 'review'
    | 'completed'
    | string;

export type TaskPriority = 'all' | 'low' | 'medium' | 'high' | 'urgent';

export type TaskType =
    | 'feature'
    | 'improvement'
    | 'bug'
    | 'documentation'
    | 'research'
    | 'refactor'
    | 'core_task';

export interface TaskTypeOption {
    id: TaskType;
    label: string;
    icon: string;
    iconColor: string;
    badgeBg: string;
    badgeText: string;
}

export const TASK_TYPES_LIST: TaskTypeOption[] = [
    { id: 'feature', label: 'មុខងារ', icon: 'task-type-feature', iconColor: 'text-blue-500', badgeBg: 'bg-[#2563eb]', badgeText: 'text-white' },
    { id: 'improvement', label: 'ការកែលម្អ', icon: 'task-type-improvement', iconColor: 'text-emerald-500', badgeBg: 'bg-[#10b981]', badgeText: 'text-white' },
    { id: 'bug', label: 'កំហុស', icon: 'task-type-bug', iconColor: 'text-rose-500', badgeBg: 'bg-[#ef4444]', badgeText: 'text-white' },
    { id: 'documentation', label: 'ឯកសារ', icon: 'task-type-doc', iconColor: 'text-purple-500', badgeBg: 'bg-[#a855f7]', badgeText: 'text-white' },
    { id: 'research', label: 'ស្រាវជ្រាវ', icon: 'task-type-research', iconColor: 'text-orange-500', badgeBg: 'bg-[#f97316]', badgeText: 'text-white' },
    { id: 'refactor', label: 'ប្លង់កម្មវិធី', icon: 'task-type-refactor', iconColor: 'text-teal-500', badgeBg: 'bg-[#14b8a6]', badgeText: 'text-white' },
    { id: 'core_task', label: 'កិច្ចការចម្បង', icon: 'task-type-core', iconColor: 'text-amber-500', badgeBg: 'bg-[#f59e0b]', badgeText: 'text-white' },
];

export interface TaskMember {
    id: number;
    name: string;
    avatar?: string | null;
    role?: string;
    email?: string;
    colorClass?: string;
}

export interface TaskItem {
    id: number;
    code?: string;
    title: string;
    description: string;
    module?: string;
    task_type?: TaskType | string;
    status: TaskStatus;
    priority: TaskPriority;
    progress: number;
    comments_count?: number;
    attachments_count?: number;
    due_date: string | null;
    project_id: string;
    project_name: string;
    reporter?: TaskMember;
    assignee: TaskMember;
    assignees?: TaskMember[];
    created_at: string;
    updated_at: string;
}

export interface TaskAttachment {
    name: string;
    size: string;
    type?: string;
    url?: string;
    isImage?: boolean;
    textContent?: string;
    fileBlob?: File | Blob;
}

export interface TaskChatMessage {
    id: number;
    sender_id?: number;
    sender_name: string;
    sender_avatar?: string;
    text: string;
    time: string;
    is_self?: boolean;
    is_system?: boolean;
    attachments?: TaskAttachment[];
    created_at?: string;
}

export interface TaskListResponse {
    status_code: number;
    message: string;
    data: {
        results: TaskItem[];
        total: number;
        limit: number;
        offset: number;
        counts: {
            all: number;
            new: number;
            confirmed: number;
            unconfirmed: number;
            in_progress: number;
            in_review: number;
            reopened: number;
            done: number;
        };
    };
}
