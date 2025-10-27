import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

export interface Project {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  du: string;
  lastUpdated: string;
  teamMembers: string[];
  starred: boolean;
}

interface ProjectAction {
  projectId: string;
  action: 'star';
}

export type ProjectSortOption = 'recent' | 'name' | 'starred' | 'status';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-list.html',
  styleUrl: './project-list.css',
})
export class ProjectList {
  private router = inject(Router);

  @Input() projects: Project[] = [];
  @Input() filteredProjects: Project[] = [];
  @Input() showStarredOnly = false;
  @Output() projectAction = new EventEmitter<ProjectAction>();
  @Output() starFilterToggle = new EventEmitter<void>();

  navigateToProject(projectId: string) {
    this.router.navigate(['/projects', projectId, 'board']);
  }

  toggleProjectStar(projectId: string) {
    this.projectAction.emit({ projectId, action: 'star' });
  }

  toggleStarFilter() {
    this.starFilterToggle.emit();
  }

  getProjectInitials(name: string): string {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  getLeadName(initials: string): string {
    const names: Record<string, string> = {
      JD: 'John Doe',
      SM: 'Sarah Mitchell',
      AK: 'Alex Kumar',
      RK: 'Rachel Kim',
      LM: 'Lisa Martinez',
    };
    return names[initials] || initials;
  }
}
