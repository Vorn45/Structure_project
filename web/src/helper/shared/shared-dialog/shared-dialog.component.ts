import { CommonModule } from '@angular/common';
import { 
  ChangeDetectorRef, 
  Component, 
  EventEmitter, 
  Inject, 
  Input, 
  Output, 
  ViewContainerRef,
  ComponentFactoryResolver,
  OnDestroy,
  OnInit
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-shared-dialog',
  standalone: true,
  templateUrl: './shared-dialog.component.html',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ]
})
export class SharedDialogComponent implements OnInit, OnDestroy {
  @Output() responseData = new EventEmitter<any>();
  @Output() responseMember = new EventEmitter<any>();
  @Output() ResponseData   = new EventEmitter<void>();

  private componentRef: any;

  constructor(
    public dialogRef: MatDialogRef<SharedDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      title: string;
      component: any;
      componentInputs?: Record<string, any>;
    },
    private viewContainerRef: ViewContainerRef,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadComponent();
  }

  handleDataChanged(data: any): void {
        this.ResponseData.emit(data);
  }

  ngOnDestroy(): void {
    if (this.componentRef) {
      this.componentRef.destroy();
    }
  }

  private loadComponent(): void {
    this.viewContainerRef.clear();
    
    if (this.data.component) {
      this.componentRef = this.viewContainerRef.createComponent(this.data.component);
      
      // Set component inputs
      if (this.data.componentInputs) {
        Object.keys(this.data.componentInputs).forEach(key => {
          this.componentRef.instance[key] = this.data.componentInputs[key];
        });
      }
      
      // Subscribe to outputs if they exist
      if (this.componentRef.instance.ResponseData) {
        this.componentRef.instance.ResponseData.subscribe((data: any) => {
          this.responseData.emit(data);
        });
      }
      
      if (this.componentRef.instance.ResponseMember) {
        this.componentRef.instance.ResponseMember.subscribe((data: any) => {
          this.responseMember.emit(data);
        });
      }
      
      this.cdr.detectChanges();
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }
}