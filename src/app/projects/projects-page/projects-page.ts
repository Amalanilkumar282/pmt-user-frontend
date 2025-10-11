import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectHeader } from '../components/project-header/project-header';
import { ProjectFilters } from '../components/project-filters/project-filters';
import { ProjectList, Project, ProjectSortOption } from '../components/project-list/project-list';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Header } from '../../shared/header/header';
import { SidebarStateService } from '../../shared/services/sidebar-state.service';
import { ProjectContextService } from '../../shared/services/project-context.service';

@Component({
  selector: 'app-projects-page',
  standalone: true,
  imports: [CommonModule, ProjectHeader, ProjectFilters, ProjectList, Sidebar, Header],
  templateUrl: './projects-page.html',
  styleUrl: './projects-page.css',
})
export class ProjectsPage implements OnInit {
  private sidebarStateService = inject(SidebarStateService);
  private projectContextService = inject(ProjectContextService);
  isCollapsed = this.sidebarStateService.isCollapsed;

  searchQuery = '';
  currentSort: ProjectSortOption = 'recent';

  private _projects = signal<Project[]>([
    {
      id: '1',
      name: 'Website Redesign',
      activeSprint: {
        name: 'Sprint 1',
        startDate: '2025-10-01',
        endDate: '2025-10-14',
      },
      issueCount: 12,
      lastUpdated: '2025-10-07T10:30:00Z',
      teamMembers: ['JD', 'SM', 'AK'],
      starred: true,
    },
    {
      id: '2',
      name: 'Mobile App Development',
      activeSprint: {
        name: 'Sprint 3',
        startDate: '2025-10-05',
        endDate: '2025-10-19',
      },
      issueCount: 8,
      lastUpdated: '2025-10-06T15:20:00Z',
      teamMembers: ['SM', 'RK'],
      starred: false,
    },
    {
      id: '3',
      name: 'Marketing Campaign',
      activeSprint: {
        name: 'Sprint 2',
        startDate: '2025-09-28',
        endDate: '2025-10-12',
      },
      issueCount: 15,
      lastUpdated: '2025-10-05T09:45:00Z',
      teamMembers: ['AK', 'LM'],
      starred: false,
    },
    {
      id: '4',
      name: 'Backend Infrastructure',
      activeSprint: {
        name: 'Sprint 4',
        startDate: '2025-10-07',
        endDate: '2025-10-21',
      },
      issueCount: 20,
      lastUpdated: '2025-10-07T08:15:00Z',
      teamMembers: ['RK', 'JD'],
      starred: true,
    },
    {
      id: '5',
      name: 'Customer Portal',
      activeSprint: {
        name: 'Sprint 2',
        startDate: '2025-10-03',
        endDate: '2025-10-17',
      },
      issueCount: 10,
      lastUpdated: '2025-10-06T11:00:00Z',
      teamMembers: ['LM', 'SM'],
      starred: false,
    },
  ]);

  readonly projects = this._projects.asReadonly();

  private _filteredProjects = signal<Project[]>([]);
  readonly filteredProjects = this._filteredProjects.asReadonly();

  constructor() {
    this._filteredProjects.set(this._projects());
  }

  ngOnInit(): void {
    // Clear project context when viewing all projects
    this.projectContextService.clearCurrentProjectId();
  }

  toggleProjectStar(projectId: string) {
    const projects = this._projects();
    const project = projects.find((p) => p.id === projectId);
    if (project) {
      this._projects.set(
        projects.map((p) => (p.id === projectId ? { ...p, starred: !p.starred } : p))
      );
    }
  }

  filterProjects() {
    const projects = this._projects();
    this._filteredProjects.set(
      projects
        .filter((project) => {
          if (!this.searchQuery) return true;

          const searchLower = this.searchQuery.toLowerCase();
          return (
            project.name.toLowerCase().includes(searchLower) ||
            project.activeSprint?.name.toLowerCase().includes(searchLower) ||
            String(project.issueCount).includes(searchLower)
          );
        })
        .sort((a, b) => {
          switch (this.currentSort) {
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
        })
    );
  }

  updateSort(sortBy: ProjectSortOption) {
    this.currentSort = sortBy;
    this.filterProjects();
  }

  getLeadName(initials: string): string {
    const names: { [key: string]: string } = {
      JD: 'John Doe',
      SM: 'Sarah Miller',
      AK: 'Alex Kim',
      RK: 'Rachel Kumar',
      LM: 'Luis Martinez',
    };
    return names[initials] || 'Unknown';
  }

  createProject() {
    console.log('Create new project');
    // Implement project creation logic
  }

  openProjectMenu(projectId: string) {
    console.log('Open menu for project:', projectId);
    // Implement project menu logic
  }
}
