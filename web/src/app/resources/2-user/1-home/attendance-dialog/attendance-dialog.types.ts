export interface AttendanceDialogData {
    user?: any;
}

export interface AttendanceHistoryRow {
    date: string;
    check_in: string;
    check_out: string;
    hours: string;
    status: string;
    is_late?: boolean;
    is_today?: boolean;
}

