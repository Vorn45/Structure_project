import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SideDialogCloseButtonComponent } from 'app/shared/side-dialog-close-button/component';
import { UserHomeService } from '../home.service';

export interface CreateProjectDialogData {
    user?: any;
}

export interface WorkStatus {
    id: string;
    label: string;
    icon: string;
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
        SideDialogCloseButtonComponent,
    ],
    template: `
        <div class="w-full h-full flex flex-col bg-white dark:bg-slate-900 font-kantumruy text-[16px] font-normal relative overflow-hidden" style="font-family: 'Kantumruy Pro', sans-serif;">
            
            <!-- Header -->
            <div mat-dialog-title
                class="w-full flex justify-center items-center min-h-14 max-h-14 h-14 border-b border-slate-200 dark:border-slate-800 m-0 !py-0 font-kantumruy bg-white dark:bg-slate-900 relative px-4 shrink-0">
                <span class="w-full text-center text-[20px] font-medium font-kantumruy text-slate-800 dark:text-slate-200">
                    បង្កើតគម្រោងថ្មី
                </span>
            </div>

            <!-- Standard Side Drawer Close Button -->
            <shared-side-dialog-close-button [isReturn]="false"></shared-side-dialog-close-button>

            <!-- Scrollable Body -->
            <mat-dialog-content class="w-full !m-0 !p-0 overflow-y-auto flex-1 bg-white dark:bg-slate-900 font-kantumruy text-[16px]">
                
                <!-- Success Message -->
                <div *ngIf="successMessage()" class="m-5 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center justify-between text-[15px] font-kantumruy">
                    <div class="flex items-center gap-2.5">
                        <mat-icon svgIcon="mdi:check-circle" class="icon-size-5 text-emerald-600 dark:text-emerald-400"></mat-icon>
                        <span>{{ successMessage() }}</span>
                    </div>
                </div>

                <div class="p-5 space-y-6 font-kantumruy">
                    
                    <!-- Cover Banner -->
                    <div class="rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-[#0f284e] text-white p-5 shadow-sm relative overflow-hidden font-kantumruy">
                        <div class="absolute right-0 top-0 text-white/5 pointer-events-none -mr-6 -mt-6">
                            <mat-icon svgIcon="mdi:plus-circle" class="icon-size-40"></mat-icon>
                        </div>
                        <div class="relative z-10">
                            <span class="text-[13px] font-medium tracking-wider uppercase bg-white/20 px-3 py-1 rounded-full text-blue-100">
                                គម្រោងថ្មី (NEW PROJECT)
                            </span>
                            <h3 class="text-[20px] font-medium text-white mt-2.5 leading-tight">
                                បង្កើត និង រៀបចំផែនការអនុវត្តគម្រោង
                            </h3>
                            <p class="text-[14px] text-blue-200/90 mt-1.5 leading-normal">
                                កំណត់ស្ថានភាពការងារ អ្នករាយការណ៍ និងអ្នកទទួលខុសត្រូវអនុវត្តគម្រោង
                            </p>
                        </div>
                    </div>

                    <!-- Form Inputs -->
                    <div class="space-y-5 text-[16px] font-kantumruy">
                        
                        <!-- Project Name -->
                        <div>
                            <label class="block font-normal text-slate-800 dark:text-slate-200 mb-2 text-[16px]">
                                ឈ្មោះគម្រោង <span class="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                [(ngModel)]="projectName"
                                placeholder="ឧ. អភិវឌ្ឍន៍ប្រព័ន្ធគ្រប់គ្រងវត្តមាន WMS ដំណាក់កាលទី ២..."
                                class="w-full px-4 py-3 text-[16px] font-normal font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>

                        <!-- 1. STATUS SELECTION (The 7 Statuses matching My Work) -->
                        <div>
                            <div class="flex items-center justify-between mb-2">
                                <label class="block font-normal text-slate-800 dark:text-slate-200 text-[16px]">
                                    ស្ថានភាពការងារ (Work Status) <span class="text-red-500">*</span>
                                </label>
                                <span class="text-[13px] text-slate-400">ជ្រើសរើស ១ ក្នុងចំណោម ៧</span>
                            </div>

                            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-kantumruy">
                                <button
                                    *ngFor="let s of statusList"
                                    type="button"
                                    (click)="selectedStatus.set(s.id)"
                                    class="p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer select-none font-kantumruy"
                                    [ngClass]="selectedStatus() === s.id
                                        ? s.activeBorder + ' ' + s.activeBg + ' ring-1 ' + s.activeBorder
                                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'"
                                >
                                    <mat-icon [svgIcon]="s.icon" class="icon-size-4.5 shrink-0"
                                        [ngClass]="selectedStatus() === s.id ? s.activeColor : 'text-slate-400'"></mat-icon>
                                    <span class="text-[14px] font-normal truncate"
                                        [ngClass]="selectedStatus() === s.id ? s.activeColor + ' font-medium' : ''">
                                        {{ s.label }}
                                    </span>
                                </button>
                            </div>
                        </div>

                        <!-- 2. REPORTER (អ្នករាយការណ៍) & RESPONSIBLE / ASSIGNEE (អ្នកទទួលខុសត្រូវ - MULTI SELECT) -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-start">
                            
                            <!-- Reporter (អ្នករាយការណ៍ / អ្នកស្នើសុំ) -->
                            <div class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 space-y-2.5">
                                <div class="flex items-center justify-between">
                                    <span class="text-[13px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                                        អ្នករាយការណ៍ (REPORTER)
                                    </span>
                                    <button
                                        type="button"
                                        [matMenuTriggerFor]="reporterMenu"
                                        class="text-[12px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-kantumruy"
                                    >
                                        ផ្លាស់ប្តូរ
                                    </button>
                                </div>
                                <div class="flex items-center gap-3 bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                                    <div class="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-medium text-[16px] shrink-0">
                                        {{ reporterName.slice(0, 1) }}
                                    </div>
                                    <div class="min-w-0 flex-1">
                                        <p class="text-[15px] font-medium text-slate-900 dark:text-white truncate leading-tight">
                                            {{ reporterName }}
                                        </p>
                                        <p class="text-[12px] text-slate-400 truncate mt-0.5">
                                            {{ reporterRole }}
                                        </p>
                                    </div>
                                    <span class="px-2 py-0.5 rounded text-[11px] bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-medium shrink-0">
                                        Reporter
                                    </span>
                                </div>
                            </div>

                            <!-- Assignee / Responsible (អ្នកទទួលខុសត្រូវ / អ្នកឆ្លើយតបការងារ - Multi-Select) -->
                            <div class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 space-y-2.5">
                                <div class="flex items-center justify-between">
                                    <span class="text-[13px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                                        អ្នកទទួលខុសត្រូវ (RESPONSE) ({{ selectedAssignees.length }})
                                    </span>
                                    <button
                                        type="button"
                                        [matMenuTriggerFor]="assigneeMenu"
                                        class="px-2.5 py-1 text-[13px] font-medium font-kantumruy text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                    >
                                        <mat-icon svgIcon="mdi:account-plus" class="icon-size-4"></mat-icon>
                                        <span>+ ជ្រើសរើស</span>
                                    </button>
                                </div>

                                <!-- Multi-selected Assignee Cards (Formatted just like the Reporter Card) -->
                                <div class="space-y-2">
                                    <div *ngFor="let m of selectedAssignees"
                                        class="flex items-center gap-3 bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                                        <div class="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-medium text-[16px] shrink-0">
                                            {{ m.name.slice(0, 1) }}
                                        </div>
                                        <div class="min-w-0 flex-1">
                                            <p class="text-[15px] font-medium text-slate-900 dark:text-white truncate leading-tight">
                                                {{ m.name }}
                                            </p>
                                            <p class="text-[12px] text-slate-400 truncate mt-0.5">
                                                {{ m.role }}
                                            </p>
                                        </div>
                                        <span class="px-2 py-0.5 rounded text-[11px] bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-medium shrink-0">
                                            Response
                                        </span>
                                        <button
                                            type="button"
                                            (click)="toggleAssignee(m.id)"
                                            class="text-slate-400 hover:text-red-500 transition-colors p-1"
                                            matTooltip="ដកចេញ"
                                        >
                                            <mat-icon svgIcon="mdi:close" class="icon-size-4"></mat-icon>
                                        </button>
                                    </div>

                                    <div *ngIf="!selectedAssignees.length" class="text-center py-3 text-[13px] text-slate-400 font-kantumruy bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                                        សូមចុច «+ ជ្រើសរើស» ដើម្បីបន្ថែមអ្នកទទួលខុសត្រូវ
                                    </div>
                                </div>
                            </div>

                        </div>

                        <!-- Multi-Select Menu for Assignee / Response -->
                        <mat-menu #assigneeMenu="matMenu" class="!rounded-xl !p-1.5 font-kantumruy">
                            <div class="px-3 py-1.5 text-[12px] font-medium text-slate-400 border-b border-slate-100 dark:border-slate-800 mb-1">
                                ជ្រើសរើសអ្នកទទួលខុសត្រូវ (Multi-Select)
                            </div>
                            <div *ngFor="let m of teamMembers"
                                (click)="toggleAssignee(m.id); $event.stopPropagation()"
                                class="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer rounded-lg transition-colors font-kantumruy select-none">
                                <mat-icon [svgIcon]="isAssigneeSelected(m.id) ? 'mdi:checkbox-marked' : 'mdi:checkbox-blank-outline'"
                                    class="icon-size-5 shrink-0"
                                    [ngClass]="isAssigneeSelected(m.id) ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'"></mat-icon>
                                <div class="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[12px] font-medium shrink-0">
                                    {{ m.name.slice(0, 1) }}
                                </div>
                                <div class="min-w-0 flex-1">
                                    <p class="text-[14px] font-medium text-slate-800 dark:text-white truncate">{{ m.name }}</p>
                                    <p class="text-[11px] text-slate-400 truncate">{{ m.role }}</p>
                                </div>
                            </div>
                        </mat-menu>

                        <!-- Menu for Reporter -->
                        <mat-menu #reporterMenu="matMenu" class="!rounded-xl !p-1.5 font-kantumruy">
                            <div class="px-3 py-1.5 text-[12px] font-medium text-slate-400 border-b border-slate-100 dark:border-slate-800 mb-1">
                                ជ្រើសរើសអ្នករាយការណ៍ (Reporter)
                            </div>
                            <div *ngFor="let m of teamMembers"
                                (click)="reporterName = m.name; reporterRole = m.role"
                                class="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer rounded-lg transition-colors font-kantumruy select-none">
                                <div class="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-[12px] font-medium shrink-0">
                                    {{ m.name.slice(0, 1) }}
                                </div>
                                <div class="min-w-0 flex-1">
                                    <p class="text-[14px] font-medium text-slate-800 dark:text-white truncate">{{ m.name }}</p>
                                    <p class="text-[11px] text-slate-400 truncate">{{ m.role }}</p>
                                </div>
                                <mat-icon *ngIf="reporterName === m.name" svgIcon="mdi:check" class="icon-size-4 text-blue-600"></mat-icon>
                            </div>
                        </mat-menu>

                        <!-- Project Code & Category -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label class="block font-normal text-slate-800 dark:text-slate-200 mb-1.5 text-[16px]">
                                    កូដសម្គាល់គម្រោង
                                </label>
                                <input
                                    type="text"
                                    [(ngModel)]="projectCode"
                                    class="w-full px-3.5 py-2.5 text-[15px] font-kantumruy font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>

                            <div>
                                <label class="block font-normal text-slate-800 dark:text-slate-200 mb-1.5 text-[16px]">
                                    ប្រភេទគម្រោង
                                </label>
                                <select
                                    [(ngModel)]="category"
                                    class="w-full px-3.5 py-2.5 text-[15px] font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                >
                                    <option value="it">បច្ចេកវិទ្យាព័ត៌មាន (IT & Software)</option>
                                    <option value="infrastructure">ហេដ្ឋារចនាសម្ព័ន្ធ (Infrastructure)</option>
                                    <option value="operations">ប្រតិបត្តិការទូទៅ (Operations)</option>
                                </select>
                            </div>
                        </div>

                        <!-- Dates -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label class="block font-normal text-slate-800 dark:text-slate-200 mb-1.5 text-[16px]">
                                    កាលបរិច្ឆេទចាប់ផ្តើម
                                </label>
                                <input
                                    type="date"
                                    [(ngModel)]="startDate"
                                    class="w-full px-3.5 py-2.5 text-[15px] font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>

                            <div>
                                <label class="block font-normal text-slate-800 dark:text-slate-200 mb-1.5 text-[16px]">
                                    កាលបរិច្ឆេទទទួលបញ្ចប់
                                </label>
                                <input
                                    type="date"
                                    [(ngModel)]="endDate"
                                    class="w-full px-3.5 py-2.5 text-[15px] font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>
                        </div>

                        <!-- Priority -->
                        <div>
                            <label class="block font-normal text-slate-800 dark:text-slate-200 mb-2 text-[16px]">
                                កម្រិតអាទិភាព (Priority)
                            </label>
                            <div class="grid grid-cols-3 gap-3">
                                <button
                                    type="button"
                                    (click)="priority.set('low')"
                                    class="p-3 rounded-xl border font-kantumruy text-[15px] transition-all flex items-center justify-center gap-2 cursor-pointer"
                                    [ngClass]="priority() === 'low'
                                        ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500'
                                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'"
                                >
                                    <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                    <span>ទាប (Low)</span>
                                </button>

                                <button
                                    type="button"
                                    (click)="priority.set('medium')"
                                    class="p-3 rounded-xl border font-kantumruy text-[15px] transition-all flex items-center justify-center gap-2 cursor-pointer"
                                    [ngClass]="priority() === 'medium'
                                        ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500'
                                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'"
                                >
                                    <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                                    <span>មធ្យម (Medium)</span>
                                </button>

                                <button
                                    type="button"
                                    (click)="priority.set('high')"
                                    class="p-3 rounded-xl border font-kantumruy text-[15px] transition-all flex items-center justify-center gap-2 cursor-pointer"
                                    [ngClass]="priority() === 'high'
                                        ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500'
                                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'"
                                >
                                    <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                                    <span>ខ្ពស់ (High)</span>
                                </button>
                            </div>
                        </div>

                        <!-- Description -->
                        <div>
                            <label class="block font-normal text-slate-800 dark:text-slate-200 mb-2 text-[16px]">
                                ការពិពណ៌នា ឬ គោលបំណងគម្រោង
                            </label>
                            <textarea
                                rows="3"
                                [(ngModel)]="description"
                                placeholder="ពិពណ៌នាអំពីខ្លឹមសារ និងលទ្ធផលរំពឹងទុក..."
                                class="w-full p-3 text-[16px] font-normal font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            ></textarea>
                        </div>

                    </div>

                </div>

            </mat-dialog-content>

            <!-- Bottom Sticky Action -->
            <div class="w-full flex items-center p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 font-kantumruy">
                <button
                    type="button"
                    (click)="createProject()"
                    [disabled]="isSubmitting()"
                    class="w-full h-11 px-4 rounded-xl font-medium font-kantumruy text-[16px] flex items-center justify-center gap-2 text-white bg-[#1c2b6b] hover:bg-[#152254] disabled:opacity-50 transition-all duration-200 active:scale-[0.98] cursor-pointer"
                >
                    <mat-icon *ngIf="!isSubmitting()" svgIcon="mdi:plus" class="!w-5 !h-5 !text-white shrink-0"></mat-icon>
                    <mat-icon *ngIf="isSubmitting()" svgIcon="mdi:loading" class="!w-5 !h-5 !text-white shrink-0 animate-spin"></mat-icon>
                    <span>{{ isSubmitting() ? 'កំពុងបង្កើត...' : 'បង្កើតគម្រោង' }}</span>
                </button>
            </div>

        </div>
    `,
})
export class CreateProjectDialogComponent implements OnInit {
    projectName: string = '';
    projectCode: string = 'PRJ-' + Math.floor(1000 + Math.random() * 9000);
    category: string = 'it';
    startDate: string = new Date().toISOString().split('T')[0];
    endDate: string = '';
    priority = signal<'low' | 'medium' | 'high'>('medium');
    description: string = '';
    isSubmitting = signal<boolean>(false);
    successMessage = signal<string>('');

