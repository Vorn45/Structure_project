import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'capitalize',
    standalone: true
})
export class CapitalizePipe implements PipeTransform {
    transform(value: string): string {
        if (!value) return '';
        return value.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    }
}
