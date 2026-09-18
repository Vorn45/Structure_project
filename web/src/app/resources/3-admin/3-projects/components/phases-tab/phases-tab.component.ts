import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProjectPhaseItem } from '../../projects.types';

@Component({
    selector: 'app-project-phases-tab',
    standalone: true,
    imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule],
    templateUrl: './phases-tab.template.html',
    styleUrl: './phases-tab.style.scss',
})
export class ProjectPhasesTabComponent {
    phases = input<ProjectPhaseItem[]>([]);
    isAdmin = input<boolean>(false);

    createPhase = output<void>();
    deletePhase = output<{ id: string; event: MouseEvent }>();
}
