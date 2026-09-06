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
            font-size: 16px;
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

    // Current Active Date State
    currentBaseDate = signal<Date>(new Date(2026, 2, 2)); // 2 March 2026
    selectedMiniCalendarDay = signal<number>(5);
    activeView = signal<'day' | 'week' | 'month'>('week');

    // Filter Checkboxes for "My Schedule"
    filterScheduleMeeting = signal<boolean>(true);
    filterProjectReview = signal<boolean>(true);
    filterOnlineMeeting = signal<boolean>(true);
    filterRecessBreak = signal<boolean>(true);
    filterCoffeeDate = signal<boolean>(true);
    filterOther = signal<boolean>(true);

    // Filter Categories
    selectedCategory = signal<'all' | 'work' | 'myself' | 'breaks'>('all');

    // Days Columns (Week View - 6 days matching screenshot: 2 មីនា ដល់ 7 មីនា)
    get dayColumns(): DayColumn[] {
        const base = new Date(this.currentBaseDate());
        const khmerDays = ['ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'];
        const englishDays = ['ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'];
        const subTimes = ['05:00:19', '06:00:19', '06:00:19', '07:00:19', '07:30:19', '08:00:19'];

        const cols: DayColumn[] = [];
        for (let i = 0; i < 6; i++) {
            const d = new Date(base);
            d.setDate(base.getDate() + i);
            cols.push({
                nameKh: khmerDays[i],
                nameEn: khmerDays[i],
                dateNum: d.getDate(),
                subTime: subTimes[i] || '08:00:00',
                fullDate: d,
                isCurrent: d.getDate() === this.selectedMiniCalendarDay(),
            });
        }
        return cols;
    }

    // Month Label
    get currentMonthLabel(): string {
        const d = this.currentBaseDate();
        const khmerMonths = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
        return `${khmerMonths[d.getMonth()]} ${d.getFullYear()}`;
    }

    // Mini Calendar Days
    get miniCalendarGrid(): Array<{ empty: boolean; dayNum?: number; isSelected?: boolean; isToday?: boolean }> {
        const d = this.currentBaseDate();
        const year = d.getFullYear();
        const month = d.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const startDayIndex = firstDay.getDay(); // 0: Sun, 1: Mon...
        const grid: Array<{ empty: boolean; dayNum?: number; isSelected?: boolean; isToday?: boolean }> = [];

        for (let i = 0; i < startDayIndex; i++) {
            grid.push({ empty: true });
        }

        for (let day = 1; day <= lastDay.getDate(); day++) {
            grid.push({
                empty: false,
                dayNum: day,
                isSelected: day === this.selectedMiniCalendarDay(),
                isToday: day === 5,
            });
        }

        return grid;
    }

    // Time Slots (from 12PM to 6PM)
    timeSlots = ['12:00 ថ្ងៃត្រង់', '01:00 រសៀល', '02:00 រសៀល', '03:00 រសៀល', '04:00 រសៀល', '05:00 រសៀល', '06:00 ល្ងាច'];

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

            // Checklist filter
            if (ev.type === 'meeting' && !schedMeeting) return false;
            if (ev.type === 'review' && !projReview) return false;
            if (ev.type === 'online' && !onlineMeeting) return false;
            if (ev.type === 'recess' && !recess) return false;
            if (ev.type === 'coffee' && !coffee) return false;
            if (ev.type === 'other' && !other) return false;

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
                        dayIndex: Number(s.day_index !== undefined ? s.day_index : (s.start_day_index !== undefined ? s.start_day_index : 0)),
                        startDayIndex: s.start_day_index,
                        endDayIndex: s.end_day_index,
                        startTime: s.start_time,
                        endTime: s.end_time,
                        topPosition: s.top_position || 100,
                        height: s.height || 110,
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
    previousMonth(): void {
        const d = new Date(this.currentBaseDate());
        d.setMonth(d.getMonth() - 1);
        this.currentBaseDate.set(d);
    }

    nextMonth(): void {
        const d = new Date(this.currentBaseDate());
        d.setMonth(d.getMonth() + 1);
        this.currentBaseDate.set(d);
    }

    previousWeek(): void {
        const d = new Date(this.currentBaseDate());
        d.setDate(d.getDate() - 7);
        this.currentBaseDate.set(d);
    }

    nextWeek(): void {
        const d = new Date(this.currentBaseDate());
        d.setDate(d.getDate() + 7);
        this.currentBaseDate.set(d);
    }

    selectMiniDay(day?: number): void {
        if (!day) return;
        this.selectedMiniCalendarDay.set(day);
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
                this._plannerService.createSchedule(result).subscribe({
                    next: () => {
                        this.loadSchedules();
                    },
                    error: () => {
                        // Optimistic fallback
                        const fallbackEv: PlannerScheduleEvent = {
                            id: 'ev_' + Date.now(),
                            title: result.title,
                            time: result.time,
                            dayIndex: Number(result.day_index || 0),
                            topPosition: 120,
                            height: 95,
                            category: result.category,
                            type: result.type,
                            colorTheme: result.color_theme || 'peach',
                            members: result.members || [],
                            extraCount: Math.max(0, (result.members?.length || 0) - 2),
                            note: result.note,
                        };
                        this.events.update((list) => [...list, fallbackEv]);
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
}
