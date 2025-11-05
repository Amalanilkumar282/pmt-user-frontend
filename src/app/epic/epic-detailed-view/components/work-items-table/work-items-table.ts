import { Component, Input, Output, EventEmitter, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Issue, IssueType, IssuePriority, IssueStatus } from '../../../../shared/models/issue.model';
import { InlineEditService } from '../../../../shared/services/inline-edit.service';
import { ProjectContextService } from '../../../../shared/services/project-context.service';

@Component({
  selector: 'app-work-items-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './work-items-table.html',
  styleUrl: './work-items-table.css'
})
export class WorkItemsTable implements OnInit {
  @Input() workItems: Issue[] = [];
  @Output() workItemsChanged = new EventEmitter<Issue[]>();

  private inlineEditService = inject(InlineEditService);
  private projectContextService = inject(ProjectContextService);

  // Dropdown options
  protected projectMembers = signal<Array<{ id: number; name: string }>>([]);
  protected projectStatuses = signal<Array<{ id: number; name: string }>>([]);
  priorities: IssuePriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  statuses: IssueStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED'];

  editingItems: { [key: string]: { [field: string]: boolean } } = {};
  tempValues: { [key: string]: any } = {};
  
  ngOnInit() {
    this.loadProjectData();
  }
  
  private loadProjectData() {
    const projectId = this.projectContextService.currentProjectId();
    if (!projectId) return;
    
    // Load project members
    this.inlineEditService.getProjectMembers(projectId).subscribe({
      next: (members) => this.projectMembers.set(members),
      error: (err) => console.error('Error loading project members:', err)
    });
    
    // Load project statuses
    this.inlineEditService.getProjectStatuses(projectId).subscribe({
      next: (statuses) => {
        this.projectStatuses.set(statuses);
        // Also update the statuses array for backward compatibility
        this.statuses = statuses.map(s => s.name) as IssueStatus[];
      },
      error: (err) => console.error('Error loading project statuses:', err)
    });
  }

  getProgressPercentage(): string {
    const completed = this.workItems.filter(item => item.status === 'DONE').length;
    const total = this.workItems.length;
    return total > 0 ? `${Math.round((completed / total) * 100)}%` : '0%';
  }

  startEditing(itemId: string, field: string) {
    if (!this.editingItems[itemId]) {
      this.editingItems[itemId] = {};
    }
    this.editingItems[itemId][field] = true;
    
    const item = this.workItems.find(i => i.id === itemId);
    if (item) {
      if (!this.tempValues[itemId]) {
        this.tempValues[itemId] = {};
      }
      // For assignee, store the name
      if (field === 'assignee') {
        this.tempValues[itemId][field] = item.assigneeName || item.assignee || 'Unassigned';
      } else {
        this.tempValues[itemId][field] = (item as any)[field];
      }
    }
  }

  saveItem(itemId: string, field: string) {
    const item = this.workItems.find(i => i.id === itemId);
    if (!item || !this.tempValues[itemId]) {
      this.cancelEdit(itemId, field);
      return;
    }
    
    const newValue = this.tempValues[itemId][field];
    
    // Call appropriate update method based on field
    switch(field) {
      case 'title':
        this.inlineEditService.updateIssueName(item, newValue).subscribe({
          next: (updated) => this.updateWorkItemInList(updated),
          error: () => this.cancelEdit(itemId, field)
        });
        break;
      case 'priority':
        this.inlineEditService.updateIssuePriority(item, newValue).subscribe({
          next: (updated) => this.updateWorkItemInList(updated),
          error: () => this.cancelEdit(itemId, field)
        });
        break;
      case 'assignee':
        this.inlineEditService.updateIssueAssignee(item, newValue).subscribe({
          next: (updated) => this.updateWorkItemInList(updated),
          error: () => this.cancelEdit(itemId, field)
        });
        break;
      case 'status':
        this.inlineEditService.updateIssueStatus(item, newValue).subscribe({
          next: (updated) => this.updateWorkItemInList(updated),
          error: () => this.cancelEdit(itemId, field)
        });
        break;
    }
    
    if (this.editingItems[itemId]) {
      this.editingItems[itemId][field] = false;
    }
  }
  
  private updateWorkItemInList(updatedItem: Issue): void {
    const index = this.workItems.findIndex(i => i.id === updatedItem.id);
    if (index !== -1) {
      this.workItems[index] = updatedItem;
      this.workItemsChanged.emit([...this.workItems]);
    }
  }

  cancelEdit(itemId: string, field: string) {
    if (this.editingItems[itemId]) {
      this.editingItems[itemId][field] = false;
    }
  }

  isEditing(itemId: string, field: string): boolean {
    return this.editingItems[itemId]?.[field] || false;
  }

  deleteItem(itemId: string) {
    const item = this.workItems.find(i => i.id === itemId);
    if (!item) return;
    
    if (confirm(`Are you sure you want to delete "${item.title}"?`)) {
      this.inlineEditService.deleteIssue(itemId).subscribe({
        next: (success) => {
          if (success) {
            this.workItems = this.workItems.filter(i => i.id !== itemId);
            this.workItemsChanged.emit([...this.workItems]);
          }
        }
      });
    }
  }

  getPriorityClass(priority: string): string {
    const map: { [key: string]: string } = {
      'LOW': 'priority-low',
      'MEDIUM': 'priority-medium',
      'HIGH': 'priority-high',
      'CRITICAL': 'priority-critical'
    };
    return map[priority] || '';
  }

  getStatusClass(status: string): string {
    const map: { [key: string]: string } = {
      'TODO': 'status-todo',
      'IN_PROGRESS': 'status-in-progress',
      'IN_REVIEW': 'status-in-review',
      'DONE': 'status-done',
      'BLOCKED': 'status-blocked'
    };
    return map[status] || '';
  }

  getStatusLabel(status: string): string {
    return status.replace('_', ' ');
  }

  getTypeIcon(type: IssueType): string {
    const iconMap: { [key: string]: string } = {
      'TASK': 'fa-solid fa-check-square',
      'STORY': 'fa-solid fa-book',
      'BUG': 'fa-solid fa-bug',
      'EPIC': 'fa-solid fa-bolt',
      'SUBTASK': 'fa-solid fa-circle-check'
    };
    return iconMap[type] || 'fa-solid fa-check-square';
  }
}
