import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { SidebarStateService } from '../../shared/services/sidebar-state.service';
import { ProjectContextService } from '../../shared/services/project-context.service';
import { ChartHeader } from '../chart-header/chart-header';
import { MetricsChart } from '../metrics-chart/metrics-chart';
import { Issue } from '../../shared/models/issue.model';
import { ChartTable } from '../chart-table/chart-table';
import { IssueSummaryService } from '../../summary/issue-summary.service';
import { Sprint } from '../../sprint/sprint-container/sprint-container';
import { SprintFilterComponent } from '../../shared/sprint-filter/sprint-filter';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-burnup-chart',
  standalone: true,
  imports: [Navbar, Sidebar, ChartHeader, MetricsChart, ChartTable, SprintFilterComponent,FormsModule],
  templateUrl: './burnup-chart.html',
  styleUrl: './burnup-chart.css',
})
export class BurnupChart implements OnInit {
  private route = inject(ActivatedRoute);
  private sidebarStateService = inject(SidebarStateService);
  private projectContextService = inject(ProjectContextService);
  private issueSummaryService = inject(IssueSummaryService);
  private cdr = inject(ChangeDetectorRef);

  isSidebarCollapsed = this.sidebarStateService.isCollapsed;

  // Sprint filter data
  sprints: Sprint[] = [];
  selectedSprintId: string | null = 'all';

  issues: Issue[] = [];

  constructor(private router: Router,private location: Location ) {}

  ngOnInit(): void {
    // Set project context from route params
    let projectId = this.route.parent?.parent?.snapshot.paramMap.get('projectId');
    console.log('BurnupChart - Project ID from route.parent.parent:', projectId);
    
    // Try alternative route paths if not found
    if (!projectId) {
      projectId = this.route.parent?.snapshot.paramMap.get('projectId');
      console.log('BurnupChart - Project ID from route.parent:', projectId);
    }
    
    // FOR TESTING: Use hardcoded GUID if projectId is '1'
    if (projectId === '1') {
      console.warn('BurnupChart - Numeric project ID detected. Using test GUID for API call.');
      projectId = '16b2a26d-a6b1-4c88-931a-38d1f52e7df7';
    }
    
    console.log('BurnupChart - Final Project ID:', projectId);
    
    if (projectId) {
      this.projectContextService.setCurrentProjectId(projectId);
      
      // Load sprints from API
      this.issueSummaryService.getSprintsByProjectId(projectId).subscribe({
        next: (allSprints) => {
          console.log('BurnupChart - Loaded sprints from API:', allSprints);
          
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
          console.error('BurnupChart - Error loading sprints:', error);
          // Fallback to dummy data
          const allSprints = this.issueSummaryService.getAllSprints();
          const activeSprint = allSprints.find(s => s.status === 'ACTIVE');
          this.sprints = [
            ...(activeSprint ? [activeSprint] : []),
            ...allSprints.filter(s => s.id !== activeSprint?.id && s.id !== 'all')
          ];
          this.selectedSprintId = activeSprint ? activeSprint.id : allSprints[0]?.id || 'all';
          this.cdr.detectChanges();
          this.updatechartData();
        }
      });
    } else {
      // Fallback to dummy data if no project ID
      const allSprints = this.issueSummaryService.getAllSprints();
      const activeSprint = allSprints.find(s => s.status === 'ACTIVE');
      this.sprints = [
        ...(activeSprint ? [activeSprint] : []),
        ...allSprints.filter(s => s.id !== activeSprint?.id && s.id !== 'all')
      ];
      this.selectedSprintId = activeSprint ? activeSprint.id : allSprints[0]?.id || 'all';
      this.updatechartData();
    }
  }

  onToggleSidebar(): void {
    this.sidebarStateService.toggleCollapse();
  }


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

    // You can add more chart-specific data updates here
    // For example, pass the filtered data to your MetricsChart component
  }
}
