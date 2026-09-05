import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { SideDialogCloseButtonComponent } from 'app/shared/side-dialog-close-button/component';
import { UserHomeService } from '../home.service';

export interface ActiveProjectItem {
    id: string;
    title: string;
    code: string;
    progress: number;
    tasksCount: number;
    completedTasks: number;
    status: 'on_track' | 'in_progress' | 'delayed';
    dueDate: string;
    members: { name: string; avatar?: string }[];
}

@Component({
    selector: 'app-active-projects-dialog',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
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
                    គម្រោងសកម្ម
                </span>
            </div>

            <!-- Standard Side Drawer Close Button -->
            <shared-side-dialog-close-button [isReturn]="false"></shared-side-dialog-close-button>

            <!-- Scrollable Body -->
            <mat-dialog-content class="w-full !m-0 !p-0 overflow-y-auto flex-1 bg-white dark:bg-slate-900 font-kantumruy text-[16px]">
                
                <div class="p-5 space-y-6 font-kantumruy">
                    
                    <!-- Cover Banner -->
                    <div class="rounded-2xl bg-gradient-to-r from-teal-700 via-emerald-800 to-slate-900 text-white p-5 shadow-sm relative overflow-hidden font-kantumruy">
                        <div class="absolute right-0 top-0 text-white/5 pointer-events-none -mr-6 -mt-6">
                            <mat-icon svgIcon="mdi:view-grid-outline" class="icon-size-40"></mat-icon>
                        </div>
                        <div class="relative z-10">
                            <span class="text-[13px] font-medium tracking-wider uppercase bg-white/20 px-3 py-1 rounded-full text-teal-100">
                                តាមដានគម្រោង (PROJECT TRACKING)
                            </span>
                            <h3 class="text-[20px] font-medium text-white mt-2.5 leading-tight">
                                វឌ្ឍនភាព និង ស្ថានភាពគម្រោងកំពុងដំណើរការ
                            </h3>
                            <p class="text-[14px] text-teal-200/90 mt-1.5 leading-normal">
                                សរុប ៤ គម្រោងសកម្ម • ២ គម្រោងដំណើរការល្អ • ១ គម្រោងជិតដល់ថ្ងៃកំណត់
                            </p>
                        </div>
                    </div>

                    <!-- Filter / Search -->
                    <div class="flex items-center gap-2.5">
                        <div class="relative flex-1">
                            <mat-icon svgIcon="mdi:magnify" class="absolute left-3.5 top-3 icon-size-5 text-slate-400"></mat-icon>
                            <input
                                type="text"
                                [(ngModel)]="searchQuery"
                                placeholder="ស្វែងរកគម្រោងតាមឈ្មោះ ឬ កូដ..."
                                class="w-full pl-10 pr-4 py-2.5 text-[15px] font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                            />
                        </div>
                    </div>

                    <!-- Project List Cards -->
                    <div class="space-y-3.5 font-kantumruy">
                        <div *ngFor="let p of filteredProjects"
                            class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-teal-400 transition-all space-y-3 font-kantumruy shadow-2xs">
                            
                            <div class="flex items-start justify-between gap-3">
                                <div class="min-w-0 flex-1">
                                    <div class="flex items-center gap-2">
                                        <span class="text-[12px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                            {{ p.code }}
                                        </span>
                                        <span class="text-[12px] px-2 py-0.5 rounded-full font-medium"
                                            [ngClass]="p.status === 'on_track'
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'">
                                            {{ p.status === 'on_track' ? 'ដំណើរការល្អ' : 'កំពុងអនុវត្ត' }}
                                        </span>
                                    </div>
                                    <h4 class="text-[16px] font-medium text-slate-900 dark:text-white mt-1.5 truncate">
                                        {{ p.title }}
                                    </h4>
                                </div>

                                <span class="text-[16px] font-semibold text-teal-600 dark:text-teal-400 shrink-0">
                                    {{ p.progress }}%
                                </span>
                            </div>

                            <!-- Progress Bar -->
                            <div class="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                <div class="bg-teal-500 h-2 rounded-full transition-all duration-500"
                                    [style.width.%]="p.progress"></div>
                            </div>

                            <div class="flex items-center justify-between text-[13px] text-slate-500 dark:text-slate-400 pt-1">
                                <span>កិច្ចការ៖ {{ p.completedTasks }}/{{ p.tasksCount }}</span>
                                <span>កាលបរិច្ឆេទ៖ {{ p.dueDate }}</span>
                            </div>

                        </div>
                    </div>

                </div>

            </mat-dialog-content>

            <!-- Bottom Sticky Action -->
            <div class="w-full flex items-center p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 font-kantumruy">
                <button
                    type="button"
                    (click)="goToAllProjects()"
                    class="w-full h-11 px-4 rounded-xl font-medium font-kantumruy text-[16px] flex items-center justify-center gap-2 text-white bg-[#1c2b6b] hover:bg-[#152254] transition-all duration-200 active:scale-[0.98] cursor-pointer"
                >
                    <mat-icon svgIcon="mdi:view-grid" class="!w-5 !h-5 !text-white shrink-0"></mat-icon>
                    <span>មើលគម្រោងទាំងអស់</span>
                </button>
            </div>

        </div>
    `,
})
export class ActiveProjectsDialogComponent implements OnInit {
    searchQuery: string = '';

    projects: ActiveProjectItem[] = [
        {
            id: '1',
            title: 'ប្រព័ន្ធគ្រប់គ្រងវត្តមានស្វ័យប្រវត្ត WMS',
            code: 'PRJ-2026-01',
            progress: 85,
            tasksCount: 24,
            completedTasks: 20,
            status: 'on_track',
            dueDate: '១៥ កញ្ញា ២០២៦',
            members: [{ name: 'ចេង ច័ន្ទបញ្ញា' }, { name: 'សុខ សុភា' }],
        },
        {
            id: '2',
            title: 'ការធ្វើបច្ចុប្បន្នភាពម៉ាស៊ីនមេ និងសុវត្ថិភាពទិន្នន័យ',
            code: 'PRJ-2026-02',
            progress: 60,
            tasksCount: 15,
            completedTasks: 9,
            status: 'in_progress',
            dueDate: '៣០ កញ្ញា ២០២៦',
            members: [{ name: 'កែវ សុវណ្ណ' }],
        },
        {
            id: '3',
            title: 'រៀបចំប្រព័ន្ធ QR Code ស្កេនវត្តមានចល័ត',
            code: 'PRJ-2026-03',
            progress: 40,
            tasksCount: 18,
            completedTasks: 7,
            status: 'in_progress',
            dueDate: '១០ តុលា ២០២៦',
            members: [{ name: 'រ័ត្ន វិចិត្រ' }],
        },
    ];

    constructor(
        public dialogRef: MatDialogRef<ActiveProjectsDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private readonly _router: Router,
        private readonly _homeService: UserHomeService,
    ) { }

    ngOnInit(): void {
        this._homeService.getActiveProjects().subscribe({
            next: (res) => {
                if (res?.data?.results) {
                    this.projects = res.data.results.map((p: any) => ({
                        id: p.id,
                        title: p.name,
                        code: p.code,
                        progress: p.progress,
                        tasksCount: p.total_tasks,
                        completedTasks: p.completed_tasks,
                        status: p.status === 'active' ? 'in_progress' : 'on_track',
                        dueDate: p.end_date ? new Intl.DateTimeFormat('km-KH', { dateStyle: 'medium' }).format(new Date(p.end_date)) : 'មិនកំណត់',
                        members: p.members || [{ name: 'Cheng Chanpanha' }],
                    }));
                }
            },
            error: (err) => console.error('Failed to load active projects', err),
        });
    }

    get filteredProjects(): ActiveProjectItem[] {
        if (!this.searchQuery.trim()) return this.projects;
        const q = this.searchQuery.toLowerCase();
        return this.projects.filter(
            (p) => p.title.toLowerCase().includes(q) || p.code.toLowerCase().includes(q),
        );
    }

    goToAllProjects(): void {
        this.dialogRef.close();
        this._router.navigate(['/projects']);
    }
}
