import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

export interface Project {
  id: string;
  name: string;
  activeSprint: {
    name: string;
    startDate: string;
    endDate: string;
  };
  issueCount: number;
  lastUpdated: string;
  teamMembers: string[];
  starred: boolean;
}

interface ProjectAction {
  projectId: string;
  action: 'star' | 'menu';
}

export type ProjectSortOption = 'recent' | 'name' | 'issues' | 'starred';

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
  @Output() projectAction = new EventEmitter<ProjectAction>();
  @Input() sortBy: ProjectSortOption = 'recent';

  navigateToProject(projectId: string) {
    this.router.navigate(['/projects', projectId, 'board']);
  }

  toggleProjectStar(projectId: string) {
    const project = this.projects.find((p) => p.id === projectId);
    if (project) {
      project.starred = !project.starred;
      this.projectAction.emit({ projectId, action: 'star' });
      this.sortProjects();
    }
  }

  private sortProjects() {
    this.filteredProjects = [...this.filteredProjects].sort((a, b) => {
      switch (this.sortBy) {
        case 'recent':
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        case 'issues':
          return b.issueCount - a.issueCount;
        case 'starred':
          return (b.starred ? 1 : 0) - (a.starred ? 1 : 0);
        default:
          return 0;
      }
    });
  }

  getProjectInitials(name: string): string {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  formatSprintDates(sprint: Project['activeSprint']): string {
    if (!sprint) return 'No active sprint';
    const start = new Date(sprint.startDate);
    const end = new Date(sprint.endDate);
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${sprint.name} (${startStr} - ${endStr})`;
  }

  getLeadName(initials: string): string {
    // This would typically come from a user service
    const names: Record<string, string> = {
      JD: 'John Doe',
      SM: 'Sarah Mitchell',
      AK: 'Alex Kumar',
      RK: 'Rachel Kim',
      LM: 'Lisa Martinez',
    };
    return names[initials] || initials;
  }

  openProjectMenu(projectId: string) {
    this.projectAction.emit({ projectId, action: 'menu' });
  }
}
