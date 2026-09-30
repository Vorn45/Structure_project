import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { env } from 'envs/env';

export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskComment {
    id: string | number;
    author_name: string;
    author_avatar?: string;
    content: string;
    created_at: string;
}

export interface TaskAttachment {
    id: string | number;
    name: string;
    url: string;
    size?: string;
}

export interface MiniAppTask {
    id: string | number;
    code: string;
    title: string;
    title_kh?: string;
    description: string;
    project_name: string;
    status: TaskStatus;
    priority: TaskPriority;
    progress: number;
    due_date: string | null;
    assignee_name: string;
    assignee_role: string;
    assignee_avatar?: string;
    comments_count: number;
    attachments_count: number;
    comments: TaskComment[];
    attachments: TaskAttachment[];
}

export interface MiniAppActivity {
    id: string | number;
    title: string;
    description: string;
    project_name: string;
    hours_spent: number;
    date: string;
    created_at: string;
}

@Component({
    selector: 'app-telegram-mini-app',
    standalone: true,
    imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, RouterModule],
    templateUrl: './template.html',
    styleUrl: './style.scss',
})
export class TelegramMiniAppComponent implements OnInit, OnDestroy {
    // API Configuration
    private readonly apiBaseUrl = env.API_BASE_URL || 'https://wms.digitechkh.site/api';

    // UI State Signals
    isLoading = signal<boolean>(true);
    isLiveConnected = signal<boolean>(false);
    language = signal<'km' | 'en'>('km');
    activeTab = signal<'home' | 'tasks' | 'attendance' | 'activity' | 'profile'>('home');
    selectedTask = signal<MiniAppTask | null>(null);
    isCreateTaskModalOpen = signal<boolean>(false);
    isLogActivityOpen = signal<boolean>(false);

    // Filter & Search
    taskFilter = signal<string>('all');
    searchQuery = signal<string>('');

    // Attendance Punch State
    isClockedIn = signal<boolean>(false);
    clockInTime = signal<string>('08:30 AM');
    elapsedSeconds = signal<number>(0);
    private timerInterval: any = null;

    // Current User
    user = signal<{
        id: number;
        name: string;
        name_kh: string;
        role: string;
        department: string;
        telegram_id?: string;
        telegram_username?: string;
        avatar?: string;
    }>({
        id: 3,
        name: 'PUM BRUSMUNY',
        name_kh: 'ពុំ ប្រុសមុន្នី',
        role: 'Sales Manager',
        department: 'Sales & Planning | V2',
        telegram_id: '1495035256',
        telegram_username: 'brusmunypum',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    });

    // Form Models
    newTask = {
        title: '',
        project_name: 'Cashier / POS System V2',
        priority: 'medium' as TaskPriority,
        due_date: new Date().toISOString().split('T')[0],
        description: '',
    };

    newActivity = {
        title: '',
        project_name: 'Cashier / POS System V2',
        hours_spent: 2,
        description: '',
    };

    commentInput = '';

