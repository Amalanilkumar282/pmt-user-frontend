import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IssueSummaryCard } from '../issue-summary-card/issue-summary-card';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Navbar } from '../../shared/navbar/navbar';
import { SidebarStateService } from '../../shared/services/sidebar-state.service';
import { SprintOverview } from '../sprint-overview/sprint-overview';
import { SummaryBarChart } from '../summary-bar-chart/summary-bar-chart';
import { ProjectSummary } from '../project-summary/project-summary';
import { RecenIssues } from '../recen-issues/recen-issues';
import { ProjectLead } from '../project-lead/project-lead';
import { ProjectInfo } from '../project-info/project-info';

interface SummaryCardData {
  type: 'completed' | 'updated' | 'created' | 'due-soon';
  count: number;
  label: string;
  timePeriod: string;
}

@Component({
  selector: 'app-summary-page',
  standalone: true,
  imports: [
    CommonModule,
    IssueSummaryCard,
    Sidebar,
    Navbar,
    SprintOverview,
    SummaryBarChart,
    RecenIssues,
    ProjectLead,
    ProjectInfo,
  ],
  templateUrl: './summary-page.html',
  styleUrl: './summary-page.css',
})
export class SummaryPage {
  private sidebarStateService = inject(SidebarStateService);
  isSidebarCollapsed = this.sidebarStateService.isCollapsed;

  issueChartData = [
    { name: 'Story', count: 16 },
    { name: 'Task', count: 28 },
    { name: 'Bug', count: 12 },
    { name: 'Epic', count: 16 },
  ];

  sprintStatuses = [
    { label: 'To Do', count: 16, colorClass: 'bg-status-green' },
    { label: 'In Progress', count: 7, colorClass: 'bg-status-yellow' },
    { label: 'Done', count: 4, colorClass: 'bg-status-blue' },
  ];

  issueCards: SummaryCardData[] = [
    {
      type: 'completed',
      count: 12,
      label: 'COMPLETED',
      timePeriod: 'in the last 7 days',
    },
    {
      type: 'updated',
      count: 23,
      label: 'UPDATED',
      timePeriod: 'in the last 7 days',
    },
    {
      type: 'created',
      count: 8,
      label: 'CREATED',
      timePeriod: 'in the last 7 days',
    },
    {
      type: 'due-soon',
      count: 5,
      label: 'DUE SOON',
      timePeriod: 'in the next 7 days',
    },
  ];
  RecentIssueData = [
    {
      title: 'User Authentication',
      code: 'MAA-127',
      statusBg: '#10B981', // green
      statusLetter: 'S',
      assigneeBg: '#EC4899', // pink
      assigneeInitials: 'JS',
      description: 'Fix OAuth2 login issue and improve JWT handling.',
      status: 'In Progress',
      priority: 'High',
    },
    {
      title: 'Database Migration Scripts',
      code: 'MAA-126',
      statusBg: '#3B82F6', // blue
      statusLetter: 'T',
      assigneeBg: '#9333EA', // purple
      assigneeInitials: 'MK',
      description: 'Migration scripts failing for staging DB.',
      status: 'Pending Review',
      priority: 'Medium',
    },
    {
      title: 'Login Button Not Responsive',
      code: 'MAA-125',
      statusBg: '#EF4444', // red
      statusLetter: 'B',
      assigneeBg: '#F97316', // orange
      assigneeInitials: 'AM',
      description: 'Login button does not respond on mobile view.',
      status: 'Open',
      priority: 'High',
    },
    {
      title: 'Dark Mode Toggle',
      code: 'MAA-124',
      statusBg: '#10B981', // green
      statusLetter: 'F',
      assigneeBg: '#14B8A6', // teal
      assigneeInitials: 'RD',
      description: 'Add dark mode switcher in settings menu.',
      status: 'Completed',
      priority: 'Low',
    },
    {
      title: 'Profile Settings Page',
      code: 'MAA-123',
      statusBg: '#10B981', // green
      statusLetter: 'S',
      assigneeBg: '#06B6D4', // cyan
      assigneeInitials: 'LT',
      description: 'Implement editable profile settings page.',
      status: 'In Progress',
      priority: 'Medium',
    },
    {
      title: 'API Documentation Update',
      code: 'MAA-122',
      statusBg: '#3B82F6', // blue
      statusLetter: 'T',
      assigneeBg: '#92400E', // brown
      assigneeInitials: 'NK',
      description: 'Update API docs for newly added endpoints.',
      status: 'Pending Review',
      priority: 'Low',
    },
  ];

  projectLeads = [
    {
      initials: 'AS',
      name: 'Alice Smith',
      role: 'Project Manager',
      bgColor: 'bg-[#FF5722]',
    },

    // add more leads if needed
  ];
  projectDetails = [
    { label: 'Name', value: 'Mobile App Alpha' },
    { label: 'Type', value: 'Software Development' },
    { label: 'Created', value: 'Sep 15, 2024' },
  ];

  onToggleSidebar(): void {
    this.sidebarStateService.toggleCollapse();
  }
}
