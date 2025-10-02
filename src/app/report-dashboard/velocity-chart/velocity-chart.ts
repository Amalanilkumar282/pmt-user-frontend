import { Component,inject} from '@angular/core';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { SidebarStateService } from '../../shared/services/sidebar-state.service';
import { Navbar } from '../../shared/navbar/navbar';

@Component({
  selector: 'app-velocity-chart',
  standalone:true,
  imports: [Sidebar,Navbar],
   providers: [SidebarStateService], 
  templateUrl: './velocity-chart.html',
  styleUrl: './velocity-chart.css'
})
export class VelocityChart {
  private sidebarStateService = inject(SidebarStateService);
  isSidebarCollapsed = this.sidebarStateService.isCollapsed;

  onToggleSidebar(): void {
    this.sidebarStateService.toggleCollapse();
  }

}
