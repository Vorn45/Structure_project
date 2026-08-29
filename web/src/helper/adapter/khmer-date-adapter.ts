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


    private _pad(n: number): string {
        return n < 10 ? '0' + n : '' + n;
    }
}