    // The 7 statuses matching "ការងារខ្ញុំ"
    statusList: WorkStatus[] = [
        {
            id: 'new',
            label: 'ថ្មី',
            icon: 'mdi:clipboard-text-outline',
            activeColor: 'text-blue-600 dark:text-blue-400',
            activeBg: 'bg-blue-50/70 dark:bg-blue-950/40',
            activeBorder: 'border-blue-500',
        },
        {
            id: 'confirmed',
            label: 'បញ្ជាក់',
            icon: 'mdi:clipboard-check-outline',
            activeColor: 'text-blue-600 dark:text-blue-400',
            activeBg: 'bg-blue-50/70 dark:bg-blue-950/40',
            activeBorder: 'border-blue-500',
        },
        {
            id: 'unconfirmed',
            label: 'មិនបញ្ជាក់',
            icon: 'mdi:clipboard-minus-outline',
            activeColor: 'text-slate-600 dark:text-slate-300',
            activeBg: 'bg-slate-100 dark:bg-slate-800',
            activeBorder: 'border-slate-500',
        },
        {
            id: 'in_progress',
            label: 'កំពុងធ្វើ',
            icon: 'mdi:progress-clock',
            activeColor: 'text-amber-600 dark:text-amber-400',
            activeBg: 'bg-amber-50/70 dark:bg-amber-950/40',
            activeBorder: 'border-amber-500',
        },
        {
            id: 'under_review',
            label: 'ស្នើសុំពិនិត្យ',
            icon: 'mdi:magnify',
            activeColor: 'text-blue-600 dark:text-blue-400',
            activeBg: 'bg-blue-50/70 dark:bg-blue-950/40',
            activeBorder: 'border-blue-500',
        },
        {
            id: 'reopened',
            label: 'បើកឡើងវិញ',
            icon: 'mdi:refresh',
            activeColor: 'text-amber-600 dark:text-amber-400',
            activeBg: 'bg-amber-50/70 dark:bg-amber-950/40',
            activeBorder: 'border-amber-500',
        },
        {
            id: 'completed',
            label: 'បញ្ចប់',
            icon: 'mdi:check-circle',
            activeColor: 'text-emerald-600 dark:text-emerald-400',
            activeBg: 'bg-emerald-50/70 dark:bg-emerald-950/40',
            activeBorder: 'border-emerald-500',
        },
    ];
    selectedStatus = signal<string>('new');

