import { CommonModule }                          from '@angular/common';
import { Component, inject }                     from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule }                       from '@angular/material/button';
import { MatDatepickerModule }                   from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule }                    from '@angular/material/form-field';
import { MatIconModule }                         from '@angular/material/icon';
import { MatInputModule }                        from '@angular/material/input';
import { TranslocoModule }                       from '@ngneat/transloco';
import { FormValidationErrorComponent }          from 'app/shared/form-validation-error';
import { DateTime }                              from 'luxon';

export type MuteDuration = 'hour' | 'day' | 'until' | 'forever';

/** What the dialog hands back to the settings row. */
export interface MuteResult {
    duration: MuteDuration;
    /** Only set for `until`. */
    date: DateTime | null;
}

/**
 * "Stop notifications" dialog, opened from a settings row's duration label.
 * Picks how long the channel stays muted; the caller persists the choice.
 */
@Component({
    selector    : 'notification-mute',
    standalone  : true,
    templateUrl : './template.html',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatDatepickerModule,
        MatDialogModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        TranslocoModule,
        FormValidationErrorComponent,
    ],
})
export class NotificationMuteComponent {
    /** Label key of the channel being muted — omitted for the master switch. */
    readonly data: { channelKey?: string } = inject(MAT_DIALOG_DATA) ?? {};

    private _dialogRef = inject(MatDialogRef<NotificationMuteComponent>);

    readonly durations: { key: MuteDuration; labelKey: string }[] = [
        { key: 'hour',    labelKey: 'NotificationMute.Hour' },
        { key: 'day',     labelKey: 'NotificationMute.Day' },
        { key: 'until',   labelKey: 'NotificationMute.Until' },
        { key: 'forever', labelKey: 'NotificationMute.Forever' },
    ];

    selected: MuteDuration = 'hour';
    untilCtrl = new FormControl<DateTime | null>(null, Validators.required);

    get invalid(): boolean {
        return this.selected === 'until' && this.untilCtrl.invalid;
    }

    select(duration: MuteDuration): void {
        this.selected = duration;
    }

    submit(): void {
        if (this.invalid) {
            this.untilCtrl.markAsTouched();
            return;
        }
        this._dialogRef.close({
            duration: this.selected,
            date: this.selected === 'until' ? this.untilCtrl.value : null,
        } as MuteResult);
    }
}
