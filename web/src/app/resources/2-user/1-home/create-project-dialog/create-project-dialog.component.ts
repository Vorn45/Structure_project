import { CommonModule } from '@angular/common';
import { Component, ElementRef, Inject, OnInit, ViewChild, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, DateAdapter, MAT_DATE_FORMATS, MAT_NATIVE_DATE_FORMATS } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { SideDialogCloseButtonComponent } from 'app/shared/side-dialog-close-button/component';
import { UserHomeService } from '../home.service';
import { UserTaskService } from 'app/resources/2-user/2-task/task.service';
import { KhmerDateAdapter } from 'helper/adapter/khmer-date-adapter';

export interface CreateProjectDialogData {
    user?: any;
    members?: { id: number | string; name: string; role: string; avatar?: string }[];
    existingProjects?: { code?: string; id?: string }[];
    onProjectCreated?: () => void;
}

export interface ProjectStatusOption {
    id: 'planning' | 'active' | 'on_hold' | 'completed';
    label: string;
    dotColor?: string;
    activeColor: string;
    activeBg: string;
    activeBorder: string;
}

export interface ProjectCategoryOption {
    id: string;
    label: string;
    icon: string;
    iconColor: string;
}

export interface TeamMember {
    id: string;
    name: string;
    role: string;
    avatar?: string;
}

export interface ProjectAttachment {
    name: string;
    size: string;
    type: string;
    url?: string;
    isImage?: boolean;
    textContent?: string;
    fileBlob?: File;
}

