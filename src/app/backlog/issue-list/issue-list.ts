import { Component, Input, Output, EventEmitter, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { Issue } from '../../shared/models/issue.model';

@Component({
  selector: 'app-issue-list',
  imports: [CommonModule, DragDropModule],
  templateUrl: './issue-list.html',
  styleUrl: './issue-list.css'
})
export class IssueList {
  @Input() set issues(value: Issue[]) {
    this._issues.set(value);
  }
  
  @Input() isReadOnly: boolean = false;
  
  @Output() issueClick = new EventEmitter<Issue>();
  @Output() issueStatusChange = new EventEmitter<{ issue: Issue; newStatus: string }>();

  private _issues = signal<Issue[]>([]);
  protected issues$ = computed(() => this._issues());

  // Group issues by status for better organization
  protected issuesByStatus = computed(() => {
    const issues = this._issues();
    return {
      todo: issues.filter(i => i.status === 'TODO'),
      inProgress: issues.filter(i => i.status === 'IN_PROGRESS'),
      inReview: issues.filter(i => i.status === 'IN_REVIEW'),
      done: issues.filter(i => i.status === 'DONE')
    };
  });

  protected getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'STORY': 'fa-solid fa-book',
      'TASK': 'fa-solid fa-check-circle',
      'BUG': 'fa-solid fa-bug',
      'EPIC': 'fa-solid fa-bolt'
    };
    return icons[type] || 'fa-solid fa-file';
  }

  protected getPriorityClass(priority: string): string {
    const classes: Record<string, string> = {
      'LOW': 'bg-gray-100 text-gray-700',
      'MEDIUM': 'bg-blue-100 text-blue-700',
      'HIGH': 'bg-orange-100 text-orange-700',
      'CRITICAL': 'bg-red-100 text-red-700'
    };
    return classes[priority] || 'bg-gray-100 text-gray-700';
  }

  protected onIssueClick(issue: Issue): void {
    this.issueClick.emit(issue);
  }
}
