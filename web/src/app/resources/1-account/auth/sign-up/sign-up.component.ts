// ================================================================================>> Main Library
import { CommonModule }                                                                               from '@angular/common';
import { Component, OnInit, ViewChild, ViewEncapsulation }                                            from '@angular/core';
import { AbstractControl, FormsModule, NgForm, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink }                                                                                     from '@angular/router';

// ================================================================================>> Third Party Library
// Material
import { MatButtonModule }                                                                            from '@angular/material/button';
import { MatCheckboxModule }                                                                          from '@angular/material/checkbox';
import { MatFormFieldModule }                                                                         from '@angular/material/form-field';
import { MatIconModule }                                                                              from '@angular/material/icon';
import { MatInputModule }                                                                             from '@angular/material/input';
import { MatProgressSpinnerModule }                                                                   from '@angular/material/progress-spinner';
import { MatOptionModule }                                                                            from '@angular/material/core';
import { MatSelectModule }                                                                            from '@angular/material/select';

// Transloco
import { TranslocoModule }                                                                            from '@ngneat/transloco';

// ================================================================================>> Custom Library
// ===>> Env
import { env }                                                                                        from 'envs/env';

// ===>> Helper Library
import { helperAnimations }                                                                           from 'helper/animations';
import { SnackbarService }                                                                            from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants                                                                                from 'helper/shared/constants';

// ===>> Shared
import { ErrorHandleService }                                                                         from 'app/shared/error-handle.service';

// ===>> Service
import { AuthService }                                                                                from 'app/core/auth/auth.service';

export interface Group {
    id: number;
    name: string;
    [key: string]: any;
}

// ===>> Component
import { LanguagesComponent }                                                                         from 'app/layout/common/languages/languages.component';
import { AuthOTPComponent }                                                                           from '../otp';
import { debounceTime, distinctUntilChanged, first, map, Observable, of, switchMap, take } from 'rxjs';

@Component({
    selector      : 'auth-sign-up',
    templateUrl   : './sign-up.component.html',
    styleUrl      : './sign-up.component.scss',
    encapsulation : ViewEncapsulation.None,
    animations    : helperAnimations,
    standalone    : true,
    imports       : [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatOptionModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatCheckboxModule,
        MatProgressSpinnerModule,
        LanguagesComponent,
        AuthOTPComponent,
        TranslocoModule,
        MatSelectModule,
        RouterLink
    ],
})
export class AuthSignUpComponent implements OnInit {

    @ViewChild('signUpNgForm') signUpNgForm: NgForm;

    public signUpForm : UntypedFormGroup;
    public isOTP      : boolean = false;
    public groups     : Group[] = [];
    public appVersion : string = env.APP_VERSION;
    public isLoading  : boolean = false;

    public isEmail: boolean = false;
    username: string
    schools: any
    request_data: any
    finalToken: any
    filteredSchools: any
    /**
     * Constructor
     */
    constructor(
        private _authService        : AuthService,
        private _formBuilder        : UntypedFormBuilder,
        private _router             : Router,
        private _snackbarService    : SnackbarService,
        private _errorHandleService : ErrorHandleService,
        private route: ActivatedRoute
    ) {
        const navigation = this._router.getCurrentNavigation();
        if (navigation?.extras.state) {
            this.username = navigation.extras.state['username'];
            this.finalToken = navigation.extras.state['finalToken'];
        } else {
            // If the user reloads the page, get state from history
            this.username = history.state.username;
            this.finalToken = history.state.finalToken;
        }
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        this.getDataSetup();

        // Initialize form with validators
        this.signUpForm = this._formBuilder.group({
            name: ['', [Validators.required, Validators.pattern('^[\u1780-\u17FF\u19E0-\u19FF\u0020\u200B\s]+$')]],
            phone: ['', [Validators.required, Validators.pattern('^\\+?[0-9]{9,15}$')]],
            group_id: [1, [Validators.required]],
            school_id: [null, Validators.required]
        });

        this.getDataSetup();
    }

    /**
     * Sign up
    */
    signUp(): void {
        // Return if the form is invalid
        if (this.signUpForm.invalid) {
            // Mark all fields as touched to show validation errors
            this.signUpForm.markAllAsTouched();
            return;
        }

        const formData = this.signUpForm.value;

        // Validate that we have the required data
        if (!formData.name || !formData.phone || !formData.group_id || !formData.school_id) {
            console.error('Missing required form data:', formData);
            this._snackbarService.openSnackBar('Please fill in all required fields', 'error');
            return;
        }

        // Disable the form AFTER getting the values
        this.signUpForm.disable();

        // Prepare request data
        this.request_data = {
            finalToken: this.finalToken,
            data: formData
        };

        // Note: Make sure this.username is properly set somewhere
        this.navigateToPassword(this.username);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------
    getDataSetup(): void {
        this.isLoading = true;
        this._authService.getDataSetup().subscribe({
            next: (res: any) => {
                this.groups = res.groups;
                this.schools = res.school;

                // Initialize filteredSchools based on initial group_id value
                const initialGroupId = this.signUpForm.get('group_id')?.value || 1;
                this.filteredSchools = this.schools.filter(school => school.group_id === initialGroupId);

                // Subscribe here so that schools data is ready when filtering
                this.signUpForm.get('group_id')?.valueChanges.subscribe(groupId => {
                    this.filteredSchools = this.schools.filter(school => school.group_id === groupId);
                    this.signUpForm.patchValue({ school_id: null }, { emitEvent: false }); // reset selection without triggering further events
                });

                this.isLoading = false;
            },
            error: err => {
                this._snackbarService.openSnackBar(err.error?.message ?? GlobalConstants.genericError, GlobalConstants.error);
                this.isLoading = false;
            }
        });
    }

    navigateToPassword(username: string): void {
        this._router.navigate(['/auth/verify-code-email/password'], { state: { username, type: 'signUp', data: this.request_data} });
    }


    validatePhoneUniqueness(control: AbstractControl): Observable<ValidationErrors | null> {
        if (!control.value || control.invalid) {
            return of(null);
        }

        return of(control.value).pipe(
            debounceTime(500), // Wait 500ms after last keystroke
            distinctUntilChanged(), // Only if value changed
            switchMap(phone => this._authService.checkPhoneExists(phone)),
            map(exists => exists ? { phoneExists: true } : null),
            first() // Complete the observable
        );
    }


    validateEmailUniqueness(control: AbstractControl): Observable<ValidationErrors | null> {
        if (!control.value || control.invalid) {
            return of(null);
        }

        return of(control.value).pipe(
            debounceTime(500),
            distinctUntilChanged(),
            switchMap(email => this._authService.checkEmailExists(email)),
            map(exists => exists ? { emailExists: true } : null),
            first()
        );
    }
    /**
     * Function to allow only numbers in the input field
     */
    allowOnlyNumbers(event: KeyboardEvent): void {
        const key = event.key;
        if (!/^\d$/.test(key) && key !== 'Backspace' && key !== 'Delete') {
            event.preventDefault();
        }
    }

    /**
     * Navigate to sign-in
     */
    navigateToSignIn(): void {
        this._router.navigateByUrl('/auth/sign-in');
    }
}
