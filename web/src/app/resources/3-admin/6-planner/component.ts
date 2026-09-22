import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { DialogConfigService } from 'app/shared/dialog-config.service';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import { CreateScheduleDialogComponent } from './create-schedule-dialog/component';
import { ScheduleDetailDialogComponent } from './schedule-detail-dialog/component';
import { PlannerService, BackendPlannerSchedule } from './planner.service';

export type PlannerColorTheme = 'peach' | 'lavender' | 'pink' | 'mint';

const PLANNER_THEMES: PlannerColorTheme[] = ['peach', 'lavender', 'pink', 'mint'];

/**
 * The grid can only paint the four pastel themes above. Older records — and the
 * palette names the create dialog used to send ('indigo', 'coral', …) — are
 * folded into the nearest supported theme instead of rendering as `undefined`.
 */
const PLANNER_THEME_ALIASES: Record<string, PlannerColorTheme> = {
    indigo: 'lavender',
    purple: 'lavender',
    violet: 'lavender',
    blue: 'lavender',
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
};

export function normalizeColorTheme(theme?: string | null): PlannerColorTheme {
    const raw = (theme || '').trim().toLowerCase();
    if ((PLANNER_THEMES as string[]).includes(raw)) return raw as PlannerColorTheme;
    return PLANNER_THEME_ALIASES[raw] || 'peach';
}

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
    colorTheme: PlannerColorTheme;
    members: Array<{ id?: string | number; name: string; role?: string; avatar?: string; initials: string; bg: string }>;
    extraCount: number;
    note?: string;
    planName?: string;
    /** Whether the signed-in user may edit or delete this entry (creator or admin). */
    canModify?: boolean;
}

export interface DayColumn {
    nameKh: string;
    nameEn: string;
    dateNum: number;
    subTime: string;
    fullDate: Date;
    isCurrent: boolean;
    isToday: boolean;
}

@Component({
    selector: 'app-planner',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatIconModule,
        MatMenuModule,
        MatTooltipModule,
        MatDialogModule,
    ],
    templateUrl: './template.html',
    styleUrl: './style.scss',
})
export class PlannerComponent implements OnInit {
    private _router = inject(Router);
    private _matDialog = inject(MatDialog);
    private _dialogConfigService = inject(DialogConfigService);
    private _plannerService = inject(PlannerService);
    private _snackbarService = inject(SnackbarService);

    isLoading = signal<boolean>(false);

    // Current Active Date State (Defaults to current date / today)
    currentBaseDate = signal<Date>(this.getInitialMonday());
    /**
     * The selected day as a full ISO date. It used to be only the day-of-month,
     * which resolved against whatever month the week strip happened to show —
     * selecting a day from an adjacent month landed on the wrong date.
     */
    selectedDateIso = signal<string>(this.formatDateToIso(new Date()));
    activeView = signal<'day' | 'week' | 'month'>('week');

    private getInitialMonday(): Date {
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0: Sun, 1: Mon...
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(today);
        monday.setDate(today.getDate() + diffToMonday);
        monday.setHours(0, 0, 0, 0);
        return monday;
    }

    // Filter Checkboxes for "My Schedule"
    filterScheduleMeeting = signal<boolean>(true);
    filterProjectReview = signal<boolean>(true);
    filterOnlineMeeting = signal<boolean>(true);
    filterRecessBreak = signal<boolean>(true);
    filterCoffeeDate = signal<boolean>(true);
    filterOther = signal<boolean>(true);

    // Filter Categories
    selectedCategory = signal<'all' | 'work' | 'myself' | 'breaks'>('all');

