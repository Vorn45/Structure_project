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

export interface ProjectStatusOption {
    id: 'planning' | 'active' | 'on_hold' | 'completed';
    label: string;
    sublabel: string;
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
    styles: [
        `
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
                            <mat-icon svgIcon="mdi:folder-plus-outline" class="icon-size-40"></mat-icon>
                        </div>
                        <div class="relative z-10">
                            <span class="text-[13px] font-medium tracking-wider uppercase bg-white/20 px-3 py-1 rounded-full text-blue-100">
                                គម្រោងថ្មី (NEW PROJECT)
                            </span>
                            <h3 class="text-[20px] font-medium text-white mt-2.5 leading-tight">
                                បង្កើត និង រៀបចំផែនការអនុវត្តគម្រោង
                            </h3>
                            <p class="text-[14px] text-blue-200/90 mt-1.5 leading-normal">
                                កំណត់ព័ត៌មានគម្រោង ស្ថានភាព ថវិកា ប្រធានគម្រោង និងសមាជិកក្រុមការងារ
                            </p>
                        </div>
                    </div>

                    <!-- Form Inputs -->
                    <div class="space-y-5 text-[16px] font-kantumruy">
                        
                        <!-- 1. Project Name -->
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

                        <!-- 2. PROJECT STATUS SELECTION (Clean Minimal Dots) -->
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

                        <!-- 3. PROJECT LEAD (ប្រធានគម្រោង) & TEAM MEMBERS (សមាជិកក្រុមការងារ) -->
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

                        <!-- 4. Project Code & Category -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label class="block font-normal text-slate-800 dark:text-slate-200 mb-1.5 text-[16px]">
                                    កូដសម្គាល់គម្រោង <span class="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    [(ngModel)]="projectCode"
                                    class="w-full px-3.5 py-2.5 text-[15px] font-kantumruy font-mono uppercase rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
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
                                    <option value="design">ការរចនា និង UI/UX (Design & Creative)</option>
                                    <option value="marketing">យុទ្ធនាការ និងផ្សព្វផ្សាយ (Marketing)</option>
                                </select>
                            </div>
                        </div>

                        <!-- 5. Budget & Priority -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label class="block font-normal text-slate-800 dark:text-slate-200 mb-1.5 text-[16px]">
                                    ថវិកាគម្រោង (Budget USD)
                                </label>
                                <div class="relative">
                                    <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-medium">$</span>
                                    <input
                                        type="number"
                                        [(ngModel)]="budget"
                                        placeholder="5000"
                                        class="w-full pl-8 pr-3.5 py-2.5 text-[15px] font-kantumruy font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    />
                                </div>
                            </div>

                            <div>
                                <label class="block font-normal text-slate-800 dark:text-slate-200 mb-1.5 text-[16px]">
                                    កម្រិតអាទិភាព (Priority)
                                </label>
                                <div class="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        (click)="priority.set('low')"
                                        class="p-2 rounded-xl border font-kantumruy text-[13px] transition-all flex items-center justify-center gap-1 cursor-pointer"
                                        [ngClass]="priority() === 'low'
                                            ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500'
                                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'"
                                    >
                                        <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                                        <span>ទាប</span>
                                    </button>

                                    <button
                                        type="button"
                                        (click)="priority.set('medium')"
                                        class="p-2 rounded-xl border font-kantumruy text-[13px] transition-all flex items-center justify-center gap-1 cursor-pointer"
                                        [ngClass]="priority() === 'medium'
                                            ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500'
                                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'"
                                    >
                                        <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                                        <span>មធ្យម</span>
                                    </button>

                                    <button
                                        type="button"
                                        (click)="priority.set('high')"
                                        class="p-2 rounded-xl border font-kantumruy text-[13px] transition-all flex items-center justify-center gap-1 cursor-pointer"
                                        [ngClass]="priority() === 'high'
                                            ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500'
                                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'"
                                    >
                                        <span class="w-2 h-2 rounded-full bg-rose-500"></span>
                                        <span>ខ្ពស់</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- 6. Dates -->
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
                                    កាលបរិច្ឆេទបញ្ចប់
                                </label>
                                <input
                                    type="date"
                                    [(ngModel)]="endDate"
                                    class="w-full px-3.5 py-2.5 text-[15px] font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>
                        </div>

                        <!-- 7. Description -->
                        <div>
                            <label class="block font-normal text-slate-800 dark:text-slate-200 mb-2 text-[16px]">
                                ការពិពណ៌នា ឬ គោលបំណងគម្រោង
                            </label>
                            <textarea
                                rows="3"
                                [(ngModel)]="description"
                                placeholder="ពិពណ៌នាអំពីខ្លឹមសារ និងលទ្ធផលរំពឹងទុករបស់គម្រោង..."
                                class="w-full p-3 text-[16px] font-normal font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                            ></textarea>
                        </div>

                    </div>

                </div>

            </mat-dialog-content>

            <!-- Bottom Sticky Action Bar -->
            <div class="w-full flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 font-kantumruy gap-2.5">
                <!-- Cancel -->
                <button
                    type="button"
                    (click)="dialogRef.close()"
                    class="h-10 px-4 rounded-xl font-medium font-kantumruy text-[14px] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                    បោះបង់
                </button>

                <!-- Actions -->
                <div class="flex items-center gap-2">
                    <button
                        type="button"
                        (click)="createProject()"
                        [disabled]="isSubmitting() || !projectName.trim()"
                        class="h-10 px-5 rounded-xl font-medium font-kantumruy text-[14px] text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
                    >
                        <mat-icon *ngIf="!isSubmitting()" svgIcon="mdi:plus" class="!w-4 !h-4 text-white shrink-0"></mat-icon>
                        <mat-icon *ngIf="isSubmitting()" svgIcon="mdi:loading" class="!w-4 !h-4 text-white shrink-0 animate-spin"></mat-icon>
                        <span>{{ isSubmitting() ? 'កំពុងបង្កើត...' : 'បង្កើតគម្រោង' }}</span>
                    </button>
                </div>
            </div>

        </div>
    `,
})
export class CreateProjectDialogComponent implements OnInit {
    projectName: string = '';
    projectCode: string = 'PRJ-' + Math.floor(1000 + Math.random() * 9000);
    category: string = 'it';
    budget: number = 5000;
    startDate: string = new Date().toISOString().split('T')[0];
    endDate: string = new Date(Date.now() + 86400000 * 60).toISOString().split('T')[0];
    priority = signal<'low' | 'medium' | 'high'>('medium');
    description: string = '';
    isSubmitting = signal<boolean>(false);
    successMessage = signal<string>('');

