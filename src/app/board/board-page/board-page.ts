import { Component, inject } from '@angular/core';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Navbar } from '../../shared/navbar/navbar';
import { SidebarStateService } from '../../shared/services/sidebar-state.service';
@Component({
  selector: 'app-board-page',
  imports: [Sidebar, Navbar],
  templateUrl: './board-page.html',
  styleUrl: './board-page.css'
})
export class BoardPage {
  private sidebarStateService = inject(SidebarStateService);
  isSidebarCollapsed = this.sidebarStateService.isCollapsed;

  onToggleSidebar(): void {
    this.sidebarStateService.toggleCollapse();
  }
}