@Component({
    selector: 'app-create-project-dialog',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatTooltipModule,
        MatDividerModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatInputModule,
        SideDialogCloseButtonComponent,
    ],
    providers: [
        { provide: DateAdapter, useClass: KhmerDateAdapter },
        { provide: MAT_DATE_FORMATS, useValue: MAT_NATIVE_DATE_FORMATS },
    ],
    styles: [
        `
            ::ng-deep .side-dialog-close-button {
                z-index: 50 !important;
                box-shadow: -4px 0 10px rgba(0, 0, 0, 0.08) !important;
            }

            :host-context(.dark) ::ng-deep .side-dialog-close-button,
            .dark ::ng-deep .side-dialog-close-button {
                box-shadow: -4px 0 12px rgba(0, 0, 0, 0.4) !important;
            }

            ::ng-deep .task-dropdown-menu.mat-mdc-menu-panel {
                background-color: #ffffff !important;
                border: 1px solid #e2e8f0 !important;
                border-radius: 1rem !important;
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05) !important;
                padding: 6px !important;
            }

            :host-context(.dark) ::ng-deep .task-dropdown-menu.mat-mdc-menu-panel,
            .dark ::ng-deep .task-dropdown-menu.mat-mdc-menu-panel {
                background-color: #0f172a !important;
                border-color: #1e293b !important;
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5) !important;
            }

            ::ng-deep .task-dropdown-menu .mat-mdc-menu-content {
                padding: 4px !important;
            }

            ::ng-deep .task-dropdown-menu .mat-mdc-menu-item {
                border-radius: 12px !important;
                min-height: 40px !important;
                height: auto !important;
                padding: 6px 12px !important;
                transition: all 120ms ease !important;
            }

            ::ng-deep .task-dropdown-menu .mat-mdc-menu-item:hover,
            ::ng-deep .task-dropdown-menu .mat-mdc-menu-item.cdk-keyboard-focused,
            ::ng-deep .task-dropdown-menu .mat-mdc-menu-item.cdk-program-focused {
                background-color: #f1f5f9 !important;
                color: #0f172a !important;
            }

            :host-context(.dark) ::ng-deep .task-dropdown-menu .mat-mdc-menu-item,
            .dark ::ng-deep .task-dropdown-menu .mat-mdc-menu-item {
                color: #cbd5e1 !important;
            }

            :host-context(.dark) ::ng-deep .task-dropdown-menu .mat-mdc-menu-item:hover,
            .dark ::ng-deep .task-dropdown-menu .mat-mdc-menu-item:hover {
                background-color: #1c2b44 !important;
                color: #ffffff !important;
            }

            ::ng-deep .task-dropdown-menu .mat-mdc-menu-item .mdc-list-item__primary-text {
                color: inherit !important;
                display: flex !important;
                align-items: center !important;
                width: 100% !important;
            }

            ::ng-deep .task-dropdown-menu .mat-mdc-menu-item .mat-icon {
                margin: 0 !important;
                margin-right: 0 !important;
                margin-left: 0 !important;
                margin-inline-end: 0 !important;
                margin-inline-start: 0 !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
            }

            ::ng-deep .task-dropdown-menu .mat-mdc-menu-item .mat-icon svg {
                width: 100% !important;
                height: 100% !important;
                display: block !important;
                margin: auto !important;
            }
        `,
    ],
    template: `
        <div class="w-full h-full flex flex-col bg-white dark:bg-slate-900 font-kantumruy text-[15px] font-normal relative overflow-visible">
            
            <!-- Clean Header (Centered like Profile Dialog & Create Task) -->
            <div mat-dialog-title
                class="w-full relative flex justify-center items-center min-h-14 max-h-14 h-14 border-b border-slate-200 dark:border-slate-800 m-0 !py-0 px-4 font-kantumruy bg-white dark:bg-slate-900 shrink-0">
                <span class="w-full text-center text-[18px] sm:text-[20px] font-semibold font-kantumruy text-slate-800 dark:text-slate-100">
                    បង្កើតគម្រោងថ្មី
                </span>
            </div>

            <!-- Standard Side Drawer Close Button -->
            <shared-side-dialog-close-button [isReturn]="false" [closeOnClick]="false" (buttonClick)="cancel()"></shared-side-dialog-close-button>

            <!-- Inline Success Toast Notice for Continuous Creation -->
            <div *ngIf="successNotice()" class="mx-5 mt-3 px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 text-[14px] flex items-center justify-between shadow-2xs">
                <div class="flex items-center gap-2 min-w-0">
                    <mat-icon svgIcon="mdi:check-circle" class="icon-size-4.5 text-emerald-600 dark:text-emerald-400 shrink-0"></mat-icon>
                    <span class="font-medium truncate">{{ successNotice() }}</span>
                </div>
                <button type="button" (click)="successNotice.set('')" class="text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-200 shrink-0 ml-2 cursor-pointer">
                    <mat-icon svgIcon="mdi:close" class="icon-size-4"></mat-icon>
                </button>
            </div>

            <!-- Scrollable Body -->
            <mat-dialog-content class="w-full !m-0 !p-0 overflow-y-auto flex-1 bg-white dark:bg-slate-900 font-kantumruy text-[15px]">
                
                <div class="p-5 space-y-5 font-kantumruy">
                    
                    <!-- 1. Project Name Input -->
                    <div>
                        <label class="block font-medium text-slate-800 dark:text-slate-200 mb-1.5 text-[15px]">
                            ឈ្មោះគម្រោង <span class="text-rose-500">*</span>
                        </label>
                        <input
                            #projectNameInput
                            type="text"
                            [(ngModel)]="projectName"
                            (keyup.enter)="submitAndClose()"
                            placeholder="ឧ. អភិវឌ្ឍន៍ប្រព័ន្ធគ្រប់គ្រងវត្តមាន WMS ដំណាក់កាលទី ២..."
                            class="w-full px-3.5 py-2.5 text-[15px] font-normal font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                    </div>

                    <!-- 2. Project Code & Category Row -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                            <div class="flex items-center justify-between mb-1.5">
                                <label class="block font-medium text-slate-700 dark:text-slate-300 text-[13.5px]">
                                    កូដសម្គាល់គម្រោង
                                </label>
                                <span class="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                    ស្វ័យប្រវត្តិ
                                </span>
                            </div>
                            <input
                                type="text"
                                [value]="projectCode"
                                readonly
                                tabindex="-1"
                                class="w-full px-3.5 py-2 text-[14px] font-kantumruy font-mono uppercase font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 cursor-not-allowed select-none focus:outline-none"
                            />
                        </div>

                        <div>
                            <label class="block font-medium text-slate-700 dark:text-slate-300 mb-1.5 text-[13.5px]">
                                ប្រភេទគម្រោង (Category)
                            </label>
                            <button
                                type="button"
                                [matMenuTriggerFor]="categoryMenu"
                                class="w-full flex items-center justify-between px-3.5 py-2 text-[14px] font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:border-slate-300 dark:hover:border-slate-600 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-left cursor-pointer"
                            >
                                <div class="flex items-center gap-2.5 min-w-0">
                                    <mat-icon [svgIcon]="getCategoryOption(category).icon" class="!w-4.5 !h-4.5 shrink-0" [ngClass]="getCategoryOption(category).iconColor"></mat-icon>
                                    <span class="font-medium truncate">{{ getCategoryOption(category).label }}</span>
                                </div>
                                <mat-icon svgIcon="mdi:chevron-down" class="!w-4 !h-4 opacity-70 text-slate-500 dark:text-slate-400 shrink-0 ml-1.5"></mat-icon>
                            </button>

                            <mat-menu #categoryMenu="matMenu" panelClass="task-dropdown-menu" class="font-kantumruy min-w-[240px]">
                                <button
                                    mat-menu-item
                                    *ngFor="let item of categoryList"
                                    (click)="category = item.id"
                                >
                                    <div class="flex items-center gap-2.5 w-full">
                                        <mat-icon [svgIcon]="item.icon" class="!w-4.5 !h-4.5 shrink-0" [ngClass]="item.iconColor"></mat-icon>
                                        <span class="font-medium text-[13px] text-slate-800 dark:text-slate-200">{{ item.label }}</span>
                                        <mat-icon *ngIf="category === item.id" svgIcon="mdi:check" class="!w-4 !h-4 text-blue-500 ml-auto"></mat-icon>
                                    </div>
                                </button>
                            </mat-menu>
                        </div>
                    </div>

                    <!-- 3. Project Status Selection (Clean Minimal Dots) -->
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <label class="block font-medium text-slate-700 dark:text-slate-300 text-[13.5px]">
                                ស្ថានភាពគម្រោង <span class="text-rose-500">*</span>
                            </label>
                            <span class="text-[12px] text-slate-400">ជ្រើសរើស ១</span>
                        </div>

                        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 font-kantumruy">
                            <button
                                *ngFor="let s of statusList"
                                type="button"
                                (click)="selectedStatus.set(s.id)"
                                class="px-3 py-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer select-none font-kantumruy text-[13px]"
                                [ngClass]="selectedStatus() === s.id
                                    ? s.activeBorder + ' ' + s.activeBg + ' ring-1 ' + s.activeBorder
                                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'"
                            >
                                <span class="w-2 h-2 rounded-full shrink-0" [ngClass]="s.dotColor || 'bg-slate-400'"></span>
                                <span class="truncate"
                                    [ngClass]="selectedStatus() === s.id ? s.activeColor + ' font-medium' : 'font-normal'">
                                    {{ s.label }}
                                </span>
                            </button>
                        </div>
                    </div>

                    <!-- 4. Project Lead & Team Members Row -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-start">
                        
                        <!-- Project Lead (ប្រធានគម្រោង) -->
                        <div class="space-y-2">
                            <div class="flex items-center justify-between">
                                <label class="text-[12.5px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    <span>ប្រធានគម្រោង</span>
                                </label>
                                <div class="flex items-center gap-1.5">
                                    <button
                                        *ngIf="leadName"
                                        type="button"
                                        (click)="clearLead()"
                                        class="text-[12px] text-slate-400 hover:text-rose-500 transition-colors cursor-pointer mr-1"
                                    >
                                        សម្អាត
                                    </button>
                                    <button
                                        type="button"
                                        [matMenuTriggerFor]="leadMenu"
                                        class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg transition-colors cursor-pointer">
                                        <mat-icon svgIcon="mdi:account-plus-outline" class="!w-3.5 !h-3.5"></mat-icon>
                                        <span>{{ leadName ? 'ប្តូរ' : 'ចាត់តាំង' }}</span>
                                    </button>
                                </div>
                            </div>

                            <!-- Selected Lead Card -->
                            <div *ngIf="leadName" class="flex items-center gap-2.5 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                                <div class="w-7 h-7 rounded-full flex items-center justify-center shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
                                    <img *ngIf="leadAvatar" [src]="leadAvatar" alt="Avatar" class="w-full h-full object-cover" />
                                    <mat-icon *ngIf="!leadAvatar" svgIcon="mdi:account" class="!w-4 !h-4 !m-0 !p-0 flex items-center justify-center text-slate-500 dark:text-slate-400"></mat-icon>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <p class="text-[13px] font-medium text-slate-800 dark:text-white truncate leading-tight">
                                        {{ leadName }}
                                    </p>
                                    <p class="text-[11px] text-slate-400 truncate">
                                        {{ leadRole || 'ប្រធានគម្រោង' }}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    (click)="clearLead()"
                                    class="text-slate-400 hover:text-rose-500 transition-colors p-1 cursor-pointer"
                                    matTooltip="ដកចេញ"
                                >
                                    <mat-icon svgIcon="mdi:close" class="icon-size-3.5"></mat-icon>
                                </button>
                            </div>

                            <!-- Unselected Lead Placeholder -->
                            <button *ngIf="!leadName"
                                type="button"
                                [matMenuTriggerFor]="leadMenu"
                                class="w-full py-2.5 px-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-400 bg-white dark:bg-slate-800 text-left flex items-center justify-between text-slate-500 dark:text-slate-400 hover:text-blue-600 transition-all cursor-pointer">
                                <span class="text-[13px] font-medium">+ ជ្រើសរើសប្រធានគម្រោង</span>
                                <mat-icon svgIcon="heroicons_outline:chevron-down" class="!w-4 !h-4 text-slate-400"></mat-icon>
                            </button>
                        </div>

                        <!-- Team Members (សមាជិកក្រុមការងារ) -->
                        <div class="space-y-2">
                            <div class="flex items-center justify-between">
                                <label class="text-[12.5px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    <span>សមាជិកក្រុមការងារ</span>
                                    <span *ngIf="selectedMembers.length > 0" class="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 font-semibold">
                                        {{ selectedMembers.length }} នាក់
                                    </span>
                                </label>
                                <button
                                    type="button"
                                    [matMenuTriggerFor]="membersMenu"
                                    class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg transition-colors cursor-pointer">
                                    <mat-icon svgIcon="mdi:account-plus-outline" class="!w-3.5 !h-3.5"></mat-icon>
                                    <span>ចាត់តាំង</span>
                                </button>
                            </div>

                            <!-- Selected Members List -->
                            <div *ngIf="selectedMembers.length > 0" class="space-y-1.5 max-h-36 overflow-y-auto pr-0.5">
                                <div *ngFor="let m of selectedMembers"
                                    class="flex items-center gap-2.5 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                                    <div class="w-7 h-7 rounded-full flex items-center justify-center shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
                                        <img *ngIf="m.avatar" [src]="m.avatar" alt="Avatar" class="w-full h-full object-cover" />
                                        <mat-icon *ngIf="!m.avatar" svgIcon="mdi:account" class="!w-4 !h-4 !m-0 !p-0 flex items-center justify-center text-slate-500 dark:text-slate-400"></mat-icon>
                                    </div>
                                    <div class="min-w-0 flex-1">
                                        <p class="text-[13px] font-medium text-slate-800 dark:text-white truncate leading-tight">
                                            {{ m.name }}
                                        </p>
                                        <p class="text-[11px] text-slate-400 truncate">
                                            {{ m.role || 'សមាជិកក្រុមការងារ' }}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        (click)="toggleMember(m.id)"
                                        class="text-slate-400 hover:text-rose-500 transition-colors p-1 cursor-pointer"
                                        matTooltip="ដកចេញ"
                                    >
                                        <mat-icon svgIcon="mdi:close" class="icon-size-3.5"></mat-icon>
                                    </button>
                                </div>
                            </div>

                            <!-- Unselected Members Placeholder -->
                            <button *ngIf="selectedMembers.length === 0"
                                type="button"
                                [matMenuTriggerFor]="membersMenu"
                                class="w-full py-2.5 px-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-400 bg-white dark:bg-slate-800 text-left flex items-center justify-between text-slate-500 dark:text-slate-400 hover:text-blue-600 transition-all cursor-pointer">
                                <span class="text-[13px] font-medium">+ ជ្រើសរើសសមាជិកក្រុមការងារ</span>
                                <mat-icon svgIcon="heroicons_outline:chevron-down" class="!w-4 !h-4 text-slate-400"></mat-icon>
                            </button>
                        </div>

                    </div>

                    <!-- Dropdown Menu for Project Lead -->
                    <mat-menu #leadMenu="matMenu" panelClass="task-dropdown-menu" class="font-kantumruy !min-w-[280px] !p-1.5">
                        <div (click)="$event.stopPropagation()" class="px-2.5 py-2 border-b border-slate-100 dark:border-slate-700/80 mb-1 flex items-center justify-between">
                            <span class="text-[12.5px] font-semibold text-slate-800 dark:text-slate-200">ជ្រើសរើសប្រធានគម្រោង</span>
                            <span *ngIf="leadName" class="text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full border border-blue-200/60 dark:border-blue-800/60">
                                បានជ្រើសរើស
                            </span>
                        </div>
                        <div class="max-h-60 overflow-y-auto space-y-0.5">
                            <button *ngFor="let m of availableMembers" mat-menu-item (click)="selectLead(m)"
                                class="!text-[13px] !rounded-xl !h-auto !py-1.5 my-0.5">
                                <div class="flex items-center justify-between w-full">
                                    <div class="flex items-center gap-2.5 min-w-0">
                                        <div class="w-7 h-7 rounded-full flex items-center justify-center shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
                                            <img *ngIf="m.avatar" [src]="m.avatar" class="w-full h-full object-cover" />
                                            <mat-icon *ngIf="!m.avatar" svgIcon="mdi:account" class="!w-4 !h-4 !m-0 !p-0 flex items-center justify-center text-slate-500 dark:text-slate-400"></mat-icon>
                                        </div>
                                        <div class="min-w-0 text-left">
                                            <p class="text-[12.5px] font-medium text-slate-800 dark:text-slate-200 truncate leading-snug">{{ m.name }}</p>
                                            <p class="text-[11px] text-slate-400 truncate leading-tight">{{ m.role || 'ប្រធានគម្រោង' }}</p>
                                        </div>
                                    </div>
                                    <mat-icon *ngIf="leadName === m.name || (leadId && String(leadId) === String(m.id))" svgIcon="mdi:check" class="!w-4 !h-4 !m-0 shrink-0 text-blue-500 ml-auto"></mat-icon>
                                </div>
                            </button>

                            <div *ngIf="availableMembers.length === 0" class="py-4 text-center text-xs text-slate-400">
                                រកមិនឃើញសមាជិកទេ
                            </div>
                        </div>
                        <div *ngIf="leadName" class="border-t border-slate-100 dark:border-slate-700/80 mt-1 pt-1">
                            <button mat-menu-item (click)="clearLead()"
                                class="!text-[12.5px] !rounded-xl !h-auto !py-1.5 !text-rose-600 dark:!text-rose-400 hover:!bg-rose-50 dark:hover:!bg-rose-950/30">
                                <div class="flex items-center gap-2">
                                    <mat-icon svgIcon="mdi:account-off-outline" class="!w-4 !h-4 text-rose-500"></mat-icon>
                                    <span>សម្អាត (មិនកំណត់)</span>
                                </div>
                            </button>
                        </div>
                    </mat-menu>

                    <!-- Multi-Select Menu for Team Members -->
                    <mat-menu #membersMenu="matMenu" panelClass="task-dropdown-menu" class="font-kantumruy !min-w-[280px] !p-1.5">
                        <div (click)="$event.stopPropagation()" class="px-2.5 py-2 border-b border-slate-100 dark:border-slate-700/80 mb-1 flex items-center justify-between">
                            <span class="text-[12.5px] font-semibold text-slate-800 dark:text-slate-200">ជ្រើសរើសសមាជិកក្រុមការងារ</span>
                            <span *ngIf="selectedMembers.length > 0" class="text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full border border-blue-200/60 dark:border-blue-800/60">
                                {{ selectedMembers.length }} នាក់
                            </span>
                        </div>
                        <div (click)="$event.stopPropagation()" class="max-h-60 overflow-y-auto space-y-0.5">
                            <div *ngFor="let m of availableMembers"
                                (click)="toggleMember(m.id)"
                                class="flex items-center justify-between px-2.5 py-1.5 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors font-kantumruy select-none my-0.5">
                                <div class="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                                    <div class="w-7 h-7 rounded-full flex items-center justify-center shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
                                        <img *ngIf="m.avatar" [src]="m.avatar" class="w-full h-full object-cover" />
                                        <mat-icon *ngIf="!m.avatar" svgIcon="mdi:account" class="!w-4 !h-4 !m-0 !p-0 flex items-center justify-center text-slate-500 dark:text-slate-400"></mat-icon>
                                    </div>
                                    <div class="min-w-0 text-left flex-1">
                                        <p class="text-[12.5px] font-medium text-slate-800 dark:text-slate-200 truncate leading-snug">
                                            {{ m.name }}
                                        </p>
                                        <p class="text-[11px] text-slate-400 dark:text-slate-500 truncate leading-tight">
                                            {{ m.role || 'សមាជិកក្រុមការងារ' }}
                                        </p>
                                    </div>
                                </div>
                                <mat-icon *ngIf="isMemberSelected(m.id)" svgIcon="mdi:check" class="!w-4 !h-4 !m-0 text-blue-500 shrink-0 ml-auto"></mat-icon>
                            </div>

                            <div *ngIf="availableMembers.length === 0" class="py-4 text-center text-xs text-slate-400">
                                រកមិនឃើញសមាជិកទេ
                            </div>
                        </div>
                    </mat-menu>

                    <!-- 5. Priority & Budget Row -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                            <label class="block font-medium text-slate-800 dark:text-slate-200 mb-1.5 text-[14px]">
                                កម្រិតអាទិភាព
                            </label>
                            <div class="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    (click)="priority.set('low')"
                                    class="py-2 px-1 rounded-xl border font-kantumruy text-[13px] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                    [ngClass]="priority() === 'low'
                                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500'
                                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'"
                                >
                                    <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    <span>ទាប</span>
                                </button>

                                <button
                                    type="button"
                                    (click)="priority.set('medium')"
                                    class="py-2 px-1 rounded-xl border font-kantumruy text-[13px] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                    [ngClass]="priority() === 'medium'
                                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500'
                                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'"
                                >
                                    <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                                    <span>មធ្យម</span>
                                </button>

                                <button
                                    type="button"
                                    (click)="priority.set('high')"
                                    class="py-2 px-1 rounded-xl border font-kantumruy text-[13px] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                    [ngClass]="priority() === 'high'
                                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500'
                                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'"
                                >
                                    <span class="w-2 h-2 rounded-full bg-rose-500"></span>
                                    <span>ខ្ពស់</span>
                                </button>
                            </div>
                        </div>

                        <div>
                            <label class="block font-medium text-slate-800 dark:text-slate-200 mb-1.5 text-[14px]">
                                ថវិកាគម្រោង (Budget USD)
                            </label>
                            <div class="relative">
                                <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-medium">$</span>
                                <input
                                    type="number"
                                    [(ngModel)]="budget"
                                    placeholder="5000"
                                    class="w-full pl-8 pr-3.5 py-2 text-[14px] font-kantumruy font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <!-- 6. Start & Due Dates (Custom Material Datepicker with SaaS Styling) -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                            <label class="block font-medium text-slate-800 dark:text-slate-200 mb-1.5 text-[14px]">
                                កាលបរិច្ឆេទចាប់ផ្តើម
                            </label>
                            <div class="relative group">
                                <div
                                    class="w-full flex items-center justify-between px-3.5 py-2 text-[14px] font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white group-hover:border-slate-300 dark:group-hover:border-slate-600 transition-all text-left pointer-events-none select-none shadow-2xs"
                                >
                                    <span class="truncate">{{ formatDisplayDate(startDate) }}</span>
                                    <mat-icon svgIcon="heroicons_outline:calendar" class="!w-4 !h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 shrink-0 transition-colors"></mat-icon>
                                </div>
                                <input
                                    class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    readonly
                                    (click)="startPicker.open()"
                                    [matDatepicker]="startPicker"
                                    [(ngModel)]="startDate"
                                />
                                <mat-datepicker #startPicker panelClass="custom-saas-datepicker"></mat-datepicker>
                            </div>
                        </div>

                        <div>
                            <label class="block font-medium text-slate-800 dark:text-slate-200 mb-1.5 text-[14px]">
                                កាលបរិច្ឆេទទទួលបញ្ចប់
                            </label>
                            <div class="relative group">
                                <div
                                    class="w-full flex items-center justify-between px-3.5 py-2 text-[14px] font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white group-hover:border-slate-300 dark:group-hover:border-slate-600 transition-all text-left pointer-events-none select-none shadow-2xs"
                                >
                                    <span class="truncate">{{ formatDisplayDate(endDate) }}</span>
                                    <mat-icon svgIcon="heroicons_outline:calendar" class="!w-4 !h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 shrink-0 transition-colors"></mat-icon>
                                </div>
                                <input
                                    class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    readonly
                                    (click)="endPicker.open()"
                                    [matDatepicker]="endPicker"
                                    [(ngModel)]="endDate"
                                />
                                <mat-datepicker #endPicker [xPosition]="'end'" panelClass="custom-saas-datepicker"></mat-datepicker>
                            </div>
                        </div>
                    </div>

                    <!-- 7. Description Input -->
                    <div>
                        <label class="block font-medium text-slate-800 dark:text-slate-200 mb-1.5 text-[14px]">
                            ការពិពណ៌នា ឬ គោលបំណងគម្រោង
                        </label>
                        <textarea
                            rows="3"
                            [(ngModel)]="description"
                            placeholder="ពិពណ៌នាអំពីខ្លឹមសារ គោលដៅ និងលទ្ធផលរំពឹងទុករបស់គម្រោង..."
                            class="w-full p-3 text-[14px] font-normal font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none transition-all"
                        ></textarea>
                    </div>

                    <!-- 8. Attachments Section (ឯកសារភ្ជាប់) -->
                    <div class="space-y-2.5">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <label class="block font-medium text-slate-800 dark:text-slate-200 text-[14px]">
                                    ឯកសារភ្ជាប់
                                </label>
                                <span *ngIf="attachedFiles().length > 0" class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
                                    {{ attachedFiles().length }} ឯកសារ
                                </span>
                            </div>
                            <button
                                type="button"
                                (click)="fileInput.click()"
                                class="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium cursor-pointer transition-colors"
                            >
                                <mat-icon svgIcon="mdi:paperclip" class="!w-3.5 !h-3.5"></mat-icon>
                                <span>+ ភ្ជាប់ឯកសារ</span>
                            </button>
                            <input #fileInput type="file" multiple (change)="onFileInputChange($event)" class="hidden" />
                        </div>

                        <!-- Dropzone when empty -->
                        <div
                            *ngIf="attachedFiles().length === 0"
                            (click)="fileInput.click()"
                            (dragover)="onDragOver($event)"
                            (dragenter)="onDragEnter($event)"
                            (dragleave)="onDragLeave($event)"
                            (drop)="onFileDrop($event)"
                            class="py-4 px-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/20 dark:hover:bg-blue-950/20 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 group select-none shadow-2xs"
                            [ngClass]="{ 'border-blue-500 bg-blue-50/40': isDraggingOver() }"
                        >
                            <div class="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-blue-600 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/50 transition-colors">
                                <mat-icon svgIcon="mdi:cloud-upload-outline" class="!w-5 !h-5"></mat-icon>
                            </div>
                            <div class="text-[13px] text-slate-600 dark:text-slate-300 font-medium">
                                ចុច ឬទម្លាក់ឯកសារនៅទីនេះ
                            </div>
                            <div class="text-[11px] text-slate-400 dark:text-slate-500">
                                រូបភាព (PNG, JPG), PDF, Word, Excel ឬឯកសារផ្សេងៗ
                            </div>
                        </div>

                        <!-- Attached Files Preview Grid / List -->
                        <div
                            *ngIf="attachedFiles().length > 0"
                            (dragover)="onDragOver($event)"
                            (dragenter)="onDragEnter($event)"
                            (dragleave)="onDragLeave($event)"
                            (drop)="onFileDrop($event)"
                            class="space-y-2 p-2.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-900/30"
                            [class.border-blue-500]="isDraggingOver()"
                        >
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div
                                    *ngFor="let file of attachedFiles(); let idx = index"
                                    class="flex items-center gap-2.5 p-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 shadow-2xs group relative"
                                >
                                    <!-- Image thumbnail or file icon -->
                                    <div class="w-9 h-9 rounded-lg shrink-0 overflow-hidden flex items-center justify-center border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60">
                                        <img *ngIf="isImageAttachment(file) && file.url" [src]="file.url" [alt]="file.name" class="w-full h-full object-cover" />
                                        <div *ngIf="!isImageAttachment(file) || !file.url" class="w-full h-full flex items-center justify-center" [ngClass]="getFileIconColor(file.name)">
                                            <mat-icon [svgIcon]="getFileIcon(file.name, file.type)" class="!w-4.5 !h-4.5"></mat-icon>
                                        </div>
                                    </div>

                                    <!-- File Info -->
                                    <div class="min-w-0 flex-1">
                                        <p class="text-[12.5px] font-medium text-slate-800 dark:text-slate-200 truncate leading-snug" [matTooltip]="file.name">
                                            {{ file.name }}
                                        </p>
                                        <p class="text-[10.5px] text-slate-400 truncate">
                                            {{ file.size }}
                                        </p>
                                    </div>

                                    <!-- Remove Button -->
                                    <button
                                        type="button"
                                        (click)="removeAttachment(idx)"
                                        class="text-slate-400 hover:text-rose-500 transition-colors p-1 cursor-pointer shrink-0"
                                        matTooltip="ដកចេញ"
                                    >
                                        <mat-icon svgIcon="mdi:close" class="!w-4 !h-4"></mat-icon>
                                    </button>
                                </div>
                            </div>

                            <!-- Mini Add More button row -->
                            <div class="flex justify-end pt-0.5">
                                <button
                                    type="button"
                                    (click)="fileInput.click()"
                                    class="text-[12px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer inline-flex items-center gap-1 font-medium"
                                >
                                    <mat-icon svgIcon="mdi:plus" class="!w-3.5 !h-3.5"></mat-icon>
                                    <span>បន្ថែមឯកសារទៀត</span>
                                </button>
                            </div>
                        </div>
                    </div>

                </div>

            </mat-dialog-content>

            <!-- Bottom Sticky Action Bar -->
            <div class="w-full flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 font-kantumruy gap-2.5">
                <!-- Cancel -->
                <button
                    type="button"
                    (click)="cancel()"
                    class="h-10 px-4 rounded-xl font-medium font-kantumruy text-[14px] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                    បោះបង់
                </button>

                <!-- Actions: Create & Add Another + Create & Close -->
                <div class="flex items-center gap-2">
                    <button
                        type="button"
                        (click)="submitAndAddAnother()"
                        [disabled]="!projectName.trim() || isSubmitting()"
                        class="h-10 px-4 rounded-xl font-medium font-kantumruy text-[14px] text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 hover:bg-blue-100 dark:hover:bg-blue-900/80 border border-blue-200 dark:border-blue-800/60 disabled:opacity-50 transition-all cursor-pointer shadow-2xs"
                    >
                        + បង្កើត និងបន្តបន្ថែម
                    </button>

                    <button
                        type="button"
                        (click)="submitAndClose()"
                        [disabled]="!projectName.trim() || isSubmitting()"
                        class="h-10 px-5 rounded-xl font-medium font-kantumruy text-[14px] text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
                    >
                        <mat-icon *ngIf="!isSubmitting()" svgIcon="mdi:plus" class="!w-4 !h-4 text-white shrink-0"></mat-icon>
                        <mat-icon *ngIf="isSubmitting()" svgIcon="mdi:loading" class="!w-4 !h-4 text-white shrink-0 animate-spin"></mat-icon>
                        <span>{{ isSubmitting() ? 'កំពុងបង្កើត...' : 'បង្កើតគម្រោង' }}</span>
                    </button>
                </div>
            </div>

        </div>
    `
})
export class CreateProjectDialogComponent implements OnInit {
    @ViewChild('projectNameInput') projectNameInput?: ElementRef<HTMLInputElement>;

