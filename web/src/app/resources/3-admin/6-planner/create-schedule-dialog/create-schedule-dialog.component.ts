import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SideDialogCloseButtonComponent } from 'app/shared/side-dialog-close-button/component';

export interface CreateScheduleDialogData {
    dayIndex?: number;
    category?: 'work' | 'myself' | 'breaks';
    time?: string;
}

export interface TeamMemberItem {
    id: string | number;
    name: string;
    role: string;
    initials: string;
    avatar?: string;
    bg: string;
}

@Component({
    selector: 'app-create-schedule-dialog',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatTooltipModule,
        SideDialogCloseButtonComponent,
    ],
    template: `
        <div class="w-full h-full flex flex-col bg-white dark:bg-slate-900 font-kantumruy text-[16px] font-normal relative overflow-hidden" style="font-family: 'Kantumruy Pro', sans-serif !important;">
            
            <!-- ========================================================= -->
            <!-- 1. DIALOG HEADER (Exact Side Drawer Header Style)         -->
            <!-- ========================================================= -->
            <div mat-dialog-title
                class="w-full relative flex justify-center items-center min-h-14 max-h-14 h-14 border-b border-slate-200 dark:border-white/10 m-0 !py-0 font-kantumruy bg-white dark:bg-slate-900 shrink-0">
                <span class="w-full text-center text-xl sm:text-2xl font-medium font-kantumruy text-slate-800 dark:text-slate-200">
                    បង្កើតកាលវិភាគថ្មី
                </span>
            </div>

            <!-- Standard Side Drawer Close Button -->
            <shared-side-dialog-close-button [isReturn]="false"></shared-side-dialog-close-button>

            <!-- ========================================================= -->
            <!-- 2. DIALOG CONTENT BODY (Scrollable)                       -->
            <!-- ========================================================= -->
            <mat-dialog-content class="flex-1 !m-0 p-6 overflow-y-auto bg-white dark:bg-slate-900 font-kantumruy text-[16px] space-y-6">
                
                <!-- Category Selector Pill Tabs -->
                <div>
                    <label class="block text-[15.5px] font-medium text-slate-800 dark:text-slate-200 mb-2">
                        ប្រភេទកាលវិភាគ <span class="text-rose-500">*</span>
                    </label>
                    <div class="grid grid-cols-3 gap-2.5 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
                        <button
                            type="button"
                            (click)="setCategory('work')"
                            [class]="category === 'work'
                                ? 'py-2.5 px-3 rounded-xl bg-blue-600 text-white font-medium shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer'
                                : 'py-2.5 px-3 rounded-xl hover:bg-white/60 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 font-normal flex items-center justify-center gap-2 transition-all cursor-pointer'">
                            <mat-icon svgIcon="mdi:briefcase-outline" class="icon-size-4.5"></mat-icon>
                            <span class="text-[15px]">ការងារ</span>
                        </button>

                        <button
                            type="button"
                            (click)="setCategory('myself')"
                            [class]="category === 'myself'
                                ? 'py-2.5 px-3 rounded-xl bg-indigo-600 text-white font-medium shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer'
                                : 'py-2.5 px-3 rounded-xl hover:bg-white/60 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 font-normal flex items-center justify-center gap-2 transition-all cursor-pointer'">
                            <mat-icon svgIcon="mdi:account-outline" class="icon-size-4.5"></mat-icon>
                            <span class="text-[15px]">ផ្ទាល់ខ្លួន</span>
                        </button>

                        <button
                            type="button"
                            (click)="setCategory('breaks')"
                            [class]="category === 'breaks'
                                ? 'py-2.5 px-3 rounded-xl bg-rose-600 text-white font-medium shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer'
                                : 'py-2.5 px-3 rounded-xl hover:bg-white/60 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 font-normal flex items-center justify-center gap-2 transition-all cursor-pointer'">
                            <mat-icon svgIcon="mdi:coffee-outline" class="icon-size-4.5"></mat-icon>
                            <span class="text-[15px]">ការសម្រាក</span>
                        </button>
                    </div>
                </div>

                <!-- Form Fields Container -->
                <div class="space-y-5">
                    
                    <!-- Title Input -->
                    <div>
                        <label class="block text-[15.5px] font-medium text-slate-800 dark:text-slate-200 mb-1.5">
                            ចំណងជើងកាលវិភាគ / កិច្ចប្រជុំ <span class="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            [(ngModel)]="title"
                            placeholder="ឧ. កែប្រែប្រព័ន្ធ Web, ត្រួតពិនិត្យគម្រោង, ប្រជុំអនឡាញ..."
                            class="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[15.5px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all" />
                    </div>

                    <!-- Activity Type (Write-in input + Preset chips) -->
                    <div>
                        <div class="flex items-center justify-between mb-1.5">
                            <label class="block text-[15.5px] font-medium text-slate-800 dark:text-slate-200">
                                ប្រភេទសកម្មភាព (អាចជ្រើសរើស ឬវាយបញ្ចូលផ្ទាល់) <span class="text-rose-500">*</span>
                            </label>
                            <span class="text-[13px] text-slate-400 font-normal">អាចវាយអក្សរបាន</span>
                        </div>
                        
                        <input
                            type="text"
                            [(ngModel)]="activityTypeInput"
                            placeholder="វាយបញ្ចូល ឬចុចជ្រើសរើសខាងក្រោម..."
                            class="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[15.5px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all" />

                        <!-- Preset Quick Chips -->
                        <div class="flex flex-wrap gap-1.5 mt-2">
                            @for (preset of presetActivities; track preset) {
                                <button
                                    type="button"
                                    (click)="selectPresetActivity(preset)"
                                    [class]="activityTypeInput === preset
                                        ? 'px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-400 dark:border-blue-700 text-blue-600 dark:text-blue-300 text-[13.5px] font-medium transition-all cursor-pointer'
                                        : 'px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-transparent hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300 text-[13.5px] font-normal transition-all cursor-pointer'">
                                    {{ preset }}
                                </button>
                            }
                        </div>
                    </div>

                    <!-- ========================================================= -->
                    <!-- CONDITIONAL: WORK CATEGORY -> PERIOD BETWEEN DATES        -->
                    <!-- ========================================================= -->
                    @if (category === 'work') {
                        <div class="p-4.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/90 dark:border-slate-700/80 space-y-4">
                            <div class="flex items-center justify-between pb-2 border-b border-slate-200/70 dark:border-slate-700/60">
                                <span class="text-[15.5px] font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                    <mat-icon svgIcon="mdi:calendar-range" class="icon-size-5 text-blue-600"></mat-icon>
                                    <span>ចន្លោះកាលបរិច្ឆេទ & រយៈពេលអនុវត្ត</span>
                                </span>
                                <span class="text-[13px] text-blue-600 font-medium bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full">
                                    កាលវិភាគការងារ
                                </span>
                            </div>

                            <!-- Start Date & End Date (Period Between) -->
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label class="block text-[14.5px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        ចាប់ពីថ្ងៃ (Start Date) <span class="text-rose-500">*</span>
                                    </label>
                                    <select
                                        [(ngModel)]="startDayIndex"
                                        class="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[15px] text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 transition-all cursor-pointer">
                                        <option [value]="0">ច័ន្ទ 2 មីនា 2026</option>
                                        <option [value]="1">អង្គារ 3 មីនា 2026</option>
                                        <option [value]="2">ពុធ 4 មីនា 2026</option>
                                        <option [value]="3">ព្រហស្បតិ៍ 5 មីនា 2026</option>
                                        <option [value]="4">សុក្រ 6 មីនា 2026</option>
                                        <option [value]="5">សៅរ៍ 7 មីនា 2026</option>
                                    </select>
                                </div>

                                <div>
                                    <label class="block text-[14.5px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        ដល់ថ្ងៃ (End Date) <span class="text-rose-500">*</span>
                                    </label>
                                    <select
                                        [(ngModel)]="endDayIndex"
                                        class="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[15px] text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 transition-all cursor-pointer">
                                        <option [value]="0">ច័ន្ទ 2 មីនា 2026</option>
                                        <option [value]="1">អង្គារ 3 មីនា 2026</option>
                                        <option [value]="2">ពុធ 4 មីនា 2026</option>
                                        <option [value]="3">ព្រហស្បតិ៍ 5 មីនា 2026</option>
                                        <option [value]="4">សុក្រ 6 មីនា 2026</option>
                                        <option [value]="5">សៅរ៍ 7 មីនា 2026</option>
                                    </select>
                                </div>
                            </div>

                            <!-- Start Time & End Time -->
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label class="block text-[14.5px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        ម៉ោងចាប់ផ្តើម <span class="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        [(ngModel)]="startTime"
                                        placeholder="09:00 ព្រឹក"
                                        class="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[15px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 transition-all" />
                                </div>

                                <div>
                                    <label class="block text-[14.5px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        ម៉ោងបញ្ចប់ <span class="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        [(ngModel)]="endTime"
                                        placeholder="05:30 ល្ងាច"
                                        class="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[15px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 transition-all" />
                                </div>
                            </div>
                        </div>
                    } @else {
                        <!-- SINGLE DAY & TIME (For Personal or Break) -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-[15.5px] font-medium text-slate-800 dark:text-slate-200 mb-1.5">
                                    ថ្ងៃនៃសប្តាហ៍ <span class="text-rose-500">*</span>
                                </label>
                                <select
                                    [(ngModel)]="startDayIndex"
                                    class="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[15.5px] text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 transition-all cursor-pointer">
                                    <option [value]="0">ច័ន្ទ 2 មីនា 2026</option>
                                    <option [value]="1">អង្គារ 3 មីនា 2026</option>
                                    <option [value]="2">ពុធ 4 មីនា 2026</option>
                                    <option [value]="3">ព្រហស្បតិ៍ 5 មីនា 2026</option>
                                    <option [value]="4">សុក្រ 6 មីនា 2026</option>
                                    <option [value]="5">សៅរ៍ 7 មីនា 2026</option>
                                </select>
                            </div>

                            <div>
                                <label class="block text-[15.5px] font-medium text-slate-800 dark:text-slate-200 mb-1.5">
                                    ម៉ោងកំណត់ <span class="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    [(ngModel)]="startTime"
                                    placeholder="02:00 រសៀល"
                                    class="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[15.5px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 transition-all" />
                            </div>
                        </div>
                    }

                    <!-- ========================================================= -->
                    <!-- CONDITIONAL: WORK CATEGORY -> TEAM MEMBERS SELECTION     -->
                    <!-- ========================================================= -->
                    @if (category === 'work') {
                        <div class="space-y-3">
                            <div class="flex items-center justify-between">
                                <label class="block text-[15.5px] font-medium text-slate-800 dark:text-slate-200">
                                    ជ្រើសរើសសមាជិកចូលរួម ({{ selectedMemberIds().length }} នាក់)
                                </label>
                                <span class="text-[13px] text-slate-500 dark:text-slate-400 font-normal">
                                    អាចវាយបញ្ចូលឈ្មោះបន្ថែមបាន
                                </span>
                            </div>

                            <!-- Write-in custom member input -->
                            <div class="flex items-center gap-2">
                                <input
                                    type="text"
                                    [(ngModel)]="customMemberName"
                                    (keydown.enter)="addCustomMember()"
                                    placeholder="វាយបញ្ចូលឈ្មោះសមាជិកថ្មី..."
                                    class="flex-1 h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[15px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600" />
                                <button
                                    type="button"
                                    (click)="addCustomMember()"
                                    class="h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[14.5px] font-medium flex items-center gap-1.5 transition-all cursor-pointer shrink-0">
                                    <mat-icon svgIcon="mdi:plus" class="icon-size-4.5"></mat-icon>
                                    <span>បន្ថែម</span>
                                </button>
                            </div>

                            <!-- Team Members Selectable Grid -->
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                                @for (member of availableMembers; track member.id) {
                                    <div
                                        (click)="toggleMember(member.id)"
                                        [class]="isMemberSelected(member.id)
                                            ? 'p-2.5 rounded-xl border border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 flex items-center justify-between cursor-pointer transition-all shadow-2xs'
                                            : 'p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center justify-between cursor-pointer transition-all'">
                                        <div class="flex items-center gap-2.5 min-w-0">
                                            <div [class]="'w-8.5 h-8.5 rounded-full ' + member.bg + ' flex items-center justify-center text-[12px] font-medium shrink-0 shadow-2xs'">
                                                {{ member.initials }}
                                            </div>
                                            <div class="min-w-0">
                                                <div class="text-[14.5px] font-medium truncate leading-tight">
                                                    {{ member.name }}
                                                </div>
                                                <div class="text-[12.5px] text-slate-400 truncate mt-0.5">
                                                    {{ member.role }}
                                                </div>
                                            </div>
                                        </div>

                                        <mat-icon
                                            [svgIcon]="isMemberSelected(member.id) ? 'mdi:check-circle' : 'mdi:checkbox-blank-circle-outline'"
                                            [class]="isMemberSelected(member.id) ? 'icon-size-5 text-blue-600 shrink-0' : 'icon-size-5 text-slate-300 dark:text-slate-600 shrink-0'"></mat-icon>
                                    </div>
                                }
                            </div>
                        </div>
                    }

                    <!-- Note / Description -->
                    <div>
                        <label class="block text-[15.5px] font-medium text-slate-800 dark:text-slate-200 mb-1.5">
                            កំណត់ចំណាំ ឬបរិយាយ
                        </label>
                        <textarea
                            [(ngModel)]="note"
                            rows="3"
                            placeholder="បញ្ជាក់ព័ត៌មានលម្អិត ឬរបៀបវារៈបន្ថែម..."
                            class="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[15.5px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"></textarea>
                    </div>

                </div>

            </mat-dialog-content>

            <!-- ========================================================= -->
            <!-- 3. DIALOG ACTIONS FOOTER                                  -->
            <!-- ========================================================= -->
            <div class="p-4 px-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50 dark:bg-slate-800/60 shrink-0 font-kantumruy">
                <button
                    type="button"
                    (click)="cancel()"
                    class="px-5 py-2.5 rounded-xl text-[15.5px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-all cursor-pointer">
                    បោះបង់
                </button>
                <button
                    type="button"
                    (click)="save()"
                    [disabled]="!title.trim()"
                    class="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[15.5px] font-medium shadow-xs transition-all flex items-center gap-2 cursor-pointer">
                    <mat-icon svgIcon="mdi:check" class="icon-size-4.5 text-white"></mat-icon>
                    <span>រក្សាទុក</span>
                </button>
            </div>

        </div>
    `,
})
export class CreateScheduleDialogComponent implements OnInit {
    title = '';
    category: 'work' | 'myself' | 'breaks' = 'work';
    activityTypeInput = 'កិច្ចប្រជុំទូទៅ';
    customMemberName = '';

