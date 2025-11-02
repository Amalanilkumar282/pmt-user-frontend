import { Component, inject, OnInit, ChangeDetectorRef, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { SidebarStateService } from '../../shared/services/sidebar-state.service';
import { ProjectContextService } from '../../shared/services/project-context.service';
import { Navbar } from '../../shared/navbar/navbar';
import { ChartHeader } from '../chart-header/chart-header';
import { MetricsChart } from '../metrics-chart/metrics-chart';
import { ChartTable } from '../chart-table/chart-table';
import { IssueSummaryService } from '../../summary/issue-summary.service';
import { Sprint } from '../../sprint/sprint-container/sprint-container';
import { SprintFilterComponent } from '../../shared/sprint-filter/sprint-filter';
import { Issue } from '../../shared/models/issue.model';
import { Location } from '@angular/common';
@Component({
  selector: 'app-velocity-chart',
  standalone: true,
  imports: [Sidebar, Navbar, ChartHeader, MetricsChart, ChartTable, SprintFilterComponent],
  //  providers: [SidebarStateService], 
  templateUrl: './velocity-chart.html',
  styleUrls: ['./velocity-chart.css']
})
export class VelocityChart implements OnInit {
  private route = inject(ActivatedRoute);
  private sidebarStateService = inject(SidebarStateService);
  private projectContextService = inject(ProjectContextService);
  private issueSummaryService = inject(IssueSummaryService);
  private cdr = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  
  isSidebarCollapsed = this.sidebarStateService.isCollapsed;

  // declare properties used in the class
  selectedSprintId: string | null = null;
  currentProjectId: string | null = null;
  selectedSprintData: { name: string; startDate: Date; endDate: Date } | null = null;
  issues: Issue[] = [];
  // sprints shown in the sprint filter
  sprints: Sprint[] = [];

  // 
   ngOnInit(): void {
    // Always get project ID from sessionStorage first (only in browser)
    let projectId: string | null = null;
    
    if (this.isBrowser) {
      projectId = sessionStorage.getItem('projectId');
      console.log('VelocityChart - Project ID from sessionStorage:', projectId);
    }
    
    // Fallback to route params if not in sessionStorage
    if (!projectId) {
      projectId = this.route.parent?.parent?.snapshot.paramMap.get('projectId') || null;
      console.log('VelocityChart - Fallback to route.parent.parent:', projectId);
      
      if (!projectId) {
        projectId = this.route.parent?.snapshot.paramMap.get('projectId') || null;
        console.log('VelocityChart - Fallback to route.parent:', projectId);
      }
    }
    
    // Validate that we have a proper GUID
    if (projectId && !this.isValidGuid(projectId)) {
      console.warn('VelocityChart - Invalid project ID format:', projectId);
      projectId = null;
    }
    
    console.log('VelocityChart - Final Project ID:', projectId);
    
    if (projectId) {
      this.currentProjectId = projectId;
      this.projectContextService.setCurrentProjectId(projectId);
      
      // Load sprints from API
      this.issueSummaryService.getSprintsByProjectId(projectId).subscribe({
        next: (allSprints) => {
          console.log('VelocityChart - Loaded sprints from API:', allSprints);
          
          // Only populate the filter with completed sprints and default to the
          // most recently completed sprint. Velocity should only be calculated
          // for completed sprints (not active ones).
          const completedSprints = allSprints
            .filter(s => s.status === 'COMPLETED' && s.id !== 'all')
            .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());

          this.sprints = completedSprints;
          this.selectedSprintId = completedSprints[0]?.id ?? null;
          
          // Set initial sprint data
          const initialSprint = completedSprints[0];
          if (initialSprint) {
            this.selectedSprintData = {
              name: initialSprint.name,
              startDate: initialSprint.startDate,
              endDate: initialSprint.endDate
            };
          }
          
          // Trigger change detection
          this.cdr.detectChanges();
          
          // Load initial chart data
          this.updatechartData();
        },
        error: (error) => {
          console.error('VelocityChart - Error loading sprints from API:', error);
          console.error('API Error Details:', {
            status: error.status,
            statusText: error.statusText,
            url: error.url
          });
          // No fallback - leave sprints empty
          this.sprints = [];
          this.selectedSprintId = null;
          this.cdr.detectChanges();
        }
      });
    } else {
      console.warn('VelocityChart - No project ID found');
      this.sprints = [];
      this.selectedSprintId = null;
    }
  }


  onToggleSidebar(): void {
    this.sidebarStateService.toggleCollapse();
  }

  private isValidGuid(value: string): boolean {
    const guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return guidPattern.test(value);
  }

  constructor(private router: Router,private location:Location) {}

  navigateBack(): void {
    
      this.location.back();

  }
  onSprintFilterChange(sprintId: string | null): void {
    this.selectedSprintId = sprintId;
    
    // Update sprint data for the chart
    const selectedSprint = sprintId ? this.sprints.find(s => s.id === sprintId) : undefined;
    if (selectedSprint) {
      this.selectedSprintData = {
        name: selectedSprint.name,
        startDate: selectedSprint.startDate,
        endDate: selectedSprint.endDate
      };
    } else {
      this.selectedSprintData = null;
    }
    
    this.updatechartData();
  }

  private updatechartData(): void {
    // If no completed sprint is selected, clear issues (no velocity to show)
    if (!this.selectedSprintId) {
      this.issues = [];
      return;
    }

    if (!this.currentProjectId) {
      // Fallback to dummy data if no project ID
      this.issues = this.issueSummaryService.getIssuesBySprintId(this.selectedSprintId);
      return;
    }

    // Load issues from API for selected sprint
    console.log(`VelocityChart - Loading issues for project ${this.currentProjectId}, sprint ${this.selectedSprintId}`);
    this.issueSummaryService.getIssuesByProjectAndSprint(this.currentProjectId, this.selectedSprintId).subscribe({
      next: (issues) => {
        console.log('VelocityChart - Loaded issues from API:', issues);
        this.issues = issues;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('VelocityChart - Error loading issues from API:', error);
        console.error('API Error Details:', {
          status: error.status,
          statusText: error.statusText,
          url: error.url
        });
        // Fallback to empty array
        this.issues = [];
        this.cdr.detectChanges();
      }
    });
  }

}
