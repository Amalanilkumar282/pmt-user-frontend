import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProjectContextService } from '../../../shared/services/project-context.service';

export interface Project {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  du: string;
  lastUpdated: string;
  teamMembers: string[];
  starred: boolean;
  projectManagerName?: string | null;
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
  private projectContextService = inject(ProjectContextService);

  @Input() projects: Project[] = [];
  @Input() filteredProjects: Project[] = [];
  @Input() showStarredOnly = false;
  @Output() projectAction = new EventEmitter<ProjectAction>();
  @Output() starFilterToggle = new EventEmitter<void>();

  navigateToProject(projectId: string) {
    // Find the project to get its name
    const project = this.projects.find(p => p.id === projectId);
    const projectName = project?.name || 'Unknown Project';
    
    // Set the current project ID and name in session storage
    this.projectContextService.setCurrentProjectId(projectId, projectName);
    console.log('✅ Navigating to project:', projectId, projectName);
    
    // Navigate to the project board
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

  getManagerInitials(name: string | null | undefined): string {
    if (!name) return 'N/A';
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
}
