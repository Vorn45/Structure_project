import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'autoDateDifferenceFromNow',
  standalone: true
})
export class AutoDateDifferenceFromNowPipe implements PipeTransform {
  transform(startDate: Date | string): string {
    const start = new Date(startDate);
    const now = new Date(); // Use the current date as the end date

    const diffTime = Math.abs(now.getTime() - start.getTime());

    if (diffTime >= 1000 * 60 * 60 * 24 * 365.25) {
      const years = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365.25));
      return `${years}ឆ្នាំ`;
    } else if (diffTime >= 1000 * 60 * 60 * 24 * 30) {
      const months = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30));
      return `${months}ខែ}`;
    } else if (diffTime >= 1000 * 60 * 60 * 24) {
      const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return `${days}ថ្ងៃ`;
    } else if (diffTime >= 1000 * 60 * 60) {
      const hours = Math.floor(diffTime / (1000 * 60 * 60));
      return `${hours}ម៉ោងមុន`;
    } else {
      const minutes = Math.floor(diffTime / (1000 * 60));
      return `${minutes}នាទីមុន`;
    }
  }
}
