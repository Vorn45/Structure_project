import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

import { UserPayload } from 'src/app/interface/jwt.interface';
import { isAdminOrSuperAdmin } from 'src/app/common/utils/access.util';
import { PlannerStore } from 'src/app/model/user/planner-store.entity';
import { User } from 'src/app/model/user/users.entity';

import { CreateScheduleDto, QueryPlannerDto, UpdateScheduleDto } from './planner.dto';

function getRelativeWeekDate(dayOffset: number): string {
    const d = new Date();
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Monday of current week
    const target = new Date(d);
    target.setDate(d.getDate() + diff + dayOffset);
    return target.toISOString().split('T')[0];
}

export interface PlannerScheduleItem {
    id: string;
    title: string;
    time: string;
    date?: string;
    start_date?: string;
    end_date?: string;
    day_index: number;
    start_day_index?: number;
    end_day_index?: number;
    start_time?: string;
    end_time?: string;
    category: 'work' | 'myself' | 'breaks' | string;
    type: string;
    color_theme: 'peach' | 'lavender' | 'pink' | 'mint' | string;
    top_position: number;
    height: number;
    members: Array<{
        id?: string | number;
        name: string;
        role?: string;
        initials: string;
        avatar?: string | null;
        bg: string;
    }>;
    extra_count: number;
    note?: string;
    plan_id?: string;
    plan_name?: string;
    created_by?: number | string;
    created_by_name?: string;
    created_at: string;
    updated_at: string;
}

