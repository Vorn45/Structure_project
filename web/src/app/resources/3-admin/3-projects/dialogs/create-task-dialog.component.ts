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
import { UserTaskService } from 'app/resources/2-user/2-task/task.service';
import { TASK_TYPES_LIST, TaskAttachment, TaskTypeOption } from 'app/resources/2-user/2-task/models/task.types';
import { KhmerDateAdapter } from 'helper/adapter/khmer-date-adapter';

export interface CreateTaskDialogData {
    projectCode?: string;
    projectName?: string;
    user?: any;
    members?: { id: number | string; name: string; role: string; avatar?: string }[];
    existingTasks?: { code?: string; project_id?: string }[];
    onTaskCreated?: () => void;
}

export interface WorkStatus {
    id: string;
    label: string;
    icon?: string;
    dotColor?: string;
    activeColor: string;
    activeBg: string;
    activeBorder: string;
}

export interface TeamMember {
    id: string;
    name: string;
    role: string;
    avatar?: string;
}

@Component({
    selector: 'app-create-task-dialog',
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
    template: `
        <div class="w-full h-full flex flex-col bg-white dark:bg-slate-900 font-kantumruy text-[15px] font-normal relative overflow-visible">
            
            <!-- Clean Header (Centered like Profile Dialog) -->
            <div mat-dialog-title
                class="w-full relative flex justify-center items-center min-h-14 max-h-14 h-14 border-b border-slate-200 dark:border-slate-800 m-0 !py-0 px-4 font-kantumruy bg-white dark:bg-slate-900 shrink-0">
                <span class="w-full text-center text-[18px] sm:text-[20px] font-semibold font-kantumruy text-slate-800 dark:text-slate-100">
                    បង្កើតការងារថ្មី
                </span>
            </div>

            <!-- Standard Side Drawer Close Button (Exact Profile Dialog Style) -->
            <shared-side-dialog-close-button [isReturn]="false" [closeOnClick]="false" (buttonClick)="cancel()"></shared-side-dialog-close-button>

            <!-- Inline Success Toast Notice for Continuous Creation -->
            <div *ngIf="successNotice()" class="mx-5 mt-3 px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 text-[14px] flex items-center justify-between shadow-2xs">
                <div class="flex items-center gap-2 min-w-0">
                    <mat-icon svgIcon="mdi:check-circle" class="icon-size-4.5 text-emerald-600 dark:text-emerald-400 shrink-0"></mat-icon>
                    <span class="font-medium truncate">{{ successNotice() }}</span>
                </div>
                <button type="button" (click)="successNotice.set('')" class="text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-200 shrink-0 ml-2">
                    <mat-icon svgIcon="mdi:close" class="icon-size-4"></mat-icon>
                </button>
            </div>

            <!-- Scrollable Body -->
            <mat-dialog-content class="w-full !m-0 !p-0 overflow-y-auto flex-1 bg-white dark:bg-slate-900 font-kantumruy text-[15px]">
                
                <div class="p-5 space-y-5 font-kantumruy">
                    
                    <!-- 1. Task Name / Title Input -->
                    <div>
                        <label class="block font-medium text-slate-800 dark:text-slate-200 mb-1.5 text-[15px]">
                            ឈ្មោះការងារ <span class="text-rose-500">*</span>
                        </label>
                        <input
                            #taskTitleInput
                            type="text"
                            [(ngModel)]="taskTitle"
                            (keyup.enter)="submitAndClose()"
                            placeholder="ឧ. រៀបចំ UI Dashboard និងភ្ជាប់ API ផ្ទៀងផ្ទាត់ទិន្នន័យ..."
                            class="w-full px-3.5 py-2.5 text-[15px] font-normal font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                    </div>

                    <!-- 2. Project Selection & Auto Task Code Row -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                            <label class="block font-medium text-slate-700 dark:text-slate-300 mb-1.5 text-[13.5px]">
                                គម្រោង <span class="text-rose-500">*</span>
                            </label>
                            <button
                                type="button"
                                [matMenuTriggerFor]="projectMenu"
                                class="w-full flex items-center justify-between px-3.5 py-2 text-[14px] font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:border-slate-300 dark:hover:border-slate-600 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-left cursor-pointer"
                            >
                                <span class="truncate font-medium">{{ getSelectedProjectName() }}</span>
                                <mat-icon svgIcon="heroicons_outline:chevron-down" class="!w-4 !h-4 text-slate-400 shrink-0 ml-1.5"></mat-icon>
                            </button>

                            <mat-menu #projectMenu="matMenu" class="custom-saas-menu !rounded-2xl !p-1.5 shadow-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                                <button
                                    mat-menu-item
                                    *ngFor="let p of projectList"
                                    (click)="onProjectSelected(p.id)"
                                    class="!flex items-center justify-between !h-10 !px-3.5 !rounded-xl transition-colors"
                                    [ngClass]="selectedProjectId === p.id ? '!bg-blue-50 dark:!bg-blue-950/40 font-semibold text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'"
                                >
                                    <span class="text-[14px] font-kantumruy truncate">{{ p.name }}</span>
                                    <mat-icon *ngIf="selectedProjectId === p.id" svgIcon="heroicons_solid:check" class="!w-4 !h-4 text-blue-600 dark:text-blue-400 ml-2"></mat-icon>
                                </button>
                            </mat-menu>
                        </div>

                        <div>
                            <div class="flex items-center justify-between mb-1.5">
                                <label class="block font-medium text-slate-700 dark:text-slate-300 text-[13.5px]">
                                    កូដសម្គាល់ការងារ
                                </label>
                                <span class="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                    ស្វ័យប្រវត្តិ
                                </span>
                            </div>
                            <input
                                type="text"
                                [value]="taskCode"
                                readonly
                                tabindex="-1"
                                class="w-full px-3.5 py-2 text-[14px] font-kantumruy font-mono uppercase font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 cursor-not-allowed select-none focus:outline-none"
                            />
                        </div>
                    </div>

                    <!-- 3. Work Status Selection (Clean Minimal Dots) -->
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <label class="block font-medium text-slate-700 dark:text-slate-300 text-[13.5px]">
                                ស្ថានភាពការងារ <span class="text-rose-500">*</span>
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

                    <!-- 4. REPORTER & ASSIGNEE (NO DEFAULTS, CLEAN SELECTION) -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-start">
                        
                        <!-- Reporter (អ្នករាយការណ៍) -->
                        <div class="space-y-2">
                            <div class="flex items-center justify-between">
                                <label class="text-[12.5px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    <span>អ្នករាយការណ៍</span>
                                </label>
                                <div class="flex items-center gap-1.5">
                                    <button
                                        *ngIf="reporterName"
                                        type="button"
                                        (click)="clearReporter()"
                                        class="text-[12px] text-slate-400 hover:text-rose-500 transition-colors cursor-pointer mr-1"
                                    >
                                        សម្អាត
                                    </button>
                                    <button
                                        type="button"
                                        [matMenuTriggerFor]="reporterMenu"
                                        class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg transition-colors cursor-pointer">
                                        <mat-icon svgIcon="mdi:account-plus-outline" class="!w-3.5 !h-3.5"></mat-icon>
                                        <span>{{ reporterName ? 'ប្តូរ' : 'ចាត់តាំង' }}</span>
                                    </button>
                                </div>
                            </div>

                            <!-- Selected Reporter Card -->
                            <div *ngIf="reporterName" class="flex items-center gap-2.5 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                                <div class="w-7 h-7 rounded-full flex items-center justify-center shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
                                    <img *ngIf="reporterAvatar" [src]="reporterAvatar" alt="Avatar" class="w-full h-full object-cover" />
                                    <mat-icon *ngIf="!reporterAvatar" svgIcon="mdi:account" class="!w-4 !h-4 !m-0 !p-0 flex items-center justify-center text-slate-500 dark:text-slate-400"></mat-icon>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <p class="text-[13px] font-medium text-slate-800 dark:text-white truncate leading-tight">
                                        {{ reporterName }}
                                    </p>
                                    <p class="text-[11px] text-slate-400 truncate">
                                        {{ reporterRole || 'អ្នករាយការណ៍' }}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    (click)="clearReporter()"
                                    class="text-slate-400 hover:text-rose-500 transition-colors p-1 cursor-pointer"
                                    matTooltip="ដកចេញ"
                                >
                                    <mat-icon svgIcon="mdi:close" class="icon-size-3.5"></mat-icon>
                                </button>
                            </div>

                            <!-- Unselected Reporter Placeholder -->
                            <button *ngIf="!reporterName"
                                type="button"
                                [matMenuTriggerFor]="reporterMenu"
                                class="w-full py-2.5 px-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-400 bg-white dark:bg-slate-800 text-left flex items-center justify-between text-slate-500 dark:text-slate-400 hover:text-blue-600 transition-all cursor-pointer">
                                <span class="text-[13px] font-medium">+ ជ្រើសរើសអ្នករាយការណ៍</span>
                                <mat-icon svgIcon="heroicons_outline:chevron-down" class="!w-4 !h-4 text-slate-400"></mat-icon>
                            </button>
                        </div>

                        <!-- Assignees Section -->
                        <div class="space-y-2">
                            <div class="flex items-center justify-between">
                                <label class="text-[12.5px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    <span>អ្នកទទួលបន្ទុក</span>
                                    <span *ngIf="selectedAssignees.length > 0" class="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 font-semibold">
                                        {{ selectedAssignees.length }} នាក់
                                    </span>
                                </label>
                                <button
                                    type="button"
                                    [matMenuTriggerFor]="assigneeMenu"
                                    class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg transition-colors cursor-pointer">
                                    <mat-icon svgIcon="mdi:account-plus-outline" class="!w-3.5 !h-3.5"></mat-icon>
                                    <span>ចាត់តាំង</span>
                                </button>
                            </div>

                            <!-- Selected Assignees List -->
                            <div *ngIf="selectedAssignees.length > 0" class="space-y-1.5 max-h-36 overflow-y-auto pr-0.5">
                                <div *ngFor="let m of selectedAssignees"
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
                                            {{ m.role || 'អ្នកទទួលបន្ទុក' }}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        (click)="toggleAssignee(m.id)"
                                        class="text-slate-400 hover:text-rose-500 transition-colors p-1 cursor-pointer"
                                        matTooltip="ដកចេញ"
                                    >
                                        <mat-icon svgIcon="mdi:close" class="icon-size-3.5"></mat-icon>
                                    </button>
                                </div>
                            </div>

                            <!-- Unselected Assignee Placeholder -->
                            <button *ngIf="selectedAssignees.length === 0"
                                type="button"
                                [matMenuTriggerFor]="assigneeMenu"
                                class="w-full py-2.5 px-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-400 bg-white dark:bg-slate-800 text-left flex items-center justify-between text-slate-500 dark:text-slate-400 hover:text-blue-600 transition-all cursor-pointer">
                                <span class="text-[13px] font-medium">+ ជ្រើសរើសអ្នកទទួលខុសត្រូវ</span>
                                <mat-icon svgIcon="heroicons_outline:chevron-down" class="!w-4 !h-4 text-slate-400"></mat-icon>
                            </button>
                        </div>

                    </div>

                    <!-- Multi-Select Menu for Assignee -->
                    <mat-menu #assigneeMenu="matMenu" panelClass="task-dropdown-menu" class="font-kantumruy !min-w-[280px] !p-1.5">
                        <div (click)="$event.stopPropagation()" class="px-2.5 py-2 border-b border-slate-100 dark:border-slate-700/80 mb-1 flex items-center justify-between">
                            <span class="text-[12.5px] font-semibold text-slate-800 dark:text-slate-200">ជ្រើសរើសអ្នកទទួលខុសត្រូវ</span>
                            <span *ngIf="selectedAssignees.length > 0" class="text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full border border-blue-200/60 dark:border-blue-800/60">
                                {{ selectedAssignees.length }} នាក់
                            </span>
                        </div>
                        <div (click)="$event.stopPropagation()" class="max-h-60 overflow-y-auto space-y-0.5">
                            <div *ngFor="let m of teamMembers"
                                (click)="toggleAssignee(m.id)"
                                class="flex items-center justify-between px-2.5 py-1.5 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors font-kantumruy select-none my-0.5">
                                <div class="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                                    <!-- Avatar or Default Icon User -->
                                    <div class="w-7 h-7 rounded-full flex items-center justify-center shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
                                        <img *ngIf="m.avatar" [src]="m.avatar" class="w-full h-full object-cover" />
                                        <mat-icon *ngIf="!m.avatar" svgIcon="mdi:account" class="!w-4 !h-4 !m-0 !p-0 flex items-center justify-center text-slate-500 dark:text-slate-400"></mat-icon>
                                    </div>
                                    <div class="min-w-0 text-left flex-1">
                                        <p class="text-[12.5px] font-medium text-slate-800 dark:text-slate-200 truncate leading-snug">
                                            {{ m.name }}
                                        </p>
                                        <p class="text-[11px] text-slate-400 dark:text-slate-500 truncate leading-tight">
                                            {{ m.role || 'អ្នកទទួលបន្ទុក' }}
                                        </p>
                                    </div>
                                </div>
                                <mat-icon *ngIf="isAssigneeSelected(m.id)" svgIcon="mdi:check" class="!w-4 !h-4 !m-0 text-blue-500 shrink-0 ml-auto"></mat-icon>
                            </div>

                            <div *ngIf="teamMembers.length === 0" class="py-4 text-center text-xs text-slate-400">
                                រកមិនឃើញសមាជិកទេ
                            </div>
                        </div>
                    </mat-menu>

                    <!-- Menu for Reporter -->
                    <mat-menu #reporterMenu="matMenu" panelClass="task-dropdown-menu" class="font-kantumruy !min-w-[280px] !p-1.5">
                        <div (click)="$event.stopPropagation()" class="px-2.5 py-2 border-b border-slate-100 dark:border-slate-700/80 mb-1 flex items-center justify-between">
                            <span class="text-[12.5px] font-semibold text-slate-800 dark:text-slate-200">ជ្រើសរើសអ្នករាយការណ៍</span>
                            <span *ngIf="reporterName" class="text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full border border-blue-200/60 dark:border-blue-800/60">
                                បានជ្រើសរើស
                            </span>
                        </div>
                        <div class="max-h-60 overflow-y-auto space-y-0.5">
                            <button *ngFor="let m of teamMembers" mat-menu-item (click)="selectReporter(m)"
                                class="!text-[13px] !rounded-xl !h-auto !py-1.5 my-0.5">
                                <div class="flex items-center justify-between w-full">
                                    <div class="flex items-center gap-2.5 min-w-0">
                                        <!-- Avatar or Default Icon User -->
                                        <div class="w-7 h-7 rounded-full flex items-center justify-center shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
                                            <img *ngIf="m.avatar" [src]="m.avatar" class="w-full h-full object-cover" />
                                            <mat-icon *ngIf="!m.avatar" svgIcon="mdi:account" class="!w-4 !h-4 !m-0 !p-0 flex items-center justify-center text-slate-500 dark:text-slate-400"></mat-icon>
                                        </div>
                                        <div class="min-w-0 text-left">
                                            <p class="text-[12.5px] font-medium text-slate-800 dark:text-slate-200 truncate leading-snug">{{ m.name }}</p>
                                            <p class="text-[11px] text-slate-400 truncate leading-tight">{{ m.role || 'អ្នករាយការណ៍' }}</p>
                                        </div>
                                    </div>
                                    <mat-icon *ngIf="reporterName === m.name || (reporterId && reporterId === m.id)" svgIcon="mdi:check" class="!w-4 !h-4 !m-0 shrink-0 text-blue-500 ml-auto"></mat-icon>
                                </div>
                            </button>

                            <div *ngIf="teamMembers.length === 0" class="py-4 text-center text-xs text-slate-400">
                                រកមិនឃើញសមាជិកទេ
                            </div>
                        </div>
                        <div *ngIf="reporterName" class="border-t border-slate-100 dark:border-slate-700/80 mt-1 pt-1">
                            <button mat-menu-item (click)="clearReporter()"
                                class="!text-[12.5px] !rounded-xl !h-auto !py-1.5 !text-rose-600 dark:!text-rose-400 hover:!bg-rose-50 dark:hover:!bg-rose-950/30">
                                <div class="flex items-center gap-2">
                                    <mat-icon svgIcon="mdi:account-off-outline" class="!w-4 !h-4 text-rose-500"></mat-icon>
                                    <span>សម្អាត (មិនកំណត់)</span>
                                </div>
                            </button>
                        </div>
                    </mat-menu>

                    <!-- 5. Priority & Category Row -->
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
                                ប្រភេទការងារ (Task Type)
                            </label>
                            <button
                                type="button"
                                [matMenuTriggerFor]="taskTypeMenu"
                                class="w-full flex items-center justify-between px-3.5 py-2 text-[14px] font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:border-slate-300 dark:hover:border-slate-600 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-left cursor-pointer"
                            >
                                <div class="flex items-center gap-2.5">
                                    <mat-icon [svgIcon]="getTaskTypeOption(selectedTaskType).icon" class="!w-4.5 !h-4.5 shrink-0" [ngClass]="getTaskTypeOption(selectedTaskType).iconColor"></mat-icon>
                                    <span class="font-medium truncate">{{ getTaskTypeOption(selectedTaskType).label }}</span>
                                </div>
                                <mat-icon svgIcon="mdi:chevron-down" class="!w-4 !h-4 opacity-70 text-slate-500 dark:text-slate-400 shrink-0 ml-1.5"></mat-icon>
                            </button>

                            <mat-menu #taskTypeMenu="matMenu" panelClass="task-dropdown-menu" class="font-kantumruy min-w-[200px]">
                                <button
                                    mat-menu-item
                                    *ngFor="let item of taskTypesList"
                                    (click)="selectedTaskType = item.id"
                                >
                                    <div class="flex items-center gap-2.5 w-full">
                                        <mat-icon [svgIcon]="item.icon" class="!w-4.5 !h-4.5 shrink-0" [ngClass]="item.iconColor"></mat-icon>
                                        <span class="font-medium text-[13px] text-slate-800 dark:text-slate-200">{{ item.label }}</span>
                                        <mat-icon *ngIf="selectedTaskType === item.id" svgIcon="mdi:check" class="!w-4 !h-4 text-blue-500 ml-auto"></mat-icon>
                                    </div>
                                </button>
                            </mat-menu>
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
                            ការពិពណ៌នាការងារ
                        </label>
                        <textarea
                            rows="3"
                            [(ngModel)]="description"
                            placeholder="ពិពណ៌នាអំពីខ្លឹមសារ និងលទ្ធផលរំពឹងទុកនៃការងារ..."
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
                        [disabled]="!taskTitle.trim() || isSubmitting()"
                        class="h-10 px-4 rounded-xl font-medium font-kantumruy text-[14px] text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 hover:bg-blue-100 dark:hover:bg-blue-900/80 border border-blue-200 dark:border-blue-800/60 disabled:opacity-50 transition-all cursor-pointer shadow-2xs"
                    >
                        + បង្កើត និងបន្តបន្ថែម
                    </button>

                    <button
                        type="button"
                        (click)="submitAndClose()"
                        [disabled]="!taskTitle.trim() || isSubmitting()"
                        class="h-10 px-5 rounded-xl font-medium font-kantumruy text-[14px] text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer shadow-2xs"
                    >
                        បង្កើតការងារ
                    </button>
                </div>
            </div>

        </div>
    `,
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
                background-color: #121c2e !important;
                border: 1px solid rgba(51, 65, 85, 0.8) !important;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.6) !important;
            }

            ::ng-deep .task-dropdown-menu .mat-mdc-menu-item {
                color: #1e293b !important;
                border-radius: 0.65rem !important;
                min-height: 38px !important;
                padding: 6px 10px !important;
                font-size: 13px !important;
                font-family: 'Kantumruy Pro', sans-serif !important;
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
})
export class CreateTaskDialogComponent implements OnInit {
    @ViewChild('taskTitleInput') taskTitleInput?: ElementRef<HTMLInputElement>;

