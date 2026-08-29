// ===========================================================================>> Core Library
import { CommonModule }                                                                                                                                  from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, forwardRef, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors }                      from '@angular/forms';

// ===========================================================================>> Third Party Library
// > Angular Material
import { MatFormFieldModule }                                                                                                                            from '@angular/material/form-field';
import { MatIconModule }                                                                                                                                 from '@angular/material/icon';
import { MatInputModule }                                                                                                                                from '@angular/material/input';
import { ENGLISH_NAME_PATTERN, KHMER_NAME_PATTERN }                                                                                                      from 'helper/validators/name.validators';

// ======================================= >> Code Starts Here << ========================== //


export type ValidationType =
    | 'name_kh'
    | 'name_en'
    | 'phone_number'
    | 'email'
    | 'phone'
    | 'id_number'
    | 'none';

export class CustomValidators {
    static khmerText(control: AbstractControl): ValidationErrors | null {
        if (!control.value) return null;
        return KHMER_NAME_PATTERN.test(control.value) ? null : { khmerText: true };
    }

    static englishText(control: AbstractControl): ValidationErrors | null {
        if (!control.value) return null;
        return ENGLISH_NAME_PATTERN.test(control.value) ? null : { englishText: true };
    }

    static numberOnly(control: AbstractControl): ValidationErrors | null {
        if (!control.value) return null;
        const numberRegex = /^\d+(\.\d+)?$/;
        return numberRegex.test(control.value) ? null : { numberOnly: true };
    }

    static email(control: AbstractControl): ValidationErrors | null {
        if (!control.value) return null;
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(control.value) ? null : { email: true };
    }

    static phoneNumber(control: AbstractControl): ValidationErrors | null {
        if (!control.value) return null;

        // Remove all spaces, hyphens, parentheses, and dots
        const cleanedValue = control.value.replace(/[\s\-\(\)\.]/g, '');

        // International phone number regex
        // Matches:
        // - Optional + followed by 1-3 digits (country code)
        // - 7-15 total digits (including country code)
        // - CAN start with 0 after country code
        const internationalPhoneRegex = /^(\+[1-9]\d{0,2})?[0-9]\d{6,14}$/;

        // For numbers without country code, including those starting with 0
        // (7-15 digits, can start with 0)
        const domesticPhoneRegex = /^[0-9]\d{6,14}$/;

        // Check if it matches international format or domestic format
        const isValid = internationalPhoneRegex.test(cleanedValue) || domesticPhoneRegex.test(cleanedValue);

        return isValid ? null : { phoneNumber: true };
    }

    // Add ID number validation
    static idNumber(control: AbstractControl): ValidationErrors | null {
        if (!control.value) return null;
        const idRegex = /^[a-zA-Z0-9]{9,}$/;
        return idRegex.test(control.value) ? null : { idNumber: true };
    }
}

@Component({
    selector    : 'inline-input-field',
    templateUrl : './template.html',
    standalone  : true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatIconModule,
        MatInputModule,
        MatFormFieldModule,
    ],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => InlineInputFieldComponent),
            multi: true,
        },
    ],
})
export class InlineInputFieldComponent implements OnInit, ControlValueAccessor, AfterViewInit, OnChanges
{
    @Input() label               : string = null;
    @Input() icon                : string = 'mdi:account';
    @Input() isEditing           : boolean = false;
    @Input() disableEdit         : boolean = false;
    @Input() fieldKey            : string = null;
    @Input() required            : boolean = false;
    @Input() validationType      : ValidationType = 'none';
    @Input() customErrorMessages : { [key: string]: string } = {};
    @Input() placeholder         : string = 'Click to edit';

    @Output() editToggle         = new EventEmitter<string>();
    @Output() save               = new EventEmitter<string>();

    @ViewChild('editInput', { static: false })
    editInput: ElementRef<HTMLInputElement>;

    // Internal form control for the component
    formControl: FormControl = new FormControl('');

    // Store the original value to handle cancellation if needed
    private originalValue: any;

    // ControlValueAccessor implementation
    private onChange = (value: any) => {};
    private onTouched = () => {};

    constructor(private _cdr: ChangeDetectorRef) {}

