import { Component, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  standalone: true
})
export class Sidebar {
  // Collapse state
  isCollapsed = signal(false);
  
  @Output() collapsedChange = new EventEmitter<boolean>();

  // Navigation items could be defined here if needed
  navItems = [
    { icon: 'dashboard', label: 'Dashboard', route: '/dashboard', active: true },
    { icon: 'recent', label: 'Recent', route: '/recent', active: false },
    { icon: 'projects', label: 'Projects', route: '/projects', active: false },
    { icon: 'starred', label: 'Starred', route: '/starred', active: false },
    { icon: 'settings', label: 'Settings', route: '/settings', active: false }
  ];

  recentProjects = [
    { name: 'My Scrum Project', id: 1 },
    { name: 'My Scrum Project', id: 2 }
  ];

  toggleCollapse(): void {
    this.isCollapsed.set(!this.isCollapsed());
    this.collapsedChange.emit(this.isCollapsed());
  }

  setCollapsed(collapsed: boolean): void {
    this.isCollapsed.set(collapsed);
    this.collapsedChange.emit(collapsed);
  }
}
