// ===========================================================================>> Core Library
import { Component, Input, Output, EventEmitter, ViewChild, Optional, Self } from '@angular/core';

import { FormsModule, ReactiveFormsModule, ControlValueAccessor, NgControl } from '@angular/forms';

// ===========================================================================>> Third Party Library
// > Angular Material
import { MatFormFieldModule }                                                from '@angular/material/form-field';
import { MatSelectModule, MatSelect }                                        from '@angular/material/select';
import { MatIconModule }                                                     from '@angular/material/icon';
import { MatInputModule }                                                    from '@angular/material/input';
import { MatProgressSpinnerModule }                                          from '@angular/material/progress-spinner';
import { ErrorStateMatcher }                                                 from '@angular/material/core';

// ===========================================================================>> Custom Library
// > Shared
import { FormValidationErrorComponent }                                      from 'app/shared/form-validation-error';

// ======================================= >> Code Starts Here << ========================== //


class CustomErrorStateMatcher implements ErrorStateMatcher {
    constructor(private customControl: CustomMatSelectComponent) {}

    isErrorState(): boolean {
        const control = this.customControl.ngControl?.control;
        return !!(control && control.invalid && (control.dirty || control.touched));
    }
}

@Component({
    selector: 'custom-mat-select',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: './style.scss',
    imports: [
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatSelectModule,
        MatIconModule,
        MatInputModule,
        MatProgressSpinnerModule,
        FormValidationErrorComponent
    ]
})
export class CustomMatSelectComponent implements ControlValueAccessor {

    @ViewChild('selectField') selectField: MatSelect = {} as MatSelect;

    // Configuration Inputs
    @Input() currentLang         : string = 'en';
    @Input() appearance          : 'fill' | 'outline' = 'outline';
    @Input() subscriptSizing     : 'fixed' | 'dynamic' = 'fixed';

    // Label & Icon
    @Input() label               : string = '';
    @Input() labelKh             : string = '';
    @Input() icon                : string = '';
    @Input() placeholder         : string = '';
    @Input() placeholderKh       : string = '';

    // Data
    @Input() options             : any[] = [];
    @Input() optionValue         : string = 'code';
    @Input() optionLabelEN       : string = 'name_en';
    @Input() optionLabelKH       : string = 'name_kh';
    @Input() multiple            : boolean = false;

    // Avatar Configuration (e.g. people pickers)
    @Input() showAvatar          : boolean = false;
    @Input() optionImage         : string = 'image';

    // Search Configuration
    @Input() allowSearch         : boolean = false;
    @Input() searchPlaceholderEN : string = 'Search...';
    @Input() searchPlaceholderKH : string = 'ស្វែងរក...';

    // Loading State
    @Input() loading             : boolean = false;

    // Manual disable state (alongside form control disabled)
    @Input()
    set disable(value: boolean | string | null | undefined) {
        // Support boolean bindings and legacy empty-string attribute usage
        this.manualDisabled = value === '' || value === true || value === 'true';
    }
    get disable(): boolean {
        return this.manualDisabled;
    }

    // Create New Option
    @Input() allowCreate         : boolean = false;
    @Input() createNewText       : string = 'Type to create new';
    @Input() createNewTextKh     : string = 'វាយបញ្ចូលដើម្បីបង្កើតថ្មី';

    // Outputs
    @Output() selectionChange    = new EventEmitter<any>();
    @Output() createNew          = new EventEmitter<string>();

    // Internal State
    public searchTerm            : string = '';
    public value                 : any = null;
    public disabled              : boolean = false;
    private manualDisabled       : boolean = false;
    public touched               : boolean = false;

    // Error State Matcher
    public errorStateMatcher: ErrorStateMatcher;

    // ControlValueAccessor callbacks
    private onChange             : (value: any) => void = () => {};
    private onTouched            : () => void = () => {};

    constructor(
        @Self() @Optional() public ngControl: NgControl
    ) {
        if (this.ngControl) {
            this.ngControl.valueAccessor = this;
        }
        // Initialize the custom error state matcher
        this.errorStateMatcher = new CustomErrorStateMatcher(this);
    }