    ngOnInit(): void {
        this.setupValidation();

        // Subscribe to value changes to notify parent
        this.formControl.valueChanges.subscribe((value) => {
            this.onChange(value);
            this.onTouched();
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        // When validation type changes, update validators
        if (
            changes['validationType'] &&
            !changes['validationType'].firstChange
        ) {
            this.setupValidation();
        }

        // When required changes, update validators
        if (changes['required'] && !changes['required'].firstChange) {
            this.setupValidation();
        }

        // When isEditing changes to true, focus the input
        if (
            changes['isEditing'] &&
            changes['isEditing'].currentValue === true &&
            !changes['isEditing'].firstChange
        ) {
            this.originalValue = this.formControl.value;
            setTimeout(() => this.focusInput(), 0);
        }
    }

    ngAfterViewInit(): void {
        // Focus the input when entering edit mode
        if (this.isEditing && this.editInput) {
            this.focusInput();
        }
    }

    // Update setupValidation method in InlineInputFieldComponent
    private setupValidation(): void {
        const validators = [];

        if (this.required) {
            validators.push(Validators.required);
        }

        // Add validation based on type
        switch (this.validationType) {
            case 'name_kh':
                validators.push(CustomValidators.khmerText);
                validators.push(Validators.maxLength(50));
                break;
            case 'name_en':
                validators.push(CustomValidators.englishText);
                validators.push(Validators.maxLength(50));
                break;
            case 'phone_number':
                validators.push(CustomValidators.phoneNumber);
                validators.push(Validators.maxLength(15));
                break;
            case 'email':
                validators.push(CustomValidators.email);
                validators.push(Validators.maxLength(50));
                break;
            case 'id_number':
                validators.push(CustomValidators.idNumber);
                validators.push(Validators.maxLength(20));
                break;
            case 'none':
            default:
                // No additional validation
                break;
        }

        // Update form control validators
        this.formControl.setValidators(validators);
        this.formControl.updateValueAndValidity();
    }

    onToggleEdit(): void {
        if (!this.isEditing) {
            // Store original value when starting edit
            this.originalValue = this.formControl.value;
            // Emit toggle event first
            this.editToggle.emit(this.fieldKey);
            // Then focus the input after the view updates
            setTimeout(() => this.focusInput(), 0);
        } else {
            // Check if form is valid AND has a value before saving
            const hasValue = this.formControl.value && this.formControl.value.toString().trim() !== '';

            if (this.formControl.valid && hasValue) {
                // Emit save event with the current value
                this.save.emit(this.formControl.value);
                // Emit toggle event to exit edit mode
                this.editToggle.emit(this.fieldKey);
            } else {
                // Mark as touched to show validation errors (if any)
                this.formControl.markAsTouched();
                // Don't exit edit mode if invalid or empty
            }
        }
    }

    private focusInput(): void {
        if (this.editInput) {
            this.editInput.nativeElement.focus();
            // Position cursor at the end of the text instead of selecting all
            const length = this.editInput.nativeElement.value.length;
            this.editInput.nativeElement.setSelectionRange(length, length);
        }
    }

    onKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Enter') {
            event.preventDefault();

            // Check if form is valid AND has a value before saving
            const hasValue = this.formControl.value && this.formControl.value.toString().trim() !== '';

            if (this.formControl.valid && hasValue) {
                // Emit save event with the current value
                this.save.emit(this.formControl.value);
                this.editToggle.emit(this.fieldKey);
            } else {
                // If invalid or empty, mark as touched to show validation errors (if any)
                this.formControl.markAsTouched();
                // Don't exit edit mode - stay in edit mode
            }
        } else if (event.key === 'Escape') {
            event.preventDefault();
            this.cancelEdit();
        }
    }

    private cancelEdit(): void {
        // Restore original value
        this.formControl.setValue(this.originalValue, { emitEvent: true });
        // Clear validation errors
        this.formControl.markAsUntouched();
        this.editToggle.emit(this.fieldKey);
    }

    // Get the current error message
    get errorMessage(): string {
        if (
            !this.formControl.errors ||
            !(this.formControl.touched || this.formControl.dirty)
        ) {
            return '';
        }

        const errors = this.formControl.errors;
        const errorKey = Object.keys(errors)[0]; // Get first error

        console.log(errorKey);
        console.log(this.customErrorMessages[errorKey]);
        return (
            this.customErrorMessages[errorKey] || 'Please enter a valid value'
        );
    }

    // Check if the field has errors and should show them
    get hasError(): boolean {
        return (
            this.formControl.invalid &&
            this.formControl.touched &&
            this.isEditing
        );
    }

    // ControlValueAccessor methods
    writeValue(value: any): void {
        if (value !== undefined) {
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
