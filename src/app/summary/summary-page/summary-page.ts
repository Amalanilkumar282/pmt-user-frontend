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
  private projectMembersService = inject(require('../../teams/services/project-members.service').ProjectMembersService) as import('../../teams/services/project-members.service').ProjectMembersService;
  private route = inject(ActivatedRoute);
  private sidebarStateService = inject(SidebarStateService);
  private projectContextService = inject(ProjectContextService);
    private projectService = inject(require('../../projects/services/project.service').ProjectService) as import('../../projects/services/project.service').ProjectService;
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

  projectLeads: any[] = [];
  projectDetails: any[] = [];
  
  // Store current project ID
  currentProjectId: string | null = null;

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
      projectId = '11111111-1111-1111-1111-111111111111'; // Use your actual project GUID
    }
    
    console.log('Summary page - Project ID:', projectId);
    if (this.isBrowser) {
      console.log('Summary page - Full URL:', window.location.href);
    }
    
    if (projectId) {
      this.projectContextService.setCurrentProjectId(projectId);
      this.currentProjectId = projectId; // Store project ID for later use
      
      // Fetch recent issues from API and assign to RecentIssueData
      this.issueSummaryService.getRecentIssuesByProjectId(projectId, 6).subscribe({
        next: (issues: any[]) => {
          console.log('✅ Fetched recent issues:', issues);
          console.log('✅ Recent issues count:', issues.length);
          if (issues.length > 0) {
            console.log('✅ First issue:', issues[0]);
          }
          this.RecentIssueData = issues;
          this.cdr.detectChanges();
        },
        error: (err: unknown) => {
          console.error('❌ Failed to fetch recent issues:', err);
        }
      });
      // Fetch project details from API
      this.projectService.getProjectsByUserId(this.projectService.getUserId() || '').subscribe({
        next: (projects: import('../../projects/services/project.service').Project[]) => {
          // Find the current project
          const project = projects.find((p: import('../../projects/services/project.service').Project) => p.id === projectId);
          if (project) {
            // Set project lead info
            this.projectLeads = [{
              initials: project.projectManagerName ? (project.projectManagerName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0,2)) : '?',
              name: project.projectManagerName || 'N/A',
              role: 'Project Lead',
              bgColor: 'bg-[#FF5722]',
            }];
            // Set project details
            this.projectDetails = [
              { label: 'Name', value: project.name },
              { label: 'Type', value: 'Software Development' },
              { label: 'Created', value: project.lastUpdated ? formatDate(project.lastUpdated) : '' },
              { label: 'Customer', value: project.customerOrgName || '' },
              { label: 'Delivery Unit', value: project.deliveryUnitName || '' },
              { label: 'Status', value: project.status },
            ];
            function formatDate(dateStr: string): string {
              const d = new Date(dateStr);
              const day = d.getDate();
              let month = d.toLocaleString('en-US', { month: 'short' });
              month = month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();
              const year = d.getFullYear();
              return `${day} ${month} ${year}`;
            }
            this.cdr.detectChanges();
          }
        },
        error: (err: unknown) => {
          console.error('Failed to fetch project details:', err);
        }
      });
      
      // Load sprints for the filter from API
      console.log('Fetching sprints for project:', projectId);
      this.issueSummaryService.getSprintsByProjectId(projectId).subscribe({
        next: (sprints) => {
          console.log('✅ Loaded sprints from API:', sprints);
          console.log('✅ Sprint count:', sprints.length);
          
          this.sprints = sprints;
          
          // Auto-select the active sprint if it exists, otherwise default to "all"
          const activeSprint = sprints.find(sprint => sprint.status === 'ACTIVE');
          if (activeSprint) {
            this.selectedSprintId = activeSprint.id;
            console.log('✅ Auto-selected ACTIVE sprint:', activeSprint.name, '(ID:', activeSprint.id, ')');
          } else {
            this.selectedSprintId = 'all';
            console.log('ℹ️ No active sprint found, defaulting to "all"');
          }
          
          // Now update the dashboard with the selected sprint
          this.updateDashboardData();
          
          // Trigger change detection to update the view
          this.cdr.detectChanges();
          console.log('✅ Sprint filter initialized with selection:', this.selectedSprintId);
        },
        error: (error) => {
          console.error('❌ Error loading sprints from API:', error);
          console.error('API Error Details:', {
            status: error.status,
            statusText: error.statusText,
            url: error.url
          });
          // No fallback - leave sprints empty
          this.sprints = [];
          this.selectedSprintId = 'all';
          this.cdr.detectChanges();
        }
      });
    } else {
      console.warn('⚠️ No project ID found - cannot load sprints');
      this.sprints = [];
    }

    // Note: updateDashboardData() will be called after sprints are loaded
  }

  onSprintFilterChange(sprintId: string | null): void {
    this.selectedSprintId = sprintId;
    this.updateDashboardData();
  }

  private updateDashboardData(): void {
    if (!this.currentProjectId) {
      console.warn('⚠️ No project ID available for dashboard update');
      return;
    }

    console.log('🔄 Updating dashboard data for project:', this.currentProjectId, 'sprint:', this.selectedSprintId);

    // Update issue summary cards with API data
    console.log('📊 Fetching issue summary cards...');
    this.issueSummaryService.getIssueSummaryCards(this.currentProjectId, this.selectedSprintId).subscribe({
      next: (cards) => {
        console.log('✅ Loaded issue summary cards:', cards);
        console.log('📊 Cards array length:', cards.length);
        console.log('📊 Card details:', JSON.stringify(cards, null, 2));
        this.issueCards = cards;
        console.log('📊 Component issueCards property:', this.issueCards);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error loading issue summary cards:', err);
        console.error('❌ Error details:', JSON.stringify(err, null, 2));
        // Set empty cards on error
        this.issueCards = [];
      }
    });

    // Update sprint status breakdown with API data - pass projectId for "all" sprints
    this.issueSummaryService.getSprintStatuses(this.selectedSprintId, this.currentProjectId).subscribe({
      next: (statuses) => {
        console.log('✅ Loaded sprint statuses:', statuses);
        this.sprintStatuses = statuses;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error loading sprint statuses:', err);
        // Set empty statuses on error
        this.sprintStatuses = [
          { label: 'To Do', count: 0, colorClass: 'bg-blue-500' },
          { label: 'In Progress', count: 0, colorClass: 'bg-yellow-500' },
          { label: 'Done', count: 0, colorClass: 'bg-green-500' },
        ];
      }
    });

    // Update issue chart data with API data
    this.issueSummaryService.getIssueTypeCounts(this.currentProjectId, this.selectedSprintId).subscribe({
      next: (counts) => {
        console.log('✅ Loaded issue type counts:', counts);
        this.issueChartData = counts;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error loading issue type counts:', err);
        // Set empty counts on error
        this.issueChartData = [
          { name: 'Story', count: 0 },
          { name: 'Task', count: 0 },
          { name: 'Bug', count: 0 },
          { name: 'Epic', count: 0 },
        ];
      }
    });

    // Recent issues are now loaded from backend in ngOnInit only
  }

  onToggleSidebar(): void {
    this.sidebarStateService.toggleCollapse();
  }
}