    taskTitle: string = '';
    taskCode: string = 'BMS-0000';
    category: string = 'it';
    startDate: Date | string | null = new Date();
    endDate: Date | string | null = new Date(Date.now() + 86400000 * 7);
    priority = signal<'low' | 'medium' | 'high'>('medium');
    description: string = '';

    // File attachments
    attachedFiles = signal<TaskAttachment[]>([]);
    isDraggingOver = signal<boolean>(false);
    private dragCounter = 0;

    projectList = [
        { id: 'bms-digitech', name: 'BMS Digitech', code: 'BMS' },
        { id: 'wms-digitech', name: 'WMS Digitech', code: 'WMS' },
    ];
    selectedProjectId: string = 'bms-digitech';

    // State for continuous creation, notifications, and smooth closing
    isSubmitting = signal<boolean>(false);
    isClosing = signal<boolean>(false);
    successNotice = signal<string>('');
    private hasCreatedAnyTask = false;

    // The 7 statuses matching "ការងារខ្ញុំ"
    statusList: WorkStatus[] = [
        {
            id: 'new',
            label: 'ថ្មី',
            dotColor: 'bg-blue-500',
            activeColor: 'text-blue-600 dark:text-blue-400',
            activeBg: 'bg-blue-50/70 dark:bg-blue-950/40',
            activeBorder: 'border-blue-500',
        },
        {
            id: 'confirmed',
            label: 'បញ្ជាក់',
            dotColor: 'bg-blue-500',
            activeColor: 'text-blue-600 dark:text-blue-400',
            activeBg: 'bg-blue-50/70 dark:bg-blue-950/40',
            activeBorder: 'border-blue-500',
        },
        {
            id: 'unconfirmed',
            label: 'មិនបញ្ជាក់',
            dotColor: 'bg-slate-400',
            activeColor: 'text-slate-600 dark:text-slate-300',
            activeBg: 'bg-slate-100 dark:bg-slate-800',
            activeBorder: 'border-slate-500',
        },
        {
            id: 'in_progress',
            label: 'កំពុងធ្វើ',
            dotColor: 'bg-amber-500',
            activeColor: 'text-amber-600 dark:text-amber-400',
            activeBg: 'bg-amber-50/70 dark:bg-amber-950/40',
            activeBorder: 'border-amber-500',
        },
        {
            id: 'under_review',
            label: 'ស្នើសុំពិនិត្យ',
            dotColor: 'bg-sky-500',
            activeColor: 'text-sky-600 dark:text-sky-400',
            activeBg: 'bg-sky-50/70 dark:bg-sky-950/40',
            activeBorder: 'border-sky-500',
        },
        {
            id: 'reopened',
            label: 'បើកឡើងវិញ',
            dotColor: 'bg-rose-500',
            activeColor: 'text-rose-600 dark:text-rose-400',
            activeBg: 'bg-rose-50/70 dark:bg-rose-950/40',
            activeBorder: 'border-rose-500',
        },
        {
            id: 'completed',
            label: 'បញ្ចប់',
            dotColor: 'bg-emerald-500',
            activeColor: 'text-emerald-600 dark:text-emerald-400',
            activeBg: 'bg-emerald-50/70 dark:bg-emerald-950/40',
            activeBorder: 'border-emerald-500',
        },
    ];
    selectedStatus = signal<string>('new');
    taskTypesList = TASK_TYPES_LIST;
    selectedTaskType: string = 'feature';

