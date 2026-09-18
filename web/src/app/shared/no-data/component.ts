import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { animate, style, transition, trigger } from '@angular/animations';


export * from './no-data.types';
import { APPS_ICON_TYPES, IMAGE_ILLUSTRATIONS, RECOLORED_ILLUSTRATIONS, ICON_MARGIN_OVERRIDES, NoDataType } from './no-data.types';

@Component({
    standalone: true,
    imports: [MatIconModule],
    selector: 'no-data-component',
    host: { class: 'block w-full' },
    templateUrl: './template.html',
    styleUrl: './style.scss',
})
export class NoDataComponent implements OnChanges {
    private readonly _http = inject(HttpClient);
    private readonly _sanitizer = inject(DomSanitizer);

    @Input() type: NoDataType = 'user';
    @Input() message = 'មិនមានទិន្នន័យ';
    @Input() title?: string;
    @Input() description = '';
    @Input() actionLabel = '';
    @Input() surface = false;
    @Output() actionClick = new EventEmitter<void>();
    @Input() fullHeight = false;
    /** Extra CSS classes applied to the outer container (e.g. "mb-12" to nudge the whole block up). */
    @Input() containerClass = '';
    /** Bump the illustration + message for full-page empty states. */
    @Input() large = false;
    /** Extra CSS classes applied to the message text (e.g. "ml-8" to nudge it horizontally). */
    @Input() messageClass = '';
    /** Override the message's vertical offset from the illustration (any CSS length, e.g. "0", "8px").
     *  Useful because each illustration has a different amount of built-in bottom whitespace. */
    @Input() messageOffset?: string;
    /** Override the illustration size with any CSS length (e.g. "560px" or a clamp()). Falls back to the responsive default. */
    @Input() size?: string;
    /** Override the message text-size class (e.g. "text-4xl"). Falls back to the `large`-based default. */
    @Input() messageSizeClass?: string;

    recoloredSvg: SafeHtml | null = null;
    private _recoloredCache = new Map<string, string>();

    ngOnChanges(): void {
        if (!this.isRecoloredIllustration) return;
        const path = RECOLORED_ILLUSTRATIONS[this.type];
        const cached = this._recoloredCache.get(path);
        if (cached) {
            this.recoloredSvg = this._sanitizer.bypassSecurityTrustHtml(cached);
            return;
        }
        this._http.get(path, { responseType: 'text' }).subscribe({
            next: (svg) => {
                const recolored = svg.replace(/#FF725E/gi, 'rgb(var(--helper-primary-rgb))');
                this._recoloredCache.set(path, recolored);
                this.recoloredSvg = this._sanitizer.bypassSecurityTrustHtml(recolored);
            },
            error: () => {},
        });
    }

    get isRecoloredIllustration(): boolean {
        return this.type in RECOLORED_ILLUSTRATIONS;
    }

    get displayTitle(): string {
        return this.title ?? this.message;
    }

    get resolvedContainerClass(): string {
        const surfaceClasses = this.surface
            ? 'bg-primary/5 dark:bg-primary/10 rounded-2xl py-3'
            : '';
        return `${surfaceClasses} ${this.containerClass}`.trim();
    }

    /** Full class list for the message: base color + size (explicit override, else `large`-based) + any caller extras. */
    get messageClasses(): string {
        const size = this.messageSizeClass ?? (this.large ? 'text-2xl' : 'text-lg sm:text-xl');
        return `text-center text-slate-500 dark:text-slate-400 ${size} ${this.messageClass}`.trim();
    }

    get titleClasses(): string {
        if (!this.title) return this.messageClasses;
        const size = this.messageSizeClass ?? (this.large ? 'text-2xl' : 'text-xl sm:text-2xl');
        return `text-center font-medium text-slate-900 dark:text-slate-100 ${size} ${this.messageClass}`.trim();
    }

    /** Fluid illustration size: scales with the viewport, capped so it never overflows narrow phones. */
    get iconSize(): string {
        if (this.size) return this.size;
        return this.large ? 'clamp(180px, 60vw, 360px)' : 'clamp(150px, 50vw, 280px)';
    }

    /** Plain inline states trim the illustration's built-in top whitespace. Full-height and surfaced
     *  states keep the natural box so the illustration and message remain centred together. */
    get iconMargin(): string {
        if (this.fullHeight || this.surface) return '0';
        return ICON_MARGIN_OVERRIDES[this.type] ?? 'calc(var(--nd-icon) * -0.24)';
    }

    /** Gap between the illustration and the message. Defaults to a small consistent space; callers can
     *  override per-instance via `messageOffset` (e.g. a negative value to pull the text up). */
    get messageMargin(): string {
        return this.messageOffset ?? '0.25rem';
    }

    get isAppsIcon(): boolean {
        return APPS_ICON_TYPES.has(this.type);
    }

    get imgSrc(): string {
        return IMAGE_ILLUSTRATIONS[this.type] ?? `images/avatars/${this.type}.png`;
    }
}
