import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { TaskSocketService } from 'app/core/realtime/task-socket.service';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterModule } from '@angular/router';
import { UserService } from 'app/core/user/user.service';
import { User } from 'app/core/user/user.types';
import QRCode from 'qrcode';
import { DigitalCardDialogComponent } from './digital-card-dialog/component';
import { AttendanceDialogComponent } from './attendance-dialog/component';
import { PayrollDialogComponent } from './payroll-dialog/component';
import { CreateProjectDialogComponent } from './create-project-dialog/component';
import { ActiveProjectsDialogComponent } from './active-projects-dialog/component';
import { CreateMeetingDialogComponent } from './create-meeting-dialog/component';
import { HelpSupportDialogComponent } from './help-support-dialog/component';
import { DialogConfigService } from 'app/shared/dialog-config.service';
import { resolveFileUrl } from 'helper/shared/file-url';
import { downloadTaskAttachment } from 'helper/shared/file-download';
import { readPreferredRoleId } from 'app/core/auth/resolvers/role.util';
export * from './home.types';
import { HomeOverviewData, UserHomeService } from './home.service';
import { TaskDrawerComponent } from '../2-task/task-drawer/component';
import { FilePreviewModalComponent } from '../2-task/file-preview-modal/component';
import {
    TaskItem,
    TaskMember,
    TaskChatMessage,
    TaskAttachment,
    TaskStatus,
    TaskPriority,
    TaskType,
    TASK_TYPES_LIST,
    TaskTypeOption,
} from '../2-task/models/task.types';
import { UserTaskService } from '../2-task/task.service';

@Component({
    selector: 'user-home',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatIconModule,
        MatButtonModule,
        MatMenuModule,
        MatTooltipModule,
        MatProgressSpinnerModule,
        MatDialogModule,
        TaskDrawerComponent,
        FilePreviewModalComponent,
    ],
    templateUrl: './template.html',
    styleUrl: './style.scss',
})
export class UserHomeComponent implements OnInit, OnDestroy {
    loading = signal<boolean>(true);
    overview = signal<HomeOverviewData | null>(null);
    currentUser = signal<User | null>(null);
    activeFilter = signal<string>('all');
    cardSide = signal<'front' | 'back'>('front');
    qrCodeDataUrl = signal<string>('');
    avatarVersion = signal<number>(Date.now());
    coverVersion = signal<number>(Date.now());

    // Unified Task Drawer State (matching /member/tasks Image 1)
    selectedTaskDrawerItem = signal<TaskItem | null>(null);
    showTaskDrawer = signal<boolean>(false);
    taskDrawerDialogMode = signal<'details' | 'chat'>('details');
    taskDrawerChatMessages = signal<TaskChatMessage[]>([]);
    allTaskFiles = signal<TaskAttachment[]>([]);
    selectedPreviewImage = signal<string | null>(null);
    selectedPreviewFile = signal<TaskAttachment | null>(null);
    teamMembers = signal<TaskMember[]>([]);

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
        const u: any = this.currentUser() || this.overview()?.user;
        const preferredRoleId = readPreferredRoleId();
        const activeRole = u?.roles?.find((r: any) => r.id === preferredRoleId)
            ?? u?.roles?.find((r: any) => r.id === u?.is_active)
            ?? u?.roles?.[0];

        const roleName = activeRole?.name_kh
            || activeRole?.name_en
            || (activeRole?.slug === 'superadmin' ? 'អភិបាលប្រព័ន្ធ' : activeRole?.slug === 'org_admin' ? 'រដ្ឋបាល' : null)
            || u?.role_name
            || u?.role_name_kh
            || 'សមាជិក';

        const orgName = activeRole?.organization?.name_kh
            || activeRole?.organization?.name_en
            || u?.organization_name
            || u?.organization?.name
            || 'DIGITECHKH';

