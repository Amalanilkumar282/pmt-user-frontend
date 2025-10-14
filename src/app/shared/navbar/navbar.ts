import { Component, Output, EventEmitter, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { users } from '../../shared/data/dummy-backlog-data';
import { ModalService, FormField } from '../../modal/modal-service';
import { SidebarStateService } from '../services/sidebar-state.service';
import { ProjectContextService } from '../services/project-context.service';
import { CreateIssue } from '../../modal/create-issue/create-issue';
import { Searchbar } from '../searchbar/searchbar';
import { SummaryModal } from '../summary-modal/summary-modal';
import { filter } from 'rxjs';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterModule, Searchbar, SummaryModal],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css'],
  standalone: true
})
export class Navbar {
  get unreadCount(): number {
    return this.notifications ? this.notifications.filter(n => n.unread).length : 0;
  }
  @Output() toggleSidebar = new EventEmitter<void>();

  private modalService = inject(ModalService);
  private sidebarState = inject(SidebarStateService);
  private projectContextService = inject(ProjectContextService);
  private router = inject(Router);
  
  isSidebarCollapsed = this.sidebarState.isCollapsed;
  currentProjectId = this.projectContextService.currentProjectId;

  // Summary modal state
  showSummaryModal: boolean = false;
  summaryText: string = '';

  // Warning modal state
  showWarningModal: boolean = false;
  warningText: string = '';

  // Computed property to get project info based on current project ID
  projectInfo = computed(() => {
    const projectId = this.currentProjectId();
    if (!projectId) {
      return { name: 'Project Alpha', type: 'Software', icon: 'PA' };
    }
    
    // Get project info from dummy data (you can replace this with actual service call)
    const projects: Record<string, any> = {
      '1': { name: 'Website Redesign', type: 'Software', icon: 'WR' },
      '2': { name: 'Mobile App Development', type: 'Software', icon: 'MA' },
      '3': { name: 'Marketing Campaign', type: 'Marketing', icon: 'MC' },
      '4': { name: 'Backend Infrastructure', type: 'Software', icon: 'BI' },
      '5': { name: 'Customer Portal', type: 'Software', icon: 'CP' },
    };
    
    return projects[projectId] || { name: 'Project Alpha', type: 'Software', icon: 'PA' };
  });



  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  /**
   * Handle the create issue modal trigger from searchbar
   * Opens the modal with pre-filled data from Gemini
   */
  handleOpenCreateModal(fields: any): void {
    console.log('Navbar received openCreateModal event with fields:', fields);
    
    // Map the fields to the modal configuration
    const issueType = fields.issueType || 'Task';
    const summary = fields.summary || '';
    const description = fields.description || '';
    const priority = fields.priority || 'Medium';

    const userOptions = users.map(u => u.name);

    // Open the create issue modal with pre-filled data
    this.modalService.open({
      id: 'create-issue',
      title: 'Create Issue',
      projectName: this.projectInfo().name,
      modalDesc: 'Fill in the details below to create a new issue',
      showLabels: true,
      submitText: 'Create Issue',
      fields: [
        {
          label: 'Issue Type',
          type: 'select',
          model: 'issueType',
          options: ['Task', 'Bug', 'Story', 'Epic'],
          required: true,
          colSpan: 1
        },
        {
          label: 'Summary',
          type: 'text',
          model: 'summary',
          required: true,
          colSpan: 2
        },
        {
          label: 'Description',
          type: 'textarea',
          model: 'description',
          colSpan: 2
        },
        {
          label: 'Priority',
          type: 'select',
          model: 'priority',
          options: ['High', 'Medium', 'Low'],
          required: true,
          colSpan: 1
        },
        {
          label: 'Assignee',
          type: 'select',
          model: 'assignee',
          options: userOptions,
          colSpan: 1
        },
        {
          label: 'Sprint',
          type: 'select',
          model: 'sprint',
          options: ['Backlog', 'Sprint 1', 'Sprint 2', 'Sprint 3'],
          colSpan: 1
        },
        {
          label: 'Story Points',
          type: 'number',
          model: 'storyPoints',
          colSpan: 1
        },
        {
          label: 'Due Date',
          type: 'date',
          model: 'dueDate',
          colSpan: 1
        }
      ],
      data: {
        issueType: issueType,
        summary: summary,
        description: description,
        priority: priority,
        assignee: 'Unassigned',
        sprint: 'Backlog',
        storyPoints: '',
        dueDate: '',
        labels: [],
        attachments: []
      }
    });
  }