    // Task List
    tasks = signal<MiniAppTask[]>([
        {
            id: 'WMS-101',
            code: 'TSK-2026-091',
            title: 'ត្រួតពិនិត្យ និងរៀបចំបញ្ជីទំនិញចូលស្តុក POS',
            title_kh: 'ត្រួតពិនិត្យ និងរៀបចំបញ្ជីទំនិញចូលស្តុក POS',
            description: 'ផ្ទៀងផ្ទាត់ចំនួនទំនិញជាក់ស្តែងជាមួយប្រព័ន្ធ POS និងរបាយការណ៍ដឹកជញ្ជូន។',
            project_name: 'Cashier / POS System V2',
            status: 'in_progress',
            priority: 'high',
            progress: 65,
            due_date: '2026-10-02',
            assignee_name: 'Pum Sokha',
            assignee_role: 'Cashier / POS',
            assignee_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            comments_count: 2,
            attachments_count: 2,
            comments: [
                {
                    id: 'c1',
                    author_name: 'Sales Manager',
                    content: 'សូមប្រញាប់ពិនិត្យឱ្យទាន់ម៉ោង ២ រសៀលនេះ។',
                    created_at: '10:15 AM',
                },
                {
                    id: 'c2',
                    author_name: 'Pum Sokha',
                    content: 'បានពិនិត្យរួចរាល់ ៦៥% ហើយបង។',
                    created_at: '11:30 AM',
                },
            ],
            attachments: [
                { id: 'a1', name: 'stock_invoice_sept30.pdf', url: '#', size: '1.2 MB' },
                { id: 'a2', name: 'inventory_photo.jpg', url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=300', size: '2.4 MB' },
            ],
        },
        {
            id: 'WMS-102',
            code: 'TSK-2026-092',
            title: 'រៀបចំផែនការលក់ប្រចាំខែតុលា និង Target',
            title_kh: 'រៀបចំផែនការលក់ប្រចាំខែតុលា និង Target',
            description: 'បែងចែកគោលដៅលក់ទៅតាម Sales Executive ម្នាក់ៗ និងតាមសាខា។',
            project_name: 'Sales Management V2',
            status: 'done',
            priority: 'urgent',
            progress: 100,
            due_date: '2026-09-30',
            assignee_name: 'Vannak Heng',
            assignee_role: 'Sales Manager',
            assignee_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
            comments_count: 1,
            attachments_count: 1,
            comments: [
                {
                    id: 'c3',
                    author_name: 'Director',
                    content: 'ផែនការអនុម័តរួចរាល់។',
                    created_at: '12:47 PM',
                },
            ],
            attachments: [
                { id: 'a3', name: 'sales_target_october.pdf', url: '#', size: '3.1 MB' },
            ],
        },
    ]);

    // Daily Activities
    activities = signal<MiniAppActivity[]>([
        {
            id: 'act-1',
            title: 'ធ្វើការត្រួតពិនិត្យ Stock Inventory POS',
            description: 'ផ្ទៀងផ្ទាត់ចំនួនទំនិញ ៤៥ មុខ នៅក្នុងប្រព័ន្ធ POS V2។',
            project_name: 'Cashier / POS System V2',
            hours_spent: 3.5,
            date: '2026-09-30',
            created_at: '11:45 AM',
        },
    ]);

    // Attendance History
    attendanceHistory = signal<Array<{
        id: number;
        date: string;
        check_in_time: string;
        check_out_time?: string;
        status: string;
        total_hours: string;
        location: string;
    }>>([
        {
            id: 1,
            date: '2026-09-30',
            check_in_time: '08:30 AM',
            status: 'clocked_in',
            total_hours: '4h 17m',
            location: 'Phnom Penh HQ',
        },
    ]);

    constructor(
        private readonly _route: ActivatedRoute,
        private readonly _http: HttpClient,
    ) {}

    ngOnInit(): void {
        this.initTelegram();
        this.startTimer();
        this.syncRealData();

        // Check query parameters for deep linking (e.g. from Telegram button ?startapp=WMS-101)
        this._route.queryParams.subscribe((params) => {
            const taskId = params['startapp'] || params['task_id'] || params['id'];
            if (taskId) {
                const found = this.tasks().find(
                    (t) => String(t.id) === String(taskId) || t.code === taskId || String(t.id).includes(String(taskId)),
                );
                if (found) {
                    this.selectedTask.set(found);
                }
            }
        });

        // Hide splash loader
        setTimeout(() => {
            this.isLoading.set(false);
        }, 1100);
    }

    ngOnDestroy(): void {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
    }

    private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('accessToken');
        return new HttpHeaders({
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        });
    }

    private initTelegram(): void {
        const tg = (window as any).Telegram?.WebApp;
        if (tg) {
            try {
                tg.ready();
                tg.expand();
                tg.enableClosingConfirmation?.();

                const tgUser = tg.initDataUnsafe?.user;
                if (tgUser) {
                    this.user.update((u) => ({
                        ...u,
                        name: `${tgUser.first_name} ${tgUser.last_name || ''}`.trim(),
                        telegram_id: String(tgUser.id),
                        telegram_username: tgUser.username || u.telegram_username,
                        avatar: tgUser.photo_url || u.avatar,
                    }));
                }

                // If Telegram initData is available, authenticate with backend
                if (tg.initData) {
                    this._http
                        .post<any>(
                            `${this.apiBaseUrl}/auth/mini-app`,
                            { init_data: tg.initData },
                        )
                        .subscribe({
                            next: (res) => {
                                const token = res?.token || res?.data?.token || res?.access_token;
                                if (token) {
                                    localStorage.setItem('accessToken', token);
                                    this.isLiveConnected.set(true);
                                    this.fetchRealUserProfile();
                                    this.fetchRealTasks();
                                    this.fetchRealAttendance();
                                    this.fetchRealActivities();
                                }
                            },
                            error: () => {
                                // Fallback to cached token if already logged in
                                this.fetchRealTasks();
                                this.fetchRealAttendance();
                            },
                        });
                }
            } catch (e) {
                console.warn('Telegram WebApp init error:', e);
            }
        }
    }

