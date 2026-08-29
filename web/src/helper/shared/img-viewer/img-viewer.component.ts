// ================================================================================>> Main Library
import { CommonModule } from '@angular/common';
import { Component, Inject, ElementRef, ViewChild, AfterViewInit, OnDestroy, HostListener } from '@angular/core';

// ================================================================================>> Third Party Library
import { MatButtonModule } from '@angular/material/button';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

interface ViewerFile {
    url: string;
    title: string;
}

interface ImageViewerData extends ViewerFile {
    files?: ViewerFile[];
    index?: number;
}

@Component({
    selector: 'helpers-img-viewer',
    standalone: true,
    templateUrl: './img-viewer.component.html',
    styleUrls: ['./img-viewer.component.scss'],
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatDialogModule,
        MatInputModule,
        MatProgressSpinnerModule
    ]
})
export class HelpersImgViewerComponent implements AfterViewInit, OnDestroy {
    zoom: number = 1;
    fitZoom: number = 1;       // zoom level that fits the image in the container
    maxZoom: number = 4;
    minZoom: number = 0.1;
    zoomStep: number = 0.1;

    originalWidth: number = 0;
    originalHeight: number = 0;
    imgWidth: number = 0;
    imgHeight: number = 0;

    containerWidth: number = 0;
    containerHeight: number = 0;

    // pan state
    translateX: number = 0;
    translateY: number = 0;
    private isPanning = false;
    private panStartX = 0;
    private panStartY = 0;
    private panOriginX = 0;
    private panOriginY = 0;

    rotation: number = 0;
    isLoading: boolean = true;
    hasError: boolean = false;
    isDragging: boolean = false;
    files: ViewerFile[] = [];
    fileIndex: number = 0;

    @ViewChild('container') containerRef: ElementRef<HTMLDivElement>;
    @ViewChild('bodyView') bodyViewRef: ElementRef<HTMLDivElement>;

    constructor(
        private _dialogRef: MatDialogRef<HelpersImgViewerComponent>,
        @Inject(MAT_DIALOG_DATA) public file: ImageViewerData,
    ) {}

    closeOnOverlayClick(event: MouseEvent): void {
        const target = event.target as Element;
        if (target.closest('.header-img-view, .viewer-img, .viewer-controls')) return;
        this._dialogRef.close();
    }

    ngOnInit() {
        this.files = this.file.files?.length ? this.file.files : [{ url: this.file.url, title: this.file.title }];
        this.fileIndex = Math.max(0, Math.min(this.file.index ?? this.files.findIndex((file) => file.url === this.file.url), this.files.length - 1));
        this.showFile(this.fileIndex);
    }

    get canGoPrevious(): boolean {
        return this.fileIndex > 0;
    }

    get canGoNext(): boolean {
        return this.fileIndex < this.files.length - 1;
    }

    previousFile(): void {
        if (this.canGoPrevious) this.showFile(this.fileIndex - 1);
    }

    nextFile(): void {
        if (this.canGoNext) this.showFile(this.fileIndex + 1);
    }

    private showFile(index: number): void {
        const nextFile = this.files[index];
        if (!nextFile) return;

        this.fileIndex = index;
        this.file = { ...nextFile, files: this.files, index };
        this.zoom = 1;
        this.fitZoom = 1;
        this.rotation = 0;
        this.translateX = 0;
        this.translateY = 0;
        this.isLoading = true;
        this.hasError = false;

        const img = new Image();
        img.src = this.file.url;
        img.onload = () => {
            this.originalWidth = img.width;
            this.originalHeight = img.height;
            // measure container now that we know we have real dimensions to fit against
            this.measureContainer();
            this.setFitZoom();
            this.isLoading = false;
        };
        img.onerror = () => {
            this.isLoading = false;
            this.hasError = true;
        };
    }

    ngAfterViewInit() {
        this.measureContainer();
    }

    ngOnDestroy() {
        // safety cleanup in case a drag ends outside the component
        this.isPanning = false;
    }

    private measureContainer(): void {
        if (this.bodyViewRef?.nativeElement) {
            this.containerWidth = this.bodyViewRef.nativeElement.clientWidth;
            this.containerHeight = this.bodyViewRef.nativeElement.clientHeight;
        } else if (this.containerRef?.nativeElement) {
            this.containerWidth = this.containerRef.nativeElement.clientWidth;
            this.containerHeight = this.containerRef.nativeElement.clientHeight;
        }
    }