    // Days Columns (Week View - 7 days: ច័ន្ទ ដល់ អាទិត្យ)
    get dayColumns(): DayColumn[] {
        const base = new Date(this.currentBaseDate());
        const khmerDays = ['ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍', 'អាទិត្យ'];
        const englishDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const today = new Date();
        const selectedIso = this.formatDateToIso(this.selectedDayDate);

        const cols: DayColumn[] = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(base);
            d.setDate(base.getDate() + i);
            const isToday = d.toDateString() === today.toDateString();
            // Compare the full date, not just the day number — a week that straddles
            // two months (or years) used to light up the wrong column.
            const isSelected = this.formatDateToIso(d) === selectedIso;
            const isCurrent = isToday || isSelected;

            // Calculate total scheduled time for this day column
            const dayEvents = this.filteredEvents ? this.filteredEvents().filter(e => this.isEventInDay(e, i)) : [];
            let totalHoursStr = '';
            if (dayEvents.length > 0) {
                const totalMinutes = dayEvents.reduce((acc, ev) => {
                    const { startMinutes, endMinutes } = this.extractTimeRange(ev.time, ev.startTime, ev.endTime);
                    const diff = Math.max(30, endMinutes - startMinutes);
                    return acc + diff;
                }, 0);
                const h = Math.floor(totalMinutes / 60);
                const m = totalMinutes % 60;
                totalHoursStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
            }

            cols.push({
                nameKh: khmerDays[i] || 'ច័ន្ទ',
                nameEn: englishDays[i] || 'Mon',
                dateNum: d.getDate(),
                subTime: isToday ? 'ថ្ងៃនេះ' : totalHoursStr,
                fullDate: d,
                isCurrent: isCurrent,
                isToday: isToday,
            });
        }
        return cols;
    }

    // Selected Day Date & Events for Day View
    get selectedDayDate(): Date {
        return this.parseIsoDate(this.selectedDateIso());
    }

    parseIsoDate(iso: string): Date {
        const parts = (iso || '').split('-');
        if (parts.length < 3) return new Date();
        return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }

    get headerTitle(): string {
        if (this.activeView() === 'day') {
            return this.getKhmerFormattedDate(this.formatDateToIso(this.selectedDayDate));
        }
        return this.currentMonthLabel;
    }

    get selectedDayEvents(): PlannerScheduleEvent[] {
        const target = this.selectedDayDate;
        return this.filteredEvents().filter((ev) => this.isEventOnDate(ev, target));
    }

    // Month Label
    get currentMonthLabel(): string {
        const d = this.selectedDayDate;
        const khmerMonths = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
        return `${khmerMonths[d.getMonth()]} ${d.getFullYear()}`;
    }

    // Mini Calendar Days
    get miniCalendarGrid(): Array<{ empty: boolean; dayNum?: number; isSelected?: boolean; isToday?: boolean; fullDate?: Date }> {
        const d = this.selectedDayDate;
        const year = d.getFullYear();
        const month = d.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const today = new Date();

        const startDayIndex = firstDay.getDay(); // 0: Sun, 1: Mon...
        const grid: Array<{ empty: boolean; dayNum?: number; isSelected?: boolean; isToday?: boolean; fullDate?: Date }> = [];

        for (let i = 0; i < startDayIndex; i++) {
            grid.push({ empty: true });
        }

        for (let day = 1; day <= lastDay.getDate(); day++) {
            const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
            const isSelected = this.formatDateToIso(new Date(year, month, day)) === this.selectedDateIso();
            grid.push({
                empty: false,
                dayNum: day,
                isSelected: isSelected,
                isToday: isToday,
                fullDate: new Date(year, month, day),
            });
        }

        return grid;
    }

    // Month View Full Grid (Weeks x 7 Days)
    get monthViewWeeks(): Array<Array<{
        date: Date;
        dateNum: number;
        isCurrentMonth: boolean;
        isToday: boolean;
        isSunday: boolean;
        dateIso: string;
        events: PlannerScheduleEvent[];
    }>> {
        const base = this.selectedDayDate;
        const year = base.getFullYear();
        const month = base.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const todayStr = this.formatDateToIso(new Date());

        const startDayOfWeek = firstDayOfMonth.getDay(); // 0: Sun, 1: Mon...
        const startDate = new Date(firstDayOfMonth);
        startDate.setDate(firstDayOfMonth.getDate() - startDayOfWeek);

        const weeks: Array<Array<{
            date: Date;
            dateNum: number;
            isCurrentMonth: boolean;
            isToday: boolean;
            isSunday: boolean;
            dateIso: string;
            events: PlannerScheduleEvent[];
        }>> = [];

        let currentDay = new Date(startDate);
        const filtered = this.filteredEvents();

        for (let w = 0; w < 6; w++) {
            const weekDays = [];
            for (let d = 0; d < 7; d++) {
                const dateIso = this.formatDateToIso(currentDay);
                const isCurrentMonth = currentDay.getMonth() === month;
                const isToday = dateIso === todayStr;
                const isSunday = d === 0;

                const cellDate = new Date(currentDay);
                const dayEvents = filtered.filter((ev) => this.isEventOnDate(ev, cellDate));

                weekDays.push({
                    date: new Date(currentDay),
                    dateNum: currentDay.getDate(),
                    isCurrentMonth,
                    isToday,
                    isSunday,
                    dateIso,
                    events: dayEvents,
                });

                currentDay.setDate(currentDay.getDate() + 1);
            }
            weeks.push(weekDays);

            if (currentDay.getMonth() !== month && currentDay > lastDayOfMonth && w >= 3) {
                break;
            }
        }

        return weeks;
    }

    // Default visible window: 08:00 → 18:00. The grid grows beyond it when a
    // schedule falls outside, instead of squashing that event onto the edge row.
    readonly DEFAULT_GRID_START_HOUR = 8;
    readonly DEFAULT_GRID_END_HOUR = 18;
    readonly HOUR_ROW_HEIGHT = 60; // 60px per hour

    get gridRange(): { startHour: number; endHour: number } {
        let startHour = this.DEFAULT_GRID_START_HOUR;
        let endHour = this.DEFAULT_GRID_END_HOUR;

        for (const ev of this.filteredEvents()) {
            const { startMinutes, endMinutes } = this.extractTimeRange(ev.time, ev.startTime, ev.endTime);
            startHour = Math.min(startHour, Math.floor(startMinutes / 60));
            endHour = Math.max(endHour, Math.ceil(endMinutes / 60));
        }

        return {
            startHour: Math.max(0, Math.min(startHour, this.DEFAULT_GRID_START_HOUR)),
            endHour: Math.min(24, Math.max(endHour, this.DEFAULT_GRID_END_HOUR)),
        };
    }

    get GRID_START_MINUTES(): number {
        return this.gridRange.startHour * 60;
    }

    get GRID_END_MINUTES(): number {
        return this.gridRange.endHour * 60;
    }

    get timeSlots(): string[] {
        const { startHour, endHour } = this.gridRange;
        const slots: string[] = [];
        for (let h = startHour; h <= endHour; h++) {
            slots.push(this.formatKhmerHour(h));
        }
        return slots;
    }

    formatKhmerHour(hour: number): string {
        const h = ((hour % 24) + 24) % 24;
        let period: string;
        let display: number;

        if (h === 0) {
            period = 'យប់';
            display = 12;
        } else if (h < 12) {
            period = 'ព្រឹក';
            display = h;
        } else if (h === 12) {
            period = 'ថ្ងៃត្រង់';
            display = 12;
        } else if (h < 17) {
            period = 'រសៀល';
            display = h - 12;
        } else if (h < 19) {
            period = 'ល្ងាច';
            display = h - 12;
        } else {
            period = 'យប់';
            display = h - 12;
        }

        return `${String(display).padStart(2, '0')}:00 ${period}`;
    }

    get currentTimeTop(): number | null {
        const now = new Date();
        const mins = now.getHours() * 60 + now.getMinutes();
        if (mins < this.GRID_START_MINUTES || mins > this.GRID_END_MINUTES) return null;
        return ((mins - this.GRID_START_MINUTES) / 60) * this.HOUR_ROW_HEIGHT;
    }

    parseSingleTimeToMinutes(timeStr?: string): number {
        if (!timeStr) return 9 * 60;
        const s = timeStr.trim().toLowerCase();
        const match = s.match(/(\d{1,2}):(\d{2})/);
        if (!match) return 9 * 60;
        
        let h = parseInt(match[1], 10);
        const m = parseInt(match[2], 10);

        if (s.includes('រសៀល') || s.includes('ល្ងាច') || s.includes('យប់')) {
            if (h < 12) h += 12;
        } else if (s.includes('ព្រឹក')) {
            if (h === 12) h = 0;
        } else if (s.includes('ថ្ងៃត្រង់')) {
            h = 12;
        }

        return h * 60 + m;
    }

    extractTimeRange(timeStr?: string, startTimeStr?: string, endTimeStr?: string): { startMinutes: number; endMinutes: number } {
        let startStr = startTimeStr;
        let endStr = endTimeStr;

        if (!startStr && timeStr) {
            if (timeStr.includes('-')) {
                const parts = timeStr.split('-');
                startStr = parts[0]?.trim();
                endStr = endStr || parts[1]?.trim();
                if (startStr && !startStr.includes('ព្រឹក') && !startStr.includes('រសៀល') && !startStr.includes('ល្ងាច') && !startStr.includes('ថ្ងៃត្រង់')) {
                    if (endStr && endStr.includes('ព្រឹក')) {
                        startStr += ' ព្រឹក';
                    } else if (endStr && (endStr.includes('រសៀល') || endStr.includes('ល្ងាច'))) {
                        const m = startStr.match(/(\d{1,2}):(\d{2})/);
                        if (m) {
                            const h = parseInt(m[1], 10);
                            if (h >= 7 && h <= 11) {
                                startStr += ' ព្រឹក';
                            } else {
                                startStr += ' រសៀល';
                            }
                        }
                    }
                }
            } else {
                startStr = timeStr;
            }
        }

        const startMinutes = this.parseSingleTimeToMinutes(startStr || '09:00 ព្រឹក');
        const endMinutes = endStr ? this.parseSingleTimeToMinutes(endStr) : startMinutes + 120;
        return { startMinutes, endMinutes };
    }

    // Helper to calculate top position from time string (exact px grid alignment)
    calculateTopPosition(timeStr?: string, startTimeStr?: string, category?: string): number {
        const { startMinutes } = this.extractTimeRange(timeStr, startTimeStr);
        const clampedStart = Math.max(this.GRID_START_MINUTES, Math.min(this.GRID_END_MINUTES, startMinutes));
        const top = ((clampedStart - this.GRID_START_MINUTES) / 60) * this.HOUR_ROW_HEIGHT;
        return Math.round(top);
    }

    calculateHeight(timeStr?: string, startTimeStr?: string, endTimeStr?: string, category?: string): number {
        const { startMinutes, endMinutes } = this.extractTimeRange(timeStr, startTimeStr, endTimeStr);
        const diffMins = Math.max(30, endMinutes - startMinutes);
        const calcHeight = (diffMins / 60) * this.HOUR_ROW_HEIGHT;
        return Math.max(48, Math.round(calcHeight));
    }

    /** Live position of an event card inside the week grid. */
    eventTop(ev: PlannerScheduleEvent): number {
        return this.calculateTopPosition(ev.time, ev.startTime);
    }

    eventHeight(ev: PlannerScheduleEvent): number {
        return this.calculateHeight(ev.time, ev.startTime, ev.endTime);
    }

    private getMondayIso(d: Date): string {
        const dayOfWeek = d.getDay(); // 0: Sun, 1: Mon...
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(d);
        monday.setDate(d.getDate() + diffToMonday);
        monday.setHours(0, 0, 0, 0);
        const y = monday.getFullYear();
        const m = String(monday.getMonth() + 1).padStart(2, '0');
        const dayNum = String(monday.getDate()).padStart(2, '0');
        return `${y}-${m}-${dayNum}`;
    }

    formatDateToIso(d: Date): string {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    getKhmerFormattedDate(dateStr: string): string {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length < 3) return dateStr;
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        const khmerDays = ['អាទិត្យ', 'ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'];
        const khmerMonths = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
        const dayName = khmerDays[d.getDay()] || '';
        const dayNum = String(d.getDate()).padStart(2, '0');
        const monthName = khmerMonths[d.getMonth()] || '';
        const yearNum = d.getFullYear();
        return `${dayName} ទី ${dayNum} ${monthName} ${yearNum}`;
    }

    /** Does this event fall on the given calendar date? Single source of truth
     *  for the week, month and day views, which used to disagree. */
    isEventOnDate(ev: PlannerScheduleEvent, date: Date): boolean {
        const targetIso = this.formatDateToIso(date);

        // 1. Event has explicit ISO dates (startDate / endDate / date)
        const sDate = (ev.startDate || ev.date || '').split('T')[0];
        if (sDate) {
            const eDate = (ev.endDate || '').split('T')[0] || sDate;
            return targetIso >= sDate && targetIso <= eDate;
        }

        // 2. Nothing to place it on. Dateless records are resolved to a real date
        //    when they are loaded, so this only guards against malformed data —
        //    it must not fall back to a weekday, which would repeat the event on
        //    every matching day of every month.
        return false;
    }

    /**
     * Legacy records carry only a dayIndex and no date. Anchor them to the week
     * they were created in so each one lands on exactly one day.
     */
    private resolveEventDates(s: BackendPlannerSchedule): { startDate: string; endDate: string } {
        const existingStart = (s.start_date || s.date || '').split('T')[0];
        if (existingStart) {
            const existingEnd = (s.end_date || '').split('T')[0] || existingStart;
            return { startDate: existingStart, endDate: existingEnd };
        }

        const anchor = s.created_at ? new Date(s.created_at) : new Date();
        const base = isNaN(anchor.getTime()) ? new Date() : anchor;
        const monday = this.getMondayDate(base);

        const startIdx = Number(s.start_day_index ?? s.day_index ?? 0) || 0;
        const endIdx = Number(s.end_day_index ?? startIdx) || startIdx;

        const start = new Date(monday);
        start.setDate(monday.getDate() + Math.max(0, Math.min(6, startIdx)));
        const end = new Date(monday);
        end.setDate(monday.getDate() + Math.max(0, Math.min(6, Math.max(startIdx, endIdx))));

        return { startDate: this.formatDateToIso(start), endDate: this.formatDateToIso(end) };
    }

    isEventInDay(ev: PlannerScheduleEvent, colIndex: number): boolean {
        const colDate = new Date(this.currentBaseDate());
        colDate.setDate(colDate.getDate() + colIndex);
        return this.isEventOnDate(ev, colDate);
    }

    // Dynamic events signal loaded from Backend API
    events = signal<PlannerScheduleEvent[]>([]);

    // Computed Filtered Events
    filteredEvents = computed(() => {
        const cat = this.selectedCategory();
        const schedMeeting = this.filterScheduleMeeting();
        const projReview = this.filterProjectReview();
        const onlineMeeting = this.filterOnlineMeeting();
        const recess = this.filterRecessBreak();
        const coffee = this.filterCoffeeDate();
        const other = this.filterOther();

        return this.events().filter(ev => {
            // Category filter
            if (cat !== 'all' && ev.category !== cat) {
                return false;
            }

            // Normalize checklist filter by matching English or Khmer keywords
            const t = (ev.type || '').toLowerCase();
            const isMeeting = t === 'meeting' || t.includes('កិច្ចប្រជុំ') || t.includes('ប្រជុំទូទៅ') || t.includes('ពិភាក្សា');
            const isReview = t === 'review' || t.includes('ត្រួតពិនិត្យ') || t.includes('ពិនិត្យ');
            const isOnline = t === 'online' || t.includes('អនឡាញ');
            const isRecess = t === 'recess' || t.includes('សម្រាកខ្លី') || t.includes('សម្រាក');
            const isCoffee = t === 'coffee' || t.includes('កាហ្វេ');

            if (isMeeting && !schedMeeting) return false;
            if (isReview && !projReview) return false;
            if (isOnline && !onlineMeeting) return false;
            if (isRecess && !recess) return false;
            if (isCoffee && !coffee) return false;
            if (!isMeeting && !isReview && !isOnline && !isRecess && !isCoffee && !other) return false;

            return true;
        });
    });

    // Dynamic Category Counts
    categoryCounts = computed(() => {
        const all = this.events();
        return {
            work: all.filter(e => e.category === 'work').length,
            myself: all.filter(e => e.category === 'myself').length,
            breaks: all.filter(e => e.category === 'breaks').length,
        };
    });

    ngOnInit(): void {
        this.loadSchedules();
    }

    loadSchedules(): void {
        this.isLoading.set(true);
        this._plannerService.getSchedules().subscribe({
            next: (res) => {
                this.isLoading.set(false);
                if (res?.data?.results) {
                    const formatCleanTime = (t: string) => {
                        if (!t) return '';
                        if (t.includes(' រសៀល - ') && t.endsWith(' រសៀល')) {
                            return t.replace(' រសៀល - ', ' - ');
                        }
                        if (t.includes(' ព្រឹក - ') && t.endsWith(' ព្រឹក')) {
                            return t.replace(' ព្រឹក - ', ' - ');
                        }
                        return t;
                    };

                    const mapped: PlannerScheduleEvent[] = res.data.results.map((s) => {
                        const { startDate, endDate } = this.resolveEventDates(s);
                        return {
                        id: s.id,
                        title: s.title,
                        time: formatCleanTime(s.time),
                        date: startDate,
                        startDate,
                        endDate,
                        dayIndex: Number(s.day_index !== undefined ? s.day_index : (s.start_day_index !== undefined ? s.start_day_index : 0)),
                        startDayIndex: s.start_day_index,
                        endDayIndex: s.end_day_index,
                        startTime: s.start_time,
                        endTime: s.end_time,
                        topPosition: this.calculateTopPosition(s.time, s.start_time, s.category),
                        height: this.calculateHeight(s.time, s.start_time, s.end_time, s.category),
                        category: s.category,
                        type: s.type,
                        colorTheme: normalizeColorTheme(s.color_theme),
                        members: (s.members || []).map((m) => ({
                            id: m.id,
                            name: m.name,
                            role: m.role || 'សមាជិក',
                            avatar: m.avatar || undefined,
                            initials: m.initials || m.name.slice(0, 2).toUpperCase(),
                            bg: m.bg || 'bg-blue-700 text-white',
                        })),
                        extraCount: s.extra_count !== undefined ? s.extra_count : Math.max(0, (s.members?.length || 0) - 2),
                        note: s.note,
                        planName: s.plan_name,
                        canModify: s.can_modify !== false,
                        };
                    });
                    this.events.set(mapped);
                }
            },
            error: () => {
                this.isLoading.set(false);
            },
        });
    }

    navigateHome(): void {
        const url = this._router.url;
        if (url.includes('/admin')) {
            this._router.navigate(['/admin/dashboard']);
        } else {
            this._router.navigate(['/member/home']);
        }
    }

    /** Sources offered by the calendar picker in the sidebar. */
    readonly calendarSources: Array<{
        value: 'all' | 'work' | 'myself' | 'breaks';
        label: string;
        sub: string;
        icon: string;
    }> = [
        { value: 'all', label: 'ប្រតិទិនទាំងអស់', sub: 'ផ្ទាល់ខ្លួន, ក្រុមការងារ', icon: 'mdi:calendar-month' },
        { value: 'work', label: 'កាលវិភាគការងារ', sub: 'ក្រុមការងារ', icon: 'mdi:briefcase-outline' },
        { value: 'myself', label: 'ផ្ទាល់ខ្លួន', sub: 'កាលវិភាគរបស់ខ្ញុំ', icon: 'mdi:account-outline' },
        { value: 'breaks', label: 'ការសម្រាក', sub: 'ពេលសម្រាក, កាហ្វេ', icon: 'mdi:coffee-outline' },
    ];

    get activeCalendarSource() {
        return this.calendarSources.find((c) => c.value === this.selectedCategory()) || this.calendarSources[0];
    }

    getCalendarSourceCount(value: 'all' | 'work' | 'myself' | 'breaks'): number {
        const counts = this.categoryCounts();
        if (value === 'all') return counts.work + counts.myself + counts.breaks;
        return counts[value];
    }

    /** Picks a source outright — unlike setCategoryFilter, which toggles. */
    selectCalendarSource(cat: 'all' | 'work' | 'myself' | 'breaks'): void {
        this.selectedCategory.set(cat);
    }

    setCategoryFilter(cat: 'all' | 'work' | 'myself' | 'breaks'): void {
        if (cat === 'all') {
            this.selectedCategory.set('all');
            return;
        }
        if (this.selectedCategory() === cat) {
            this.selectedCategory.set('all');
        } else {
            this.selectedCategory.set(cat);
        }
    }

    // Navigation methods
    goToToday(): void {
        const today = new Date();
        this.selectedDateIso.set(this.formatDateToIso(today));
        const dayOfWeek = today.getDay();
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const mondayDate = new Date(today);
        mondayDate.setDate(today.getDate() + diffToMonday);
        mondayDate.setHours(0, 0, 0, 0);
        this.currentBaseDate.set(mondayDate);
    }

    previousPeriod(): void {
        if (this.activeView() === 'day') {
            const d = new Date(this.selectedDayDate);
            d.setDate(d.getDate() - 1);
            this.selectDate(d);
        } else if (this.activeView() === 'week') {
            this.previousWeek();
        } else {
            this.previousMonth();
        }
    }

    nextPeriod(): void {
        if (this.activeView() === 'day') {
            const d = new Date(this.selectedDayDate);
            d.setDate(d.getDate() + 1);
            this.selectDate(d);
        } else if (this.activeView() === 'week') {
            this.nextWeek();
        } else {
            this.nextMonth();
        }
    }

    /** Column index used by the week grid: 0 = Monday … 6 = Sunday. */
    getDayIndex(d: Date): number {
        const dayOfWeek = d.getDay(); // 0: Sun, 1: Mon...
        return dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    }

    private getMondayDate(d: Date): Date {
        const dayOfWeek = d.getDay();
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(d);
        monday.setDate(d.getDate() + diffToMonday);
        monday.setHours(0, 0, 0, 0);
        return monday;
    }

    private shiftMonth(delta: number): void {
        const base = this.selectedDayDate;
        // Anchor on the 1st before shifting so a 31st never spills into the next month.
        const shifted = new Date(base.getFullYear(), base.getMonth() + delta, 1);
        this.selectDate(shifted);
    }

    previousMonth(): void {
        this.shiftMonth(-1);
    }

    nextMonth(): void {
        this.shiftMonth(1);
    }

    private shiftWeek(delta: number): void {
        const base = new Date(this.currentBaseDate());
        base.setDate(base.getDate() + delta * 7);
        this.currentBaseDate.set(base);

        // Keep the same weekday selected instead of snapping back to Monday.
        const selected = new Date(this.selectedDayDate);
        selected.setDate(selected.getDate() + delta * 7);
        this.selectedDateIso.set(this.formatDateToIso(selected));
    }

    previousWeek(): void {
        this.shiftWeek(-1);
    }

    nextWeek(): void {
        this.shiftWeek(1);
    }

    /** Select a concrete date and move the week strip to the week containing it. */
    selectDate(date?: Date | string | null): void {
        if (!date) return;
        const target = date instanceof Date ? new Date(date) : this.parseIsoDate(date);
        if (isNaN(target.getTime())) return;
        target.setHours(0, 0, 0, 0);

        this.selectedDateIso.set(this.formatDateToIso(target));
        this.currentBaseDate.set(this.getMondayDate(target));
    }

    setView(view: 'day' | 'week' | 'month'): void {
        this.activeView.set(view);
    }

    /**
     * Opens the create dialog pre-filled with the day the user is looking at.
     * Without this the dialog always defaulted to today, so a schedule created
     * while browsing another week silently landed outside the visible grid.
     */
    openCreateScheduleModal(date?: Date | string | null): void {
        const targetDate = date
            ? (date instanceof Date ? this.formatDateToIso(date) : date)
            : this.formatDateToIso(this.selectedDayDate);

        const dialogConfig = this._dialogConfigService.getDialogConfig({
            dayIndex: this.getDayIndex(this.parseIsoDate(targetDate)),
            category: 'work',
            time: '09:00 ព្រឹក',
            date: targetDate,
            startDate: targetDate,
            endDate: targetDate,
        });
        const dialogRef = this._matDialog.open(CreateScheduleDialogComponent, dialogConfig);
        dialogRef.afterClosed().subscribe((result: any) => {
            if (result) {
                this.isLoading.set(true);
                this._plannerService.createSchedule(result).subscribe({
                    next: () => {
                        this.loadSchedules();
                        this._snackbarService.success('បានបង្កើតកាលវិភាគថ្មីដោយជោគជ័យ');
                    },
                    error: () => {
                        this.isLoading.set(false);
                        this._snackbarService.error('មិនអាចបង្កើតកាលវិភាគថ្មីបានទេ');
                    },
                });
            }
        });
    }

    openEditScheduleModal(schedule: PlannerScheduleEvent): void {
        const dialogConfig = this._dialogConfigService.getDialogConfig({
            schedule,
            isEdit: true,
        });
        const dialogRef = this._matDialog.open(CreateScheduleDialogComponent, dialogConfig);
        dialogRef.afterClosed().subscribe((result: any) => {
            if (result && result.id) {
                this.isLoading.set(true);
                this._plannerService.updateSchedule(result.id, result).subscribe({
                    next: () => {
                        this.loadSchedules();
                        this._snackbarService.success('បានកែប្រែកាលវិភាគដោយជោគជ័យ');
                    },
                    error: () => {
                        this.isLoading.set(false);
                        this._snackbarService.error('មិនអាចកែប្រែកាលវិភាគបានទេ');
                    },
                });
            }
        });
    }

    openScheduleDetailModal(schedule: PlannerScheduleEvent): void {
        const dialogConfig = this._dialogConfigService.getDialogConfig({
            schedule,
            canModify: schedule.canModify !== false,
        });
        const dialogRef = this._matDialog.open(ScheduleDetailDialogComponent, dialogConfig);
        dialogRef.afterClosed().subscribe((res: any) => {
            if (res && res.action === 'delete' && res.id) {
                this.isLoading.set(true);
                this._plannerService.deleteSchedule(res.id).subscribe({
                    next: () => {
                        this.loadSchedules();
                        this._snackbarService.success('បានលុបកាលវិភាគដោយជោគជ័យ');
                    },
                    error: () => {
                        this.isLoading.set(false);
                        this._snackbarService.error('មិនអាចលុបកាលវិភាគបានទេ');
                    },
                });
            } else if (res && res.action === 'edit' && res.schedule) {
                this.openEditScheduleModal(res.schedule);
            }
        });
    }

    // Helper for pastel theme styles
    getEventThemeClasses(theme?: string): {
        card: string;
        timeTag: string;
        title: string;
    } {
        switch (normalizeColorTheme(theme)) {
            case 'peach':
                return {
                    card: 'bg-[#fff5ee] dark:bg-amber-950/40 border-t-[3px] border-[#f97316] text-slate-800 dark:text-slate-100',
                    timeTag: 'text-[#ea580c] dark:text-[#fb923c]',
                    title: 'text-slate-900 dark:text-white',
                };
            case 'lavender':
                return {
                    card: 'bg-[#eff3ff] dark:bg-indigo-950/40 border-t-[3px] border-[#6366f1] text-slate-800 dark:text-slate-100',
                    timeTag: 'text-[#4f46e5] dark:text-[#818cf8]',
                    title: 'text-slate-900 dark:text-white',
                };
            case 'pink':
                return {
                    card: 'bg-[#fff1f2] dark:bg-rose-950/40 border-t-[3px] border-[#f43f5e] text-slate-800 dark:text-slate-100',
                    timeTag: 'text-[#e11d48] dark:text-[#fb7185]',
                    title: 'text-slate-900 dark:text-white',
                };
            case 'mint':
            default:
                return {
                    card: 'bg-[#ecfdf5] dark:bg-emerald-950/40 border-t-[3px] border-[#10b981] text-slate-800 dark:text-slate-100',
                    timeTag: 'text-[#059669] dark:text-[#34d399]',
                    title: 'text-slate-900 dark:text-white',
                };
        }
    }

    /**
     * Day-list styling. Kept separate from getEventThemeClasses, whose card style
     * carries a top border that collided with the list row's left accent bar.
     */
    getEventAccentClasses(theme?: string): { bar: string; time: string; chip: string; ring: string } {
        switch (normalizeColorTheme(theme)) {
            case 'lavender':
                return {
                    bar: 'bg-[#6366f1]',
                    time: 'text-[#4f46e5] dark:text-[#818cf8]',
                    chip: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300',
                    ring: 'hover:border-indigo-300 dark:hover:border-indigo-800',
                };
            case 'pink':
                return {
                    bar: 'bg-[#f43f5e]',
                    time: 'text-[#e11d48] dark:text-[#fb7185]',
                    chip: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
                    ring: 'hover:border-rose-300 dark:hover:border-rose-800',
                };
            case 'mint':
                return {
                    bar: 'bg-[#10b981]',
                    time: 'text-[#059669] dark:text-[#34d399]',
                    chip: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
                    ring: 'hover:border-emerald-300 dark:hover:border-emerald-800',
                };
            case 'peach':
            default:
                return {
                    bar: 'bg-[#f97316]',
                    time: 'text-[#ea580c] dark:text-[#fb923c]',
                    chip: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
                    ring: 'hover:border-amber-300 dark:hover:border-amber-800',
                };
        }
    }

    /** Start / end of an event as separate labels for the day list's time column. */
    getEventStartLabel(ev: PlannerScheduleEvent): string {
        if (ev.startTime) return ev.startTime.trim();
        const parts = (ev.time || '').split('-');
        return (parts[0] || '').trim();
    }

    getEventEndLabel(ev: PlannerScheduleEvent): string {
        if (ev.endTime) return ev.endTime.trim();
        const parts = (ev.time || '').split('-');
        return parts.length > 1 ? (parts[1] || '').trim() : '';
    }

    /** Human duration, e.g. "8 ម៉ោង 30 នាទី". */
    getEventDuration(ev: PlannerScheduleEvent): string {
        const { startMinutes, endMinutes } = this.extractTimeRange(ev.time, ev.startTime, ev.endTime);
        const total = Math.max(0, endMinutes - startMinutes);
        if (total === 0) return '';
        const h = Math.floor(total / 60);
        const m = total % 60;
        if (h && m) return `${h} ម៉ោង ${m} នាទី`;
        if (h) return `${h} ម៉ោង`;
        return `${m} នាទី`;
    }

    getEventCategoryLabel(category?: string): string {
        switch (category) {
            case 'work':
                return 'ការងារ';
            case 'myself':
                return 'ផ្ទាល់ខ្លួន';
            case 'breaks':
                return 'ការសម្រាក';
            default:
                return 'ទូទៅ';
        }
    }

    getEventPillClasses(theme?: string): string {
        switch (normalizeColorTheme(theme)) {
            case 'lavender':
                return 'bg-[#8b5cf6] text-white hover:bg-[#7c3aed]';
            case 'mint':
                return 'bg-[#10b981] text-white hover:bg-[#059669]';
            case 'peach':
                return 'bg-[#f59e0b] text-white hover:bg-[#d97706]';
            case 'pink':
                return 'bg-[#ec4899] text-white hover:bg-[#db2777]';
            default:
                return 'bg-[#3b82f6] text-white hover:bg-[#2563eb]';
        }
    }
}