  /**
   * Handle summary display from searchbar
   */
  handleShowSummary(summary: string): void {
    console.log('Navbar received showSummary event:', summary);
    this.summaryText = summary;
    this.showSummaryModal = true;
  }

  /**
   * Handle warning display from searchbar
   */
  handleShowWarning(warning: string): void {
    console.log('Navbar received showWarning event:', warning);
    this.warningText = warning;
    this.showWarningModal = true;
  }

  /**
   * Close summary modal
   */
  closeSummaryModal(): void {
    this.showSummaryModal = false;
    this.summaryText = '';
  }

  /**
   * Close warning modal
   */
  closeWarningModal(): void {
    this.showWarningModal = false;
    this.warningText = '';
  }

  

  onCreate() {
  const userOptions = users.map(u => u.name);

  const fields: FormField[] = [
    { label: 'Issue Type', type: 'select', model: 'issueType', options: ['Epic','Task','Story','Bug'], colSpan: 2, required : true },
    { label: 'Summary', type: 'text', model: 'summary', colSpan: 2,required : true  },
    { label: 'Description', type: 'textarea', model: 'description', colSpan: 2 },
    { label: 'Priority', type: 'select', model: 'priority', options: ['High','Medium','Low'], colSpan: 1 },
    { label: 'Assignee', type: 'select', model: 'assignee', options: userOptions, colSpan: 1 },
    { label: 'Start Date', type: 'date', model: 'startDate', colSpan: 1 },
    { label: 'Due Date', type: 'date', model: 'dueDate', colSpan: 1 },
    { label: 'Sprint', type: 'select', model: 'sprint', options: ['Sprint 1','Sprint 2','Sprint 3'], colSpan: 1 },
    { label: 'Story Point', type: 'number', model: 'storyPoint', colSpan: 1 },
    { label: 'Parent Epic', type: 'select', model: 'parentEpic', options: ['Epic 1','Epic 2','Epic 3'], colSpan: 1 },
    { label: 'Reporter', type: 'select', model: 'reporter', options: userOptions, colSpan: 1,required : true  }
  ];

  this.modalService.open({
    id: 'createIssue',          // matches your modal component's @Input modalId
    title: 'Create New Issue',   // modal header
    projectName: 'Project Beta',// optional project label
    modalDesc : 'Create a new issue in your project',
    fields,                     // dynamic fields
    data: { priority: 'Medium', labels: [] }, // optional pre-filled data
    showLabels: true,
    submitText: 'Create Issue'
  });
}

  // Notification modal state
  showNotificationModal = false;
  notifications: Array<{ title: string; message: string; time: string; unread?: boolean }> = [
    { title: 'Issue Assigned', message: 'You have been assigned to Issue #123', time: '2 min ago', unread: true },
    { title: 'Sprint Started', message: 'Sprint 5 has started', time: '1 hr ago', unread: true },
    { title: 'Comment Added', message: 'A comment was added to Issue #456', time: '5 hrs ago' },
    { title: 'System Update', message: 'The system will be updated tonight at 2 AM.', time: 'Today' },
    { title: 'New Member Joined', message: 'Alice has joined your project team.', time: '2 days ago' },
    { title: 'Deadline Reminder', message: 'Project deadline is approaching in 3 days.', time: '3 days ago' },
    { title: 'Comment Mention', message: 'You were mentioned in a comment on Issue #789.', time: 'Last week' },
    { title: 'Task Completed', message: 'Task "Design Review" was marked as completed.', time: 'Last week' }
  ];

  onNotificationClick() {
    this.showNotificationModal = true;
    // Unread notifications remain until modal is closed
  }

  closeNotificationModal() {
    this.showNotificationModal = false;
    // Mark unread notifications as read when modal is closed
    this.notifications = this.notifications.map((n, i) =>
      i < 2 ? { ...n, unread: false } : n
    );
  }

  onMenuClick(): void {
    console.log('Menu clicked');
    // Implement menu functionality
  }
}
