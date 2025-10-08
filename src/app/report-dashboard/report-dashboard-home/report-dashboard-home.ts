import { Component, inject } from '@angular/core';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { SidebarStateService } from '../../shared/services/sidebar-state.service';
import { ChartCard } from '../chart-card/chart-card';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';


@Component({
  selector: 'app-report-dashboard-home',
  standalone: true,
  imports: [Navbar,Sidebar,ChartCard,CommonModule,RouterModule],
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

  
}
