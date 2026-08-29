import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'customDate',
    standalone: true,
})
export class CustomDatePipe implements PipeTransform {
    transform(value: string, format: string = 'yyyy-MM-dd'): string {
        if (!value || typeof value !== 'string') {
            return '';
        }

        try {
            let date: Date;

            // Check if it's ISO datetime format (e.g., "2025-06-14T09:24:00.713Z")
            if (value.includes('T') && (value.includes('Z') || value.includes('+') || value.includes('-', 10))) {
                date = new Date(value);
            } else {
                // Handle dd-MM-yyyy format
                const parts = value.split('-');
                if (parts.length !== 3) {
                    return '';
                }

                const [day, month, year] = parts;
                if (!this.isValidDate(day, month, year)) {
                    return '';
                }

                // Convert to UTC Date
                const isoDate = `${year}-${month}-${day}`;
                date = new Date(`${isoDate}T00:00:00Z`);
            }

            if (isNaN(date.getTime())) {
                return '';
            }

            if (format === 'yyyy') {
                return date.getFullYear().toString(); // Return only the year
            }

            // Format the date as per the provided format
            switch (format) {
                case 'yyyy-MM-dd':
                    return `${date.getFullYear()}-${this.pad(date.getMonth() + 1)}-${this.pad(date.getDate())}`;
                case 'dd-MM-yyyy':
                    return `${this.pad(date.getDate())}-${this.pad(date.getMonth() + 1)}-${date.getFullYear()}`;
                case 'MM-dd-yyyy':
                    return `${this.pad(date.getMonth() + 1)}-${this.pad(date.getDate())}-${date.getFullYear()}`;
                case 'dd/MM/yyyy - HH:mm':
                    return `${this.pad(date.getDate())}/${this.pad(date.getMonth() + 1)}/${date.getFullYear()} - ${this.pad(date.getHours())}:${this.pad(date.getMinutes())}`;
                default:
                    return date.toISOString(); // Default to ISO string
            }
        } catch {
            return '';
        }
    }

    /**
     * Validate the date components for basic correctness.
     */
    private isValidDate(day: string, month: string, year: string): boolean {
        const dayNumber = Number(day);
        const monthNumber = Number(month);
        const yearNumber = Number(year);

        return (
            !isNaN(dayNumber) &&
            !isNaN(monthNumber) &&
            !isNaN(yearNumber) &&
            dayNumber >= 1 &&
            dayNumber <= 31 &&
            monthNumber >= 1 &&
            monthNumber <= 12 &&
            yearNumber > 0
        );
    }

    /**
     * Pad single-digit numbers with leading zero.
     */
    private pad(value: number): string {
        return value.toString().padStart(2, '0');
    }
}
