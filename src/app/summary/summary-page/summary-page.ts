import { Component, inject, OnInit, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { IssueSummaryCard } from '../issue-summary-card/issue-summary-card';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Navbar } from '../../shared/navbar/navbar';
import { SidebarStateService } from '../../shared/services/sidebar-state.service';
import { ProjectContextService } from '../../shared/services/project-context.service';
import { SprintOverview } from '../sprint-overview/sprint-overview';
import { SummaryBarChart } from '../summary-bar-chart/summary-bar-chart';
import { ProjectSummary } from '../project-summary/project-summary';
import { RecenIssues } from '../recen-issues/recen-issues';
import { ProjectLead } from '../project-lead/project-lead';
import { ProjectInfo } from '../project-info/project-info';
import { IssueSummaryService } from '../issue-summary.service';
import { Sprint } from '../../sprint/sprint-container/sprint-container';
import { SprintFilterComponent } from '../../shared/sprint-filter/sprint-filter';

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
    RecenIssues,
    ProjectLead,
    ProjectInfo,
    SprintFilterComponent,
    ProjectSummary,
  ],
  templateUrl: './summary-page.html',
  styleUrl: './summary-page.css',
})
export class SummaryPage implements OnInit {
  private route = inject(ActivatedRoute);
  private sidebarStateService = inject(SidebarStateService);
  private projectContextService = inject(ProjectContextService);
  private issueSummaryService = inject(IssueSummaryService);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private cdr = inject(ChangeDetectorRef);

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
    // Try multiple ways to get the project ID
    let projectId = this.route.parent?.snapshot.paramMap.get('projectId');
    
    // If not found in parent, try current route
    if (!projectId) {
      projectId = this.route.snapshot.paramMap.get('projectId');
    }
    
    // If still not found, try to get from URL directly (only in browser)
    if (!projectId && this.isBrowser) {
      const urlSegments = window.location.pathname.split('/');
      const projectsIndex = urlSegments.indexOf('projects');
      if (projectsIndex !== -1 && urlSegments[projectsIndex + 1]) {
        projectId = urlSegments[projectsIndex + 1];
      }
    }
    
    // FOR TESTING: If projectId is '1' (numeric), use the test GUID
    // TODO: Remove this once real project IDs are properly passed from navigation
    if (projectId === '1') {
      console.warn('⚠️ Numeric project ID detected. Using test GUID for API call.');
      projectId = '16b2a26d-a6b1-4c88-931a-38d1f52e7df7'; // Use your actual project GUID
    }
    
    console.log('Summary page - Project ID:', projectId);
    if (this.isBrowser) {
      console.log('Summary page - Full URL:', window.location.href);
    }
    
    if (projectId) {
      this.projectContextService.setCurrentProjectId(projectId);
      
      // Load sprints for the filter from API
      console.log('Fetching sprints for project:', projectId);
      this.issueSummaryService.getSprintsByProjectId(projectId).subscribe({
        next: (sprints) => {
          console.log('✅ Loaded sprints from API:', sprints);
          console.log('✅ Sprint count:', sprints.length);
          console.log('✅ First sprint:', sprints[0]);
          this.sprints = sprints;
          console.log('✅ After assignment - this.sprints:', this.sprints);
          console.log('✅ After assignment - this.sprints.length:', this.sprints.length);
          
          // Manually trigger change detection to update the view
          this.cdr.detectChanges();
          console.log('✅ Change detection triggered');
        },
        error: (error) => {
          console.error('❌ Error loading sprints:', error);
          console.log('Using fallback dummy data');
          // Fallback to dummy data if API fails
          this.sprints = this.issueSummaryService.getAllSprints();
          console.log('Fallback sprints loaded:', this.sprints);
          this.cdr.detectChanges();
        }
      });
    } else {
      console.warn('No valid project ID found, using dummy data');
      // Fallback to dummy data if no project ID
      this.sprints = this.issueSummaryService.getAllSprints();
    }

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
    console.log(this.issueCards);
    // Update sprint status breakdown
    this.sprintStatuses = this.issueSummaryService.getSprintStatuses(this.selectedSprintId);

    // Update issue chart data
    this.issueChartData = this.issueSummaryService.getIssueTypeCounts(this.selectedSprintId);

    // UPDATED: Load Recent Issues data from the service, filtered by the selected sprint ID
    this.RecentIssueData = this.issueSummaryService.getRecentIssues(this.selectedSprintId);
    console.log(this.RecentIssueData);
  }

  onToggleSidebar(): void {
    this.sidebarStateService.toggleCollapse();
  }
}
