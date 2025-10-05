import { Component,inject} from '@angular/core';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { SidebarStateService } from '../../shared/services/sidebar-state.service';
import { Navbar } from '../../shared/navbar/navbar';
import { ChartHeader } from '../chart-header/chart-header';
import { Router } from '@angular/router';
import { MetricsChart } from '../metrics-chart/metrics-chart';

@Component({
  selector: 'app-velocity-chart',
  standalone:true,
  imports: [Sidebar,Navbar,ChartHeader,MetricsChart],
  //  providers: [SidebarStateService], 
  templateUrl: './velocity-chart.html',
  styleUrl: './velocity-chart.css'
})
export class VelocityChart {
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