    projectName: string = '';
    projectCode: string = 'PRJ-0001';
    category: string = 'it';
    budget: number = 5000;
    startDate: Date | string | null = new Date();
    endDate: Date | string | null = new Date(Date.now() + 86400000 * 60);
    priority = signal<'low' | 'medium' | 'high'>('medium');
    description: string = '';

    // File attachments
    attachedFiles = signal<ProjectAttachment[]>([]);
    isDraggingOver = signal<boolean>(false);
    private dragCounter = 0;

    // State for continuous creation, notifications, and smooth closing
    isSubmitting = signal<boolean>(false);
    isClosing = signal<boolean>(false);
    successNotice = signal<string>('');
    private hasCreatedAnyProject = false;

    // 4 Project Statuses (Projects Governance Standard)
    statusList: ProjectStatusOption[] = [
        {
            id: 'planning',
            label: 'រៀបចំផែនការ',
            dotColor: 'bg-blue-500',
            activeColor: 'text-blue-600 dark:text-blue-400',
            activeBg: 'bg-blue-50/70 dark:bg-blue-950/40',
            activeBorder: 'border-blue-500',
        },
        {
            id: 'active',
            label: 'កំពុងដំណើរការ',
            dotColor: 'bg-emerald-500',
            activeColor: 'text-emerald-600 dark:text-emerald-400',
            activeBg: 'bg-emerald-50/70 dark:bg-emerald-950/40',
            activeBorder: 'border-emerald-500',
        },
        {
            id: 'on_hold',
            label: 'ផ្អាក',
            dotColor: 'bg-amber-500',
            activeColor: 'text-amber-600 dark:text-amber-400',
            activeBg: 'bg-amber-50/70 dark:bg-amber-950/40',
            activeBorder: 'border-amber-500',
        },
        {
            id: 'completed',
            label: 'បានបញ្ចប់',
            dotColor: 'bg-purple-500',
            activeColor: 'text-purple-600 dark:text-purple-400',
            activeBg: 'bg-purple-50/70 dark:bg-purple-950/40',
            activeBorder: 'border-purple-500',
        },
    ];
    selectedStatus = signal<'planning' | 'active' | 'on_hold' | 'completed'>('active');

