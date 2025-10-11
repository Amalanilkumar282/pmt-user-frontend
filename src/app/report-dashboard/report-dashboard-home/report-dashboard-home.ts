import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { SidebarStateService } from '../../shared/services/sidebar-state.service';
import { ProjectContextService } from '../../shared/services/project-context.service';
import { ChartCard } from '../chart-card/chart-card';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-report-dashboard-home',
  standalone: true,
  imports: [Navbar,Sidebar,ChartCard,CommonModule,RouterModule],
  templateUrl: './report-dashboard-home.html',
  styleUrls: ['./report-dashboard-home.css']
})
export class ReportDashboardHome implements OnInit {
  private route = inject(ActivatedRoute);
  private sidebarStateService = inject(SidebarStateService);
  private projectContextService = inject(ProjectContextService);
  isSidebarCollapsed = this.sidebarStateService.isCollapsed;
  currentProjectId = this.projectContextService.currentProjectId;
  

  onToggleSidebar(): void {
    this.sidebarStateService.toggleCollapse();
  }

  
  constructor(private router: Router) {}

  ngOnInit(): void {
    // Set project context from route params
    const projectId = this.route.parent?.snapshot.paramMap.get('projectId');
    if (projectId) {
      this.projectContextService.setCurrentProjectId(projectId);
    }
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  // Get dynamic routes with project ID
  getBurnupRoute(): string {
    const projectId = this.currentProjectId();
    return projectId ? `/projects/${projectId}/report-dashboard/burnup-chart` : '/report-dashboard/burnup-chart';
  }

  getBurndownRoute(): string {
    const projectId = this.currentProjectId();
    return projectId ? `/projects/${projectId}/report-dashboard/burndown-chart` : '/report-dashboard/burndown-chart';
  }

  getVelocityRoute(): string {
    const projectId = this.currentProjectId();
    return projectId ? `/projects/${projectId}/report-dashboard/velocity-chart` : '/report-dashboard/velocity-chart';
  }

  
}
