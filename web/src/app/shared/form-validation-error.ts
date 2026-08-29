import { CommonModule }       from "@angular/common";
import { Component, Input }   from "@angular/core";
import { AbstractControl }    from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { TranslocoModule }    from "@ngneat/transloco";

@Component({
    selector: 'form-validation-error',
    template: `
        @if (control?.invalid && (control?.dirty || control?.touched)) {
            @if (control?.hasError('required')) {
                <mat-error>{{ 'Validation.Required' | transloco }}</mat-error>
            }
            @else if (control?.hasError('maxlength')) {
                <mat-error>
                    {{ 'Validation.MaxLength' | transloco: { length: control?.getError('maxlength')?.requiredLength } }}
                </mat-error>
            }
            @else if (control?.hasError('minlength')) {
                <mat-error>
                    {{ 'Validation.MinLength' | transloco: { length: control?.getError('minlength')?.requiredLength } }}
                </mat-error>
            }
            @else if (control?.hasError('min')) {
                <mat-error>
                    {{ 'Validation.Min' | transloco: { min: control?.getError('min')?.min } }}
                </mat-error>
            }
            @else if (control?.hasError('max')) {
                <mat-error>
                    {{ 'Validation.Max' | transloco: { max: control?.getError('max')?.max } }}
                </mat-error>
            }
            @else if (control?.hasError('email')) {
                <mat-error>{{ 'Validation.Pattern-Email' | transloco }}</mat-error>
            }
            @else if (control?.hasError('pattern')) {
                <mat-error>{{ getPatternError() | transloco }}</mat-error>
            }
        }
    `,
    styles: [`
        :host ::ng-deep mat-error {
            // font-size: var(--mat-form-field-subscript-text-size) !important;
            // line-height: var(--mat-form-field-subscript-text-line-height) !important;
            font-size: 14px !important;
            line-height: 20px !important;
        }
    `],
    standalone: true,
    imports: [CommonModule, MatFormFieldModule, TranslocoModule]
})
export class FormValidationErrorComponent {
    @Input() control: AbstractControl | null = null;
    @Input() patternType?: 'phone' | 'email' | 'kh' | 'en'; // Optional: specify pattern type

    /**
     * Determine the appropriate pattern error message based on the pattern regex
     */
    getPatternError(): string {
        if (!this.control) return 'Validation.Pattern';

        // If pattern type is explicitly provided, use it
        if (this.patternType) {
            return `Validation.Pattern-${this.patternType === 'phone' ? 'Phone' :
                    this.patternType === 'email' ? 'Email' :
                    this.patternType === 'kh' ? 'KH' :
                    this.patternType === 'en' ? 'EN' : 'Pattern'}`;
        }

        // Otherwise, try to detect pattern type from the regex
        const patternError = this.control.getError('pattern');
        if (patternError?.requiredPattern) {
            const pattern = patternError.requiredPattern;

            // Phone pattern detection
            if (pattern.includes('+855') || pattern.includes('[1-9]\\d{7,8}')) {
                return 'Validation.Pattern-Phone';
            }

            // Khmer Unicode range detection
            if (pattern.includes('\\u1780-\\u17FF') || pattern.includes('ក-អ')) {
                return 'Validation.Pattern-KH';
            }

            // Latin/English pattern detection
            if (pattern.includes('a-zA-Z') && !pattern.includes('\\u')) {
                return 'Validation.Pattern-EN';
            }
        }

        // Default pattern error
        return 'Validation.Pattern';
    }
}