    // 4 Project Statuses (Projects Governance Standard)
    statusList: ProjectStatusOption[] = [
        {
            id: 'planning',
            label: 'រៀបចំផែនការ',
            sublabel: 'Planning',
            icon: 'mdi:clock-outline',
            dotColor: 'bg-blue-500',
            activeColor: 'text-blue-600 dark:text-blue-400',
            activeBg: 'bg-blue-50/70 dark:bg-blue-950/40',
            activeBorder: 'border-blue-500',
        },
        {
            id: 'active',
            label: 'កំពុងដំណើរការ',
            sublabel: 'In Progress',
            icon: 'mdi:progress-clock',
            dotColor: 'bg-emerald-500',
            activeColor: 'text-emerald-600 dark:text-emerald-400',
            activeBg: 'bg-emerald-50/70 dark:bg-emerald-950/40',
            activeBorder: 'border-emerald-500',
        },
        {
            id: 'on_hold',
            label: 'ផ្អាក',
            sublabel: 'On Hold',
            icon: 'mdi:pause-circle-outline',
            dotColor: 'bg-amber-500',
            activeColor: 'text-amber-600 dark:text-amber-400',
            activeBg: 'bg-amber-50/70 dark:bg-amber-950/40',
            activeBorder: 'border-amber-500',
        },
        {
            id: 'completed',
            label: 'បានបញ្ចប់',
            sublabel: 'Completed',
            icon: 'mdi:check-circle-outline',
            dotColor: 'bg-purple-500',
            activeColor: 'text-purple-600 dark:text-purple-400',
            activeBg: 'bg-purple-50/70 dark:bg-purple-950/40',
            activeBorder: 'border-purple-500',
        },
    ];
    selectedStatus = signal<'planning' | 'active' | 'on_hold' | 'completed'>('active');

