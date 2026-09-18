export interface CreateTaskDialogData {
    projectId?: string;
    projectCode?: string;
    projectName?: string;
    projects?: Array<{ id: string; name: string; code?: string; logo?: string; image?: string }>;
    user?: any;
    members?: { id: number | string; name: string; role: string; avatar?: string }[];
    existingTasks?: { code?: string; project_id?: string }[];
    defaultStatus?: string;
    onTaskCreated?: () => void;
}

export interface WorkStatus {
    id: string;
    label: string;
    icon?: string;
    dotColor?: string;
    activeColor: string;
    activeBg: string;
    activeBorder: string;
}

export interface TeamMember {
    id: string;
    name: string;
    role: string;
    avatar?: string;
}

