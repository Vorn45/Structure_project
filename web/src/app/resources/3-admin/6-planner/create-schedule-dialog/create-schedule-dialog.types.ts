export interface CreateScheduleDialogData {
    dayIndex?: number;
    category?: 'work' | 'myself' | 'breaks';
    time?: string;
    date?: string;
    startDate?: string;
    endDate?: string;
    schedule?: any;
    isEdit?: boolean;
}

export interface TeamMemberItem {
    id: string | number;
    name: string;
    role: string;
    initials: string;
    avatar?: string;
    bg: string;
}

