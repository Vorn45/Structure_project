import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoModule } from '@ngneat/transloco';
import { NoDataComponent } from 'app/shared/no-data/no_data.compoent';

export interface HttpErrorDialogData {
    illustration?: 'error' | 'phone-login';
    title?: string;
    description?: string;
    showContactSupport?: boolean;
}

@Component({
    selector: 'http-error-dialog',
    standalone: true,
    imports: [
        MatButtonModule,
        MatDialogModule,
        MatIconModule,
        MatTooltipModule,
        NoDataComponent,
        TranslocoModule,
    ],
    template: `
        <div class="relative px-6 pb-8 pt-10 sm:px-8">
            <button
                type="button"
                mat-icon-button
                [mat-dialog-close]="true"
                [matTooltip]="'Common.Close' | transloco"
                [attr.aria-label]="'Common.Close' | transloco"
                class="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
            >
                <mat-icon class="icon-size-6" svgIcon="mdi:close"></mat-icon>
            </button>

            <no-data-component
                [type]="data?.illustration ?? 'error'"
                [title]="data?.title || ('HttpErrorDialog.Title' | transloco)"
                [description]="data?.description || ('HttpErrorDialog.Description' | transloco)"
                [fullHeight]="true"
                size="clamp(180px, 50vw, 280px)"
            />

            <div class="mt-6 flex flex-col-reverse justify-center gap-3 sm:flex-row">
                <button
                    type="button"
                    mat-flat-button
                    [mat-dialog-close]="true"
                    class="bg-primary text-white"
                >
                    {{ 'HttpErrorDialog.Confirm' | transloco }}
                </button>
            </div>
        </div>
    `,
})
export class HttpErrorDialogComponent {
    readonly data = inject<HttpErrorDialogData | null>(MAT_DIALOG_DATA, { optional: true });
}
