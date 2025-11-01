import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
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
  private projectContextService = inject(ProjectContextService);
  private cdr = inject(ChangeDetectorRef);

  isSidebarCollapsed = this.sidebarStateService.isCollapsed;

  sprints: Sprint[] = [];
  selectedSprintId: string | null = 'all';
  issues: Issue[] = [];

   
  ngOnInit(): void {
    // Set project context from route params
    let projectId = this.route.parent?.parent?.snapshot.paramMap.get('projectId');
    console.log('BurndownChart - Project ID from route.parent.parent:', projectId);
    
    // Try alternative route paths if not found
    if (!projectId) {
      projectId = this.route.parent?.snapshot.paramMap.get('projectId');
      console.log('BurndownChart - Project ID from route.parent:', projectId);
    }
    
    // FOR TESTING: Use hardcoded GUID if projectId is '1'
    if (projectId === '1') {
      console.warn('BurndownChart - Numeric project ID detected. Using test GUID for API call.');
      projectId = '11111111-1111-1111-1111-111111111111';
    }
    
    console.log('BurndownChart - Final Project ID:', projectId);
    
    if (projectId) {
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

  constructor(private router: Router,private location:Location) {}

  navigateBack(): void {
    
      this.location.back();

  }
  onSprintFilterChange(sprintId: string): void {
    this.selectedSprintId = sprintId;
    this.updatechartData();
  }

  private updatechartData(): void {
    // Get issues for the selected sprint
    this.issues = this.issueSummaryService.getIssuesBySprintId(this.selectedSprintId);

     
  }



}