    // Date and Time Range
    startDayIndex = 2; // Default Wednesday
    endDayIndex = 2;
    startTime = '09:00 ព្រឹក';
    endTime = '05:30 ល្ងាច';
    note = '';

    // Preset Suggestions for write-in
    presetActivities = [
        'កិច្ចប្រជុំទូទៅ',
        'ត្រួតពិនិត្យគម្រោង',
        'ប្រជុំអនឡាញ',
        'សម្រាកខ្លី',
        'ជួបញ៉ាំកាហ្វេ',
        'ពិភាក្សាការងារ',
        'ស្រាវជ្រាវប្រព័ន្ធ',
        'ផ្សេងៗ',
    ];

    availableMembers: TeamMemberItem[] = [
        { id: 1, name: 'ចេង ច័ន្ទបញ្ញា (Panha)', role: 'Frontend Lead / Developer', initials: 'CP', bg: 'bg-slate-700 text-white' },
        { id: 2, name: 'សុខ សុភា (Sopheak)', role: 'Lead Project Manager', initials: 'SP', bg: 'bg-teal-700 text-white' },
        { id: 3, name: 'រ័ត្ន វិចិត្រ (Vichet)', role: 'DevOps & Cloud Engineer', initials: 'VC', bg: 'bg-indigo-700 text-white' },
        { id: 4, name: 'លី ម៉េងហួរ (Menghour)', role: 'Senior Backend Engineer', initials: 'MH', bg: 'bg-purple-700 text-white' },
        { id: 5, name: 'គង់ ចរិយា (Chariya)', role: 'QA & Automation Engineer', initials: 'CY', bg: 'bg-emerald-700 text-white' },
        { id: 6, name: 'ហេង ពិសាល (Piseth)', role: 'Mobile App Developer', initials: 'PS', bg: 'bg-amber-700 text-white' },
    ];

