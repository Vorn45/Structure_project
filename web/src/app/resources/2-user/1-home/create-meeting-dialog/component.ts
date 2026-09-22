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
import { Router } from '@angular/router';


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
    formDate: string = new Date().toISOString().split('T')[0];
    formTime: string = '09:30';
    formDuration: string = '45 នាទី';
    formAgenda: string = '';
    generatedRoomCode: string = '';
    generatedRoomUrl: string = '';
    joinInputCode: string = '';

    // Project selection
    projects: any[] = [];
    selectedProjectId: number | null = null;
    selectedProjectName: string = '';
    selectedProjectMembers: any[] = [];
    projectsLoading = signal<boolean>(false);

    // Telegram notification - Default to true so members are notified
    notifyTelegram = signal<boolean>(true);

    scheduledMeetings = signal<ScheduledMeeting[]>([]);

    constructor(
        public dialogRef: MatDialogRef<CreateMeetingDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: CreateMeetingDialogData,
        private readonly _homeService: UserHomeService,
        private readonly _router: Router,
    ) {
        if (this.data?.projectId) {
            this.selectedProjectId = Number(this.data.projectId);
            this.selectedProjectName = this.data.projectName || '';
        }
        if (this.data?.members) {
            this.selectedProjectMembers = this.data.members;
        }
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

        this._loadProjects();
    }

    ngOnDestroy(): void {
        this.stopCallTimer();
    }

    private _loadProjects(): void {
        this.projectsLoading.set(true);
        this._homeService.getProjects().subscribe({
            next: (res) => {
                const raw = res?.data;
                if (Array.isArray(raw)) {
                    this.projects = raw;
                } else if (raw && Array.isArray((raw as any).results)) {
                    this.projects = (raw as any).results;
                } else if (raw && Array.isArray((raw as any).items)) {
                    this.projects = (raw as any).items;
                } else {
                    this.projects = [];
                }
                if (this.selectedProjectId && !this.selectedProjectName) {
                    const match = this.projects.find((p) => p.id === this.selectedProjectId);
                    if (match) {
                        this.selectedProjectName = match.name || match.kh_name || match.en_name || '';
                        if (!this.selectedProjectMembers.length && match.members) {
                            this.selectedProjectMembers = match.members;
                        }
                    }
                }
                this.projectsLoading.set(false);
            },
            error: () => {
                this.projects = [];
                this.projectsLoading.set(false);
            },
        });
    }

    onProjectChange(projectId: any): void {
        const project = this.projects.find((p) => p.id === projectId);
        this.selectedProjectName = project
            ? project.name || project.kh_name || project.en_name || ''
            : '';
        this.selectedProjectMembers = project?.members || (projectId === this.data?.projectId ? this.data?.members || [] : []);
    }

    generateNewRoomCode(): void {
        const letters = 'abcdefghijklmnopqrstuvwxyz';
        const randLetters = (n: number) =>
            Array.from({ length: n }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
        this.generatedRoomCode = `${randLetters(3)}-${randLetters(4)}-${randLetters(3)}`;
        this.generatedRoomUrl = `https://meet.google.com/${this.generatedRoomCode}`;
    }

    openGoogleMeetNew(): void {
        window.open('https://meet.google.com/new', '_blank');
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

        const orgName =
            this.data?.user?.kh_name ||
            this.data?.user?.en_name ||
            this.data?.user?.name ||
            'អ្នកគ្រប់គ្រង';

        const membersList = (this.selectedProjectMembers && this.selectedProjectMembers.length > 0)
            ? this.selectedProjectMembers
            : (this.data?.members || []);
        const participants = membersList.length > 0
            ? membersList.map((m: any) => ({
                id: m.id,
                name: m.name || m.full_name || m.username || 'Member',
                avatar: m.avatar || null,
                role: m.role || 'Member'
            }))
            : [{ name: orgName, role: 'Organizer' }];

        if (!participants.some((p: any) => p.name === orgName)) {
            participants.unshift({ id: this.data?.user?.id || 1, name: orgName, avatar: null, role: 'Organizer' });
        }

        const meetUrl = (this.generatedRoomUrl && this.generatedRoomUrl.trim())
            ? this.generatedRoomUrl.trim()
            : `https://meet.google.com/${this.generatedRoomCode}`;

        const newMeeting: ScheduledMeeting = {
            id: 'm_' + Date.now(),
            title: this.formTitle.trim(),
            type: 'google',
            date: this.formDate,
            time: this.formTime,
            duration: this.formDuration,
            roomCode: this.generatedRoomCode,
            roomUrl: meetUrl,
            organizer: orgName,
            status: 'upcoming',
            participants,
            agenda: this.formAgenda.trim(),
        };

        const dto: any = {
            ...newMeeting,
            room_code: this.generatedRoomCode,
            room_url: meetUrl,
            project_id: this.selectedProjectId ?? undefined,
            project_name: this.selectedProjectName || undefined,
            notify_telegram: this.notifyTelegram(),
        };

        this._homeService.createMeeting(dto).subscribe({
            next: (res) => {
                const item = res?.data || newMeeting;
                this.scheduledMeetings.update((m) => [item, ...m]);
                this._finishAndNavigate(item);
            },
            error: () => {
                this.scheduledMeetings.update((m) => [newMeeting, ...m]);
                this._finishAndNavigate(newMeeting);
            },
        });
    }

    private _finishAndNavigate(meeting: ScheduledMeeting): void {
        this.successMessage.set(`បានបង្កើតអង្គប្រជុំ «${meeting.title}» ដោយជោគជ័យ!`);
        const pId = this.selectedProjectId || this.data?.projectId;

        setTimeout(() => {
            this.dialogRef.close({ created: true, meeting, projectId: pId });
            if (pId && !this._router.url.includes('/projects')) {
                this._router.navigate(['/member/projects'], {
                    queryParams: { projectId: pId, tab: 'meetings' }
                });
            }
        }, 800);
    }

    deleteMeeting(id: string): void {
        this.scheduledMeetings.update((m) => m.filter((x) => x.id !== id));
        this._homeService.deleteMeeting(id).subscribe({
            error: () => console.error('Failed to delete meeting', id),
        });
    }

    startInstantMeetingDirectly(): void {
        const rand = Math.floor(1000 + Math.random() * 9000);
        this.activeRoomCode.set(`meet-wms-instant-${rand}`);
        this.activeRoomUrl.set(`https://meet.wms.gov.kh/room/meet-wms-instant-${rand}`);
        this.inCall.set(true);
        this.startCallTimer();
    }

    joinScheduledMeeting(meeting: ScheduledMeeting): void {
        if (meeting.roomUrl && (meeting.roomUrl.includes('meet.google.com') || meeting.roomUrl.startsWith('http'))) {
            window.open(meeting.roomUrl, '_blank');
            return;
        }
        this.activeRoomCode.set(meeting.roomCode);
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
