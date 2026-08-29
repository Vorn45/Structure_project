// ================================================================================>> Core Library
import { NgFor } from '@angular/common';
import { Component } from '@angular/core';

@Component({
    selector: 'shared-qr-code-skeleton',
    templateUrl: './template.html',
    styleUrl    : './style.scss',
    standalone: true,
    imports: [NgFor]
})
export class SkeletonQrCodeComponent {
}
