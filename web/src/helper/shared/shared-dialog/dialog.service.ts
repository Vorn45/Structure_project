import { Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { SharedDialogComponent } from './shared-dialog.component';
import { Type } from '@angular/core';

export interface DialogOptions<T> {
  title: string;
  component: Type<T>;
  componentInputs?: Record<string, any>;
  width?: string;
  maxWidth?: string;
  disableClose?: boolean;
  position?: 'right' | 'center' | 'left';
  height?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  constructor(private dialog: MatDialog) {}

  openDialog<T>(options: DialogOptions<T>) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.autoFocus = false;
    dialogConfig.position = { right: '0px' };
    dialogConfig.height = options.height || '100dvh';
    dialogConfig.width = options.width || '100dvw';
    dialogConfig.maxWidth = options.maxWidth || '600px';
    dialogConfig.panelClass = options.position === 'center' 
      ? 'center-dialog' 
      : 'custom-mat-dialog-as-mat-drawer';
    dialogConfig.enterAnimationDuration = '0s';
    dialogConfig.disableClose = options.disableClose || false;

    dialogConfig.data = {
      title: options.title,
      component: options.component,
      componentInputs: options.componentInputs || {}
    };

    const dialogRef = this.dialog.open(SharedDialogComponent, dialogConfig);
    return dialogRef;
  }
}