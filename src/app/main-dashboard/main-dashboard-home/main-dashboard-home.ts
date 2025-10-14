import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { SidebarStateService } from '../../shared/services/sidebar-state.service';
import { ProjectContextService } from '../../shared/services/project-context.service';
import { SprintOverview } from '../../summary/sprint-overview/sprint-overview';
import { ProjectCard } from '../project-card/project-card';
import { ActivityItem } from '../activity-item/activity-item';
import { TabbedIssues } from '../tabbed-issues/tabbed-issues';
import { Header } from '../../shared/header/header';
import { RouterModule } from '@angular/router';
import {
  DashboardProject,
  DashboardActivity,
  dashboardProjects,
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
  userName = 'User';
  private sidebarStateService = inject(SidebarStateService);
  private projectContextService = inject(ProjectContextService);

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

  projects: DashboardProject[] = dashboardProjects;

  recentActivities: DashboardActivity[] = dashboardActivities;

  // called with payload { id, starred } from the ProjectCard child
  toggleStar(payload: { id: string; starred: boolean }): void {
    this.projects = this.projects.map((p) =>
      p.id === payload.id ? { ...p, starred: payload.starred } : p
    );
  }

  ngOnInit(): void {
    // Clear project context when viewing main dashboard
    this.projectContextService.clearCurrentProjectId();
  }
}
