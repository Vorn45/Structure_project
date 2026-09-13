import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'not-found',
    templateUrl: './template.html',
    styleUrl: './style.scss',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        RouterLink,
        MatButtonModule
    ],
})
export class Error404Component {
    /**
     * Constructor
     */
    constructor() {}
}