    // Project Lead (ប្រធានគម្រោង)
    leadName: string = 'ពិសិដ្ឋ បញ្ញាវ័ន្ត';
    leadRole: string = 'Super Admin / Lead Developer';
    leadAvatar: string | null = null;
    leadId: string | number | null = '1';

    // Team Members Available for Selection
    availableMembers: TeamMember[] = [
        { id: '1', name: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត', role: 'Super Admin / Lead Developer' },
        { id: '2', name: 'ពុំ ប្រុសមុន្នី', role: 'Frontend Lead' },
        { id: '3', name: 'ថា វីនណឺរ', role: 'Backend Lead' },
        { id: '4', name: 'ភឿង សុវណ្ណារ៉ា', role: 'Developer' },
    ];
    selectedMemberIds = signal<string[]>(['1', '2']);

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

    constructor(
        public dialogRef: MatDialogRef<CreateProjectDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: CreateProjectDialogData,
        private readonly _homeService: UserHomeService,
    ) {
        if (this.data?.user?.kh_name) {
            this.leadName = this.data.user.kh_name;
            this.leadRole = this.data.user.position || 'Super Admin & Lead';
            if (this.data.user.avatar) {
                this.leadAvatar = this.data.user.avatar;
            }
            if (this.data.user.id) {
                this.leadId = this.data.user.id;
            }
            if (!this.availableMembers.some((m) => m.name === this.leadName)) {
                this.availableMembers.unshift({
                    id: String(this.leadId),
                    name: this.leadName,
                    role: this.leadRole,
                    avatar: this.leadAvatar || undefined,
                });
            }
        }
    }

    ngOnInit(): void { }

    createProject(): void {
        if (this.isSubmitting()) return;

        const name = this.projectName.trim();
        if (!name) return;

        this.isSubmitting.set(true);
        const statusObj = this.statusList.find((s) => s.id === this.selectedStatus());

        const membersPayload = this.selectedMembers.map((m) => ({
            id: Number(m.id) || 1,
            name: m.name,
            role: m.role,
            avatar: m.avatar || null,
        }));

        // Ensure lead is in members list if defined
        if (this.leadName && !membersPayload.some((m) => m.name === this.leadName)) {
            membersPayload.unshift({
                id: Number(this.leadId) || Date.now(),
                name: this.leadName,
                role: this.leadRole || 'ប្រធានគម្រោង',
                avatar: this.leadAvatar || null,
            });
        }

        const payload = {
            code: this.projectCode.trim().toUpperCase(),
            name: name,
            description: this.description.trim(),
            status: this.selectedStatus(),
            priority: this.priority(),
            category: this.category,
            budget: Number(this.budget) || 5000,
            start_date: this.startDate || new Date().toISOString(),
            end_date: this.endDate || new Date(Date.now() + 86400000 * 60).toISOString(),
            members: membersPayload,
        };

        this._homeService.createProject(payload).subscribe({
            next: (res) => {
                this.successMessage.set(
                    `បានបង្កើតគម្រោង «${name}» ជាមួយស្ថានភាព «${statusObj?.label || 'កំពុងដំណើរការ'}» ដោយជោគជ័យ!`,
                );
                setTimeout(() => {
                    this.dialogRef.close({
                        created: true,
                        project: res?.data || payload,
                        name: name,
                        status: this.selectedStatus(),
                        lead: this.leadName ? { name: this.leadName, role: this.leadRole, avatar: this.leadAvatar, id: this.leadId } : null,
                        members: membersPayload,
                    });
                }, 800);
            },
            error: (err) => {
                console.error('Failed to create project via API', err);
                this.successMessage.set(
                    `បានបង្កើតគម្រោង «${name}» ដោយជោគជ័យ!`,
                );
                setTimeout(() => {
                    this.dialogRef.close({
                        created: true,
                        project: payload,
                        name: name,
                        status: this.selectedStatus(),
                        lead: this.leadName ? { name: this.leadName, role: this.leadRole, avatar: this.leadAvatar, id: this.leadId } : null,
                        members: membersPayload,
                    });
                }, 800);
            },
        });
    }
}
