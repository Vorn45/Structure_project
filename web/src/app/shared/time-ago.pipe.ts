import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'timeAgo',
    standalone: true,
})
export class TimeAgoPipe implements PipeTransform {
    transform(
        value: string | number | Date | null | undefined,
        _refreshAt?: number,
    ): string {
        if (!value) {
            return '';
        }

        const date = value instanceof Date ? value : new Date(value);

        if (Number.isNaN(date.getTime())) {
            return '';
        }

        const now = Date.now();
        const diffMs = Math.max(now - date.getTime(), 0);
        const minute = 60 * 1000;
        const hour = 60 * minute;
        const day = 24 * hour;
        const week = 7 * day;
        const month = 30 * day;
        const year = 365 * day;

        if (diffMs >= year) {
            return `${Math.floor(diffMs / year)}y`;
        }

        if (diffMs >= month) {
            return `${Math.floor(diffMs / month)}mo`;
        }

        if (diffMs >= week) {
            return `${Math.floor(diffMs / week)}w`;
        }

        if (diffMs >= day) {
            return `${Math.floor(diffMs / day)}d`;
        }

        if (diffMs >= hour) {
            return `${Math.floor(diffMs / hour)}h`;
        }

        return `${Math.floor(diffMs / minute)}m`;
    }
}
