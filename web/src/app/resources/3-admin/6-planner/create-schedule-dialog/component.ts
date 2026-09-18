import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SideDialogCloseButtonComponent } from 'app/shared/side-dialog-close-button/component';
import { UserService } from 'app/core/user/user.service';
import { AdminService } from '../../admin.service';


export * from './create-schedule-dialog.types';
import { CreateScheduleDialogData, TeamMemberItem } from './create-schedule-dialog.types';

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
    templateUrl: './template.html',
    styleUrl: './style.scss',
})
export class CreateScheduleDialogComponent implements OnInit {
    isEdit = signal<boolean>(false);
    scheduleId = signal<string | null>(null);

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

    private readonly _adminService = inject(AdminService, { optional: true });
    private readonly _userService = inject(UserService, { optional: true });

    availableMembers = signal<TeamMemberItem[]>([]);
    selectedMemberIds = signal<Array<string | number>>([]);

    constructor(
        public dialogRef: MatDialogRef<CreateScheduleDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: CreateScheduleDialogData,
    ) {}

    ngOnInit(): void {
        if (this._adminService) {
            this._adminService.getUsers({ limit: 100 }).subscribe({
                next: (res) => {
                    const users = res?.data?.results || (res?.data as any)?.users || [];
                    if (Array.isArray(users) && users.length > 0) {
                        const colors = [
                            'bg-emerald-700 text-white',
                            'bg-blue-700 text-white',
                            'bg-indigo-700 text-white',
                            'bg-purple-700 text-white',
                            'bg-amber-700 text-white',
                        ];
                        const members: TeamMemberItem[] = users.map((u: any, idx: number) => {
                            const name = u.name_kh || u.name_en || u.name || 'User';
                            const en = (u.name_en || u.name || 'U').trim();
                            const parts = en.split(' ');
                            const initials = parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : en.slice(0, 2).toUpperCase();
                            return {
                                id: u.id,
                                name: u.name_kh && u.name_en ? `${u.name_kh} (${u.name_en})` : name,
                                role: u.position || u.role || 'Member',
                                initials: initials || 'U',
                                avatar: u.avatar,
                                bg: colors[idx % colors.length],
                            };
                        });
                        this.availableMembers.set(members);
                    }
                },
                error: (err) => console.warn('Could not load members for planner dialog:', err),
            });
        }

        if (this.data) {
            if (this.data.isEdit && this.data.schedule) {
                const s = this.data.schedule;
                this.isEdit.set(true);
                this.scheduleId.set(s.id);
                this.title.set(s.title || '');
                if (s.category) this.setCategory(s.category);
                if (s.type) this.activityTypeInput.set(s.type);
                if (s.note) this.note.set(s.note);

                const sDate = (s.startDate || s.date || '').split('T')[0];
                const eDate = (s.endDate || sDate || '').split('T')[0];
                if (sDate) {
                    this.startDate.set(sDate);
                    this.endDate.set(eDate || sDate);
                }

                if (s.startTime) {
                    this.startTimeRaw.set(this.parseTimeTo24h(s.startTime));
                } else if (s.time) {
                    this.startTimeRaw.set(this.parseTimeTo24h(s.time.split('-')[0]));
                }
                if (s.endTime) {
                    this.endTimeRaw.set(this.parseTimeTo24h(s.endTime));
                } else if (s.time && s.time.includes('-')) {
                    this.endTimeRaw.set(this.parseTimeTo24h(s.time.split('-')[1]));
                }

                if (Array.isArray(s.members) && s.members.length > 0) {
                    this.selectedMemberIds.set(s.members.map((m: any) => m.id).filter(Boolean));
                }
            } else {
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

        const curUser = this._userService?.getUser();
        const creatorName = curUser?.kh_name || curUser?.en_name || curUser?.name || (curUser as any)?.name_kh || (curUser as any)?.name_en || 'អ្នកគ្រប់គ្រង (Admin)';
        const creatorInitials = (curUser?.en_name || curUser?.kh_name || curUser?.name || 'AD').trim().slice(0, 2).toUpperCase();

        const finalMembers = selectedMembers.length > 0
            ? selectedMembers
            : [
                { id: curUser?.id || 1, name: creatorName, role: 'អ្នករៀបចំ (Organizer)', initials: creatorInitials, bg: 'bg-blue-700 text-white' },
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
            ...(this.isEdit() && this.scheduleId() ? { id: this.scheduleId(), isEdit: true } : {}),
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
