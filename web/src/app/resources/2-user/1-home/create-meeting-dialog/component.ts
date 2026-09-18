import { CommonModule } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SideDialogCloseButtonComponent } from 'app/shared/side-dialog-close-button/component';
import { UserHomeService } from '../home.service';


export * from './create-meeting-dialog.types';
import { CreateMeetingDialogData, ScheduledMeeting } from './create-meeting-dialog.types';

@Component({
    selector: 'app-create-meeting-dialog',
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
    templateUrl: './template.html',
    styleUrl: './style.scss',
})
export class CreateMeetingDialogComponent implements OnInit, OnDestroy {
    activeTab = signal<'create' | 'instant' | 'schedule'>('create');

    // Call state
    inCall = signal<boolean>(false);
    activeRoomCode = signal<string>('meet-wms-2026');
    activeRoomUrl = signal<string>('https://meet.wms.gov.kh/room/meet-wms-2026');
    micMuted = signal<boolean>(false);
    cameraOff = signal<boolean>(false);
    callSeconds = signal<number>(0);
    callTimer: any = null;

    copied = signal<boolean>(false);
    successMessage = signal<string>('');

    // Form inputs
    formTitle: string = '';
    formPlatform = signal<'wms' | 'google' | 'zoom'>('wms');
    formDate: string = new Date().toISOString().split('T')[0];
    formTime: string = '09:30';
    formDuration: string = '45 នាទី';
    formAgenda: string = '';
    generatedRoomCode: string = '';
    generatedRoomUrl: string = '';
    joinInputCode: string = '';

    availableMembers = [
        { id: '1', name: 'សុខ សុភា', role: 'ប្រធានគម្រោង' },
        { id: '2', name: 'រ័ត្ន វិចិត្រ', role: 'Frontend' },
        { id: '3', name: 'កែវ សុវណ្ណ', role: 'Backend' },
        { id: '4', name: 'ហេង ស្រីពៅ', role: 'UI/UX' },
    ];
    selectedMemberIds = signal<string[]>(['1', '2']);