    // Categories
    categoryList: ProjectCategoryOption[] = [
        { id: 'it', label: 'បច្ចេកវិទ្យាព័ត៌មាន (IT & Software)', icon: 'mdi:code-tags', iconColor: 'text-blue-500' },
        { id: 'infrastructure', label: 'ហេដ្ឋារចនាសម្ព័ន្ធ (Infrastructure)', icon: 'mdi:server-network', iconColor: 'text-cyan-500' },
        { id: 'operations', label: 'ប្រតិបត្តិការទូទៅ (Operations)', icon: 'mdi:cog-transfer-outline', iconColor: 'text-amber-500' },
        { id: 'design', label: 'ការរចនា និង UI/UX (Design & Creative)', icon: 'mdi:palette-outline', iconColor: 'text-purple-500' },
        { id: 'marketing', label: 'យុទ្ធនាការ និងផ្សព្វផ្សាយ (Marketing)', icon: 'mdi:bullhorn-outline', iconColor: 'text-rose-500' },
    ];

    getCategoryOption(catId: string): ProjectCategoryOption {
        return this.categoryList.find((c) => c.id === catId) || this.categoryList[0];
    }

    // Lead & Team Members - Empty by default (no forced preselection per UI pattern)
    leadName: string = '';
    leadRole: string = '';
    leadAvatar: string | null = null;
    leadId: string | number | null = null;

