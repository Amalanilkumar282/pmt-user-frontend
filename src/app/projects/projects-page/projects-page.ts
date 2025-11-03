import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectHeader } from '../components/project-header/project-header';
import { ProjectFilters } from '../components/project-filters/project-filters';
import { ProjectList, Project, ProjectSortOption } from '../components/project-list/project-list';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Header } from '../../shared/header/header';
import { SidebarStateService } from '../../shared/services/sidebar-state.service';
import { ProjectContextService } from '../../shared/services/project-context.service';
import { ProjectService } from '../services/project.service';
import { Router } from '@angular/router';

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
  private projectService = inject(ProjectService);
  private router = inject(Router);

  isCollapsed = this.sidebarStateService.isCollapsed;

  searchQuery = '';
  currentSort: ProjectSortOption = 'recent';
  showStarredOnly = false;
  selectedStatus = 'all';
  selectedDU = 'all';
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);

  private _projects = signal<Project[]>([]);
  readonly projects = this._projects.asReadonly();

  private _filteredProjects = signal<Project[]>([]);
  readonly filteredProjects = this._filteredProjects.asReadonly();

  constructor() {}

  ngOnInit(): void {
    // Clear project context when viewing all projects
    this.projectContextService.clearCurrentProjectId();

    // Load projects from backend
    this.loadProjects();
  }

  /**
   * Load projects for the current user from backend API
   */
  private loadProjects(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    // Get user ID from session storage
    const userId = this.projectService.getUserId();

    if (!userId) {
      console.error('No user ID found in session storage');
      this.errorMessage.set('User not logged in. Please login again.');
      this.isLoading.set(false);
      this.router.navigate(['/login']);
      return;
    }

    console.log('Loading projects for user ID:', userId);

    // Fetch projects from backend
    this.projectService.getProjectsByUserId(userId).subscribe({
      next: (projects) => {
        console.log('✅ Projects loaded successfully:', projects);
        this._projects.set(projects);
        this.filterProjects();
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('❌ Error loading projects:', error);
        this.errorMessage.set(error.message || 'Failed to load projects. Please try again.');
        this.isLoading.set(false);
        // Auth interceptor will handle 401 errors and redirect to login
      },
    });
  }

  toggleProjectStar(projectId: string) {
    // Toggle starred status in service (which updates session storage)
    const newStarredStatus = this.projectService.toggleStarredStatus(projectId);

    // Update local state
    const projects = this._projects();
    this._projects.set(
      projects.map((p) => (p.id === projectId ? { ...p, starred: newStarredStatus } : p))
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