    /** Calculates the zoom level that fits the whole image inside the container, no stretching, no upscaling past 1x by default */
    private setFitZoom(): void {
        if (!this.originalWidth || !this.originalHeight || !this.containerWidth || !this.containerHeight) {
            this.zoom = 1;
            this.fitZoom = 1;
            this.updateImageSize();
            return;
        }

        const padding = 40; // breathing room so image doesn't touch edges
        const availableWidth = Math.max(this.containerWidth - padding, 50);
        const availableHeight = Math.max(this.containerHeight - padding, 50);

        const widthRatio = availableWidth / this.originalWidth;
        const heightRatio = availableHeight / this.originalHeight;

        // fit inside the container; don't force small images to blow up past 100%
        const fit = Math.min(widthRatio, heightRatio, 1);

        this.fitZoom = fit;
        this.zoom = fit;
        this.translateX = 0;
        this.translateY = 0;
        this.updateImageSize();
    }

    updateImageSize(): void {
        this.imgWidth = this.originalWidth * this.zoom;
        this.imgHeight = this.originalHeight * this.zoom;
    }

    get zoomPercentage(): number {
        return Math.round(this.zoom * 100);
    }

    // ---------------- Zoom ----------------

    private setZoom(newZoom: number, anchor?: { x: number, y: number }): void {
        const clamped = Math.min(this.maxZoom, Math.max(this.minZoom, newZoom));
        if (clamped === this.zoom) return;

        if (anchor && this.originalWidth && this.originalHeight) {
            const imgWidth = this.originalWidth * this.zoom;
            const imgHeight = this.originalHeight * this.zoom;

            // Actual on-screen top-left of the image right now (flex-centered + pan offset)
            const imgLeft = (this.containerWidth - imgWidth) / 2 + this.translateX;
            const imgTop = (this.containerHeight - imgHeight) / 2 + this.translateY;

            // Point under the cursor, in unscaled image-local coordinates
            const localX = (anchor.x - imgLeft) / this.zoom;
            const localY = (anchor.y - imgTop) / this.zoom;

            const newImgWidth = this.originalWidth * clamped;
            const newImgHeight = this.originalHeight * clamped;

            // Where the image's top-left must be so that localX/localY stays under the cursor
            const newImgLeft = anchor.x - clamped * localX;
            const newImgTop = anchor.y - clamped * localY;

            this.translateX = newImgLeft - (this.containerWidth - newImgWidth) / 2;
            this.translateY = newImgTop - (this.containerHeight - newImgHeight) / 2;
        }

        this.zoom = clamped;
        this.updateImageSize();
        this.clampPan();
    }

    zoomIn(): void {
        this.setZoom(this.zoom + this.zoomStep);
    }

    zoomOut(): void {
        this.setZoom(this.zoom - this.zoomStep);
    }

    resetZoom(): void {
        this.zoom = this.fitZoom;
        this.translateX = 0;
        this.translateY = 0;
        this.rotation = 0;
        this.updateImageSize();
    }

    zoomActualSize(): void {
        this.zoom = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.updateImageSize();
    }

    get canZoomIn(): boolean {
        return this.zoom < this.maxZoom;
    }

    get canZoomOut(): boolean {
        return this.zoom > this.minZoom;
    }

    // ---------------- Wheel zoom (fixes ctrl+scroll zooming the whole page) ----------------

    onWheel(event: WheelEvent): void {
        event.preventDefault();
        event.stopPropagation();

        const rect = this.bodyViewRef?.nativeElement?.getBoundingClientRect();
        const anchor = rect
            ? { x: event.clientX - rect.left, y: event.clientY - rect.top }
            : undefined;

        const delta = event.deltaY > 0 ? -this.zoomStep : this.zoomStep;
        this.setZoom(this.zoom + delta, anchor);
    }

    // ---------------- Pan / drag ----------------

    onPointerDown(event: PointerEvent): void {
        if (event.button !== 0) return;
        event.preventDefault(); // stops native image-drag ghost & text selection at the source

        this.isPanning = true;
        this.isDragging = true;
        this.panStartX = event.clientX;
        this.panStartY = event.clientY;
        this.panOriginX = this.translateX;
        this.panOriginY = this.translateY;

        // Lock subsequent move/up events to this element even if the cursor
        // leaves it or moves fast — this is what was causing the flakiness.
        (event.target as HTMLElement).setPointerCapture(event.pointerId);
    }

    onPointerMove(event: PointerEvent): void {
        if (!this.isPanning) return;
        event.preventDefault();
        this.translateX = this.panOriginX + (event.clientX - this.panStartX);
        this.translateY = this.panOriginY + (event.clientY - this.panStartY);
        this.clampPan();
    }

