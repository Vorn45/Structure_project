import { ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { UserPayload } from 'src/app/interface/jwt.interface';
import { isAdminOrSuperAdmin } from 'src/app/common/utils/access.util';
import { PlannerStore } from 'src/app/model/user/planner-store.entity';
import { User } from 'src/app/model/user/users.entity';
import axios from 'axios';
import { appConfig } from 'src/app.config';
import {
    NotificationService,
    NotificationItem,
} from 'src/app/shared/notification/notification.service';

import { CreateScheduleDto, QueryPlannerDto, UpdateScheduleDto } from './planner.dto';

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

type LiveMember = { id: number; name: string; avatar: string | null; role: string; email: string };

const STORE_KEY = 'default_planner_store';

/**
 * The web calendar only knows these four pastel themes. Anything else (older
 * records, or the palette names the create dialog used to send) is folded back
 * into one of them so the grid never receives a theme it cannot paint.
 */
const SUPPORTED_THEMES = ['peach', 'lavender', 'pink', 'mint'] as const;
const THEME_ALIASES: Record<string, (typeof SUPPORTED_THEMES)[number]> = {
    indigo: 'lavender',
    purple: 'lavender',
    violet: 'lavender',
    coral: 'pink',
    rose: 'pink',
    red: 'pink',
    lime: 'mint',
    green: 'mint',
    emerald: 'mint',
    cyan: 'mint',
    teal: 'mint',
    amber: 'peach',
    orange: 'peach',
    blue: 'lavender',
};
const CATEGORY_THEMES: Record<string, (typeof SUPPORTED_THEMES)[number]> = {
    work: 'peach',
    myself: 'lavender',
    breaks: 'pink',
};

@Injectable()
export class PlannerService {
    constructor(
        @InjectRepository(PlannerStore)
        private readonly _storeRepo: Repository<PlannerStore>,
        @InjectRepository(User)
        private readonly _userRepo: Repository<User>,
        private readonly _notificationService?: NotificationService,
    ) {}

    /**
     * Tells the people put on a work plan that it exists. Without this the only
     * way to discover an assignment was to open the planner and look.
     */
    private notifyAssignedMembers(
        user: UserPayload,
        schedule: PlannerScheduleItem,
        memberIds: number[],
        kind: 'created' | 'updated',
    ): void {
        const targetSet = new Set<number>();
        for (const id of memberIds) {
            const num = Number(id);
            if (num > 0) targetSet.add(num);
        }
        if (user?.id && Number(user.id) > 0) {
            targetSet.add(Number(user.id));
        }
        const targetIds = Array.from(targetSet);
        if (targetIds.length === 0) return;

        const organizer = schedule.created_by_name || user?.name_kh || user?.name_en || '';
        const when = `${schedule.start_date || schedule.date || ''} ${schedule.time || ''}`.trim();
        const titleKh = kind === 'created' ? 'កាលវិភាគថ្មីត្រូវបានចាត់តាំង' : 'កាលវិភាគត្រូវបានកែប្រែ';
        const titleEn = kind === 'created' ? 'New schedule assigned' : 'Schedule updated';
        const messageKh = `${organizer} បានដាក់អ្នកក្នុងកាលវិភាគ "${schedule.title}" (${when})`;
        const messageEn = `${organizer} added you to the schedule "${schedule.title}" (${when})`;

        if (this._notificationService) {
            const notif: NotificationItem = {
                id: `notif_planner_${schedule.id}_${Date.now()}`,
                type: kind === 'created' ? 'planner_assigned' : 'planner_updated',
                title: titleKh,
                title_kh: titleKh,
                title_en: titleEn,
                message: messageKh,
                message_kh: messageKh,
                message_en: messageEn,
                data: { schedule_id: schedule.id, category: schedule.category },
                is_unread: true,
                read_at: null,
                created_at: new Date().toISOString(),
            };

            try {
                this._notificationService.pushNotification(notif, targetIds);
            } catch (e) {
                console.warn('[PlannerService] Failed to push planner notification:', e);
            }
        }

        // Fire-and-forget private Telegram notification to assigned members & creator
        this.sendTelegramScheduleNotification(user, schedule, targetIds, kind).catch((e) => {
            console.warn('[PlannerService] Async Telegram dispatch error:', e);
        });
    }

    private async sendTelegramScheduleNotification(
        user: UserPayload,
        schedule: PlannerScheduleItem,
        targetIds: number[],
        kind: 'created' | 'updated',
    ): Promise<void> {
        const botToken =
            process.env.TELEGRAM_BOT_TOKEN ||
            appConfig.AUTH?.TELEGRAM_BOT_TOKEN ||
            appConfig.ORGANIZATION_LOG?.TELEGRAM_BOT_TOKEN ||
            '8884371111:AAG3DkDG61rKvCbOFrl88FQ4nNNS-8XzzZI';

        if (!botToken || targetIds.length === 0) return;

        try {
            const assignedUsers = await this._userRepo
                .createQueryBuilder('user')
                .where('user.id IN (:...ids)', { ids: targetIds })
                .andWhere('user.telegram_id IS NOT NULL')
                .andWhere("LENGTH(TRIM(user.telegram_id)) > 0")
                .select(['user.id', 'user.name_en', 'user.name_kh', 'user.telegram_id'])
                .getMany();

            if (!assignedUsers.length) return;

            const organizer = schedule.created_by_name || user?.name_kh || user?.name_en || 'Admin';
            const when = `${schedule.start_date || schedule.date || ''} ${schedule.time || ''}`.trim();
            const actionHeader = kind === 'created'
                ? '📅 <b>កាលវិភាគថ្មីត្រូវបានចាត់តាំង (New Schedule)</b>'
                : '🔄 <b>កាលវិភាគត្រូវបានកែប្រែ (Schedule Updated)</b>';
            const categoryText = schedule.type || (schedule.category === 'work' ? 'ការងារទូទៅ' : schedule.category || 'ទូទៅ');
            const noteSection = schedule.note ? `\n📝 <b>ចំណាំ:</b> ${this.escapeHtml(schedule.note)}` : '';

            const frontendUrl = (
                process.env.APP_DEPLOY_URL ||
                appConfig.APP?.FRONTEND_URL ||
                'https://wms-digitechkh.vercel.app'
            ).replace(/\/+$/, '');
            const plannerUrl = `${frontendUrl}/#/admin/planner`;

            const replyMarkup = {
                inline_keyboard: [
                    [
                        {
                            text: 'បើកមើលកាលវិភាគ 📅',
                            url: plannerUrl,
                        },
                    ],
                ],
            };

            for (const member of assignedUsers) {
                if (!member.telegram_id) continue;

                const memberName = member.name_kh || member.name_en || 'សមាជិក';
                const message =
`${actionHeader}

ជំរាបសួរ <b>${this.escapeHtml(memberName)}</b>, អ្នកត្រូវបានចាត់តាំងក្នុងកាលវិភាគ៖
📌 <b>ប្រធានបទ:</b> ${this.escapeHtml(schedule.title)}
🕒 <b>ពេលវេលា:</b> ${this.escapeHtml(when)}
🏢 <b>ប្រភេទ:</b> ${this.escapeHtml(categoryText)}
👤 <b>អ្នករៀបចំ:</b> ${this.escapeHtml(organizer)}${noteSection}

សូមចុចប៊ូតុងខាងក្រោមដើម្បីពិនិត្យមើលព័ត៌មានលម្អិត។`;

                try {
                    await axios.post(
                        `https://api.telegram.org/bot${botToken}/sendMessage`,
                        {
                            chat_id: member.telegram_id,
                            text: message,
                            parse_mode: 'HTML',
                            reply_markup: replyMarkup,
                        },
                        { timeout: 10000 },
                    );
                } catch (err: any) {
                    console.warn(`[PlannerService] Failed to send Telegram notification to user ${member.id} (${member.telegram_id}):`, err?.message || err);
                }
            }
        } catch (error: any) {
            console.warn('[PlannerService] Telegram notification error:', error?.message || error);
        }
    }

    private escapeHtml(text: string): string {
        if (!text) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    private numericMemberIds(schedule: PlannerScheduleItem): number[] {
        return (schedule.members || [])
            .map((m) => Number(m.id))
            .filter((id) => Number.isFinite(id) && id > 0);
    }

    // =========================================================================
    // LIVE USER HYDRATION HELPERS
    // =========================================================================
    private formatAvatarUrl(file?: { uri?: string | null; file_domain?: string | null } | null): string | null {
        if (!file || !file.uri) return null;
        const rawUri = file.uri.trim();
        if (!rawUri) return null;

        if (/^https?:\/\//i.test(rawUri)) {
            if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/(uploads|storage)\//i.test(rawUri)) {
                const stripped = rawUri.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i, '');
                return `/${stripped.replace(/^\/+/, '')}`;
            }
            return rawUri;
        }

        let domain = (file.file_domain || '').trim().replace(/\/+$/, '');
        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(domain)) {
            domain = '';
        }

        const uri = rawUri.replace(/^\/+/, '');
        return domain ? `${domain}/${uri}` : `/${uri}`;
    }

    private normalizeName(value?: string | null): string {
        return (value || '').trim().toLowerCase();
    }

    private toIsoDate(d: Date): string {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    /**
     * Legacy records carry only a day_index (0: Monday … 6: Sunday) and no date.
     * Without a date a calendar has nothing to anchor them to, so they repeated on
     * every matching weekday forever. Anchor them to the week they were created in,
     * which gives each one exactly one real date.
     */
    private resolveDates(sch: PlannerScheduleItem): PlannerScheduleItem {
        const existingStart = (sch.start_date || sch.date || '').split('T')[0];
        if (existingStart) {
            const existingEnd = (sch.end_date || '').split('T')[0] || existingStart;
            return { ...sch, date: existingStart, start_date: existingStart, end_date: existingEnd };
        }

        const anchor = sch.created_at ? new Date(sch.created_at) : new Date();
        if (isNaN(anchor.getTime())) return sch;

        // Monday of the anchor week.
        const dayOfWeek = anchor.getDay(); // 0: Sun, 1: Mon...
        const monday = new Date(anchor);
        monday.setDate(anchor.getDate() + (dayOfWeek === 0 ? -6 : 1 - dayOfWeek));
        monday.setHours(0, 0, 0, 0);

        const startIdx = Number(sch.start_day_index ?? sch.day_index ?? 0) || 0;
        const endIdx = Number(sch.end_day_index ?? startIdx) || startIdx;

        const start = new Date(monday);
        start.setDate(monday.getDate() + Math.max(0, Math.min(6, startIdx)));
        const end = new Date(monday);
        end.setDate(monday.getDate() + Math.max(0, Math.min(6, Math.max(startIdx, endIdx))));

        const startIso = this.toIsoDate(start);
        return { ...sch, date: startIso, start_date: startIso, end_date: this.toIsoDate(end) };
    }

    private normalizeTheme(theme?: string | null, category?: string | null): string {
        const raw = (theme || '').trim().toLowerCase();
        if ((SUPPORTED_THEMES as readonly string[]).includes(raw)) return raw;
        if (THEME_ALIASES[raw]) return THEME_ALIASES[raw];
        return CATEGORY_THEMES[(category || '').trim().toLowerCase()] || 'peach';
    }

    private async getLiveMemberLookup(): Promise<Map<string, LiveMember>> {
        const lookup = new Map<string, LiveMember>();
        try {
            const users = await this._userRepo.find({
                relations: ['user_roles', 'user_roles.role', 'avatar_file'],
            });
            for (const u of users) {
                const avatar = this.formatAvatarUrl(u.avatar_file) || u.telegram_photo_url || null;
                const role = u.user_roles?.[0]?.role?.name_en || u.user_roles?.[0]?.role?.name_kh || 'Member';
                const name = u.name_kh || u.name_en || `User #${u.id}`;
                const entry = { id: u.id, name, avatar, role, email: u.email || '' };
                lookup.set(String(u.id), entry);
                if (u.email) lookup.set(u.email.toLowerCase().trim(), entry);
                if (u.phone) lookup.set(u.phone.replace(/\D/g, ''), entry);
                if (u.name_kh) lookup.set(this.normalizeName(u.name_kh), entry);
                if (u.name_en) lookup.set(this.normalizeName(u.name_en), entry);
            }
        } catch (e) {
            console.warn('[PlannerService] Failed to load live users for lookup:', e);
        }
        return lookup;
    }

    private enrichSchedulesWithLiveMembers(
        schedules: PlannerScheduleItem[],
        lookup: Map<string, LiveMember>
    ): PlannerScheduleItem[] {
        return schedules.map((sch) => {
            const enrichedMembers = (sch.members || []).map((m) => {
                const key = String(m.id || m.name || '');
                const live = lookup.get(key) || (m.name ? lookup.get(this.normalizeName(m.name)) : null);
                if (live) {
                    return {
                        ...m,
                        id: live.id,
                        name: live.name,
                        role: live.role || m.role,
                        avatar: live.avatar ?? m.avatar,
                    };
                }
                return m;
            });

            return this.resolveDates({
                ...sch,
                color_theme: this.normalizeTheme(sch.color_theme, sch.category),
                members: enrichedMembers,
            });
        });
    }

    // =========================================================================
    // STORE HELPERS
    // =========================================================================
    private async _readSchedules(manager?: EntityManager): Promise<PlannerScheduleItem[]> {
        const repo = manager ? manager.getRepository(PlannerStore) : this._storeRepo;
        try {
            const dbStore = await repo.findOne({ where: { key: STORE_KEY } });
            if (dbStore && Array.isArray(dbStore.schedules)) {
                return dbStore.schedules;
            }
        } catch (e) {
            console.warn('[PlannerService] Failed to read schedules from DB:', e);
        }
        return [];
    }

    private async _ensureStoreRow(): Promise<void> {
        await this._storeRepo
            .createQueryBuilder()
            .insert()
            .into(PlannerStore)
            .values({ key: STORE_KEY, schedules: [] })
            .orIgnore()
            .execute();
    }

    /**
     * Read-modify-write of the whole schedule array, serialised by a row lock so
     * two people saving at the same time cannot overwrite each other's entry.
     * A failed write throws — the caller must never report success on lost data.
     */
    private async _mutateSchedules<T>(
        mutate: (schedules: PlannerScheduleItem[]) => { schedules: PlannerScheduleItem[]; result: T },
    ): Promise<T> {
        try {
            // The row must exist before the transaction, otherwise there is nothing
            // for the lock to hold and two first-time writers would collide.
            await this._ensureStoreRow();

            return await this._storeRepo.manager.transaction(async (manager) => {
                const repo = manager.getRepository(PlannerStore);
                const dbStore = await repo.findOne({
                    where: { key: STORE_KEY },
                    lock: { mode: 'pessimistic_write' },
                });

                const current = dbStore && Array.isArray(dbStore.schedules) ? dbStore.schedules : [];
                const { schedules, result } = mutate(current);

                if (!dbStore) {
                    await repo.save(repo.create({ key: STORE_KEY, schedules }));
                } else {
                    dbStore.schedules = schedules;
                    await repo.save(dbStore);
                }
                return result;
            });
        } catch (e) {
            if (e instanceof NotFoundException || e instanceof ForbiddenException) throw e;
            console.error('[PlannerService] Failed to write schedules to DB:', e);
            throw new InternalServerErrorException('មិនអាចរក្សាទុកកាលវិភាគបានទេ');
        }
    }

    // =========================================================================
    // ACCESS HELPERS
    // =========================================================================
    private _isCreator(user: UserPayload, sch: PlannerScheduleItem): boolean {
        const currentUserId = user?.id;
        if (sch.created_by && currentUserId && String(sch.created_by) === String(currentUserId)) {
            return true;
        }
        if (!sch.created_by && sch.created_by_name) {
            const creator = this.normalizeName(sch.created_by_name);
            const candidates = [
                this.normalizeName(user?.name_kh),
                this.normalizeName(user?.name_en),
                this.normalizeName((user as any)?.name),
            ].filter(Boolean);
            return candidates.includes(creator);
        }
        return false;
    }

    private _isAssigned(user: UserPayload, sch: PlannerScheduleItem): boolean {
        if (!Array.isArray(sch.members) || sch.members.length === 0) return false;
        const currentUserId = user?.id;
        const candidates = [
            this.normalizeName(user?.name_kh),
            this.normalizeName(user?.name_en),
            this.normalizeName((user as any)?.name),
        ].filter(Boolean);

        return sch.members.some((m) => {
            if (m.id !== undefined && currentUserId !== undefined && String(m.id) === String(currentUserId)) {
                return true;
            }
            // Fall back to an exact name match only for members stored without a
            // real account id (free-typed names). Substring matching used to leak
            // schedules between users whose names contain one another.
            return Boolean(m.name) && candidates.includes(this.normalizeName(m.name));
        });
    }

    /**
     * Admins see everything. Everyone else sees work plans they created or were
     * explicitly assigned to, and only their own personal / break entries.
     */
    private _canView(user: UserPayload, sch: PlannerScheduleItem): boolean {
        if (isAdminOrSuperAdmin(user)) return true;
        if (this._isCreator(user, sch)) return true;
        if (sch.category === 'work') return this._isAssigned(user, sch);
        return false;
    }

    /** Only the creator (or an admin) may edit or delete a schedule. */
    private _canModify(user: UserPayload, sch: PlannerScheduleItem): boolean {
        return isAdminOrSuperAdmin(user) || this._isCreator(user, sch);
    }

    private _assertCanModify(user: UserPayload, sch: PlannerScheduleItem): void {
        if (!this._canModify(user, sch)) {
            throw new ForbiddenException('អ្នកមិនមានសិទ្ធិកែប្រែកាលវិភាគនេះទេ');
        }
    }

    // =========================================================================
    // 1. GET SCHEDULES (CONNECTS ADMIN AND USERS ON WORK PLANS)
    // =========================================================================
    async getSchedules(user: UserPayload, query: QueryPlannerDto) {
        const allSchedules = await this._readSchedules();

        const visibleSchedules = allSchedules.filter((sch) => this._canView(user, sch));

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

        const lookup = await this.getLiveMemberLookup();
        const enrichedResults = this.enrichSchedulesWithLiveMembers(filtered, lookup).map((sch) => ({
            ...sch,
            can_modify: this._canModify(user, sch),
        }));

        return {
            status_code: 200,
            message: 'ទាញយកទិន្នន័យកាលវិភាគបានជោគជ័យ',
            data: {
                results: enrichedResults,
                total: enrichedResults.length,
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
        if (!this._canView(user, schedule)) {
            throw new ForbiddenException('អ្នកមិនមានសិទ្ធិមើលកាលវិភាគនេះទេ');
        }
        const lookup = await this.getLiveMemberLookup();
        const enriched = this.enrichSchedulesWithLiveMembers([schedule], lookup)[0];
        return {
            status_code: 200,
            message: 'ទាញយកកាលវិភាគបានជោគជ័យ',
            data: { ...enriched, can_modify: this._canModify(user, schedule) },
        };
    }

    // =========================================================================
    // 3. CREATE SCHEDULE (ADMIN & USER WORK PLANS)
    // =========================================================================
    async createSchedule(user: UserPayload, dto: CreateScheduleDto) {
        const dayIndex = dto.day_index !== undefined ? dto.day_index : (dto.start_day_index !== undefined ? dto.start_day_index : 2);
        const startTime = dto.start_time || dto.time || '09:00 ព្រឹក';
        const endTime = dto.end_time || '';
        const timeDisplay = dto.category === 'work' && endTime ? `${startTime} - ${endTime}` : startTime;
        const currentUserName = user?.name_kh || user?.name_en || (user as any)?.name || `User #${user?.id}`;

        const membersList = Array.isArray(dto.members) && dto.members.length > 0
            ? dto.members.map((m, idx) => ({
                id: m.id || `m_${Date.now()}_${idx}`,
                name: m.name,
                role: m.role || 'សមាជិកក្រុមការងារ',
                initials: m.initials || m.name.slice(0, 2).toUpperCase(),
                avatar: m.avatar || null,
                bg: m.bg || 'bg-blue-700 text-white',
            }))
            : [
                {
                    id: user?.id,
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
            color_theme: this.normalizeTheme(dto.color_theme, dto.category),
            top_position: dto.top_position || 0,
            height: dto.height || 105,
            members: membersList,
            extra_count: Math.max(0, membersList.length - 2),
            note: dto.note || '',
            plan_id: dto.plan_id,
            plan_name: dto.plan_name,
            created_by: user?.id,
            created_by_name: currentUserName,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        await this._mutateSchedules((all) => ({
            schedules: [newSchedule, ...all],
            result: newSchedule,
        }));

        this.notifyAssignedMembers(user, newSchedule, this.numericMemberIds(newSchedule), 'created');

        return {
            status_code: 201,
            message: 'បង្កើតកាលវិភាគថ្មីបានជោគជ័យ',
            data: { ...newSchedule, can_modify: true },
        };
    }

    // =========================================================================
    // 4. UPDATE SCHEDULE
    // =========================================================================
    async updateSchedule(user: UserPayload, id: string, dto: UpdateScheduleDto) {
        const updated = await this._mutateSchedules((all) => {
            const index = all.findIndex((s) => s.id === id);
            if (index === -1) {
                throw new NotFoundException(`រកមិនឃើញកាលវិភាគសម្គាល់ ${id}`);
            }

            const current = all[index];
            this._assertCanModify(user, current);

            const targetDate = (dto as any).date || (dto as any).start_date || current.date;
            const startDate = (dto as any).start_date || targetDate || current.start_date;
            const endDate = (dto as any).end_date || startDate || current.end_date;

            const targetCat = dto.category !== undefined ? dto.category : current.category;
            const targetTheme = this.normalizeTheme(
                dto.color_theme || (dto.category ? undefined : current.color_theme),
                targetCat,
            );

            const next: PlannerScheduleItem = {
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
                color_theme: targetTheme,
                top_position: dto.top_position !== undefined ? dto.top_position : current.top_position,
                height: dto.height !== undefined ? dto.height : current.height,
                note: dto.note !== undefined ? dto.note : current.note,
                plan_id: dto.plan_id !== undefined ? dto.plan_id : current.plan_id,
                plan_name: dto.plan_name !== undefined ? dto.plan_name : current.plan_name,
                updated_at: new Date().toISOString(),
            };

            if (Array.isArray(dto.members)) {
                next.members = dto.members.map((m, idx) => ({
                    id: m.id || `m_${Date.now()}_${idx}`,
                    name: m.name,
                    role: m.role || 'សមាជិក',
                    initials: m.initials || m.name.slice(0, 2).toUpperCase(),
                    avatar: m.avatar || null,
                    bg: m.bg || 'bg-blue-700 text-white',
                }));
                next.extra_count = Math.max(0, next.members.length - 2);
            }

            const schedules = [...all];
            schedules[index] = next;
            return { schedules, result: next };
        });

        if (Array.isArray(dto.members)) {
            this.notifyAssignedMembers(user, updated, this.numericMemberIds(updated), 'updated');
        }

        return {
            status_code: 200,
            message: 'កែប្រែកាលវិភាគបានជោគជ័យ',
            data: { ...updated, can_modify: true },
        };
    }

    // =========================================================================
    // 5. DELETE SCHEDULE
    // =========================================================================
    async deleteSchedule(user: UserPayload, id: string) {
        await this._mutateSchedules((all) => {
            const target = all.find((s) => s.id === id);
            if (!target) {
                throw new NotFoundException(`រកមិនឃើញកាលវិភាគសម្គាល់ ${id}`);
            }
            this._assertCanModify(user, target);
            return { schedules: all.filter((s) => s.id !== id), result: true };
        });

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
        const colors = [
            'bg-slate-700 text-white',
            'bg-teal-700 text-white',
            'bg-indigo-700 text-white',
            'bg-purple-700 text-white',
            'bg-emerald-700 text-white',
            'bg-amber-700 text-white',
        ];

        let users: User[] = [];
        try {
            users = await this._userRepo.find({
                relations: ['user_roles', 'user_roles.role', 'avatar_file'],
                order: { id: 'ASC' },
                take: 200,
            });
        } catch (err) {
            console.warn('[PlannerService] Failed to load live team members:', err);
        }

        const mapped = (users || [])
            .filter((u) => u.is_active === undefined || Number(u.is_active) !== 0)
            .map((u, i) => {
                const name = u.name_kh && u.name_en
                    ? `${u.name_kh} (${u.name_en})`
                    : (u.name_kh || u.name_en || (u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : `បុគ្គលិក #${u.id}`));
                const initials = (u.name_en || u.name_kh || 'U').trim().slice(0, 2).toUpperCase();
                const role = u.user_roles?.[0]?.role?.name_kh || u.user_roles?.[0]?.role?.name_en || 'សមាជិកក្រុមការងារ';
                return {
                    id: u.id,
                    name,
                    role,
                    initials,
                    avatar: this.formatAvatarUrl(u.avatar_file) || u.telegram_photo_url || null,
                    bg: colors[i % colors.length],
                };
            });

        if (mapped.length > 0) {
            return {
                status_code: 200,
                message: 'ទាញយកបញ្ជីសមាជិកបានជោគជ័យ',
                data: mapped,
            };
        }

        // Fallback demo roster so the planner member picker still works without live users.
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
