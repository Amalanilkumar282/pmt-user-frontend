import { Component, inject, OnInit, ChangeDetectorRef, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { SidebarStateService } from '../../shared/services/sidebar-state.service';
import { ProjectContextService } from '../../shared/services/project-context.service';
import { Navbar } from '../../shared/navbar/navbar';
import { ChartCard } from '../chart-card/chart-card';
import { ChartHeader } from '../chart-header/chart-header';
import { MetricsChart } from '../metrics-chart/metrics-chart';
import { sprints } from '../../shared/data/dummy-backlog-data';
import { Issue } from '../../shared/models/issue.model';
import { NgApexchartsModule } from 'ng-apexcharts';
import { ChartTable } from '../chart-table/chart-table';
import { IssueSummaryService } from '../../summary/issue-summary.service';
import { Sprint } from '../../sprint/sprint-container/sprint-container';
import { SprintFilterComponent } from '../../shared/sprint-filter/sprint-filter';
import { Location } from '@angular/common';


@Component({
  selector: 'app-burndown-chart',
  standalone:true,
  imports: [Sidebar ,Navbar,ChartHeader, NgApexchartsModule,MetricsChart,ChartTable,SprintFilterComponent],
  // providers:[SidebarStateService],
  templateUrl: './burndown-chart.html',
  styleUrl: './burndown-chart.css'
})
export class BurndownChart implements OnInit {
  private route = inject(ActivatedRoute);
  private sidebarStateService = inject(SidebarStateService);
  private issueSummaryService = inject(IssueSummaryService);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private projectContextService = inject(ProjectContextService);
  private cdr = inject(ChangeDetectorRef);

  isSidebarCollapsed = this.sidebarStateService.isCollapsed;

  sprints: Sprint[] = [];
  selectedSprintId: string | null = 'all';
  currentProjectId: string | null = null;
  selectedSprintData: { name: string; startDate: Date; endDate: Date } | null = null;
  issues: Issue[] = [];

   
  ngOnInit(): void {
    // Always get project ID from sessionStorage first (only in browser)
    let projectId: string | null = null;
    
    if (this.isBrowser) {
      projectId = sessionStorage.getItem('projectId');
      console.log('BurndownChart - Project ID from sessionStorage:', projectId);
    }
    
    // Fallback to route params if not in sessionStorage
    if (!projectId) {
      projectId = this.route.parent?.parent?.snapshot.paramMap.get('projectId') || null;
      console.log('BurndownChart - Fallback to route.parent.parent:', projectId);
      
      if (!projectId) {
        projectId = this.route.parent?.snapshot.paramMap.get('projectId') || null;
        console.log('BurndownChart - Fallback to route.parent:', projectId);
      }
    }
    
    // Validate that we have a proper GUID
    if (projectId && !this.isValidGuid(projectId)) {
      console.warn('BurndownChart - Invalid project ID format:', projectId);
      projectId = null;
    }
    
    console.log('BurndownChart - Final Project ID:', projectId);
    
    if (projectId) {
      this.currentProjectId = projectId;
      this.projectContextService.setCurrentProjectId(projectId);
      
      // Load sprints from API
      this.issueSummaryService.getSprintsByProjectId(projectId).subscribe({
        next: (allSprints) => {
          console.log('BurndownChart - Loaded sprints from API:', allSprints);
          
          // Find active sprint
          const activeSprint = allSprints.find(s => s.status === 'ACTIVE');

          // Reorder: active sprint first, exclude 'all' placeholder if any exists
          this.sprints = [
            ...(activeSprint ? [activeSprint] : []),
            ...allSprints.filter(s => s.id !== activeSprint?.id && s.id !== 'all')
          ];

          this.selectedSprintId = activeSprint ? activeSprint.id : allSprints[0]?.id || 'all';
          
          // Set initial sprint data
          const initialSprint = activeSprint || allSprints[0];
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
          console.error('BurndownChart - Error loading sprints from API:', error);
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
      console.warn('BurndownChart - No project ID found');
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
  onSprintFilterChange(sprintId: string): void {
    this.selectedSprintId = sprintId;
    
    // Update sprint data for the chart
    const selectedSprint = this.sprints.find(s => s.id === sprintId);
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
    if (!this.currentProjectId || !this.selectedSprintId || this.selectedSprintId === 'all') {
      // Fallback to dummy data if no valid sprint selected
      this.issues = this.issueSummaryService.getIssuesBySprintId(this.selectedSprintId);
      return;
    }

    // Load issues from API for selected sprint
    console.log(`BurndownChart - Loading issues for project ${this.currentProjectId}, sprint ${this.selectedSprintId}`);
    this.issueSummaryService.getIssuesByProjectAndSprint(this.currentProjectId, this.selectedSprintId).subscribe({
      next: (issues) => {
        console.log('BurndownChart - Loaded issues from API:', issues);
        this.issues = issues;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('BurndownChart - Error loading issues from API:', error);
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
