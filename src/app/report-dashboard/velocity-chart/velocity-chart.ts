import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
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
  
  isSidebarCollapsed = this.sidebarStateService.isCollapsed;

  // declare properties used in the class
  selectedSprintId: string | null = null;
  issues: Issue[] = [];
  // sprints shown in the sprint filter
  sprints: Sprint[] = [];

  // 
   ngOnInit(): void {
    // Set project context from route params
    let projectId = this.route.parent?.parent?.snapshot.paramMap.get('projectId');
    console.log('VelocityChart - Project ID from route.parent.parent:', projectId);
    
    // Try alternative route paths if not found
    if (!projectId) {
      projectId = this.route.parent?.snapshot.paramMap.get('projectId');
      console.log('VelocityChart - Project ID from route.parent:', projectId);
    }
    
    // FOR TESTING: Use hardcoded GUID if projectId is '1'
    if (projectId === '1') {
      console.warn('VelocityChart - Numeric project ID detected. Using test GUID for API call.');
      projectId = '11111111-1111-1111-1111-111111111111';
    }
    
    console.log('VelocityChart - Final Project ID:', projectId);
    
    if (projectId) {
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
  constructor(private router: Router,private location:Location) {}

  navigateBack(): void {
    
      this.location.back();

  }
  onSprintFilterChange(sprintId: string): void {
    this.selectedSprintId = sprintId;
    this.updatechartData();
  }

  private updatechartData(): void {
    // If no completed sprint is selected, clear issues (no velocity to show)
    if (!this.selectedSprintId) {
      this.issues = [];
      return;
    }

    // Get issues for the selected sprint
    this.issues = this.issueSummaryService.getIssuesBySprintId(this.selectedSprintId);

    // You can add more chart-specific data updates here
    // For example, pass the filtered data to your MetricsChart component
  }

}