    getTaskTypeOption(typeId: string): TaskTypeOption {
        return this.taskTypesList.find((t) => t.id === typeId) || this.taskTypesList[0];
    }

    getSelectedProjectName(): string {
        const found = this.projectList.find((p) => p.id === this.selectedProjectId);
        return found ? found.name : 'ជ្រើសរើសគម្រោង';
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

    // Reporter (អ្នករាយការណ៍ / អ្នកបង្កើត) - Empty by default
    reporterName: string = '';
    reporterRole: string = '';
    reporterAvatar: string | null = null;
    reporterId: string | number | null = null;

    // Team Members for Assignee / Response - Empty by default
    teamMembers: TeamMember[] = [
        { id: '1', name: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត', role: 'Super Admin / Lead Developer' },
        { id: '2', name: 'ពុំ ប្រុសមុន្នី', role: 'Frontend Lead' },
        { id: '3', name: 'ថា វីនណឺរ', role: 'Backend Lead' },
        { id: '4', name: 'ភឿង សុវណ្ណារ៉ា', role: 'Developer' },
    ];
    selectedAssigneeIds = signal<string[]>([]);

    get selectedAssignees(): TeamMember[] {
        return this.teamMembers.filter((m) => this.selectedAssigneeIds().includes(String(m.id)));
    }

    isAssigneeSelected(id: string | number): boolean {
        return this.selectedAssigneeIds().includes(String(id));
    }

    toggleAssignee(id: string | number): void {
        const current = this.selectedAssigneeIds();
        const strId = String(id);
        if (current.includes(strId)) {
            this.selectedAssigneeIds.set(current.filter((item) => item !== strId));
        } else {
            this.selectedAssigneeIds.set([...current, strId]);
        }
    }

    selectReporter(m: TeamMember): void {
        if (this.reporterName === m.name || (this.reporterId && String(this.reporterId) === String(m.id))) {
            this.clearReporter();
            return;
        }
        this.reporterName = m.name;
        this.reporterRole = m.role || 'អ្នករាយការណ៍';
        this.reporterAvatar = m.avatar || null;
        this.reporterId = m.id;
    }

    clearReporter(): void {
        this.reporterName = '';
        this.reporterRole = '';
        this.reporterAvatar = null;
        this.reporterId = null;
    }

    generateNextCode(projId: string): string {
        const found = this.projectList.find((p) => p.id === projId);
        const prefix = found ? found.code : (projId.toUpperCase().includes('WMS') ? 'WMS' : 'BMS');

        const projectTasks = (this.data?.existingTasks || []).filter(
            (t) => (t.project_id === projId || t.code?.toUpperCase().includes(prefix))
        );

        let maxNum = -1;
        for (const t of projectTasks) {
            if (t.code) {
                const match = t.code.match(/\d+/);
                if (match) {
                    const val = parseInt(match[0], 10);
                    if (!isNaN(val) && val > maxNum) {
                        maxNum = val;
                    }
                }
            }
        }

        const nextNum = maxNum >= 0 ? maxNum + 1 : 0;
        return `${prefix}-${String(nextNum).padStart(4, '0')}`;
    }

    incrementTaskCode(): void {
        const match = this.taskCode.match(/^([A-Za-z]+)-(\d+)$/);
        if (match) {
            const prefix = match[1];
            const num = parseInt(match[2], 10) + 1;
            this.taskCode = `${prefix}-${String(num).padStart(4, '0')}`;
        } else {
            this.taskCode = this.generateNextCode(this.selectedProjectId);
        }
    }

    onProjectSelected(projId: string): void {
        this.selectedProjectId = projId;
        this.taskCode = this.generateNextCode(projId);
    }

    constructor(
        public dialogRef: MatDialogRef<CreateTaskDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: CreateTaskDialogData,
        private readonly _userTaskService: UserTaskService,
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

        if (this.data?.projectCode) {
            const found = this.projectList.find(
                (p) => p.code.toLowerCase() === this.data.projectCode?.toLowerCase() || p.id.toLowerCase() === this.data.projectCode?.toLowerCase()
            );
            if (found) {
                this.selectedProjectId = found.id;
            }
        }
        if (this.data?.members && this.data.members.length > 0) {
            this.teamMembers = this.data.members.map((m) => ({
                id: String(m.id),
                name: m.name,
                role: m.role,
                avatar: m.avatar,
            }));
        }
        if (this.data?.user) {
            const u = this.data.user;
            const uName = u.en_name || u.name || u.kh_name || '';
            if (uName && !this.teamMembers.some((m) => m.name.toLowerCase() === uName.toLowerCase())) {
                this.teamMembers.unshift({
                    id: String(u.id || 'me'),
                    name: uName,
                    role: u.roles?.[0]?.name_en || u.roles?.[0]?.name_kh || 'User',
                    avatar: u.avatar?.uri || null,
                });
            }
        }
        this.taskCode = this.generateNextCode(this.selectedProjectId);
        // Note: reporter and assignees deliberately start empty (no defaults) per user requirement
    }

    ngOnInit(): void { }

    private buildPayload(): any {
        const title = this.taskTitle.trim();
        const selectedProj = this.projectList.find((p) => p.id === this.selectedProjectId);
        const primaryAssignee = this.selectedAssignees.length > 0 ? this.selectedAssignees[0] : null;
        const currentUser = this.data?.user;
        const currentUserName = currentUser?.en_name || currentUser?.name || currentUser?.kh_name || '';

        const effectiveReporter = this.reporterName
            ? {
                  id: this.reporterId ? Number(this.reporterId) : (currentUser?.id || undefined),
                  name: this.reporterName,
                  role: this.reporterRole || 'Reporter',
                  avatar: this.reporterAvatar,
              }
            : (currentUserName
                  ? {
                        id: currentUser?.id,
                        name: currentUserName,
                        role: currentUser?.roles?.[0]?.name_en || currentUser?.roles?.[0]?.name_kh || 'Reporter',
                        avatar: currentUser?.avatar?.uri || null,
                    }
                  : null);

        return {
            title,
            code: this.taskCode,
            task_type: this.selectedTaskType,
            status: this.selectedStatus(),
            priority: this.priority(),
            due_date: this.formatIsoDate(this.endDate),
            start_date: this.formatIsoDate(this.startDate),
            reporter: effectiveReporter,
            reporterName: effectiveReporter?.name || null,
            assignee: primaryAssignee,
            assignees: this.selectedAssignees,
            assigneeNames: this.selectedAssignees.map((m) => m.name).join(', '),
            project_id: this.selectedProjectId,
            project_name: selectedProj?.name || 'BMS Digitech',
            description: this.description.trim() || title,
            attachments: this.attachedFiles(),
            attachments_count: this.attachedFiles().length,
        };
    }

    submitAndAddAnother(): void {
        const title = this.taskTitle.trim();
        if (!title || this.isSubmitting() || this.isClosing()) return;

        this.isSubmitting.set(true);
        const payload = this.buildPayload();

        this._userTaskService.createTask(payload).subscribe({
            next: () => {
                this.isSubmitting.set(false);
                this.hasCreatedAnyTask = true;
                if (this.data?.onTaskCreated) {
                    this.data.onTaskCreated();
                }
                const savedTitle = title;
                this.successNotice.set(`បានបង្កើត «${savedTitle}» ដោយជោគជ័យ!`);
                this.incrementTaskCode();
                this.taskTitle = '';
                this.description = '';
                this.attachedFiles.set([]);
                setTimeout(() => {
                    this.taskTitleInput?.nativeElement?.focus();
                }, 100);
            },
            error: (err) => {
                console.error('Failed to create task', err);
                this.isSubmitting.set(false);
            },
        });
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

    submitAndClose(): void {
        const title = this.taskTitle.trim();
        if (!title || this.isSubmitting() || this.isClosing()) return;

        this.isSubmitting.set(true);
        const payload = this.buildPayload();

        this._userTaskService.createTask(payload).subscribe({
            next: () => {
                this.isSubmitting.set(false);
                if (this.data?.onTaskCreated) {
                    this.data.onTaskCreated();
                }
                this.performSmoothClose({
                    alreadyCreated: true,
                    ...payload,
                });
            },
            error: (err) => {
                console.error('Failed to create task', err);
                this.isSubmitting.set(false);
                this.performSmoothClose(payload);
            },
        });
    }

    cancel(): void {
        this.performSmoothClose(this.hasCreatedAnyTask ? { alreadyCreated: true } : null);
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
        const processed: TaskAttachment[] = [];
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
                const item: TaskAttachment = {
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

    isImageAttachment(att?: TaskAttachment | null): boolean {
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
