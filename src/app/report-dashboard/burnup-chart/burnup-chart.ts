import { Component,inject } from '@angular/core';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { SidebarStateService } from '../../shared/services/sidebar-state.service';

@Component({
  selector: 'app-burnup-chart',
  standalone:true,
  imports: [Navbar,Sidebar],
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

}
