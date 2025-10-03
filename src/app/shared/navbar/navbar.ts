import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ModalService } from '../../modal/modal-service';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  standalone: true
})
export class Navbar {
  @Output() toggleSidebar = new EventEmitter<void>();

  constructor(private modalService: ModalService) {}

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
    this.modalService.open('createIssue'); // ✅ open by ID
  }

  onMenuClick(): void {
    console.log('Menu clicked');
    // Implement menu functionality
  }
}