    get activeLang(): 'en' | 'kh' {
        return this.currentLang === 'kh' ? 'kh' : 'en';
    }

    get currentLabel(): string {
        return this.activeLang === 'en' ? this.label : this.labelKh;
    }

    get currentPlaceholder(): string {
        return this.activeLang === 'en' ? this.placeholder : this.placeholderKh;
    }

    get currentSearchPlaceholder(): string {
        return this.activeLang === 'en' ? this.searchPlaceholderEN : this.searchPlaceholderKH;
    }

    get filteredOptions(): any[] {
        if (!this.options || this.options.length === 0) return [];

        if (!this.allowSearch || !this.searchTerm.trim()) {
            return this.options;
        }

        const searchLower = this.searchTerm.toLowerCase();
        const filtered = this.options.filter(option => {
            const nameEn = option[this.optionLabelEN]?.toLowerCase() || '';
            const nameKh = option[this.optionLabelKH]?.toLowerCase() || '';
            return nameEn.includes(searchLower) || nameKh.includes(searchLower);
        });

        // Keep selected options visible while searching, including multi-select values.
        const selectedValues = Array.isArray(this.value)
            ? this.value
            : this.value != null
              ? [this.value]
              : [];
        const selectedOptions = this.options.filter(option =>
            selectedValues.includes(option[this.optionValue]),
        );
        for (const selectedOption of selectedOptions.reverse()) {
            if (!filtered.includes(selectedOption)) {
                filtered.unshift(selectedOption);
            }
        }

        return filtered;
    }

    get showCreateOption(): boolean {
        return this.allowCreate &&
                this.searchTerm.trim() &&
                this.filteredOptions.length === 0;
    }

    get showNoResults(): boolean {
        return !this.allowCreate &&
                this.allowSearch &&
                this.searchTerm.trim() &&
                this.filteredOptions.length === 0;
    }

    // ControlValueAccessor Implementation
    writeValue(value: any): void {
        this.value = value;
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    // Event Handlers
    onSelectionChanged(value: any): void {
        this.value = value;
        this.onChange(value);
        this.markAsTouched();
        this.selectionChange.emit(value);
    }

    onPanelClosed(): void {
        this.searchTerm = '';
        this.markAsTouched();
    }

    onCreateNew(): void {
        const newValue = this.searchTerm.trim();
        this.createNew.emit(newValue);
        this.searchTerm = '';
        this.selectField.close();
    }

    markAsTouched(): void {
        if (!this.touched) {
            this.onTouched();
            this.touched = true;
        }
    }

    getOptionDisplay(option: any): string {
        if (!option) {
            return '';
        }
        const primary = this.activeLang === 'en' ? this.optionLabelEN : this.optionLabelKH;
        const fallback = this.activeLang === 'en' ? this.optionLabelKH : this.optionLabelEN;
        return option[primary] || option[fallback] || option.label || option.code || '';
    }

    getOptionValue(option: any): any {
        return option[this.optionValue];
    }

    getOptionImage(option: any): string | null {
        return option?.[this.optionImage] || null;
    }

    onOptionImgError(event: Event): void {
        (event.target as HTMLImageElement).style.display = 'none';
    }

    isOptionSelected(option: any): boolean {
        const optionValue = this.getOptionValue(option);
        return Array.isArray(this.value)
            ? this.value.includes(optionValue)
            : this.value === optionValue;
    }

    removeOption(event: Event, option: any): void {
        event.stopPropagation();
        const optionValue = this.getOptionValue(option);
        const newValue = Array.isArray(this.value)
            ? this.value.filter((v: any) => v !== optionValue)
            : null;
        this.value = newValue;
        this.onChange(newValue);
        this.markAsTouched();
        this.selectionChange.emit(newValue);
    }

    get selectedOptions(): any[] {
        if (!this.options || this.options.length === 0) return [];
        const selectedValues = Array.isArray(this.value)
            ? this.value
            : this.value != null
              ? [this.value]
              : [];
        return this.options.filter(option => selectedValues.includes(this.getOptionValue(option)));
    }

    get isDisabled(): boolean {
        return this.manualDisabled || this.disabled || this.loading;
    }
}
