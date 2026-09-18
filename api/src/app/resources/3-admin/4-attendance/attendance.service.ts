// ===========================================================================>> Core Library
import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// ===========================================================================>> Custom Library
import { UserPayload } from 'src/app/interface/jwt.interface';
import { User } from 'src/app/model/user/users.entity';
import { LeaveRequest } from 'src/app/model/organization/leave-request.entity';
import { ActionLeaveDto } from './attendance.dto';

export interface AdminLeaveItem {
    id: string;
    user_id: number;
    user_name: string;
    department: string;
    leave_type: 'annual' | 'sick' | 'special' | 'maternity';
    start_date: string;
    end_date: string;
    duration_days: number;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    applied_at: string;
    reviewer_comment?: string;
}

const DEFAULT_LEAVES = [
    {
        user_id: 3,
        user_name: 'រ័ត្ន វិចិត្រ',
        department: 'ហេដ្ឋារចនាសម្ព័ន្ធ (DevOps)',
        leave_type: 'annual' as const,
        start_date: '2026-09-10',
        end_date: '2026-09-12',
        duration_days: 3,
        reason: 'សម្រាកលំហែកាយប្រចាំឆ្នាំជាមួយក្រុមគ្រួសារ',
        status: 'pending' as const,
    },
    {
        user_id: 5,
        user_name: 'កែវ ធីតា',
        department: 'រចនា និងបទពិសោធន៍ (UI/UX)',
        leave_type: 'sick' as const,
        start_date: '2026-09-01',
        end_date: '2026-09-02',
        duration_days: 2,
        reason: 'ឈឺក្បាល ផ្ដាសាយ និងគ្រុនក្តៅ',
        status: 'approved' as const,
        reviewer_comment: 'អនុញ្ញាត សូមសម្រាកព្យាបាលឱ្យឆាប់ជាសះស្បើយ',
    },
];

@Injectable()
export class AdminAttendanceService implements OnModuleInit {
    constructor(
        @InjectRepository(LeaveRequest)
        private readonly _leaveRepo: Repository<LeaveRequest>,
        @InjectRepository(User)
        private readonly _userRepo: Repository<User>,
    ) {}

    async onModuleInit() {
        try {
            const count = await this._leaveRepo.count();
            if (count === 0) {
                for (const item of DEFAULT_LEAVES) {
                    await this._leaveRepo.save(this._leaveRepo.create(item));
                }
            }
        } catch (e) {
            console.warn('[AdminAttendanceService] initial leaves seed warning:', e);
        }
    }

    async getRawLeaves(): Promise<LeaveRequest[]> {
        return this._leaveRepo.find({ order: { created_at: 'DESC' } });
    }

    async getOverview(user: UserPayload) {
        let totalStaff = 6;
        try {
            totalStaff = await this._userRepo.count({ where: { is_active: 1 } }) || 6;
        } catch {
            totalStaff = 6;
        }

        const pendingLeaves = await this._leaveRepo.count({ where: { status: 'pending' } }).catch(() => 1);

        return {
            status_code: 200,
            data: {
                total_staff: totalStaff,
                present_today: Math.max(1, totalStaff - pendingLeaves),
                late_today: 1,
                on_leave: pendingLeaves,
                logs: [
                    { id: 'att-1', user_name: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត', user_en: 'Piseth Panhavorn', department: 'ព័ត៌មានវិទ្យា (IT)', check_in: '07:55 AM', check_out: '05:30 PM', status: 'on_time' },
                    { id: 'att-2', user_name: 'ពុំ ប្រុសមុន្នី', user_en: 'Pum Brusmuny', department: 'គ្រប់គ្រងគម្រោង (PMO)', check_in: '07:58 AM', check_out: null, status: 'on_time' },
                    { id: 'att-3', user_name: 'ថា វីនណឺរ', user_en: 'Tha Winner', department: 'ព័ត៌មានវិទ្យា (IT)', check_in: '08:02 AM', check_out: null, status: 'on_time' },
                    { id: 'att-4', user_name: 'ភួង សុវណ្ណារ៉ា', user_en: 'Phuong Sovannara', department: 'ហេដ្ឋារចនាសម្ព័ន្ធ (DevOps)', check_in: '08:45 AM', check_out: null, status: 'late' },
                    { id: 'att-5', user_name: 'លី ម៉េងហួរ', user_en: 'Ly Menghour', department: 'ព័ត៌មានវិទ្យា (IT)', check_in: '07:50 AM', check_out: null, status: 'on_time' },
                ],
            },
        };
    }

    async getLeaves(user: UserPayload) {
        const list = await this._leaveRepo.find({
            order: { created_at: 'DESC' },
        });

        const formatted = list.map((l) => ({
            id: l.id,
            user_id: l.user_id,
            user_name: l.user_name,
            department: l.department,
            leave_type: l.leave_type,
            start_date: l.start_date,
            end_date: l.end_date,
            duration_days: l.duration_days,
            reason: l.reason,
            status: l.status,
            applied_at: l.created_at.toISOString(),
            reviewer_comment: l.reviewer_comment,
        }));

        return {
            status_code: 200,
            data: formatted,
        };
    }

    async actionLeave(user: UserPayload, id: string, dto: ActionLeaveDto) {
        const item = await this._leaveRepo.findOne({ where: { id } });
        if (!item) throw new NotFoundException(`Leave request "${id}" not found`);

        item.status = dto.status;
        if (dto.comment) item.reviewer_comment = dto.comment;
        item.reviewer_id = user?.id;

        const updated = await this._leaveRepo.save(item);

        return {
            status_code: 200,
            message: `Leave request ${dto.status} successfully`,
            data: updated,
        };
    }
}