    selectedMemberIds = signal<Array<string | number>>([1, 2]);

    constructor(
        public dialogRef: MatDialogRef<CreateScheduleDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: CreateScheduleDialogData,
    ) {}

    ngOnInit(): void {
        if (this.data) {
            if (this.data.dayIndex !== undefined) {
                this.startDayIndex = this.data.dayIndex;
                this.endDayIndex = this.data.dayIndex;
            }
            if (this.data.category) this.category = this.data.category;
            if (this.data.time) this.startTime = this.data.time;
        }
    }

    setCategory(cat: 'work' | 'myself' | 'breaks'): void {
        this.category = cat;
        if (cat === 'work') {
            this.activityTypeInput = 'កិច្ចប្រជុំទូទៅ';
        } else if (cat === 'myself') {
            this.activityTypeInput = 'ផ្ទាល់ខ្លួន';
        } else {
            this.activityTypeInput = 'សម្រាកខ្លី';
        }
    }

    selectPresetActivity(preset: string): void {
        this.activityTypeInput = preset;
    }

    isMemberSelected(id: string | number): boolean {
        return this.selectedMemberIds().includes(id);
    }

    toggleMember(id: string | number): void {
        this.selectedMemberIds.update((current) =>
            current.includes(id) ? current.filter((m) => m !== id) : [...current, id]
        );
    }

