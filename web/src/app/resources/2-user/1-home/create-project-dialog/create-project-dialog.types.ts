export interface CreateProjectDialogData {
    user?: any;
    members?: { id: number | string; name: string; role: string; avatar?: string }[];
    existingProjects?: { code?: string; id?: string }[];
    onProjectCreated?: () => void;
    project?: any;
    isEditing?: boolean;
}

export interface ProjectStatusOption {
    id: 'planning' | 'active' | 'on_hold' | 'completed';
    label: string;
    dotColor?: string;
    activeColor: string;
    activeBg: string;
    activeBorder: string;
}

export interface ProjectCategoryOption {
    id: string;
    label: string;
    icon: string;
    iconColor: string;
}

export interface TeamMember {
    id: string;
    name: string;
    role: string;
    avatar?: string;
}

export interface ProjectAttachment {
    name: string;
    size: string;
    type: string;
    url?: string;
    isImage?: boolean;
    textContent?: string;
    fileBlob?: File;
}

