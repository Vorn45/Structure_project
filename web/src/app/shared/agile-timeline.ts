/**
 * Shared Agile / Gantt timeline engine.
 *
 * The plan tab used to be locked to a hardcoded window (ISO weeks 14..40,
 * Q2/Q3, មេសា..កញ្ញា), so any project outside Apr–Sep could not be drawn and
 * the "NOW" marker was clamped into range even when today sat outside it.
 *
 * This module derives the whole grid from real dates instead: the window comes
 * from the project + its segments, the quarter / month / week header rows are
 * generated from that window, and "NOW" is only reported when today actually
 * falls inside it.
 */

const MS_PER_DAY = 86400000;

const KH_MONTHS = [
    'មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា',
    'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ',
];

const KH_DIGITS = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];

/** Stable per-calendar-month colours, so a month keeps its colour across projects. */
const MONTH_COLORS = [
    'bg-[#0f766e] text-white',   // Jan
    'bg-[#b91c1c] text-white',   // Feb
    'bg-[#7c3aed] text-white',   // Mar
    'bg-[#f43f5e] text-white',   // Apr
    'bg-[#0d9488] text-white',   // May
    'bg-[#7c3aed] text-white',   // Jun
    'bg-[#eab308] text-slate-900', // Jul
    'bg-[#0284c7] text-white',   // Aug
    'bg-[#0369a1] text-white',   // Sep
    'bg-[#c2410c] text-white',   // Oct
    'bg-[#4d7c0f] text-white',   // Nov
    'bg-[#1e3a8a] text-white',   // Dec
];

const QUARTER_COLORS = [
    'bg-[#2e1065] text-white',   // Q1
    'bg-[#ea580c] text-white',   // Q2
    'bg-[#155e75] text-white',   // Q3
    'bg-[#7f1d1d] text-white',   // Q4
];

/** Iteration 1..3 keep their original colours; anything beyond cycles the palette. */
const ITERATION_COLORS = [
    'bg-[#f59e0b] hover:bg-[#d97706]',
    'bg-[#f43f5e] hover:bg-[#e11d48]',
    'bg-[#581c87] hover:bg-[#4c1d95]',
    'bg-[#0d9488] hover:bg-[#0f766e]',
    'bg-[#2563eb] hover:bg-[#1d4ed8]',
    'bg-[#c2410c] hover:bg-[#9a3412]',
];

export interface AgilePlanSegmentLike {
    iteration?: number;
    /** Legacy positioning, kept so existing stored plans still render.
     *  The API round-trips these in snake_case, so both spellings are accepted. */
    startWeek?: number;
    durationWeeks?: number;
    start_week?: number;
    duration_weeks?: number;
    /** Preferred positioning (YYYY-MM-DD). */
    start_date?: string | null;
    end_date?: string | null;
    label?: string;
}

export interface AgilePlanTaskLike {
    id: string;
    name: string;
    segments?: AgilePlanSegmentLike[] | null;
    /** Optional link to a project phase, used to derive progress + status. */
    phase_id?: string | null;
    /** Optional link to project tasks, used to derive progress + assignees. */
    task_ids?: string[] | null;
}

/** Column density. Changes pixel width only — the grid itself is unchanged. */
export type TimelineZoom = 'week' | 'month' | 'quarter';

const ZOOM_PX_PER_WEEK: Record<TimelineZoom, number> = {
    // Week zoom is deliberately wide enough that any real plan overflows and
    // becomes scrollable detail; the coarser levels compress hard.
    week: 64,
    month: 26,
    quarter: 12,
};

export function pxPerWeek(zoom: TimelineZoom): number {
    return ZOOM_PX_PER_WEEK[zoom] ?? ZOOM_PX_PER_WEEK.week;
}

/** A milestone drawn on the grid (a project phase). */
export interface TimelineMarker {
    id: string;
    title: string;
    date: Date;
    percent: number;
    status: string;
}

export interface TimelineGroupCell {
    key: string;
    name: string;
    weeksCount: number;
    bgClass: string;
}

export interface TimelineWeekCell {
    key: string;
    weekNumber: number;
    start: Date;
    end: Date;
    isCurrent: boolean;
    /** e.g. "07/04 - 13/04" */
    rangeLabel: string;
}

export interface DateRange {
    start: Date;
    end: Date;
}