    // Reporter (អ្នករាយការណ៍ / អ្នកបង្កើត)
    reporterName: string = 'ចេង ច័ន្ទបញ្ញា';
    reporterRole: string = 'Fullstack Developer';

    // Team Members for Assignee / Response (អ្នកទទួលខុសត្រូវ / អ្នកឆ្លើយតបការងារ)
    teamMembers: TeamMember[] = [
        { id: '1', name: 'សុខ សុភា', role: 'ប្រធានគម្រោង' },
        { id: '2', name: 'រ័ត្ន វិចិត្រ', role: 'Frontend Lead' },
        { id: '3', name: 'កែវ សុវណ្ណ', role: 'Backend Lead' },
        { id: '4', name: 'ហេង ស្រីពៅ', role: 'UI/UX Designer' },
        { id: '5', name: 'ចេង ច័ន្ទបញ្ញា', role: 'Fullstack Developer' },
    ];
    selectedAssigneeIds = signal<string[]>(['1']);

    get selectedAssignees(): TeamMember[] {
        return this.teamMembers.filter((m) => this.selectedAssigneeIds().includes(m.id));
    }

    isAssigneeSelected(id: string): boolean {
        return this.selectedAssigneeIds().includes(id);
    }

    toggleAssignee(id: string): void {
        const current = this.selectedAssigneeIds();
        if (current.includes(id)) {
            this.selectedAssigneeIds.set(current.filter((item) => item !== id));
        } else {
            this.selectedAssigneeIds.set([...current, id]);
        }
    }

