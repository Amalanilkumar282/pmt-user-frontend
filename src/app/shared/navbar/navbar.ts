import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarStateService } from '../services/sidebar-state.service';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  standalone: true
})
export class Navbar {
  @Output() toggleSidebar = new EventEmitter<void>();
  private sidebarState = inject(SidebarStateService);
  isSidebarCollapsed = this.sidebarState.isCollapsed;

  navTabs = [
    { label: 'Summary', route: '/summary', active: false },
    { label: 'Backlog', route: '/backlog', active: true },
    { label: 'Board', route: '/board', active: false },
    { label: 'Timeline', route: '/timeline', active: false },
    { label: 'Reports', route: '/report-dashboard', active: false }
  ];

  projectInfo = {
    name: 'Project Alpha',
    type: 'Reports',
    icon: 'PA'
  };

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  onShare(): void {
    console.log('Share clicked');
    // Implement share functionality
  }

  onCreate(): void {
    console.log('Create clicked');
    // Implement create functionality
  }

  onMenuClick(): void {
    console.log('Menu clicked');
    // Implement menu functionality
  }
}