export interface AgileTimeline {
    start: Date;
    end: Date;
    totalDays: number;
    totalWeeks: number;
    weeks: TimelineWeekCell[];
    months: TimelineGroupCell[];
    quarters: TimelineGroupCell[];
    /** ISO week number of today, or null when today is outside the window. */
    currentWeek: number | null;
    /** Position of today as a percentage, or null when outside the window. */
    nowPercent: number | null;
    /** Year used to resolve legacy week-number-only segments. */
    legacyYear: number;
    /** Suggested min-width for the scroll container. */
    minWidthPx: number;
    /** Column density this timeline was built at. */
    zoom: TimelineZoom;
    /** Week numbers get unreadable once columns are narrow. */
    showWeekNumbers: boolean;
    /** Month header row is dropped at quarter zoom. */
    showMonths: boolean;
    /** Per-week grid lines only make sense at week zoom. */
    showWeekGrid: boolean;
}

export interface BuildAgileTimelineOptions {
    tasks?: AgilePlanTaskLike[] | null;
    projectStart?: string | Date | null;
    projectEnd?: string | Date | null;
    /** Injectable for tests. */
    today?: Date;
    zoom?: TimelineZoom;
}

/* ------------------------------------------------------------------ */
/* Date helpers                                                        */
/* ------------------------------------------------------------------ */

export function startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
    const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    next.setDate(next.getDate() + days);
    return next;
}

/** Monday of the ISO week containing `date`. */
export function startOfIsoWeek(date: Date): Date {
    const day = (date.getDay() + 6) % 7; // Mon = 0
    return addDays(startOfDay(date), -day);
}

export function isoWeekNumber(date: Date): number {
    const thursday = addDays(startOfIsoWeek(date), 3);
    const firstThursday = addDays(startOfIsoWeek(new Date(thursday.getFullYear(), 0, 4)), 3);
    return 1 + Math.round((thursday.getTime() - firstThursday.getTime()) / (7 * MS_PER_DAY));
}

/** Monday of ISO week `week` in `year`. */
export function isoWeekStart(year: number, week: number): Date {
    const firstMonday = startOfIsoWeek(new Date(year, 0, 4));
    return addDays(firstMonday, (week - 1) * 7);
}

/** Parses 'YYYY-MM-DD' (or any Date-parsable string) into a local midnight Date. */
export function parseDateValue(value: string | Date | null | undefined): Date | null {
    if (!value) return null;
    if (value instanceof Date) {
        return isNaN(value.getTime()) ? null : startOfDay(value);
    }
    const text = String(value).trim();
    if (!text) return null;
    const ymd = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
    if (ymd) {
        return new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
    }
    const parsed = new Date(text);
    return isNaN(parsed.getTime()) ? null : startOfDay(parsed);
}

/** Formats a Date as 'YYYY-MM-DD' (local), which is what <input type="date"> wants. */
export function toDateInputValue(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
}

