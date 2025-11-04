import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Issue, IssueType, IssuePriority, IssueStatus } from '../../../../shared/models/issue.model';
import { users, User } from '../../../../shared/data/dummy-backlog-data';

@Component({
  selector: 'app-work-items-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './work-items-table.html',
  styleUrl: './work-items-table.css'
})
export class WorkItemsTable {
  @Input() workItems: Issue[] = [];
  @Output() workItemsChanged = new EventEmitter<Issue[]>();

  availableUsers: User[] = users;
  priorities: IssuePriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  statuses: IssueStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED'];

  editingItems: { [key: string]: { [field: string]: boolean } } = {};
  tempValues: { [key: string]: any } = {};

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
      this.tempValues[itemId][field] = (item as any)[field];
    }
  }

  saveItem(itemId: string, field: string) {
    const item = this.workItems.find(i => i.id === itemId);
    if (item && this.tempValues[itemId]) {
      (item as any)[field] = this.tempValues[itemId][field];
      item.updatedAt = new Date();
    }
    if (this.editingItems[itemId]) {
      this.editingItems[itemId][field] = false;
    }
    this.workItemsChanged.emit(this.workItems);
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
    if (confirm('Are you sure you want to delete this work item?')) {
      this.workItems = this.workItems.filter(i => i.id !== itemId);
      this.workItemsChanged.emit(this.workItems);
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