    availableMembers: TeamMember[] = [
        { id: '1', name: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត', role: 'Super Admin / Lead Developer' },
        { id: '2', name: 'ពុំ ប្រុសមុន្នី', role: 'Frontend Lead' },
        { id: '3', name: 'ថា វីនណឺរ', role: 'Backend Lead' },
        { id: '4', name: 'ភឿង សុវណ្ណារ៉ា', role: 'Developer' },
    ];
    selectedMemberIds = signal<string[]>([]);

    get selectedMembers(): TeamMember[] {
        return this.availableMembers.filter((m) => this.selectedMemberIds().includes(String(m.id)));
    }

    isMemberSelected(id: string | number): boolean {
        return this.selectedMemberIds().includes(String(id));
    }

    toggleMember(id: string | number): void {
        const current = this.selectedMemberIds();
        const strId = String(id);
        if (current.includes(strId)) {
            this.selectedMemberIds.set(current.filter((item) => item !== strId));
        } else {
            this.selectedMemberIds.set([...current, strId]);
        }
    }

    selectLead(m: TeamMember): void {
        if (this.leadName === m.name || (this.leadId && String(this.leadId) === String(m.id))) {
            this.clearLead();
            return;
        }
        this.leadName = m.name;
        this.leadRole = m.role || 'ប្រធានគម្រោង';
        this.leadAvatar = m.avatar || null;
        this.leadId = m.id;
    }

    clearLead(): void {
        this.leadName = '';
        this.leadRole = '';
        this.leadAvatar = null;
        this.leadId = null;
    }

    formatDisplayDate(date: Date | string | null): string {
        if (!date) return 'ជ្រើសរើសកាលបរិច្ឆេទ';
        const d = typeof date === 'string' ? new Date(date) : date;
        if (isNaN(d.getTime())) return 'ជ្រើសរើសកាលបរិច្ឆេទ';
        const day = String(d.getDate()).padStart(2, '0');
        const khmerMonths = ['មករា', 'កម្ភៈ', 'មិនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
        return `${day} ${khmerMonths[d.getMonth()]} ${d.getFullYear()}`;
    }

    private formatIsoDate(d: Date | string | null): string | null {
        if (!d) return null;
        if (typeof d === 'string') {
            return d.includes('T') ? d.split('T')[0] : d;
        }
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    generateNextCode(): string {
        const prefix = 'PRJ';
        let maxNum = -1;
        for (const p of this.data?.existingProjects || []) {
            if (p.code) {
                const match = p.code.match(/\d+/);
                if (match) {
                    const val = parseInt(match[0], 10);
                    if (!isNaN(val) && val > maxNum) maxNum = val;
                }
            }
        }
        const nextNum = maxNum >= 0 ? maxNum + 1 : 1;
        return `${prefix}-${String(nextNum).padStart(4, '0')}`;
    }

    incrementProjectCode(): void {
        const match = this.projectCode.match(/^([A-Za-z]+)-(\d+)$/);
        if (match) {
            const prefix = match[1];
            const num = parseInt(match[2], 10) + 1;
            this.projectCode = `${prefix}-${String(num).padStart(4, '0')}`;
        } else {
            this.projectCode = this.generateNextCode();
        }
    }

    constructor(
        public dialogRef: MatDialogRef<CreateProjectDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: CreateProjectDialogData,
        private readonly _homeService: UserHomeService,
        private readonly _taskService: UserTaskService,
    ) {
        // Enable custom smooth closing on backdrop click & escape key
        this.dialogRef.disableClose = true;
        this.dialogRef.backdropClick().subscribe(() => {
            this.cancel();
        });
        this.dialogRef.keydownEvents().subscribe((e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                this.cancel();
            }
        });

        if (this.data?.members && this.data.members.length > 0) {
            this.availableMembers = this.data.members.map((m) => ({
                id: String(m.id),
                name: m.name,
                role: m.role,
                avatar: m.avatar,
            }));
        }

        if (this.data?.user) {
            const u = this.data.user;
            const uName = u.kh_name || u.en_name || u.name || '';
            const uRole = u.position || u.roles?.[0]?.name_en || u.roles?.[0]?.name_kh || 'Project Lead';
            const uAvatar = u.avatar?.uri || u.avatar || null;

            if (uName && !this.availableMembers.some((m) => m.name.toLowerCase() === uName.toLowerCase())) {
                this.availableMembers.unshift({
                    id: String(u.id || 'lead'),
                    name: uName,
                    role: uRole,
                    avatar: uAvatar,
                });
            }
        }

        this.projectCode = this.generateNextCode();
    }

    ngOnInit(): void {
        this._taskService.getMembers().subscribe({
            next: (res) => {
                if (res?.data && res.data.length > 0) {
                    const mapped = res.data.map((m: any) => ({
                        id: String(m.id),
                        name: m.name || m.name_en || m.name_kh || '',
                        role: m.role || 'Member',
                        avatar: m.avatar?.uri || m.avatar || null,
                    }));
                    for (const m of mapped) {
                        if (!this.availableMembers.some((existing) => String(existing.id) === String(m.id) || existing.name.toLowerCase() === m.name.toLowerCase())) {
                            this.availableMembers.push(m);
                        }
                    }
                }
            },
            error: () => {},
        });
    }

    private buildPayload(): any {
        const name = this.projectName.trim();
        const membersPayload = this.selectedMembers.map((m) => ({
            id: Number(m.id) || 1,
            name: m.name,
            role: m.role,
            avatar: m.avatar || null,
        }));

        const currentUser = this.data?.user;
        const currentUserName = currentUser?.kh_name || currentUser?.en_name || currentUser?.name || '';

        // Safe fallback for lead: if user selected a lead, use it; otherwise fallback to current user
        const effectiveLead = this.leadName
            ? {
                  id: this.leadId ? Number(this.leadId) : (currentUser?.id || 1),
                  name: this.leadName,
                  role: this.leadRole || 'ប្រធានគម្រោង',
                  avatar: this.leadAvatar,
              }
            : (currentUserName
                  ? {
                        id: currentUser?.id || 1,
                        name: currentUserName,
                        role: currentUser?.position || currentUser?.roles?.[0]?.name_en || currentUser?.roles?.[0]?.name_kh || 'ប្រធានគម្រោង',
                        avatar: currentUser?.avatar?.uri || null,
                    }
                  : null);

        // Ensure lead is in members list if defined
        if (effectiveLead && !membersPayload.some((m) => m.name === effectiveLead.name)) {
            membersPayload.unshift(effectiveLead);
        }

        return {
            code: this.projectCode.trim().toUpperCase(),
            name: name,
            description: this.description.trim() || name,
            status: this.selectedStatus(),
            priority: this.priority(),
            category: this.category,
            budget: Number(this.budget) || 5000,
            budget_allocated: Number(this.budget) || 5000,
            start_date: this.formatIsoDate(this.startDate) || new Date().toISOString(),
            end_date: this.formatIsoDate(this.endDate) || new Date(Date.now() + 86400000 * 60).toISOString(),
            lead: effectiveLead,
            team_lead: effectiveLead,
            reporter: effectiveLead?.name || '',
            members: membersPayload,
            assignees: membersPayload,
            attachments: this.attachedFiles(),
            attachments_count: this.attachedFiles().length,
        };
    }

    private performSmoothClose(result: any = null): void {
        if (this.isClosing()) return;
        this.isClosing.set(true);

        try {
            this.dialogRef.addPanelClass('side-dialog-closing');
            const backdrop =
                ((this.dialogRef as any)._overlayRef?.backdropElement as HTMLElement) ||
                (document.querySelector('.cdk-overlay-backdrop.cdk-overlay-backdrop-showing') as HTMLElement);
            if (backdrop) {
                backdrop.style.transition = 'opacity 200ms cubic-bezier(0.2, 0, 0, 1)';
                backdrop.style.opacity = '0';
            }
        } catch (e) {
            console.warn('Error during smooth close animation', e);
        }

        setTimeout(() => {
            this.dialogRef.close(result);
        }, 190);
    }

    submitAndAddAnother(): void {
        const name = this.projectName.trim();
        if (!name || this.isSubmitting() || this.isClosing()) return;

        this.isSubmitting.set(true);
        const payload = this.buildPayload();

        this._homeService.createProject(payload).subscribe({
            next: (res) => {
                this.isSubmitting.set(false);
                this.hasCreatedAnyProject = true;
                if (this.data?.onProjectCreated) {
                    this.data.onProjectCreated();
                }
                const savedName = name;
                this.successNotice.set(`បានបង្កើតគម្រោង «${savedName}» ដោយជោគជ័យ!`);
                this.incrementProjectCode();
                this.projectName = '';
                this.description = '';
                this.attachedFiles.set([]);
                setTimeout(() => {
                    this.projectNameInput?.nativeElement?.focus();
                }, 100);
            },
            error: (err) => {
                console.error('Failed to create project via API', err);
                this.isSubmitting.set(false);
                this.hasCreatedAnyProject = true;
                const savedName = name;
                this.successNotice.set(`បានបង្កើតគម្រោង «${savedName}» ដោយជោគជ័យ!`);
                this.incrementProjectCode();
                this.projectName = '';
                this.description = '';
                this.attachedFiles.set([]);
                setTimeout(() => {
                    this.projectNameInput?.nativeElement?.focus();
                }, 100);
            },
        });
    }

    submitAndClose(): void {
        const name = this.projectName.trim();
        if (!name || this.isSubmitting() || this.isClosing()) return;

        this.isSubmitting.set(true);
        const payload = this.buildPayload();

        this._homeService.createProject(payload).subscribe({
            next: (res) => {
                this.isSubmitting.set(false);
                if (this.data?.onProjectCreated) {
                    this.data.onProjectCreated();
                }
                this.performSmoothClose({
                    created: true,
                    alreadyCreated: true,
                    project: res?.data || payload,
                    name: name,
                    status: this.selectedStatus(),
                    priority: this.priority(),
                    category: this.category,
                    budget: Number(this.budget) || 5000,
                    budget_allocated: Number(this.budget) || 5000,
                    lead: payload.lead,
                    team_lead: payload.team_lead,
                    reporter: payload.reporter,
                    assignees: payload.assignees,
                    members: payload.members,
                    description: this.description.trim() || name,
                    attachments: this.attachedFiles(),
                });
            },
            error: (err) => {
                console.error('Failed to create project via API', err);
                this.isSubmitting.set(false);
                this.performSmoothClose({
                    created: true,
                    project: payload,
                    name: name,
                    status: this.selectedStatus(),
                    priority: this.priority(),
                    category: this.category,
                    budget: Number(this.budget) || 5000,
                    budget_allocated: Number(this.budget) || 5000,
                    lead: payload.lead,
                    team_lead: payload.team_lead,
                    reporter: payload.reporter,
                    assignees: payload.assignees,
                    members: payload.members,
                    description: this.description.trim() || name,
                    attachments: this.attachedFiles(),
                });
            },
        });
    }

    cancel(): void {
        this.performSmoothClose(this.hasCreatedAnyProject ? { created: true } : null);
    }

    // =========================================================================
    // ATTACHMENT DRAG & DROP AND FILE HANDLING
    // =========================================================================
    onDragOver(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    }

    onDragEnter(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.dragCounter++;
        if (event.dataTransfer?.types?.includes('Files')) {
            this.isDraggingOver.set(true);
        }
    }

    onDragLeave(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.dragCounter--;
        if (this.dragCounter <= 0) {
            this.dragCounter = 0;
            this.isDraggingOver.set(false);
        }
    }

    onFileDrop(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.dragCounter = 0;
        this.isDraggingOver.set(false);
        if (event.dataTransfer?.files?.length) {
            this.handleIncomingFiles(event.dataTransfer.files);
        }
    }

    onFileInputChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files?.length) {
            this.handleIncomingFiles(input.files);
            input.value = '';
        }
    }

