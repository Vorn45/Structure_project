// ===========================================================================>> Core Library
import { Component, EventEmitter, Input, Output, ViewChild, forwardRef }             from '@angular/core';
import { CommonModule, formatDate }                                                  from '@angular/common';
import { ControlValueAccessor, FormControl, ReactiveFormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

// ===========================================================================>> Third Party Library
// > Angular Material
import { MatIconModule }                                                             from '@angular/material/icon';
import { MatFormFieldModule }                                                        from '@angular/material/form-field';
import { MatInputModule }                                                            from '@angular/material/input';
import { MatDatepickerModule }                                                       from '@angular/material/datepicker';
import { MatNativeDateModule }                                                       from '@angular/material/core';
import { MatDatepicker }                                                             from '@angular/material/datepicker';

// ======================================= >> Code Starts Here << ========================== //


@Component({
    selector    : 'inline-datepicker',
    templateUrl : './template.html',
    standalone  : true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatIconModule,
    ],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => InlineDatepickerComponent),
            multi: true,
        },
    ],
})
export class InlineDatepickerComponent implements ControlValueAccessor {

    @Input() isLoading         : boolean = false;
    @Input() label!            : string;
    @Input() icon              : string = 'mdi:calendar';
    @Input() isEditing         : boolean = false;
    @Input() fieldKey!         : string;
    @Input() disableEdit       : boolean = false;
    @Input() required          : boolean = false;
    @Input() placeholder       : string = 'Click to edit';
    @Input() activePlaceholder : string = 'Choose a date';
    @Input() current_lang      : string = 'en';

    @Output() editToggle = new EventEmitter<string>();
    @Output() save = new EventEmitter<{ fieldKey: string; value: string }>();

    @ViewChild('picker') picker!: MatDatepicker<Date>;

    formControl = new FormControl();

    private onChange = (value: any) => {};
    private onTouched = () => {};

    constructor() {
        this.formControl.valueChanges.subscribe((value) => {
            this.onChange(value);
            this.onTouched();
        });
    }

    onToggleEdit(): void {
        if (this.disableEdit) return;

        const wasNotEditing = !this.isEditing; // Store the current state
        this.editToggle.emit(this.fieldKey);

        // Only auto-open datepicker when ENTERING edit mode, not when exiting
        if (wasNotEditing) {
            setTimeout(() => {
                this.openDatepicker();
            }, 100);
        }
    }

    formatDate(date: Date | null, lang: string = 'en'): string {
        if (!date) return '';

        const day = date.getDate();
        const month = date.getMonth();
        const year = date.getFullYear();

        if (lang === 'kh') {
            // Khmer months with Latin numerals
            const khmerMonths = [
                'មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា',
                'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'
            ];

            const sameYear = year === new Date().getFullYear();
            return sameYear ? `${day} ${khmerMonths[month]}` : `${day} ${khmerMonths[month]} ${year}`;
        } else {
            // English format
            return formatDate(date, 'dd MMMM yyyy', 'en-US');
        }
    }

    openDatepicker(): void {
        if (this.picker) {
            this.picker.open();
        }
    }

    onDateSelected(): void {
        if (this.formControl.valid && this.formControl.value) {
            const formattedDate = formatDate(
                this.formControl.value,
                'yyyy-MM-dd',
                'en-US'
            );
            this.save.emit({
                fieldKey: this.fieldKey,
                value: formattedDate,
            });
            this.editToggle.emit(this.fieldKey);
            if (this.picker) {
                this.picker.close();
            }
        }
    }

    writeValue(value: any): void {
        let dateValue: Date | null = null;

        if (value) {
            if (value instanceof Date) {
                dateValue = value;
            } else if (typeof value === 'string') {
                dateValue = new Date(value);
                // Check if the date is valid
                if (isNaN(dateValue.getTime())) {
                    dateValue = null; // Handle invalid date strings
                }
            }
        }

        if (this.formControl.value !== dateValue) {
            this.formControl.setValue(dateValue, { emitEvent: false });
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
