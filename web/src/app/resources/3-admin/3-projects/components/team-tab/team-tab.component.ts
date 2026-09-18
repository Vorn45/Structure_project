import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TaskMember } from 'app/resources/2-user/2-task/models/task.types';

@Component({
    selector: 'app-project-team-tab',
    standalone: true,
    imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule],
    templateUrl: './team-tab.template.html',
    styleUrl: './team-tab.style.scss',
})
export class ProjectTeamTabComponent {
    teamMembers = input<TaskMember[]>([]);
    isAdmin = input<boolean>(false);

    createMember = output<void>();
    deleteMember = output<{ id: number; event: MouseEvent }>();
}
