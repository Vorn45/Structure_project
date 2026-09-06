import { CommonModule } from '@angular/common';
import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import * as echarts from 'echarts';
import { AdminService, AdminStats } from '../admin.service';

import { UserService } from 'app/core/user/user.service';

export interface DashboardMetricCard {
    id: string;
    title: string;
    title_kh: string;
    value: string;
    change: string;
    badgeClass: string;
    icon: string;
    iconBg: string;
    iconColor: string;
    linkUrl: string;
    sparklineColor: string;
    sparklineFill: string;
    sparklineData: number[];
}

export interface TeamMemberPerformer {
    id: string;
    name: string;
    name_kh: string;
    email: string;
    role: string;
    avatar: string;
    initials: string;
    avatarBg: string;
}

export interface ScheduledMeeting {
    id: string;
    title: string;
    time: string;
    dateGroup: 'today' | 'upcoming' | string;
    dateLabel: string;
    badgeColor: string;
    borderClass: string;
    members: string[];
    extraCount: number;
}

const INITIAL_STATS: AdminStats = {
    kpi: {
        total_projects: 3,
        active_projects: 2,
        completed_projects: 0,
        planning_projects: 1,
        total_tasks: 4235,
        completed_tasks: 3480,
        task_completion_rate: 82,
        active_users: 18,
        total_users: 22,
        pending_leaves: 3,
    },
    projects_summary: [],
    department_stats: [],
    recent_activity: [],
};

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatIconModule,
        MatTooltipModule,
    ],
    templateUrl: './admin-dashboard.component.html',
    styles: [`
        app-admin-dashboard,
        .admin-dashboard-root,
        .admin-dashboard-root * {
            font-family: 'Kantumruy Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            font-weight: 500 !important;
        }

        .admin-dashboard-root {
            font-size: 16px !important;
            line-height: 1.6;
            color: #0f172a !important;
        }

        .avatar-overlap {
            margin-left: -8px;
        }
        .avatar-overlap:first-child {
            margin-left: 0;
        }
    `],
})
export class AdminDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
    private readonly _adminService = inject(AdminService);
    private readonly _userService = inject(UserService);
    private readonly _router = inject(Router);

    @ViewChild('trendChartRef') trendChartRef!: ElementRef<HTMLDivElement>;
    @ViewChild('distributionChartRef') distributionChartRef!: ElementRef<HTMLDivElement>;

    private _chart?: echarts.ECharts;
    private _distributionChart?: echarts.ECharts;
    private _sparklineCharts: echarts.ECharts[] = [];
    private _resizeObserver?: ResizeObserver;

    userName = signal<string>('ពិសិទ្ធិ បញ្ញាវន្ត័');
    userGreeting = signal<string>('អរុណសួស្តី');
    userAvatarUrl = signal<string | null>(null);
    userInitials = signal<string>('PP');

    stats = signal<AdminStats>(INITIAL_STATS);
    loading = signal<boolean>(false);

    // Filter controls
    activePerformerPeriod = signal<'1d' | '7d' | '1m' | '1y' | 'all'>('7d');
    calendarBaseDate = signal<Date>(new Date(2026, 0, 19)); // 19 Jan 2026
    activeCalendarDay = signal<number>(19);

    get calendarMonthLabel(): string {
        const d = this.calendarBaseDate();
        const khmerMonths = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
        return `${khmerMonths[d.getMonth()]} ${d.getFullYear()}`;
    }

    get calendarDaysList(): Array<{ name: string; date: number; fullDate: Date; isCurrent: boolean }> {
        const base = new Date(this.calendarBaseDate());
        const dayOfWeek = base.getDay(); // 0 (Sun) to 6 (Sat)
        const diffToMonday = (dayOfWeek + 6) % 7; // Monday = 0
        const monday = new Date(base);
        monday.setDate(base.getDate() - diffToMonday);

        const khmerDays = ['ចន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហ', 'សុក្រ', 'សៅរ៍', 'អាទិត្យ'];
        const days: Array<{ name: string; date: number; fullDate: Date; isCurrent: boolean }> = [];

        for (let i = 0; i < 7; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            days.push({
                name: khmerDays[i],
                date: d.getDate(),
                fullDate: d,
                isCurrent: d.getDate() === this.activeCalendarDay(),
            });
        }
        return days;
    }

    // Date Range Filter Popover State matching reference
    isDateFilterOpen = signal<boolean>(false);
    activePreset = signal<string>('this_month');
    selectedDateRangeLabel = signal<string>('1 កញ្ញា - 30 កញ្ញា 2026');
    tempStartDate = signal<Date>(new Date(2026, 8, 1)); // 1 Sep 2026
    tempEndDate = signal<Date>(new Date(2026, 8, 30)); // 30 Sep 2026
    pickerMonthDate = signal<Date>(new Date(2026, 8, 1));

    datePresets = [
        { id: 'today', label: 'ថ្ងៃនេះ' },
        { id: 'yesterday', label: 'ម្សិលមិញ' },
        { id: 'this_week', label: 'សប្តាហ៍នេះ' },
        { id: 'last_week', label: 'សប្តាហ៍មុន' },
        { id: 'this_month', label: 'ខែនេះ' },
        { id: 'last_month', label: 'ខែមុន' },
        { id: 'this_year', label: 'ឆ្នាំនេះ' },
        { id: 'last_7_days', label: '7 ថ្ងៃចុងក្រោយ' },
        { id: 'last_14_days', label: '14 ថ្ងៃចុងក្រោយ' },
        { id: 'last_30_days', label: '30 ថ្ងៃចុងក្រោយ' },
    ];

    get pickerMonthLabel(): string {
        const d = this.pickerMonthDate();
        const khmerMonths = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
        return `${khmerMonths[d.getMonth()]} ${d.getFullYear()}`;
    }

    get temporaryRangeLabel(): string {
        const s = this.tempStartDate();
        const e = this.tempEndDate();
        const khmerMonths = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
        return `${s.getDate()} ${khmerMonths[s.getMonth()]} - ${e.getDate()} ${khmerMonths[e.getMonth()]}`;
    }

    get pickerDaysGrid(): Array<{ empty: boolean; dayNum?: number; date?: Date; isStart?: boolean; isEnd?: boolean; isInRange?: boolean }> {
        const month = this.pickerMonthDate().getMonth();
        const year = this.pickerMonthDate().getFullYear();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        let startDayOfWeek = (firstDay.getDay() + 6) % 7;
        const grid: Array<{ empty: boolean; dayNum?: number; date?: Date; isStart?: boolean; isEnd?: boolean; isInRange?: boolean }> = [];

        for (let i = 0; i < startDayOfWeek; i++) {
            grid.push({ empty: true });
        }

        const start = this.tempStartDate();
        const end = this.tempEndDate();

        for (let d = 1; d <= lastDay.getDate(); d++) {
            const cur = new Date(year, month, d);
            const isStart = cur.toDateString() === start.toDateString();
            const isEnd = cur.toDateString() === end.toDateString();
            const isInRange = cur >= start && cur <= end;

            grid.push({
                empty: false,
                dayNum: d,
                date: cur,
                isStart,
                isEnd,
                isInRange,
            });
        }

        return grid;
    }

    toggleDateFilterModal(): void {
        this.isDateFilterOpen.update((v) => !v);
    }

    closeDateFilter(): void {
        this.isDateFilterOpen.set(false);
    }

    previousPickerMonth(): void {
        const d = new Date(this.pickerMonthDate());
        d.setMonth(d.getMonth() - 1);
        this.pickerMonthDate.set(d);
    }

    nextPickerMonth(): void {
        const d = new Date(this.pickerMonthDate());
        d.setMonth(d.getMonth() + 1);
        this.pickerMonthDate.set(d);
    }

    selectPreset(presetId: string): void {
        this.activePreset.set(presetId);
        const ref = new Date(2026, 8, 30);
        let s = new Date(ref);
        let e = new Date(ref);

        if (presetId === 'today') {
            s = new Date(ref);
            e = new Date(ref);
        } else if (presetId === 'yesterday') {
            s = new Date(ref);
            s.setDate(ref.getDate() - 1);
            e = new Date(s);
        } else if (presetId === 'this_week') {
            s = new Date(ref);
            s.setDate(ref.getDate() - 6);
            e = new Date(ref);
        } else if (presetId === 'last_week') {
            s = new Date(ref);
            s.setDate(ref.getDate() - 13);
            e = new Date(ref);
            e.setDate(ref.getDate() - 7);
        } else if (presetId === 'this_month') {
            s = new Date(ref.getFullYear(), ref.getMonth(), 1);
            e = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
        } else if (presetId === 'last_month') {
            s = new Date(ref.getFullYear(), ref.getMonth() - 1, 1);
            e = new Date(ref.getFullYear(), ref.getMonth(), 0);
        } else if (presetId === 'this_year') {
            s = new Date(ref.getFullYear(), 0, 1);
            e = new Date(ref.getFullYear(), 11, 31);
        } else if (presetId === 'last_7_days') {
            s = new Date(ref);
            s.setDate(ref.getDate() - 7);
        } else if (presetId === 'last_14_days') {
            s = new Date(ref);
            s.setDate(ref.getDate() - 14);
        } else if (presetId === 'last_30_days') {
            s = new Date(ref);
            s.setDate(ref.getDate() - 30);
        }

        this.tempStartDate.set(s);
        this.tempEndDate.set(e);
        this.pickerMonthDate.set(new Date(s.getFullYear(), s.getMonth(), 1));
    }

    selectPickerDate(d?: Date): void {
        if (!d) return;
        const s = this.tempStartDate();
        const e = this.tempEndDate();

        if (s && e && s.getTime() !== e.getTime()) {
            this.tempStartDate.set(d);
            this.tempEndDate.set(d);
            this.activePreset.set('custom');
        } else if (s && d < s) {
            this.tempStartDate.set(d);
            this.activePreset.set('custom');
        } else if (s) {
            this.tempEndDate.set(d);
            this.activePreset.set('custom');
        }
    }

    applyDateFilter(): void {
        const s = this.tempStartDate();
        const e = this.tempEndDate();
        const khmerMonths = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
        this.selectedDateRangeLabel.set(`${s.getDate()} ${khmerMonths[s.getMonth()]} - ${e.getDate()} ${khmerMonths[e.getMonth()]} ${e.getFullYear()}`);
        this.calendarBaseDate.set(s);
        this.activeCalendarDay.set(s.getDate());
        this.closeDateFilter();
    }

    // Top 3 Metric Cards representing core admin pillars
    kpiCards: DashboardMetricCard[] = [
        {
            id: 'members',
            title: 'Total Members',
            title_kh: 'បុគ្គលិកសរុប',
            value: '5',
            change: '+12%',
            badgeClass: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400',
            icon: 'mdi:account-group-outline',
            iconBg: '',
            iconColor: 'text-blue-600 dark:text-blue-400',
            linkUrl: '/admin/users',
            sparklineColor: '#2563eb',
            sparklineFill: 'rgba(37, 99, 235, 0.18)',
            sparklineData: [4, 6, 5, 8, 7, 10, 12],
        },
        {
            id: 'projects',
            title: 'Active Projects',
            title_kh: 'គម្រោងសកម្ម',
            value: '2',
            change: '+8%',
            badgeClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
            icon: 'mdi:folder-outline',
            iconBg: '',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
            linkUrl: '/admin/projects',
            sparklineColor: '#10b981',
            sparklineFill: 'rgba(16, 185, 129, 0.18)',
            sparklineData: [3, 5, 4, 7, 6, 8, 9],
        },
        {
            id: 'leaves',
            title: 'Pending Leaves',
            title_kh: 'សំណើសុំច្បាប់',
            value: '1',
            change: '3 ថ្មី',
            badgeClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
            icon: 'mdi:clipboard-text-outline',
            iconBg: '',
            iconColor: 'text-amber-500 dark:text-amber-400',
            linkUrl: '/admin/attendance',
            sparklineColor: '#f59e0b',
            sparklineFill: 'rgba(245, 158, 11, 0.18)',
            sparklineData: [2, 4, 3, 5, 4, 6, 5],
        },
    ];

    // Meetings & Schedules matching reference layout
    scheduledMeetings: ScheduledMeeting[] = [
        {
            id: 'm1',
            title: 'កិច្ចប្រជុំជាមួយក្រុមដឹកនាំ',
            time: '12:00 - 01:00 PM',
            dateGroup: 'today',
            dateLabel: 'ថ្ងៃនេះ',
            badgeColor: '#0f766e',
            borderClass: 'border-l-4 border-emerald-600',
            members: ['PP', 'CS', 'LM'],
            extraCount: 3,
        },
        {
            id: 'm2',
            title: 'ត្រួតពិនិត្យគម្រោង WFM Core V2',
            time: '10:00 - 11:30 AM',
            dateGroup: 'upcoming',
            dateLabel: 'សៅរ៍, 20 មករា',
            badgeColor: '#3b82f6',
            borderClass: 'border-l-4 border-blue-600',
            members: ['SS', 'RV', 'CK'],
            extraCount: 3,
        },
        {
            id: 'm3',
            title: 'ពិភាក្សាលំហូរអនុម័តច្បាប់ឈប់សម្រាក',
            time: '02:00 - 03:00 PM',
            dateGroup: 'upcoming',
            dateLabel: 'សៅរ៍, 20 មករា',
            badgeColor: '#f97316',
            borderClass: 'border-l-4 border-amber-500',
            members: ['PP', 'IT'],
            extraCount: 2,
        },
    ];

    // Top Performers / Team Members Grid (6 members)
    performers: TeamMemberPerformer[] = [
        {
            id: 'p1',
            name: 'ចេង ច័ន្ទបញ្ញា (Panha)',
            name_kh: 'ចេង ច័ន្ទបញ្ញា',
            email: 'Chanpanhacheng@gmail.com',
            role: 'Senior Fullstack Engineer',
            avatar: '',
            initials: 'CP',
            avatarBg: 'bg-slate-700 text-white',
        },
        {
            id: 'p2',
            name: 'សុខ សុភា (Sopheak)',
            name_kh: 'សុខ សុភា',
            email: 'sok.sopheak@gmail.com',
            role: 'Lead Project Manager',
            avatar: '',
            initials: 'SP',
            avatarBg: 'bg-teal-700 text-white',
        },
        {
            id: 'p3',
            name: 'រ័ត្ន វិចិត្រ (Vichet)',
            name_kh: 'រ័ត្ន វិចិត្រ',
            email: 'rath.vichet@gmail.com',
            role: 'DevOps & Cloud Engineer',
            avatar: '',
            initials: 'VC',
            avatarBg: 'bg-indigo-700 text-white',
        },
        {
            id: 'p4',
            name: 'លី ម៉េងហួរ (Menghour)',
            name_kh: 'លី ម៉េងហួរ',
            email: 'menghour.ly@gmail.com',
            role: 'Senior Backend Engineer',
            avatar: '',
            initials: 'MH',
            avatarBg: 'bg-purple-700 text-white',
        },
        {
            id: 'p5',
            name: 'គង់ ចរិយា (Chariya)',
            name_kh: 'គង់ ចរិយា',
            email: 'chariya.kong@gmail.com',
            role: 'QA & Automation Lead',
            avatar: '',
            initials: 'CY',
            avatarBg: 'bg-amber-600 text-white',
        },
        {
            id: 'p6',
            name: 'ហេង ពិសាល (Piseth)',
            name_kh: 'ហេង ពិសាល',
            email: 'piseth.heng@gmail.com',
            role: 'Mobile App Developer',
            avatar: '',
            initials: 'PS',
            avatarBg: 'bg-emerald-700 text-white',
        },
    ];

    ngOnInit(): void {
        this.initGreeting();
        this._userService.user$.subscribe((u) => {
            if (u) {
                const name = (u as any).name_kh || (u as any).kh_name || (u as any).name_en || (u as any).en_name || (u as any).name || 'ពិសិទ្ធិ បញ្ញាវន្ត័';
                this.userName.set(name);

                const enName = (u as any).en_name || (u as any).name_en || '';
                const khName = (u as any).kh_name || (u as any).name_kh || '';
                if (enName) {
                    const parts = enName.trim().split(' ');
                    this.userInitials.set(parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : enName.slice(0, 2).toUpperCase());
                } else if (khName) {
                    this.userInitials.set(khName.slice(0, 2));
                }

                if (u.avatar && typeof u.avatar === 'object') {
                    const domain = (u.avatar as any).file_domain || '';
                    const uri = (u.avatar as any).uri || '';
                    if (uri) {
                        this.userAvatarUrl.set(domain ? `${domain}/${uri}` : uri);
                    }
                } else if (typeof u.avatar === 'string' && u.avatar) {
                    this.userAvatarUrl.set(u.avatar);
                }
            }
        });
        this.loadStats();
    }

    private initGreeting(): void {
        const h = new Date().getHours();
        if (h >= 5 && h < 12) {
            this.userGreeting.set('អរុណសួស្តី');
        } else if (h >= 12 && h < 17) {
            this.userGreeting.set('ទិវាសួស្តី');
        } else if (h >= 17 && h < 20) {
            this.userGreeting.set('សាយណ្ហសួស្តី');
        } else {
            this.userGreeting.set('រាត្រីសួស្តី');
        }
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.initTrendChart();
            this.initDistributionChart();
            this.initSparklines();
            this.setupResizeObserver();
        }, 100);
    }

    ngOnDestroy(): void {
        this._resizeObserver?.disconnect();
        if (this._chart && !this._chart.isDisposed()) {
            this._chart.dispose();
        }
        if (this._distributionChart && !this._distributionChart.isDisposed()) {
            this._distributionChart.dispose();
        }
        this._sparklineCharts.forEach(c => {
            if (!c.isDisposed()) c.dispose();
        });
        this._sparklineCharts = [];
    }

    loadStats(): void {
        this.loading.set(true);
        this._adminService.getStats().subscribe({
            next: (res) => {
                if (res && res.data) {
                    this.stats.set(res.data);
                    const k = res.data.kpi;
                    if (k) {
                        this.kpiCards[0].value = String(k.total_users ?? 5);
                        this.kpiCards[1].value = String(k.active_projects ?? 2);
                        this.kpiCards[2].value = String(k.pending_leaves ?? 1);
                    }
                    if (res.data.scheduled_meetings && res.data.scheduled_meetings.length > 0) {
                        this.scheduledMeetings = res.data.scheduled_meetings;
                    }
                    if (res.data.top_performers && res.data.top_performers.length > 0) {
                        this.performers = res.data.top_performers;
                    }
                }
                this.loading.set(false);
                this.updateChart();
            },
            error: (err) => {
                console.warn('Using initial dashboard state:', err);
                this.loading.set(false);
                this.updateChart();
            },
        });
    }

    setPerformerPeriod(period: '1d' | '7d' | '1m' | '1y' | 'all'): void {
        this.activePerformerPeriod.set(period);
    }

    selectCalendarDay(day: number): void {
        this.activeCalendarDay.set(day);
    }

    previousWeek(): void {
        const d = new Date(this.calendarBaseDate());
        d.setDate(d.getDate() - 7);
        this.calendarBaseDate.set(d);
        this.activeCalendarDay.set(d.getDate());
    }

    nextWeek(): void {
        const d = new Date(this.calendarBaseDate());
        d.setDate(d.getDate() + 7);
        this.calendarBaseDate.set(d);
        this.activeCalendarDay.set(d.getDate());
    }

    navigateTo(path: string): void {
        this._router.navigate([path]);
    }

    private setupResizeObserver(): void {
        if (typeof ResizeObserver !== 'undefined') {
            this._resizeObserver = new ResizeObserver(() => {
                if (this._chart && !this._chart.isDisposed()) {
                    this._chart.resize();
                }
                if (this._distributionChart && !this._distributionChart.isDisposed()) {
                    this._distributionChart.resize();
                }
                this._sparklineCharts.forEach(c => {
                    if (!c.isDisposed()) c.resize();
                });
            });
            if (this.trendChartRef?.nativeElement) {
                this._resizeObserver.observe(this.trendChartRef.nativeElement);
            }
            if (this.distributionChartRef?.nativeElement) {
                this._resizeObserver.observe(this.distributionChartRef.nativeElement);
            }
        }
        window.addEventListener('resize', () => {
            if (this._chart && !this._chart.isDisposed()) {
                this._chart.resize();
            }
            if (this._distributionChart && !this._distributionChart.isDisposed()) {
                this._distributionChart.resize();
            }
            this._sparklineCharts.forEach(c => {
                if (!c.isDisposed()) c.resize();
            });
        });
    }

    private updateChart(): void {
        setTimeout(() => {
            this.initTrendChart();
            this.initDistributionChart();
            this.initSparklines();
        }, 50);
    }

    private initSparklines(): void {
        this._sparklineCharts.forEach(c => {
            if (!c.isDisposed()) c.dispose();
        });
        this._sparklineCharts = [];

        for (const kpi of this.kpiCards) {
            const el = document.getElementById(`sparkline-${kpi.id}`);
            if (!el) continue;
            const chart = echarts.init(el);
            this._sparklineCharts.push(chart);

            chart.setOption({
                grid: {
                    left: 0,
                    right: 0,
                    top: 2,
                    bottom: 2,
                },
                xAxis: {
                    type: 'category',
                    show: false,
                    boundaryGap: false,
                },
                yAxis: {
                    type: 'value',
                    show: false,
                },
                series: [
                    {
                        data: kpi.sparklineData,
                        type: 'line',
                        smooth: true,
                        showSymbol: false,
                        lineStyle: {
                            color: kpi.sparklineColor,
                            width: 2.2,
                        },
                        areaStyle: {
                            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                { offset: 0, color: kpi.sparklineFill },
                                { offset: 1, color: 'rgba(255, 255, 255, 0)' },
                            ]),
                        },
                    },
                ],
            });
        }
    }

    activeTrendPeriod = signal<'W' | 'M' | 'Y'>('W');

    setTrendPeriod(period: 'W' | 'M' | 'Y'): void {
        this.activeTrendPeriod.set(period);
        this.initTrendChart();
    }

    // ECharts Dual-Series Line Chart matching reference image
    private initTrendChart(): void {
        if (!this.trendChartRef?.nativeElement) return;

        let chart = echarts.getInstanceByDom(this.trendChartRef.nativeElement);
        if (!chart) {
            chart = echarts.init(this.trendChartRef.nativeElement);
            this._chart = chart;
        }

        const period = this.activeTrendPeriod();

        let xAxisData: string[] = [];
        let inProgressData: number[] = [];
        let completedData: number[] = [];
        let yMax = 10;
        let yInterval = 5;

        const trend = this.stats()?.trend;

        if (period === 'W') {
            xAxisData = trend?.weekly?.days || ['ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍', 'អាទិត្យ'];
            inProgressData = trend?.weekly?.in_progress || [5, 6, 7, 3, 6, 3, 0];
            completedData = trend?.weekly?.completed || [1, 6, 3, 8, 4, 0, 0];
            const maxVal = Math.max(...inProgressData, ...completedData, 8);
            yMax = Math.ceil(maxVal / 5) * 5;
            yInterval = Math.max(1, Math.floor(yMax / 2));
        } else if (period === 'M') {
            xAxisData = trend?.monthly?.months || ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា'];
            inProgressData = trend?.monthly?.in_progress || [18, 22, 25, 20, 24, 28];
            completedData = trend?.monthly?.completed || [12, 16, 21, 19, 22, 26];
            const maxVal = Math.max(...inProgressData, ...completedData, 30);
            yMax = Math.ceil(maxVal / 10) * 10;
            yInterval = Math.max(5, Math.floor(yMax / 4));
        } else {
            xAxisData = trend?.yearly?.years || ['2023', '2024', '2025', '2026'];
            inProgressData = trend?.yearly?.in_progress || [85, 120, 160, 195];
            completedData = trend?.yearly?.completed || [70, 105, 145, 180];
            const maxVal = Math.max(...inProgressData, ...completedData, 100);
            yMax = Math.ceil(maxVal / 50) * 50;
            yInterval = Math.max(25, Math.floor(yMax / 4));
        }

        const option: echarts.EChartsOption = {
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                borderColor: '#e5e7eb',
                borderWidth: 1,
                padding: [10, 14],
                shadowBlur: 14,
                shadowColor: 'rgba(0, 0, 0, 0.06)',
                textStyle: {
                    color: '#374151',
                    fontFamily: 'Kantumruy Pro',
                    fontSize: 14,
                    fontWeight: 500,
                },
                axisPointer: {
                    type: 'line',
                    lineStyle: {
                        color: '#94a3af',
                        width: 1,
                        type: 'dashed',
                    },
                },
            },
            legend: {
                show: false, // Custom legend in HTML or centered
            },
            grid: {
                left: '2%',
                right: '3%',
                bottom: '10%',
                top: '12%',
                containLabel: true,
            },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: xAxisData,
                axisLine: {
                    lineStyle: { color: '#e5e7eb' },
                },
                axisTick: { show: false },
                axisLabel: {
                    color: '#9ca3af',
                    fontFamily: 'Kantumruy Pro',
                    fontSize: 13,
                    fontWeight: 500,
                    margin: 14,
                },
            },
            yAxis: {
                type: 'value',
                min: 0,
                max: yMax,
                interval: yInterval,
                splitLine: {
                    lineStyle: {
                        color: '#f3f4f6',
                        type: 'dashed',
                    },
                },
                axisLabel: {
                    color: '#9ca3af',
                    fontFamily: 'Kantumruy Pro',
                    fontSize: 13,
                    fontWeight: 500,
                },
            },
            series: [
                {
                    name: 'កំពុងអនុវត្ត',
                    type: 'line',
                    smooth: false,
                    showSymbol: true,
                    symbol: 'circle',
                    symbolSize: 8,
                    itemStyle: {
                        color: '#ffffff',
                        borderColor: '#f59e0b',
                        borderWidth: 2.5,
                    },
                    lineStyle: {
                        width: 2.5,
                        color: '#f59e0b',
                    },
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: 'rgba(245, 158, 11, 0.22)' },
                            { offset: 1, color: 'rgba(245, 158, 11, 0.02)' },
                        ]),
                    },
                    data: inProgressData,
                },
                {
                    name: 'បញ្ចប់',
                    type: 'line',
                    smooth: false,
                    showSymbol: true,
                    symbol: 'circle',
                    symbolSize: 8,
                    itemStyle: {
                        color: '#ffffff',
                        borderColor: '#10b981',
                        borderWidth: 2.5,
                    },
                    lineStyle: {
                        width: 2.5,
                        color: '#10b981',
                    },
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: 'rgba(16, 185, 129, 0.25)' },
                            { offset: 1, color: 'rgba(16, 185, 129, 0.02)' },
                        ]),
                    },
                    data: completedData,
                },
            ],
        };

        chart.setOption(option, true);
    }

    // ECharts Donut Distribution Chart for Work & Tasks
    private initDistributionChart(): void {
        if (!this.distributionChartRef?.nativeElement) return;

        let chart = echarts.getInstanceByDom(this.distributionChartRef.nativeElement);
        if (!chart) {
            chart = echarts.init(this.distributionChartRef.nativeElement);
            this._distributionChart = chart;
        }

        const kpi = this.stats().kpi;
        const dist = this.stats().task_distribution;
        const completed = dist?.completed ?? kpi?.completed_tasks ?? 18;
        const inProgress = dist?.in_progress ?? kpi?.in_progress_tasks ?? 7;
        const pending = dist?.pending ?? kpi?.pending_tasks ?? 3;
        const overdue = 0;

        const option: echarts.EChartsOption = {
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'item',
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                borderColor: '#e5e7eb',
                borderWidth: 1,
                padding: [8, 12],
                textStyle: {
                    color: '#374151',
                    fontFamily: 'Kantumruy Pro',
                    fontSize: 13,
                    fontWeight: 500,
                },
                formatter: '{b}: <b>{c}</b> ({d}%)',
            },
            series: [
                {
                    name: 'ស្ថានភាពការងារ',
                    type: 'pie',
                    radius: ['60%', '82%'],
                    center: ['50%', '50%'],
                    avoidLabelOverlap: false,
                    itemStyle: {
                        borderRadius: 6,
                        borderColor: '#ffffff',
                        borderWidth: 2,
                    },
                    label: {
                        show: false,
                    },
                    emphasis: {
                        scale: true,
                        scaleSize: 5,
                        label: {
                            show: false,
                        },
                    },
                    data: [
                        { value: completed, name: 'បានបញ្ចប់', itemStyle: { color: '#10b981' } },
                        { value: inProgress, name: 'កំពុងដំណើរការ', itemStyle: { color: '#f59e0b' } },
                        { value: pending, name: 'គ្រោងទុក', itemStyle: { color: '#3b82f6' } },
                        ...(overdue > 0 ? [{ value: overdue, name: 'ផុតកំណត់', itemStyle: { color: '#ef4444' } }] : []),
                    ],
                },
            ],
        };

        chart.setOption(option, true);
    }
}
