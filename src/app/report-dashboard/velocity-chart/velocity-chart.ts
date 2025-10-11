import { Component,inject} from '@angular/core';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { SidebarStateService } from '../../shared/services/sidebar-state.service';
import { Navbar } from '../../shared/navbar/navbar';
import { ChartHeader } from '../chart-header/chart-header';
import { Router } from '@angular/router';
import { MetricsChart } from '../metrics-chart/metrics-chart';
import { ChartTable } from '../chart-table/chart-table';
import { IssueSummaryService } from '../../summary/issue-summary.service';
import { Sprint } from '../../sprint/sprint-container/sprint-container';
import { SprintFilterComponent } from '../../shared/sprint-filter/sprint-filter';
import { Issue } from '../../shared/models/issue.model';

@Component({
  selector: 'app-velocity-chart',
  standalone:true,
  imports: [Sidebar,Navbar,ChartHeader,MetricsChart,ChartTable,SprintFilterComponent],
  //  providers: [SidebarStateService], 
  templateUrl: './velocity-chart.html',
  styleUrl: './velocity-chart.css'
})
export class VelocityChart {
  private sidebarStateService = inject(SidebarStateService);
   private issueSummaryService = inject(IssueSummaryService);

  isSidebarCollapsed = this.sidebarStateService.isCollapsed;

  // Sprint filter data
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