    private syncRealData(): void {
        const token = localStorage.getItem('accessToken');
        if (token) {
            this.isLiveConnected.set(true);
            this.fetchRealUserProfile();
            this.fetchRealTasks();
            this.fetchRealAttendance();
            this.fetchRealActivities();
        }
    }

    private fetchRealUserProfile(): void {
        this._http
            .get<any>(`${this.apiBaseUrl}/account/profile`, { headers: this.getAuthHeaders() })
            .subscribe({
                next: (res) => {
                    const u = res?.data || res;
                    if (u) {
                        this.user.set({
                            id: u.id || this.user().id,
                            name: u.name_en || u.name || this.user().name,
                            name_kh: u.name_kh || this.user().name_kh,
                            role: u.roles?.[0]?.name || u.role || this.user().role,
                            department: u.department || 'Digitech WFM',
                            telegram_id: u.telegram_id || this.user().telegram_id,
                            telegram_username: u.telegram_username || this.user().telegram_username,
                            avatar: u.avatar_url || this.user().avatar,
                        });
                    }
                },
                error: (e) => console.log('Profile sync note:', e.message),
            });
    }

    private fetchRealTasks(): void {
        this._http
            .get<any>(`${this.apiBaseUrl}/user/task?limit=50`, { headers: this.getAuthHeaders() })
            .subscribe({
                next: (res) => {
                    const items = res?.data?.results || res?.data || [];
                    if (Array.isArray(items) && items.length > 0) {
                        const mapped: MiniAppTask[] = items.map((t: any) => ({
                            id: t.id,
                            code: t.code || `TSK-${t.id}`,
                            title: t.title || 'Untitled Task',
                            title_kh: t.title_kh || t.title,
                            description: t.description || '',
                            project_name: t.project_name || t.project?.name || 'WMS Digitech',
                            status: (t.status || 'todo').toLowerCase() as TaskStatus,
                            priority: (t.priority || 'medium').toLowerCase() as TaskPriority,
                            progress: Number(t.progress || 0),
                            due_date: t.due_date ? t.due_date.split('T')[0] : null,
                            assignee_name: t.assignee?.name || t.assignee_name || this.user().name,
                            assignee_role: t.assignee?.role || this.user().role,
                            assignee_avatar: t.assignee?.avatar || this.user().avatar,
                            comments_count: t.comments_count || (t.comments?.length || 0),
                            attachments_count: t.attachments_count || (t.attachments?.length || 0),
                            comments: t.comments || [],
                            attachments: t.attachments || [],
                        }));
                        this.tasks.set(mapped);
                    }
                },
                error: (e) => console.log('Task sync note:', e.message),
            });
    }

    private fetchRealAttendance(): void {
        this._http
            .get<any>(`${this.apiBaseUrl}/user/home/attendance`, { headers: this.getAuthHeaders() })
            .subscribe({
                next: (res) => {
                    const data = res?.data || res;
                    if (data?.is_clocked_in !== undefined) {
                        this.isClockedIn.set(Boolean(data.is_clocked_in));
                        if (data.clock_in_time) {
                            this.clockInTime.set(data.clock_in_time);
                        }
                    }
                },
                error: (e) => console.log('Attendance sync note:', e.message),
            });
    }

    private fetchRealActivities(): void {
        this._http
            .get<any>(`${this.apiBaseUrl}/user/activity`, { headers: this.getAuthHeaders() })
            .subscribe({
                next: (res) => {
                    const items = res?.data?.results || res?.data || [];
                    if (Array.isArray(items) && items.length > 0) {
                        this.activities.set(
                            items.map((a: any) => ({
                                id: a.id,
                                title: a.title,
                                description: a.description || '',
                                project_name: a.project_name || 'WMS Digitech',
                                hours_spent: a.hours_spent || 2,
                                date: a.date || new Date().toISOString().split('T')[0],
                                created_at: a.created_at ? new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today',
                            })),
                        );
                    }
                },
                error: (e) => console.log('Activity sync note:', e.message),
            });
    }

