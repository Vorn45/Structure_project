export type ProfileTimestamp = string | number | null | undefined;

const KH_MONTHS = [
    'មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា',
    'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ',
];

export function profileDateValue(value: ProfileTimestamp): number {
    if (value === null || value === undefined || value === '') {
        return 0;
    }

    const numeric = typeof value === 'number'
        ? value
        : /^\d+$/.test(value.trim())
            ? Number(value)
            : null;
    const normalized = numeric === null
        ? value
        : numeric < 10_000_000_000
            ? numeric * 1000
            : numeric;
    const timestamp = new Date(normalized).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function formatProfileDate(value: ProfileTimestamp): string {
    if (!value) return '-';

    const timestamp = profileDateValue(value);
    if (!timestamp) return String(value);

    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = KH_MONTHS[date.getMonth()];
    return `${day} ${month} ${date.getFullYear()}`;
}

export function profileRelativeTime(value: ProfileTimestamp): string {
    if (value === null || value === undefined || value === '') {
        return '-';
    }

    const timestamp = profileDateValue(value);
    if (!timestamp) return String(value);

    const minutes = Math.max(
        0,
        Math.floor((Date.now() - timestamp) / 60_000),
    );
    if (minutes < 1) return 'ឥឡូវនេះ';
    if (minutes < 60) return `${minutes} នាទីមុន`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ម៉ោងមុន`;

    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} ថ្ងៃមុន`;

    return formatProfileDate(value);
}

export function profileCompactRelativeTime(value: ProfileTimestamp): string {
    const timestamp = profileDateValue(value);
    if (!timestamp) return '-';

    const minutes = Math.max(
        1,
        Math.floor((Date.now() - timestamp) / 60_000),
    );
    if (minutes < 60) return `${minutes}min`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;

    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d`;

    const months = Math.floor(days / 30);
    if (months < 12) return `${months}m`;

    return `${Math.floor(months / 12)}y`;
}
