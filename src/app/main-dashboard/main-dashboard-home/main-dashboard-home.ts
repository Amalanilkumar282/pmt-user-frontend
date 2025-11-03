import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { SidebarStateService } from '../../shared/services/sidebar-state.service';
import { ProjectContextService } from '../../shared/services/project-context.service';
import { SprintOverview } from '../../summary/sprint-overview/sprint-overview';
import { ProjectCard } from '../project-card/project-card';
import { ActivityItem } from '../activity-item/activity-item';
import { TabbedIssues } from '../tabbed-issues/tabbed-issues';
import { Header } from '../../shared/header/header';
import { Router, RouterModule } from '@angular/router';
import { ProjectService, Project } from '../../projects/services/project.service';
import {
  DashboardProject,
  DashboardActivity,
  dashboardStats,
  dashboardActivities,
  DashboardStats,
  TaskStatus,
  dashboardTaskStatus,
} from '../../shared/data/dummy-backlog-data';

@Component({
  selector: 'app-main-dashboard-home',
  templateUrl: './main-dashboard-home.html',
  styleUrls: ['./main-dashboard-home.css'],
  standalone: true,
  imports: [
    CommonModule,
    Sidebar,
    ProjectCard,
    ActivityItem,
    SprintOverview,
    Header,
    RouterModule,
    TabbedIssues,
  ],
})
export class MainDashboardHome implements OnInit {
  private router = inject(Router);
  private sidebarStateService = inject(SidebarStateService);
  private projectContextService = inject(ProjectContextService);
  private projectService = inject(ProjectService);

  userName = 'User';
  isLoadingProjects = signal<boolean>(false);
  projectsError = signal<string | null>(null);

  navigateToProject() {
    this.router.navigate(['/projects', 1, 'board']);
  }

  isSidebarCollapsed(): boolean {
    return this.sidebarStateService.getCollapsed();
  }

  dashstats: DashboardStats = dashboardStats;

  get stats() {
    const activeProjects = this.dashstats.activeProjects;
    const issuesInProgress = this.dashstats.issuesInProgress;
    const sprintsInProgress = this.dashstats.sprintsInProgress;

    return {
      activeProjects,
      issuesInProgress,
      sprintsInProgress,
    };
  }

  taskStatus: TaskStatus = dashboardTaskStatus;

  get sprintStatuses(): { label: string; count: number; colorClass: string }[] {
    return [
      { label: 'To Do', count: this.taskStatus.toDo, colorClass: 'bg-blue-500' },
      { label: 'In Progress', count: this.taskStatus.inProgress, colorClass: 'bg-yellow-500' },
      { label: 'Completed', count: this.taskStatus.completed, colorClass: 'bg-green-500' },
      { label: 'On Hold', count: this.taskStatus.onHold, colorClass: 'bg-purple-500' },
    ];
  }

  projects: DashboardProject[] = [];

  recentActivities: DashboardActivity[] = dashboardActivities;

  // called with payload { id, starred } from the ProjectCard child
  toggleStar(payload: { id: string; starred: boolean }): void {
    // Update local state
    this.projects = this.projects.map((p) =>
      p.id === payload.id ? { ...p, starred: payload.starred } : p
    );

    // Update in service (session storage)
    this.projectService.toggleStarredStatus(payload.id);
  }

  /**
   * Transform API Project to DashboardProject
   */
  private transformToDashboardProject(project: Project): DashboardProject {
    return {
      id: project.id,
      name: project.name,
      type: 'Software', // Default type
      status: project.status === 'active' ? 'Active' : 'Completed',
      du: project.deliveryUnitName || project.du || 'Unknown',
      lead: project.projectManagerName || 'Not Assigned',
      created: project.lastUpdated,
      updated: project.lastUpdated,
      starred: project.starred,
    };
  }

  /**
   * Load recent projects from API
   */
  private loadRecentProjects(): void {
    const userId = this.projectService.getUserId();

    if (!userId) {
      console.warn('⚠️ No user ID found, skipping recent projects load');
      this.projectsError.set('Please log in to view recent projects');
      return;
    }

    this.isLoadingProjects.set(true);
    this.projectsError.set(null);

    this.projectService.getRecentProjects(userId, 6).subscribe({
      next: (projects: Project[]) => {
        console.log('✅ Recent projects loaded:', projects);
        this.projects = projects.map((p: Project) => this.transformToDashboardProject(p));
        this.isLoadingProjects.set(false);
      },
      error: (error: any) => {
        console.error('❌ Error loading recent projects:', error);
        this.projectsError.set(error.message || 'Failed to load recent projects');
        this.isLoadingProjects.set(false);
        this.projects = [];
      },
    });
  }

  ngOnInit(): void {
    // Clear project context when viewing main dashboard
    this.projectContextService.clearCurrentProjectId();

    // Load recent projects from API
    this.loadRecentProjects();
  }
}
