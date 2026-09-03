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
    loading = signal<boolean>(true);
    overview = signal<HomeOverviewData | null>(null);
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
        this._matDialog.open(AttendanceDialogComponent, dialogConfig);
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
        this._matDialog.open(CreateProjectDialogComponent, dialogConfig);
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
        this._matDialog.open(CreateMeetingDialogComponent, dialogConfig);
    }

    openHelpSupportSideDialog(): void {
        const dialogConfig = this._dialogConfigService.getDialogConfig({
            user: this.currentUser() || this.overview()?.user,
        });
        this._matDialog.open(HelpSupportDialogComponent, dialogConfig);
    }

    async generateMemberQrCode(): Promise<void> {
        try {
            const user = this.currentUser() || this.overview()?.user;
            const nameKh = (user as any)?.name_kh || (user as any)?.kh_name || 'ចេង ច័ន្ទបញ្ញា';
            const nameEn = (user as any)?.name_en || (user as any)?.en_name || 'Cheng Chanpanha';
            const phone = user?.phone || '087600064';
            const email = user?.email || 'Chanpanhacheng@gmail.com';
            const id = user?.id || '2';

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
        this.currentUser.set(this._userService.getUser());
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
        this.loading.set(true);
        this._homeService.getOverview().subscribe({
            next: (res) => {
                this.overview.set(res.data);
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Failed to load user home overview', err);
                this.loading.set(false);
            },
        });
    }

    getAvatarUrl(): string {
        const user = this.currentUser();
        if (user?.avatar?.uri && user?.avatar?.file_domain) {
            return user.avatar.file_domain.replace(/\/+$/, '') + '/' + user.avatar.uri.replace(/^\/+/, '');
        }
        return '/images/placeholder/avatar.jpg';
    }

    getCoverUrl(): string {
        const user: any = this.currentUser();
        if (user?.cover?.uri && user?.cover?.file_domain) {
            return user.cover.file_domain.replace(/\/+$/, '') + '/' + user.cover.uri.replace(/^\/+/, '');
        }
        return '/images/placeholder/cover.jpg';
    }

    getLogoUrl(): string {
        const user = this.currentUser();
        const role = user?.roles?.find((r) => r.is_default) || user?.roles?.[0];
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