    /**
     * Keep the image within the container while panning: you can only drag as far
     * as the image edges reach the container edges (no empty gaps), and an image
     * smaller than the container stays centered on that axis.
     */
    private clampPan(): void {
        // At 90°/270° the visual width/height are swapped by the rotation.
        const rotated = this.rotation % 180 !== 0;
        const visualWidth = rotated ? this.imgHeight : this.imgWidth;
        const visualHeight = rotated ? this.imgWidth : this.imgHeight;

        const maxX = Math.max(0, (visualWidth - this.containerWidth) / 2);
        const maxY = Math.max(0, (visualHeight - this.containerHeight) / 2);

        this.translateX = Math.min(maxX, Math.max(-maxX, this.translateX));
        this.translateY = Math.min(maxY, Math.max(-maxY, this.translateY));
    }

    onPointerUp(event: PointerEvent): void {
        this.isPanning = false;
        this.isDragging = false;
        if (event.target && (event.target as HTMLElement).releasePointerCapture) {
            try {
                (event.target as HTMLElement).releasePointerCapture(event.pointerId);
            } catch { /* no-op if not captured */ }
        }
    }
    // ---------------- Double click ----------------

    onDoubleClick(event: MouseEvent): void {
        const rect = this.bodyViewRef?.nativeElement?.getBoundingClientRect();
        const anchor = rect
            ? { x: event.clientX - rect.left, y: event.clientY - rect.top }
            : undefined;

        if (this.zoom > this.fitZoom) {
            this.resetZoom();
        } else {
            this.setZoom(Math.min(this.maxZoom, this.zoom * 2), anchor);
        }
    }

    // ---------------- Rotate ----------------

    rotateLeft(): void {
        this.rotation = (this.rotation - 90 + 360) % 360;
    }

    rotateRight(): void {
        this.rotation = (this.rotation + 90) % 360;
    }

    // ---------------- Keyboard shortcuts ----------------

    @HostListener('window:keydown', ['$event'])
    onKeyDown(event: KeyboardEvent): void {
        switch (event.key) {
            case '+':
            case '=':
                event.preventDefault();
                this.zoomIn();
                break;
            case '-':
            case '_':
                event.preventDefault();
                this.zoomOut();
                break;
            case '0':
                event.preventDefault();
                this.resetZoom();
                break;
            case 'r':
            case 'R':
                this.rotateRight();
                break;
            case 'ArrowLeft':
                event.preventDefault();
                this.previousFile();
                break;
            case 'ArrowRight':
                event.preventDefault();
                this.nextFile();
                break;
        }
    }

    @HostListener('window:resize')
    onResize(): void {
        this.measureContainer();
        // keep the image fitted if the user hasn't manually zoomed
        if (this.zoom === this.fitZoom) {
            this.setFitZoom();
        }
    }

    // ---------------- Download ----------------

    private getDecodedFileName(fileName: string): string {
        try {
            return decodeURIComponent(fileName);
        } catch (e) {
            try {
                const decoder = new TextDecoder('utf-8');
                const encoded = new TextEncoder().encode(fileName);
                return decoder.decode(encoded);
            } catch (error) {
                // fall through
            }
            try {
                return decodeURIComponent(escape(fileName));
            } catch (error) {
                console.log('Escape method failed');
            }
            return fileName;
        }
    }

    downloadImage(): void {
        const decodedFileName = this.getDecodedFileName(this.file.title);

        fetch(this.file.url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.blob();
            })
            .then(blob => {
                let finalFileName = decodedFileName;
                if (blob.type && !finalFileName.includes('.')) {
                    const extension = blob.type.split('/')[1];
                    if (extension) {
                        finalFileName = `${finalFileName}.${extension}`;
                    }
                }

                const link = document.createElement('a');
                const url = window.URL.createObjectURL(blob);

                link.href = url;
                link.download = finalFileName;
                link.style.display = 'none';

                document.body.appendChild(link);
                link.click();

                setTimeout(() => {
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                }, 100);
            })
            .catch(error => {
                console.error('Download error:', error);

                const link = document.createElement('a');
                link.href = this.file.url;
                link.download = decodedFileName;
                link.style.display = 'none';
                document.body.appendChild(link);

                try {
                    link.click();
                } catch (fallbackError) {
                    console.error('Fallback also failed:', fallbackError);
                }

                setTimeout(() => document.body.removeChild(link), 100);
            });
    }

    generateDownloadLink(uri: string): string {
        return `${uri}?download=true`;
    }
}
