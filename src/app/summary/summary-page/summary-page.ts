// import { Component, inject, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { IssueSummaryCard } from '../issue-summary-card/issue-summary-card';
// import { Sidebar } from '../../shared/sidebar/sidebar';
// import { Navbar } from '../../shared/navbar/navbar';
// import { SidebarStateService } from '../../shared/services/sidebar-state.service';
// import { SprintOverview } from '../sprint-overview/sprint-overview';
// import { SummaryBarChart } from '../summary-bar-chart/summary-bar-chart';
// import { ProjectSummary } from '../project-summary/project-summary';
// import { RecenIssues } from '../recen-issues/recen-issues';
// import { ProjectLead } from '../project-lead/project-lead';
// import { ProjectInfo } from '../project-info/project-info';
// import { Filters } from '../../shared/filters/filters';
// import { IssueSummaryService } from '../issue-summary.service';
// import { Sprint } from '../../sprint/sprint-container/sprint-container';
// import { SprintFilterComponent } from '../sprint-filter/sprint-filter';

// interface SummaryCardData {
//   type: 'completed' | 'updated' | 'created' | 'due-soon';
//   count: number;
//   label: string;
//   timePeriod: string;
// }

// @Component({
//   selector: 'app-summary-page',
//   standalone: true,
//   imports: [
//     CommonModule,
//     IssueSummaryCard,
//     Sidebar,
//     Navbar,
//     SprintOverview,
//     SummaryBarChart,
//     ProjectSummary,
//     RecenIssues,
//     ProjectLead,
//     ProjectInfo,
//     Filters,
//     SprintFilterComponent,
//   ],
//   templateUrl: './summary-page.html',
//   styleUrl: './summary-page.css',
// })
// export class SummaryPage implements OnInit {
//   private sidebarStateService = inject(SidebarStateService);
//   private issueSummaryService = inject(IssueSummaryService);

//   isSidebarCollapsed = this.sidebarStateService.isCollapsed;

//   // Sprint filter data
//   sprints: Sprint[] = [];
//   selectedSprintId: string | null = 'all';

//   // This will be populated dynamically from the service
//   issueChartData: { name: string; count: number }[] = [];

//   // This will be populated dynamically from the service
//   sprintStatuses: { label: string; count: number; colorClass: string }[] = [];

//   // This will be populated dynamically from the service
//   issueCards: SummaryCardData[] = [];

//   RecentIssueData = [
//     {
//       title: 'User Authentication',
//       code: 'MAA-127',
//       statusBg: '#10B981',
//       statusLetter: 'S',
//       assigneeBg: '#EC4899',
//       assigneeInitials: 'JS',
//       description: 'Fix OAuth2 login issue and improve JWT handling.',
//       status: 'In Progress',
//       priority: 'High',
//     },
//     {
//       title: 'Database Migration Scripts',
//       code: 'MAA-126',
//       statusBg: '#3B82F6',
//       statusLetter: 'T',
//       assigneeBg: '#9333EA',
//       assigneeInitials: 'MK',
//       description: 'Migration scripts failing for staging DB.',
//       status: 'Pending Review',
//       priority: 'Medium',
//     },
//     {
//       title: 'Login Button Not Responsive',
//       code: 'MAA-125',
//       statusBg: '#EF4444',
//       statusLetter: 'B',
//       assigneeBg: '#F97316',
//       assigneeInitials: 'AM',
//       description: 'Login button does not respond on mobile view.',
//       status: 'Open',
//       priority: 'High',
//     },
//     {
//       title: 'Dark Mode Toggle',
//       code: 'MAA-124',
//       statusBg: '#10B981',
//       statusLetter: 'F',
//       assigneeBg: '#14B8A6',
//       assigneeInitials: 'RD',
//       description: 'Add dark mode switcher in settings menu.',
//       status: 'Completed',
//       priority: 'Low',
//     },
//     {
//       title: 'Profile Settings Page',
//       code: 'MAA-123',
//       statusBg: '#10B981',
//       statusLetter: 'S',
//       assigneeBg: '#06B6D4',
//       assigneeInitials: 'LT',
//       description: 'Implement editable profile settings page.',
//       status: 'In Progress',
//       priority: 'Medium',
//     },
//     {
//       title: 'API Documentation Update',
//       code: 'MAA-122',
//       statusBg: '#3B82F6',
//       statusLetter: 'T',
//       assigneeBg: '#92400E',
//       assigneeInitials: 'NK',
//       description: 'Update API docs for newly added endpoints.',
//       status: 'Pending Review',
//       priority: 'Low',
//     },
//   ];

