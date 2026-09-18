export interface CreateMeetingDialogData {
    user?: any;
    startDirectCall?: boolean;
}

export interface ScheduledMeeting {
    id: string;
    title: string;
    type: 'wms' | 'google' | 'zoom';
    date: string;
    time: string;
    duration: string;
    roomCode: string;
    roomUrl: string;
    organizer: string;
    status: 'live' | 'upcoming' | 'completed';
    participants: { name: string; avatar?: string; role?: string }[];
    agenda?: string;
}
