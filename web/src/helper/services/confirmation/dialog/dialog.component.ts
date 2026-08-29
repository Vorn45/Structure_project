import { NgClass } from '@angular/common';
import { Component, OnInit, ViewEncapsulation, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HelperConfirmationConfig } from 'helper/services/confirmation/confirmation.types';

@Component({
    selector: 'helper-confirmation-dialog',
    templateUrl: './dialog.component.html',
    styles: [
        `
            .helper-confirmation-dialog-panel {
                @screen md {
                    @apply w-128;
                }

                .mat-mdc-dialog-container {
                    .mat-mdc-dialog-surface {
                        padding: 0 !important;
                    }
                }
            }

            .helper-confirmation-dialog-panel--compact {
                width: min(30rem, calc(100vw - 2rem));

                .mat-mdc-dialog-container .mat-mdc-dialog-surface {
                    border: 1px solid rgb(226 232 240);
                    border-radius: 1.25rem !important;
                    box-shadow: none !important;
                    overflow: hidden;
                }
            }

            .dark .helper-confirmation-dialog-panel--compact {
                .mat-mdc-dialog-container .mat-mdc-dialog-surface {
                    border-color: rgb(51 65 85);
                }
            }
        `,
    ],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [MatButtonModule, MatDialogModule, MatIconModule, NgClass],
})
export class HelperConfirmationDialogComponent implements OnInit {
    data: HelperConfirmationConfig = inject(MAT_DIALOG_DATA);
    imageSvg?: SafeHtml;

    private readonly _http = inject(HttpClient);
    private readonly _sanitizer = inject(DomSanitizer);

    ngOnInit(): void {
        const path = this.data.icon?.image;
        if (!path) return;
        this._http.get(path, { responseType: 'text' }).subscribe({
            next: (svg) => {
                const recolored = svg.replace(/#FF725E/gi, 'rgb(var(--helper-primary-rgb))');
                this.imageSvg = this._sanitizer.bypassSecurityTrustHtml(recolored);
            },
            error: () => {},
        });
    }
}
