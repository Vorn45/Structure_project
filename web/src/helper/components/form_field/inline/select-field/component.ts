// ===========================================================================>> Core Library
import { Component, EventEmitter, Input, Output, ViewChild, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormControl, ReactiveFormsModule, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

// ===========================================================================>> Third Party Library
// > Angular Material
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelect, MatSelectModule } from '@angular/material/select';

// ======================================= >> Code Starts Here << ========================== //


@Component({
    selector    : 'inline-select-field',
    templateUrl : './template.html',
    standalone  : true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        MatIconModule,
        MatInputModule,
        MatSelectModule,
    ],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => InlineSelectFieldComponent),
            multi: true,
        },
    ],
})
export class InlineSelectFieldComponent implements ControlValueAccessor {

    @Input() label!            : string;
    @Input() icon              : string = 'mdi:account';
    @Input() isEditing         : boolean = false;
    @Input() fieldKey!         : string;
    @Input() options           : any[] = [];
    @Input() optionValue       : string = 'value';
    @Input() optionLabel       : string = 'label';
    @Input() disableEdit       : boolean = false;
    @Input() required          : boolean = false;
    @Input() placeholder       : string = 'Click to edit';
    @Input() activePlaceholder : string = 'Choose an option';
    @Input() enableSearch      : boolean = false;
    @Input() searchPlaceholder : string = 'Search...';
    @Input() noResultsText     : string = 'No results found';
    @Input() noDataText        : string = 'No data available';

    @Output() editToggle = new EventEmitter<string>();
    @Output() save = new EventEmitter<{ fieldKey: string; value: any }>();

    @ViewChild('selectEl') selectEl?: MatSelect;

    // Internal form control
    formControl = new FormControl();

    // Search functionality
    public searchTerm: string = '';

    // ControlValueAccessor implementation
    private onChange = (value: any) => {};
    private onTouched = () => {};

    constructor() {
        this.formControl.valueChanges.subscribe((value) => {
            this.onChange(value);
            this.onTouched();
        });
    }

    // Check if there are any options available
    get hasOptions(): boolean {
        return this.options && this.options.length > 0;
    }

    // Get filtered options based on search term
    get filteredOptions(): any[] {
        if (!this.enableSearch || !this.searchTerm.trim()) {
            return this.options;
        }

        const searchLower = this.searchTerm.toLowerCase();

        return this.options.filter((option) => {
            // Auto-detect bilingual fields (name_en and name_kh)
            if (option.hasOwnProperty('name_en') && option.hasOwnProperty('name_kh')) {
                return (
                    (option.name_en && option.name_en.toLowerCase().includes(searchLower)) ||
                    (option.name_kh && option.name_kh.toLowerCase().includes(searchLower))
                );
            }

            // Fall back to searching the display label field
            const label = option[this.optionLabel];
            return label && label.toLowerCase().includes(searchLower);
        });
    }

    // Get the display label for the selected value
    getDisplayLabel(value: any): string {
        if (!value) return '';
        const option = this.options.find(
            (opt) => opt[this.optionValue] === value
        );
        return option ? option[this.optionLabel] : value;
    }

    onToggleEdit(): void {
        if (this.isEditing && this.formControl?.invalid) return;

        const wasNotEditing = !this.isEditing;
        this.editToggle.emit(this.fieldKey);

        // If we were entering edit mode, automatically open the dropdown
        if (wasNotEditing) {
            setTimeout(() => {
                this.openDropdown();
            }, 100);
        }
    }

    // Open the dropdown
    openDropdown(): void {
        if (this.selectEl) {
            this.selectEl.open();
        }
    }

    // Clear search term when dropdown closes
    onDropdownClosed(): void {
        this.searchTerm = '';
    }

    onOptionSelected(): void {
        if (this.formControl.valid) {
            this.save.emit({
                fieldKey: this.fieldKey,
                value: this.formControl.value,
            });
            this.editToggle.emit(this.fieldKey);
            this.searchTerm = '';
        }
    }

    // ControlValueAccessor methods
    writeValue(value: any): void {
        if (this.formControl.value !== value) {
            this.formControl.setValue(value, { emitEvent: false });
        }
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        if (isDisabled) {
            this.formControl.disable();
        } else {
            this.formControl.enable();
        }
    }
}
