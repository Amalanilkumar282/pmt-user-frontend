import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ModalService, FormField } from '../../modal/modal-service';
import { SidebarStateService } from '../services/sidebar-state.service';
import { CreateIssue } from '../../modal/create-issue/create-issue';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css'],
  standalone: true
})
export class Navbar {
  @Output() toggleSidebar = new EventEmitter<void>();

  constructor(private modalService: ModalService) {}
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

  onCreate() {
  const fields: FormField[] = [
    { label: 'Issue Type', type: 'select', model: 'issueType', options: ['Epic','Task','Story','Bug'], colSpan: 2, required : true },
    { label: 'Summary', type: 'text', model: 'summary', colSpan: 2,required : true  },
    { label: 'Description', type: 'textarea', model: 'description', colSpan: 2 },
    { label: 'Priority', type: 'select', model: 'priority', options: ['High','Medium','Low'], colSpan: 1 },
    { label: 'Assignee', type: 'select', model: 'assignee', options: ['Jacob','Clara','Zac'], colSpan: 1 },
    { label: 'Start Date', type: 'date', model: 'startDate', colSpan: 1 },
    { label: 'Due Date', type: 'date', model: 'dueDate', colSpan: 1 },
    { label: 'Sprint', type: 'select', model: 'sprint', options: ['Sprint 1','Sprint 2','Sprint 3'], colSpan: 1 },
    { label: 'Story Point', type: 'number', model: 'storyPoint', colSpan: 1 },
    { label: 'Parent Epic', type: 'select', model: 'parentEpic', options: ['Epic 1','Epic 2','Epic 3'], colSpan: 1 },
    { label: 'Reporter', type: 'select', model: 'reporter', options: ['Jacob','Clara','Zac'], colSpan: 1,required : true  }
  ];

  this.modalService.open({
    id: 'createIssue',          // matches your modal component's @Input modalId
    title: 'Create New Issue',   // modal header
    projectName: 'Project Beta',// optional project label
    fields,                     // dynamic fields
    data: { priority: 'Medium', labels: [] }, // optional pre-filled data
    showLabels: true
  });
}

  onShareModal() {
    const shareFields: FormField[] = [
      { label: 'Share With', type: 'text', model: 'shareWith', colSpan: 2 },
      { label: 'Message', type: 'textarea', model: 'message', colSpan: 2 }
    ];

    
      this.modalService.open({
        id: 'shareModal',
        title: 'Share Project',
        projectName: 'Project Alpha',
        fields: shareFields,
        data: { shareWith: '', message: '' }
      });
  }





  onMenuClick(): void {
    console.log('Menu clicked');
    // Implement menu functionality
  }
}
