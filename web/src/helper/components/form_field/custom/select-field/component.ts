// ===========================================================================>> Core Library
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, forwardRef, Input, Output, ViewChild } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';

// ===========================================================================>> Third Party Library
// > Angular Material
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule, MatSelect } from '@angular/material/select';

// ======================================= >> Code Starts Here << ========================== //


@Component({
    selector: 'custom-select-field',
    templateUrl: './template.html',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatIconModule,
        MatSelectModule,
    ],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => CustomSelectFieldComponent),
            multi: true
        }
    ]
})
export class CustomSelectFieldComponent implements ControlValueAccessor {

    @ViewChild('selectField') selectField: MatSelect;

    // Inputs
    @Input() currentLang: string = 'en';
    @Input() appearance: 'default' | 'outline' = 'default';

    @Input() icon: string = 'mdi:chevron-down';
    @Input() label: string = '';
    @Input() labelKh: string = '';

    @Input() options: any[] = [];
    @Input() valueField: string = 'id';
    @Input() selectedItem: any = null;

    @Input() allowSearch: boolean = true;
    @Input() searchPlaceholder: string = 'Search...';
    @Input() searchPlaceholderKh: string = 'ស្វែងរក...';

    @Input() allowCreate: boolean = true;
    @Input() createNewText: string = 'Type to create new';
    @Input() createNewTextKh: string = 'វាយបញ្ចូលដើម្បីបង្កើតថ្មី';

    // Outputs
    @Output() selectionChange = new EventEmitter<number | string>();

    // Internal state
    public searchTerm: string = '';
    public value: any = null;
    public disabled: boolean = false;
    public touched: boolean = false;

    // ControlValueAccessor callbacks
    private onChange: (value: any) => void = () => {};
    private onTouched: () => void = () => {};

    get filteredOptions() {
        if (!this.options) return [];

        if (!this.allowSearch || !this.searchTerm.trim()) {
            return this.options;
        }

        const searchLower = this.searchTerm.toLowerCase();
        return this.options.filter(option =>
            option.name_en?.toLowerCase().includes(searchLower) ||
            option.name_kh?.toLowerCase().includes(searchLower)
        );
    }

    get displayValue(): string {
        if (!this.selectedItem) return '';
        return this.currentLang === 'en'
            ? this.selectedItem.name_en
            : this.selectedItem.name_kh;
    }

    get placeholderText(): string {
        return this.currentLang === 'en' ? this.label : this.labelKh;
    }

    // ControlValueAccessor implementation
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

    openSelect(): void {
        if (this.selectField && !this.selectField.panelOpen && !this.disabled) {
            this.selectField.open();
        }
    }

    onSelectionChanged(value: number | string): void {
        this.value = value;
        this.onChange(value);
        this.markAsTouched();
        this.selectionChange.emit(value);
    }

    onPanelClosed(): void {
        this.searchTerm = '';
        this.markAsTouched();
    }

    markAsTouched(): void {
        if (!this.touched) {
            this.onTouched();
            this.touched = true;
        }
    }

    getOptionDisplay(option: any): string {
        return this.currentLang === 'en' ? option.name_en : option.name_kh;
    }
}
