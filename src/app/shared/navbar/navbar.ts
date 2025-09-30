import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  standalone: true
})
export class Navbar {
  navTabs = [
    { label: 'Summary', route: '/summary', active: false },
    { label: 'Backlog', route: '/backlog', active: true },
    { label: 'Board', route: '/board', active: false },
    { label: 'Timeline', route: '/timeline', active: false },
    { label: 'Reports', route: '/reports', active: false }
  ];

  projectInfo = {
    name: 'Project Alpha',
    type: 'Reports',
    icon: 'PA'
  };

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
