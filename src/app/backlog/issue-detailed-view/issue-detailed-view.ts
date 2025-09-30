import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Issue } from '../../shared/models/issue.model';

@Component({
  selector: 'app-issue-detailed-view',
  imports: [CommonModule],
  templateUrl: './issue-detailed-view.html',
  styleUrl: './issue-detailed-view.css'
})
export class IssueDetailedView {
  @Input() set issue(value: Issue | null) {
    this._issue.set(value);
  }
  
  @Input() set isOpen(value: boolean) {
    this._isOpen.set(value);
  }
  
  @Output() close = new EventEmitter<void>();
  @Output() updateIssue = new EventEmitter<Partial<Issue>>();
  @Output() deleteIssue = new EventEmitter<string>();
  @Output() moveIssue = new EventEmitter<{ issueId: string, destinationSprintId: string | null }>();

  protected _issue = signal<Issue | null>(null);
  protected _isOpen = signal(false);
  protected showMoveDropdown = signal(false);

  // Available sprints for moving (will be passed as input)
  @Input() availableSprints: Array<{ id: string, name: string, status: string }> = [];

  protected getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'STORY': '📖',
      'TASK': '✓',
      'BUG': '🐛',
      'EPIC': '⚡'
    };
    return icons[type] || '📝';
  }

  protected getPriorityClass(priority: string): string {
    const classes: Record<string, string> = {
      'LOW': 'bg-gray-100 text-gray-700 border-gray-300',
      'MEDIUM': 'bg-blue-100 text-blue-700 border-blue-300',
      'HIGH': 'bg-orange-100 text-orange-700 border-orange-300',
      'CRITICAL': 'bg-red-100 text-red-700 border-red-300'
    };
    return classes[priority] || 'bg-gray-100 text-gray-700 border-gray-300';
  }

  protected getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'TODO': 'bg-gray-100 text-gray-700 border-gray-300',
      'IN_PROGRESS': 'bg-blue-100 text-blue-700 border-blue-300',
      'IN_REVIEW': 'bg-purple-100 text-purple-700 border-purple-300',
      'DONE': 'bg-green-100 text-green-700 border-green-300'
    };
    return classes[status] || 'bg-gray-100 text-gray-700 border-gray-300';
  }

  protected formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  protected onClose(): void {
    this.close.emit();
  }

  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  protected onDelete(): void {
    const issue = this._issue();
    if (issue && confirm(`Are you sure you want to delete issue ${issue.id}?`)) {
      this.deleteIssue.emit(issue.id);
      this.onClose();
    }
  }

  protected toggleMoveDropdown(): void {
    this.showMoveDropdown.set(!this.showMoveDropdown());
  }

  protected onMove(destinationSprintId: string | null, destinationName: string): void {
    const issue = this._issue();
    if (issue) {
      if (confirm(`Move issue ${issue.id} to ${destinationName}?`)) {
        this.moveIssue.emit({ 
          issueId: issue.id, 
          destinationSprintId 
        });
        this.showMoveDropdown.set(false);
        this.onClose();
      }
    }
  }

  protected closeMoveDropdown(event: MouseEvent): void {
    event.stopPropagation();
  }
}
