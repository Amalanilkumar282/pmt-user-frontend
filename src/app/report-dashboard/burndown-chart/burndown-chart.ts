import { Component,inject } from '@angular/core';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { SidebarStateService } from '../../shared/services/sidebar-state.service';
import { Navbar } from '../../shared/navbar/navbar';
import { ChartCard } from '../chart-card/chart-card';
import { ChartHeader } from '../chart-header/chart-header';
import { Router } from '@angular/router';
import { MetricsChart } from '../metrics-chart/metrics-chart';
import { sprints } from '../../shared/data/dummy-backlog-data';
import { Issue } from '../../shared/models/issue.model';
import { NgApexchartsModule } from 'ng-apexcharts';
import { ChartTable } from '../chart-table/chart-table';
import { IssueSummaryService } from '../../summary/issue-summary.service';
import { Sprint } from '../../sprint/sprint-container/sprint-container';
import { SprintFilterComponent } from '../../shared/sprint-filter/sprint-filter';
 


@Component({
  selector: 'app-burndown-chart',
  standalone:true,
  imports: [Sidebar ,Navbar,ChartHeader, NgApexchartsModule,MetricsChart,ChartTable,SprintFilterComponent],
  // providers:[SidebarStateService],
  templateUrl: './burndown-chart.html',
  styleUrl: './burndown-chart.css'
})
export class BurndownChart {
  private sidebarStateService = inject(SidebarStateService);
    private issueSummaryService = inject(IssueSummaryService);


  isSidebarCollapsed = this.sidebarStateService.isCollapsed;

  sprints: Sprint[] = [];
  selectedSprintId: string | null = 'all';
  issues: Issue[] = [];

  ngOnInit(): void {
    // Load all sprints from the service
    this.sprints = this.issueSummaryService.getAllSprints();

    // Load initial chart data
    this.updatechartData();
  }

  onToggleSidebar(): void {
    this.sidebarStateService.toggleCollapse();
  }

  constructor(private router: Router) {}

  navigateBack() {
    this.router.navigate(['/report-dashboard']);
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
