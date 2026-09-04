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
