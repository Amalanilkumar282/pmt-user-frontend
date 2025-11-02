import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IssueStatus, IssueType, IssuePriority } from '../../../shared/models/issue.model';
import { ClickOutsideDirective } from '../../../shared/directives/click-outside.directive';

export interface QuickCreateIssueData {
  title: string;
  status: IssueStatus;
  type: IssueType;
  priority: IssuePriority;
  assignee?: string;
  dueDate?: Date;
}

@Component({
  selector: 'app-quick-create-issue',
  standalone: true,
  imports: [CommonModule, FormsModule, ClickOutsideDirective],
  templateUrl: './quick-create-issue.html',
  styleUrls: ['./quick-create-issue.css']
})
export class QuickCreateIssue {
  @Input() status!: IssueStatus;
  @Output() issueCreated = new EventEmitter<QuickCreateIssueData>();
  
  isCreating = signal(false);
  issueTitle = signal('');
  issueType = signal<IssueType>('TASK');
  issuePriority = signal<IssuePriority>('MEDIUM');
  issueAssignee = signal<string | undefined>(undefined);
  issueDueDate = signal<Date | undefined>(undefined);
  
  // Dropdown states
  showTypeDropdown = signal(false);
  showPriorityDropdown = signal(false);
  showAssigneeDropdown = signal(false);
  
  // Options
  issueTypes: IssueType[] = ['TASK', 'BUG', 'STORY', 'EPIC'];
  priorities: IssuePriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  assignees = ['Amal A', 'Kiran Paulson', 'Kavya S', 'Harrel Alex', 'Sharath Shony', 'Unassigned'];
  
  startCreating(): void {
    this.isCreating.set(true);
  }
  
  cancel(): void {
    this.resetForm();
  }
  
  create(): void {
    const title = this.issueTitle().trim();
    if (title) {
      this.issueCreated.emit({
        title,
        status: this.status,
        type: this.issueType(),
        priority: this.issuePriority(),
        assignee: this.issueAssignee(),
        dueDate: this.issueDueDate()
      });
      this.resetForm();
    }
  }
  
  resetForm(): void {
    this.isCreating.set(false);
    this.issueTitle.set('');
    this.issueType.set('TASK');
    this.issuePriority.set('MEDIUM');
    this.issueAssignee.set(undefined);
    this.issueDueDate.set(undefined);
    this.showTypeDropdown.set(false);
    this.showPriorityDropdown.set(false);
    this.showAssigneeDropdown.set(false);
  }
  
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.create();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancel();
    }
  }
  
  selectType(type: IssueType): void {
    this.issueType.set(type);
    this.showTypeDropdown.set(false);
  }
  
  selectPriority(priority: IssuePriority): void {
    this.issuePriority.set(priority);
    this.showPriorityDropdown.set(false);
  }
  
  selectAssignee(assignee: string): void {
    this.issueAssignee.set(assignee === 'Unassigned' ? undefined : assignee);
    this.showAssigneeDropdown.set(false);
  }
  
  getTypeIcon(type: IssueType): string {
    const icons: Record<IssueType, string> = {
      STORY: 'fa-solid fa-book',
      TASK: 'fa-solid fa-check-circle',
      BUG: 'fa-solid fa-bug',
      EPIC: 'fa-solid fa-bolt',
      SUBTASK: 'fa-solid fa-list-check'
    };
    return icons[type] || 'fa-solid fa-file';
  }
  
  getPriorityColor(priority: IssuePriority): string {
    const colors: Record<IssuePriority, string> = {
      LOW: 'text-green-600',
      MEDIUM: 'text-yellow-600',
      HIGH: 'text-orange-600',
      CRITICAL: 'text-red-600'
    };
    return colors[priority] || 'text-gray-600';
  }
  
  getAssigneeInitials(name?: string): string {
    if (!name || name === 'Unassigned') return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }
  
  closeAllDropdowns(): void {
    this.showTypeDropdown.set(false);
    this.showPriorityDropdown.set(false);
    this.showAssigneeDropdown.set(false);
  }

  toggleTypeDropdown(): void {
    const wasOpen = this.showTypeDropdown();
    this.closeAllDropdowns();
    this.showTypeDropdown.set(!wasOpen);
  }

  togglePriorityDropdown(): void {
    const wasOpen = this.showPriorityDropdown();
    this.closeAllDropdowns();
    this.showPriorityDropdown.set(!wasOpen);
  }

  toggleAssigneeDropdown(): void {
    const wasOpen = this.showAssigneeDropdown();
    this.closeAllDropdowns();
    this.showAssigneeDropdown.set(!wasOpen);
  }
}
