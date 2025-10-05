import { Component, inject } from '@angular/core';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { SidebarStateService } from '../../shared/services/sidebar-state.service';
import { ChartCard } from '../chart-card/chart-card';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { Router } from '@angular/router';


@Component({
  selector: 'app-report-dashboard-home',
  standalone: true,
  imports: [Navbar,Sidebar,ChartCard,CommonModule,NgApexchartsModule],
  templateUrl: './report-dashboard-home.html',
  styleUrl: './report-dashboard-home.css'
})
export class ReportDashboardHome {

  private sidebarStateService = inject(SidebarStateService);
  isSidebarCollapsed = this.sidebarStateService.isCollapsed;

  onToggleSidebar(): void {
    this.sidebarStateService.toggleCollapse();
  }

  
  constructor(private router: Router) {}

    navigateTo(path: string) {
    this.router.navigate([path]);
  }

  chartData = [
    { x: 0, y: 20 },
    { x: 1, y: 25 },
    { x: 2, y: 30 },
    { x: 3, y: 35 },
    { x: 4, y: 45 },
    { x: 5, y: 55 },
    { x: 6, y: 65 },
    { x: 7, y: 75 }
  ];
}