const DEFAULT_SCHEDULES: PlannerScheduleItem[] = [
    {
        id: 'sch_1',
        title: 'កែប្រែប្រព័ន្ធ Web & ពិនិត្យ UI',
        time: '09:00 ព្រឹក - 11:30 ព្រឹក',
        date: getRelativeWeekDate(0),
        start_date: getRelativeWeekDate(0),
        end_date: getRelativeWeekDate(0),
        day_index: 0,
        start_day_index: 0,
        end_day_index: 0,
        start_time: '09:00 ព្រឹក',
        end_time: '11:30 ព្រឹក',
        category: 'work',
        type: 'កិច្ចប្រជុំទូទៅ',
        color_theme: 'peach',
        top_position: 80,
        height: 120,
        members: [
            { id: 1, name: 'ចេង ច័ន្ទបញ្ញា (Panha)', role: 'Frontend Lead', initials: 'CP', bg: 'bg-slate-700 text-white' },
            { id: 2, name: 'សុខ សុភា (Sopheak)', role: 'Project Lead', initials: 'SP', bg: 'bg-teal-700 text-white' },
            { id: 3, name: 'រ័ត្ន វិចិត្រ (Vichet)', role: 'DevOps', initials: 'VC', bg: 'bg-indigo-700 text-white' },
        ],
        extra_count: 1,
        note: 'ពិនិត្យផ្ទាំង Dashboard និង Planner ថ្មីសម្រាប់ដាក់ឱ្យប្រើប្រាស់',
        plan_id: '4',
        plan_name: 'BMS Digitech',
        created_by: 1,
        created_by_name: 'ចេង ច័ន្ទបញ្ញា',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'sch_2',
        title: 'ត្រួតពិនិត្យគម្រោង PMS & WMS',
        time: '01:30 រសៀល - 03:30 រសៀល',
        date: getRelativeWeekDate(1),
        start_date: getRelativeWeekDate(1),
        end_date: getRelativeWeekDate(1),
        day_index: 1,
        start_day_index: 1,
        end_day_index: 1,
        start_time: '01:30 រសៀល',
        end_time: '03:30 រសៀល',
        category: 'work',
        type: 'ត្រួតពិនិត្យគម្រោង',
        color_theme: 'lavender',
        top_position: 130,
        height: 110,
        members: [
            { id: 2, name: 'សុខ សុភា (Sopheak)', role: 'Project Lead', initials: 'SP', bg: 'bg-purple-700 text-white' },
            { id: 4, name: 'លី ម៉េងហួរ (Menghour)', role: 'Backend Lead', initials: 'MH', bg: 'bg-slate-700 text-white' },
        ],
        extra_count: 0,
        note: 'ត្រួតពិនិត្យលទ្ធផលការងារសប្តាហ៍មុន និងរៀបចំកាលវិភាគ Sprint ថ្មី',
        plan_id: '2',
        plan_name: 'ប្រព័ន្ធគ្រប់គ្រងវត្តមាន និងបុគ្គលិក (WMS)',
        created_by: 2,
        created_by_name: 'សុខ សុភា',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'sch_3',
        title: 'ប្រជុំអនឡាញក្រុមការងារបច្ចេកវិទ្យា',
        time: '10:00 ព្រឹក - 11:30 ព្រឹក',
        date: getRelativeWeekDate(2),
        start_date: getRelativeWeekDate(2),
        end_date: getRelativeWeekDate(2),
        day_index: 2,
        start_day_index: 2,
        end_day_index: 2,
        start_time: '10:00 ព្រឹក',
        end_time: '11:30 ព្រឹក',
        category: 'work',
        type: 'ប្រជុំអនឡាញ',
        color_theme: 'peach',
        top_position: 90,
        height: 115,
        members: [
            { id: 1, name: 'ចេង ច័ន្ទបញ្ញា (Panha)', role: 'Frontend Lead', initials: 'CP', bg: 'bg-indigo-700 text-white' },
            { id: 5, name: 'គង់ ចរិយា (Chariya)', role: 'QA Lead', initials: 'CY', bg: 'bg-amber-600 text-white' },
            { id: 6, name: 'ហេង ពិសាល (Piseth)', role: 'Mobile Dev', initials: 'PS', bg: 'bg-emerald-600 text-white' },
        ],
        extra_count: 1,
        note: 'តភ្ជាប់ប្រព័ន្ធ Real-time Notification និង Telegram Bot Service',
        created_by: 1,
        created_by_name: 'ចេង ច័ន្ទបញ្ញា',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'sch_4',
        title: 'ពិភាក្សាស្ថាបត្យកម្មប្រព័ន្ធ & Database',
        time: '02:00 រសៀល - 04:30 រសៀល',
        date: getRelativeWeekDate(3),
        start_date: getRelativeWeekDate(3),
        end_date: getRelativeWeekDate(3),
        day_index: 3,
        start_day_index: 3,
        end_day_index: 3,
        start_time: '02:00 រសៀល',
        end_time: '04:30 រសៀល',
        category: 'work',
        type: 'ពិភាក្សាការងារ',
        color_theme: 'mint',
        top_position: 140,
        height: 125,
        members: [
            { id: 3, name: 'រ័ត្ន វិចិត្រ (Vichet)', role: 'DevOps', initials: 'VC', bg: 'bg-emerald-700 text-white' },
            { id: 4, name: 'លី ម៉េងហួរ (Menghour)', role: 'Backend Lead', initials: 'MH', bg: 'bg-slate-800 text-white' },
        ],
        extra_count: 0,
        note: 'រៀបចំ Read Replicas និង Optimization លើ Postgres Tables',
        created_by: 3,
        created_by_name: 'រ័ត្ន វិចិត្រ',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'sch_5',
        title: 'សម្រាកខ្លី និងជួបញ៉ាំកាហ្វេ',
        time: '03:30 រសៀល - 04:00 រសៀល',
        date: getRelativeWeekDate(4),
        start_date: getRelativeWeekDate(4),
        end_date: getRelativeWeekDate(4),
        day_index: 4,
        start_day_index: 4,
        end_day_index: 4,
        start_time: '03:30 រសៀល',
        end_time: '04:00 រសៀល',
        category: 'breaks',
        type: 'សម្រាកខ្លី',
        color_theme: 'pink',
        top_position: 210,
        height: 90,
        members: [
            { id: 1, name: 'ចេង ច័ន្ទបញ្ញា', role: 'Frontend Lead', initials: 'CP', bg: 'bg-rose-600 text-white' },
        ],
        extra_count: 0,
        note: 'សម្រាកយកថាមពលជាមួយកាហ្វេ',
        created_by: 1,
        created_by_name: 'ចេង ច័ន្ទបញ្ញា',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'sch_6',
        title: 'រៀបចំផែនការ & សង្ខេបលទ្ធផលសប្តាហ៍',
        time: '09:30 ព្រឹក - 11:30 ព្រឹក',
        date: getRelativeWeekDate(5),
        start_date: getRelativeWeekDate(5),
        end_date: getRelativeWeekDate(5),
        day_index: 5,
        start_day_index: 5,
        end_day_index: 5,
        start_time: '09:30 ព្រឹក',
        end_time: '11:30 ព្រឹក',
        category: 'myself',
        type: 'ផ្ទាល់ខ្លួន',
        color_theme: 'peach',
        top_position: 90,
        height: 100,
        members: [
            { id: 1, name: 'ចេង ច័ន្ទបញ្ញា', role: 'Frontend Lead', initials: 'CP', bg: 'bg-amber-700 text-white' },
        ],
        extra_count: 0,
        note: 'សង្ខេបការងារសម្រេចបានក្នុងសប្តាហ៍ និងរៀបចំកិច្ចការអាទិភាពបន្ទាប់',
        created_by: 1,
        created_by_name: 'ចេង ច័ន្ទបញ្ញា',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
];

@Injectable()
export class PlannerService {
    private readonly _storageFile = path.resolve(process.cwd(), 'storage', 'data', 'planner_schedules.json');

    constructor(
        @InjectRepository(PlannerStore)
        private readonly _storeRepo: Repository<PlannerStore>,
        @InjectRepository(User)
        private readonly _userRepo: Repository<User>,
    ) {}

    // =========================================================================
    // STORE HELPERS
    // =========================================================================
    private async _readSchedules(): Promise<PlannerScheduleItem[]> {
        let schedules: PlannerScheduleItem[] = [];
        let hasStore = false;

        try {
            const dbStore = await this._storeRepo.findOne({
                where: { key: 'default_planner_store' },
            });
            if (dbStore && Array.isArray(dbStore.schedules)) {
                schedules = dbStore.schedules;
                hasStore = true;
            }
        } catch (e) {
            // Fallback to disk storage
        }

        if (!hasStore && fs.existsSync(this._storageFile)) {
            try {
                const data = fs.readFileSync(this._storageFile, 'utf8');
                schedules = JSON.parse(data);
                hasStore = true;
            } catch (err) {}
        }

        // Backward compatibility fallback to scratch file if present
        const legacyFile = path.resolve(process.cwd(), 'scratch_planner_store.json');
        if (!hasStore && fs.existsSync(legacyFile)) {
            try {
                const data = fs.readFileSync(legacyFile, 'utf8');
                schedules = JSON.parse(data);
                hasStore = true;
            } catch (err) {}
        }

        // Only initialize defaults on fresh first-ever run
        if (!hasStore) {
            schedules = DEFAULT_SCHEDULES;
            await this._writeSchedules(schedules);
        }

        return schedules;
    }

    private async _writeSchedules(schedules: PlannerScheduleItem[]): Promise<void> {
        try {
            let dbStore = await this._storeRepo.findOne({
                where: { key: 'default_planner_store' },
            });
            if (!dbStore) {
                dbStore = this._storeRepo.create({
                    key: 'default_planner_store',
                    schedules,
                });
            } else {
                dbStore.schedules = schedules;
            }
            await this._storeRepo.save(dbStore);
        } catch (e) {}

        try {
            const dir = path.dirname(this._storageFile);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(this._storageFile, JSON.stringify(schedules, null, 2), 'utf8');
        } catch (err) {}
    }

    // =========================================================================
    // 1. GET SCHEDULES (CONNECTS ADMIN AND USERS ON WORK PLANS)
    // =========================================================================
    async getSchedules(user: UserPayload, query: QueryPlannerDto) {
        const allSchedules = await this._readSchedules();
        const isAdmin = Boolean(user && isAdminOrSuperAdmin(user));


        const currentUserId = user?.id;
        const nameKh = user?.name_kh?.trim()?.toLowerCase() || '';
        const nameEn = user?.name_en?.trim()?.toLowerCase() || '';
        const generalName = ((user as any)?.name || '')?.trim()?.toLowerCase();

        // Check members array (Strict check: only members selected by admin/creator can see this work plan)
        const isUserAssignedOrCreator = (sch: PlannerScheduleItem): boolean => {
            // Check creator
            if (sch.created_by && currentUserId && String(sch.created_by) === String(currentUserId)) {
                return true;
            }
            if (sch.created_by_name) {
                const cName = sch.created_by_name.toLowerCase();
                if (nameKh && (cName.includes(nameKh) || nameKh.includes(cName))) return true;
                if (nameEn && (cName.includes(nameEn) || nameEn.includes(cName))) return true;
                if (generalName && (cName.includes(generalName) || generalName.includes(cName))) return true;
            }

            // Check members array (Strict: only user accounts selected by admin/organizer see this work plan)
            if (Array.isArray(sch.members) && sch.members.length > 0) {
                return sch.members.some((m) => {
                    if (m.id !== undefined && currentUserId !== undefined && String(m.id) === String(currentUserId)) {
                        return true;
                    }
                    if (m.name) {
                        const mName = m.name.toLowerCase();
                        if (nameKh && (mName.includes(nameKh) || nameKh.includes(mName))) return true;
                        if (nameEn && (mName.includes(nameEn) || nameEn.includes(mName))) return true;
                        if (generalName && (mName.includes(generalName) || generalName.includes(mName))) return true;
                    }
                    return false;
                });
            }

            return false;
        };

        // Strict filtering:
        // - Admin sees ALL Work, Personal & Break plans across the entire organization.
        // - Regular Users see Work plans where they are explicitly assigned/selected or creator, plus own personal/breaks.
        let visibleSchedules = allSchedules.filter((sch) => {
            if (isAdmin) {
                return true;
            }

            if (sch.category === 'work') {
                return isUserAssignedOrCreator(sch);
            }

            // For personal ('myself') or breaks: only the creator sees it
            return (sch.created_by && currentUserId && String(sch.created_by) === String(currentUserId)) ||
                   (sch.created_by_name && nameKh && sch.created_by_name.toLowerCase().includes(nameKh)) ||
                   (sch.created_by_name && nameEn && sch.created_by_name.toLowerCase().includes(nameEn));
        });

        // Category filter
        let filtered = visibleSchedules;
        if (query.category && query.category !== 'all') {
            filtered = filtered.filter((s) => s.category === query.category);
        }

        // Search filter
        if (query.search) {
            const s = query.search.toLowerCase();
            filtered = filtered.filter(
                (item) =>
                    item.title.toLowerCase().includes(s) ||
                    item.type?.toLowerCase().includes(s) ||
                    item.plan_name?.toLowerCase().includes(s) ||
                    item.members?.some((m) => m.name.toLowerCase().includes(s))
            );
        }

        const counts = {
            all: visibleSchedules.length,
            work: visibleSchedules.filter((s) => s.category === 'work').length,
            myself: visibleSchedules.filter((s) => s.category === 'myself').length,
            breaks: visibleSchedules.filter((s) => s.category === 'breaks').length,
        };

        return {
            status_code: 200,
            message: 'ទាញយកទិន្នន័យកាលវិភាគបានជោគជ័យ',
            data: {
                results: filtered,
                total: filtered.length,
                counts,
            },
        };
    }

    // =========================================================================
    // 2. GET SCHEDULE BY ID
    // =========================================================================
    async getScheduleById(user: UserPayload, id: string) {
        const all = await this._readSchedules();
        const schedule = all.find((s) => s.id === id);
        if (!schedule) {
            throw new NotFoundException(`រកមិនឃើញកាលវិភាគសម្គាល់ ${id}`);
        }
        return {
            status_code: 200,
            message: 'ទាញយកកាលវិភាគបានជោគជ័យ',
            data: schedule,
        };
    }

    // =========================================================================
    // 3. CREATE SCHEDULE (ADMIN & USER WORK PLANS)
    // =========================================================================
    async createSchedule(user: UserPayload, dto: CreateScheduleDto) {
        const all = await this._readSchedules();

        const colorThemeMap: Record<string, string> = {
            work: 'peach',
            myself: 'lavender',
            breaks: 'pink',
        };

        const dayIndex = dto.day_index !== undefined ? dto.day_index : (dto.start_day_index !== undefined ? dto.start_day_index : 2);
        const startTime = dto.start_time || dto.time || '09:00 ព្រឹក';
        const endTime = dto.end_time || '';
        const timeDisplay = dto.category === 'work' && endTime ? `${startTime} - ${endTime}` : startTime;
        const currentUserName = user?.name_kh || user?.name_en || (user as any)?.name || 'ចេង ច័ន្ទបញ្ញា';

        const membersList = Array.isArray(dto.members) && dto.members.length > 0
            ? dto.members.map((m) => ({
                id: m.id || 'm_' + Date.now(),
                name: m.name,
                role: m.role || 'សមាជិកក្រុមការងារ',
                initials: m.initials || m.name.slice(0, 2).toUpperCase(),
                avatar: m.avatar || null,
                bg: m.bg || 'bg-blue-700 text-white',
            }))
            : [
                {
                    id: user?.id || 1,
                    name: currentUserName,
                    role: 'អ្នករៀបចំ (Organizer)',
                    initials: currentUserName.slice(0, 2).toUpperCase(),
                    avatar: null,
                    bg: 'bg-blue-700 text-white',
                },
            ];

        const targetDate = (dto as any).date || (dto as any).start_date || new Date().toISOString().split('T')[0];
        const startDate = (dto as any).start_date || targetDate;
        const endDate = (dto as any).end_date || startDate;

        const newSchedule: PlannerScheduleItem = {
            id: 'sch_' + Date.now(),
            title: dto.title.trim(),
            time: timeDisplay,
            date: targetDate,
            start_date: startDate,
            end_date: endDate,
            day_index: Number(dayIndex),
            start_day_index: dto.start_day_index !== undefined ? Number(dto.start_day_index) : Number(dayIndex),
            end_day_index: dto.end_day_index !== undefined ? Number(dto.end_day_index) : Number(dayIndex),
            start_time: startTime,
            end_time: endTime,
            category: dto.category || 'work',
            type: dto.type || (dto.category === 'work' ? 'កិច្ចប្រជុំទូទៅ' : 'ផ្ទាល់ខ្លួន'),
            color_theme: dto.color_theme || colorThemeMap[dto.category] || 'peach',
            top_position: dto.top_position || 100 + Math.floor(Math.random() * 80),
            height: dto.height || 105,
            members: membersList,
            extra_count: Math.max(0, membersList.length - 2),
            note: dto.note || '',
            plan_id: dto.plan_id,
            plan_name: dto.plan_name,
            created_by: user?.id || 1,
            created_by_name: currentUserName,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        all.unshift(newSchedule);
        await this._writeSchedules(all);

        return {
            status_code: 201,
            message: 'បង្កើតកាលវិភាគថ្មីបានជោគជ័យ',
            data: newSchedule,
        };
    }

    // =========================================================================
    // 4. UPDATE SCHEDULE
    // =========================================================================
    async updateSchedule(user: UserPayload, id: string, dto: UpdateScheduleDto) {
        const all = await this._readSchedules();
        const index = all.findIndex((s) => s.id === id);
        if (index === -1) {
            throw new NotFoundException(`រកមិនឃើញកាលវិភាគសម្គាល់ ${id}`);
        }

        const current = all[index];
        const targetDate = (dto as any).date || (dto as any).start_date || current.date;
        const startDate = (dto as any).start_date || targetDate || current.start_date;
        const endDate = (dto as any).end_date || startDate || current.end_date;

        const colorThemeMap: Record<string, string> = {
            work: 'peach',
            myself: 'lavender',
            breaks: 'pink',
        };

        const targetCat = dto.category !== undefined ? dto.category : current.category;
        const targetTheme = dto.color_theme || (dto.category ? colorThemeMap[dto.category] : current.color_theme);

        const updated: PlannerScheduleItem = {
            ...current,
            title: dto.title !== undefined ? dto.title.trim() : current.title,
            category: targetCat,
            type: dto.type !== undefined ? dto.type : current.type,
            date: targetDate,
            start_date: startDate,
            end_date: endDate,
            day_index: dto.day_index !== undefined ? Number(dto.day_index) : current.day_index,
            start_day_index: dto.start_day_index !== undefined ? Number(dto.start_day_index) : current.start_day_index,
            end_day_index: dto.end_day_index !== undefined ? Number(dto.end_day_index) : current.end_day_index,
            start_time: dto.start_time !== undefined ? dto.start_time : current.start_time,
            end_time: dto.end_time !== undefined ? dto.end_time : current.end_time,
            time: dto.time !== undefined ? dto.time : current.time,
            color_theme: targetTheme as any,
            top_position: dto.top_position !== undefined ? dto.top_position : current.top_position,
            height: dto.height !== undefined ? dto.height : current.height,
            note: dto.note !== undefined ? dto.note : current.note,
            plan_id: dto.plan_id !== undefined ? dto.plan_id : current.plan_id,
            plan_name: dto.plan_name !== undefined ? dto.plan_name : current.plan_name,
            updated_at: new Date().toISOString(),
        };

        if (Array.isArray(dto.members)) {
            updated.members = dto.members.map((m) => ({
                id: m.id || 'm_' + Date.now(),
                name: m.name,
                role: m.role || 'សមាជិក',
                initials: m.initials || m.name.slice(0, 2).toUpperCase(),
                avatar: m.avatar || null,
                bg: m.bg || 'bg-blue-700 text-white',
            }));
            updated.extra_count = Math.max(0, updated.members.length - 2);
        }

        all[index] = updated;
        await this._writeSchedules(all);

        return {
            status_code: 200,
            message: 'កែប្រែកាលវិភាគបានជោគជ័យ',
            data: updated,
        };
    }

    // =========================================================================
    // 5. DELETE SCHEDULE
    // =========================================================================
    async deleteSchedule(user: UserPayload, id: string) {
        let all = await this._readSchedules();
        const exists = all.some((s) => s.id === id);
        if (!exists) {
            throw new NotFoundException(`រកមិនឃើញកាលវិភាគសម្គាល់ ${id}`);
        }

        all = all.filter((s) => s.id !== id);
        await this._writeSchedules(all);

        return {
            status_code: 200,
            message: 'លុបកាលវិភាគបានជោគជ័យ',
            data: { id },
        };
    }

    // =========================================================================
    // 6. GET TEAM MEMBERS (FOR PLANNER MEMBER SELECTION)
    // =========================================================================
    async getTeamMembers(user: UserPayload) {
        try {
            const users = await this._userRepo.find({
                select: ['id', 'name_kh', 'name_en', 'first_name', 'last_name', 'telegram_photo_url'],
                order: { id: 'ASC' },
                take: 100,
            });
            if (users && users.length > 0) {
                const colors = [
                    'bg-slate-700 text-white',
                    'bg-teal-700 text-white',
                    'bg-indigo-700 text-white',
                    'bg-purple-700 text-white',
                    'bg-emerald-700 text-white',
                    'bg-amber-700 text-white',
                ];
                const mapped = users.map((u, i) => {
                    const name = u.name_kh && u.name_en
                        ? `${u.name_kh} (${u.name_en})`
                        : (u.name_kh || u.name_en || (u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : `បុគ្គលិក #${u.id}`));
                    const initials = (u.name_en || u.name_kh || 'U').trim().slice(0, 2).toUpperCase();
                    return {
                        id: u.id,
                        name,
                        role: 'សមាជិកក្រុមការងារ',
                        initials,
                        avatar: u.telegram_photo_url || null,
                        bg: colors[i % colors.length],
                    };
                });
                return {
                    status_code: 200,
                    message: 'ទាញយកបញ្ជីសមាជិកបានជោគជ័យ',
                    data: mapped,
                };
            }
        } catch (err) {}

        const defaultMembers = [
            { id: 1, name: 'ចេង ច័ន្ទបញ្ញា (Panha)', role: 'Frontend Lead / Developer', initials: 'CP', bg: 'bg-slate-700 text-white', avatar: null },
            { id: 2, name: 'សុខ សុភា (Sopheak)', role: 'Lead Project Manager', initials: 'SP', bg: 'bg-teal-700 text-white', avatar: null },
            { id: 3, name: 'រ័ត្ន វិចិត្រ (Vichet)', role: 'DevOps & Cloud Engineer', initials: 'VC', bg: 'bg-indigo-700 text-white', avatar: null },
            { id: 4, name: 'លី ម៉េងហួរ (Menghour)', role: 'Senior Backend Engineer', initials: 'MH', bg: 'bg-purple-700 text-white', avatar: null },
            { id: 5, name: 'គង់ ចរិយា (Chariya)', role: 'QA & Automation Engineer', initials: 'CY', bg: 'bg-emerald-700 text-white', avatar: null },
            { id: 6, name: 'ហេង ពិសាល (Piseth)', role: 'Mobile App Developer', initials: 'PS', bg: 'bg-amber-700 text-white', avatar: null },
        ];

        return {
            status_code: 200,
            message: 'ទាញយកបញ្ជីសមាជិកបានជោគជ័យ',
            data: defaultMembers,
        };
    }
}
