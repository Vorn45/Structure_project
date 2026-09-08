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
    dotBg?: string;
}

export const TASK_TYPES_LIST: TaskTypeOption[] = [
    { id: 'feature', label: 'មុខងារ', icon: 'mdi:star-four-points', iconColor: 'text-blue-500', badgeBg: 'bg-blue-50 dark:bg-blue-950/50', badgeText: 'text-blue-600 dark:text-blue-400', dotBg: 'bg-blue-500' },
    { id: 'improvement', label: 'ការកែលម្អ', icon: 'mdi:trending-up', iconColor: 'text-emerald-500', badgeBg: 'bg-emerald-50 dark:bg-emerald-950/50', badgeText: 'text-emerald-600 dark:text-emerald-400', dotBg: 'bg-emerald-500' },
    { id: 'bug', label: 'កំហុស', icon: 'mdi:bug-outline', iconColor: 'text-rose-500', badgeBg: 'bg-rose-50 dark:bg-rose-950/50', badgeText: 'text-rose-600 dark:text-rose-400', dotBg: 'bg-rose-500' },
    { id: 'documentation', label: 'ឯកសារ', icon: 'mdi:file-document-outline', iconColor: 'text-purple-500', badgeBg: 'bg-purple-50 dark:bg-purple-950/50', badgeText: 'text-purple-600 dark:text-purple-400', dotBg: 'bg-purple-500' },
    { id: 'research', label: 'ស្រាវជ្រាវ', icon: 'mdi:compass-outline', iconColor: 'text-orange-500', badgeBg: 'bg-orange-50 dark:bg-orange-950/50', badgeText: 'text-orange-600 dark:text-orange-400', dotBg: 'bg-orange-500' },
    { id: 'refactor', label: 'ប្លង់កម្មវិធី', icon: 'mdi:palette-outline', iconColor: 'text-teal-500', badgeBg: 'bg-teal-50 dark:bg-teal-950/50', badgeText: 'text-teal-600 dark:text-teal-400', dotBg: 'bg-teal-500' },
    { id: 'core_task', label: 'កិច្ចការចម្បង', icon: 'mdi:bullseye-arrow', iconColor: 'text-amber-500', badgeBg: 'bg-amber-50 dark:bg-amber-950/50', badgeText: 'text-amber-600 dark:text-amber-400', dotBg: 'bg-amber-500' },
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
