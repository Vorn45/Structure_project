import { CommonModule } from '@angular/common';
import { Component, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TaskAttachment, TaskItem } from '../models/task.types';

@Component({
    selector: 'task-file-preview-modal',
    standalone: true,
    imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule],
    templateUrl: './file-preview-modal.component.html',
})
export class FilePreviewModalComponent {
    previewFile = input<TaskAttachment | null>(null);
    previewImage = input<string | null>(null);
    task = input<TaskItem | null>(null);

    closeModal = output<void>();
    downloadFile = output<TaskAttachment>();

    isFileModalFullscreen = signal<boolean>(false);

    constructor(private readonly _sanitizer: DomSanitizer) {}

    getSafePdfUrl(url?: string): SafeResourceUrl | null {
        if (!url) return null;
        const pdfUrl = url.includes('#') ? url : `${url}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`;
        return this._sanitizer.bypassSecurityTrustResourceUrl(pdfUrl);
    }

    isPdfFile(file?: TaskAttachment | null): boolean {
        if (!file) return false;
        const name = (file.name || '').toLowerCase();
        const type = (file.type || '').toLowerCase();
        return type.includes('pdf') || name.endsWith('.pdf');
    }

    isImageFile(file?: TaskAttachment | null): boolean {
        if (!file) return false;
        if (file.isImage) return true;
        const name = (file.name || '').toLowerCase();
        const type = (file.type || '').toLowerCase();
        return (
            type.startsWith('image/') ||
            /\.(png|jpe?g|gif|webp|svg|bmp|ico)$/i.test(name) ||
            (!!file.url && file.url.startsWith('data:image/'))
        );
    }

    getFileIcon(name: string, type?: string): string {
        const lower = name.toLowerCase();
        if (lower.endsWith('.pdf') || type?.includes('pdf')) return 'mdi:file-pdf-box';
        if (lower.endsWith('.xls') || lower.endsWith('.xlsx') || type?.includes('excel') || type?.includes('spreadsheet'))
            return 'mdi:file-excel-box';
        if (lower.endsWith('.doc') || lower.endsWith('.docx') || type?.includes('word') || type?.includes('document'))
            return 'mdi:file-word-box';
        if (lower.endsWith('.zip') || lower.endsWith('.rar') || lower.endsWith('.7z') || type?.includes('zip'))
            return 'mdi:folder-zip-outline';
        if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp'))
            return 'mdi:file-image';
        return 'mdi:file-document-outline';
    }

    getFileIconColor(name: string): string {
        const lower = name.toLowerCase();
        if (lower.endsWith('.pdf')) return 'text-rose-500 bg-rose-50 dark:bg-rose-950/40';
        if (lower.endsWith('.xls') || lower.endsWith('.xlsx')) return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40';
        if (lower.endsWith('.doc') || lower.endsWith('.docx')) return 'text-blue-500 bg-blue-50 dark:bg-blue-950/40';
        if (lower.endsWith('.zip') || lower.endsWith('.rar')) return 'text-amber-500 bg-amber-50 dark:bg-amber-950/40';
        return 'text-blue-500 bg-blue-50 dark:bg-blue-950/40';
    }

    toggleFullscreen(): void {
        this.isFileModalFullscreen.update((v) => !v);
    }
}
