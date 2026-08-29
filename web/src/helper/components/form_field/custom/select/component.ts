// ===========================================================================>> Core Library
import { CommonModule }                                                       from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, Output, ViewChild }      from '@angular/core';

// ===========================================================================>> Third Party Library
// > Angular CDK
import { ConnectedPosition, OverlayModule }                                   from '@angular/cdk/overlay';
// > Angular Material
import { MatIconModule }                                                      from '@angular/material/icon';
import { MatProgressSpinnerModule }                                           from '@angular/material/progress-spinner';

// ======================================= >> Code Starts Here << ========================== //

/**
 * A dropdown built from scratch on the CDK overlay - no mat-form-field and no
 * ControlValueAccessor, so it carries none of the label / hint / error chrome
 * and needs no form directive. Drive it with plain bindings:
 *
 *   <custom-select [value]="roleId" (valueChange)="setRole($event)" [options]="roles()" />
 *
 * Use `custom-mat-select` instead when the field belongs to a form and needs
 * validation messages.
 */
@Component({
    selector: 'custom-select',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: './style.scss',
    imports: [
        CommonModule,
        OverlayModule,
        MatIconModule,
        MatProgressSpinnerModule,
    ],
})
export class CustomSelectComponent {

    @ViewChild('triggerButton') private triggerButton?: ElementRef<HTMLButtonElement>;
    @ViewChild('panel') private panel?: ElementRef<HTMLElement>;
    @ViewChild('searchInput') private searchInput?: ElementRef<HTMLInputElement>;

    // Value - plain in/out binding, `[(value)]` also works
    @Input() value: any = null;
    @Output() valueChange = new EventEmitter<any>();

    // Data
    @Input() options: any[] = [];
    @Input() optionValue: string = 'id';
    @Input() optionLabelEn: string = 'name_en';
    @Input() optionLabelKh: string = 'name_kh';

    // Display
    @Input() currentLang: string = 'en';
    @Input() placeholder: string = 'Select';
    @Input() placeholderKh: string = 'ជ្រើសរើស';
    @Input() icon: string = '';
    @Input() ariaLabel: string = '';
    /** Panel width in px; defaults to the trigger width. */
    @Input() panelWidth: number | null = null;

    // State
    @Input() disabled: boolean = false;
    @Input() loading: boolean = false;

    // Search
    @Input() allowSearch: boolean = false;
    @Input() searchPlaceholder: string = 'Search...';
    @Input() searchPlaceholderKh: string = 'ស្វែងរក...';

    // Empty message
    @Input() emptyText: string = 'No results found';
    @Input() emptyTextKh: string = 'រកមិនឃើញ';

    @Output() openedChange = new EventEmitter<boolean>();

    /** Panel sits under the trigger, flipping above it when there is no room. */
    readonly positions: ConnectedPosition[] = [
        { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
        { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
    ];

    isOpen: boolean = false;
    searchTerm: string = '';
    /** Keyboard-highlighted option, an index into `filteredOptions`. */
    activeIndex: number = -1;
    triggerWidth: number = 0;

    get activeLang(): 'en' | 'kh' {
        return this.currentLang === 'kh' ? 'kh' : 'en';
    }

    get isDisabled(): boolean {
        return this.disabled || this.loading;
    }

    get currentPlaceholder(): string {
        return this.activeLang === 'en' ? this.placeholder : this.placeholderKh;
    }

    get currentSearchPlaceholder(): string {
        return this.activeLang === 'en' ? this.searchPlaceholder : this.searchPlaceholderKh;
    }

    get currentEmptyText(): string {
        return this.activeLang === 'en' ? this.emptyText : this.emptyTextKh;
    }

    get hasValue(): boolean {
        return this.value !== null && this.value !== undefined && this.value !== '';
    }

    get selectedLabel(): string {
        const selected = (this.options || []).find(option => this.optionValueOf(option) === this.value);
        return selected ? this.optionLabelOf(selected) : '';
    }

    get filteredOptions(): any[] {
        if (!this.options?.length) return [];
        if (!this.allowSearch || !this.searchTerm.trim()) return this.options;

        const term = this.searchTerm.trim().toLowerCase();
        return this.options.filter(option => {
            const en = (option[this.optionLabelEn] || '').toString().toLowerCase();
            const kh = (option[this.optionLabelKh] || '').toString().toLowerCase();
            return en.includes(term) || kh.includes(term);
        });
    }

    optionValueOf(option: any): any {
        return option?.[this.optionValue];
    }

    optionLabelOf(option: any): string {
        if (!option) return '';
        const primary = this.activeLang === 'en' ? this.optionLabelEn : this.optionLabelKh;
        const fallback = this.activeLang === 'en' ? this.optionLabelKh : this.optionLabelEn;
        return option[primary] || option[fallback] || '';
    }

    isSelected(option: any): boolean {
        return this.hasValue && this.optionValueOf(option) === this.value;
    }

    // ===========================================================>> Open / close

    toggle(): void {
        this.isOpen ? this.close() : this.open();
    }

    open(): void {
        if (this.isDisabled || this.isOpen) return;

        this.triggerWidth = this.triggerButton?.nativeElement.offsetWidth ?? 0;
        this.searchTerm = '';
        // Start the keyboard cursor on the current value so arrow keys continue from it.
        this.activeIndex = this.filteredOptions.findIndex(option => this.isSelected(option));
        this.isOpen = true;
        this.openedChange.emit(true);

        // The panel only exists once the overlay has rendered.
        setTimeout(() => (this.searchInput ?? this.panel)?.nativeElement.focus());
    }

    close(returnFocus: boolean = false): void {
        if (!this.isOpen) return;

        this.isOpen = false;
        this.searchTerm = '';
        this.activeIndex = -1;
        this.openedChange.emit(false);

        if (returnFocus) {
            this.triggerButton?.nativeElement.focus();
        }
    }

    select(option: any): void {
        const value = this.optionValueOf(option);
        this.value = value;
        this.valueChange.emit(value);
        this.close(true);
    }

    // ===========================================================>> Keyboard

    onTriggerKeydown(event: KeyboardEvent): void {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            this.open();
        }
    }

    onPanelKeydown(event: KeyboardEvent): void {
        const total = this.filteredOptions.length;

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                if (total) this.setActive((this.activeIndex + 1) % total);
                break;

            case 'ArrowUp':
                event.preventDefault();
                if (total) this.setActive((this.activeIndex - 1 + total) % total);
                break;

            case 'Home':
                event.preventDefault();
                if (total) this.setActive(0);
                break;

            case 'End':
                event.preventDefault();
                if (total) this.setActive(total - 1);
                break;

            case 'Enter':
                event.preventDefault();
                if (this.activeIndex >= 0 && this.activeIndex < total) {
                    this.select(this.filteredOptions[this.activeIndex]);
                }
                break;

            case 'Escape':
            case 'Tab':
                this.close(true);
                break;
        }
    }

    onSearch(event: Event): void {
        this.searchTerm = (event.target as HTMLInputElement).value;
        this.activeIndex = this.filteredOptions.length ? 0 : -1;
    }

    private setActive(index: number): void {
        this.activeIndex = index;
        this.panel?.nativeElement
            .querySelector(`[data-option-index="${index}"]`)
            ?.scrollIntoView({ block: 'nearest' });
    }
}
