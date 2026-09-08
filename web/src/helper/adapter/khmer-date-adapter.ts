import { inject, Injectable } from '@angular/core';
import { NativeDateAdapter } from '@angular/material/core';
import { TranslocoService } from '@ngneat/transloco';

@Injectable()
export class KhmerDateAdapter extends NativeDateAdapter {
    private readonly _transloco = inject(TranslocoService);

    private khmerMonths = [
        'មករា',
        'កម្ភៈ',
        'មិនា',
        'មេសា',
        'ឧសភា',
        'មិថុនា',
        'កក្កដា',
        'សីហា',
        'កញ្ញា',
        'តុលា',
        'វិច្ឆិកា',
        'ធ្នូ'
    ];

    private englishMonths = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
    ];

    private khmerDaysNarrow = ['អា', 'ច', 'អ', 'ព', 'ព្រ', 'សុ', 'ស'];
    private khmerDaysShort = ['អាទិត្យ', 'ចន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហ', 'សុក្រ', 'សៅរ៍'];
    private khmerDaysLong = [
        'ថ្ងៃអាទិត្យ',
        'ថ្ងៃចន្ទ',
        'ថ្ងៃអង្គារ',
        'ថ្ងៃពុធ',
        'ថ្ងៃព្រហស្បតិ៍',
        'ថ្ងៃសុក្រ',
        'ថ្ងៃសៅរ៍'
    ];

    private get _isKhmer(): boolean {
        return this._transloco.getActiveLang() === 'kh';
    }

    /** Always "dd MonthName yyyy" — Khmer months in Khmer mode, English months otherwise. */
    override format(date: Date, _displayFormat: any): string {
        const day = this._pad(date.getDate());     // 02
        const month = this._isKhmer
            ? this.khmerMonths[date.getMonth()]
            : this.englishMonths[date.getMonth()];
        const year = date.getFullYear();           // 2025

        return `${day} ${month} ${year}`;
    }

    override getMonthNames(style: 'long' | 'short' | 'narrow'): string[] {
        return this._isKhmer ? this.khmerMonths : super.getMonthNames(style);
    }

    override getDayOfWeekNames(style: 'long' | 'short' | 'narrow'): string[] {
        if (!this._isKhmer) {
            return super.getDayOfWeekNames(style);
        }
        if (style === 'narrow') return this.khmerDaysNarrow;
        if (style === 'short') return this.khmerDaysShort;
        return this.khmerDaysLong;
    }

    override getFirstDayOfWeek(): number {
        return 0;
    }


    private _pad(n: number): string {
        return n < 10 ? '0' + n : '' + n;
    }
}
