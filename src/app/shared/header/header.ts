import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarStateService } from '../services/sidebar-state.service';
import { ModalService } from '../../modal/modal-service';
import { Searchbar } from "../searchbar/searchbar";
import { SummaryModal } from '../summary-modal/summary-modal';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, Searchbar, SummaryModal],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  private sidebarStateService = inject(SidebarStateService);
  private modalService = inject(ModalService);

  // Summary modal state
  showSummaryModal: boolean = false;
  summaryText: string = '';

  // Warning modal state
  showWarningModal: boolean = false;
  warningText: string = '';

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
    const title = fields.title || '';
    const summary = fields.summary || '';
    const description = fields.description || '';
    const priority = fields.priority || 'Medium';
    const storyPoint = fields.storyPoint || '';

    const userOptions = ['Unassigned', 'John Doe', 'Jane Smith', 'Bob Johnson'];

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
        summary: title || summary,
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
      }
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
}
