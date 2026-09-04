// ===========================================================================>> Core Library
import { Injectable } from '@nestjs/common';

// ===========================================================================>> Custom Library
import { UserPayload } from 'src/app/interface/jwt.interface';
import { CheckInOutDto } from './attendance.dto';

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

    async getAttendance(user: UserPayload) {
        return {
            status_code: 200,
            message: 'Attendance data retrieved successfully',
            data: {
                ...this.checkInState,
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

    async recordCheckIn(user: UserPayload, dto: CheckInOutDto) {
        const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        this.checkInState = {
            checkedIn: true,
            checkInTime: time,
            checkOutTime: null,
            todayHours: '0.1h',
            location: dto.location || 'Phnom Penh Main Office',
        };

        return {
            status_code: 201,
            message: 'Checked in successfully',
            data: this.checkInState,
        };
    }

    async recordCheckOut(user: UserPayload, dto: CheckInOutDto) {
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
