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

    private realtimeLogs: AttendanceRealtimeLog[] = [];

    private stats = {
        present_days: 0,
        late_days: 0,
        leave_days: 0,
        total_working_hours: 0,
        overtime_hours: 0,
        attendance_rate: 100,
    };

    async getAttendance(user?: UserPayload) {
        return {
            status_code: 200,
            message: 'Attendance data retrieved successfully',
            data: {
                ...this.checkInState,
                realtime_logs: this.realtimeLogs,
                stats: this.stats,
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

        this.stats.present_days = 23;
        this.stats.attendance_rate = 99.0;

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
                stats: this.stats,
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
