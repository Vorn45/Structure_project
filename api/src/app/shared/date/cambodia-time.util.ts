
const CAMBODIA_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
export function cambodiaDayRange(at: Date = new Date()): {
    start: Date;
    end: Date;
} {
    const shifted = new Date(at.getTime() + CAMBODIA_OFFSET_MS);
    const startOfDayShifted = Date.UTC(
        shifted.getUTCFullYear(),
        shifted.getUTCMonth(),
        shifted.getUTCDate(),
    );
    const start = new Date(startOfDayShifted - CAMBODIA_OFFSET_MS);
    return { start, end: new Date(start.getTime() + DAY_MS) };
}
export function cambodiaDateOnly(addDays = 0, at: Date = new Date()): string {
    const shifted = new Date(
        at.getTime() + CAMBODIA_OFFSET_MS + addDays * DAY_MS,
    );
    return shifted.toISOString().slice(0, 10);
}

/**
 * The UTC instant of Cambodia midnight for a plain `YYYY-MM-DD` date string —
 * e.g. an explicit `date_from`/`date_to` query param. Plain `new Date(str +
 * 'T00:00:00')` parses against the server's own local timezone (UTC in
 * production), not Cambodia's, so a date-only string round-tripped that way
 * lands up to 7h off Cambodia's real day boundary.
 */
export function cambodiaDateStringStart(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day) - CAMBODIA_OFFSET_MS);
}

/** End-of-day (23:59:59.999 Cambodia time) UTC instant for the same `YYYY-MM-DD` string. */
export function cambodiaDateStringEnd(dateStr: string): Date {
    return new Date(cambodiaDateStringStart(dateStr).getTime() + DAY_MS - 1);
}