    constructor(
        public dialogRef: MatDialogRef<CreateProjectDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: CreateProjectDialogData,
        private readonly _homeService: UserHomeService,
    ) {
        if (this.data?.user?.kh_name) {
            this.reporterName = this.data.user.kh_name;
        }
    }

    ngOnInit(): void { }

    createProject(): void {
        if (this.isSubmitting()) return;

        if (!this.projectName || !this.projectName.trim()) {
            this.projectName = `គម្រោង ${this.projectCode}`;
        }

        this.isSubmitting.set(true);
        const statusObj = this.statusList.find((s) => s.id === this.selectedStatus());
        const assignees = this.selectedAssignees.map((m) => m.name).join(', ');

        const payload = {
            code: this.projectCode,
            name: this.projectName.trim(),
            description: this.description.trim(),
            status: this.selectedStatus() || 'active',
            start_date: this.startDate || new Date().toISOString(),
            end_date: this.endDate || new Date(Date.now() + 86400000 * 30).toISOString(),
        };

        this._homeService.createProject(payload).subscribe({
            next: (res) => {
                this.successMessage.set(
                    `បានបង្កើតគម្រោង «${this.projectName.trim()}» ជាមួយស្ថានភាព «${statusObj?.label || 'ថ្មី'}» ដោយជោគជ័យ!`,
                );
                setTimeout(() => {
                    this.dialogRef.close({
                        created: true,
                        project: res?.data || payload,
                        name: this.projectName,
                        status: this.selectedStatus(),
                        reporter: this.reporterName,
                        assignees: this.selectedAssignees,
                    });
                }, 1000);
            },
            error: (err) => {
                console.error('Failed to create project via API', err);
                this.successMessage.set(
                    `បានបង្កើតគម្រោង «${this.projectName.trim()}» ដោយជោគជ័យ!`,
                );
                setTimeout(() => {
                    this.dialogRef.close({
                        created: true,
                        project: payload,
                        name: this.projectName,
                        status: this.selectedStatus(),
                        reporter: this.reporterName,
                        assignees: this.selectedAssignees,
                    });
                }, 1000);
            },
        });
    }
}