//   projectLeads = [
//     {
//       initials: 'AS',
//       name: 'Alice Smith',
//       role: 'Project Manager',
//       bgColor: 'bg-[#FF5722]',
//     },
//   ];

//   projectDetails = [
//     { label: 'Name', value: 'Mobile App Alpha' },
//     { label: 'Type', value: 'Software Development' },
//     { label: 'Created', value: 'Sep 15, 2024' },
//   ];

//   ngOnInit(): void {
//     // Load sprints for the filter
//     this.sprints = this.issueSummaryService.getAllSprints();

//     // Load initial data based on default filter
//     this.updateDashboardData();
//   }

//   onSprintFilterChange(sprintId: string): void {
//     this.selectedSprintId = sprintId;
//     this.updateDashboardData();
//   }

//   private updateDashboardData(): void {
//     // Update issue summary cards
//     this.issueCards = this.issueSummaryService.getIssueSummaryCards(this.selectedSprintId);

//     // Update sprint status breakdown
//     this.sprintStatuses = this.issueSummaryService.getSprintStatuses(this.selectedSprintId);

//     this.issueChartData = this.issueSummaryService.getIssueTypeCounts(this.selectedSprintId);
//     console.log(this.issueChartData);
//   }

//   onToggleSidebar(): void {
//     this.sidebarStateService.toggleCollapse();
//   }
// }

import { Component, inject, OnInit } from '@angular/core';
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
import { Filters } from '../../shared/filters/filters';
import { IssueSummaryService } from '../issue-summary.service';
import { Sprint } from '../../sprint/sprint-container/sprint-container';
import { SprintFilterComponent } from '../sprint-filter/sprint-filter';

interface SummaryCardData {
  type: 'completed' | 'updated' | 'created' | 'due-soon';
  count: number;
  label: string;
  timePeriod: string;
}

interface RecentIssue {
  title: string;
  code: string;
  statusBg: string;
  statusLetter: string;
  assigneeBg: string;
  assigneeInitials: string;
  description?: string;
  status?: string;
  priority?: string;
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
    ProjectSummary,
    RecenIssues,
    ProjectLead,
    ProjectInfo,
    Filters,
    SprintFilterComponent,
  ],
  templateUrl: './summary-page.html',
  styleUrl: './summary-page.css',
})
export class SummaryPage implements OnInit {
  private sidebarStateService = inject(SidebarStateService);
  private issueSummaryService = inject(IssueSummaryService);

  isSidebarCollapsed = this.sidebarStateService.isCollapsed;

  // Sprint filter data
  sprints: Sprint[] = [];
  selectedSprintId: string | null = 'all';

  issueChartData: { name: string; count: number }[] = [];
  sprintStatuses: { label: string; count: number; colorClass: string }[] = [];
  issueCards: SummaryCardData[] = [];

  // Recent issues property
  RecentIssueData: RecentIssue[] = [];

  projectLeads = [
    {
      initials: 'AS',
      name: 'Alice Smith',
      role: 'Project Manager',
      bgColor: 'bg-[#FF5722]',
    },
  ];

  projectDetails = [
    { label: 'Name', value: 'Mobile App Alpha' },
    { label: 'Type', value: 'Software Development' },
    { label: 'Created', value: 'Sep 15, 2024' },
  ];

  ngOnInit(): void {
    // Load sprints for the filter
    this.sprints = this.issueSummaryService.getAllSprints();

    // Load initial data based on default filter ('all')
    this.updateDashboardData();
  }

  onSprintFilterChange(sprintId: string): void {
    this.selectedSprintId = sprintId;
    this.updateDashboardData();
  }

  private updateDashboardData(): void {
    // Update issue summary cards
    this.issueCards = this.issueSummaryService.getIssueSummaryCards(this.selectedSprintId);

    // Update sprint status breakdown
    this.sprintStatuses = this.issueSummaryService.getSprintStatuses(this.selectedSprintId);

    // Update issue chart data
    this.issueChartData = this.issueSummaryService.getIssueTypeCounts(this.selectedSprintId);

    // UPDATED: Load Recent Issues data from the service, filtered by the selected sprint ID
    this.RecentIssueData = this.issueSummaryService.getRecentIssues(this.selectedSprintId);
  }

  onToggleSidebar(): void {
    this.sidebarStateService.toggleCollapse();
  }
}
