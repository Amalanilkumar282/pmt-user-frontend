import { Component,inject, model } from '@angular/core';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { SidebarStateService } from '../../shared/services/sidebar-state.service';
import { ChartHeader } from '../chart-header/chart-header';
import { Router } from '@angular/router';
import { MetricsChart } from '../metrics-chart/metrics-chart';
import { sprints } from '../../shared/data/dummy-backlog-data';
import { Issue } from '../../shared/models/issue.model';
import { ChartTable } from '../chart-table/chart-table';
import { IssueSummaryService } from '../../summary/issue-summary.service';
import { Sprint } from '../../sprint/sprint-container/sprint-container';
import { SprintFilterComponent } from '../../shared/sprint-filter/sprint-filter';

@Component({
  selector: 'app-burnup-chart',
  standalone:true,
  imports: [Navbar,Sidebar,ChartHeader,MetricsChart,ChartTable,SprintFilterComponent,SprintFilterComponent],
  // providers:[SidebarStateService],
  templateUrl: './burnup-chart.html',
  styleUrl: './burnup-chart.css'
})
export class BurnupChart {
  private sidebarStateService = inject(SidebarStateService);
  isSidebarCollapsed = this.sidebarStateService.isCollapsed;
 private issueSummaryService = inject(IssueSummaryService);

    
  // Sprint filter data
  sprints: Sprint[] = [];
  selectedSprintId: string | null = 'all';
    
  onToggleSidebar(): void {
    this.sidebarStateService.toggleCollapse();
  }
  constructor(private router: Router) {
      
  }

  navigateBack() {
    this.router.navigate(['/report-dashboard']);
  }
  issues: Issue[] = []; // ✅ define issues property




  onSprintFilterChange(sprintId: string): void {
    this.selectedSprintId = sprintId;
    this.updatechartData();
  }

  private updatechartData(): void {
    // Update issue summary cards
     

    // Update sprint status breakdown
    
  }

  }




