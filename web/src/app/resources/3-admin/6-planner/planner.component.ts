import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { DialogConfigService } from 'app/shared/dialog-config.service';
import { CreateScheduleDialogComponent } from './create-schedule-dialog/create-schedule-dialog.component';
import { ScheduleDetailDialogComponent } from './schedule-detail-dialog/schedule-detail-dialog.component';
import { PlannerService, BackendPlannerSchedule } from './planner.service';

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

@Component({
    selector: 'app-planner',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatIconModule,
        MatTooltipModule,
        MatDialogModule,
    ],
    templateUrl: './planner.component.html',
    styles: [`
        :host {
            font-family: 'Kantumruy Pro', sans-serif !important;
            font-size: 14px;
            font-weight: 400;
            display: flex;
            flex-direction: column;
            flex: 1 1 auto;
            width: 100%;
            min-height: 100vh;
        }

        .planner-root {
            font-family: 'Kantumruy Pro', sans-serif !important;
            font-weight: 400;
        }

        .planner-root *:not(.mat-icon):not([class*='material-icons']):not([class*='icon-']):not([class*='mdi']) {
            font-family: 'Kantumruy Pro', sans-serif !important;
        }

        /* Custom Scrollbar for time grid */
        .custom-calendar-scroll::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }
        .custom-calendar-scroll::-webkit-scrollbar-thumb {
            background-color: rgba(148, 163, 184, 0.4);
            border-radius: 9999px;
        }
        .custom-calendar-scroll::-webkit-scrollbar-track {
            background: transparent;
        }
    `],
})
export class PlannerComponent implements OnInit {
    private _router = inject(Router);
    private _matDialog = inject(MatDialog);
    private _dialogConfigService = inject(DialogConfigService);
    private _plannerService = inject(PlannerService);

    isLoading = signal<boolean>(false);

    // Current Active Date State (Defaults to current date / today)
    currentBaseDate = signal<Date>(this.getInitialMonday());
    selectedMiniCalendarDay = signal<number>(new Date().getDate());
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
        const selectedDay = this.selectedMiniCalendarDay();

        const cols: DayColumn[] = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(base);
            d.setDate(base.getDate() + i);
            const isToday = d.toDateString() === today.toDateString();
            const isSelected = d.getDate() === selectedDay && d.getMonth() === this.currentBaseDate().getMonth();
            const isCurrent = isToday || isSelected;
            
