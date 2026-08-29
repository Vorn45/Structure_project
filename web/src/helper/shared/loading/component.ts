import { ChangeDetectorRef, Component, OnDestroy, OnInit, TemplateRef, ViewChild, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { LoadingSpinnerService } from './service';

@Component({
    selector: 'loading-spinner',
    standalone: true,
    imports: [CommonModule, MatDialogModule],
    templateUrl: './template.html',
    styleUrls: ['./style.scss']
})
export class LoadingComponent implements OnInit, OnDestroy {
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    @ViewChild('loadingTemplate', { static: true }) private loadingTemplate: TemplateRef<any>;
    private dialog: MatDialogRef<any, any>;

    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private loadingSpinner: LoadingSpinnerService,
        private matDialog: MatDialog
    ) { }

    ngOnInit(): void {
        this.loadingSpinner.open$.pipe(takeUntil(this._unsubscribeAll)).subscribe((value: boolean) => {
            if (value) {
                this.dialog = this.matDialog.open(this.loadingTemplate, { width: 'auto', height: 'auto', disableClose: true, panelClass: 'spinner-loading' });
            } else {
                // Close the dialog only if it is defined
                if (this.dialog) {
                    this.dialog.close();
                }
            }
            // Mark for check
            this._changeDetectorRef.markForCheck();
        });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}
