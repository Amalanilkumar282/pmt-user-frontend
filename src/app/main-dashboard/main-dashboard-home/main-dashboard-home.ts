import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { SidebarStateService } from '../../shared/services/sidebar-state.service';
import { IssueSummaryCard } from '../../summary/issue-summary-card/issue-summary-card';
import { SprintOverview } from '../../summary/sprint-overview/sprint-overview';
import { ProjectCard } from '../project-card/project-card';
import { ActivityItem } from '../activity-item/activity-item';
import { Header } from '../../shared/header/header';
import { RouterModule } from '@angular/router';

interface Project {
  id: string;
  name: string;
  type: string;
  status: 'Active' | 'Completed';
  sprint: string;
  tasks: {
    toDo: number;
    inProgress: number;
    done: number;
  };
  teamMembers: string[];
  deadline: string;
  updated: string;
  starred?: boolean;
}

interface Activity {
  id: string;
  user: string;
  initials: string;
  action: string;
  task: string;
  taskId: string;
  time: string;
  type: 'completed' | 'commented' | 'assigned';
}

@Component({
  selector: 'app-main-dashboard-home',
  templateUrl: './main-dashboard-home.html',
  styleUrls: ['./main-dashboard-home.css'],
  standalone: true,
  imports: [
    CommonModule,
    Sidebar,
    IssueSummaryCard,
    ProjectCard,
    ActivityItem,
    SprintOverview,
    Header,
    RouterModule,
  ],
})
export class MainDashboardHome {
  userName = 'Harrel';
  private sidebarStateService = inject(SidebarStateService);

  isSidebarCollapsed(): boolean {
    return this.sidebarStateService.getCollapsed();
  }

  stats = {
    activeProjects: 2,
    issuesInProgress: 12,
    sprintsInProgress: 3,
  };

  taskStatus = {
    toDo: 8,
    inProgress: 6,
    completed: 7,
    onHold: 3,
  };

  get sprintStatuses(): { label: string; count: number; colorClass: string }[] {
    return [
      { label: 'To Do', count: this.taskStatus.toDo, colorClass: 'bg-status-blue' },
      { label: 'In Progress', count: this.taskStatus.inProgress, colorClass: 'bg-status-yellow' },
      { label: 'Completed', count: this.taskStatus.completed, colorClass: 'bg-status-green' },
      { label: 'On Hold', count: this.taskStatus.onHold, colorClass: 'bg-status-purple' },
    ];
  }

  projects: Project[] = [
    {
      id: '1',
      name: 'Mobile App Revamp',
      type: 'Scrum Project',
      status: 'Active',
      sprint: 'Sprint Alpha',
      tasks: { toDo: 15, inProgress: 8, done: 25 },
      teamMembers: ['A', 'B', 'C', '+2'],
      deadline: 'Oct 5, 2025',
      updated: '2h ago',
      starred: true,
    },
    {
      id: '2',
      name: 'Mobile App Revamp',
      type: 'Scrum Project',
      status: 'Completed',
      sprint: 'Sprint Alpha',
      tasks: { toDo: 15, inProgress: 8, done: 25 },
      teamMembers: ['A', 'B', 'C', '+2'],
      deadline: 'Oct 5, 2025',
      updated: '2h ago',
      starred: false,
    },
  ];

  recentActivities: Activity[] = [
    {
      id: '1',
      user: 'You',
      initials: 'SC',
      action: 'completed task',
      task: 'User authentication flow',
      taskId: 'ECOM-123',
      time: '2 minutes ago',
      type: 'completed',
    },
    {
      id: '2',
      user: 'Mike Johnson',
      initials: 'MJ',
      action: 'commented on',
      task: 'Mobile responsive design',
      taskId: 'MAR-45',
      time: '15 minutes ago',
      type: 'commented',
    },
    {
      id: '3',
      user: 'Emily Davis',
      initials: 'ED',
      action: 'assigned you to',
      task: 'Database optimization',
      taskId: 'DAT-78',
      time: '1 hour ago',
      type: 'assigned',
    },
    {
      id: '4',
      user: 'You',
      initials: 'HA',
      action: 'completed task',
      task: 'process flow',
      taskId: 'ECOM-123',
      time: '2 hours ago',
      type: 'completed',
    },
  ];

  // called with payload { id, starred } from the ProjectCard child
  toggleStar(payload: { id: string; starred: boolean }): void {
    this.projects = this.projects.map((p) =>
      p.id === payload.id ? { ...p, starred: payload.starred } : p
    );
  }
}