export function formatShortDate(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${day}/${month}`;
}

export function formatFullDate(date: Date): string {
    return `${formatShortDate(date)}/${date.getFullYear()}`;
}

export function toKhmerNumber(value: number): string {
    return String(value)
        .split('')
        .map((ch) => (ch >= '0' && ch <= '9' ? KH_DIGITS[Number(ch)] : ch))
        .join('');
}

export function khmerMonthName(monthIndex: number): string {
    return KH_MONTHS[((monthIndex % 12) + 12) % 12];
}

/* ------------------------------------------------------------------ */
/* Segment resolution                                                  */
/* ------------------------------------------------------------------ */

/**
 * Resolves a segment to a concrete date range.
 *
 * Prefers `start_date` / `end_date`. Falls back to the legacy
 * `startWeek` + `durationWeeks` pair, resolved against the timeline's weeks so
 * plans stored before the date migration still land on the right column.
 */
/** Reads the legacy start week under either spelling the API may return. */
export function segmentStartWeek(segment: AgilePlanSegmentLike): number {
    return Number(segment.startWeek ?? segment.start_week ?? 0);
}

/** Reads the legacy duration under either spelling, defaulting to one week. */
export function segmentDurationWeeks(segment: AgilePlanSegmentLike): number {
    return Math.max(1, Number(segment.durationWeeks ?? segment.duration_weeks) || 1);
}

export function resolveSegmentRange(
    segment: AgilePlanSegmentLike | null | undefined,
    timeline?: AgileTimeline | null,
): DateRange | null {
    if (!segment) return null;

    const explicitStart = parseDateValue(segment.start_date);
    if (explicitStart) {
        const explicitEnd = parseDateValue(segment.end_date);
        const weeks = segmentDurationWeeks(segment);
        const end = explicitEnd && explicitEnd >= explicitStart
            ? explicitEnd
            : addDays(explicitStart, weeks * 7 - 1);
        return { start: explicitStart, end };
    }

    const week = segmentStartWeek(segment);
    if (!week || isNaN(week)) return null;

    const duration = segmentDurationWeeks(segment);
    const matching = timeline?.weeks.find((w) => w.weekNumber === week);
    const start = matching ? matching.start : isoWeekStart(timeline?.legacyYear ?? new Date().getFullYear(), week);
    return { start, end: addDays(start, duration * 7 - 1) };
}

/** Whole weeks covered by a range (rounded up, minimum 1). */
export function rangeWeekCount(range: DateRange): number {
    const days = Math.round((range.end.getTime() - range.start.getTime()) / MS_PER_DAY) + 1;
    return Math.max(1, Math.ceil(days / 7));
}

export function iterationColorClass(iteration: number | null | undefined): string {
    const index = Math.max(1, Number(iteration) || 1) - 1;
    return ITERATION_COLORS[index % ITERATION_COLORS.length];
}

export function iterationCount(): number {
    return ITERATION_COLORS.length;
}

/* ------------------------------------------------------------------ */
/* Timeline construction                                               */
/* ------------------------------------------------------------------ */

const MIN_WEEKS = 8;
const MAX_WEEKS = 156; // 3 years — guards against a typo blowing up the grid

function endOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function buildAgileTimeline(options: BuildAgileTimelineOptions = {}): AgileTimeline {
    const today = startOfDay(options.today ?? new Date());
    const zoom: TimelineZoom = options.zoom ?? 'week';

    // 1. Collect every date we know about.
    const bounds: Date[] = [];
    const pushRange = (range: DateRange | null) => {
        if (!range) return;
        bounds.push(range.start, range.end);
    };

    const projectStart = parseDateValue(options.projectStart);
    const projectEnd = parseDateValue(options.projectEnd);
    if (projectStart) bounds.push(projectStart);
    if (projectEnd) bounds.push(projectEnd);

    const legacyYear = (projectStart ?? today).getFullYear();

    for (const task of options.tasks ?? []) {
        for (const segment of task?.segments ?? []) {
            const explicit = parseDateValue(segment?.start_date);
            if (explicit) {
                pushRange(resolveSegmentRange(segment, null));
            } else if (segmentStartWeek(segment)) {
                const start = isoWeekStart(legacyYear, segmentStartWeek(segment));
                const duration = segmentDurationWeeks(segment);
                bounds.push(start, addDays(start, duration * 7 - 1));
            }
        }
    }

    // 2. Pick the window. With nothing to show, fall back to the current
    //    quarter plus the next one — the same ~2-quarter span as before, but
    //    anchored on today instead of a hardcoded Q2/Q3.
    let min: Date;
    let max: Date;
    if (bounds.length === 0) {
        min = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
        max = endOfMonth(new Date(min.getFullYear(), min.getMonth() + 5, 1));
    } else {
        min = new Date(Math.min(...bounds.map((d) => d.getTime())));
        max = new Date(Math.max(...bounds.map((d) => d.getTime())));
    }

    // 3. Snap to whole months, then to whole ISO weeks.
    let start = startOfIsoWeek(startOfMonth(min));
    let end = endOfMonth(max);
    end = addDays(startOfIsoWeek(end), 6);

    // Count from Monday to Monday so the last (partial) week is not double-counted.
    let totalWeeks =
        Math.round((startOfIsoWeek(end).getTime() - start.getTime()) / (7 * MS_PER_DAY)) + 1;
    totalWeeks = Math.min(MAX_WEEKS, Math.max(MIN_WEEKS, totalWeeks));
    end = addDays(start, totalWeeks * 7 - 1);

    // 4. Week columns.
    const weeks: TimelineWeekCell[] = [];
    const currentWeekStart = startOfIsoWeek(today).getTime();
    for (let i = 0; i < totalWeeks; i++) {
        const weekStart = addDays(start, i * 7);
        const weekEnd = addDays(weekStart, 6);
        weeks.push({
            key: toDateInputValue(weekStart),
            weekNumber: isoWeekNumber(weekStart),
            start: weekStart,
            end: weekEnd,
            isCurrent: weekStart.getTime() === currentWeekStart,
            rangeLabel: `${formatShortDate(weekStart)} - ${formatShortDate(weekEnd)}`,
        });
    }

    // 5. Month + quarter header rows, grouped by each week's Thursday (ISO rule),
    //    so every group spans a whole number of week columns.
    const months: TimelineGroupCell[] = [];
    const quarters: TimelineGroupCell[] = [];
    for (const week of weeks) {
        const anchor = addDays(week.start, 3);
        const monthKey = `${anchor.getFullYear()}-${anchor.getMonth()}`;
        const lastMonth = months[months.length - 1];
        if (lastMonth && lastMonth.key === monthKey) {
            lastMonth.weeksCount += 1;
        } else {
            months.push({
                key: monthKey,
                name: khmerMonthName(anchor.getMonth()),
                weeksCount: 1,
                bgClass: MONTH_COLORS[anchor.getMonth()],
            });
        }

        const quarterIndex = Math.floor(anchor.getMonth() / 3);
        const quarterKey = `${anchor.getFullYear()}-Q${quarterIndex + 1}`;
        const lastQuarter = quarters[quarters.length - 1];
        if (lastQuarter && lastQuarter.key === quarterKey) {
            lastQuarter.weeksCount += 1;
        } else {
            quarters.push({
                key: quarterKey,
                name: `${anchor.getFullYear()} ត្រីមាសទី ${toKhmerNumber(quarterIndex + 1)} (Q${quarterIndex + 1})`,
                weeksCount: 1,
                bgClass: QUARTER_COLORS[quarterIndex],
            });
        }
    }

    const totalDays = totalWeeks * 7;
    const insideWindow = today >= start && today <= end;

    return {
        start,
        end,
        totalDays,
        totalWeeks,
        weeks,
        months,
        quarters,
        currentWeek: insideWindow ? isoWeekNumber(today) : null,
        nowPercent: insideWindow
            ? ((today.getTime() - start.getTime()) / MS_PER_DAY / totalDays) * 100
            : null,
        legacyYear,
        minWidthPx: 300 + totalWeeks * pxPerWeek(zoom),
        zoom,
        showWeekNumbers: zoom === 'week',
        showMonths: zoom !== 'quarter',
        showWeekGrid: zoom === 'week',
    };
}

/* ------------------------------------------------------------------ */
/* Positioning                                                         */
/* ------------------------------------------------------------------ */

export function rangeLeftPercent(timeline: AgileTimeline, range: DateRange | null): number {
    if (!range) return 0;
    const offsetDays = (range.start.getTime() - timeline.start.getTime()) / MS_PER_DAY;
    return Math.max(0, Math.min(100, (offsetDays / timeline.totalDays) * 100));
}

export function rangeWidthPercent(timeline: AgileTimeline, range: DateRange | null): number {
    if (!range) return 0;
    const startDays = Math.max(0, (range.start.getTime() - timeline.start.getTime()) / MS_PER_DAY);
    const endDays = Math.min(
        timeline.totalDays,
        (range.end.getTime() - timeline.start.getTime()) / MS_PER_DAY + 1,
    );
    const span = endDays - startDays;
    if (span <= 0) return 0;
    return Math.max(0.5, Math.min(100 - (startDays / timeline.totalDays) * 100, (span / timeline.totalDays) * 100));
}

/** True when the segment falls entirely outside the visible window. */
export function isRangeOutsideWindow(timeline: AgileTimeline, range: DateRange | null): boolean {
    if (!range) return true;
    return range.end < timeline.start || range.start > timeline.end;
}

/** Positions a single date (a milestone) on the grid, or null when off-window. */
export function markerPercent(timeline: AgileTimeline, date: Date | null): number | null {
    if (!date) return null;
    if (date < timeline.start || date > timeline.end) return null;
    const offsetDays = (date.getTime() - timeline.start.getTime()) / MS_PER_DAY;
    return (offsetDays / timeline.totalDays) * 100;
}

/** Converts a horizontal pixel delta into a whole number of days. */
export function pixelsToDays(timeline: AgileTimeline, deltaPx: number, trackWidthPx: number): number {
    if (trackWidthPx <= 0) return 0;
    return Math.round((deltaPx / trackWidthPx) * timeline.totalDays);
}

/** Shifts a range by whole days, keeping its length. */
export function shiftRange(range: DateRange, days: number): DateRange {
    return { start: addDays(range.start, days), end: addDays(range.end, days) };
}

/** Resizes a range's end, never shorter than one day. */
export function resizeRangeEnd(range: DateRange, days: number): DateRange {
    const end = addDays(range.end, days);
    return { start: range.start, end: end < range.start ? range.start : end };
}

/** Resizes a range's start, never past its end. */
export function resizeRangeStart(range: DateRange, days: number): DateRange {
    const start = addDays(range.start, days);
    return { start: start > range.end ? range.end : start, end: range.end };
}
