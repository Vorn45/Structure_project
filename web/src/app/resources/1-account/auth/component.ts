import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { RouterOutlet } from '@angular/router';
import { AboutDialogComponent } from './about-dialog/about.component';
import { TranslocoModule } from '@ngneat/transloco';
import { env } from 'envs/env';

@Component({
    standalone: true,
    styleUrl: './style.scss',
    templateUrl: 'template.html',
    imports: [
        RouterOutlet,
        CommonModule,
        MatIconModule,
        TranslocoModule,
    ],
})

export class AuthLayoutComponent{

    private readonly matDialog = inject(MatDialog);
    public appVersion          : string  = env.APP_VERSION;

    openAboutDialog(){
        this.matDialog.open(AboutDialogComponent, {
            autoFocus: false,
            position: { right: '0px' },
            height: '100dvh',
            width: '100dvw',
            maxWidth: '520px',
            panelClass: 'custom-mat-dialog-as-mat-drawer',
            enterAnimationDuration: '0s',
        })
    }
}