    private startTimer(): void {
        this.timerInterval = setInterval(() => {
            if (this.isClockedIn()) {
                this.elapsedSeconds.update((s) => s + 1);
            }
        }, 1000);
    }

    triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' = 'light'): void {
        const tg = (window as any).Telegram?.WebApp;
        if (tg?.HapticFeedback) {
            if (type === 'success' || type === 'warning') {
                tg.HapticFeedback.notificationOccurred(type);
            } else {
                tg.HapticFeedback.impactOccurred(type);
            }
        }
    }

    toggleLanguage(): void {
        this.triggerHaptic('light');
        this.language.update((l) => (l === 'km' ? 'en' : 'km'));
    }

    setTab(tab: 'home' | 'tasks' | 'attendance' | 'activity' | 'profile'): void {
        this.triggerHaptic('light');
        this.activeTab.set(tab);
    }

    openTask(task: MiniAppTask): void {
        this.triggerHaptic('medium');
        this.selectedTask.set(task);
    }

    closeTaskModal(): void {
        this.triggerHaptic('light');
        this.selectedTask.set(null);
    }

    updateStatus(taskId: string | number, status: TaskStatus): void {
        this.triggerHaptic('success');
        const progress = status === 'done' ? 100 : status === 'in_progress' ? 50 : 0;

        // Local state update
        this.tasks.update((items) =>
            items.map((t) => {
                if (t.id === taskId) {
                    const updated = { ...t, status, progress };
                    if (this.selectedTask()?.id === taskId) {
                        this.selectedTask.set(updated);
                    }
                    return updated;
                }
                return t;
            }),
        );

        // Real API call
        this._http
            .patch(`${this.apiBaseUrl}/user/task/${taskId}`, { status, progress }, { headers: this.getAuthHeaders() })
            .subscribe({
                next: () => console.log(`Task ${taskId} status synced to backend`),
                error: (err) => console.log('Status sync error:', err.message),
            });
    }

    onProgressSliderChange(event: Event): void {
        const target = event.target as HTMLInputElement;
        const task = this.selectedTask();
        if (target && task) {
            this.updateProgress(task.id, Number(target.value));
        }
    }

    updateProgress(taskId: string | number, progress: number): void {
        this.triggerHaptic('light');
        const newStatus: TaskStatus = progress === 100 ? 'done' : progress > 0 ? 'in_progress' : 'todo';

        this.tasks.update((items) =>
            items.map((t) => {
                if (t.id === taskId) {
                    const updated = { ...t, progress, status: newStatus };
                    if (this.selectedTask()?.id === taskId) {
                        this.selectedTask.set(updated);
                    }
                    return updated;
                }
                return t;
            }),
        );

        this._http
            .patch(`${this.apiBaseUrl}/user/task/${taskId}`, { progress, status: newStatus }, { headers: this.getAuthHeaders() })
            .subscribe({
                next: () => console.log(`Task ${taskId} progress synced`),
                error: (e) => console.log('Progress sync note:', e.message),
            });
    }

    addComment(taskId: string | number): void {
        if (!this.commentInput.trim()) return;
        this.triggerHaptic('medium');
        const content = this.commentInput.trim();
        const comment: TaskComment = {
            id: Date.now().toString(),
            author_name: this.user().name,
            author_avatar: this.user().avatar,
            content,
            created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        this.tasks.update((items) =>
            items.map((t) => {
                if (t.id === taskId) {
                    const updatedComments = [...t.comments, comment];
                    const updated = { ...t, comments: updatedComments, comments_count: updatedComments.length };
                    if (this.selectedTask()?.id === taskId) {
                        this.selectedTask.set(updated);
                    }
                    return updated;
                }
                return t;
            }),
        );
        this.commentInput = '';

        this._http
            .post(`${this.apiBaseUrl}/user/task/${taskId}/comments`, { content }, { headers: this.getAuthHeaders() })
            .subscribe({
                next: () => console.log('Comment synced to backend'),
                error: (e) => console.log('Comment sync note:', e.message),
            });
    }

    createTask(): void {
        if (!this.newTask.title.trim()) return;
        this.triggerHaptic('success');
        const task: MiniAppTask = {
            id: `WMS-${Date.now().toString().slice(-3)}`,
            code: `TSK-${Date.now().toString().slice(-4)}`,
            title: this.newTask.title,
            title_kh: this.newTask.title,
            description: this.newTask.description,
            project_name: this.newTask.project_name,
            status: 'todo',
            priority: this.newTask.priority,
            progress: 0,
            due_date: this.newTask.due_date,
            assignee_name: this.user().name,
            assignee_role: this.user().role,
            assignee_avatar: this.user().avatar,
            comments_count: 0,
            attachments_count: 0,
            comments: [],
            attachments: [],
        };
        this.tasks.update((prev) => [task, ...prev]);

        this._http
            .post(`${this.apiBaseUrl}/user/task`, {
                title: this.newTask.title,
                description: this.newTask.description,
                priority: this.newTask.priority,
                due_date: this.newTask.due_date,
            }, { headers: this.getAuthHeaders() })
            .subscribe({
                next: () => this.fetchRealTasks(),
                error: (e) => console.log('Create task sync note:', e.message),
            });

        this.newTask.title = '';
        this.newTask.description = '';
        this.isCreateTaskModalOpen.set(false);
    }

    clockIn(): void {
        this.triggerHaptic('success');
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        this.isClockedIn.set(true);
        this.clockInTime.set(timeStr);
        this.elapsedSeconds.set(0);

        // Send real check-in to backend
        this._http
            .post(`${this.apiBaseUrl}/user/home/attendance/check-in`, {
                latitude: 11.5564,
                longitude: 104.9282,
                location: 'Phnom Penh HQ',
            }, { headers: this.getAuthHeaders() })
            .subscribe({
                next: () => console.log('Real Check-In recorded in WFM'),
                error: (e) => console.log('Check-in sync note:', e.message),
            });
    }

    clockOut(): void {
        this.triggerHaptic('warning');
        this.isClockedIn.set(false);

        // Send real check-out to backend
        this._http
            .post(`${this.apiBaseUrl}/user/home/attendance/check-out`, {
                latitude: 11.5564,
                longitude: 104.9282,
                location: 'Phnom Penh HQ',
            }, { headers: this.getAuthHeaders() })
            .subscribe({
                next: () => console.log('Real Check-Out recorded in WFM'),
                error: (e) => console.log('Check-out sync note:', e.message),
            });
    }

    logActivity(): void {
        if (!this.newActivity.title.trim()) return;
        this.triggerHaptic('success');
        const act: MiniAppActivity = {
            id: `act-${Date.now()}`,
            title: this.newActivity.title,
            description: this.newActivity.description,
            project_name: this.newActivity.project_name,
            hours_spent: Number(this.newActivity.hours_spent),
            date: new Date().toISOString().split('T')[0],
            created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        this.activities.update((prev) => [act, ...prev]);

        this._http
            .post(`${this.apiBaseUrl}/user/activity`, {
                title: this.newActivity.title,
                description: this.newActivity.description,
                hours_spent: Number(this.newActivity.hours_spent),
                project_name: this.newActivity.project_name,
            }, { headers: this.getAuthHeaders() })
            .subscribe({
                next: () => console.log('Activity logged to backend'),
                error: (e) => console.log('Activity sync note:', e.message),
            });

        this.newActivity.title = '';
        this.newActivity.description = '';
        this.isLogActivityOpen.set(false);
    }

    formatTimer(totalSec: number): string {
        const hrs = Math.floor(totalSec / 3600);
        const mins = Math.floor((totalSec % 3600) / 60);
        const secs = totalSec % 60;
        return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    get filteredTasks(): MiniAppTask[] {
        const filter = this.taskFilter();
        const query = this.searchQuery().toLowerCase();
        return this.tasks().filter((task) => {
            const matchesFilter = filter === 'all' || task.status === filter;
            const matchesSearch =
                task.title.toLowerCase().includes(query) ||
                (task.title_kh && task.title_kh.includes(query)) ||
                task.code.toLowerCase().includes(query) ||
                task.project_name.toLowerCase().includes(query);
            return matchesFilter && matchesSearch;
        });
    }

    get urgentTasks(): MiniAppTask[] {
        return this.tasks().filter((t) => t.priority === 'urgent' || t.priority === 'high');
    }

    get inProgressCount(): number {
        return this.tasks().filter((t) => t.status === 'in_progress').length;
    }

    get doneCount(): number {
        return this.tasks().filter((t) => t.status === 'done').length;
    }
}
