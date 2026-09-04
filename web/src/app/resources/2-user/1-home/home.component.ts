import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterModule } from '@angular/router';
import { UserService } from 'app/core/user/user.service';
import { User } from 'app/core/user/user.types';
import QRCode from 'qrcode';
import { DigitalCardDialogComponent } from './digital-card-dialog/digital-card-dialog.component';
import { AttendanceDialogComponent } from './attendance-dialog/attendance-dialog.component';
import { PayrollDialogComponent } from './payroll-dialog/payroll-dialog.component';
import { CreateProjectDialogComponent } from './create-project-dialog/create-project-dialog.component';
import { ActiveProjectsDialogComponent } from './active-projects-dialog/active-projects-dialog.component';
import { CreateMeetingDialogComponent } from './create-meeting-dialog/create-meeting-dialog.component';
import { HelpSupportDialogComponent } from './help-support-dialog/help-support-dialog.component';
import { DialogConfigService } from 'app/shared/dialog-config.service';
import { HomeOverviewData, UserHomeService } from './home.service';

const DEFAULT_OVERVIEW_DATA: HomeOverviewData = {
    user: {
        id: 1,
        name_en: 'CHENG CHANPANHA',
        name_kh: 'ចេង ច័ន្ទបញ្ញា',
        email: 'Chanpanhacheng@gmail.com',
        phone: '087600064',
        active_role_id: 1,
        organization_id: null,
    },
    metrics: {
        total_tasks: 12,
        pending_tasks: 4,
        in_progress_tasks: 5,
        completed_tasks: 3,
        overdue_tasks: 1,
        high_priority: 2,
        medium_priority: 7,
        low_priority: 3,
        completion_rate: 25,
    },
    recent_tasks: [
        {
            id: 101,
            title: 'Complete System Architecture Review',
            status: 'in_progress',
            priority: 'high',
            due_date: new Date(Date.now() + 86400000 * 2).toISOString(),
            progress: 60,
            project_name: 'PMS Upgrade V2',
        },
        {
            id: 102,
            title: 'Refactor Authentication & Passkey Service',
            status: 'in_progress',
            priority: 'medium',
            due_date: new Date(Date.now() + 86400000 * 4).toISOString(),
            progress: 40,
            project_name: 'PMS Upgrade V2',
        },
        {
            id: 104,
            title: 'Setup Notification & Realtime WebSocket Gateway',
            status: 'new',
            priority: 'high',
            due_date: new Date(Date.now() + 86400000 * 7).toISOString(),
            progress: 0,
            project_name: 'PMS Upgrade V2',
        },
    ],
    active_projects: [
        {
            id: 'proj-001',
            name: 'PMS Upgrade V2',
            total_tasks: 24,
            completed_tasks: 14,
            progress: 58,
            members_count: 8,
            status: 'active',
        },
        {
            id: 'proj-002',
            name: 'Design System & UI Library',
            total_tasks: 12,
            completed_tasks: 9,
            progress: 75,
            members_count: 5,
            status: 'active',
        },
    ],
};

@Component({
    selector: 'user-home',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatIconModule,
        MatButtonModule,
        MatTooltipModule,
        MatProgressSpinnerModule,
        MatDialogModule,
    ],
    templateUrl: './home.component.html',
})
export class UserHomeComponent implements OnInit {
    loading = signal<boolean>(false);
    overview = signal<HomeOverviewData | null>(DEFAULT_OVERVIEW_DATA);
    currentUser = signal<User | null>(null);
    activeFilter = signal<string>('all');
    cardSide = signal<'front' | 'back'>('front');
    qrCodeDataUrl = signal<string>('');

    toggleCardSide(): void {
        this.cardSide.update((s) => (s === 'front' ? 'back' : 'front'));
    }

    setCardSide(side: 'front' | 'back'): void {
        this.cardSide.set(side);
    }