        this._matDialog.open(DigitalCardDialogComponent, {
            data: {
                user: {
                    ...u,
                    role_name: roleName,
                    organization_name: orgName,
                },
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

    canCreatePlan(): boolean {
        const u: any = this.currentUser() || this._userService.getUser() || this.overview()?.user;
        if (!u) return false;

        const preferredRoleId = readPreferredRoleId();
        const roles = Array.isArray(u.roles) ? u.roles : [];

        let activeRole: any = null;
        if (preferredRoleId) {
            activeRole = roles.find((r: any) => Number(r.id) === preferredRoleId);
        }
        if (!activeRole) {
            activeRole = roles.find((r: any) => r.is_default);
        }
        if (!activeRole && (u.is_active || u.active_role_id)) {
            const activeId = Number(u.is_active || u.active_role_id);
            activeRole = roles.find((r: any) => Number(r.id) === activeId);
        }
        if (!activeRole && roles.length > 0) {
            activeRole = roles[0];
        }

        if (!activeRole) return false;

        const slug = (activeRole.slug || '').toLowerCase().trim();
        const nameEn = (activeRole.name_en || activeRole.name || '').toLowerCase().trim();
        const nameKh = (activeRole.name_kh || '').trim();

        // If acting as regular user, member, or personal workspace, creation is forbidden
        if (slug === 'user' || slug === 'member' || slug === 'personal_workspace' || nameKh === 'អ្នកប្រើប្រាស់') {
            return false;
        }

        const isAdminSlug =
            slug === 'superadmin' ||
            slug === 'super-admin' ||
            slug === 'admin' ||
            slug === 'org_admin' ||
            slug === 'org-admin' ||
            slug === 'owner' ||
            slug === 'org_owner';

        const isAdminName =
            nameEn.includes('admin') ||
            nameEn.includes('owner') ||
            nameEn.includes('super') ||
            nameKh === 'អភិបាលប្រព័ន្ធ' ||
            nameKh === 'រដ្ឋបាល';

        return isAdminSlug || isAdminName;
    }

    openCreateProjectSideDialog(): void {
        if (!this.canCreatePlan()) return;
        const dialogConfig = this._dialogConfigService.getDialogConfig({
            user: this.currentUser() || this.overview()?.user,
            members: this.teamMembers(),
            existingProjects: this.overview()?.active_projects,
            onProjectCreated: () => this.loadOverview(),
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
        private readonly _taskService: UserTaskService,
        private readonly _router: Router,
        private readonly _matDialog: MatDialog,
        private readonly _dialogConfigService: DialogConfigService,
        private readonly _taskSocket: TaskSocketService,
    ) { }

    private readonly _unsubscribeAll = new Subject<any>();

    ngOnInit(): void {
        const initialUser = this._userService.getUser();
        if (initialUser) {
            this.currentUser.set(initialUser);
        }
        this._userService.user$.pipe(takeUntil(this._unsubscribeAll)).subscribe((u) => {
            if (u) {
                this.currentUser.set(u);
                this.avatarVersion.set(Date.now());
                this.coverVersion.set(Date.now());
                this.overview.update((prev) => {
                    if (!prev) return prev;
                    const prevUser = (prev.user || {}) as any;
                    return {
                        ...prev,
                        user: {
                            ...prevUser,
                            ...u,
                            avatar: u.avatar ?? prevUser.avatar,
                            cover: (u as any).cover ?? (u as any).background ?? prevUser.cover ?? prevUser.background,
                        } as any,
                    };
                });
                this.generateMemberQrCode();
            }
        });
        this.generateMemberQrCode();
        this.loadOverview();

        // Real-time task comments & chat updates
        this._taskSocket
            .taskCommentUpdates()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((evt) => {
                const taskId = String(evt.task_id);
                const currentDrawerTask = this.selectedTaskDrawerItem();

                // 1. Live update comments count on recent_tasks in the overview
                this.overview.update((prev) => {
                    if (!prev?.recent_tasks) return prev;
                    return {
                        ...prev,
                        recent_tasks: prev.recent_tasks.map((t) => {
                            if (String(t.id) === taskId) {
                                return {
                                    ...t,
                                    comments_count: evt.comments_count ?? ((t as any).comments_count || 0) + 1,
                                    attachments_count: evt.attachments_count ?? (t as any).attachments_count,
                                } as any;
                            }
                            return t;
                        }),
                    };
                });

                // 2. If drawer is open for this task, append comment
                if (currentDrawerTask && String(currentDrawerTask.id) === taskId) {
                    currentDrawerTask.comments_count = evt.comments_count ?? (currentDrawerTask.comments_count || 0) + 1;
                    if (evt.attachments_count !== undefined) {
                        currentDrawerTask.attachments_count = evt.attachments_count;
                    }

                    const currentUser = this.currentUser() || this._userService.getUser();
                    const isSelf = Boolean(currentUser?.id && evt.comment.sender_id === currentUser.id);

                    const currentMsgs = this.taskDrawerChatMessages();
                    const alreadyExists = currentMsgs.some((m) =>
                        (m.id && evt.comment.id && m.id === evt.comment.id) ||
                        (isSelf && m.text === evt.comment.text && Math.abs(new Date(m.created_at || 0).getTime() - new Date(evt.comment.created_at || 0).getTime()) < 4000)
                    );

                    if (!alreadyExists) {
                        let displayTime = evt.comment.time;
                        if (evt.comment.created_at) {
                            const d = new Date(evt.comment.created_at);
                            if (!isNaN(d.getTime())) {
                                displayTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            }
                        }

                        const incomingMsg: TaskChatMessage = {
                            ...evt.comment,
                            is_self: isSelf,
                            time: displayTime || 'ទើបតែផ្ញើ',
                        };

                        this.taskDrawerChatMessages.update((msgs) => [...msgs, incomingMsg]);
                    }
                }
            });

        this._taskService.getMembers().subscribe({
            next: (res) => {
                if (res?.data) {
                    this.teamMembers.set(res.data);
                }
            },
            error: () => {},
        });

        // The "ការងារខ្ញុំ" pills are counts of live task data, so refetch whenever
        // any task changes — including ones moved by someone else on a board.
        this._taskSocket
            .taskUpdates()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(() => this.loadOverview());
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    loadOverview(): void {
        this._homeService.getOverview().subscribe({
            next: (res) => {
                if (res?.data) {
                    this.overview.set(res.data);
                    if (res.data.user) {
                        const currentUser = (this.currentUser() || {}) as any;
                        const overviewUser = res.data.user as any;
                        const mergedUser = {
                            ...currentUser,
                            ...overviewUser,
                            roles: (currentUser.roles && currentUser.roles.length > 0) ? currentUser.roles : (overviewUser.roles || []),
                            role_name: overviewUser.role_name || currentUser.role_name,
                            role_name_kh: overviewUser.role_name_kh || currentUser.role_name_kh,
                            role_name_en: overviewUser.role_name_en || currentUser.role_name_en,
                            organization_name: overviewUser.organization_name || currentUser.organization_name,
                            avatar: currentUser.avatar || overviewUser.avatar,
                            cover: currentUser.cover || currentUser.background || overviewUser.cover || overviewUser.background,
                            background: currentUser.background || currentUser.cover || overviewUser.background || overviewUser.cover,
                        };
                        this.currentUser.set(mergedUser as any);
                        this._userService.user = mergedUser as any;
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
        const u = this.currentUser() as any;
        const ov = this.overview()?.user as any;
        const avatar =
            u?.avatar ||
            ov?.avatar ||
            u?.avatar_file ||
            ov?.avatar_file;
        const resolved = resolveFileUrl(avatar);
        if (resolved) {
            if (resolved.startsWith('blob:') || resolved.startsWith('data:')) {
                return resolved;
            }
            const sep = resolved.includes('?') ? '&' : '?';
            return `${resolved}${sep}t=${this.avatarVersion()}`;
        }
        if (typeof avatar === 'string' && (avatar.startsWith('http') || avatar.startsWith('data:') || avatar.startsWith('blob:'))) {
            return avatar;
        }
        return '/images/placeholder/avatar.jpg';
    }

    getCoverUrl(): string {
        const u = this.currentUser() as any;
        const ov = this.overview()?.user as any;
        const cover =
            u?.cover ||
            u?.background ||
            u?.background_file ||
            ov?.cover ||
            ov?.background ||
            ov?.background_file;
        const resolved = resolveFileUrl(cover);
        if (resolved) {
            if (resolved.startsWith('blob:') || resolved.startsWith('data:')) {
                return resolved;
            }
            const sep = resolved.includes('?') ? '&' : '?';
            return `${resolved}${sep}t=${this.coverVersion()}`;
        }
        if (typeof cover === 'string' && (cover.startsWith('http') || cover.startsWith('data:') || cover.startsWith('blob:'))) {
            return cover;
        }
        return '/images/placeholder/cover.jpg';
    }

    getLogoUrl(): string {
        const user = (this.currentUser() || this.overview()?.user) as any;
        const role = user?.roles?.find((r: any) => r.is_default) || user?.roles?.[0];
        const logo = role?.organization?.logo || role?.organization?.logo_file;
        const resolved = resolveFileUrl(logo);
        if (resolved) return resolved;
        return 'images/logo/default_logo.png';
    }

    onAvatarError(event: Event): void {
        const img = event.target as HTMLImageElement;
        if (img && !img.src.includes('/images/placeholder/avatar.jpg')) {
            img.src = '/images/placeholder/avatar.jpg';
        }
    }

    getAssigneeAvatar(member: any): string | null {
        if (!member) return null;
        if (member._avatarFailed) return null;

        const cur = (this.currentUser() || this.overview()?.user) as any;
        const curPhone = (cur?.phone || '').replace(/\D/g, '');
        const targetPhone = (((member as any).phone || '') as string).replace(/\D/g, '');

        const curId = cur?.id ? Number(cur.id) : null;
        const memberId = member.id ? Number(member.id) : null;
        const isCurrentUser = Boolean(
            (curId && memberId && curId === memberId) ||
            (!curId && !memberId && curPhone && targetPhone && curPhone === targetPhone)
        );

        if (isCurrentUser) {
            const curAv = this.getAvatarUrl();
            if (curAv && !curAv.includes('placeholder')) {
                return curAv;
            }
        }

        if (member.avatar) {
            if (typeof member.avatar === 'string' && member.avatar.includes('placeholder')) {
                // Ignore placeholder
            } else {
                const resolved = resolveFileUrl(member.avatar);
                if (resolved && !resolved.includes('placeholder')) {
                    return resolved;
                }
            }
        }

        const team = this.teamMembers();
        if (team && team.length > 0) {
            const found = team.find((m) => {
                const mId = m.id ? Number(m.id) : null;
                const mPhone = (((m as any).phone || '') as string).replace(/\D/g, '');
                return (memberId && mId && memberId === mId) ||
                       (targetPhone && mPhone && targetPhone === mPhone);
            });
            if (found?.avatar) {
                const resolved = resolveFileUrl(found.avatar);
                if (resolved && !resolved.includes('placeholder')) {
                    return resolved;
                }
            }
        }

        return null;
    }

    getReporterAvatar(reporter: any): string | null {
        return this.getAssigneeAvatar(reporter);
    }

    getTaskAssignees(task: any): any[] {
        if (!task) return [];
        if (task.assignees && Array.isArray(task.assignees) && task.assignees.length > 0) {
            return task.assignees;
        }
        if (task.assignee && (task.assignee.name || task.assignee.id)) {
            return [task.assignee];
        }
        return [];
    }

    getAssigneeNamesLabel(task: any): string {
        const assignees = this.getTaskAssignees(task);
        if (assignees.length === 0) return 'គ្មានអ្នកទទួលបន្ទុក (Unassigned)';
        return 'អ្នកទទួលបន្ទុក: ' + assignees.map((a: any) => a.name).filter(Boolean).join(', ');
    }

    onMemberAvatarError(event: Event, member?: any): void {
        const target = event.target as HTMLImageElement;
        if (target) {
            target.style.display = 'none';
        }
        if (member) {
            member._avatarFailed = true;
        }
    }

    onCoverError(event: Event): void {
        const img = event.target as HTMLImageElement;
        if (img && !img.src.includes('/images/placeholder/cover.jpg')) {
            img.src = '/images/placeholder/cover.jpg';
        }
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
            case 'unconfirmed':
            case 'todo':
                return 'មិនបញ្ជាក់';
            case 'in_progress':
                return 'កំពុងធ្វើ';
            case 'in_review':
            case 'review':
                return 'ស្នើពិនិត្យ';
            case 'reopened':
                return 'បើកឡើងវិញ';
            case 'done':
            case 'completed':
                return 'បញ្ចប់';
            default:
                return status || 'មិនបញ្ជាក់';
        }
    }

    getStatusIcon(status: string): string {
        switch (status?.toLowerCase()) {
            case 'new':
            case 'pending':
                return 'mdi:clipboard-text-outline';
            case 'confirmed':
                return 'mdi:clipboard-check-outline';
            case 'unconfirmed':
            case 'todo':
                return 'mdi:clipboard-minus-outline';
            case 'in_progress':
                return 'mdi:progress-clock';
            case 'in_review':
            case 'review':
                return 'mdi:magnify';
            case 'reopened':
                return 'mdi:restore';
            case 'done':
            case 'completed':
                return 'mdi:check-circle';
            default:
                return 'mdi:clipboard-outline';
        }
    }

    getStatusClass(status: string): string {
        switch (status?.toLowerCase()) {
            case 'new':
            case 'pending':
                return 'bg-blue-50/90 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200/80 dark:border-blue-800/40';
            case 'confirmed':
                return 'bg-indigo-50/90 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200/80 dark:border-indigo-800/40';
            case 'unconfirmed':
            case 'todo':
                return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
            case 'in_progress':
                return 'bg-amber-50/90 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/80 dark:border-amber-800/40';
            case 'in_review':
            case 'review':
                return 'bg-sky-50/90 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border-sky-200/80 dark:border-sky-800/40';
            case 'reopened':
                return 'bg-rose-50/90 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200/80 dark:border-rose-800/40';
            case 'done':
            case 'completed':
                return 'bg-emerald-50/90 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800/40';
            default:
                return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
        }
    }

    getPriorityClass(priority: string): string {
        switch (priority?.toLowerCase()) {
            case 'urgent':
                return 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40';
            case 'high':
                return 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40';
            case 'medium':
                return 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40';
            default:
                return 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700';
        }
    }

    taskTypes = TASK_TYPES_LIST;

    getTaskTypeInfo(type?: string): TaskTypeOption {
        const found = this.taskTypes.find((t) => t.id === type || t.id.toLowerCase() === type?.toLowerCase());
        return found || this.taskTypes[0];
    }

    getPriorityIcon(priority: string): string {
        switch (priority?.toLowerCase()) {
            case 'urgent':
                return 'mdi:alert-decagram';
            case 'high':
                return 'mdi:arrow-up-bold';
            case 'medium':
                return 'mdi:equal';
            case 'low':
                return 'mdi:arrow-down-bold';
            default:
                return 'mdi:equal';
        }
    }

    getPriorityColor(priority: string): string {
        switch (priority?.toLowerCase()) {
            case 'urgent':
                return 'text-rose-500 dark:text-rose-400';
            case 'high':
                return 'text-amber-500 dark:text-amber-400';
            case 'medium':
                return 'text-blue-500 dark:text-blue-400';
            case 'low':
                return 'text-slate-400 dark:text-slate-500';
            default:
                return 'text-slate-400 dark:text-slate-500';
        }
    }

    getPriorityLabel(priority: string): string {
        switch (priority?.toLowerCase()) {
            case 'urgent':
                return 'បន្ទាន់';
            case 'high':
                return 'ខ្ពស់';
            case 'medium':
                return 'មធ្យម';
            case 'low':
                return 'ទាប';
            default:
                return priority || 'មធ្យម';
        }
    }

    formatDate(dateStr?: string | null): string {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    }

    getTaskDateToDo(dueDateStr?: string | null, createdDateStr?: string | null): string {
        if (dueDateStr) {
            return this.formatDate(dueDateStr);
        }
        if (createdDateStr) {
            const d = new Date(createdDateStr);
            d.setDate(d.getDate() + 7);
            return this.formatDate(d.toISOString());
        }
        return '15/09/2026';
    }

    getDaysRemainingInfo(dueDateStr?: string | null): { text: string; isOverdue: boolean; isToday: boolean; isUpcoming: boolean } {
        if (!dueDateStr) {
            return { text: 'សល់ 7 ថ្ងៃ', isOverdue: false, isToday: false, isUpcoming: true };
        }
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const dueDate = new Date(dueDateStr);
        if (isNaN(dueDate.getTime())) {
            return { text: 'កំណត់រួចរាល់', isOverdue: false, isToday: false, isUpcoming: true };
        }
        dueDate.setHours(0, 0, 0, 0);

        const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
            return { text: 'ហួសកាលកំណត់', isOverdue: true, isToday: false, isUpcoming: false };
        } else if (diffDays === 0) {
            return { text: 'ថ្ងៃនេះ (Today)', isOverdue: false, isToday: true, isUpcoming: false };
        } else {
            return { text: `សល់ ${diffDays} ថ្ងៃ`, isOverdue: false, isToday: false, isUpcoming: true };
        }
    }

    getRelativeTime(dateStr?: string | null): string {
        if (!dateStr) return 'ថ្មីៗនេះ';
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays <= 0) return 'ថ្ងៃនេះ';
        if (diffDays === 1) return 'ម្សិលមិញ';
        if (diffDays < 7) return `${diffDays} ថ្ងៃមុន`;
        const weeks = Math.floor(diffDays / 7);
        if (weeks < 4) return `${weeks} សប្តាហ៍មុន`;
        const months = Math.floor(diffDays / 30);
        return `${months} ខែមុន`;
    }

    updateTaskStatus(task: any, newStatus: string): void {
        const oldStatus = task.status;
        if (oldStatus === newStatus) return;

        task.status = newStatus;
        if (this.selectedTaskDrawerItem()?.id === task.id) {
            this.selectedTaskDrawerItem.update((t) => (t ? { ...t, status: newStatus as TaskStatus } : null));
        }

        this._taskService.updateTask(task.id, { status: newStatus as any }).subscribe({
            next: () => this.loadOverview(),
            error: () => {},
        });
    }

    openTaskChat(task: any, event?: Event): void {
        if (event) {
            event.stopPropagation();
        }
        this.openTaskDrawer(task, 'chat');
    }

    getPriorityVisual(priority: string): { icon: string; color: string } {
        switch (priority?.toLowerCase()) {
            case 'urgent':
                return { icon: 'mdi:alert-octagon', color: 'text-rose-600' };
            case 'high':
                return { icon: 'mdi:arrow-up-bold', color: 'text-amber-600' };
            case 'medium':
                return { icon: 'mdi:equal', color: 'text-blue-600' };
            case 'low':
                return { icon: 'mdi:arrow-down-bold', color: 'text-slate-500' };
            default:
                return { icon: 'mdi:equal', color: 'text-blue-600' };
        }
    }

    getTaskCode(task: any): string {
        if (task.code) return task.code;
        const idNum = String(task.id || '').padStart(4, '0');
        const projPrefix = (task.project_name || '').toUpperCase().includes('WMS') ? 'WMS' : 'BMS';
        return `#${projPrefix}-${idNum}`;
    }

    openTaskDrawer(task: any, mode: 'details' | 'chat' = 'details'): void {
        const currentUser: any = this.currentUser() || this.overview()?.user;
        const currentMember: TaskMember = {
            id: currentUser?.id || 1,
            name: this.getUserKhName() || this.getUserEnName() || 'User',
            avatar: this.getAvatarUrl(),
            role: 'Assignee',
        };

        const drawerTask: TaskItem = {
            id: task.id,
            code: this.getTaskCode(task),
            title: task.title,
            description: task.description || task.title,
            task_type: task.task_type || 'feature',
            status: (task.status || 'new') as TaskStatus,
            priority: ((task.priority || 'medium').toLowerCase()) as TaskPriority,
            progress: task.progress || 0,
            due_date: task.due_date || null,
            project_id: task.project_id || 'bms-digitech',
            project_name: task.project_name || 'BMS Digitech',
            reporter: task.reporter || {
                id: 1,
                name: 'ពិសិដ្ឋ បញ្ញាវ័ន្ត',
                avatar: '/images/placeholder/avatar.jpg',
                role: 'Super Administrator',
            },
            assignee: task.assignee || currentMember,
            assignees: task.assignees || [currentMember],
            created_at: task.created_at || new Date().toISOString(),
            updated_at: task.updated_at || new Date().toISOString(),
            comments_count: task.comments_count || 0,
            attachments_count: task.attachments_count || 0,
        };

        this.selectedTaskDrawerItem.set(drawerTask);
        this.taskDrawerDialogMode.set(mode);
        this.showTaskDrawer.set(true);
        this._taskSocket.joinTask(task.id);

        this._taskService.getTaskComments(task.id).subscribe({
            next: (res) => {
                if (res?.data?.comments && res.data.comments.length > 0) {
                    this.taskDrawerChatMessages.set(res.data.comments);
                } else {
                    this.taskDrawerChatMessages.set([
                        {
                            id: 1,
                            sender_name: 'ប្រព័ន្ធ (System)',
                            text: `កិច្ចការ ${drawerTask.code} ត្រូវបានបង្កើតឡើង`,
                            time: 'ថ្មីៗ',
                            is_self: false,
                            is_system: true,
                        },
                    ]);
                }
            },
            error: () => {
                this.taskDrawerChatMessages.set([
                    {
                        id: 1,
                        sender_name: 'ប្រព័ន្ធ (System)',
                        text: `កិច្ចការ ${drawerTask.code} ត្រូវបានបង្កើតឡើង`,
                        time: 'ថ្មីៗ',
                        is_self: false,
                        is_system: true,
                    },
                ]);
            },
        });
    }

    closeTaskDrawer(): void {
        const cur = this.selectedTaskDrawerItem();
        if (cur?.id) {
            this._taskSocket.leaveTask(cur.id);
        }
        this.showTaskDrawer.set(false);
        this.selectedTaskDrawerItem.set(null);
    }

    onTaskDrawerStatusChange(event: { task: TaskItem; status: string }): void {
        const currentOverview = this.overview();
        if (currentOverview?.recent_tasks) {
            const t = currentOverview.recent_tasks.find((item) => item.id === Number(event.task.id));
            if (t) {
                t.status = event.status;
            }
        }
        this.selectedTaskDrawerItem.update((t) => (t ? { ...t, status: event.status } : null));
        this._taskService.updateTask(event.task.id, { status: event.status }).subscribe({
            next: () => this.loadOverview(),
            error: () => {},
        });
    }

    onTaskDrawerTypeChange(event: { task: TaskItem; taskType: string }): void {
        this.selectedTaskDrawerItem.update((t) => (t ? { ...t, task_type: event.taskType } : null));
        this._taskService.updateTask(event.task.id, { task_type: event.taskType }).subscribe();
    }

    onTaskDrawerPriorityChange(event: { task: TaskItem; priority: string }): void {
        const currentOverview = this.overview();
        if (currentOverview?.recent_tasks) {
            const t = currentOverview.recent_tasks.find((item) => item.id === Number(event.task.id));
            if (t) {
                t.priority = event.priority;
            }
        }
        this.selectedTaskDrawerItem.update((t) => (t ? { ...t, priority: event.priority as any } : null));
        this._taskService.updateTask(event.task.id, { priority: event.priority as any }).subscribe({
            next: () => this.loadOverview(),
            error: () => {},
        });
    }

    onTaskDrawerDueDateChange(event: { task: TaskItem; dueDate: string | null }): void {
        this.selectedTaskDrawerItem.update((t) => (t ? { ...t, due_date: event.dueDate } : null));
        this._taskService.updateTask(event.task.id, { due_date: event.dueDate }).subscribe();
    }

    onTaskDrawerTitleChange(event: { task: TaskItem; title: string }): void {
        const currentOverview = this.overview();
        if (currentOverview?.recent_tasks) {
            const t = currentOverview.recent_tasks.find((item) => item.id === Number(event.task.id));
            if (t) {
                t.title = event.title;
            }
        }
        this.selectedTaskDrawerItem.update((t) => (t ? { ...t, title: event.title } : null));
        this._taskService.updateTask(event.task.id, { title: event.title }).subscribe();
    }

    onTaskDrawerDescriptionChange(event: { task: TaskItem; description: string }): void {
        const currentOverview = this.overview();
        if (currentOverview?.recent_tasks) {
            const t = currentOverview.recent_tasks.find((item) => item.id === Number(event.task.id));
            if (t) {
                t.description = event.description;
            }
        }
        this.selectedTaskDrawerItem.update((t) => (t ? { ...t, description: event.description } : null));
        this._taskService.updateTask(event.task.id, { description: event.description }).subscribe();
    }

    onTaskDrawerAssigneeToggle(event: { task: TaskItem; member: TaskMember }): void {
        this.selectedTaskDrawerItem.update((t) => {
            if (!t) return null;
            const current = t.assignees || [];
            const exists = current.some((a) => a.id === event.member.id);
            const updated = exists ? current.filter((a) => a.id !== event.member.id) : [...current, event.member];
            return {
                ...t,
                assignee: updated[0] || t.assignee,
                assignees: updated,
            };
        });
    }

    onTaskDrawerReporterChange(event: { task: TaskItem; member: TaskMember }): void {
        this.selectedTaskDrawerItem.update((t) => (t ? { ...t, reporter: event.member } : null));
    }

    onTaskDrawerSendMessage(event: { text: string; attachments: TaskAttachment[] }): void {
        const taskId = this.selectedTaskDrawerItem()?.id;
        if (!taskId) return;
        this._taskService.createTaskComment(taskId, { text: event.text, attachments: event.attachments }).subscribe({
            next: (res) => {
                const newMsg: TaskChatMessage = res?.data || {
                    id: Date.now(),
                    sender_name: this.getUserKhName() || this.getUserEnName() || 'ខ្ញុំ (Me)',
                    sender_avatar: this.getAvatarUrl(),
                    text: event.text,
                    time: 'ទើបតែផ្ញើ',
                    is_self: true,
                    is_system: false,
                };
                this.taskDrawerChatMessages.update((msgs) => [...msgs, newMsg]);
            },
            error: () => {
                const newMsg: TaskChatMessage = {
                    id: Date.now(),
                    sender_name: this.getUserKhName() || this.getUserEnName() || 'ខ្ញុំ (Me)',
                    sender_avatar: this.getAvatarUrl(),
                    text: event.text,
                    time: 'ទើបតែផ្ញើ',
                    is_self: true,
                    is_system: false,
                };
                this.taskDrawerChatMessages.update((msgs) => [...msgs, newMsg]);
            },
        });
    }

    viewTaskFile(file: TaskAttachment): void {
        this.selectedPreviewFile.set(file);
        if (file.isImage && file.url) {
            this.selectedPreviewImage.set(file.url);
        }
    }

    openImagePreview(url: string): void {
        this.selectedPreviewImage.set(url);
    }

    downloadTaskFile(file: TaskAttachment): void {
        const cur = this.selectedTaskDrawerItem();
        downloadTaskAttachment(file, {
            projectName: cur?.project_name,
            taskTitle: cur?.title,
            taskCode: cur?.code || (cur?.id ? '#' + cur.id : undefined),
        });
    }

    closeFilePreview(): void {
        this.selectedPreviewFile.set(null);
        this.selectedPreviewImage.set(null);
    }

    onTaskDrawerDelete(task: TaskItem): void {
        this._taskService.deleteTask(task.id).subscribe({
            next: () => {
                this.closeTaskDrawer();
                this.loadOverview();
            },
        });
    }
}
