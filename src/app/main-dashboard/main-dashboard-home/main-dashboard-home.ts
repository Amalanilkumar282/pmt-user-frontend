import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { SidebarStateService } from '../../shared/services/sidebar-state.service';
import { ProjectContextService } from '../../shared/services/project-context.service';
import { SprintOverview } from '../../summary/sprint-overview/sprint-overview';
import { ProjectCard } from '../project-card/project-card';
import { ActivityItem, ActivityModel } from '../activity-item/activity-item';
import { TabbedIssues } from '../tabbed-issues/tabbed-issues';
import { Header } from '../../shared/header/header';
import { Router, RouterModule } from '@angular/router';
import { ProjectService, Project } from '../../projects/services/project.service';
import { IssueService } from '../../shared/services/issue.service';
import { Issue } from '../../shared/models/issue.model';
import { ActivityService, ActivityLogDto } from '../../shared/services/activity.service';

// Define interfaces locally
interface DashboardProject {
  id: string;
  name: string;
  type: string;
  status: 'Active' | 'Completed';
  du: string;
  lead: string;
  created: string;
  updated: string;
  starred?: boolean;
}

interface DashboardStats {
  activeProjects: number;
  issuesInProgress: number;
  sprintsInProgress: number;
}

interface TaskStatus {
  toDo: number;
  inProgress: number;
  completed: number;
  onHold: number;
}

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
  private issueService = inject(IssueService);
  private activityService = inject(ActivityService);

  userName = 'User';
  isLoadingProjects = signal<boolean>(false);
  projectsError = signal<string | null>(null);
  isLoadingIssues = signal<boolean>(false);
  issuesError = signal<string | null>(null);
  isLoadingActivities = signal<boolean>(false);
  activitiesError = signal<string | null>(null);
  userIssues: Issue[] = [];

  navigateToProject() {
    this.router.navigate(['/projects', 1, 'board']);
  }

  isSidebarCollapsed(): boolean {
    return this.sidebarStateService.getCollapsed();
  }

  // Dashboard stats - loaded from backend or calculated from projects
  dashstats: DashboardStats = {
    activeProjects: 0,
    issuesInProgress: 0,
    sprintsInProgress: 0,
  };

  get stats() {
    return {
      activeProjects: this.dashstats.activeProjects,
      issuesInProgress: this.dashstats.issuesInProgress,
      sprintsInProgress: this.dashstats.sprintsInProgress,
    };
  }

  taskStatus: TaskStatus = {
    toDo: 0,
    inProgress: 0,
    completed: 0,
    onHold: 0,
  };

  get sprintStatuses(): { label: string; count: number; colorClass: string }[] {
    return [
      { label: 'To Do', count: this.taskStatus.toDo, colorClass: 'bg-blue-500' },
      { label: 'In Progress', count: this.taskStatus.inProgress, colorClass: 'bg-yellow-500' },
      { label: 'Completed', count: this.taskStatus.completed, colorClass: 'bg-green-500' },
      { label: 'On Hold', count: this.taskStatus.onHold, colorClass: 'bg-purple-500' },
    ];
  }

  projects: DashboardProject[] = [];

  recentActivities: ActivityModel[] = [];

  /**
   * Load user issues and calculate task status counts
   */
  private loadUserIssues(): void {
    const userId = this.projectService.getUserId();

    if (!userId) {
      // Silently skip if user not logged in - this is expected before login
      return;
    }

    this.isLoadingIssues.set(true);
    this.issuesError.set(null);

    this.issueService.getIssuesByUser(userId).subscribe({
      next: (issues: Issue[]) => {
        console.log('✅ User issues loaded:', issues);
        this.userIssues = issues;
        this.calculateTaskStatus(issues);
        
        // Calculate issues in progress count for dashboard stats
        this.dashstats.issuesInProgress = issues.filter(
          i => i.statusName === 'IN_PROGRESS' || i.statusName === 'IN_REVIEW'
        ).length;
        
        this.isLoadingIssues.set(false);
      },
      error: (error: any) => {
        console.error('❌ Error loading user issues:', error);
        this.issuesError.set(error.message || 'Failed to load issues');
        this.isLoadingIssues.set(false);
        this.userIssues = [];
      },
    });
  }

  /**
   * Calculate task status counts from issues
   */
  private calculateTaskStatus(issues: Issue[]): void {
    const statusCounts = {
      toDo: 0,
      inProgress: 0,
      completed: 0,
      onHold: 0,
    };

    issues.forEach((issue) => {
      switch (issue.statusName) {
        case 'TO_DO':
          statusCounts.toDo++;
          break;
        case 'IN_PROGRESS':
          statusCounts.inProgress++;
          break;
        case 'IN_REVIEW':
          statusCounts.inProgress++; // Count review as in progress
          break;
        case 'DONE':
          statusCounts.completed++;
          break;
        case 'BLOCKED':
          statusCounts.onHold++;
          break;
        default:
          statusCounts.toDo++;
      }
    });

    this.taskStatus = statusCounts;
    console.log('✅ Task status calculated:', this.taskStatus);
  }

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
    // Format date to show only the date portion (YYYY-MM-DD)
    const formatDate = (isoString: string): string => {
      const date = new Date(isoString);
      return date.toISOString().split('T')[0];
    };

    return {
      id: project.id,
      name: project.name,
      type: 'Software', // Default type
      status: project.status === 'active' ? 'Active' : 'Completed',
      du: project.deliveryUnitName || project.du || 'Unknown',
      lead: project.projectManagerName || 'Not Assigned',
      created: formatDate(project.lastUpdated),
      updated: formatDate(project.lastUpdated),
      starred: project.starred,
    };
  }

  /**
   * Load recent projects from API
   */
  private loadRecentProjects(): void {
    const userId = this.projectService.getUserId();

    if (!userId) {
      // Silently skip if user not logged in - this is expected before login
      return;
    }

    this.isLoadingProjects.set(true);
    this.projectsError.set(null);

    this.projectService.getRecentProjects(userId, 6).subscribe({
      next: (projects: Project[]) => {
        console.log('✅ Recent projects loaded:', projects);
        this.projects = projects.map((p: Project) => this.transformToDashboardProject(p));
        
        // Calculate dashboard stats from loaded projects
        this.dashstats.activeProjects = projects.filter(p => p.status === 'active').length;
        
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

  /**
   * Transform API ActivityLogDto to ActivityModel
   */
  private transformToActivityModel(dto: ActivityLogDto): ActivityModel {
    return {
      id: dto.id,
      userId: dto.userId,
      userName: dto.userName || 'Unknown User',
      action: dto.action,
      entityType: dto.entityType,
      entityId: dto.entityId,
      description: dto.description,
      createdAt: dto.createdAt,
    };
  }

  /**
   * Load user activities from API
   */
  private loadUserActivities(): void {
    const userIdStr = this.projectService.getUserId();

    if (!userIdStr) {
      // Silently skip if user not logged in - this is expected before login
      return;
    }

    const userId = parseInt(userIdStr, 10);

    this.isLoadingActivities.set(true);
    this.activitiesError.set(null);

    this.activityService.getUserActivities(userId, 5).subscribe({
      next: (response) => {
        console.log('✅ User activities loaded:', response);
        this.recentActivities = response.data.map((dto: ActivityLogDto) =>
          this.transformToActivityModel(dto)
        );
        this.isLoadingActivities.set(false);
      },
      error: (error: any) => {
        console.error('❌ Error loading user activities:', error);
        this.activitiesError.set(error.message || 'Failed to load activities');
        this.isLoadingActivities.set(false);
        this.recentActivities = [];
      },
    });
  }

  ngOnInit(): void {
    // Clear project context when viewing main dashboard
    this.projectContextService.clearCurrentProjectId();

    // Load recent projects from API
    this.loadRecentProjects();

    // Load user issues for task status
    this.loadUserIssues();

    // Load user activities
    this.loadUserActivities();
  }
}
