import { Component,inject } from '@angular/core';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { SidebarStateService } from '../../shared/services/sidebar-state.service';
import { ChartHeader } from '../chart-header/chart-header';
import { Router } from '@angular/router';

@Component({
  selector: 'app-burnup-chart',
  standalone:true,
  imports: [Navbar,Sidebar,ChartHeader],
  providers:[SidebarStateService],
  templateUrl: './burnup-chart.html',
  styleUrl: './burnup-chart.css'
})
export class BurnupChart {
  private sidebarStateService = inject(SidebarStateService);
  isSidebarCollapsed = this.sidebarStateService.isCollapsed;

  onToggleSidebar(): void {
    this.sidebarStateService.toggleCollapse();
  }
  constructor(private router: Router) {}

  navigateBack() {
    this.router.navigate(['/report-dashboard']);
  }

}
