import { Component, inject, OnInit } from '@angular/core';
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

  isSidebarCollapsed = this.sidebarStateService.isCollapsed;

  // Sprint filter data
  sprints: Sprint[] = [];
  selectedSprintId: string | null = 'all';

  issues: Issue[] = [];

  constructor(private router: Router,private location: Location ) {}

  ngOnInit(): void {
    // Set project context from route params
    const projectId = this.route.parent?.parent?.snapshot.paramMap.get('projectId');
    if (projectId) {
      this.projectContextService.setCurrentProjectId(projectId);
    }
    
    // Load all sprints from the service
    // this.sprints = this.issueSummaryService.getAllSprints();
     // Load all sprints
  const allSprints = this.issueSummaryService.getAllSprints();

  

    // Find active sprint
  const activeSprint = allSprints.find(s => s.status === 'ACTIVE');

  // Reorder: active sprint first, exclude 'all' placeholder if any exists
  this.sprints = [
    ...(activeSprint ? [activeSprint] : []),
    ...allSprints.filter(s => s.id !== activeSprint?.id && s.id !== 'all')
  ];

  this.selectedSprintId = activeSprint ? activeSprint.id : allSprints[0]?.id || 'all';
    // Load initial chart data
    this.updatechartData();
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
