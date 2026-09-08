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
import { TASK_TYPES_LIST, TaskTypeOption } from 'app/resources/2-user/2-task/models/task.types';
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
        <div class="w-full h-full flex flex-col bg-white dark:bg-slate-900 font-kantumruy text-[15px] font-normal relative overflow-hidden">
            
            <!-- Clean Header (Human-Designed SaaS Layout) -->
            <div mat-dialog-title
                class="w-full flex items-center justify-between min-h-14 max-h-14 h-14 border-b border-slate-200 dark:border-slate-800 m-0 !py-0 px-5 font-kantumruy bg-white dark:bg-slate-900 relative shrink-0">
                <h2 class="text-[17px] font-semibold text-slate-900 dark:text-white leading-tight">
                    បង្កើតការងារថ្មី
                </h2>

                <!-- Close Button -->
                <button
                    type="button"
                    (click)="cancel()"
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    matTooltip="បិទ"
                >
                    <mat-icon svgIcon="mdi:close" class="icon-size-4.5"></mat-icon>
                </button>
            </div>

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
                        <div class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                            <div class="flex items-center justify-between">
                                <span class="text-[13px] font-medium text-slate-700 dark:text-slate-300 block">
                                    អ្នករាយការណ៍
                                </span>
                                <button
                                    *ngIf="reporterName"
                                    type="button"
                                    (click)="clearReporter()"
                                    class="text-[12px] text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                                >
                                    សម្អាត
                                </button>
                            </div>

                            <!-- Selected Reporter Card -->
                            <div *ngIf="reporterName" class="flex items-center gap-2.5 bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                                <div class="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-medium text-[13px] shrink-0 overflow-hidden">
                                    <img *ngIf="reporterAvatar" [src]="reporterAvatar" alt="Avatar" class="w-full h-full object-cover" />
                                    <span *ngIf="!reporterAvatar">{{ reporterName.slice(0, 1) }}</span>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <p class="text-[14px] font-medium text-slate-800 dark:text-white truncate leading-tight">
                                        {{ reporterName }}
                                    </p>
                                    <p class="text-[11px] text-slate-400 truncate mt-0.5">
                                        {{ reporterRole || 'អ្នករាយការណ៍' }}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    [matMenuTriggerFor]="reporterMenu"
                                    class="text-[12px] text-blue-600 dark:text-blue-400 hover:underline px-1.5 py-1 rounded cursor-pointer"
                                >
                                    ប្តូរ
                                </button>
                            </div>

                            <!-- Unselected Reporter Placeholder -->
                            <button
                                *ngIf="!reporterName"
                                type="button"
                                [matMenuTriggerFor]="reporterMenu"
                                class="w-full py-2.5 px-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-400 bg-white dark:bg-slate-800 text-left flex items-center justify-between text-slate-500 dark:text-slate-400 hover:text-blue-600 transition-all cursor-pointer"
                            >
                                <span class="text-[13px] font-medium">+ ជ្រើសរើសអ្នករាយការណ៍</span>
                                <mat-icon svgIcon="heroicons_outline:chevron-down" class="!w-4 !h-4 text-slate-400"></mat-icon>
                            </button>
                        </div>

                        <!-- Assignee / Responsible (អ្នកទទួលខុសត្រូវ) -->
                        <div class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-1.5">
                                    <span class="text-[13px] font-medium text-slate-700 dark:text-slate-300 block">
                                        អ្នកទទួលខុសត្រូវ
                                    </span>
                                    <span *ngIf="selectedAssignees.length > 0" class="text-[11px] font-semibold px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                                        {{ selectedAssignees.length }}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    [matMenuTriggerFor]="assigneeMenu"
                                    class="px-2 py-0.5 text-[12px] font-medium font-kantumruy text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg transition-colors cursor-pointer"
                                >
                                    + បន្ថែម
                                </button>
                            </div>

                            <!-- Selected Assignee List -->
                            <div *ngIf="selectedAssignees.length > 0" class="space-y-1.5 max-h-36 overflow-y-auto pr-0.5">
                                <div *ngFor="let m of selectedAssignees"
                                    class="flex items-center gap-2.5 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                                    <div class="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-medium text-[12px] shrink-0 overflow-hidden">
                                        <img *ngIf="m.avatar" [src]="m.avatar" alt="Avatar" class="w-full h-full object-cover" />
                                        <span *ngIf="!m.avatar">{{ m.name.slice(0, 1) }}</span>
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
                    <mat-menu #assigneeMenu="matMenu" class="!rounded-xl !p-1.5 font-kantumruy !min-w-[240px]">
                        <div class="px-3 py-1.5 text-[12px] font-medium text-slate-400 border-b border-slate-100 dark:border-slate-800 mb-1">
                            ជ្រើសរើសអ្នកទទួលខុសត្រូវ
                        </div>
                        <div *ngFor="let m of teamMembers"
                            (click)="toggleAssignee(m.id); $event.stopPropagation()"
                            class="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer rounded-lg transition-colors font-kantumruy select-none">
                            <mat-icon [svgIcon]="isAssigneeSelected(m.id) ? 'mdi:checkbox-marked' : 'mdi:checkbox-blank-outline'"
                                class="icon-size-4.5 shrink-0"
                                [ngClass]="isAssigneeSelected(m.id) ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'"></mat-icon>
                            <div class="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[11px] font-medium shrink-0 overflow-hidden">
                                <img *ngIf="m.avatar" [src]="m.avatar" alt="Avatar" class="w-full h-full object-cover" />
                                <span *ngIf="!m.avatar">{{ m.name.slice(0, 1) }}</span>
                            </div>
                            <div class="min-w-0 flex-1">
                                <p class="text-[13px] font-medium text-slate-800 dark:text-white truncate">{{ m.name }}</p>
                                <p class="text-[11px] text-slate-400 truncate">{{ m.role }}</p>
                            </div>
                        </div>
                    </mat-menu>

                    <!-- Menu for Reporter -->
                    <mat-menu #reporterMenu="matMenu" class="!rounded-xl !p-1.5 font-kantumruy !min-w-[240px]">
                        <div class="px-3 py-1.5 text-[12px] font-medium text-slate-400 border-b border-slate-100 dark:border-slate-800 mb-1">
                            ជ្រើសរើសអ្នករាយការណ៍
                        </div>
                        <div *ngFor="let m of teamMembers"
                            (click)="selectReporter(m)"
                            class="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer rounded-lg transition-colors font-kantumruy select-none">
                            <div class="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-medium shrink-0 overflow-hidden">
                                <img *ngIf="m.avatar" [src]="m.avatar" alt="Avatar" class="w-full h-full object-cover" />
                                <span *ngIf="!m.avatar">{{ m.name.slice(0, 1) }}</span>
                            </div>
                            <div class="min-w-0 flex-1">
                                <p class="text-[13px] font-medium text-slate-800 dark:text-white truncate">{{ m.name }}</p>
                                <p class="text-[11px] text-slate-400 truncate">{{ m.role }}</p>
                            </div>
                            <mat-icon *ngIf="reporterName === m.name" svgIcon="mdi:check" class="icon-size-4 text-blue-600"></mat-icon>
                        </div>
                        <div *ngIf="reporterName"
                            (click)="clearReporter()"
                            class="flex items-center gap-2 px-3 py-2 mt-1 border-t border-slate-100 dark:border-slate-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer rounded-lg transition-colors font-kantumruy text-[13px]">
                            <mat-icon svgIcon="mdi:account-off-outline" class="icon-size-4 text-rose-500"></mat-icon>
                            <span>សម្អាត (មិនកំណត់)</span>
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
                                    <div class="w-6 h-6 rounded-md flex items-center justify-center text-white shrink-0" [ngClass]="getTaskTypeOption(selectedTaskType).badgeBg">
                                        <mat-icon [svgIcon]="getTaskTypeOption(selectedTaskType).icon" class="!w-3.5 !h-3.5 text-white"></mat-icon>
                                    </div>
                                    <span class="font-medium truncate">{{ getTaskTypeOption(selectedTaskType).label }}</span>
                                </div>
                                <mat-icon svgIcon="heroicons_outline:chevron-down" class="!w-4 !h-4 text-slate-400 shrink-0 ml-1.5"></mat-icon>
                            </button>

                            <mat-menu #taskTypeMenu="matMenu" class="custom-saas-menu !rounded-2xl !p-1.5 shadow-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                                <button
                                    mat-menu-item
                                    *ngFor="let item of taskTypesList"
                                    (click)="selectedTaskType = item.id"
                                    class="!flex items-center justify-between !h-10 !px-3 !rounded-xl transition-colors"
                                    [ngClass]="selectedTaskType === item.id ? '!bg-blue-50 dark:!bg-blue-950/40 font-semibold text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'"
                                >
                                    <div class="flex items-center gap-2.5">
                                        <div class="w-6 h-6 rounded-md flex items-center justify-center text-white shrink-0" [ngClass]="item.badgeBg">
                                            <mat-icon [svgIcon]="item.icon" class="!w-3.5 !h-3.5 text-white"></mat-icon>
                                        </div>
                                        <span class="text-[14px] font-kantumruy">{{ item.label }}</span>
                                    </div>
                                    <mat-icon *ngIf="selectedTaskType === item.id" svgIcon="heroicons_solid:check" class="!w-4 !h-4 text-blue-600 dark:text-blue-400 ml-auto"></mat-icon>
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

    projectList = [
        { id: 'bms-digitech', name: 'BMS Digitech', code: 'BMS' },
        { id: 'wms-digitech', name: 'WMS Digitech', code: 'WMS' },
    ];
    selectedProjectId: string = 'bms-digitech';

    // State for continuous creation and notifications
    isSubmitting = signal<boolean>(false);
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
    selectedTaskType: string = 'bug';

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
        this.reporterName = m.name;
        this.reporterRole = m.role || '';
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
        this.taskCode = this.generateNextCode(this.selectedProjectId);
        // Note: reporter and assignees deliberately start empty (no defaults) per user requirement
    }

    ngOnInit(): void { }

    private buildPayload(): any {
        const title = this.taskTitle.trim();
        const selectedProj = this.projectList.find((p) => p.id === this.selectedProjectId);
        const primaryAssignee = this.selectedAssignees.length > 0 ? this.selectedAssignees[0] : null;

        return {
            title,
            code: this.taskCode,
            task_type: this.selectedTaskType,
            status: this.selectedStatus(),
            priority: this.priority(),
            due_date: this.formatIsoDate(this.endDate),
            start_date: this.formatIsoDate(this.startDate),
            reporter: this.reporterName
                ? {
                      id: this.reporterId ? Number(this.reporterId) : undefined,
                      name: this.reporterName,
                      role: this.reporterRole,
                      avatar: this.reporterAvatar,
                  }
                : null,
            reporterName: this.reporterName || null,
            assignee: primaryAssignee,
            assignees: this.selectedAssignees,
            assigneeNames: this.selectedAssignees.map((m) => m.name).join(', '),
            project_id: this.selectedProjectId,
            project_name: selectedProj?.name || 'BMS Digitech',
            description: this.description.trim() || title,
        };
    }

    submitAndAddAnother(): void {
        const title = this.taskTitle.trim();
        if (!title || this.isSubmitting()) return;

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

    submitAndClose(): void {
        const title = this.taskTitle.trim();
        if (!title || this.isSubmitting()) return;

        this.isSubmitting.set(true);
        const payload = this.buildPayload();

        this._userTaskService.createTask(payload).subscribe({
            next: () => {
                this.isSubmitting.set(false);
                if (this.data?.onTaskCreated) {
                    this.data.onTaskCreated();
                }
                this.dialogRef.close({
                    alreadyCreated: true,
                    ...payload,
                });
            },
            error: (err) => {
                console.error('Failed to create task', err);
                this.isSubmitting.set(false);
                this.dialogRef.close(payload);
            },
        });
    }

    cancel(): void {
        this.dialogRef.close(this.hasCreatedAnyTask ? { alreadyCreated: true } : null);
    }
}
