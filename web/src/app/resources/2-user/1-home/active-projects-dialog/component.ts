import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { SideDialogCloseButtonComponent } from 'app/shared/side-dialog-close-button/component';
import { UserHomeService } from '../home.service';


export * from './active-projects-dialog.types';
import { ActiveProjectItem } from './active-projects-dialog.types';

@Component({
    selector: 'app-active-projects-dialog',
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
export class ActiveProjectsDialogComponent implements OnInit {
    searchQuery: string = '';

    projects: ActiveProjectItem[] = [];

    constructor(
        public dialogRef: MatDialogRef<ActiveProjectsDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private readonly _router: Router,
        private readonly _homeService: UserHomeService,
    ) { }

    ngOnInit(): void {
        this._homeService.getActiveProjects().subscribe({
            next: (res) => {
                const results = res?.data?.results || (Array.isArray(res?.data) ? res.data : []);
                if (results) {
                    this.projects = results.map((p: any) => ({
                        id: p.id,
                        title: p.name,
                        code: p.code,
                        progress: p.progress,
                        tasksCount: p.total_tasks,
                        completedTasks: p.completed_tasks,
                        status: p.status === 'active' ? 'in_progress' : 'on_track',
                        dueDate: p.end_date ? new Intl.DateTimeFormat('km-KH', { dateStyle: 'medium' }).format(new Date(p.end_date)) : 'មិនកំណត់',
                        members: p.members || [],
                    }));
                }
            },
            error: (err) => {
                console.error('Failed to load active projects', err);
                this.projects = [];
            },
        });
    }

    get filteredProjects(): ActiveProjectItem[] {
        if (!this.searchQuery.trim()) return this.projects;
        const q = this.searchQuery.toLowerCase();
        return this.projects.filter(
            (p) => p.title.toLowerCase().includes(q) || p.code.toLowerCase().includes(q),
        );
    }

    goToAllProjects(): void {
        this.dialogRef.close();
        this._router.navigate(['/member/projects']);
    }
}