    handleIncomingFiles(fileList: FileList | File[]): void {
        const filesArray = Array.from(fileList);
        const processed: ProjectAttachment[] = [];
        let remaining = filesArray.length;

        const checkDone = () => {
            if (remaining === 0 && processed.length > 0) {
                this.attachedFiles.update((prev) => [...prev, ...processed]);
            }
        };

        for (const file of filesArray) {
            const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(file.name);
            const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
            const isText = file.type.startsWith('text/') || /\.(txt|json|csv|md|js|ts|html|xml|sql|log)$/i.test(file.name);
            const sizeStr = this.formatFileSize(file.size);

            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = (e.target?.result as string) || '';
                const item: ProjectAttachment = {
                    name: file.name,
                    size: sizeStr,
                    type: file.type || (isPdf ? 'application/pdf' : isImage ? 'image/png' : 'application/octet-stream'),
                    url: dataUrl,
                    isImage: isImage,
                    fileBlob: file,
                };

                if (isText) {
                    file.text()
                        .then((txt) => {
                            item.textContent = txt;
                            processed.push(item);
                            remaining--;
                            checkDone();
                        })
                        .catch(() => {
                            processed.push(item);
                            remaining--;
                            checkDone();
                        });
                } else {
                    processed.push(item);
                    remaining--;
                    checkDone();
                }
            };
            reader.onerror = () => {
                const blobUrl = URL.createObjectURL(file);
                processed.push({
                    name: file.name,
                    size: sizeStr,
                    type: file.type || 'application/octet-stream',
                    url: blobUrl,
                    isImage: isImage,
                    fileBlob: file,
                });
                remaining--;
                checkDone();
            };
            reader.readAsDataURL(file);
        }
    }

    removeAttachment(index: number): void {
        this.attachedFiles.update((prev) => prev.filter((_, i) => i !== index));
    }

    formatFileSize(bytes: number): string {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
    }

    isImageAttachment(att?: ProjectAttachment | null): boolean {
        if (!att) return false;
        if (att.isImage) return true;
        const name = (att.name || '').toLowerCase();
        const type = (att.type || '').toLowerCase();
        return (
            type.startsWith('image/') ||
            /\.(png|jpe?g|gif|webp|svg|bmp|ico)$/i.test(name) ||
            (!!att.url && att.url.startsWith('data:image/'))
        );
    }

    getFileIcon(name: string, type?: string): string {
        const lower = name.toLowerCase();
        if (lower.endsWith('.pdf') || type?.includes('pdf')) return 'mdi:file-pdf-box';
        if (lower.endsWith('.xls') || lower.endsWith('.xlsx') || type?.includes('excel') || type?.includes('spreadsheet'))
            return 'mdi:file-excel-box';
        if (lower.endsWith('.doc') || lower.endsWith('.docx') || type?.includes('word') || type?.includes('document'))
            return 'mdi:file-word-box';
        if (lower.endsWith('.zip') || lower.endsWith('.rar') || lower.endsWith('.7z') || type?.includes('zip'))
            return 'mdi:folder-zip-outline';
        if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp'))
            return 'mdi:file-image';
        return 'mdi:file-document-outline';
    }

    getFileIconColor(name: string): string {
        const lower = name.toLowerCase();
        if (lower.endsWith('.pdf')) return 'text-rose-500 bg-rose-50 dark:bg-rose-950/40';
        if (lower.endsWith('.xls') || lower.endsWith('.xlsx')) return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40';
        if (lower.endsWith('.doc') || lower.endsWith('.docx')) return 'text-blue-500 bg-blue-50 dark:bg-blue-950/40';
        if (lower.endsWith('.zip') || lower.endsWith('.rar')) return 'text-amber-500 bg-amber-50 dark:bg-amber-950/40';
        return 'text-blue-500 bg-blue-50 dark:bg-blue-950/40';
    }
}
