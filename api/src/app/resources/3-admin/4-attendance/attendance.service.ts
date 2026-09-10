// ===========================================================================>> Core Library
import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

// ===========================================================================>> Custom Library
import { UserPayload } from 'src/app/interface/jwt.interface';
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

const DEFAULT_LEAVES: AdminLeaveItem[] = [
    {
        id: 'lv-101',
        user_id: 3,
        user_name: 'រ័ត្ន វិចិត្រ',
        department: 'ហេដ្ឋារចនាសម្ព័ន្ធ (DevOps)',
        leave_type: 'annual',
        start_date: '2026-09-10',
        end_date: '2026-09-12',
        duration_days: 3,
        reason: 'សម្រាកលំហែកាយប្រចាំឆ្នាំជាមួយក្រុមគ្រួសារ',
        status: 'pending',
        applied_at: '2026-09-04T09:30:00.000Z',
    },
    {
        id: 'lv-102',
        user_id: 5,
        user_name: 'កែវ ធីតា',
        department: 'រចនា និងបទពិសោធន៍ (UI/UX)',
        leave_type: 'sick',
        start_date: '2026-09-01',
        end_date: '2026-09-02',
        duration_days: 2,
        reason: 'ឈឺក្បាល ផ្ដាសាយ និងគ្រុនក្តៅ',
        status: 'approved',
        applied_at: '2026-08-31T14:00:00.000Z',
        reviewer_comment: 'អនុញ្ញាត សូមសម្រាកព្យាបាលឱ្យឆាប់ជាសះស្បើយ',
    },
];

@Injectable()
export class AdminAttendanceService {
    private leaves: AdminLeaveItem[] = [...DEFAULT_LEAVES];
    private readonly storeFilePath = path.join(process.cwd(), 'storage', 'admin_leaves_store.json');

    constructor() {
        this.loadFromDisk();
    }

    private loadFromDisk(): void {
        try {
            if (fs.existsSync(this.storeFilePath)) {
                const raw = fs.readFileSync(this.storeFilePath, 'utf8');
                const data = JSON.parse(raw);
                if (data && Array.isArray(data)) this.leaves = data;
            }
        } catch (e) {
            console.warn('Failed to load leaves from disk:', e);
        }
    }

    private saveToDisk(): void {
        try {
            const dir = path.dirname(this.storeFilePath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(this.storeFilePath, JSON.stringify(this.leaves, null, 2), 'utf8');
        } catch (e) {
            console.warn('Failed to save leaves to disk:', e);
        }
    }

    async getOverview(user: UserPayload) {
        return {
            status_code: 200,
            data: {
                total_staff: 6,
                present_today: 5,
                late_today: 1,
                on_leave: 1,
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
        return {
            status_code: 200,
            data: this.leaves,
        };
    }

    async actionLeave(user: UserPayload, id: string, dto: ActionLeaveDto) {
        const item = this.leaves.find((l) => l.id === id);
        if (!item) throw new NotFoundException(`Leave request "${id}" not found`);

        item.status = dto.status;
        if (dto.comment) item.reviewer_comment = dto.comment;
        this.saveToDisk();

        return {
            status_code: 200,
            message: `Leave request ${dto.status} successfully`,
            data: item,
        };
    }
}
