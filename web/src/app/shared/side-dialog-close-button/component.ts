import { CommonModule }       from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule }    from '@angular/material/button';
import { MatDialogModule }    from '@angular/material/dialog';
import { MatIconModule }      from '@angular/material/icon';
import { MatTooltipModule }   from '@angular/material/tooltip';
import { TranslocoModule }    from '@ngneat/transloco';

@Component({
    selector    : 'shared-side-dialog-close-button',
    standalone  : true,
    templateUrl : './template.html',
    styleUrl    : './style.scss',
    imports: [

        CommonModule,
        MatButtonModule,
        MatDialogModule,
        MatIconModule,
        MatTooltipModule,
        TranslocoModule,

    ],
})
export class SideDialogCloseButtonComponent {
    @Input() isReturn           : boolean = false;
    @Input() dialogCloseValue   : any = false;
    @Input() closeOnClick       : boolean = true;
    @Output() buttonClick       = new EventEmitter<void>();

    get tooltip(): string {
        return this.isReturn ? 'Common.Back' : 'Common.Close';
    }

    get icon(): string {
        return this.isReturn ? 'mdi:arrow-left' : 'mdi:close';
    }

    get mobileTooltip(): string {
        return 'Common.Back';
    }

    get mobileIcon(): string {
        return 'mdi:arrow-left';
    }
}
