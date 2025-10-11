import { Component, inject, OnInit } from '@angular/core';
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

 


@Component({
  selector: 'app-burndown-chart',
  standalone:true,
  imports: [Sidebar ,Navbar,ChartHeader, NgApexchartsModule,MetricsChart,ChartTable],
  // providers:[SidebarStateService],
  templateUrl: './burndown-chart.html',
  styleUrl: './burndown-chart.css'
})
export class BurndownChart implements OnInit {
  private route = inject(ActivatedRoute);
  private sidebarStateService = inject(SidebarStateService);
  private projectContextService = inject(ProjectContextService);
  isSidebarCollapsed = this.sidebarStateService.isCollapsed;

  ngOnInit(): void {
    // Set project context from route params
    const projectId = this.route.parent?.parent?.snapshot.paramMap.get('projectId');
    if (projectId) {
      this.projectContextService.setCurrentProjectId(projectId);
    }
  }

  onToggleSidebar(): void {
    this.sidebarStateService.toggleCollapse();
  }

  constructor(private router: Router) {}

  navigateBack() {
    const projectId = this.route.parent?.parent?.snapshot.paramMap.get('projectId');
    if (projectId) {
      this.router.navigate(['/projects', projectId, 'report-dashboard']);
    } else {
      this.router.navigate(['/report-dashboard']);
    }
  }
  
issues: Issue[] = [];


}
