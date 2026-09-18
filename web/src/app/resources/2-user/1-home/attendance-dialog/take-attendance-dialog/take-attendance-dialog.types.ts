export interface TakeAttendanceDialogData {
    project?: string;
    department?: string;
    shift?: string;
    work_hours?: string;
    location?: string;
    subject?: string;
    batch?: string;
    semester?: string;
    slot?: string;
    user?: any;
}

export interface AttendanceLogItem {
    id: string;
    name: string;
    time: string;
    location: string;
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    device?: string;
    status: 'on_time' | 'late';
    avatar?: string | null;
}

