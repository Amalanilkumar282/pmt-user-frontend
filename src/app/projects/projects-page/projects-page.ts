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
  showStarredOnly = false;
  selectedStatus = 'all';
  selectedDU = 'all';

  private _projects = signal<Project[]>([
    {
      id: '1',
      name: 'Website Redesign',
      status: 'active',
      du: 'ATC',
      lastUpdated: '2025-10-07T10:30:00Z',
      teamMembers: ['JD', 'SM', 'AK'],
      starred: true,
    },
    {
      id: '2',
      name: 'Mobile App Development',
      status: 'active',
      du: 'DES',
      lastUpdated: '2025-10-06T15:20:00Z',
      teamMembers: ['SM', 'RK'],
      starred: false,
    },
    {
      id: '3',
      name: 'Marketing Campaign',
      status: 'inactive',
      du: 'RWA',
      lastUpdated: '2025-10-05T09:45:00Z',
      teamMembers: ['AK', 'LM'],
      starred: false,
    },
    {
      id: '4',
      name: 'Backend Infrastructure',
      status: 'active',
      du: 'DTS',
      lastUpdated: '2025-10-07T08:15:00Z',
      teamMembers: ['RK', 'JD'],
      starred: true,
    },
    {
      id: '5',
      name: 'Customer Portal',
      status: 'active',
      du: 'ATC',
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
    this._projects.set(
      projects.map((p) => (p.id === projectId ? { ...p, starred: !p.starred } : p))
    );
    this.filterProjects();
  }

  toggleStarredFilter() {
    this.showStarredOnly = !this.showStarredOnly;
    this.filterProjects();
  }

  filterProjects() {
    const projects = this._projects();
    this._filteredProjects.set(
      projects
        .filter((project) => {
          // Filter by starred if toggled
          if (this.showStarredOnly && !project.starred) {
            return false;
          }

          // Filter by status
          if (this.selectedStatus !== 'all' && project.status !== this.selectedStatus) {
            return false;
          }

          // Filter by DU
          if (this.selectedDU !== 'all' && project.du !== this.selectedDU) {
            return false;
          }

          // Filter by search query
          if (!this.searchQuery) return true;

          const searchLower = this.searchQuery.toLowerCase();
          return (
            project.name.toLowerCase().includes(searchLower) ||
            project.status.toLowerCase().includes(searchLower) ||
            project.du.toLowerCase().includes(searchLower)
          );
        })
        .sort((a, b) => {
          switch (this.currentSort) {
            case 'recent':
              return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
            case 'name':
              return a.name.localeCompare(b.name);
            case 'status':
              return a.status.localeCompare(b.status);
            case 'starred':
              return (b.starred ? 1 : 0) - (a.starred ? 1 : 0);
            default:
              return 0;
          }
        })
    );
  }

  onStatusFilterChange(status: string) {
    this.selectedStatus = status;
    this.filterProjects();
  }

  onDUFilterChange(du: string) {
    this.selectedDU = du;
    this.filterProjects();
  }

  updateSort(sortBy: ProjectSortOption) {
    this.currentSort = sortBy;
    this.filterProjects();
  }

  createProject() {
    console.log('Create new project');
    // Implement project creation logic
  }
}
