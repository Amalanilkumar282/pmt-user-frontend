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

  isSidebarCollapsed = this.sidebarStateService.isCollapsed;

  sprints: Sprint[] = [];
  selectedSprintId: string | null = 'all';
  issues: Issue[] = [];

  // ngOnInit(): void {
  //   // Load all sprints from the service
  //   this.sprints = this.issueSummaryService.getAllSprints();

  //   // Load initial chart data
  //   this.updatechartData();
  // }

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

    // You can add more chart-specific data updates here
    // For example, pass the filtered data to your MetricsChart component
  }



}
