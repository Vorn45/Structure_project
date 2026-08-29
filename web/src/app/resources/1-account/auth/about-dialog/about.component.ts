import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { env } from 'envs/env';

@Component({
    selector: 'signIn-about-dialog',
    standalone: true,
    templateUrl: './about.component.html',
    styleUrl      :'./about.component.scss',
    
    imports: [
        MatDialogModule, 
        MatButtonModule,
        CommonModule,
        MatIconModule,
    ],
})
export class AboutDialogComponent implements OnInit{

    public appVersion          : string  = env.APP_VERSION;

    constructor(public dialogRef: MatDialogRef<AboutDialogComponent>

    ) {}

    ngOnInit() {
    }

    closeDialog(): void {
    this.dialogRef.close();
    }
}
