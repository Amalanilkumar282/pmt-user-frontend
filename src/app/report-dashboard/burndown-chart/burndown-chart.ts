import { Component,inject } from '@angular/core';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { SidebarStateService } from '../../shared/services/sidebar-state.service';
import { Navbar } from '../../shared/navbar/navbar';

@Component({
  selector: 'app-burndown-chart',
  standalone:true,
  imports: [Sidebar ,Navbar],
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

}
