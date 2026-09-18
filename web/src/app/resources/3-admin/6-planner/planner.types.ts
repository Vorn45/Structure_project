export interface PlannerScheduleEvent {
    id: string;
    title: string;
    time: string;
    date?: string;
    startDate?: string;
    endDate?: string;
    dayIndex: number; // 0: Mon, 1: Tue, 2: Wed, 3: Thu, 4: Fri, 5: Sat, 6: Sun
    startDayIndex?: number;
    endDayIndex?: number;
    startTime?: string;
    endTime?: string;
    topPosition: number; // percentage or px
    height: number;
    category: 'work' | 'myself' | 'breaks' | 'meeting' | string;
    type: 'meeting' | 'review' | 'online' | 'recess' | 'coffee' | 'other' | string;
    colorTheme: 'peach' | 'lavender' | 'pink' | 'mint';
    members: Array<{ name: string; avatar?: string; initials: string; bg: string }>;
    extraCount: number;
    note?: string;
    planName?: string;
}

export interface DayColumn {
    nameKh: string;
    nameEn: string;
    dateNum: number;
    subTime: string;
    fullDate: Date;
    isCurrent: boolean;
}