    scheduledMeetings = signal<ScheduledMeeting[]>([
        {
            id: 'm1',
            title: 'ប្រជុំពិនិត្យវឌ្ឍនភាពការងារគម្រោង (Sprint Review)',
            type: 'wms',
            date: '០១ កញ្ញា ២០២៦ (ថ្ងៃនេះ)',
            time: '០៩:០០ ព្រឹក - ១០:០០ ព្រឹក',
            duration: '១ ម៉ោង',
            roomCode: 'meet-sprint-8821',
            roomUrl: 'https://meet.wms.gov.kh/room/meet-sprint-8821',
            organizer: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត',
            status: 'live',
            participants: [{ name: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត' }, { name: 'ពុំ ប្រុសមុន្នី' }],
        },
        {
            id: 'm2',
            title: 'ប្រជុំរៀបចំស្ថាបត្យកម្មប្រព័ន្ធ PMS',
            type: 'wms',
            date: '០១ កញ្ញា ២០២៦ (ថ្ងៃនេះ)',
            time: '០២:៣០ រសៀល - ០៣:៣០ រសៀល',
            duration: '១ ម៉ោង',
            roomCode: 'meet-arch-5542',
            roomUrl: 'https://meet.wms.gov.kh/room/meet-arch-5542',
            organizer: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត',
            status: 'upcoming',
            participants: [{ name: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត' }, { name: 'ថា វីនណឺរ' }],
        },
    ]);

    constructor(
        public dialogRef: MatDialogRef<CreateMeetingDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: CreateMeetingDialogData,
        private readonly _homeService: UserHomeService,
    ) {
        this.generateNewRoomCode();
    }

    ngOnInit(): void {
        this._homeService.getMeetings().subscribe({
            next: (res) => {
                if (res?.data && res.data.length > 0) {
                    this.scheduledMeetings.set(res.data as ScheduledMeeting[]);
                }
            },
            error: (err) => console.error('Failed to load live meetings', err),
        });
    }

    ngOnDestroy(): void {
        this.stopCallTimer();
    }

    generateNewRoomCode(): void {
        const rand = Math.floor(1000 + Math.random() * 9000);
        this.generatedRoomCode = `meet-wms-${rand}`;
        this.generatedRoomUrl = `https://meet.wms.gov.kh/room/${this.generatedRoomCode}`;
    }

    isMemberSelected(id: string): boolean {
        return this.selectedMemberIds().includes(id);
    }

    toggleMember(id: string): void {
        const current = this.selectedMemberIds();
        if (current.includes(id)) {
            this.selectedMemberIds.set(current.filter((m) => m !== id));
        } else {
            this.selectedMemberIds.set([...current, id]);
        }
    }

    async copyLink(url: string): Promise<void> {
        try {
            await navigator.clipboard.writeText(url);
            this.copied.set(true);
            setTimeout(() => this.copied.set(false), 2500);
        } catch {
            this.copied.set(true);
            setTimeout(() => this.copied.set(false), 2500);
        }
    }

    saveMeeting(): void {
        if (!this.formTitle || !this.formTitle.trim()) {
            this.formTitle = 'កិច្ចប្រជុំពិភាក្សាការងារ';
        }

        const newMeeting: ScheduledMeeting = {
            id: 'm_' + Date.now(),
            title: this.formTitle.trim(),
            type: this.formPlatform(),
            date: this.formDate,
            time: this.formTime,
            duration: this.formDuration,
            roomCode: this.generatedRoomCode,
            roomUrl: this.generatedRoomUrl,
            organizer: this.data?.user?.kh_name || 'ពិសិដ្ឋ បញ្ញាវ័ន្ត',
            status: 'upcoming',
            participants: [{ name: this.data?.user?.kh_name || 'ពិសិដ្ឋ បញ្ញាវ័ន្ត' }],
            agenda: this.formAgenda.trim(),
        };

        this._homeService.createMeeting(newMeeting).subscribe({
            next: (res) => {
                if (res?.data) {
                    this.scheduledMeetings.update((m) => [res.data, ...m]);
                } else {
                    this.scheduledMeetings.update((m) => [newMeeting, ...m]);
                }
            },
            error: () => {
                this.scheduledMeetings.update((m) => [newMeeting, ...m]);
            },
        });

        this.successMessage.set(`បានបង្កើតអង្គប្រជុំ «${newMeeting.title}» ដោយជោគជ័យ!`);
        this.formTitle = '';
        this.formAgenda = '';
        this.generateNewRoomCode();
        this.activeTab.set('schedule');

        setTimeout(() => this.successMessage.set(''), 4000);
    }

    startInstantMeetingDirectly(): void {
        const rand = Math.floor(1000 + Math.random() * 9000);
        this.activeRoomCode.set(`meet-wms-instant-${rand}`);
        this.activeRoomUrl.set(`https://meet.wms.gov.kh/room/meet-wms-instant-${rand}`);
        this.inCall.set(true);
        this.startCallTimer();
    }

    joinScheduledMeeting(meeting: ScheduledMeeting): void {
        this.activeRoomCode.set(meeting.roomCode);
        this.activeRoomUrl.set(meeting.roomUrl);
        this.inCall.set(true);
        this.startCallTimer();
    }

    joinByCode(): void {
        if (!this.joinInputCode.trim()) return;
        const code = this.joinInputCode.trim();
        this.activeRoomCode.set(code);
        this.activeRoomUrl.set(`https://meet.wms.gov.kh/room/${code}`);
        this.inCall.set(true);
        this.startCallTimer();
    }

    startCallTimer(): void {
        this.stopCallTimer();
        this.callSeconds.set(0);
        this.callTimer = setInterval(() => {
            this.callSeconds.update((s) => s + 1);
        }, 1000);
    }

    stopCallTimer(): void {
        if (this.callTimer) {
            clearInterval(this.callTimer);
            this.callTimer = null;
        }
    }

    leaveCall(): void {
        this.stopCallTimer();
        this.inCall.set(false);
    }

    get formattedCallDuration(): string {
        const total = this.callSeconds();
        const mins = Math.floor(total / 60);
        const secs = total % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    close(): void {
        this.stopCallTimer();
        this.dialogRef.close();
    }
}
