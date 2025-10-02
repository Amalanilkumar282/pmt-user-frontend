import { Component,inject } from '@angular/core';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { SidebarStateService } from '../../shared/services/sidebar-state.service';
import { Navbar } from '../../shared/navbar/navbar';
import { ChartCard } from '../chart-card/chart-card';
import { ChartHeader } from '../chart-header/chart-header';
import { Router } from '@angular/router';


@Component({
  selector: 'app-burndown-chart',
  standalone:true,
  imports: [Sidebar ,Navbar,ChartHeader],
  providers:[SidebarStateService],
  templateUrl: './burndown-chart.html',
  styleUrl: './burndown-chart.css'
})
export class BurndownChart {
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
