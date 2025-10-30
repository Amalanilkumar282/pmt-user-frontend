import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarStateService } from '../services/sidebar-state.service';
import { ModalService } from '../../modal/modal-service';
import { Searchbar } from '../searchbar/searchbar';
import { SummaryModal } from '../summary-modal/summary-modal';
import { Notification } from '../notification/notification';
import { ProfileButton } from '../profile-button/profile-button';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, Searchbar, SummaryModal, Notification, ProfileButton],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit {
  private sidebarStateService = inject(SidebarStateService);
  private modalService = inject(ModalService);
  private authService = inject(AuthService);

  // Summary modal state
  showSummaryModal: boolean = false;
  summaryText: string = '';

  // Warning modal state
  showWarningModal: boolean = false;
  warningText: string = '';

  // Notification state
  showNotificationModal: boolean = false;
  notificationCount: number = 3;
  notifications = [
    {
      title: 'New Issue Assigned',
      message: 'PMT-101 has been assigned to you',
      time: '5 mins ago',
      unread: true,
    },
    {
      title: 'Sprint Updated',
      message: 'Sprint 3 deadline extended',
      time: '2 hours ago',
      unread: true,
    },
    {
      title: 'Comment on PMT-089',
      message: 'John commented on your issue',
      time: '1 day ago',
      unread: false,
    },
  ];

  // Profile state
  showProfileModal: boolean = false;
  userName: string = 'Harrel Alex';
  userEmail: string = 'harrel.alex@example.com';

  ngOnInit(): void {
    // Get user info from auth service
    this.authService.currentUser.subscribe(user => {
      if (user) {
        this.userName = user.name;
        this.userEmail = user.email;
      }
    });
  }

  toggleSidebar(): void {
    this.sidebarStateService.toggleCollapse();
  }

  /**
   * Handle the create issue modal trigger from searchbar
   * Opens the modal with pre-filled data from Gemini
   */
  handleOpenCreateModal(fields: any): void {
    console.log('Header received openCreateModal event with fields:', fields);

    // Map the fields to the modal configuration
    const issueType = fields.issueType || 'Task';
    const summary = fields.summary || '';
    const description = fields.description || '';
    const priority = fields.priority || 'Medium';

    // Open the create issue modal with pre-filled data
    this.modalService.open({
      id: 'create-issue',
      title: 'Create Issue',
      projectName: 'Current Project',
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
          colSpan: 1,
        },
        {
          label: 'Summary',
          type: 'text',
          model: 'summary',
          required: true,
          colSpan: 2,
        },
        {
          label: 'Description',
          type: 'textarea',
          model: 'description',
          colSpan: 2,
        },
        {
          label: 'Priority',
          type: 'select',
          model: 'priority',
          options: ['High', 'Medium', 'Low'],
          required: true,
          colSpan: 1,
        },
        {
          label: 'Assignee',
          type: 'select',
          model: 'assignee',
          options: ['Unassigned', 'John Doe', 'Jane Smith', 'Bob Johnson'],
          colSpan: 1,
        },
        {
          label: 'Sprint',
          type: 'select',
          model: 'sprint',
          options: ['Backlog', 'Sprint 1', 'Sprint 2', 'Sprint 3'],
          colSpan: 1,
        },
        {
          label: 'Story Points',
          type: 'number',
          model: 'storyPoints',
          colSpan: 1,
        },
        {
          label: 'Due Date',
          type: 'date',
          model: 'dueDate',
          colSpan: 1,
        },
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
        attachments: [],
      },
    });
  }

  /**
   * Handle summary display from searchbar
   */
  handleShowSummary(summary: string): void {
    console.log('Header received showSummary event:', summary);
    this.summaryText = summary;
    this.showSummaryModal = true;
  }

  /**
   * Handle warning display from searchbar
   */
  handleShowWarning(warning: string): void {
    console.log('Header received showWarning event:', warning);
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

  /**
   * Toggle notification modal
   */
  toggleNotificationModal(): void {
    this.showNotificationModal = !this.showNotificationModal;
    this.showProfileModal = false; // Close profile if open
  }

  /**
   * Close notification modal
   */
  closeNotificationModal(): void {
    this.showNotificationModal = false;
  }

  /**
   * Toggle profile modal
   */
  toggleProfileModal(): void {
    this.showProfileModal = !this.showProfileModal;
    this.showNotificationModal = false; // Close notification if open
  }

  /**
   * Close profile modal
   */
  closeProfileModal(): void {
    this.showProfileModal = false;
  }
}