    scrollCards(direction: 'left' | 'right'): void {
        const el = document.getElementById('statCardTrack');
        if (el) {
            const scrollAmount = direction === 'left' ? -400 : 400;
            el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    }

    openDigitalCardDialog(): void {
        this._matDialog.open(DigitalCardDialogComponent, {
            data: {
                user: this.currentUser() || this.overview()?.user,
                avatarUrl: this.getAvatarUrl(),
            },
            maxWidth: '95vw',
        });
    }

    openAttendanceDialog(): void {
        const dialogConfig = this._dialogConfigService.getDialogConfig({
            user: this.currentUser() || this.overview()?.user,
        });
        const dialogRef = this._matDialog.open(AttendanceDialogComponent, dialogConfig);
        dialogRef.afterClosed().subscribe((res) => {
            if (res) this.loadOverview();
        });
    }

    openPayrollDialog(): void {
        const dialogConfig = this._dialogConfigService.getDialogConfig({
            user: this.currentUser() || this.overview()?.user,
        });
        this._matDialog.open(PayrollDialogComponent, dialogConfig);
    }

    openCreateProjectSideDialog(): void {
        const dialogConfig = this._dialogConfigService.getDialogConfig({
            user: this.currentUser() || this.overview()?.user,
        });
        const dialogRef = this._matDialog.open(CreateProjectDialogComponent, dialogConfig);
        dialogRef.afterClosed().subscribe((res) => {
            if (res?.created) {
                this.loadOverview();
            }
        });
    }

    openActiveProjectsSideDialog(): void {
        const dialogConfig = this._dialogConfigService.getDialogConfig({
            user: this.currentUser() || this.overview()?.user,
        });
        this._matDialog.open(ActiveProjectsDialogComponent, dialogConfig);
    }

    openCreateMeetingSideDialog(): void {
        const dialogConfig = this._dialogConfigService.getDialogConfig({
            user: this.currentUser() || this.overview()?.user,
        });
        const dialogRef = this._matDialog.open(CreateMeetingDialogComponent, dialogConfig);
        dialogRef.afterClosed().subscribe((res) => {
            if (res?.created) {
                this.loadOverview();
            }
        });
    }

    openHelpSupportSideDialog(): void {
        const dialogConfig = this._dialogConfigService.getDialogConfig({
            user: this.currentUser() || this.overview()?.user,
        });
        this._matDialog.open(HelpSupportDialogComponent, dialogConfig);
    }

    getUserKhName(): string {
        const u: any = this.currentUser() || this.overview()?.user;
        return u?.kh_name || u?.name_kh || u?.en_name || u?.name_en || '';
    }

    getUserEnName(): string {
        const u: any = this.currentUser() || this.overview()?.user;
        return u?.en_name || u?.name_en || '';
    }

    getUserPhone(): string {
        const u: any = this.currentUser() || this.overview()?.user;
        return u?.phone || '';
    }

    getUserEmail(): string {
        const u: any = this.currentUser() || this.overview()?.user;
        return u?.email || '';
    }

    async generateMemberQrCode(): Promise<void> {
        try {
            const u: any = this.currentUser() || this.overview()?.user;
            const nameKh = this.getUserKhName();
            const nameEn = this.getUserEnName();
            const phone = this.getUserPhone();
            const email = this.getUserEmail();
            const id = u?.id || '';

            const origin = window.location.origin;
            const verifyUrl = `${origin}/#/verify/member?id=${id}&code=${phone}&name_kh=${encodeURIComponent(nameKh)}&name_en=${encodeURIComponent(nameEn)}&phone=${phone}&email=${encodeURIComponent(email)}`;

            const qr = await QRCode.toDataURL(verifyUrl, {
                width: 220,
                margin: 0,
                errorCorrectionLevel: 'M',
                color: {
                    dark: '#0f284e',
                    light: '#ffffff',
                },
            });
            this.qrCodeDataUrl.set(qr);
        } catch {
            // fallback
        }
    }


    constructor(
        private readonly _homeService: UserHomeService,
        private readonly _userService: UserService,
        private readonly _router: Router,
        private readonly _matDialog: MatDialog,
        private readonly _dialogConfigService: DialogConfigService,
    ) { }

    ngOnInit(): void {
        const initialUser = this._userService.getUser();
        if (initialUser) {
            this.currentUser.set(initialUser);
        }
        this._userService.user$.subscribe((u) => {
            if (u) {
                this.currentUser.set(u);
                this.generateMemberQrCode();
            }
        });
        this.generateMemberQrCode();
        this.loadOverview();
    }

    loadOverview(): void {
        this._homeService.getOverview().subscribe({
            next: (res) => {
                if (res?.data) {
                    this.overview.set(res.data);
                    if (!this.currentUser() && res.data.user) {
                        this.currentUser.set(res.data.user as any);
                    }
                    this.generateMemberQrCode();
                }
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Failed to load user home overview', err);
                this.loading.set(false);
            },
        });
    }

    getAvatarUrl(): string {
        const user: any = this.currentUser() || this.overview()?.user;
        const avatar = user?.avatar;
        if (avatar?.uri && avatar?.file_domain) {
            return `${avatar.file_domain.replace(/\/+$/, '')}/${avatar.uri.replace(/^\/+/, '')}`;
        }
        if (typeof avatar === 'string' && avatar.startsWith('http')) {
            return avatar;
        }
        return '/images/placeholder/avatar.jpg';
    }

    getCoverUrl(): string {
        const user: any = this.currentUser() || this.overview()?.user;
        const cover = user?.cover || user?.background_file;
        if (cover?.uri && cover?.file_domain) {
            return `${cover.file_domain.replace(/\/+$/, '')}/${cover.uri.replace(/^\/+/, '')}`;
        }
        if (typeof cover === 'string' && cover.startsWith('http')) {
            return cover;
        }
        return '/images/placeholder/cover.jpg';
    }

    getLogoUrl(): string {
        const user: any = this.currentUser() || this.overview()?.user;
        const role = user?.roles?.find((r: any) => r.is_default) || user?.roles?.[0];
        const logo = role?.organization?.logo;
        if (logo?.uri && logo?.file_domain) {
            return `${logo.file_domain.replace(/\/+$/, '')}/${logo.uri.replace(/^\/+/, '')}`;
        }
        return 'images/logo/plan_logo.png';
    }

    setFilter(filter: string): void {
        this.activeFilter.set(filter);
    }

    navigateToTasks(statusFilter?: string): void {
        this._router.navigate(['/member/tasks'], {
            queryParams: statusFilter && statusFilter !== 'all' ? { status: statusFilter } : {},
        });
    }

    navigateToProjects(): void {
        this._router.navigate(['/member/projects']);
    }

    navigateToReports(): void {
        this._router.navigate(['/member/reports']);
    }

    navigateToSettings(): void {
        this._router.navigate(['/profile']);
    }

    getFilteredTasks() {
        const tasks = this.overview()?.recent_tasks || [];
        const filter = this.activeFilter();
        if (filter === 'all') return tasks;
        if (filter === 'today') return tasks;
        if (filter === 'urgent') return tasks.filter((t) => t.priority === 'urgent' || t.priority === 'high');
        if (filter === 'pending') return tasks.filter((t) => t.status === 'pending' || t.status === 'new' || t.status === 'todo');
        if (filter === 'todo') return tasks.filter((t) => t.status === 'todo' || t.status === 'unconfirmed');
        if (filter === 'in_progress') return tasks.filter((t) => t.status === 'in_progress');
        if (filter === 'in_review' || filter === 'review') return tasks.filter((t) => t.status === 'in_review' || t.status === 'review');
        if (filter === 'reopened') return tasks.filter((t) => t.status === 'reopened');
        if (filter === 'done' || filter === 'completed') return tasks.filter((t) => t.status === 'completed' || t.status === 'done');
        return tasks;
    }

    getStatusLabel(status: string): string {
        switch (status?.toLowerCase()) {
            case 'new':
            case 'pending':
                return 'ថ្មី';
            case 'confirmed':
                return 'បញ្ជាក់';
            case 'todo':
            case 'unconfirmed':
                return 'មិនទាន់ធ្វើ';
            case 'in_progress':
                return 'កំពុងធ្វើ';
            case 'in_review':
            case 'review':
                return 'ស្នើសុំពិនិត្យ';
            case 'reopened':
                return 'បើកឡើងវិញ';
            case 'completed':
            case 'done':
                return 'បញ្ចប់';
            default:
                return status || 'មិនបញ្ជាក់';
        }
    }

    getStatusIcon(status: string): string {
        switch (status?.toLowerCase()) {
            case 'new':
            case 'pending':
                return 'mdi:plus-circle-outline';
            case 'confirmed':
                return 'mdi:checkbox-marked-circle-outline';
            case 'todo':
            case 'unconfirmed':
                return 'mdi:clock-outline';
            case 'in_progress':
                return 'mdi:clock-outline';
            case 'in_review':
            case 'review':
                return 'mdi:eye-outline';
            case 'reopened':
                return 'mdi:refresh';
            case 'completed':
            case 'done':
                return 'mdi:check-circle-outline';
            default:
                return 'mdi:clock-outline';
        }
    }

    getStatusClass(status: string): string {
        switch (status?.toLowerCase()) {
            case 'new':
            case 'pending':
            case 'confirmed':
                return 'bg-blue-50/80 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800/40';
            case 'todo':
            case 'unconfirmed':
                return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
            case 'in_progress':
                return 'bg-amber-50/80 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800/40';
            case 'in_review':
            case 'review':
                return 'bg-blue-50/80 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800/40';
            case 'reopened':
                return 'bg-amber-50/80 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800/40';
            case 'completed':
            case 'done':
                return 'bg-emerald-50/80 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40';
            default:
                return 'bg-slate-50 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 border-slate-200 dark:border-slate-700';
        }
    }

    getPriorityClass(priority: string): string {
        switch (priority) {
            case 'urgent':
            case 'high':
                return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30';
            case 'medium':
                return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30';
            default:
                return 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800';
        }
    }
}
