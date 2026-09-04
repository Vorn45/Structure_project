// ===========================================================================>> Core Library
import { Injectable } from '@nestjs/common';

// ===========================================================================>> Custom Library
import { UserPayload } from 'src/app/interface/jwt.interface';
import { CreateMeetingDto } from './meeting.dto';

export interface ScheduledMeetingItem {
    id: string;
    title: string;
    type: string;
    date: string;
    time: string;
    duration: string;
    roomCode: string;
    roomUrl: string;
    organizer: string;
    status: string;
    participants: Array<{ name: string; avatar?: string | null; role?: string }>;
    agenda: string;
}

const INITIAL_MEETINGS: ScheduledMeetingItem[] = [
    {
        id: 'meet-01',
        title: 'ប្រជុំត្រួតពិនិត្យប្រចាំសប្តាហ៍ Sprint 36',
        type: 'wms',
        date: new Date().toISOString().split('T')[0],
        time: '០៩:០០ ព្រឹក',
        duration: '៤៥ នាទី',
        roomCode: 'WMS-8839',
        roomUrl: 'https://meet.wms.digital/room/WMS-8839',
        organizer: 'ចេង ច័ន្ទបញ្ញា',
        status: 'upcoming',
        participants: [
            { name: 'Cheng Chanpanha', avatar: '/images/placeholder/avatar.jpg', role: 'Host' },
            { name: 'Sokha Meng', avatar: null, role: 'Frontend Dev' },
            { name: 'Ratha Vuth', avatar: null, role: 'UI/UX' },
        ],
        agenda: 'ត្រួតពិនិត្យ Task សម្រេចបានក្នុងសប្តាហ៍នេះ និងរៀបចំបញ្ចេញកំណែប្រែថ្មី (Deployment Release)',
    },
    {
        id: 'meet-02',
        title: 'ពិភាក្សា Architecture RBAC & Passkey V2',
        type: 'google',
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        time: '០២:០០ រសៀល',
        duration: '៦០ នាទី',
        roomCode: 'meet.google.com/abc-defg-hij',
        roomUrl: 'https://meet.google.com/abc-defg-hij',
        organizer: 'ចេង ច័ន្ទបញ្ញា',
        status: 'upcoming',
        participants: [
            { name: 'Cheng Chanpanha', avatar: '/images/placeholder/avatar.jpg', role: 'Host' },
            { name: 'Lead Architect', avatar: null, role: 'Lead' },
        ],
        agenda: 'រៀបចំ Flow Passkey WebAuthn & Multi-Factor Authentication',
    },
];

@Injectable()
export class MeetingService {
    private meetings: ScheduledMeetingItem[] = [...INITIAL_MEETINGS];

    async getMeetings(user: UserPayload) {
        return {
            status_code: 200,
            message: 'Scheduled meetings retrieved successfully',
            data: this.meetings,
        };
    }

    async createMeeting(user: UserPayload, dto: CreateMeetingDto) {
        const newMeeting: ScheduledMeetingItem = {
            id: `meet-${Date.now().toString().slice(-4)}`,
            title: dto.title,
            type: dto.type || 'wms',
            date: dto.date,
            time: dto.time,
            duration: dto.duration || '៣០ នាទី',
            roomCode: `WMS-${Math.floor(1000 + Math.random() * 9000)}`,
            roomUrl: `https://meet.wms.digital/room/WMS-${Math.floor(1000 + Math.random() * 9000)}`,
            organizer: user?.name_en || user?.name_kh || 'User',
            status: 'upcoming',
            participants: dto.participants || [
                { name: user?.name_en || user?.name_kh || 'User', avatar: null, role: 'Organizer' },
            ],
            agenda: dto.agenda || '',
        };

        this.meetings.unshift(newMeeting);

        return {
            status_code: 201,
            message: 'Meeting scheduled successfully',
            data: newMeeting,
        };
    }
}
