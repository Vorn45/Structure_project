// ===========================================================================>> Core Library
import { Injectable } from '@nestjs/common';

// ===========================================================================>> Custom Library
import { UserPayload } from 'src/app/interface/jwt.interface';
import { CheckInOutDto } from './attendance.dto';

export interface AttendanceRealtimeLog {
    id: string;
    name: string;
    time: string;
    location: string;
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    device?: string;
    status: 'on_time' | 'late';
}

@Injectable()
export class AttendanceService {
    private checkInState: {
        checkedIn: boolean;
        checkInTime: string | null;
        checkOutTime: string | null;
        todayHours: string;
        location?: string;
    } = {
        checkedIn: false,
        checkInTime: null,
        checkOutTime: null,
        todayHours: '0.0h',
    };

    private realtimeLogs: AttendanceRealtimeLog[] = [
        {
            id: '1',
            name: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត',
            time: '07:55 AM',
            location: '11.5564° N, 104.9282° E (Phnom Penh HQ)',
            latitude: 11.5564,
            longitude: 104.9282,
            accuracy: 8,
            device: 'iPhone 15 Pro',
            status: 'on_time',
        },
        {
            id: '2',
            name: 'ពុំ ប្រុសមុន្នី',
            time: '07:58 AM',
            location: '11.5568° N, 104.9285° E (Phnom Penh HQ)',
            latitude: 11.5568,
            longitude: 104.9285,
            accuracy: 12,
            device: 'Samsung Galaxy S24',
            status: 'on_time',
        },
        {
            id: '3',
            name: 'ថា វីនណឺរ',
            time: '08:02 AM',
            location: '11.5570° N, 104.9290° E (Phnom Penh HQ)',
            latitude: 11.5570,
            longitude: 104.9290,
            accuracy: 15,
            device: 'Xiaomi 14',
            status: 'on_time',
        },
    ];

    async getAttendance(user?: UserPayload) {
        return {
            status_code: 200,
            message: 'Attendance data retrieved successfully',
            data: {
                ...this.checkInState,
                realtime_logs: this.realtimeLogs,
                stats: {
                    present_days: 22,
                    late_days: 1,
                    leave_days: 0,
                    total_working_hours: 176,
                    overtime_hours: 8.5,
                    attendance_rate: 98.5,
                },
                weekly_log: [
                    { day: 'ចន្ទ (Mon)', check_in: '07:58 AM', check_out: '05:05 PM', status: 'present', hours: '8.1h' },
                    { day: 'អង្គារ (Tue)', check_in: '08:02 AM', check_out: '05:15 PM', status: 'present', hours: '8.2h' },
                    { day: 'ពុធ (Wed)', check_in: '07:55 AM', check_out: '05:00 PM', status: 'present', hours: '8.0h' },
                    { day: 'ព្រហ (Thu)', check_in: '08:10 AM', check_out: '05:30 PM', status: 'late', hours: '8.3h' },
                    { day: 'សុក្រ (Fri)', check_in: '07:50 AM', check_out: '05:02 PM', status: 'present', hours: '8.2h' },
                ],
            },
        };
    }

    async recordCheckIn(user: UserPayload | undefined, dto: CheckInOutDto) {
        const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        
        let locString = dto.location;
        if (!locString && dto.latitude && dto.longitude) {
            locString = `${dto.latitude.toFixed(4)}° N, ${dto.longitude.toFixed(4)}° E (Phnom Penh HQ)`;
        }
        if (!locString) {
            locString = '11.5564° N, 104.9282° E (Phnom Penh HQ)';
        }

        const name = dto.attendee_name || (user as any)?.name_kh || (user as any)?.name_en || (user as any)?.username || 'អ្នកប្រើប្រាស់ទូរស័ព្ទ (Mobile User)';

        this.checkInState = {
            checkedIn: true,
            checkInTime: time,
            checkOutTime: null,
            todayHours: '0.1h',
            location: locString,
        };

        const newLog: AttendanceRealtimeLog = {
            id: String(Date.now()),
            name,
            time,
            location: locString,
            latitude: dto.latitude,
            longitude: dto.longitude,
            accuracy: dto.accuracy,
            device: dto.device || 'Phone Scanner',
            status: 'on_time',
        };

        this.realtimeLogs.unshift(newLog);

        return {
            status_code: 201,
            message: 'Checked in successfully with phone GPS tracking',
            data: {
                ...this.checkInState,
                log: newLog,
                realtime_logs: this.realtimeLogs,
            },
        };
    }

    async recordCheckOut(user: UserPayload | undefined, dto: CheckInOutDto) {
        const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        this.checkInState = {
            ...this.checkInState,
            checkedIn: false,
            checkOutTime: time,
            todayHours: '8.0h',
        };

        return {
            status_code: 200,
            message: 'Checked out successfully',
            data: this.checkInState,
        };
    }
}
