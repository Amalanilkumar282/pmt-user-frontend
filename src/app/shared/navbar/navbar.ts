import { Component, Output, EventEmitter, inject, computed, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { users } from '../../shared/data/dummy-backlog-data';
import { ModalService, FormField } from '../../modal/modal-service';
import { SidebarStateService } from '../services/sidebar-state.service';
import { ProjectContextService } from '../services/project-context.service';
import { CreateIssue } from '../../modal/create-issue/create-issue';
import { Searchbar } from '../searchbar/searchbar';
import { ProfileButton } from '../profile-button/profile-button';
import { Notification } from '../notification/notification';
import { SummaryModal } from '../summary-modal/summary-modal';
import { IssueService, CreateIssueRequest } from '../services/issue.service';
import { ActivityService, ActivityLogDto } from '../services/activity.service';
import { filter } from 'rxjs';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterModule, Searchbar, SummaryModal, ProfileButton, Notification],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css'],
  standalone: true
})
export class Navbar implements OnInit {
  showProfileModal = false;

  onProfileClick() {
    this.showProfileModal = true;
  }

  closeProfileModal() {
    this.showProfileModal = false;
  }
  
  unreadCount: number = 0;
  
  @Output() toggleSidebar = new EventEmitter<void>();

  private modalService = inject(ModalService);
  private issueService = inject(IssueService);
  private activityService = inject(ActivityService);
  private sidebarState = inject(SidebarStateService);
  private projectContextService = inject(ProjectContextService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
 
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
  const title = fields.title || '';
  const description = fields.description || '';
  const priority = fields.priority || 'Medium';
  const storyPoint = fields.storyPoint || '';

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
          label: 'Title',
          type: 'text',
          model: 'title',
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
          options: ['Critical', 'High', 'Medium', 'Low'],
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
          label: 'Start Date',
          type: 'date',
          model: 'startDate',
          colSpan: 1
        },
        {
          label: 'Due Date',
          type: 'date',
          model: 'dueDate',
          colSpan: 1
        },
        {
          label: 'Sprint',
          type: 'select',
          model: 'sprint',
          options: ['Sprint 1', 'Sprint 2', 'Sprint 3'],
          colSpan: 1
        },
        {
          label: 'Story Point',
          type: 'number',
          model: 'storyPoint',
          colSpan: 1
        },
        {
          label: 'Parent Epic',
          type: 'select',
          model: 'parentEpic',
          options: ['Epic 1', 'Epic 2', 'Epic 3'],
          colSpan: 1
        },
        {
          label: 'Reporter',
          type: 'select',
          model: 'reporter',
          options: userOptions,
          required: true,
          colSpan: 1
        },
        {
          label: 'Attachments',
          type: 'file',
          model: 'attachments',
          colSpan: 2
        }
      ],
      data: {
        issueType: issueType,
        title: title,
        description: description,
        priority: priority,
        assignee: 'Unassigned',
        startDate: '',
        dueDate: '',
        sprint: 'Sprint 1',
        storyPoint: storyPoint,
        parentEpic: '',
        reporter: userOptions[0] || 'Unassigned',
        labels: [],
        attachments: []
      },
      onSubmit: (formData: any) => {
        // Convert dates to ISO string format (UTC) for PostgreSQL
        const formatDateToUTC = (dateStr: string) => {
          if (!dateStr) return undefined;
          const date = new Date(dateStr);
          return date.toISOString();
        };

        const issueReq: CreateIssueRequest = {
          projectId: '0aa4b61e-c0e4-40c9-81fa-35da8ad7b9d5',
          issueType: formData.issueType?.toUpperCase() || 'TASK',
          title: formData.title,
          description: formData.description || '',
          priority: formData.priority?.toUpperCase() || 'MEDIUM',
          assigneeId: 1, // TODO: Map assignee to actual ID
          startDate: formatDateToUTC(formData.startDate),
          dueDate: formatDateToUTC(formData.dueDate),
          sprintId: null, // TODO: Map sprint to actual ID
          storyPoints: Number(formData.storyPoints) || 0,
          epicId: null, // TODO: Map epic to actual ID
          reporterId: 1, // TODO: Map reporter to actual ID
          attachmentUrl: formData.uploadedFileUrl || null, // Use uploaded file URL
          labels: JSON.stringify(formData.labels || [])
        };

        // Close modal immediately for instant feedback
        this.modalService.close();

        console.log('Sending issue request:', issueReq);
        this.issueService.createIssue(issueReq).subscribe({
          next: (res) => {
            console.log('Issue created successfully:', res);
          },
          error: (err) => {
            console.error('Failed to create issue:', err);
            console.error('Validation errors:', err.error?.errors);
          }
        });
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
    { label: 'Title', type: 'text', model: 'title', colSpan: 2,required : true  },
    { label: 'Description', type: 'textarea', model: 'description', colSpan: 2 },
    { label: 'Priority', type: 'select', model: 'priority', options: ['Critical','High','Medium','Low'], colSpan: 1 },
    { label: 'Assignee', type: 'select', model: 'assignee', options: userOptions, colSpan: 1 },
    { label: 'Start Date', type: 'date', model: 'startDate', colSpan: 1 },
    { label: 'Due Date', type: 'date', model: 'dueDate', colSpan: 1 },
    { label: 'Sprint', type: 'select', model: 'sprint', options: ['Sprint 1','Sprint 2','Sprint 3'], colSpan: 1 },
    { label: 'Story Point', type: 'number', model: 'storyPoint', colSpan: 1 },
    { label: 'Parent Epic', type: 'select', model: 'parentEpic', options: ['Epic 1','Epic 2','Epic 3'], colSpan: 1 },
    { label: 'Reporter', type: 'select', model: 'reporter', options: userOptions, colSpan: 1, required : true  },
    { label: 'Attachments', type: 'file', model: 'attachments', colSpan: 2 }
  ];

    this.modalService.open({
      id: 'createIssue',
      title: 'Create New Issue',
      projectName: 'Project Beta',
      modalDesc : 'Create a new issue in your project',
      fields,
      data: { priority: 'Medium', labels: [] },
      showLabels: true,
      submitText: 'Create Issue',
      onSubmit: (formData: any) => {
        // Convert dates to ISO string format (UTC) for PostgreSQL
        const formatDateToUTC = (dateStr: string) => {
          if (!dateStr) return undefined;
          const date = new Date(dateStr);
          return date.toISOString();
        };

        const issueReq: CreateIssueRequest = {
          projectId: '0aa4b61e-c0e4-40c9-81fa-35da8ad7b9d5',
          issueType: formData.issueType?.toUpperCase() || 'TASK',
          title: formData.title,
          description: formData.description || '',
          priority: formData.priority?.toUpperCase() || 'MEDIUM',
          assigneeId: 1, // TODO: Map assignee to actual ID
          startDate: formatDateToUTC(formData.startDate),
          dueDate: formatDateToUTC(formData.dueDate),
          sprintId: null, // TODO: Map sprint to actual ID
          storyPoints: Number(formData.storyPoint) || 0,
          epicId: null, // TODO: Map epic to actual ID
          reporterId: 1, // TODO: Map reporter to actual ID
          attachmentUrl: formData.uploadedFileUrl || null, // Use uploaded file URL
          labels: JSON.stringify(formData.labels || [])
        };

        // Close modal immediately for instant feedback
        this.modalService.close();

        console.log('Sending issue request:', issueReq);
        this.issueService.createIssue(issueReq).subscribe({
          next: (res) => {
            console.log('Issue created successfully:', res);
          },
          error: (err) => {
            console.error('Failed to create issue:', err);
            console.error('Validation errors:', err.error?.errors);
          }
        });
      }
    });
  }

  // Notification modal state
  showNotificationModal = false;
  notifications: Array<{ title: string; message: string; time: string; unread?: boolean }> = [];

  ngOnInit() {
    this.loadUserActivities();
  }

  /**
   * Load user activities and convert them to notifications
   */
  loadUserActivities(): void {
    // Get user ID from sessionStorage or your auth service
    const userId = this.getUserIdFromSession();
    
    console.log('Loading user activities for userId:', userId);
    
    if (!userId) {
      console.warn('No user ID found in session');
      return;
    }

    this.activityService.getUserActivities(userId, 20).subscribe({
      next: (response) => {
        console.log('Activities API response:', response);
        if (response.status === 200 && response.data) {
          // The data is an array directly, not nested in activities property
          const activities = Array.isArray(response.data) ? response.data : [];
          console.log('Activities found:', activities.length);
          this.notifications = this.transformActivitiesToNotifications(activities);
          console.log('Transformed notifications:', this.notifications);
          // Update unread count
          this.updateUnreadCount();
        } else {
          console.log('No activities in response or status not 200');
        }
      },
      error: (error) => {
        console.error('Failed to load activities:', error);
      }
    });
  }

  /**
   * Transform activity logs into notification format
   */
  private transformActivitiesToNotifications(activities: ActivityLogDto[]): Array<{ title: string; message: string; time: string; unread?: boolean }> {
    return activities.map(activity => ({
      title: this.getActivityTitle(activity),
      message: activity.description || this.getDefaultMessage(activity),
      time: this.formatTime(activity.createdAt),
      unread: this.isRecent(activity.createdAt) // Mark as unread if within last 24 hours
    }));
  }

  /**
   * Generate a title based on activity action and entity type
   */
  private getActivityTitle(activity: ActivityLogDto): string {
    const actionMap: { [key: string]: string } = {
      'CREATED': 'Created',
      'UPDATED': 'Updated',
      'DELETED': 'Deleted',
      'ASSIGNED': 'Assigned',
      'COMMENTED': 'Commented on',
      'COMPLETED': 'Completed'
    };

    const action = actionMap[activity.action] || activity.action;
    const entityType = activity.entityType || 'Item';

    return `${action} ${entityType}`;
  }

  /**
   * Generate default message if description is missing
   */
  private getDefaultMessage(activity: ActivityLogDto): string {
    return `You ${activity.action.toLowerCase()} a ${activity.entityType.toLowerCase()}`;
  }

  /**
   * Format timestamp to relative time
   */
  private formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  }

  /**
   * Check if activity is within last 24 hours (mark as unread)
   */
  private isRecent(timestamp: string): boolean {
    const activityDate = new Date(timestamp);
    const lastReadTime = this.getLastReadTime();
    
    // If we have a last read time, compare activity with it
    if (lastReadTime) {
      return activityDate.getTime() > lastReadTime.getTime();
    }
    
    // Fallback: mark as unread if within last 24 hours
    const now = new Date();
    const diffHours = (now.getTime() - activityDate.getTime()) / 3600000;
    return diffHours < 24;
  }

  /**
   * Get the last time notifications were marked as read
   */
  private getLastReadTime(): Date | null {
    const userId = this.getUserIdFromSession();
    if (!userId) return null;
    
    const lastReadStr = localStorage.getItem(`notifications_last_read_${userId}`);
    if (lastReadStr) {
      return new Date(lastReadStr);
    }
    return null;
  }

  /**
   * Save the current time as last read time
   */
  private saveLastReadTime(): void {
    const userId = this.getUserIdFromSession();
    if (!userId) return;
    
    const now = new Date().toISOString();
    localStorage.setItem(`notifications_last_read_${userId}`, now);
    console.log('Saved last read time:', now);
  }

  /**
   * Get user ID from session storage
   */
  private getUserIdFromSession(): number | null {
    // Try to get from sessionStorage - adjust key name based on your auth implementation
    const userIdStr = sessionStorage.getItem('userId');
    console.log('Checking userId from sessionStorage:', userIdStr);
    if (userIdStr) {
      return parseInt(userIdStr, 10);
    }

    // Alternative: parse from JWT token
    const token = sessionStorage.getItem('accessToken');
    console.log('Checking JWT token:', token ? 'Token exists' : 'No token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('JWT payload:', payload);
        const userId = parseInt(payload.sub || payload.userId || payload.id, 10);
        console.log('Extracted userId from JWT:', userId);
        return userId;
      } catch (e) {
        console.error('Failed to parse user ID from token:', e);
      }
    }

    return null;
  }

  onNotificationClick() {
    this.showNotificationModal = true;
    this.loadUserActivities(); // Refresh activities when notification bell is clicked
  }

  closeNotificationModal() {
    this.showNotificationModal = false;
    // Save the current time as last read
    this.saveLastReadTime();
    // Mark all notifications as read when modal is closed
    this.notifications = [...this.notifications.map(n => ({ ...n, unread: false }))];
    this.updateUnreadCount();
    console.log('Notifications marked as read. Unread count:', this.unreadCount);
  }

  /**
   * Update the unread count based on current notifications
   */
  private updateUnreadCount(): void {
    this.unreadCount = this.notifications.filter(n => n.unread).length;
    this.cdr.detectChanges(); // Force change detection
  }

  onMenuClick(): void {
    console.log('Menu clicked');
    // Implement menu functionality
  }
}