    addCustomMember(): void {
        const name = this.customMemberName.trim();
        if (!name) return;

        const initials = name
            .split(' ')
            .map((w) => w[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || 'MB';

        const newId = 'custom_' + Date.now();
        const newMember: TeamMemberItem = {
            id: newId,
            name: name,
            role: 'សមាជិកក្រុមការងារ',
            initials: initials,
            bg: 'bg-blue-700 text-white',
        };

        this.availableMembers = [newMember, ...this.availableMembers];
        this.selectedMemberIds.update((current) => [...current, newId]);
        this.customMemberName = '';
    }

    cancel(): void {
        this.dialogRef.close();
    }

    save(): void {
        if (!this.title.trim()) return;

        const colorMap: Record<string, 'peach' | 'lavender' | 'pink' | 'mint'> = {
            work: 'peach',
            myself: 'lavender',
            breaks: 'pink',
        };

        // Resolve selected members
        const selectedList = this.availableMembers.filter((m) =>
            this.selectedMemberIds().includes(m.id)
        );

        const memberPayload = selectedList.length > 0
            ? selectedList.map((m) => ({ id: m.id, name: m.name, role: m.role, initials: m.initials, bg: m.bg }))
            : [
                { id: 1, name: 'ចេង ច័ន្ទបញ្ញា', role: 'អ្នករៀបចំ', initials: 'CP', bg: 'bg-blue-700 text-white' },
            ];

        // Format time display
        const displayTime = this.category === 'work' && this.endTime
            ? `${this.startTime} - ${this.endTime}`
            : this.startTime;

        const result = {
            title: this.title.trim(),
            time: displayTime || '09:00 ព្រឹក',
            day_index: Number(this.startDayIndex),
            start_day_index: Number(this.startDayIndex),
            end_day_index: Number(this.endDayIndex),
            start_time: this.startTime,
            end_time: this.endTime,
            category: this.category,
            type: this.activityTypeInput.trim() || 'កិច្ចប្រជុំទូទៅ',
            color_theme: colorMap[this.category] || 'peach',
            members: memberPayload,
            note: this.note,
        };

        this.dialogRef.close(result);
    }
}
