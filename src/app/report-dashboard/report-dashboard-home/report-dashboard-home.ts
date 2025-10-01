import { Component, inject } from '@angular/core';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { SidebarStateService } from '../../shared/services/sidebar-state.service';

@Component({
  selector: 'app-report-dashboard-home',
  standalone: true,
  imports: [Navbar,Sidebar],
  providers: [SidebarStateService], 
  templateUrl: './report-dashboard-home.html',
  styleUrl: './report-dashboard-home.css'
})
export class ReportDashboardHome {

  private sidebarStateService = inject(SidebarStateService);
  isSidebarCollapsed = this.sidebarStateService.isCollapsed;

  onToggleSidebar(): void {
    this.sidebarStateService.toggleCollapse();
  }
}
