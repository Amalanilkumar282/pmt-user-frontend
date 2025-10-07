import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarStateService } from '../services/sidebar-state.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  private sidebarStateService = inject(SidebarStateService);

  toggleSidebar(): void {
    this.sidebarStateService.toggleCollapse();
  }
}
