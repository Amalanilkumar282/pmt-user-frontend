import { Component,inject } from '@angular/core';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { SidebarStateService } from '../../shared/services/sidebar-state.service';

@Component({
  selector: 'app-timeline-component',
  imports: [Navbar,Sidebar],
  providers:[SidebarStateService],
  templateUrl: './timeline-component.html',
  styleUrl: './timeline-component.css'
})
export class TimelineComponent {
  private sidebarStateService = inject(SidebarStateService);
  isSidebarCollapsed = this.sidebarStateService.isCollapsed;

  onToggleSidebar(): void {
    this.sidebarStateService.toggleCollapse();
  }
}
