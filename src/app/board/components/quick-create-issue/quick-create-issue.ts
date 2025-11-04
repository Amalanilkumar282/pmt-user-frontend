import { Component, EventEmitter, Input, Output, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IssueStatus, IssueType, IssuePriority } from '../../../shared/models/issue.model';
import { ClickOutsideDirective } from '../../../shared/directives/click-outside.directive';
import { UserApiService, User } from '../../../shared/services/user-api.service';
import { ProjectContextService } from '../../../shared/services/project-context.service';
import { ProjectMembersCacheService } from '../../../shared/services/project-members-cache.service';

export interface QuickCreateIssueData {
  title: string;
  status: IssueStatus;
  type: IssueType;
  priority: IssuePriority;
  assigneeId?: number;
  assigneeName?: string;
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
  
  private membersCacheService = inject(ProjectMembersCacheService);
  private projectContextService = inject(ProjectContextService);
  // Keep UserApiService for utility methods (getInitials, getAvatarColor)
  private userApiService = inject(UserApiService);
  
  isCreating = signal(false);
  issueTitle = signal('');
  issueType = signal<IssueType>('TASK');
  issuePriority = signal<IssuePriority>('MEDIUM');
  issueAssigneeId = signal<number | undefined>(undefined);
  issueAssigneeName = signal<string | undefined>(undefined);
  issueDueDate = signal<Date | undefined>(undefined);
  
  // Dropdown states
  showTypeDropdown = signal(false);
  showPriorityDropdown = signal(false);
  showAssigneeDropdown = signal(false);
  
  // Options
  issueTypes: IssueType[] = ['TASK', 'BUG', 'STORY', 'EPIC'];
  priorities: IssuePriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  projectMembers = signal<User[]>([]);
  
  constructor() {
    // Load project members when project context changes - using cache to prevent duplicate API calls
    effect(() => {
      const projectId = this.projectContextService.currentProjectId();
      if (projectId) {
        this.loadProjectMembers(projectId);
      }
    });
  }
  
  private loadProjectMembers(projectId: string): void {
    // Use cached service - multiple components will share the same HTTP request
    this.membersCacheService.getProjectMembers(projectId).subscribe({
      next: (members) => {
        this.projectMembers.set(members);
      },
      error: (error) => {
        console.error('[QuickCreateIssue] Error loading project members:', error);
        this.projectMembers.set([]);
      }
    });
  }
  
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
        assigneeId: this.issueAssigneeId(),
        assigneeName: this.issueAssigneeName(),
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
    this.issueAssigneeId.set(undefined);
    this.issueAssigneeName.set(undefined);
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
  
  selectAssignee(member: User | null): void {
    if (member) {
      this.issueAssigneeId.set(member.id);
      this.issueAssigneeName.set(member.name);
    } else {
      this.issueAssigneeId.set(undefined);
      this.issueAssigneeName.set(undefined);
    }
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
    if (!name) return '?';
    return this.userApiService.getInitials(name);
  }
  
  getAssigneeColor(userId?: number): string {
    if (!userId) return '#9CA3AF';
    return this.userApiService.getAvatarColor(userId);
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
