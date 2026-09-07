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
    date?: string;
    startDate?: string;
    endDate?: string;
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
            <!-- 1. DIALOG HEADER                                          -->
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
                            [class]="category() === 'work'
                                ? 'py-2.5 px-3 rounded-xl bg-blue-600 text-white font-medium shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer'
                                : 'py-2.5 px-3 rounded-xl hover:bg-white/60 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 font-normal flex items-center justify-center gap-2 transition-all cursor-pointer'">
                            <mat-icon svgIcon="mdi:briefcase-outline" class="icon-size-4.5"></mat-icon>
                            <span class="text-[15px]">ការងារ</span>
                        </button>

                        <button
                            type="button"
                            (click)="setCategory('myself')"
                            [class]="category() === 'myself'
                                ? 'py-2.5 px-3 rounded-xl bg-indigo-600 text-white font-medium shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer'
                                : 'py-2.5 px-3 rounded-xl hover:bg-white/60 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 font-normal flex items-center justify-center gap-2 transition-all cursor-pointer'">
                            <mat-icon svgIcon="mdi:account-outline" class="icon-size-4.5"></mat-icon>
                            <span class="text-[15px]">ផ្ទាល់ខ្លួន</span>
                        </button>

                        <button
                            type="button"
                            (click)="setCategory('breaks')"
                            [class]="category() === 'breaks'
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
                            [ngModel]="title()"
                            (ngModelChange)="title.set($event)"
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
                            [ngModel]="activityTypeInput()"
                            (ngModelChange)="activityTypeInput.set($event)"
                            placeholder="វាយបញ្ចូល ឬចុចជ្រើសរើសខាងក្រោម..."
                            class="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[15.5px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all" />

                        <!-- Preset Quick Chips -->
                        <div class="flex flex-wrap gap-1.5 mt-2">
                            @for (preset of presetActivities; track preset) {
                                <button
                                    type="button"
                                    (click)="selectPresetActivity(preset)"
                                    [class]="activityTypeInput() === preset
                                        ? 'px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-400 dark:border-blue-700 text-blue-600 dark:text-blue-300 text-[13.5px] font-medium transition-all cursor-pointer'
                                        : 'px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-transparent hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300 text-[13.5px] font-normal transition-all cursor-pointer'">
                                    {{ preset }}
                                </button>
                            }
                        </div>
                    </div>

                    <!-- ========================================================= -->
                    <!-- DATE & TIME SECTION (Always Visible & Tailored)           -->
                    <!-- ========================================================= -->
                    <div class="p-4.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/90 dark:border-slate-700/80 space-y-4">
                        <div class="flex items-center justify-between pb-2 border-b border-slate-200/70 dark:border-slate-700/60">
                            <span class="text-[15.5px] font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                <mat-icon svgIcon="mdi:calendar-range" class="icon-size-5 text-blue-600"></mat-icon>
                                <span>កាលបរិច្ឆេទ & ម៉ោងកំណត់</span>
                            </span>
                            <div class="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    (click)="setDatePreset('today')"
                                    class="px-2.5 py-0.5 rounded-lg text-[12.5px] font-medium bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 transition-all cursor-pointer">
                                    ថ្ងៃនេះ
                                </button>
                                <button
                                    type="button"
                                    (click)="setDatePreset('tomorrow')"
                                    class="px-2.5 py-0.5 rounded-lg text-[12.5px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer">
                                    ថ្ងៃស្អែក
                                </button>
                                <button
                                    type="button"
                                    (click)="setDatePreset('thisWeek')"
                                    class="px-2.5 py-0.5 rounded-lg text-[12.5px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer">
                                    សប្តាហ៍នេះ
                                </button>
                            </div>
                        </div>

                        <!-- Start Date & End Date -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div>
                                <label class="block text-[14.5px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    ចាប់ពីថ្ងៃ (Start Date) <span class="text-rose-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    [ngModel]="startDate()"
                                    (ngModelChange)="onStartDateChange($event)"
                                    class="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[15px] font-kantumruy text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 transition-all cursor-pointer" />
                                <div class="text-[12.5px] text-blue-600 dark:text-blue-400 mt-1 font-medium truncate">
                                    {{ getKhmerFormattedDate(startDate()) }}
                                </div>
                            </div>

                            <div>
                                <label class="block text-[14.5px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    ដល់ថ្ងៃ (End Date) <span class="text-rose-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    [ngModel]="endDate()"
                                    (ngModelChange)="endDate.set($event)"
                                    class="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[15px] font-kantumruy text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 transition-all cursor-pointer" />
                                <div class="text-[12.5px] text-blue-600 dark:text-blue-400 mt-1 font-medium truncate">
                                    {{ getKhmerFormattedDate(endDate()) }}
                                </div>
                            </div>
                        </div>

                        <!-- Start Time & End Time -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                            <div>
                                <label class="block text-[14.5px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    ម៉ោងចាប់ផ្តើម (Start Time) <span class="text-rose-500">*</span>
                                </label>
                                <input
                                    type="time"
                                    [ngModel]="startTimeRaw()"
                                    (ngModelChange)="startTimeRaw.set($event)"
                                    class="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[15px] font-kantumruy text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 transition-all cursor-pointer" />
                                <div class="text-[12.5px] text-blue-600 dark:text-blue-400 mt-1 font-medium truncate">
                                    {{ formatKhmerTime(startTimeRaw()) }}
                                </div>
                                <div class="flex flex-wrap gap-1 mt-1.5">
                                    @for (preset of [
                                        { raw: '08:30', label: '08:30 ព្រឹក' },
                                        { raw: '09:00', label: '09:00 ព្រឹក' },
                                        { raw: '10:00', label: '10:00 ព្រឹក' },
                                        { raw: '13:30', label: '01:30 រសៀល' },
                                        { raw: '14:00', label: '02:00 រសៀល' }
                                    ]; track preset.raw) {
                                        <button
                                            type="button"
                                            (click)="setTimePreset('start', preset.raw)"
                                            [class]="startTimeRaw() === preset.raw
                                                ? 'px-2 py-0.5 rounded text-[12px] bg-blue-50 dark:bg-blue-950/60 border border-blue-400 text-blue-600 dark:text-blue-300 font-medium cursor-pointer transition-all'
                                                : 'px-2 py-0.5 rounded text-[12px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer transition-all'">
                                            {{ preset.label }}
                                        </button>
                                    }
                                </div>
                            </div>

                            <div>
                                <label class="block text-[14.5px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    ម៉ោងបញ្ចប់ (End Time) <span class="text-rose-500">*</span>
                                </label>
                                <input
                                    type="time"
                                    [ngModel]="endTimeRaw()"
                                    (ngModelChange)="endTimeRaw.set($event)"
                                    class="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[15px] font-kantumruy text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 transition-all cursor-pointer" />
                                <div class="text-[12.5px] text-blue-600 dark:text-blue-400 mt-1 font-medium truncate">
                                    {{ formatKhmerTime(endTimeRaw()) }}
                                </div>
                                <div class="flex flex-wrap gap-1 mt-1.5">
                                    @for (preset of [
                                        { raw: '11:30', label: '11:30 ព្រឹក' },
                                        { raw: '12:00', label: '12:00 ថ្ងៃត្រង់' },
                                        { raw: '15:30', label: '03:30 រសៀល' },
                                        { raw: '17:00', label: '05:00 រសៀល' },
                                        { raw: '17:30', label: '05:30 ល្ងាច' }
                                    ]; track preset.raw) {
                                        <button
                                            type="button"
                                            (click)="setTimePreset('end', preset.raw)"
                                            [class]="endTimeRaw() === preset.raw
                                                ? 'px-2 py-0.5 rounded text-[12px] bg-blue-50 dark:bg-blue-950/60 border border-blue-400 text-blue-600 dark:text-blue-300 font-medium cursor-pointer transition-all'
                                                : 'px-2 py-0.5 rounded text-[12px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer transition-all'">
                                            {{ preset.label }}
                                        </button>
                                    }
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- ========================================================= -->
                    <!-- TEAM MEMBERS SELECTION (When Work Category)               -->
                    <!-- ========================================================= -->
                    @if (category() === 'work') {
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
                                    [ngModel]="customMemberName()"
                                    (ngModelChange)="customMemberName.set($event)"
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
                                @for (member of availableMembers(); track member.id) {
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
                            [ngModel]="note()"
                            (ngModelChange)="note.set($event)"
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
                    [disabled]="!title().trim()"
                    class="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[15.5px] font-medium shadow-xs transition-all flex items-center gap-2 cursor-pointer">
                    <mat-icon svgIcon="mdi:check" class="icon-size-4.5 text-white"></mat-icon>
                    <span>រក្សាទុក</span>
                </button>
            </div>

        </div>
    `,
})
export class CreateScheduleDialogComponent implements OnInit {
    title = signal<string>('');
    category = signal<'work' | 'myself' | 'breaks'>('work');
    activityTypeInput = signal<string>('កិច្ចប្រជុំទូទៅ');
    customMemberName = signal<string>('');

    // Modern Date Pickers
    startDate = signal<string>(this.formatDateIso(new Date()));
    endDate = signal<string>(this.formatDateIso(new Date()));

    // Modern Time Pickers (24h raw values for input[type=time])
    startTimeRaw = signal<string>('09:00');
    endTimeRaw = signal<string>('17:30');
    note = signal<string>('');

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

    availableMembers = signal<TeamMemberItem[]>([
        { id: 1, name: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត (Piseth Panhavorn)', role: 'Super Admin & Lead', initials: 'PP', bg: 'bg-emerald-700 text-white' },
        { id: 2, name: 'ពុំ ប្រុសមុន្នី (Pum Brusmuny)', role: 'Frontend Engineer', initials: 'PB', bg: 'bg-blue-700 text-white' },
        { id: 3, name: 'ថា វីនណឺរ (Tha Winner)', role: 'QA & DevOps Engineer', initials: 'TW', bg: 'bg-indigo-700 text-white' },
    ]);

    selectedMemberIds = signal<Array<string | number>>([1, 2]);

    constructor(
        public dialogRef: MatDialogRef<CreateScheduleDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: CreateScheduleDialogData,
    ) {}

    ngOnInit(): void {
        if (this.data) {
            if (this.data.category) this.category.set(this.data.category);
            if (this.data.time) this.startTimeRaw.set(this.parseTimeTo24h(this.data.time));
            if (this.data.startDate) {
                this.startDate.set(this.data.startDate);
                this.endDate.set(this.data.endDate || this.data.startDate);
            } else if (this.data.date) {
                this.startDate.set(this.data.date);
                this.endDate.set(this.data.date);
            }
        }
    }

    private formatDateIso(d: Date): string {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    private parseTimeTo24h(tStr?: string): string {
        if (!tStr) return '09:00';
        if (/^\d{2}:\d{2}$/.test(tStr.trim())) return tStr.trim();
        
        const match = tStr.match(/(\d{1,2}):(\d{2})/);
        if (match) {
            let h = parseInt(match[1], 10);
            const m = match[2];
            if (tStr.includes('រសៀល') || tStr.includes('ល្ងាច') || tStr.includes('យប់')) {
                if (h < 12) h += 12;
            } else if (tStr.includes('ព្រឹក')) {
                if (h === 12) h = 0;
            }
            return `${String(h).padStart(2, '0')}:${m}`;
        }
        return '09:00';
    }

    formatKhmerTime(time24: string): string {
        if (!time24) return '';
        const [hStr, mStr] = time24.split(':');
        let h = parseInt(hStr, 10);
        const m = mStr || '00';
        if (isNaN(h)) return time24;

        let period = 'ព្រឹក';
        let displayH = h;

        if (h === 0) {
            displayH = 12;
            period = 'យប់';
        } else if (h < 12) {
            period = 'ព្រឹក';
            displayH = h;
        } else if (h === 12) {
            period = 'ថ្ងៃត្រង់';
            displayH = 12;
        } else if (h < 17) {
            period = 'រសៀល';
            displayH = h - 12;
        } else if (h < 19) {
            period = 'ល្ងាច';
            displayH = h - 12;
        } else {
            period = 'យប់';
            displayH = h - 12;
        }

        const formattedH = String(displayH).padStart(2, '0');
        return `${formattedH}:${m} ${period}`;
    }

    setTimePreset(type: 'start' | 'end', time24: string): void {
        if (type === 'start') {
            this.startTimeRaw.set(time24);
        } else {
            this.endTimeRaw.set(time24);
        }
    }

    onStartDateChange(newStartDate: string): void {
        this.startDate.set(newStartDate);
        if (!this.endDate() || this.endDate() < newStartDate) {
            this.endDate.set(newStartDate);
        }
    }

    setDatePreset(preset: 'today' | 'tomorrow' | 'thisWeek'): void {
        const today = new Date();
        if (preset === 'today') {
            this.startDate.set(this.formatDateIso(today));
            this.endDate.set(this.formatDateIso(today));
        } else if (preset === 'tomorrow') {
            const tmr = new Date(today);
            tmr.setDate(today.getDate() + 1);
            this.startDate.set(this.formatDateIso(tmr));
            this.endDate.set(this.formatDateIso(tmr));
        } else if (preset === 'thisWeek') {
            const dayOfWeek = today.getDay();
            const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
            const monday = new Date(today);
            monday.setDate(today.getDate() + diffToMonday);
            const friday = new Date(monday);
            friday.setDate(monday.getDate() + 4);
            this.startDate.set(this.formatDateIso(monday));
            this.endDate.set(this.formatDateIso(friday));
        }
    }

    getKhmerFormattedDate(dateStr: string): string {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length < 3) return dateStr;
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        const khmerDays = ['អាទិត្យ', 'ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'];
        const khmerMonths = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
        const dayName = khmerDays[d.getDay()] || '';
        const dayNum = String(d.getDate()).padStart(2, '0');
        const monthName = khmerMonths[d.getMonth()] || '';
        const yearNum = d.getFullYear();
        return `${dayName} ទី ${dayNum} ${monthName} ${yearNum}`;
    }

    setCategory(cat: 'work' | 'myself' | 'breaks'): void {
        this.category.set(cat);
        if (cat === 'work') {
            this.activityTypeInput.set('កិច្ចប្រជុំទូទៅ');
        } else if (cat === 'myself') {
            this.activityTypeInput.set('ផ្ទាល់ខ្លួន');
        } else {
            this.activityTypeInput.set('សម្រាកខ្លី');
        }
    }

    selectPresetActivity(preset: string): void {
        this.activityTypeInput.set(preset);
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
        const name = this.customMemberName().trim();
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

        this.availableMembers.update((list) => [...list, newMember]);
        this.selectedMemberIds.update((ids) => [...ids, newId]);
        this.customMemberName.set('');
    }

    cancel(): void {
        this.dialogRef.close(null);
    }

    save(): void {
        const titleVal = this.title().trim();
        if (!titleVal) return;

        const colorMap: Record<string, 'peach' | 'indigo' | 'coral' | 'lime' | 'cyan' | 'purple'> = {
            work: 'peach',
            myself: 'indigo',
            breaks: 'coral',
        };

        const selIds = this.selectedMemberIds();
        const selectedMembers = this.availableMembers()
            .filter((m) => selIds.includes(m.id))
            .map((m) => ({
                id: m.id,
                name: m.name,
                role: m.role,
                initials: m.initials,
                bg: m.bg,
            }));

        const finalMembers = selectedMembers.length > 0
            ? selectedMembers
            : [
                { id: 1, name: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត', role: 'អ្នករៀបចំ', initials: 'PP', bg: 'bg-emerald-700 text-white' },
            ];

        const curCat = this.category();
        const startT = this.startTimeRaw();
        const endT = this.endTimeRaw();
        const startD = this.startDate();
        const endD = this.endDate();

        const formattedStartTime = this.formatKhmerTime(startT);
        const formattedEndTime = this.formatKhmerTime(endT);

        // Format time display
        const displayTime = curCat === 'work' && endT
            ? `${formattedStartTime} - ${formattedEndTime}`
            : formattedStartTime;

        // Calculate start & end day indices (0: Monday, 1: Tuesday, ..., 5: Saturday)
        const actualEndDate = curCat === 'work' && endD ? endD : startD;

        const dStart = new Date(startD + 'T00:00:00');
        const dayOfWeekStart = dStart.getDay();
        const startIdx = dayOfWeekStart === 0 ? 5 : Math.max(0, Math.min(5, dayOfWeekStart - 1));

        const dEnd = new Date(actualEndDate + 'T00:00:00');
        const dayOfWeekEnd = dEnd.getDay();
        const endIdx = dayOfWeekEnd === 0 ? 5 : Math.max(0, Math.min(5, dayOfWeekEnd - 1));

        const result = {
            title: titleVal,
            time: displayTime || '09:00 ព្រឹក',
            date: startD,
            start_date: startD,
            end_date: actualEndDate,
            day_index: startIdx,
            start_day_index: startIdx,
            end_day_index: endIdx,
            start_time: formattedStartTime,
            end_time: formattedEndTime,
            category: curCat,
            type: this.activityTypeInput().trim() || 'កិច្ចប្រជុំទូទៅ',
            color_theme: colorMap[curCat] || 'peach',
            members: finalMembers,
            note: this.note().trim(),
            };

        this.dialogRef.close(result);
    }
}
