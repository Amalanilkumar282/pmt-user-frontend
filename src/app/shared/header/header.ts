import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarStateService } from '../services/sidebar-state.service';
import { ModalService } from '../../modal/modal-service';
import { Searchbar } from "../searchbar/searchbar";

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, Searchbar],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  private sidebarStateService = inject(SidebarStateService);
  private modalService = inject(ModalService);

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
          options: ['Unassigned', 'John Doe', 'Jane Smith', 'Bob Johnson'],
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
}
