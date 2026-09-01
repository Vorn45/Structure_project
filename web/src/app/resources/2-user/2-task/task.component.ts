import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute } from '@angular/router';
import { TaskItem, UserTaskService } from './task.service';

@Component({
    selector: 'user-tasks',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatIconModule,
        MatButtonModule,
        MatMenuModule,
        MatTooltipModule,
        MatProgressSpinnerModule,
        MatDialogModule,
    ],
    templateUrl: './task.component.html',
})
export class UserTaskComponent implements OnInit {
    loading = signal<boolean>(true);
    tasks = signal<TaskItem[]>([]);
    counts = signal<{ all: number; todo: number; in_progress: number; in_review: number; done: number }>({
        all: 0,
        todo: 0,
        in_progress: 0,
        in_review: 0,
        done: 0,
    });

    viewMode = signal<'list' | 'kanban'>('list');
    activeStatus = signal<string>('all');
    searchQuery = signal<string>('');

    // Quick Task Modal
    showCreateModal = signal<boolean>(false);
    newTaskTitle = '';
    newTaskDescription = '';
    newTaskPriority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
    newTaskDueDate = '';

    constructor(
        private readonly _taskService: UserTaskService,
        private readonly _route: ActivatedRoute,
    ) {}

    ngOnInit(): void {
        this._route.queryParams.subscribe((params) => {
            if (params['status']) {
                this.activeStatus.set(params['status']);
            }
            if (params['view'] && (params['view'] === 'list' || params['view'] === 'kanban')) {
                this.viewMode.set(params['view']);
            }
            this.loadTasks();
        });
    }

    loadTasks(): void {
        this.loading.set(true);
        this._taskService
            .getTasks({
                search: this.searchQuery() || undefined,
                status: this.activeStatus() !== 'all' ? this.activeStatus() : undefined,
            })
            .subscribe({
                next: (res) => {
                    this.tasks.set(res.data.results);
                    this.counts.set(res.data.counts);
                    this.loading.set(false);
                },
                error: (err) => {
                    console.error('Failed to load tasks', err);
                    this.loading.set(false);
                },
            });
    }

    setStatusFilter(status: string): void {
        this.activeStatus.set(status);
        this.loadTasks();
    }

    onSearchChange(): void {
        this.loadTasks();
    }

    updateTaskStatus(task: TaskItem, newStatus: 'todo' | 'in_progress' | 'in_review' | 'done'): void {
        this._taskService.updateTask(task.id, { status: newStatus }).subscribe({
            next: (res) => {
                const updated = this.tasks().map((t) => (t.id === task.id ? res.data : t));
                this.tasks.set(updated);
                this.loadTasks();
            },
        });
    }

    openCreateModal(): void {
        this.newTaskTitle = '';
        this.newTaskDescription = '';
        this.newTaskPriority = 'medium';
        this.newTaskDueDate = '';
        this.showCreateModal.set(true);
    }

    closeCreateModal(): void {
        this.showCreateModal.set(false);
    }

    submitNewTask(): void {
        if (!this.newTaskTitle.trim()) return;

        this._taskService
            .createTask({
                title: this.newTaskTitle.trim(),
                description: this.newTaskDescription.trim(),
                priority: this.newTaskPriority,
                status: 'todo',
                due_date: this.newTaskDueDate || null,
            })
            .subscribe({
                next: () => {
                    this.closeCreateModal();
                    this.loadTasks();
                },
            });
    }

    deleteTask(id: number): void {
        if (!confirm('Are you sure you want to delete this task?')) return;
        this._taskService.deleteTask(id).subscribe({
            next: () => this.loadTasks(),
        });
    }

    getTasksByColumn(status: string): TaskItem[] {
        return this.tasks().filter((t) => t.status === status);
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'done':
                return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40';
            case 'in_progress':
                return 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800/40';
            case 'in_review':
                return 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800/40';
            default:
                return 'bg-slate-50 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 border-slate-200 dark:border-slate-700';
        }
    }

    getPriorityClass(priority: string): string {
        switch (priority) {
            case 'urgent':
                return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40';
            case 'high':
                return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40';
            case 'medium':
                return 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/40';
            default:
                return 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700';
        }
    }
}