            // Calculate total scheduled time for this day column
            const dayEvents = this.filteredEvents ? this.filteredEvents().filter(e => this.isEventInDay(e, i)) : [];
            let totalHoursStr = '00:00:00';
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
            });
        }
        return cols;
    }

    // Selected Day Date & Events for Day View
    get selectedDayDate(): Date {
        const base = this.currentBaseDate();
        const year = base.getFullYear();
        const month = base.getMonth();
        const day = this.selectedMiniCalendarDay();
        return new Date(year, month, day);
    }

    get headerTitle(): string {
        if (this.activeView() === 'day') {
            return this.getKhmerFormattedDate(this.formatDateToIso(this.selectedDayDate));
        }
        return this.currentMonthLabel;
    }

    get selectedDayEvents(): PlannerScheduleEvent[] {
        const targetIso = this.formatDateToIso(this.selectedDayDate);
        return this.filteredEvents().filter(ev => {
            const sDate = (ev.startDate || ev.date || '').split('T')[0];
            const eDate = (ev.endDate || sDate || '').split('T')[0];
            if (sDate) {
                return targetIso >= sDate && targetIso <= (eDate || sDate);
            }
            const dayOfWeek = this.selectedDayDate.getDay();
            const colIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            const sIdx = ev.startDayIndex !== undefined ? ev.startDayIndex : ev.dayIndex;
            const eIdx = ev.endDayIndex !== undefined ? ev.endDayIndex : sIdx;
            return colIndex >= (sIdx ?? 0) && colIndex <= (eIdx ?? 0);
        });
    }

    // Month Label
    get currentMonthLabel(): string {
        const d = this.currentBaseDate();
        const khmerMonths = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
        return `${khmerMonths[d.getMonth()]} ${d.getFullYear()}`;
    }

    // Mini Calendar Days
    get miniCalendarGrid(): Array<{ empty: boolean; dayNum?: number; isSelected?: boolean; isToday?: boolean; fullDate?: Date }> {
        const d = this.currentBaseDate();
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
            const isSelected = day === this.selectedMiniCalendarDay();
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
        const base = this.currentBaseDate();
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

                const dayEvents = filtered.filter(ev => {
                    const sDate = (ev.startDate || ev.date || '').split('T')[0];
                    const eDate = (ev.endDate || sDate || '').split('T')[0];
                    if (sDate) {
                        return dateIso >= sDate && dateIso <= (eDate || sDate);
                    }
                    return false;
                });

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

    // Time Slots (from 08:00 AM to 06:00 PM - matching calendar grid)
    timeSlots = [
        '08:00 ព្រឹក',
        '09:00 ព្រឹក',
        '10:00 ព្រឹក',
        '11:00 ព្រឹក',
        '12:00 ថ្ងៃត្រង់',
        '01:00 រសៀល',
        '02:00 រសៀល',
        '03:00 រសៀល',
        '04:00 រសៀល',
        '05:00 រសៀល',
        '06:00 ល្ងាច'
    ];

    readonly GRID_START_MINUTES = 8 * 60; // 08:00 AM (480 mins)
    readonly HOUR_ROW_HEIGHT = 60; // 60px per hour

    get currentTimeTop(): number | null {
        const now = new Date();
        const mins = now.getHours() * 60 + now.getMinutes();
        if (mins < this.GRID_START_MINUTES || mins > 18 * 60) return null;
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
        const clampedStart = Math.max(this.GRID_START_MINUTES, Math.min(18 * 60, startMinutes));
        const top = ((clampedStart - this.GRID_START_MINUTES) / 60) * this.HOUR_ROW_HEIGHT;
        return Math.round(top);
    }

    calculateHeight(timeStr?: string, startTimeStr?: string, endTimeStr?: string, category?: string): number {
        const { startMinutes, endMinutes } = this.extractTimeRange(timeStr, startTimeStr, endTimeStr);
        const diffMins = Math.max(30, endMinutes - startMinutes);
        const calcHeight = (diffMins / 60) * this.HOUR_ROW_HEIGHT;
        return Math.max(48, Math.round(calcHeight));
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

    isEventInDay(ev: PlannerScheduleEvent, colIndex: number): boolean {
        const base = new Date(this.currentBaseDate());
        const colDate = new Date(base);
        colDate.setDate(base.getDate() + colIndex);
        const colDateIso = this.formatDateToIso(colDate);

        // 1. If event has explicit ISO dates (startDate / endDate / date)
        const sDate = ev.startDate || ev.date;
        const eDate = ev.endDate || sDate;

        if (sDate) {
            const actualStart = sDate.split('T')[0];
            const actualEnd = eDate ? eDate.split('T')[0] : actualStart;
            return colDateIso >= actualStart && colDateIso <= actualEnd;
        }

        // 2. For legacy items without dates, match dayIndex
        const sIdx = ev.startDayIndex !== undefined ? ev.startDayIndex : ev.dayIndex;
        const eIdx = ev.endDayIndex !== undefined ? ev.endDayIndex : sIdx;

        const minIdx = Math.min(sIdx !== undefined ? sIdx : 0, eIdx !== undefined ? eIdx : 0);
        const maxIdx = Math.max(sIdx !== undefined ? sIdx : 0, eIdx !== undefined ? eIdx : 0);

        return colIndex >= minIdx && colIndex <= maxIdx;
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
        this._plannerService.getSchedules({ admin: 'true' }).subscribe({
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

                    const mapped: PlannerScheduleEvent[] = res.data.results.map((s) => ({
                        id: s.id,
                        title: s.title,
                        time: formatCleanTime(s.time),
                        date: s.date || s.start_date || (s.created_at ? s.created_at.split('T')[0] : undefined),
                        startDate: s.start_date || s.date || (s.created_at ? s.created_at.split('T')[0] : undefined),
                        endDate: s.end_date || s.date || s.start_date || (s.created_at ? s.created_at.split('T')[0] : undefined),
                        dayIndex: Number(s.day_index !== undefined ? s.day_index : (s.start_day_index !== undefined ? s.start_day_index : 0)),
                        startDayIndex: s.start_day_index,
                        endDayIndex: s.end_day_index,
                        startTime: s.start_time,
                        endTime: s.end_time,
                        topPosition: this.calculateTopPosition(s.time, s.start_time, s.category),
                        height: this.calculateHeight(s.time, s.start_time, s.end_time, s.category),
                        category: s.category,
                        type: s.type,
                        colorTheme: (s.color_theme as any) || 'peach',
                        members: (s.members || []).map((m) => ({
                            name: m.name,
                            avatar: m.avatar || undefined,
                            initials: m.initials || m.name.slice(0, 2).toUpperCase(),
                            bg: m.bg || 'bg-blue-700 text-white',
                        })),
                        extraCount: s.extra_count !== undefined ? s.extra_count : Math.max(0, (s.members?.length || 0) - 2),
                        note: s.note,
                        planName: s.plan_name,
                    }));
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
        this.selectedMiniCalendarDay.set(today.getDate());
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
            this.selectedMiniCalendarDay.set(d.getDate());
            const monday = this.getMondayDate(d);
            this.currentBaseDate.set(monday);
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
            this.selectedMiniCalendarDay.set(d.getDate());
            const monday = this.getMondayDate(d);
            this.currentBaseDate.set(monday);
        } else if (this.activeView() === 'week') {
            this.nextWeek();
        } else {
            this.nextMonth();
        }
    }

    private getMondayDate(d: Date): Date {
        const dayOfWeek = d.getDay();
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(d);
        monday.setDate(d.getDate() + diffToMonday);
        monday.setHours(0, 0, 0, 0);
        return monday;
    }

    previousMonth(): void {
        const d = new Date(this.currentBaseDate());
        d.setMonth(d.getMonth() - 1);
        this.currentBaseDate.set(d);
        this.selectedMiniCalendarDay.set(1);
    }

    nextMonth(): void {
        const d = new Date(this.currentBaseDate());
        d.setMonth(d.getMonth() + 1);
        this.currentBaseDate.set(d);
        this.selectedMiniCalendarDay.set(1);
    }

    previousWeek(): void {
        const d = new Date(this.currentBaseDate());
        d.setDate(d.getDate() - 7);
        this.currentBaseDate.set(d);
        this.selectedMiniCalendarDay.set(d.getDate());
    }

    nextWeek(): void {
        const d = new Date(this.currentBaseDate());
        d.setDate(d.getDate() + 7);
        this.currentBaseDate.set(d);
        this.selectedMiniCalendarDay.set(d.getDate());
    }

    selectMiniDay(day?: number): void {
        if (!day) return;
        this.selectedMiniCalendarDay.set(day);
        
        // Calculate the Monday of the week containing this day in the currently displayed month
        const currentMonth = this.currentBaseDate().getMonth();
        const currentYear = this.currentBaseDate().getFullYear();
        const targetDate = new Date(currentYear, currentMonth, day);
        
        const dayOfWeek = targetDate.getDay(); // 0: Sun, 1: Mon, 2: Tue...
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        
        const mondayDate = new Date(targetDate);
        mondayDate.setDate(targetDate.getDate() + diffToMonday);
        mondayDate.setHours(0, 0, 0, 0);
        this.currentBaseDate.set(mondayDate);
    }

    setView(view: 'day' | 'week' | 'month'): void {
        this.activeView.set(view);
    }

    openCreateScheduleModal(): void {
        const dialogConfig = this._dialogConfigService.getDialogConfig({
            dayIndex: 2,
            category: 'work',
            time: '09:00 ព្រឹក',
        });
        const dialogRef = this._matDialog.open(CreateScheduleDialogComponent, dialogConfig);
        dialogRef.afterClosed().subscribe((result: any) => {
            if (result) {
                const tempId = 'sch_' + Date.now();
                const calcTop = this.calculateTopPosition(result.time, result.start_time, result.category);
                const calcHeight = this.calculateHeight(result.time, result.start_time, result.end_time, result.category);
                const optimisticEv: PlannerScheduleEvent = {
                    id: tempId,
                    title: result.title,
                    time: result.time,
                    date: result.date || result.start_date,
                    startDate: result.start_date || result.date,
                    endDate: result.end_date || result.date || result.start_date,
                    dayIndex: Number(result.day_index !== undefined ? result.day_index : 2),
                    startDayIndex: result.start_day_index,
                    endDayIndex: result.end_day_index,
                    startTime: result.start_time,
                    endTime: result.end_time,
                    topPosition: calcTop,
                    height: calcHeight,
                    category: result.category,
                    type: result.type,
                    colorTheme: result.color_theme || 'peach',
                    members: result.members || [],
                    extraCount: Math.max(0, (result.members?.length || 0) - 2),
                    note: result.note,
                };

                // Immediate UI update
                this.events.update((list) => [optimisticEv, ...list]);

                // Sync with backend API
                this._plannerService.createSchedule(result).subscribe({
                    next: (res) => {
                        if (res?.data?.id) {
                            this.events.update((list) =>
                                list.map((item) => (item.id === tempId ? { ...item, id: res.data.id } : item))
                            );
                        }
                    },
                    error: () => {
                        // Keep optimistic event in UI
                    },
                });
            }
        });
    }

    openScheduleDetailModal(schedule: PlannerScheduleEvent): void {
        const dialogConfig = this._dialogConfigService.getDialogConfig({
            schedule,
        });
        const dialogRef = this._matDialog.open(ScheduleDetailDialogComponent, dialogConfig);
        dialogRef.afterClosed().subscribe((res: any) => {
            if (res && res.action === 'delete' && res.id) {
                this._plannerService.deleteSchedule(res.id).subscribe({
                    next: () => {
                        this.loadSchedules();
                    },
                    error: () => {
                        this.events.update((list) => list.filter((e) => e.id !== res.id));
                    },
                });
            }
        });
    }

    // Helper for pastel theme styles
    getEventThemeClasses(theme: 'peach' | 'lavender' | 'pink' | 'mint'): {
        card: string;
        timeTag: string;
        title: string;
    } {
        switch (theme) {
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
                return {
                    card: 'bg-[#ecfdf5] dark:bg-emerald-950/40 border-t-[3px] border-[#10b981] text-slate-800 dark:text-slate-100',
                    timeTag: 'text-[#059669] dark:text-[#34d399]',
                    title: 'text-slate-900 dark:text-white',
                };
        }
    }

    getEventPillClasses(theme: 'peach' | 'lavender' | 'pink' | 'mint' | string): string {
        switch (theme) {
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
