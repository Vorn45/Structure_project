import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProjectMeetingItem } from '../../projects.types';

@Component({
    selector: 'app-project-meetings-tab',
    standalone: true,
    imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule],
    templateUrl: './meetings-tab.template.html',
    styleUrl: './meetings-tab.style.scss',
})
export class ProjectMeetingsTabComponent {
    meetings = input<ProjectMeetingItem[]>([]);

    createMeeting = output<void>();
    deleteMeeting = output<{ id: string; event: MouseEvent }>();
}
